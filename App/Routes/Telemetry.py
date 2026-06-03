from fastapi import APIRouter, HTTPException
from App.Database.Connection import get_db_connection
from psycopg2.extras import RealDictCursor
from App.Routes.Audit import mock_logs # Importamos los logs simulados para que la telemetría tenga datos

router = APIRouter(prefix="/api/telemetry", tags=["Telemetría y Analítica (Fase 5)"])

@router.get("/stats")
def get_telemetry_stats():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")
        
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Obtener proporciones de estado de auditoría (Exitosos vs Fallidos) de la BD (tx_log)
        # Manejamos el caso donde tx_log pueda estar vacía devolviendo 0 si no hay resultados
        cursor.execute("""
            SELECT 
                COALESCE(
                    SUM(CASE WHEN operacion = 'ERROR' THEN 1 ELSE 0 END), 0
                ) as fallidos,
                COALESCE(
                    SUM(CASE WHEN operacion != 'ERROR' THEN 1 ELSE 0 END), 0
                ) as exitosos
            FROM tx_log
        """)
        tx_stats = cursor.fetchone()
        
        exitosos_tx = tx_stats['exitosos'] if tx_stats else 0
        fallidos_tx = tx_stats['fallidos'] if tx_stats else 0
        
        # Sumamos los logs simulados de auditoría
        exitosos_audit = sum(1 for log in mock_logs if log['estado'] == 'Completado')
        fallidos_audit = sum(1 for log in mock_logs if log['estado'] == 'Error')

        exitosos = exitosos_tx + exitosos_audit
        fallidos = fallidos_tx + fallidos_audit
        otros = 0

        # 2. Obtener motores y cantidad de operaciones combinadas
        cursor.execute("""
            SELECT c.engine as motor_afectado, COUNT(*) as cantidad
            FROM tx_log t
            JOIN CONNECTIONS c ON t.db_id = c.id
            GROUP BY c.engine
        """)
        motor_tx_stats = cursor.fetchall()
        
        # Diccionario para combinar conteos de BD y simulados
        motores_combinados = {}
        for row in motor_tx_stats:
            motores_combinados[row['motor_afectado']] = row['cantidad']

        for log in mock_logs:
            # Simplificar el nombre del motor para que coincida con "PostgreSQL" o "SQL Server"
            motor = "PostgreSQL" if "postgres" in log['motor_afectado'] else "SQL Server"
            motores_combinados[motor] = motores_combinados.get(motor, 0) + 1

        motores_labels = list(motores_combinados.keys())
        motores_data = list(motores_combinados.values())

        return {
            "status": "success",
            "pie_data": {
                "exitosos": exitosos,
                "fallidos": fallidos,
                "otros": otros
            },
            "bar_data": {
                "labels": motores_labels,
                "data": motores_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error procesando telemetría: {str(e)}")
    finally:
        cursor.close()
        conn.close()