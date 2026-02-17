# Training Management System (TMS) - Regulated Compliance Platform

A high-integrity Training Management System designed for regulated industries. This project integrates AI-driven assessment generation, automated compliance tracking, and a robust governance analytics layer.

---

## 🏗 System Architecture (C4 Context)

```mermaid
C4Context
    title "TMS System Overview - High Level Architecture"
    
    Person(admin, "Administrator", "Governance oversight, document uploads, and compliance monitoring.")
    Person(user, "Employee", "Training completion, assessment participation, and certificate retrieval.")
    
    System_Boundary(tms_boundary, "Training Management System") {
        System(web_app, "Web Application", "React Frontend + Express Backend providing the core training lifecycle.")
        SystemDb(storage, "Persistence Layer", "MongoDB (Training Records, Audit Logs) & File Storage (Certificates).")
    }
    
    System_Ext(groq_ai, "Groq AI Engine", "Llama 3.3 70B model for dynamic question generation and governance analysis.")
    System_Ext(email_svc, "Notification Service", "EmailJS/Nodemailer for assignment and alert delivery.")

    Rel(admin, web_app, "Manages & Monitors", "HTTPS")
    Rel(user, web_app, "Learns & Assesses", "HTTPS")
    
    Rel(web_app, groq_ai, "Content Generation", "JSON/Secure API")
    Rel(web_app, storage, "Reads/Writes", "Mongoose/Local FS")
    Rel(web_app, email_svc, "Sends Alerts", "SMTP/REST")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## 🔄 Core Workflows

### 1. Training & Assessment Workflow
```mermaid
sequenceDiagram
    participant Admin
    participant AI
    participant User
    participant DB

    Admin->>DB: Upload SOP (PDF)
    DB->>AI: Trigger Question Gen
    AI-->>DB: Save MCQs
    Admin->>User: Assign Training
    User->>User: View Document
    User->>AI: Submit Answers
    AI->>User: Evaluate & Grade
    User->>DB: Save Result (PASS/EXCELLENT)
    DB->>DB: Generate Certificate PDF
```

### 2. Governance Analytics Workflow
```mermaid
sequenceDiagram
    participant Admin
    participant System
    participant AI

    Admin->>System: "Which department is highest risk?"
    System->>System: Aggregate Compliance Data
    System->>AI: Analyze Aggregated Metrics
    AI-->>Admin: Structured Risk Explanation & Suggestions
```

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (Modular Premium Design)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Networking**: Axios

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **AI Engine**: Groq SDK (Llama 3.3 70B)
- **PDF Gen**: PDFKit
- **Logging**: Custom Audit Trial System

---

## 📁 Project Structure

```text
TMS/
├── frontend/             # React Application
│   ├── src/
│   │   ├── components/   # Reusable UI (AI Assistant, Notification, etc.)
│   │   ├── pages/        # Dashboard, Governance, Training Details, etc.
│   │   ├── services/     # API Integration
│   │   └── contexts/     # Auth Context
├── backend/              # Express API
│   ├── src/
│   │   ├── controllers/  # Business Logic (Assessments, Uploads, AI)
│   │   ├── models/       # Mongoose Schemas (User, TrainingRecord, etc.)
│   │   ├── routes/       # API Endpoints
│   │   ├── services/     # AI, Certificates, Audit Service
│   │   └── scripts/      # Maintenance & Utility Scripts
└── README.md             # Project Documentation
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- Groq API Key

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create `.env` file from `.env.example`
4. `npm run dev`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## 📜 Governance & Compliance
- **Read-Only Analytics**: AI Governance layer is strictly analytical.
- **Audit Trails**: Every lifecycle change is logged immutably.
- **Grading**: Standardized 3-tier system (FAIL < 35%, PASS 35-60%, EXCELLENT > 60%).

---
*AI Generated Documentation – Structured for Governance*
