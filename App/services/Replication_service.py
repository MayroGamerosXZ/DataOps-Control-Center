import time
import psycopg2
from App.Database.Connection import get_db_connection
from App.Security import decrypt_password

# Credenciales de nuestro nodo esclavo (definidas en el docker-compose)
REPLICA_CONFIG = {
    'host': 'localhost',
    'port': 5434,
    'user_name': 'MayroGameros',
    'password': 'admin123',
    'database_name': 'replica_db'
}

def sync_to_replica(source_db_config, table_name="stress_table"):
    """Sincroniza una tabla del motor principal al nodo esclavo y registra el evento."""
    control_conn = get_db_connection()
    if not control_conn:
        return {"status": "error", "message": "No hay conexión a la BD de control"}

    source_conn = None
    replica_conn = None

    try:
        # 1. Conectar al motor principal (origen)
        source_conn = psycopg2.connect(
            host=source_db_config['host'],
            port=source_db_config['port'],
            user=source_db_config['user_name'],
            password=decrypt_password(source_db_config['encrypted_password']),
            dbname=source_db_config['database_name']
        )
        source_cursor = source_conn.cursor()

        # Extraer datos de la tabla origen
        source_cursor.execute(f"SELECT * FROM {table_name}")
        records = source_cursor.fetchall()
        rows_copied = len(records)

        # 2. Conectar al motor esclavo (destino)
        replica_conn = psycopg2.connect(
            host=REPLICA_CONFIG['host'],
            port=REPLICA_CONFIG['port'],
            user=REPLICA_CONFIG['user_name'],
            password=REPLICA_CONFIG['password'],
            dbname=REPLICA_CONFIG['database_name']
        )
        replica_cursor = replica_conn.cursor()

        start_time = time.time()

        # Preparar tabla en el destino si no existe y limpiarla para la sincronización total
        replica_cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {table_name} (
                id INT PRIMARY KEY,
                val INT
            );
            TRUNCATE TABLE {table_name}; 
        """)

        # Insertar los registros replicados
        if rows_copied > 0:
            insert_query = f"INSERT INTO {table_name} (id, val) VALUES (%s, %s)"
            replica_cursor.executemany(insert_query, records)

        replica_conn.commit()
        duration_ms = (time.time() - start_time) * 1000

        # 3. Registrar el éxito en la base de control
        control_cursor = control_conn.cursor()
        control_cursor.execute("""
                               INSERT INTO REPLICATION_LOG (source_db_id, target_node, table_synced, rows_copied, duration_ms, status)
                               VALUES (%s, %s, %s, %s, %s, 'SUCCESS') RETURNING id;
                               """, (source_db_config['id'], f"{REPLICA_CONFIG['host']}:{REPLICA_CONFIG['port']}", table_name, rows_copied, duration_ms))

        # CORRECCIÓN: Usamos ['id'] en lugar de [0]
        log_id = control_cursor.fetchone()['id']
        control_conn.commit()

        return {
            "status": "success",
            "message": f"Replicación completada: {rows_copied} filas sincronizadas al nodo esclavo.",
            "duration_ms": round(duration_ms, 2),
            "log_id": log_id
        }

    except Exception as e:
        if control_conn:
            control_cursor = control_conn.cursor()
            control_cursor.execute("""
                                   INSERT INTO REPLICATION_LOG (source_db_id, target_node, table_synced, status)
                                   VALUES (%s, %s, %s, 'FAILED')
                                   """, (source_db_config['id'], f"{REPLICA_CONFIG['host']}:{REPLICA_CONFIG['port']}", table_name))
            control_conn.commit()
        return {"status": "error", "message": str(e)}

    finally:
        if source_conn: source_conn.close()
        if replica_conn: replica_conn.close()
        if control_conn: control_conn.close()