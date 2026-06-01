import redis

def get_redis_client():
    """Crea y retorna la conexión al contenedor de Redis."""
    try:
        # decode_responses=True convierte los bytes de Redis a strings normales
        client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        client.ping() # Un pequeño 'toque' para verificar que el contenedor responda
        return client
    except redis.ConnectionError:
        print("Error: No se pudo conectar a Redis en el puerto 6379.")
        return None