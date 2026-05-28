🚀 DataOps Control Center
Plataforma centralizada de monitoreo, gestión y recuperación de bases de datos empresariales[cite: 1]. Este proyecto cubre los pilares principales de la administración de bases de datos en entornos de alta disponibilidad, operando sobre múltiples motores simultáneamente para generar métricas en tiempo real y responder de forma autónoma ante eventos críticos[cite: 1].

Desarrollado como proyecto de ingeniería para la Universidad Mariano Gálvez de Guatemala (Sistemas Operativos II)[cite: 2, 3].

🏗️ Arquitectura del Sistema
La arquitectura sigue un patrón de capas bien definidas que separa la presentación, la lógica de negocio, el acceso a datos y los servicios auxiliares para facilitar la escalabilidad y el mantenimiento:

Capa de Presentación: Dashboard interactivo y responsivo desarrollado en React.

Capa API (Plano de Control): Backend orquestador (Python/FastAPI) encargado de la lógica central.

Capa de Datos: Clúster de bases de datos operando de manera simultánea (SQL Server, PostgreSQL, Oracle).

Servicios Auxiliares (Telemetría): Implementación de Redis para caché, Prometheus/Grafana para monitoreo físico, y servicios automatizados de backup.

⚙️ Módulos y Características Principales
🟢 1. Monitoreo Activo y Health Check
Supervisión continua de múltiples motores de base de datos con métricas en tiempo real de CPU, memoria, conexiones y bloqueos.

Ejecución automática de Health Checks cada minuto mediante un job planificado.

Clasificación de las bases de datos en estados Healthy, Warning o Critical dependiendo de umbrales configurables.

🔍 2. Slow Query Analyzer y Concurrencia
Detección y clasificación de consultas lentas en cuatro niveles: Fast (< 100 ms), Medium (100-500 ms), Slow (500-2000 ms) y Critical (> 2000 ms).

Análisis de planes de ejecución y registro de índices utilizados.

Simulador de carga que inyecta mínimo 100 usuarios concurrentes ejecutando operaciones mixtas.

Detección automática de deadlocks y resolución de interbloqueos.

💾 3. Backup, Recovery y Cloud Storage
Ejecución de copias de seguridad automáticas de tipo Full, Diferencial e Incremental.

Restauración de snapshots (PRE_DEPLOY, PRE_TEST, PRE_IMPORT) para simulaciones de desastre (ej. DROP TABLE) con medición exacta de los tiempos RPO y RTO.

Replicación automatizada de archivos de respaldo hacia la nube mediante Azure Blob Storage, verificando la integridad de los datos a través de hashes MD5/SHA256.

🔗 4. Replicación Distribuida y Caché en Memoria (Redis)
Simulación de arquitectura primario-réplica con medición de lag en escenarios de carga normal (2 seg), media (5 seg) y alta (20 seg).

Análisis documentado del Teorema CAP, balanceando Consistencia, Disponibilidad y Tolerancia a particiones.

Implementación de Redis como capa de caché para las consultas más frecuentes, reduciendo drásticamente la latencia de ~400 ms a ~40 ms por consulta.

📊 5. Business Intelligence (Power BI) y Motor de Alertas
Dashboard BI: Tableros interactivos en Power BI visualizando el rendimiento temporal, un Heatmap de actividad por hora/día, el ranking Top Queries Lentas, y el estado general del SLA y disponibilidad.

Motor Autónomo: Generación de notificaciones inteligentes vía correo electrónico SMTP.

Reglas críticas configuradas: CPU > 85% (Warning), Deadlocks > 3 (Critical), Backup fallido (Critical) y Discos > 90% (Critical).

🛠️ Tecnologías y Herramientas
Frontend: React (UI futurista con glassmorphism), Material-UI.

Backend: Python (FastAPI), APScheduler.

Bases de Datos: Microsoft SQL Server, PostgreSQL.

Infraestructura: Docker, Docker Compose.

Monitoreo y Alertas: Grafana, Prometheus, SMTP Alert Engine.

Cloud & Caché: Microsoft Azure Blob Storage, Redis.

🚀 Instalación y Despliegue Local
El proyecto está completamente contenerizado para un despliegue ágil.

1. Clonar el repositorio:

Bash
git clone https://github.com/MayroGamerosXZ/DataOps-Control-Center.git
cd DataOps-Control-Center

2. Configurar variables de entorno:
Renombra el archivo .env.example a .env y configura tus credenciales de Azure Blob Storage y SMTP:

Fragmento de código
AZURE_STORAGE_CONNECTION_STRING="your_connection_string"
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"

3. Levantar la infraestructura:
Se utiliza Docker Compose para levantar la totalidad de la plataforma con un único comando.

Bash
docker-compose up -d
4. Accesos a los servicios:

Frontend (React): http://localhost:3001

Backend API (Swagger): http://localhost:8000/docs

Telemetría (Grafana): http://localhost:3000 (Login por defecto)

👨‍💻 Autor
Mayro Geovanni Barrios Gameros
Ingeniería en Sistemas - Universidad Mariano Gálvez de Guatemala[cite: 2].
