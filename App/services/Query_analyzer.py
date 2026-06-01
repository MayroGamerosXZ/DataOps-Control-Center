import time
import psycopg2
from psycopg2.extras import RealDictCursor
from App.Database.Connection import get_db_connection
from App.Security import decrypt_password

def get_query_classification(duration_ms):
    """Clasifica la consulta según los umbrales estrictos del documento."""
    if duration_ms < 100:
        return "Fast"
    elif 100 <= duration_ms <= 500:
        return "Medium"
    elif 500 < duration_ms <= 2000:
        return "Slow"
    else:
        return "Critical"

def analyze_and_log_query(db_config, query_text):
    """Ejecuta una consulta, mide su tiempo, obtiene el plan de ejecución y lo guarda en QUERY_LOG."""
    control_conn = get_db_connection()
    if not control_conn:
        return {"status": "error", "message": "No hay conexión a la BD de control"}

    try:
        # 1. Conectarse al motor a evaluar
        target_conn = psycopg2.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user_name'],
            password=decrypt_password(db_config['encrypted_password']),
            dbname=db_config['database_name']
        )
        target_cursor = target_conn.cursor(cursor_factory=RealDictCursor)

        # 2. Obtener el plan de ejecución (EXPLAIN) de forma segura
        target_cursor.execute(f"EXPLAIN {query_text}")
        explain_result = target_cursor.fetchall()
        # Extraemos el primer valor del diccionario sin importar cómo Postgres llame a la columna
        execution_plan = "\n".join([list(row.values())[0] for row in explain_result])

        # 3. Medir el tiempo real de ejecución
        start_time = time.time()
        target_cursor.execute(query_text)
        rows_returned = target_cursor.rowcount
        target_conn.commit()
        end_time = time.time()

        duration_ms = (end_time - start_time) * 1000
        classification = get_query_classification(duration_ms)

        target_cursor.close()
        target_conn.close()

        # 4. Guardar en QUERY_LOG
        control_cursor = control_conn.cursor()
        insert_query = """
                       INSERT INTO QUERY_LOG (db_id, query_text, duration_ms, rows_returned, execution_plan)
                       VALUES (%s, %s, %s, %s, %s) RETURNING id; \
                       """
        control_cursor.execute(insert_query, (db_config['id'], query_text, duration_ms, rows_returned, execution_plan))

        # CORRECCIÓN: Pedimos ['id'] explícitamente en lugar del índice [0]
        new_log_id = control_cursor.fetchone()['id']

        control_conn.commit()

        return {
            "status": "success",
            "classification": classification,
            "duration_ms": round(duration_ms, 2),
            "log_id": new_log_id
        }

    except Exception as e:
        control_conn.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        if 'control_cursor' in locals():
            control_cursor.close()
        control_conn.close()