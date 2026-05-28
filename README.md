# 🚀 DataOps Control Center

![Architecture](https://img.shields.io/badge/Architecture-Hybrid_Cloud-blue?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi)
![SQL Server](https://img.shields.io/badge/SQL_Server-Telemetry-CC2927?style=for-the-badge&logo=microsoft-sql-server)
![Grafana](https://img.shields.io/badge/Grafana-Monitoring-F46800?style=for-the-badge&logo=grafana)
![Power BI](https://img.shields.io/badge/Power_BI-Analytics-F2C811?style=for-the-badge&logo=powerbi)

Plataforma centralizada y automatizada para el monitoreo, gestión y recuperación de bases de datos empresariales en entornos de alta disponibilidad. Este proyecto implementa principios de **SRE (Site Reliability Engineering)** y **DataOps** para garantizar la continuidad del negocio y el cumplimiento de SLA.

Desarrollado como Proyecto Final de Ingeniería para la **Universidad Mariano Gálvez de Guatemala (UMG)** - Curso: Sistemas Operativos II.

---

## 📑 Tabla de Contenidos
1. [Arquitectura del Sistema](#-arquitectura-del-sistema)
2. [Características Principales](#-características-principales-módulos)
3. [Stack Tecnológico](#-stack-tecnológico)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Instalación y Despliegue](#-instalación-y-despliegue-local)
6. [Métricas y Accesos](#-métricas-y-accesos)
7. [Autor](#-autor)

---

## 🏗️ Arquitectura del Sistema

La arquitectura está diseñada bajo un patrón híbrido para evitar el colapso de la telemetría durante caídas del motor de base de datos:

* **Plano de Control (Orquestación):** Una API robusta en Python (FastAPI) que administra trabajos asíncronos (APScheduler), simula estrés de concurrencia y maneja notificaciones SMTP.
* **Plano de Datos y Telemetría:** Un clúster de bases de datos contenerizado. La telemetría física (CPU, RAM, Disco) es extraída directamente del motor de Docker (cAdvisor) hacia Prometheus y Grafana, evitando bloqueos (locks) en las transacciones operativas.
* **Auditoría Histórica:** Conexión directa a través del puerto TCP 1434 hacia **Power BI** para transformar *logs* crudos en inteligencia de negocios.

---

## ⚙️ Características Principales (Módulos)

### 🟢 1. Monitoreo Activo (Health Check)
- Tareas programadas (`cron jobs`) que validan el estado (Healthy, Warning, Critical) de múltiples motores (SQL Server, Oracle, PostgreSQL) cada 60 segundos.
- Panel UI interactivo con latencias en tiempo real.

### 🔍 2. Análisis de Rendimiento y Concurrencia
- **Slow Queries:** Detección de consultas ineficientes (ej. *Full Table Scans* vs *Index Seeks*).
- **Stress Testing:** Simulación controlada de 100+ usuarios concurrentes.
- Detección autónoma y resolución de interbloqueos (**Deadlocks**).

### 💾 3. Backup, Recovery y Cloud (Azure)
- Ejecución de respaldos estratégicos (FULL, DIFF, INC).
- Generación de hashes **MD5** para validar la integridad de los datos.
- Simulación de integración con **Azure Blob Storage**.
- Cálculo automatizado de tiempos de recuperación ante desastres: **RPO** (Recovery Point Objective) y **RTO** (Recovery Time Objective).

### ⚡ 4. Replicación Distribuida y Caché (Redis)
- Análisis del **Teorema CAP** midiendo *lag* de sincronización entre nodo primario y réplica (2s, 5s y 20s).
- Implementación de **Redis** para almacenamiento en memoria clave-valor, reduciendo latencias de consulta de ~412 ms a ~38 ms (Mejora del 90%).

### 📊 5. Inteligencia de Negocio y Motor de Alertas
- **Power BI Dashboard:** Matrices de calor (*Heatmaps*), estado de SLAs y auditoría de disponibilidad (Up-Time > 99.85%).
- **SMTP Engine:** Despacho de correos electrónicos automáticos ante umbrales críticos (CPU > 80%, Discos > 90%, Fallo de Backup).

---

### 💻 Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Frontend** | React 18, Material-UI, CSS3 (Glassmorphism) |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, APScheduler |
| **Bases de Datos** | Microsoft SQL Server, PostgreSQL |
| **Telemetría & BI** | Prometheus, Grafana, Power BI Desktop |
| **Caché & Cloud** | Redis, Azure Blob Storage (Simulated) |
| **Infraestructura**| Docker, Docker Compose, Git |

---

## 📂 Estructura del Proyecto

```text
📦 DataOps-Control-Center
 ┣ 📂 App
 ┃ ┣ 📂 Database        # Conexiones SQLAlchemy y modelos DDL
 ┃ ┣ 📂 Routes          # Endpoints de la API (Monitoreo, Backups, Consultas)
 ┃ ┗ 📂 services        # Lógica de negocio (Health Checks, SMTP, Hashes)
 ┣ 📂 frontend
 ┃ ┣ 📂 src             # Componentes de React y Vistas del Dashboard
 ┃ ┗ 📜 package.json    # Dependencias de NPM
 ┣ 📜 main.py           # Punto de entrada de FastAPI y Middlewares
 ┣ 📜 docker-compose.yml# Orquestador de contenedores (SQL Server, Grafana, Redis)
 ┣ 📜 .env.example      # Plantilla de variables de entorno (Credenciales)
 ┗ 📜 README.md         # Documentación del proyecto
```


## 🛠️ Instalación y Despliegue Local
Pre-requisitos
Docker y Docker Compose instalados.

Node.js (v16+) para el frontend.

Python 3.10+ para el backend.

Pasos de Ejecución
1. Clonar el repositorio:
```
git clone [https://github.com/MayroGamerosXZ/DataOps-Control-Center.git](https://github.com/MayroGamerosXZ/DataOps-Control-Center.git)
cd DataOps-Control-Center
```

2. Configurar el entorno (Backend):
Crea un archivo .env en la raíz basado en .env.example:

```
GMAIL_USER=tu_correo@gmail.com
GMAIL_PASS=tu_app_password
AZURE_STORAGE_CONNECTION_STRING=tu_cadena_azure
```

3. Levantar la Infraestructura de Datos (Docker):
```
Bash
docker-compose up -d
```

4. Levantar la API (FastAPI):
```
Bash
pip install -r requirements.txt
uvicorn main:app --reload
```
5. Levantar el Panel Web (React):

```
Bash
cd frontend
npm install
npm start
```

## 🌐 Métricas y Accesos
Una vez desplegado, los servicios estarán disponibles en los siguientes puertos locales:

🖥️ UI (React): http://localhost:3001

⚙️ API Docs (Swagger): http://localhost:8000/docs

📈 Grafana (Telemetría): http://localhost:3000 (Login: admin/admin)

🗄️ SQL Server (SSMS/Power BI): localhost,1434 (User: sa)

##👨‍💻 Autor
Mayro Geovanni Barrios Gameros Carné: 2890-23-11428

Facultad de Ingeniería en Sistemas Universidad Mariano Gálvez de Guatemala, Sede Retalhuleu.
