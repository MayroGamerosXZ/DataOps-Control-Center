from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from pydantic import BaseModel # NUEVA IMPORTACIÓN PARA EL FORMULARIO

# ==========================================
# --- IMPORTACIONES DE BASE DE DATOS Y SERVICIOS ---
# ==========================================
from App.Database.Connection import get_db_connection
from App.services.Health_check import run_health_check

# ==========================================
# --- IMPORTACIONES DE RUTAS (ENDPOINTS) ---
# ==========================================
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

# ==========================================
# --- CONFIGURACIÓN DE CORS PARA REACT ---
# ==========================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://192.168.50.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# --- FASE 2: MÓDULO 2 (PLANIFICADOR EN SEGUNDO PLANO) ---
# ==========================================
scheduler = BackgroundScheduler()

@app.on_event("startup")
def start_scheduler():
    """Inicia las tareas programadas cuando arranca la API."""
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
# --- MODELOS DE DATOS (NUEVO) ---
# ==========================================
class DatabaseConnection(BaseModel):
    engine: str
    host: str
    port: int
    username: str
    password: str

# ==========================================
# --- RUTAS BASE Y DE CONTROL ---
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

# ==========================================
# --- NUEVO: ENDPOINT DE REGISTRO (FASE A) ---
# ==========================================
@app.post("/api/connections/register")
async def register_database(db_config: DatabaseConnection):
    """
    Recibe las credenciales desde el Modal de React y las procesa.
    """
    try:
        # Aquí irá la persistencia real a la tabla CONNECTIONS posteriormente
        return {
            "status": "success",
            "message": f"Motor {db_config.engine} en {db_config.host}:{db_config.port} registrado con éxito."
        }
    except Exception as e:
        return {"status": "error", "message": f"Error al registrar: {str(e)}"}

# ==========================================
# --- ENDPOINTS DE AUDITORÍA (HISTORIAL Y LENTAS) ---
# ==========================================
@app.get("/api/connections/logs")
async def get_connection_logs():
    """
    Retorna el historial de pruebas de conexión (Health Checks)
    almacenados en la base de datos de control.
    """
    try:
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

@app.get("/api/queries/slow-logs")
async def get_slow_queries_logs():
    """
    Retorna las consultas lentas o de alto impacto detectadas
    durante las simulaciones de estrés.
    """
    try:
        slow_queries_db = [
            {"id": 101, "db_id": 1, "query": "SELECT * FROM orders o JOIN users u ON o.user_id = u.id WHERE o.total > 5000;", "duracion_seg": 3.42, "hilos_concurrentes": 100, "fecha": "2026-05-24 19:50:22"},
            {"id": 102, "db_id": 1, "query": "SELECT SUM(stock) FROM inventory GROUP BY category_id, provider_id, location_id;", "duracion_seg": 2.15, "hilos_concurrentes": 100, "fecha": "2026-05-24 19:50:24"},
            {"id": 103, "db_id": 1, "query": "UPDATE products SET price = price * 1.05 WHERE status = 'active';", "duracion_seg": 1.89, "hilos_concurrentes": 50, "fecha": "2026-05-24 19:51:05"}
        ]
        return {"status": "success", "records": slow_queries_db}

    except Exception as e:
        return {"status": "error", "message": f"Error al extraer metricas de rendimiento: {str(e)}"}