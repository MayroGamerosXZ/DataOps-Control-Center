import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

correo = os.getenv("GMAIL_USER")
password = os.getenv("GMAIL_PASS")

print("--- INICIANDO DIAGNOSTICO ---")
print(f"Usuario cargado: {correo}")

try:
    # Mensaje 100% limpio (solo texto plano en ingles/ASCII)
    mensaje_limpio = "Prueba de conexion exitosa. El servidor envia correos correctamente."

    msg = MIMEText(mensaje_limpio)
    msg['Subject'] = "[PRUEBA DIRECTA] DataOps Control Center"
    msg['From'] = correo
    msg['To'] = correo

    server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
    server.set_debuglevel(1)
    server.login(correo, password)
    server.send_message(msg)
    server.quit()
    print("\n EXITAZO TOTAL! Revisa tu bandeja de entrada.")
except Exception as e:
    print(f"\n ERROR EXACTO: {e}")