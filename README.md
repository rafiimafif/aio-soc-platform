# CyberOps AIO (All-In-One) SOC Platform

CyberOps AIO is a comprehensive, modular Security Operations Center (SOC) platform designed for modern security analysts. It combines real-time event monitoring, live threat intelligence, local file forensics, incident response workflows, and reporting into a single, premium 'dark mode' interface.

The platform utilizes a React/Vite frontend for high performance and an Express/PostgreSQL backend for secure proxying and data persistence.

---

## 🌟 Key Features & Modules

### 1. 🔐 Login Gateway
- **Secure Authentication**: Authenticates users (e.g., `sec_analyst`) against the PostgreSQL backend.
- **Graceful Fallback**: Automatically falls back to a local secure hash validation if the database is offline.
- **Cyberpunk UI**: Features a terminal-style connection handshake and telemetry decryption sequence upon login.

### 2. 📊 SIEM Dashboard (Real-Time Monitoring)
- **Live Event Feed**: Continuously updates with simulated network and security events.
- **Real Log Ingestion (CSV)**: Analysts can upload real log files via CSV (parsed locally at high speed via PapaParse). The dashboard will dynamically update the event feed with the uploaded data.
- **Dynamic Filtering**: Filter events instantly by Severity (Low, Medium, High, Critical), Event Type, or specific IP address.
- **Visual Analytics**: Interactive bar charts for event type distribution and immediate metrics on unacknowledged critical alerts.

### 3. 🛡️ Threat Intelligence
- **Live MITRE ATT&CK STIX Feed**: Dynamically fetches the latest Enterprise ATT&CK matrix directly from the official MITRE CTI GitHub repository upon mounting. 
- **TTP Browser**: Search and filter techniques, tactics, and actors.
- **Live IOC Lookups**: Enter an IP address to query real-world reputation, ISP, and geographic data using a backend proxy that safely queries `ip-api.com` without CORS limitations.

### 4. 🔍 Forensics Workbench
- **Real File Analysis**: Drag and drop any file to instantly analyze it locally within the browser.
- **WebCrypto Hashing**: Safely calculates genuine **SHA-256** and **SHA-512** hashes of files natively in the browser without uploading the file payload to any server.
- **Magic Bytes Detection**: Extracts the first 8 hex bytes of the file for true file-type identification, ignoring spoofed extensions.
- **Live VirusTotal Integration**: Enter an optional VirusTotal API key to securely query the file's hash against VirusTotal's V3 API via the backend proxy.

### 5. 👥 Incident Response (Kanban Board)
- **Visual Tracking**: Move incidents seamlessly through their lifecycle stages: `New` ➔ `Investigating` ➔ `Contained` ➔ `Resolved`.
- **Database Persistence**: State changes are saved in real-time to the PostgreSQL backend.
- **Deep Dive Drawer**: Click any incident to open a side drawer containing IR Playbook checklists, a chronological timeline of notes, and affected systems.

### 6. 📝 Report Generator
- **Automated Intelligence Reports**: Select an incident to instantly generate formatted reports.
- **Customizable Output**: Choose between an Executive Summary (focusing on business risk, financial impact, and board recommendations) or a Technical Report (focusing on IOCs, vectors, and remediation steps).
- **One-Click Export**: Easily copy the generated report to your clipboard for pasting into tickets or emails.

### 7. 📈 Metrics & Analytics
- **Performance Trends**: Line charts tracking Mean Time to Detect (MTTD) and Mean Time to Respond (MTTR) over 30 days.
- **Alert Distribution**: Pie charts breaking down the types of alerts (Malware, Phishing, Insider Threats, etc.).
- **Analyst Leaderboard**: Tracks active analysts, their closure rates, MTTR, and accuracy scores.
- **Overall SOC Health**: A live radial gauge indicating the current health of the security posture.

---

## 🏗️ Architecture

- **Frontend**: React 18, Vite, TailwindCSS (Vanilla CSS for base styling), Recharts (data visualization), Lucide React (icons), PapaParse (CSV processing).
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (`pg` pool connection).

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL (Running locally on port 5432)

### 1. Database Setup
Ensure PostgreSQL is running. The application expects a database named `cyberops_db` and standard user credentials.
If you need to change these, update the `.env` file in the root directory:
```env
PORT=3001
PG_USER=postgres
PG_HOST=localhost
PG_DATABASE=cyberops_db
PG_PASSWORD=postgres
PG_PORT=5432
```

### 2. Install Dependencies
Install packages for both the frontend and the backend tools:
```bash
npm install
```
*(Backend dependencies like `express`, `pg`, `cors`, and `dotenv` are installed in the root `node_modules` alongside frontend deps).*

### 3. Run the Application
The platform requires both the Vite dev server and the Express backend to be running concurrently.

**Start the Backend API (Port 3001):**
```bash
node backend/index.js
```

**Start the Frontend (Vite):**
```bash
npm run dev
```

### 4. Login Credentials
When presented with the Login Gateway, use the standard analyst credentials provisioned for local development. For secure deployments, credentials should be managed via environment variables and proper identity providers. Ensure no plaintext credentials are ever committed to version control.

---

## 📁 Project Structure
- `/frontend/components/`: Modular React components for each dashboard view.
- `/frontend/utils/`: Shared utilities, mock data generation, and cryptography functions.
- `/backend/index.js`: Express backend handling database connections, authentication, and external API proxies.
- `vite.config.js`: Contains the proxy configuration routing `/api/*` traffic to the backend server.
