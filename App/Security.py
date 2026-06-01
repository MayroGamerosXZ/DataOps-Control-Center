from cryptography.fernet import Fernet

# Clave maestra para encriptar/desencriptar (En un entorno de producción real, esto iría en variables de entorno)
SECRET_KEY = b'9vK3p8_g0_Z6LpE7lP5H_8Q-2n5-o4t4x6_8_G1j_v0='
cipher_suite = Fernet(SECRET_KEY)

def encrypt_password(password: str) -> str:
    """Encripta la contraseña en texto plano."""
    return cipher_suite.encrypt(password.encode('utf-8')).decode('utf-8')

def decrypt_password(encrypted_password: str) -> str:
    """Desencripta la contraseña para usarla internamente al conectar a los motores."""
    return cipher_suite.decrypt(encrypted_password.encode('utf-8')).decode('utf-8')