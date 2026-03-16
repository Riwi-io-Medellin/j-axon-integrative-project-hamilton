# j-axon-integrative-project-hamilton
Repository for the J-axon team (Technology) - RIWI.

SIGAM (Smart Asset and IT Maintenance Management System) is a full‑stack web application that moves IT asset management from reactive to proactive. It automates the life cycle of hardware and software assets, supports real‑time incident reporting, and uses AI/NLP to classify issues and optimize technician workload.

**Vision and Problem**
Organizations often lack real‑time visibility into asset status and location, which leads to reactive maintenance, higher downtime, and unplanned costs. SIGAM provides a centralized, auditable system that tracks assets end‑to‑end and turns incidents into actionable, prioritized work.

**Core Modules**
- Inventory 360°: hierarchical asset location (site > floor > room), asset life cycle, depreciation, and obsolescence alerts.
- Smart Help Desk with AI: QR‑based incident reporting, NLP classification (hardware/software/network), and automatic prioritization.
- Maintenance, Calendar, and Logistics: preventive maintenance scheduling, drag‑and‑drop planning, and spare‑parts control.

**Key Capabilities**
- QR generation per asset for fast reporting and traceability.
- Asset “life sheet” with historical repairs and ownership changes.
- SLA‑aware ticketing with priority scoring and status tracking.
- Predictive insights: MTTR, MTBF, and stock‑minimum alerts.
- Automated technician assignment based on workload.

**Standards and Quality Alignment**
- Asset life‑cycle practices aligned with ISO 55000.
- SLA definitions aligned with ISO 20000‑1.
- Secure decommissioning considerations aligned with ISO 27001.
- Business continuity stock alerts aligned with ISO 22301.
- Electrical specs for assets aligned with NTC 2050 and maintenance metrics with GTC 62.

**Technology Stack**
- Frontend: Vanilla JavaScript with Tailwind CSS for a lightweight UI.
- Backend: Node.js and Express.
- Database: SQL Server or PostgreSQL.

**Roadmap (4 Weeks)**
- Week 1: Data model design (3NF), core CRUD for assets and users.
- Week 2: Frontend dashboard, QR generation, manual ticket creation.
- Week 3: AI ticket classification and automatic technician assignment.
- Week 4: UX polishing, security validations, and cloud deployment.

**Live URLs**
- Frontend: `https://sigam-frontend.vercel.app/login`
- API: `https://sigam-backend.vercel.app/`
