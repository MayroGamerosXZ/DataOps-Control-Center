import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

def enviar_correo_alerta(asunto: str, mensaje_cuerpo: str, destinatario: str = "mbarriosg8@miumg.edu.gt"):
    print(f"--- [DEBUG SMTP] Iniciando envío a {destinatario} ---")
    try:
        sender_email = os.getenv("GMAIL_USER")
        password = os.getenv("GMAIL_PASS")

        if not sender_email or not password:
            print("[ERROR CRÍTICO] Credenciales no configuradas en .env")
            return

        msg = MIMEText(mensaje_cuerpo, 'plain', 'utf-8')
        msg['Subject'] = f"[ALERTA DATAOPS] - {asunto}"
        msg['From'] = sender_email
        msg['To'] = destinatario

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, password)
            server.send_message(msg)

        print(f"--- [ÉXITO SMTP] Correo enviado a {destinatario} ---")
    except Exception as e:
        print(f"--- [ERROR SMTP] Detalle: {str(e)} ---")
