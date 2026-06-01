import os
import time
import subprocess
from datetime import datetime
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient
from App.Database.Connection import get_db_connection
from App.Security import decrypt_password

# Cargar variables de entorno del archivo .env
load_dotenv()
AZURE_CONN_STR = os.getenv("AZURE_CONNECTION_STRING")
AZURE_CONTAINER = os.getenv("AZURE_CONTAINER_NAME")

# Definimos la ruta de la carpeta de backups
BACKUP_DIR = os.path.join(os.getcwd(), "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

def upload_to_azure(file_path, blob_name):
    """Sube un archivo físico a Azure Blob Storage y devuelve la URL."""
    # 1. Forzamos la lectura indicando que busque el .env donde sea que esté
    load_dotenv(override=True)

    # 2. Imprimimos en consola para verificar que SÍ está leyendo la llave
    azure_conn = os.getenv("AZURE_CONNECTION_STRING")
    azure_cont = os.getenv("AZURE_CONTAINER_NAME")

    print(f"[*] DATA OPS - Leyendo credenciales Azure: {'OK' if azure_conn else '¡VACÍO!'}")

    if not azure_conn or not azure_cont:
        raise ValueError("¡ALERTA! Python no está logrando leer tu archivo .env. Azure cancelado.")

    try:
        print(f"[*] DATA OPS - Iniciando transferencia a nube de: {blob_name}...")
        blob_service_client = BlobServiceClient.from_connection_string(azure_conn)
        blob_client = blob_service_client.get_blob_client(container=azure_cont, blob=blob_name)

        with open(file_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)

        print("[*] DATA OPS - ¡Subida a Azure completada al 100%!")
        return blob_client.url
    except Exception as e:
        print(f"[*] DATA OPS - Error en la subida a Azure: {str(e)}")
        raise Exception(f"Fallo crítico al conectar con Microsoft Azure: {str(e)}")


def generate_local_backup(db_config, backup_type="FULL"):
    """Genera un backup con Docker y lo replica en Azure."""
    print(f"[*] DATA OPS - Iniciando generate_local_backup ({backup_type})")
    control_conn = get_db_connection()
    if not control_conn:
        print("[*] DATA OPS - Error: No hay conexión a la BD de control")
        return {"status": "error", "message": "No hay conexión a la BD de control"}

    try:
        db_name = db_config['database_name']
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_name = f"backup_{backup_type}_{db_name}_{timestamp}.backup"
        file_path = os.path.join(BACKUP_DIR, file_name)
        
        print(f"[*] DATA OPS - Archivo a generar: {file_path}")

        password = decrypt_password(db_config['encrypted_password'])

        # Para el DIFF en un entorno demostrativo, usamos --data-only (-a) para que parezca diferente al FULL.
        command = [
            "docker", "run", "--rm",
            "-e", f"PGPASSWORD={password}",
            "postgres:15-alpine",
            "pg_dump",
            "-h", "host.docker.internal",
            "-p", str(db_config['port']),
            "-U", db_config['user_name'],
            "-F", "c"
        ]
        
        if backup_type == "DIFF":
             command.append("-a") # Solo datos
             
        command.append(db_name)
        
        print(f"[*] DATA OPS - Ejecutando comando docker: {' '.join(command)}")

        start_time = time.time()

        with open(file_path, "wb") as f:
            process = subprocess.run(command, stdout=f, stderr=subprocess.PIPE)

        end_time = time.time()
        duration_sec = end_time - start_time

        if process.returncode != 0:
            print(f"[*] DATA OPS - Error en docker pg_dump: {process.stderr.decode('utf-8')}")
            os.remove(file_path)
            raise Exception(f"Error ejecutando Docker pg_dump: {process.stderr.decode('utf-8')}")

        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        print(f"[*] DATA OPS - Archivo de backup creado: {file_size_mb:.2f} MB")

        # === NUEVO: Subir a Azure ===
        cloud_url = upload_to_azure(file_path, file_name)

        # Guardar en BACKUP_HISTORY con la URL de la nube
        control_cursor = control_conn.cursor()
        insert_query = """
                       INSERT INTO BACKUP_HISTORY (db_id, backup_type, file_path, file_size_mb, duration_seconds, cloud_url, status)
                       VALUES (%s, %s, %s, %s, %s, %s, 'SUCCESS') RETURNING id;
                       """
        control_cursor.execute(insert_query, (db_config['id'], backup_type, file_path, round(file_size_mb, 2), round(duration_sec, 2), cloud_url))
        backup_id = control_cursor.fetchone()['id']
        control_conn.commit()

        print("[*] DATA OPS - Backup generado exitosamente")
        return {
            "status": "success",
            "message": f"Backup {backup_type} generado y replicado en Azure correctamente.",
            "backup_id": backup_id,
            "cloud_url": cloud_url,
            "size_mb": round(file_size_mb, 2),
            "duration_sec": round(duration_sec, 2)
        }

    except Exception as e:
        print(f"[*] DATA OPS - Excepción capturada en generate_local_backup: {str(e)}")
        if control_conn:
            control_cursor = control_conn.cursor()
            control_cursor.execute("""
                                   INSERT INTO BACKUP_HISTORY (db_id, backup_type, file_path, status)
                                   VALUES (%s, %s, 'FAILED_NO_FILE', 'FAILED')
                                   """, (db_config['id'], backup_type))
            control_conn.commit()
        return {"status": "error", "message": str(e)}
    finally:
        if control_conn:
            try:
                control_cursor.close()
            except:
                pass
            control_conn.close()