import sys

with open('App/services/Backup_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("VALUES (%s, 'FULL', %s, %s, %s, %s, 'SUCCESS') RETURNING id; \\", "VALUES (%s, %s, %s, %s, %s, %s, 'SUCCESS') RETURNING id;")
content = content.replace("control_cursor.execute(insert_query, (db_config['id'], file_path, round(file_size_mb, 2), round(duration_sec, 2), cloud_url))", "control_cursor.execute(insert_query, (db_config['id'], backup_type, file_path, round(file_size_mb, 2), round(duration_sec, 2), cloud_url))")
content = content.replace('"message": "Backup FULL generado y replicado en Azure correctamente.",', '"message": f"Backup {backup_type} generado y replicado en Azure correctamente.",')
content = content.replace("VALUES (%s, 'FULL', 'FAILED_NO_FILE', 'FAILED')", "VALUES (%s, %s, 'FAILED_NO_FILE', 'FAILED')")
content = content.replace('"", (db_config[\'id\'],))', '"", (db_config[\'id\'], backup_type))')

with open('App/services/Backup_service.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched Backup_service.py")