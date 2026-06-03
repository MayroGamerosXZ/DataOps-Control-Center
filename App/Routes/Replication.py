from fastapi import APIRouter, HTTPException, BackgroundTasks
from App.Database.Connection import get_db_connection
from App.services.Replication_service import  sync_to_replica
from psycopg2.extras import RealDictCursor
from App.services.Mail_service import enviar_correo_alerta

router = APIRouter(prefix="/api/replication", tags=["Replicación Distribuida (Módulo 6)"])

@router.post("/sync/{db_id}")
def trigger_replication(db_id: int, background_tasks: BackgroundTasks):
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

        background_tasks.add_task(enviar_correo_alerta, "MÓDULO 6: Replicación Distribuida", f"Sincronización REAL hacia el nodo esclavo completada exitosamente.")

        return result
    finally:
        cursor.close()
        conn.close()