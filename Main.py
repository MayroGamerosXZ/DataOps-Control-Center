from fastapi import FastAPI
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


# ==========================================
# --- IMPORTACIONES DE RUTAS (ENDPOINTS) ---
# ==========================================
from App.Routes.Connections import router as connections_router
from App.Routes.Queries import router as queries_router
from App.Routes.Backups import router as backups_router # NUEVA RUTA DE BACKUPS


app = FastAPI(
    title="DataOps Control Center API",
    description="API central para gestión y monitoreo de bases de datos de la práctica final.",
    version="1.0.0"
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

# Fase 2 - Módulo 1: Ruta para registrar motores de BD
app.include_router(connections_router)

# Fase 3 - Módulo 3: Ruta para el análisis de consultas lentas y rendimiento
app.include_router(queries_router)

# ==========================================
# --- REGISTRO DE MÓDULOS EN LA API ---
# ==========================================
app.include_router(connections_router)
app.include_router(queries_router)
app.include_router(backups_router) # NUEVO ROUTER

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