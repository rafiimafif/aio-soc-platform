# 🛡️ CyberOps AIO (All-In-One) SOC Platform: The Complete Guide

Welcome to the CyberOps AIO (All-In-One) SOC Platform! This document explains what this project is, how it works, and what each part does, using simple and easy-to-understand words.

---

## 📖 1. What is this project?

Imagine a large bank or a massive office building. To keep it safe, you have a **Security Room** with lots of cameras, alarms, and guards monitoring everything. 

In the digital world, companies need a similar room to protect their computers, websites, and data from hackers. This digital security room is called a **SOC (Security Operations Center)**.

This project is a **Dashboard** (a control panel) for the security guards of the internet (called Security Analysts). It gives them a single place to:
- Watch for alarms (hackers trying to break in).
- Investigate suspicious files or IP addresses.
- Keep track of their work on solving security issues.
- Generate reports to show their bosses.

---

## 🏗️ 2. The Big Picture: How is it built?

This platform is built using three main pieces that talk to each other:

1. **The Frontend (The Face):** This is what you see and click on. It’s built with **React** and **Vite**, which makes it super fast and interactive. It uses a "dark mode" theme (like a hacker movie) using **TailwindCSS**.
2. **The Backend (The Engine):** This is the invisible worker behind the scenes, built with **Node.js** and **Express**. When you ask the frontend to do something (like log in or fetch data), the backend does the heavy lifting and talks to the outside world.
3. **The Database (The Brain/Filing Cabinet):** This is where all the permanent information is stored, like user accounts or the status of security incidents. It uses **PostgreSQL**, a very reliable system for saving data.

---

## 🛠️ 3. Core Features: What can it do?

The platform has several "tools" built into it. Here is a simple explanation of each:

### 🔐 1. Login Gateway (Checking IDs at the door)
Before anyone can enter the control panel, they must prove who they are. The login page checks their username and password. If the main database is ever offline, it has a backup method to let the security team in so they are never locked out during an emergency.

### 📊 2. SIEM Dashboard (The Live Security Cameras)
"SIEM" is just a fancy word for a system that collects logs (records of what happened) from everywhere. 
- **Live Feed:** This screen shows a live list of events (like someone failing to log in 50 times in a row). 
- **Filtering:** You can sort these alarms by how dangerous they are (Critical, High, Medium, Low) or by specific IP addresses.
- **Upload Logs:** You can even upload a spreadsheet (`CSV` file) of logs, and the dashboard will read it instantly!

### 🛡️ 3. Threat Intelligence (The FBI's Most Wanted List)
When security guards see a suspicious IP address or tactic, they need to know if it's a known bad guy.
- **MITRE ATT&CK:** This tool connects directly to a global database of hacker tactics (how hackers operate) so the analyst can study their moves.
- **IP Lookup:** If the analyst sees a weird IP address, they can type it in here, and the system will safely look up where in the world that computer is located and who owns it.

### 🔍 4. Forensics Workbench (The CSI Science Lab)
Sometimes, employees find strange files (like a weird email attachment) and want to know if it's a virus.
- **Drag & Drop Analysis:** The analyst can drop the file here. The platform will instantly read the file's "fingerprint" (called a **Hash**).
- **Safe Environment:** It does this entirely in the browser using WebCrypto, meaning the file is never uploaded to the internet, keeping it safe and private.
- **Virus Check:** It can connect to **VirusTotal** (a famous anti-virus database) to see if that file's fingerprint matches any known viruses.

### 👥 5. Incident Response (The Digital To-Do List)
When a real attack happens, it's called an "Incident." This tool is a Kanban board (like Trello) for tracking these incidents.
- You can drag and drop problems from **New** ➔ **Investigating** ➔ **Contained** (Stopped) ➔ **Resolved** (Fixed).
- If you click on an incident, a side drawer opens with a checklist of steps to fix the problem, and a place to take notes.

### 📝 6. Report Generator (Automated Paperwork)
Nobody likes writing long reports. This tool does it automatically!
- You select a resolved incident, and the platform writes a beautifully formatted summary.
- You can choose an **Executive Summary** (easy words for the boss, focusing on business risk) or a **Technical Report** (nerdy details for the IT team).
- One click copies the whole report so you can paste it into an email.

### 📈 7. Metrics & Analytics (The Scoreboard)
This is the management view. It shows graphs and charts (using a tool called **Recharts**) that display:
- **Speed:** How fast the team is finding and fixing problems.
- **Alert Types:** A pie chart showing if they are mostly fighting malware, phishing emails, or other threats.
- **SOC Health:** A dial showing the overall safety of the company at that exact moment.

---

## ⚙️ 4. How to Start the Platform

Because the platform has a Frontend and a Backend, you need to turn both on. 

1. **Start the Database:** Make sure PostgreSQL is running on your computer.
2. **Install the Parts:** Open your terminal and run `npm install`. This downloads all the building blocks the code needs.
3. **Start the Backend:** In one terminal, run `node backend/index.js`. (This turns on the server on Port 3001).
4. **Start the Frontend:** In a second terminal, run `npm run dev`. (This opens the beautiful dashboard in your web browser).

---
> [!TIP]
> **Summary for Beginners:**
> Think of this project as a **swiss-army knife for cybersecurity professionals**. Instead of using 7 different websites to do their job, they can use this one beautiful, fast, and secure app to monitor, investigate, track, and report on digital threats!
