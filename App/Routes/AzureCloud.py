from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from App.services.Azure_service import list_azure_blobs, get_container_client
from App.services.Audit_service import log_audit
import io

router = APIRouter(prefix="/api/azure", tags=["Azure Cloud Control (Fase 4)"])

@router.get("/blobs")
def get_blobs():
    result = list_azure_blobs()
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["message"])
    return result

@router.get("/download/{blob_name}")
def download_blob(blob_name: str, background_tasks: BackgroundTasks):
    try:
        container_client = get_container_client()
        blob_client = container_client.get_blob_client(blob_name)
        
        if not blob_client.exists():
            raise HTTPException(status_code=404, detail="Blob no encontrado en Azure")
            
        stream = blob_client.download_blob()
        
        # Log download action
        background_tasks.add_task(log_audit, "Usuario", "Azure Cloud", f"Descarga de Backup: {blob_name}", 0, "Completado")
        
        def iterfile():
            yield from stream.chunks()
            
        return StreamingResponse(
            iterfile(), 
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={blob_name}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error descargando blob: {str(e)}")
