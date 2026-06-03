from fastapi import APIRouter, HTTPException, BackgroundTasks
from App.Database.Connection import get_db_connection
from App.services.Backup_service import generate_local_backup
from psycopg2.extras import RealDictCursor
from App.services.Mail_service import enviar_correo_alerta
from App.services.Alerts_service import add_custom_alert, clear_custom_alerts

router = APIRouter(prefix="/api/backups", tags=["Backup & Recovery (Módulo 5)"])

@router.get("/history")
def get_backup_history():
    """Obtiene el historial de todos los backups (exitosos y fallidos) desde la BD de control."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Unimos con la tabla de conexiones para obtener el nombre del motor
        cursor.execute("""
            SELECT 
                h.id,
                c.nombre as motor_nombre,
                h.backup_type,
                h.status,
                h.file_size_mb,
                h.duration_seconds,
                h.cloud_url,
                h.timestamp
            FROM BACKUP_HISTORY h
            JOIN CONNECTIONS c ON h.db_id = c.id
            ORDER BY h.timestamp DESC
            LIMIT 100;
        """)
        history = cursor.fetchall()
        return {"status": "success", "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar historial: {str(e)}")
    finally:
        cursor.close()
        conn.close()

def execute_backup(db_id: int, background_tasks: BackgroundTasks, backup_type: str = "FULL", force_fail: bool = False):
    """Lógica centralizada para ejecutar backups, con capacidad de forzar fallos para pruebas."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM CONNECTIONS WHERE id = %s AND status = 'ACTIVE'", (db_id,))
        db_config = cursor.fetchone()

        if not db_config:
            raise HTTPException(status_code=404, detail="Motor no encontrado o inactivo")

        # FORZAR FALLO PARA DEMO DE ALERTA
        if force_fail:
            asunto = "¡Alarma Roja! Backup Fallido"
            cuerpo = f"CRITICAL: El proceso de backup para el motor {db_config['nombre']} (ID: {db_id}) ha fallado catastróficamente."
            background_tasks.add_task(enviar_correo_alerta, asunto, cuerpo)
            add_custom_alert(
                name="BackupFallido",
                severity="critical",
                summary="Fallo crítico en el proceso de backup",
                description=f"No se pudo completar el backup para el motor {db_config['nombre']}. Revisar logs del sistema."
            )
            raise HTTPException(status_code=500, detail="Simulación de fallo de backup completada.")

        # Si no se fuerza el fallo, proceder normalmente
        result = generate_local_backup(db_config, backup_type=backup_type)

        if result['status'] == 'error':
            # Si el backup real falla, también generamos la alerta
            asunto = "¡Alarma Roja! Backup Fallido"
            cuerpo = f"CRITICAL: El backup para {db_config['nombre']} falló. Error: {result['message']}"
            background_tasks.add_task(enviar_correo_alerta, asunto, cuerpo)
            add_custom_alert("BackupFallido", "critical", "Fallo real en backup", str(result['message']))
            raise HTTPException(status_code=400, detail=result['message'])

        # Si todo va bien, limpiamos alertas previas de backup para este motor
        clear_custom_alerts(alert_name="BackupFallido")

        asunto = f"MÓDULO 5: Backup {backup_type}"
        cuerpo = f"Se completó exitosamente el Backup {backup_type} de la BD (Motor ID: {db_id}). Tamaño: {result.get('size_mb')} MB. Nube: {result.get('cloud_url')}"
        background_tasks.add_task(enviar_correo_alerta, asunto, cuerpo)

        return result

    finally:
        cursor.close()
        conn.close()

@router.post("/full/{db_id}")
def trigger_full_backup(db_id: int, background_tasks: BackgroundTasks):
    """Genera una copia de seguridad FULL de un motor específico."""
    return execute_backup(db_id, background_tasks, backup_type="FULL")

@router.post("/diff/{db_id}")
def trigger_diff_backup(db_id: int, background_tasks: BackgroundTasks):
    """Genera una copia de seguridad DIFERENCIAL de un motor específico."""
    return execute_backup(db_id, background_tasks, backup_type="DIFF")

# --- RUTA DE PRUEBA PARA FORZAR EL FALLO DE BACKUP ---
@router.post("/full/fail/{db_id}")
def trigger_failed_backup_simulation(db_id: int, background_tasks: BackgroundTasks):
    """
    Ruta especial para simular un fallo de backup y disparar las alertas correspondientes.
    """
    return execute_backup(db_id, background_tasks, backup_type="FULL", force_fail=True)
