from App.Database.Connection import get_db_connection
from psycopg2.extras import RealDictCursor

def scan_and_generate_alerts(db_id: int, threshold_ms: float = 50.0):
    """Escanea las transacciones y genera alertas si superan el tiempo de espera permitido."""
    conn = get_db_connection()
    if not conn:
        return {"status": "error", "message": "Sin conexión a BD de control"}

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # 1. Buscar transacciones lentas en la tabla tx_log
        cursor.execute("""
                       SELECT id, session_id, wait_time
                       FROM tx_log
                       WHERE db_id = %s AND wait_time > %s
                       """, (db_id, threshold_ms))

        slow_queries = cursor.fetchall()
        alerts_created = 0

        # 2. Por cada transacción lenta, generar un registro en ALERTS
        for q in slow_queries:
            description = f"La sesión {q['session_id']} experimentó un tiempo de espera crítico de {q['wait_time']}ms."

            # Verificamos si ya existe una alerta para esta transacción específica para no duplicar
            cursor.execute("""
                           SELECT id FROM ALERTS WHERE description = %s
                           """, (description,))

            if not cursor.fetchone():
                cursor.execute("""
                               INSERT INTO ALERTS (db_id, alert_type, description, severity)
                               VALUES (%s, 'SLOW_QUERY', %s, 'HIGH')
                               """, (db_id, description))
                alerts_created += 1

        conn.commit()

        return {
            "status": "success",
            "message": f"Escaneo de anomalías completado exitosamente.",
            "threshold_ms": threshold_ms,
            "alerts_created": alerts_created
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        cursor.close()
        conn.close()