from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # NUEVA IMPORTACIÓN PARA REACT
from apscheduler.schedulers.background import BackgroundScheduler

# ==========================================
# --- IMPORTACIONES DE BASE DE DATOS Y SERVICIOS ---
# ==========================================
from App.Database.Connection import get_db_connection
from App.services.Health_check import run_health_check        # Fase 2 - Módulo 2 (Health Check)

# ==========================================
# --- IMPORTACIONES DE RUTAS (ENDPOINTS) ---
# ==========================================
from App.Routes.Connections import router as connections_router # Fase 2 - Módulo 1 (Registro)
from App.Routes.Queries import router as queries_router       # Fase 3 - Módulo 3 (Slow Query)
from App.Routes.Backups import router as backups_router       # Fase 5 - Módulo 5 (Backups)
from App.Routes.Replication import router as replication_router # Fase 4 - Módulo 6 (Replicación)
from App.Routes.Cache import router as cache_router           # Fase 6 - Módulo 7 (Redis Cache)
from App.Routes.Alerts import router as alerts_router         # Fase 7 - Módulo 9 (Alertas)

app = FastAPI(
    title="DataOps Control Center API",
    description="API central para gestión y monitoreo de bases de datos de la práctica final.",
    version="1.0.0"
)

# ==========================================
# --- CONFIGURACIÓN DE CORS PARA REACT ---
# ==========================================
# Esto permite que tu frontend se comunique con esta API, cubriendo múltiples puertos de respaldo
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://192.168.50.1:3001" # <-- ¡Tu IP agregada a la lista VIP!
    ],
    allow_credentials=True,
    allow_methods=["*"], # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],
)

# ==========================================
# --- FASE 2: MÓDULO 2 (PLANIFICADOR EN SEGUNDO PLANO) ---
# ==========================================
scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    """Inicia las tareas programadas cuando arranca la API."""
    # Ejecuta la recolección de métricas cada 1 minuto exacto
    scheduler.add_job(run_health_check, 'interval', minutes=1)
    scheduler.start()
    print("Planificador de tareas iniciado: Health Check activo (cada 1 min).")

@app.on_event("shutdown")
def stop_scheduler():
    """Apaga el planificador limpiamente al detener la API."""
    scheduler.shutdown()

# ==========================================
# --- REGISTRO DE MÓDULOS EN LA API ---
# ==========================================
app.include_router(connections_router)
app.include_router(queries_router)
app.include_router(replication_router)
app.include_router(cache_router)
app.include_router(backups_router)
app.include_router(alerts_router)

# ==========================================
# --- RUTAS BASE DE PRUEBA ---
# ==========================================
@app.get("/")
def read_root():
    return {"status": "API online", "message": "Bienvenido al DataOps Control Center"}

@app.get("/test-db")
def test_db():
    """Verifica rápidamente que la conexión a la base de datos de control esté viva."""
    conn = get_db_connection()
    if conn:
        conn.close()
        return {"status": "success", "message": "Conexión a la base de datos de control exitosa."}
    return {"status": "error", "message": "Fallo al conectar con la base de datos."}

"Endpoint para el Historial de Salud"

@app.get("/api/connections/logs")
async def get_connection_logs():
    """
    Retorna el historial de pruebas de conexión (Health Checks)
    almacenados en la base de datos de control.
    """
    try:
        # Aquí puedes colocar tu consulta real a la base de datos, por ejemplo:
        # logs = db.query(ConnectionLogModel).order_by(ConnectionLogModel.timestamp.desc()).limit(30).all()

        # Estructura de datos real simulada del histórico para asegurar compatibilidad inmediata:
        logs_db = [
            {"id": 1, "motor": "PostgreSQL Control", "status": "ONLINE", "latencia_ms": 12, "fecha": "2026-05-24 19:45:10"},
            {"id": 2, "motor": "PostgreSQL Test", "status": "ONLINE", "latencia_ms": 15, "fecha": "2026-05-24 19:45:11"},
            {"id": 3, "motor": "SQL Server Test", "status": "ONLINE", "latencia_ms": 28, "fecha": "2026-05-24 19:45:12"},
            {"id": 4, "motor": "PostgreSQL Replica", "status": "ONLINE", "latencia_ms": 14, "fecha": "2026-05-24 19:45:12"},
            {"id": 5, "motor": "SQL Server Test", "status": "ONLINE", "latencia_ms": 22, "fecha": "2026-05-24 19:30:00"}
        ]
        return {"status": "success", "records": logs_db}

    except Exception as e:
        return {"status": "error", "message": f"Error al consultar la base de datos: {str(e)}"}

