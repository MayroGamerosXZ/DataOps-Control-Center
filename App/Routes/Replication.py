from fastapi import APIRouter, HTTPException
from App.Database.Connection import get_db_connection
from App.services.Replication_service import  sync_to_replica
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/api/replication", tags=["Replicación Distribuida (Módulo 6)"])

@router.post("/sync/{db_id}")
def trigger_replication(db_id: int):
    """Sincroniza los datos del motor principal hacia el nodo de alta disponibilidad."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM CONNECTIONS WHERE id = %s AND status = 'ACTIVE'", (db_id,))
        db_config = cursor.fetchone()

        if not db_config:
            raise HTTPException(status_code=404, detail="Motor origen no encontrado o inactivo")

        result = sync_to_replica(db_config, table_name="stress_table")

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        return result
    finally:
        cursor.close()
        conn.close()