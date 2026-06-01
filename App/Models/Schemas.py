from pydantic import BaseModel

class ConnectionCreate(BaseModel):
    nombre: str
    motor: str
    host: str
    port: int
    database_name: str
    user_name: str
    password: str

# Verifica que esta clase esté exactamente así:
class QueryAnalyzeRequest(BaseModel):
    db_id: int
    query_text: str