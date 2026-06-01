from fastapi import APIRouter, HTTPException
from App.Models.Schemas import ConnectionCreate
from App.Database.Connection import get_db_connection
from App.Security import encrypt_password

# Creamos un "Router" para mantener organizadas las rutas de conexiones
router = APIRouter(prefix="/api/connections", tags=["Registro de Motores"])

@router.post("/")
def register_connection(conn_data: ConnectionCreate):
    """Registra un nuevo motor de base de datos cumpliendo el requisito de seguridad."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error crítico conectando a la BD de control")

    try:
        # 1. Encriptar la contraseña (Requisito estricto del Módulo 1)
        encrypted_pass = encrypt_password(conn_data.password)

        # 2. Insertar en PostgreSQL de forma segura (evitando inyecciones SQL)
        cursor = conn.cursor()
        insert_query = """
                       INSERT INTO CONNECTIONS (nombre, motor, host, port, database_name, user_name, encrypted_password, status)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE') RETURNING id; \
                       """
        cursor.execute(insert_query, (
            conn_data.nombre,
            conn_data.motor,
            conn_data.host,
            conn_data.port,
            conn_data.database_name,
            conn_data.user_name,
            encrypted_pass
        ))

        # Recuperamos el ID que se acaba de generar
        new_id = cursor.fetchone()['id']
        conn.commit()

        return {"status": "success", "message": "Motor registrado y credenciales encriptadas correctamente.", "id": new_id}

    except Exception as e:
        conn.rollback() # Si algo falla, deshacemos los cambios
        raise HTTPException(status_code=400, detail=f"Error al registrar el motor: {str(e)}")
    finally:
        cursor.close()
        conn.close()