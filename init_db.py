import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from App.Database.Connection import get_db_connection

def create_audit_table():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS AUDIT_LOGS (
                    id SERIAL PRIMARY KEY,
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    usuario VARCHAR(100),
                    motor_afectado VARCHAR(100),
                    accion_realizada TEXT,
                    filas_afectadas INT,
                    estado VARCHAR(50)
                );
            """)
            conn.commit()
            cursor.close()
            print("Tabla AUDIT_LOGS verificada/creada exitosamente.")
        except Exception as e:
            print(f"Error creando tabla: {e}")
        finally:
            conn.close()
    else:
        print("No se pudo conectar a la base de datos.")

if __name__ == "__main__":
    create_audit_table()
