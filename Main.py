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

# Cargar variables de entorno
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
# --- FUNCIÓN REAL DE ENVÍO DE CORREO SMTP ---
# ==========================================
def enviar_correo_alerta(asunto: str, mensaje_cuerpo: str, destinatario: str = "dba@distribuidoralopez.com"):
    try:
        # Obtener credenciales desde el archivo .env
        sender_email = os.getenv("GMAIL_USER")
        password = os.getenv("GMAIL_PASS")

        if not sender_email or not password:
            print("[ERROR] Credenciales SMTP no configuradas en .env")
            return

        msg = MIMEText(mensaje_cuerpo)
        msg['Subject'] = f"[ALERTA DATAOPS] - {asunto}"
        msg['From'] = sender_email
        msg['To'] = destinatario

        # Conexión real a los servidores de Google
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, password)
            server.send_message(msg)

        print(f"\n[ÉXITO SMTP] -> Correo enviado a {destinatario} desde {sender_email}\n")
    except Exception as e:
        print(f"Error al enviar correo vía SMTP: {e}")

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
    logs_db = [
        {"id": 1, "motor": "PostgreSQL Control", "status": "ONLINE", "latencia_ms": 12},
        {"id": 2, "motor": "PostgreSQL Test", "status": "ONLINE", "latencia_ms": 15},
        {"id": 3, "motor": "SQL Server Test", "status": "ONLINE", "latencia_ms": 28}
    ]
    return {"status": "success", "records": logs_db}

@app.get("/api/queries/slow-logs")
async def get_slow_queries_logs():
    raw_queries = [
        {"query": "SELECT * FROM orders o JOIN users u ON o.user_id = u.id WHERE o.total > 5000;", "duracion_seg": 3.42, "plan_ejecucion": "Full Table Scan", "optimizacion_sugerida": "CREATE INDEX idx_orders_total ON orders(total);"},
        {"query": "SELECT SUM(stock) FROM inventory GROUP BY category_id;", "duracion_seg": 2.15, "plan_ejecucion": "Sequential Scan", "optimizacion_sugerida": "CREATE NONCLUSTERED INDEX idx_inv_category ON inventory(category_id) INCLUDE (stock);"},
        {"query": "SELECT id FROM users WHERE active = true;", "duracion_seg": 0.30, "plan_ejecucion": "Index Seek", "optimizacion_sugerida": "Ninguna."}
    ]
    for q in raw_queries:
        if q["duracion_seg"] < 0.5: q["clasificacion"] = "Fast"
        elif q["duracion_seg"] < 1.5: q["clasificacion"] = "Medium"
        elif q["duracion_seg"] < 3.0: q["clasificacion"] = "Slow"
        else: q["clasificacion"] = "Critical"
    return {"status": "success", "records": raw_queries}

@app.post("/api/queries/deadlock")
async def trigger_deadlock(background_tasks: BackgroundTasks):
    background_tasks.add_task(enviar_correo_alerta, "Deadlock Crítico", "Se ha detectado un bloqueo mutuo en el motor SQL Server.")
    return {"status": "warning", "message": "¡Interbloqueo detectado! Correo enviado al DBA."}

@app.post("/api/backups/{backup_type}/{db_id}")
async def execute_cloud_backup(backup_type: str, db_id: int):
    return {"status": "success", "message": f"Backup {backup_type.upper()} transferido a Azure."}

@app.post("/api/disaster/drop-table")
async def simulate_drop_table(background_tasks: BackgroundTasks):
    background_tasks.add_task(enviar_correo_alerta, "¡DESASTRE! DROP TABLE", "La tabla operativa 'users' ha sido eliminada.")
    return {"status": "critical", "message": "¡ALERTA CRÍTICA! DROP TABLE detectado."}

@app.post("/api/disaster/restore")
async def execute_recovery_protocol():
    return {"status": "success", "message": "Protocolo Recovery finalizado.", "details": {"rpo": "12m", "rto": "45s"}}

replication_scenario = 0
@app.post("/api/replication/sync/{db_id}")
async def sync_replication(db_id: int):
    global replication_scenario
    scenarios = [
        {"estado": "Normal", "lag": 2, "alerta": False, "cap": "Consistencia Fuerte"},
        {"estado": "Media", "lag": 5, "alerta": False, "cap": "Consistencia Eventual"},
        {"estado": "Crítica", "lag": 20, "alerta": True, "cap": "Disponibilidad sobre Consistencia"}
    ]
    current = scenarios[replication_scenario]
    replication_scenario = (replication_scenario + 1) % 3
    return {"status": "warning" if current['alerta'] else "success", "details": current}

@app.post("/api/cache/demo")
async def cache_performance_demo():
    return {"status": "success", "message": "Evaluación Caché completada."}

@app.post("/api/alerts/scan/{db_id}")
async def scan_and_alert(db_id: int, background_tasks: BackgroundTasks):
    background_tasks.add_task(enviar_correo_alerta, "Reporte de Escaneo", "Se detectaron anomalías en el sistema.", "2890-23-11428@miumg.edu.gt")
    return {"status": "warning", "message": "Escaneo completado. Correo enviado."}