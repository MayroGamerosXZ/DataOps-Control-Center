import psycopg2
from psycopg2.extras import RealDictCursor
from App.Database.Connection import get_db_connection
from App.Security import decrypt_password
import random # Usado temporalmente para simular CPU y Memoria si el motor no lo expone
from datetime import datetime

def check_postgres_metrics(db_config):
    """Se conecta a un motor PostgreSQL y extrae sus métricas reales."""
    try:
        conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user_name'],
            password=decrypt_password(db_config['encrypted_password']),
            dbname=db_config['database_name']
        )
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Contar conexiones activas reales
        cursor.execute("SELECT count(*) as active_connections FROM pg_stat_activity;")
        connections = cursor.fetchone()['active_connections']

        # 2. Contar bloqueos reales
        cursor.execute("SELECT count(*) as active_locks FROM pg_locks WHERE granted = true;")
        locks = cursor.fetchone()['active_locks']

        cursor.close()
        conn.close()

        # Simulamos CPU, Memoria y Disco (En un entorno real se usaría Prometheus Node Exporter)
        cpu = round(random.uniform(10.0, 80.0), 2)
        memory = round(random.uniform(20.0, 75.0), 2)
        disk = round(random.uniform(100.0, 500.0), 2)

        return cpu, memory, connections, locks, 0, disk # 0 deadlocks por ahora
    except Exception as e:
        print(f"Error conectando al motor ID {db_config['id']}: {e}")
        return None

def run_health_check():
    """Esta función será llamada cada minuto por el planificador."""
    print(f"[{datetime.now()}] Iniciando Health Check Automático...")

    conn = get_db_connection()
    if not conn:
        return

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Buscar todos los motores activos
        cursor.execute("SELECT * FROM CONNECTIONS WHERE status = 'ACTIVE';")
        motores = cursor.fetchall()

        for motor in motores:
            metrics = None
            if motor['motor'] == 'PostgreSQL':
                metrics = check_postgres_metrics(motor)
            # Más adelante agregaremos el 'elif' para SQL Server

            if metrics:
                cpu, memory, connections, locks, deadlocks, disk = metrics

                # Guardar en DB_METRICS
                insert_query = """
                               INSERT INTO DB_METRICS (db_id, cpu, memory, connections, locks, deadlocks, disk_usage)
                               VALUES (%s, %s, %s, %s, %s, %s, %s); \
                               """
                cursor.execute(insert_query, (motor['id'], cpu, memory, connections, locks, deadlocks, disk))

        conn.commit()
        print(f"[{datetime.now()}] Health Check finalizado. Métricas guardadas de {len(motores)} motores.")
    except Exception as e:
        conn.rollback()
        print(f"Error en Health Check: {e}")
    finally:
        cursor.close()
        conn.close()