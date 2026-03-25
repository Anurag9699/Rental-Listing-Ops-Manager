# 🏡 Rental Listing Operations Manager

An ops-grade rental listing management system that prioritizes backend correctness and availability reliability over UI complexity. Designed to solve real-world operational challenges such as double bookings, inconsistent calender states, and poor customer-operator communication.

---

## 🏗️ Architecture Overview
This project uses a **Microservices Architecture** to ensure independent scalability, separation of concerns, and an ops-grade backend.

The system is composed of 4 key services orchestrated via Docker:
1. **Frontend (`:5173`)** - React & Vite UI for the dashboard, listing creation, and property management pages.
2. **Backend Engine (`:3001`)** - Express.js service that handles property listing CRUD, the listing state machine (Draft → Active → Paused), and chat messages.
3. **Availability Engine (`:3002`)** - An isolated Node.js microservice entirely dedicated to computing calendar overlaps, enforcing date blocking, and preventing double-bookings.
4. **PostgreSQL Database (`:5432`)** - The single source of truth for listings, availability blocks, and chat history, accessed via Prisma ORM.

---

## 💻 Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend & Availability Engine**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **DevOps**: Docker & Docker Compose

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) (v20+)

### 1. Run Everything Automatically (Recommended)
The easiest way to start the entire system is using Docker Compose. It will automatically build the images, start the Postgres database, run `prisma generate`, and host all the services.

```bash
# From the root directory:
docker-compose up --build
```
*Wait for all containers to output "Ready" in the terminal.*

**Access the services:**
- Frontend Dashboard: `http://localhost:5173`
- Backend API: `http://localhost:3001/api/health`
- Availability Engine API: `http://localhost:3002/api/health`

### 2. Run Services Manually (For Development)

If you prefer to run the services locally in separate terminal tabs, you must start a Postgres instance first.

**Terminal 1: Start Database (via Docker)**
```bash
docker-compose up postgres
```

**Terminal 2: Run Backend**
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

**Terminal 3: Run Availability Engine**
```bash
cd availability-engine
npm install
npx prisma db push
npm run dev
```

**Terminal 4: Run Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Key Features
- **Listing Lifecycle State Machine**: Listings must follow strict state transitions (`DRAFT` → `ACTIVE` → `PAUSED`). An `ACTIVE` state cannot happen unless availability blocks are configured.
- **Concurrency Safety**: The Availability Engine blocks dates using a Prisma `$transaction` lock, meaning two users cannot physically book the exact same dates simultaneously.
- **RESTful Endpoints API**: Every service communicates over clearly defined API contracts using standard REST protocols.

---

## 👩‍💻 Developed By
**Anurag Khubalkar**  
*Project Type:* Application Developer – Product Development (Ops-grade MVP)  
*Year & Section:* 2nd Year, Semester 4
