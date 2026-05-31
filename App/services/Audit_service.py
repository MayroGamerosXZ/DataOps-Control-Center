from App.Database.Connection import get_db_connection

def log_audit(usuario: str, motor_afectado: str, accion_realizada: str, filas_afectadas: int = 0, estado: str = "Completado"):
    """
    Registra una acción en la tabla AUDIT_LOGS.
    """
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO AUDIT_LOGS (usuario, motor_afectado, accion_realizada, filas_afectadas, estado)
                VALUES (%s, %s, %s, %s, %s)
            """, (usuario, motor_afectado, accion_realizada, filas_afectadas, estado))
            conn.commit()
        except Exception as e:
            print(f"Error registrando auditoría: {e}")
        finally:
            cursor.close()
            conn.close()
    else:
        print("No se pudo conectar a la base de datos para auditoría.")
