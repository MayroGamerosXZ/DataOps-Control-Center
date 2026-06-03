import requests
from fastapi import APIRouter, HTTPException, BackgroundTasks
from App.services.Alerts_service import scan_and_generate_alerts, get_custom_alerts
from App.services.Mail_service import enviar_correo_alerta

router = APIRouter(prefix="/api/alerts", tags=["Motor de Alertas (Módulo 9)"])

# Conjunto para rastrear qué alertas de Prometheus ya han enviado correo
# En producción, esto debería ir a Redis o BD para persistir entre reinicios
notified_prometheus_alerts = set()

@router.post("/scan/{db_id}")
def trigger_alert_scan(db_id: int, background_tasks: BackgroundTasks):
    """Ejecuta el escáner proactivo para detectar anomalías de rendimiento."""
    result = scan_and_generate_alerts(db_id)

    if result['status'] == 'error':
        raise HTTPException(status_code=500, detail=result['message'])

    background_tasks.add_task(enviar_correo_alerta, f"Reporte de Escaneo - Motor {db_id}", f"Se ha completado el escaneo REAL de umbrales. {result.get('message', '')}")

    return result

@router.get("/active")
def get_active_alerts(background_tasks: BackgroundTasks):
    """Consulta a Prometheus y al estado interno para obtener TODAS las alertas activas."""
    active_alerts = []

    # 1. Obtener alertas internas (Lógica de Negocio)
    internal_alerts = get_custom_alerts()
    active_alerts.extend(internal_alerts)

    # 2. Obtener alertas de Prometheus (Infraestructura)
    try:
        prometheus_url = "http://prometheus:9090/api/v1/alerts"
        try:
            response = requests.get(prometheus_url, timeout=2)
        except requests.exceptions.ConnectionError:
            prometheus_url = "http://localhost:9090/api/v1/alerts"
            response = requests.get(prometheus_url, timeout=2)

        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success' and 'data' in data and 'alerts' in data['data']:
                for alert in data['data']['alerts']:
                    if alert['state'] == 'firing':
                        alert_name = alert['labels'].get('alertname', 'Alerta Desconocida')
                        container = alert['labels'].get('name', 'N/A')

                        # ID único para la alerta
                        alert_id = f"{alert_name}_{container}"

                        # Añadir a la lista para el dashboard
                        active_alerts.append({
                            "name": alert_name,
                            "state": alert['state'],
                            "severity": alert['labels'].get('severity', 'warning'),
                            "container": container,
                            "summary": alert['annotations'].get('summary', 'Sin resumen'),
                            "description": alert['annotations'].get('description', 'Sin descripción')
                        })

                        # LOGICA DE CORREO: Si es CPU o Disco, enviamos correo (solo una vez por disparo)
                        if alert_name in ['AltaCargaCPU', 'UsoDeDiscoCritico'] and alert_id not in notified_prometheus_alerts:
                            notified_prometheus_alerts.add(alert_id)
                            asunto = f"Alerta de Infraestructura: {alert_name}"
                            cuerpo = f"Severidad: {alert['labels'].get('severity')}\nContenedor: {container}\nDetalle: {alert['annotations'].get('description')}"
                            background_tasks.add_task(enviar_correo_alerta, asunto, cuerpo)

                # Limpieza: Si una alerta de Prometheus ya no está "firing", la quitamos del set de notificados
                # para que si vuelve a dispararse, envíe correo de nuevo.
                current_firing_ids = {f"{a['labels'].get('alertname')}_{a['labels'].get('name')}" for a in data['data']['alerts'] if a['state'] == 'firing'}
                notified_prometheus_alerts.intersection_update(current_firing_ids)

        return {"status": "success", "alerts": active_alerts}

    except Exception as e:
        # Devolvemos al menos las alertas internas si Prometheus falla
        return {"status": "error", "message": f"Fallo parcial (Prometheus): {str(e)}", "alerts": active_alerts}
