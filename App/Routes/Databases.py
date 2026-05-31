from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from App.Database.Connection import get_db_connection
from psycopg2.extras import RealDictCursor
from faker import Faker
import time

router = APIRouter(prefix="/api/databases", tags=["Real Database Operations (Fase 2)"])
fake = Faker()

class InjectRequest(BaseModel):
    table_name: str
    num_records: int

class QueryRequest(BaseModel):
    query: str

@router.get("/schema")
def get_schema():
    """Obtiene la lista de tablas y sus columnas (Solo PostgreSQL por ahora)."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        # Consulta para obtener tablas públicas y sus columnas en PostgreSQL
        query = """
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """
        cursor.execute(query)
        columns = cursor.fetchall()
        
        # Agrupar por tabla
        schema = {}
        for col in columns:
            t_name = col['table_name']
            if t_name not in schema:
                schema[t_name] = []
            schema[t_name].append({"column": col['column_name'], "type": col['data_type']})
            
        return {"status": "success", "schema": schema}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.post("/query")
def execute_query(req: QueryRequest):
    """Ejecuta una consulta SQL real y devuelve los resultados."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute(req.query)
        
        # Si es una consulta de lectura
        if req.query.strip().upper().startswith("SELECT") or req.query.strip().upper().startswith("WITH") or req.query.strip().upper().startswith("SHOW"):
            records = cursor.fetchall()
            return {"status": "success", "records": records, "message": f"{len(records)} filas recuperadas."}
        else:
            conn.commit()
            affected = cursor.rowcount
            return {"status": "success", "records": [], "message": f"Operación exitosa. {affected} filas afectadas."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()

@router.post("/inject")
def inject_data(req: InjectRequest):
    """Inyecta datos falsos dinámicamente según la tabla."""
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD")
    
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Verificar las columnas de la tabla solicitada
        cursor.execute("""
            SELECT column_name, data_type, is_identity, column_default 
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
        """, (req.table_name,))
        
        columns = cursor.fetchall()
        if not columns:
            raise HTTPException(status_code=404, detail=f"Tabla '{req.table_name}' no encontrada o sin columnas.")
        
        # Ignorar 'id' y columnas con valores por defecto o identidad (como auto numéricos)
        col_names = []
        for col in columns:
            if col['column_name'] == 'id' or col['is_identity'] == 'YES' or (col['column_default'] and 'nextval' in col['column_default']):
                continue
            col_names.append(col['column_name'])
        
        if not col_names:
            raise HTTPException(status_code=400, detail=f"No se detectaron columnas insertables en '{req.table_name}'.")

        inserted_count = 0
        start_time = time.time()
        
        for _ in range(req.num_records):
            values = []
            for col in columns:
                cname = col['column_name']
                ctype = col['data_type']
                
                if cname not in col_names:
                    continue # Auto-incrementable u omitido
                
                # Inferencia de datos según el nombre/tipo
                cname_lower = cname.lower()
                if 'name' in cname_lower or 'nombre' in cname_lower:
                    values.append(fake.name())
                elif 'email' in cname_lower or 'correo' in cname_lower:
                    values.append(fake.email())
                elif 'date' in cname_lower or 'fecha' in cname_lower or 'time' in ctype:
                    values.append(fake.date_time_this_decade())
                elif 'int' in ctype or 'numeric' in ctype:
                    values.append(fake.random_int(min=1, max=1000))
                elif ctype == 'boolean':
                    values.append(fake.boolean())
                elif 'char' in ctype or 'text' in ctype:
                    values.append(fake.word())
                else:
                    values.append(fake.word())
                    
            placeholders = ', '.join(['%s'] * len(col_names))
            cols_str = ', '.join(col_names)
            
            insert_query = f"INSERT INTO {req.table_name} ({cols_str}) VALUES ({placeholders})"
            cursor.execute(insert_query, tuple(values))
            inserted_count += 1
            
        conn.commit()
        end_time = time.time()
        
        return {
            "status": "success", 
            "message": f"{inserted_count} registros inyectados en '{req.table_name}' exitosamente en {round(end_time - start_time, 2)}s."
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cursor.close()
        conn.close()
