from fastapi import APIRouter, HTTPException
from App.services.Alerts_service import scan_and_generate_alerts

router = APIRouter(prefix="/api/alerts", tags=["Motor de Alertas (Módulo 9)"])

@router.post("/scan/{db_id}")
def trigger_alert_scan(db_id: int):
    """Ejecuta el escáner proactivo para detectar anomalías de rendimiento."""
    result = scan_and_generate_alerts(db_id)

    if result['status'] == 'error':
        raise HTTPException(status_code=500, detail=result['message'])

    return result


    