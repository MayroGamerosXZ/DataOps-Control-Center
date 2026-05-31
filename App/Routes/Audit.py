from fastapi import APIRouter, HTTPException
from App.Database.Connection import get_db_connection
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/api/audit", tags=["Auditoría Centralizada (Fase 3)"])

@router.get("/logs")
def get_audit_logs():
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM AUDIT_LOGS ORDER BY fecha DESC LIMIT 100;")
        logs = cursor.fetchall()
        # Format datetime objects for JSON serialization
        for log in logs:
            if log.get('fecha'):
                log['fecha'] = log['fecha'].strftime("%Y-%m-%d %H:%M:%S")
        return {"status": "success", "logs": logs}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()
