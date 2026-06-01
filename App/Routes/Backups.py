from fastapi import APIRouter, HTTPException
from App.Database.Connection import get_db_connection
from App.services.Backup_service import generate_local_backup
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/api/backups", tags=["Backup & Recovery (Módulo 5)"])

@router.post("/full/{db_id}")
def trigger_full_backup(db_id: int):
    """Genera una copia de seguridad FULL de un motor específico."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM CONNECTIONS WHERE id = %s AND status = 'ACTIVE'", (db_id,))
        db_config = cursor.fetchone()

        if not db_config:
            raise HTTPException(status_code=404, detail="Motor no encontrado o inactivo")

        # Disparar el respaldo
        result = generate_local_backup(db_config)

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        return result
    finally:
        cursor.close()
        conn.close()

@router.post("/diff/{db_id}")
def trigger_diff_backup(db_id: int):
    """Genera una copia de seguridad DIFERENCIAL de un motor específico."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM CONNECTIONS WHERE id = %s AND status = 'ACTIVE'", (db_id,))
        db_config = cursor.fetchone()

        if not db_config:
            raise HTTPException(status_code=404, detail="Motor no encontrado o inactivo")

        # Disparar el respaldo
        result = generate_local_backup(db_config, backup_type="DIFF")

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        return result
    finally:
        cursor.close()
        conn.close()
