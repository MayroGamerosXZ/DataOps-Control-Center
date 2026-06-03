import psycopg2
from App.services.Stress_tester import run_stress_test
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from App.Models.Schemas import QueryAnalyzeRequest
from App.Database.Connection import get_db_connection
from App.services.Query_analyzer import analyze_and_log_query
from psycopg2.extras import RealDictCursor
from App.services.Mail_service import enviar_correo_alerta
from App.Security import decrypt_password

router = APIRouter(prefix="/api/queries", tags=["Análisis de Consultas (Módulo 3)"])

class QueryExecuteRequest(BaseModel):
    db_id: int
    query_text: str

@router.post("/execute")
def execute_query(request: QueryExecuteRequest):
    """Ejecuta una consulta SQL en un motor específico y devuelve los resultados."""
    control_conn = get_db_connection()
    if not control_conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")

    try:
        control_cursor = control_conn.cursor(cursor_factory=RealDictCursor)
        # Buscar el motor que el usuario quiere evaluar
        control_cursor.execute("SELECT * FROM CONNECTIONS WHERE id = %s AND status = 'ACTIVE'", (request.db_id,))
        db_config = control_cursor.fetchone()

        if not db_config:
            raise HTTPException(status_code=404, detail="Motor no encontrado o inactivo")

    finally:
        control_cursor.close()
        control_conn.close()

    # Ahora nos conectamos al motor real para ejecutar la consulta
    target_conn = None
    try:
        if db_config['motor'] == 'PostgreSQL':
            target_conn = psycopg2.connect(
                host=db_config['host'],
                port=db_config['port'],
                dbname=db_config['database_name'],
                user=db_config['user_name'],
                password=decrypt_password(db_config['encrypted_password'])
            )
            target_cursor = target_conn.cursor(cursor_factory=RealDictCursor)
            target_cursor.execute(request.query_text)

            # Si es un SELECT, obtenemos los resultados
            if request.query_text.strip().upper().startswith("SELECT"):
                results = target_cursor.fetchall()
                # Limitar los resultados a 100 por seguridad y rendimiento en frontend
                return {"status": "success", "data": results[:100], "message": f"Consulta ejecutada. Mostrando {len(results[:100])} resultados."}
            else:
                target_conn.commit()
                return {"status": "success", "message": f"Consulta ejecutada correctamente. Filas afectadas: {target_cursor.rowcount}"}
        else:
            raise HTTPException(status_code=400, detail=f"Ejecución de consultas no implementada aún para el motor {db_config['motor']}")

    except Exception as e:
        if target_conn:
            target_conn.rollback()
        raise HTTPException(status_code=400, detail=f"Error ejecutando la consulta: {str(e)}")
    finally:
        if target_conn:
            target_cursor.close()
            target_conn.close()


@router.post("/analyze")
def analyze_query(request: QueryAnalyzeRequest):
    """Analiza una consulta, mide su rendimiento y guarda el plan de ejecución."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Buscar el motor que el usuario quiere evaluar
        cursor.execute("SELECT * FROM CONNECTIONS WHERE id = %s AND status = 'ACTIVE'", (request.db_id,))
        db_config = cursor.fetchone()

        if not db_config:
            raise HTTPException(status_code=404, detail="Motor no encontrado o inactivo")

        # Ejecutar el analizador
        result = analyze_and_log_query(db_config, request.query_text)

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        return result

    finally:
        cursor.close()
        conn.close()

@router.post("/stress-test/{db_id}")
def trigger_stress_test(db_id: int, background_tasks: BackgroundTasks):
    """Dispara un ataque de 100 usuarios concurrentes (Módulo 4)."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM CONNECTIONS WHERE id = %s AND status = 'ACTIVE'", (db_id,))
        db_config = cursor.fetchone()

        if not db_config:
            raise HTTPException(status_code=404, detail="Motor no encontrado o inactivo")

        # Ejecutar la prueba de estrés
        result = run_stress_test(db_config, num_users=100)

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        background_tasks.add_task(enviar_correo_alerta, "MÓDULO 4: Prueba de Estrés (Concurrencia)", f"Prueba de estrés REAL completada en el motor {db_id}. Se simularon 100 usuarios concurrentes.")

        return result
    finally:
        cursor.close()
        conn.close()
