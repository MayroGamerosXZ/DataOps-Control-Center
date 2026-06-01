import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Configuración quemada para pruebas locales iniciales (luego pasaremos a variables de entorno)
DB_HOST = "localhost"
DB_PORT = "5432"
DB_USER = "MayroGameros"
DB_PASS = "Robin1710"
DB_NAME = "dataops_control_db"

def get_db_connection():
    """Establece y retorna una conexión a la base de datos de control."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS,
            dbname=DB_NAME,
            cursor_factory=RealDictCursor # Para que devuelva diccionarios en lugar de tuplas
        )
        return conn
    except Exception as e:
        print(f"Error crítico conectando a la BD de control: {e}")
        return None