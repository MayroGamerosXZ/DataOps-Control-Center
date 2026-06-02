import sys

with open('App/Routes/Backups.py', 'r', encoding='utf-8') as f:
    content = f.read()

diff_endpoint = """
@router.post("/diff/{db_id}")
def trigger_diff_backup(db_id: int):
    \"\"\"Genera una copia de seguridad DIFERENCIAL de un motor específico.\"\"\"
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a la BD de control")

    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM CONNECTIONS WHERE id = %s AND status = 'ACTIVE'", (db_id,))
        db_config = cursor.fetchone()

        if not db_config:
            raise HTTPException(status_code=404, detail="Motor no encontrado o inactivo")

        # Disparar el respaldo
        result = generate_local_backup(db_config, backup_type="DIFF")

        if result['status'] == 'error':
            raise HTTPException(status_code=400, detail=result['message'])

        return result
    finally:
        cursor.close()
        conn.close()
"""

if "@router.post(\"/diff/{db_id}\")" not in content:
    content = content + "\n" + diff_endpoint

with open('App/Routes/Backups.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Backups.py")