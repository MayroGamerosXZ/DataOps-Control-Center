import json
from fastapi import APIRouter, HTTPException
from App.Database.Connection import get_db_connection
from App.Database.Redis_client import get_redis_client
from psycopg2.extras import RealDictCursor

router = APIRouter(prefix="/api/cache", tags=["Caché & Optimización (Módulo 7)"])

@router.get("/transactions/{db_id}")
def get_cached_transactions(db_id: int):
    """Obtiene el log de transacciones usando Redis para acelerar la respuesta."""
    redis_client = get_redis_client()
    cache_key = f"tx_log_db_{db_id}" # Esta es la "etiqueta" para buscar en la memoria

    # 1. Intentar leer desde Redis (La vía rápida)
    if redis_client:
        cached_data = redis_client.get(cache_key)
        if cached_data:
            return {
                "source": "REDIS_CACHE ⚡",
                "message": "Datos recuperados ultrarrápido desde la memoria RAM.",
                "data": json.loads(cached_data)
            }

    # 2. Si no está en caché, ir a PostgreSQL (La vía lenta)
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a BD de control")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Traemos los registros de la prueba de estrés
        cursor.execute("SELECT id, session_id, operacion, wait_time FROM tx_log WHERE db_id = %s ORDER BY id DESC LIMIT 100", (db_id,))
        records = cursor.fetchall()

        # Convertimos tipos Decimales a float para que JSON lo entienda
        for row in records:
            if 'wait_time' in row and row['wait_time'] is not None:
                row['wait_time'] = float(row['wait_time'])

        # 3. Guardar el resultado en Redis para la próxima vez (expirará en 60 segundos)
        if redis_client and records:
            redis_client.setex(cache_key, 60, json.dumps(records))

        return {
            "source": "POSTGRESQL_DATABASE 🐢",
            "message": "Datos leídos desde el disco (Se acaban de guardar en caché para la próxima).",
            "data": records
        }
    finally:
        cursor.close()
        conn.close()