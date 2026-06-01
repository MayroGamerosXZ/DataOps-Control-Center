from App.services.Stress_tester import run_stress_test
from fastapi import APIRouter, HTTPException
from App.Models.Schemas import QueryAnalyzeRequest
from App.Database.Connection import get_db_connection
from App.services.Query_analyzer import analyze_and_log_query
from psycopg2.extras import RealDictCursor


router = APIRouter(prefix="/api/queries", tags=["Análisis de Consultas (Módulo 3)"])

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
def trigger_stress_test(db_id: int):
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

        return result

    finally:
        cursor.close()
        conn.close()