# j-axon-integrative-project-hamilton
Repositorio para el equipo J-axon (Tecnología) - RIWI.

SIGAM (Sistema Inteligente de Gestión de Activos y Mantenimiento TI) es una aplicación web full‑stack que transforma el mantenimiento reactivo en un modelo proactivo. Automatiza el ciclo de vida de activos de hardware y software, permite el reporte de incidentes en tiempo real y usa IA/NLP para clasificar fallas y optimizar la carga de trabajo de los técnicos.

**Visión y Problema**
Muchas organizaciones no tienen visibilidad en tiempo real del estado y ubicación de los activos, lo que genera mantenimiento reactivo, mayor tiempo de inactividad y costos imprevistos. SIGAM ofrece un sistema centralizado y auditable para gestionar los activos de punta a punta y convertir los incidentes en trabajo priorizado y accionable.

**Módulos Core**
- Inventario 360°: ubicación jerárquica (sede > piso > sala), ciclo de vida, depreciación y alertas de obsolescencia.
- Smart Help Desk con IA: reporte por QR, clasificación NLP (hardware/software/red) y priorización automática.
- Mantenimiento, Calendario y Logística: programación preventiva, planificación drag‑and‑drop y control de repuestos.

**Capacidades Clave**
- Generación de QR por activo para reporte rápido y trazabilidad.
- “Hoja de vida” del activo con historial de reparaciones y cambios de responsables.
- Gestión de tickets con SLA, puntuación de prioridad y seguimiento de estados.
- Métricas e insights: MTTR, MTBF y alertas de stock mínimo.
- Asignación automática de técnicos según carga de trabajo.

**Estándares y Calidad**
- Gestión del ciclo de vida alineada con ISO 55000.
- Definición de SLAs alineada con ISO 20000‑1.
- Consideraciones de baja segura alineadas con ISO 27001.
- Alertas de stock crítico alineadas con ISO 22301.
- Especificaciones eléctricas de activos alineadas con NTC 2050 y métricas de mantenimiento con GTC 62.

**Stack Tecnológico**
- Frontend: Vanilla JavaScript con Tailwind CSS para una interfaz ligera.
- Backend: Node.js y Express.
- Base de datos: SQL Server o PostgreSQL.

**Roadmap (4 Semanas)**
- Semana 1: modelo de datos (3FN), CRUD de activos y usuarios.
- Semana 2: dashboard frontend, generación de QR y tickets manuales.
- Semana 3: clasificación de tickets con IA y asignación automática de técnicos.
- Semana 4: pulido UX, validaciones de seguridad y despliegue en la nube.

**URLs en Vivo**
- Frontend: `https://sigam-frontend.vercel.app/login`
- API: `https://sigam-backend.vercel.app/`
