import os
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv

load_dotenv()

def get_blob_service_client():
    connection_string = os.getenv("AZURE_CONNECTION_STRING")
    if not connection_string:
        raise ValueError("AZURE_CONNECTION_STRING no está configurado en .env")
    return BlobServiceClient.from_connection_string(connection_string)

def get_container_client():
    blob_service_client = get_blob_service_client()
    container_name = os.getenv("AZURE_CONTAINER_NAME", "dataops-backups")
    return blob_service_client.get_container_client(container_name)

def list_azure_blobs():
    try:
        container_client = get_container_client()
        blobs_list = container_client.list_blobs()
        
        results = []
        for blob in blobs_list:
            # Convert size to MB for display
            size_mb = f"{blob.size / (1024 * 1024):.2f} MB" if blob.size else "0 MB"
            date_str = blob.last_modified.strftime("%Y-%m-%d %H:%M:%S") if blob.last_modified else "Desconocida"
            
            results.append({
                "name": blob.name,
                "size": size_mb,
                "date": date_str,
                "status": "Disponible"
            })
            
        # Order by date descending
        results.sort(key=lambda x: x["date"], reverse=True)
        return {"status": "success", "blobs": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def download_azure_blob(blob_name: str):
    try:
        container_client = get_container_client()
        blob_client = container_client.get_blob_client(blob_name)
        stream = blob_client.download_blob()
        return stream.readall()
    except Exception as e:
        raise Exception(f"Error descargando blob: {str(e)}")
