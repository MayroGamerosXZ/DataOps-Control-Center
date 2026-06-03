import threading
import time
import random
import psycopg2
from datetime import datetime
from App.Database.Connection import get_db_connection
from App.Security import decrypt_password

# Operaciones mixtas requeridas por el documento
OPERATIONS = ['INSERT', 'UPDATE', 'DELETE', 'SELECT']

def worker_thread(session_id, db_config):
    """Simula un usuario ejecutando carga sostenida por 15 segundos para grafana."""
    control_conn = get_db_connection()
    target_conn = None

    try:
        # Conexión al motor "paciente"
        target_conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user_name'],
            password=decrypt_password(db_config['encrypted_password']),
            dbname=db_config['database_name']
        )
        target_cursor = target_conn.cursor()

        inicio = datetime.now()
        start_time = time.time()
        
        # Bucle de carga sostenida por 15 segundos
        end_time = time.time() + 15
        operacion = 'MIXTA'
        
        while time.time() < end_time:
            # 1. Operación pesada de CPU (Cross Join en memoria)
            target_cursor.execute("SELECT count(*) FROM generate_series(1, 1000) a, generate_series(1, 100) b")
            
            # 2. Operaciones DML normales
            target_cursor.execute("INSERT INTO stress_table (val) VALUES (%s)", (random.randint(1, 1000),))
            target_cursor.execute("UPDATE stress_table SET val = %s WHERE id = (SELECT id FROM stress_table ORDER BY RANDOM() LIMIT 1)", (random.randint(1, 1000),))
            target_conn.commit()

        fin = datetime.now()
        wait_time = (time.time() - start_time) * 1000
        lock_type = 'EXCLUSIVE'

        # Registrar en la BD de Control (TX_LOG) una sola vez por sesión
        control_cursor = control_conn.cursor()
        control_cursor.execute("""
                               INSERT INTO TX_LOG (db_id, session_id, operacion, inicio, fin, wait_time, lock_type)
                               VALUES (%s, %s, %s, %s, %s, %s, %s)
                               """, (db_config['id'], session_id, operacion, inicio, fin, wait_time, lock_type))
        control_conn.commit()

    except Exception as e:
        # Si hay un error (como un deadlock o timeout), lo registramos también
        if control_conn:
            fin = datetime.now()
            control_cursor = control_conn.cursor()
            control_cursor.execute("""
                                   INSERT INTO TX_LOG (db_id, session_id, operacion, inicio, fin, wait_time, lock_type)
                                   VALUES (%s, %s, %s, %s, %s, %s, 'TIMEOUT')
                                   """, (db_config['id'], session_id, 'ERROR', inicio, fin, 0))
            control_conn.commit()
    finally:
        if target_conn:
            target_conn.close()
        if control_conn:
            control_conn.close()

def run_stress_test(db_config, num_users=20):
    """Prepara el entorno y lanza los hilos concurrentes."""
    try:
        # Preparar tabla dummy para el ataque
        conn = psycopg2.connect(
            host=db_config['host'], port=db_config['port'],
            user=db_config['user_name'], password=decrypt_password(db_config['encrypted_password']),
            dbname=db_config['database_name']
        )
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS stress_table (id SERIAL PRIMARY KEY, val INT);")
        # Insertar datos base para que el SELECT y UPDATE tengan con qué trabajar
        cursor.execute("INSERT INTO stress_table (val) SELECT generate_series(1, 100);")
        conn.commit()
        cursor.close()
        conn.close()

        # Lanzar el ataque de 100 usuarios concurrentes
        threads = []
        for i in range(num_users):
            session_id = f"USER_SESSION_{i+1}"
            t = threading.Thread(target=worker_thread, args=(session_id, db_config))
            threads.append(t)
            t.start()

        # Esperar a que todos terminen
        for t in threads:
            t.join()

        return {"status": "success", "message": f"Prueba de estrés completada con {num_users} usuarios concurrentes."}
    except Exception as e:
        return {"status": "error", "message": str(e)}