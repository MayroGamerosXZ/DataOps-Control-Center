from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/api/audit", tags=["Auditoría"])

# Datos de ejemplo para simular un log de auditoría real
mock_logs = [
    {
        "id": i,
        "fecha": (datetime.now() - timedelta(minutes=i*15)).isoformat(),
        "usuario": random.choice(["Mayro", "admin_system", "auditor_bot"]),
        "motor_afectado": random.choice(["db_test_postgres", "db_test_sqlserver", "db_control_postgres"]),
        "accion_realizada": random.choice([
            "SELECT en tabla 'users'",
            "UPDATE en tabla 'products'",
            "Login exitoso",
            "Backup FULL ejecutado",
            "Intento de login fallido"
        ]),
        "filas_afectadas": random.randint(0, 1000) if "SELECT" in "accion_realizada" else 1,
        "estado": "Completado" if random.random() > 0.1 else "Error"
    }
    for i in range(50)
]

@router.get("/logs")
def get_audit_logs():
    """Devuelve una lista de registros de auditoría simulados."""
    # En una aplicación real, aquí se consultaría la tabla de auditoría de la base de datos de control.
    return {"status": "success", "logs": mock_logs}
