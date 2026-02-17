# Training Management System (TMS) - Regulated Compliance Platform

A high-integrity Training Management System designed for regulated industries. This project integrates AI-driven assessment generation, automated compliance tracking, and a robust governance analytics layer.

---

## 🏗 High-Level Architecture

```mermaid
graph TB
    subgraph Client_Layer ["💻 Frontend (React + Vite)"]
        direction TB
        UI["🎨 Modern UI (Tailwind)"]
        State["🧠 Context API Tracking"]
        Router["🚦 React Router Navigation"]
    end

    subgraph API_Gateway ["🚀 Backend (Node.js + Express TS)"]
        direction TB
        Auth["🔑 JWT Security"]
        AIService["🤖 AI Engine (Groq/Llama)"]
        Audit["📜 Immutable Audit Logs"]
        Cert["🎓 Certificate Engine"]
        GovAI["🔍 Governance Analytics AI"]
    end

    subgraph Data_Persistence ["💾 Database (MongoDB Atlas)"]
        direction LR
        Users[("👤 User Profiles")]
        Records[("📝 Training Records")]
        Certs[("📜 Certificates")]
        Logs[("⚡ Activity Logs")]
    end

    UI <--> Router
    Router <--> API_Gateway
    API_Gateway <--> AIService
    API_Gateway <--> Data_Persistence
    
    %% Styling
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef api fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef db fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    
    class UI,State,Router client;
    class Auth,AIService,Audit,Cert,GovAI api;
    class Users,Records,Certs,Logs db;
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
