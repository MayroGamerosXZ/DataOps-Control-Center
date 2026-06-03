from fastapi import APIRouter, HTTPException
from App.Database.Connection import get_db_connection
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/api/telemetry", tags=["Telemetría y Analítica (Fase 5)"])

@router.get("/stats")
def get_telemetry_stats():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")
        
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Obtener proporciones de estado de auditoría (Exitosos vs Fallidos)
        cursor.execute("""
            SELECT estado, SUM(cantidad) as cantidad
            FROM (
                SELECT estado, COUNT(*) as cantidad 
                FROM AUDIT_LOGS 
                GROUP BY estado
                
                UNION ALL
                
                SELECT 
                    CASE 
                        WHEN operacion = 'ERROR' THEN 'Error' 
                        ELSE 'Completado' 
                    END as estado,
                    COUNT(*) as cantidad
                FROM tx_log
                GROUP BY 
                    CASE 
                        WHEN operacion = 'ERROR' THEN 'Error' 
                        ELSE 'Completado' 
                    END
            ) as combined_estados
            GROUP BY estado
        """)
        audit_stats = cursor.fetchall()
        
        # Formatear para el pie chart (Exitosos, Errores, Otros)
        exitosos = sum(row['cantidad'] for row in audit_stats if row['estado'] == 'Completado')
        fallidos = sum(row['cantidad'] for row in audit_stats if row['estado'] == 'Error')
        otros = sum(row['cantidad'] for row in audit_stats if row['estado'] not in ('Completado', 'Error'))
        
        # 2. Obtener motores y cantidad de operaciones combinadas (Audit + Stress Test)
        cursor.execute("""
            SELECT motor_afectado, SUM(cantidad) as cantidad
            FROM (
                SELECT motor_afectado, COUNT(*) as cantidad 
                FROM AUDIT_LOGS 
                WHERE motor_afectado IS NOT NULL 
                GROUP BY motor_afectado
                
                UNION ALL
                
                SELECT c.engine as motor_afectado, COUNT(*) as cantidad
                FROM tx_log t
                JOIN CONNECTIONS c ON t.db_id = c.id
                GROUP BY c.engine
            ) as combined
            GROUP BY motor_afectado
        """)
        motor_stats = cursor.fetchall()
        
        motores_labels = [row['motor_afectado'] for row in motor_stats]
        motores_data = [row['cantidad'] for row in motor_stats]

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
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()
