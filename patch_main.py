import re

with open('DataOOPS-Control-Center/Main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace the inner definition of enviar_correo_alerta
def_enviar = re.search(r'# ==========================================\n# --- FUNCIÓN REAL DE ENVÍO SMTP \(GMAIL\) ---\n# ==========================================\ndef enviar_correo_alerta.*?print\(f"--- \[ERROR SMTP\] Detalle: \{str\(e\)\} ---"\)', content, flags=re.DOTALL)
if def_enviar:
    content = content.replace(def_enviar.group(0), 'from App.services.Mail_service import enviar_correo_alerta')

# 2. Remove the mock stress test
def_stress = re.search(r'# 2\. STRESS TEST \(Ruta detectada: /api/queries/stress-test/\{db_id\}\)\n@app\.get\("/api/queries/stress-test/\{db_id\}"\)\n@app\.post\("/api/queries/stress-test/\{db_id\}"\)\nasync def run_stress_test_demo.*?\n    return \{"status": "success", "message": "Prueba de estrés completada con 100 usuarios concurrentes\."\}\n', content, flags=re.DOTALL)
if def_stress:
    content = content.replace(def_stress.group(0), '')

# 3. Remove the mock sync replica
def_sync = re.search(r'# 3\. SYNC RÉPLICA\nreplication_scenario = 0\n@app\.get\("/api/replication/sync/\{db_id\}"\)\n@app\.post\("/api/replication/sync/\{db_id\}"\)\nasync def sync_replication.*?return \{"status": "warning" if current\[\'alerta\'\] else "success", "message": message, "details": current\}\n', content, flags=re.DOTALL)
if def_sync:
    content = content.replace(def_sync.group(0), '')

# 4. Remove the mock scan
def_scan = re.search(r'# ESCÁNER DE ALERTAS\n@app\.get\("/api/alerts/scan/\{db_id\}"\)\n@app\.post\("/api/alerts/scan/\{db_id\}"\)\nasync def scan_and_alert.*?return \{"status": "warning", "message": "Escaneo completado\."\}\n', content, flags=re.DOTALL)
if def_scan:
    content = content.replace(def_scan.group(0), '')

with open('DataOOPS-Control-Center/Main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Main.py modificado correctamente.")
