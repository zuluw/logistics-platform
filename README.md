# Logistics Platform

Web application for automated last-mile delivery planning, commercial fleet management, and real-time dispatch synchronization.

## Tech Stack

### Backend
- Runtime: Node.js (v20+, ES Modules)
- Framework: Express.js (v5)
- Database: PostgreSQL (v15) with Prisma ORM
- Routing Engine: Open Source Routing Machine (OSRM Trip API)
- Real-time: Socket.io
- Security: JSON Web Tokens (JWT), bcryptjs (12 salt rounds), Zod validation schemas
- Mail: Nodemailer (Ethereal test SMTP)
- Testing: Vitest, Supertest (29 automated integration tests)

### Frontend
- Core: React (v19), Vite
- Styling: Tailwind CSS
- Maps: Leaflet with OpenStreetMap tiles
- Icons: Lucide React
- Export: Media print styling for A4 commercial waybills, native CSV export

### DevOps & CI/CD
- Containerization: Docker, Docker Compose, Nginx
- CI Pipeline: GitHub Actions (linting, Prisma validation, test suite, production build)

---

## Architecture Overview

The system is organized as a monorepo following modular, feature-based layered architecture:

- server/src/modules/auth/ - authentication, role-based access control (RBAC), password reset flow.
- server/src/modules/orders/ - delivery order lifecycle, pagination, filtering, sorting, full-text search.
- server/src/modules/vehicles/ - commercial fleet registry, capacity constraints, driver assignments.
- server/src/modules/routes/ - combinatorial route allocation, OSRM TSP calculation, atomic transactions.
- server/src/modules/users/ - administrator personnel management and role reassignment.
- server/src/services/ - standalone adapters for OSRM, Socket.io, and Nodemailer.
- client/src/modules/ - role-based interfaces for Dispatcher, Driver, and Administrator.

---

## Default Credentials

Pre-configured in database seed script (server/prisma/seed.js):

| Role | Email | Password |
|---|---|---|
| Administrator | admin@logistics.by | password123 |
| Dispatcher | dispatcher@logistics.by | password123 |
| Driver 1 | driver@logistics.by | password123 |
| Driver 2 | driver2@logistics.by | password123 |

---

## Quick Start with Docker Compose

Prerequisites: Docker Engine (v24+) and Docker Compose (v2+).

1. Clone repository:
```bash 
git clone https://github.com/zuluw/logistics-platform.git
cd logistics-platform
```

2. Build and run all services:
```bash 
docker compose up --build -d
```

3. Access application:
- Web Application: http://localhost
- REST API: http://localhost:5000/api
- PostgreSQL: `localhost:5432`

---

## Manual Local Development Setup

Prerequisites: Node.js (v20+), npm (v9+), PostgreSQL (v14+).

### 1. Database & Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in server/.env:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/logistics_db?schema=public"
JWT_SECRET="super-secure-production-jwt-secret-key-351002"
JWT_EXPIRES_IN="7d"
OSRM_API_URL="http://router.project-osrm.org"
CLIENT_URL="http://localhost:5173"
```

4. Apply database migrations and seed initial data:
```bash
npx prisma migrate deploy
npm run db:seed
```

5. Start backend development server:
```bash
npm run dev
```
### 2. Frontend Setup

1. Open a new terminal and navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start client development server:
```bash
npm run dev
```

4. Open browser at http://localhost:5173

---

## Running Automated Tests

Integration tests cover authentication, authorization guards, CRUD operations, capacity validation, and route generation.

Run test suite from the server directory:
cd server
npm test

Expected result: 5 test suites passed, 29 tests passed.

---

## Key Features

1. Automated VRP & TSP Routing:
   - Groups orders under vehicle payload limits (knapsack heuristic).
   - Generates shortest path on real road networks via OSRM Trip API.
   - Extracts turn-by-turn driving maneuvers with street names and meter distances.

2. Real-time Telemetry & Updates:
   - Bidirectional communication via Socket.io rooms.
   - Instant marker state propagation upon delivery confirmation.
   - Simulation of vehicle movement along road polyline with speed tracking.

3. Reporting & Documents:
   - Printable commercial waybill formatted for standard A4 layout.
   - Export of active order and vehicle registries to CSV format.

4. Role-based Access Control:
   - Dedicated views for Dispatchers (map management), Drivers (mobile delivery HUD), and Administrators (personnel and global multi-route monitor).

---

## License

Copyright © 2026 Aleksandr Mikhalkov