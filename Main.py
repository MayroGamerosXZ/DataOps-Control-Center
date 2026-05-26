import hashlib
from datetime import datetime
import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from pydantic import BaseModel

# Cargar variables de entorno desde el archivo .env
load_dotenv()

# ==========================================
# --- IMPORTACIONES DE BASE DE DATOS Y SERVICIOS ---
# ==========================================
from App.Database.Connection import get_db_connection
from App.services.Health_check import run_health_check

from App.Routes.Connections import router as connections_router
from App.Routes.Queries import router as queries_router
from App.Routes.Backups import router as backups_router
from App.Routes.Replication import router as replication_router
from App.Routes.Cache import router as cache_router
from App.Routes.Alerts import router as alerts_router

app = FastAPI(
    title="DataOps Control Center API",
    description="API central para gestión y monitoreo de bases de datos de la práctica final.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    scheduler.add_job(run_health_check, 'interval', minutes=1)
    scheduler.start()
    print("Planificador de tareas iniciado.")

@app.on_event("shutdown")
def stop_scheduler():
    scheduler.shutdown()

app.include_router(connections_router)
app.include_router(queries_router)
app.include_router(replication_router)
app.include_router(cache_router)
app.include_router(backups_router)
app.include_router(alerts_router)

class DatabaseConnection(BaseModel):
    engine: str
    host: str
    port: int
    username: str
    password: str

# ==========================================
# --- FUNCIÓN REAL DE ENVÍO DE CORREO SMTP (GMAIL) ---
# ==========================================
def enviar_correo_alerta(asunto: str, mensaje_cuerpo: str, destinatario: str = "dba@distribuidoralopez.com"):
    print(f"--- [DEBUG SMTP] Iniciando envío a {destinatario} ---")
    try:
        sender_email = os.getenv("GMAIL_USER")
        password = os.getenv("GMAIL_PASS")

        if not sender_email or not password:
            print("[ERROR CRÍTICO] Credenciales GMAIL_USER o GMAIL_PASS no configuradas en .env")
            return

        msg = MIMEText(mensaje_cuerpo)
        msg['Subject'] = f"[ALERTA DATAOPS] - {asunto}"
        msg['From'] = sender_email
        msg['To'] = destinatario

        # Conexión real a los servidores de Google
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, password)
            server.send_message(msg)

        print(f"--- [ÉXITO SMTP] Correo enviado a {destinatario} desde {sender_email} ---")
    except Exception as e:
        print(f"--- [ERROR SMTP] ---")
        print(f"Detalle: {str(e)}")

@app.get("/")
def read_root():
    return {"status": "API online", "message": "Bienvenido al DataOps Control Center"}

@app.get("/test-db")
def test_db():
    conn = get_db_connection()
    if conn:
        conn.close()
        return {"status": "success", "message": "Conexión a la base de datos de control exitosa."}
    return {"status": "error", "message": "Fallo al conectar con la base de datos."}

@app.post("/api/connections/register")
async def register_database(db_config: DatabaseConnection):
    return {"status": "success", "message": f"Motor {db_config.engine} registrado con éxito."}

@app.get("/api/connections/logs")
async def get_connection_logs():
    return {"status": "success", "records": [{"id": 1, "motor": "PostgreSQL", "status": "ONLINE"}]}

@app.get("/api/queries/slow-logs")
async def get_slow_queries_logs():
    raw_queries = [
        {"query": "SELECT * FROM orders;", "duracion_seg": 3.42, "plan_ejecucion": "Full Scan", "optimizacion_sugerida": "CREATE INDEX idx_orders;"}
    ]
    return {"status": "success", "records": raw_queries}

@app.post("/api/queries/deadlock")
async def trigger_deadlock(background_tasks: BackgroundTasks):
    background_tasks.add_task(enviar_correo_alerta, "Deadlock Crítico", "Se ha detectado un bloqueo mutuo.")
    return {"status": "warning", "message": "Interbloqueo detectado. Correo en proceso."}

@app.post("/api/backups/{backup_type}/{db_id}")
async def execute_cloud_backup(backup_type: str, db_id: int):
    return {"status": "success", "message": f"Backup {backup_type.upper()} transferido a Azure."}

@app.post("/api/disaster/drop-table")
async def simulate_drop_table(background_tasks: BackgroundTasks):
    background_tasks.add_task(enviar_correo_alerta, "¡DESASTRE!", "La tabla 'users' fue eliminada.")
    return {"status": "critical", "message": "¡ALERTA CRÍTICA! DROP TABLE detectado."}

@app.post("/api/disaster/restore")
async def execute_recovery_protocol():
    return {"status": "success", "message": "Protocolo Recovery finalizado."}

@app.post("/api/replication/sync/{db_id}")
async def sync_replication(db_id: int):
    return {"status": "success", "details": {"estado": "Normal", "cap": "Consistencia Fuerte"}}

@app.post("/api/cache/demo")
async def cache_performance_demo():
    return {"status": "success", "message": "Evaluación Caché completada."}

@app.post("/api/alerts/scan/{db_id}")
async def scan_and_alert(db_id: int, background_tasks: BackgroundTasks):
    background_tasks.add_task(enviar_correo_alerta, "Reporte de Escaneo", "Se detectaron anomalías.", "2890-23-11428@miumg.edu.gt")
    return {"status": "warning", "message": "Escaneo completado. Correo enviado."}