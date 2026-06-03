from App.Database.Connection import get_db_connection
from psycopg2.extras import RealDictCursor
import threading

# Variable global para almacenar alertas de lógica de negocio (en memoria)
# En una aplicación real, esto iría a una tabla de base de datos o Redis
custom_alerts_state = []
alerts_lock = threading.Lock()

def add_custom_alert(name: str, severity: str, summary: str, description: str, container: str = "Backend"):
    """Añade una alerta generada por la lógica de negocio."""
    with alerts_lock:
        # Evitar duplicados exactos
        for alert in custom_alerts_state:
            if alert['name'] == name and alert['description'] == description:
                return

        custom_alerts_state.append({
            "name": name,
            "state": "firing", # Las alertas de negocio se consideran activas inmediatamente
            "severity": severity,
            "container": container,
            "summary": summary,
            "description": description
        })

def clear_custom_alerts(alert_name: str = None):
    """Limpia las alertas personalizadas. Si se especifica alert_name, solo borra esa."""
    global custom_alerts_state
    with alerts_lock:
        if alert_name:
            custom_alerts_state = [a for a in custom_alerts_state if a['name'] != alert_name]
        else:
            custom_alerts_state.clear()

def get_custom_alerts():
    """Devuelve la lista actual de alertas personalizadas."""
    with alerts_lock:
        return list(custom_alerts_state)

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

                # También la añadimos al estado en memoria para el dashboard
                add_custom_alert("Transacción Lenta", "warning", "Tiempo de espera excesivo", description)

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