# Training Management System (TMS) - Regulated Compliance Platform

A high-integrity Training Management System designed for regulated industries. This project integrates AI-driven assessment generation, automated compliance tracking, and a robust governance analytics layer.

---

## 🏗 System Architecture (Enterprise Layered View)

```mermaid
graph TB
    subgraph Presentation_Layer ["🌐 PRESENTATION LAYER"]
        direction LR
        Admin["👨‍💼 Admin Portal"]
        Employee["👤 Employee Portal"]
        UI_Components["🎨 React UI System"]
    end

    subgraph Application_Layer ["🚀 APPLICATION & LOGIC"]
        direction TB
        Auth_Svc["🔐 Auth & Security"]
        Core_Engine["⚙️ Core Training Logic"]
        Cert_Svc["🎓 Certificate Engine"]
        Gov_AI["🔍 Governance Layer"]
    end

    subgraph Integration_Layer ["☁️ EXTERNAL INTEGRATIONS"]
        direction LR
        Groq_AI["🤖 Groq AI (Llama 3.3)"]
        Email_Ntf["📧 Notification API"]
    end

    subgraph Data_Layer ["💾 INFRASTRUCTURE & DATA"]
        direction LR
        MongoDB[("🍃 MongoDB Atlas")]
        File_Storage[("📁 PDF Storage")]
    end

    %% Multi-Layer Connections
    Presentation_Layer === Application_Layer
    Application_Layer --- Integration_Layer
    Application_Layer === Data_Layer

    %% Professional Styling
    classDef layerBox fill:#f8fafc,stroke:#334155,stroke-width:2px,stroke-dasharray: 5 5;
    classDef nodeBox fill:#ffffff,stroke:#1e293b,stroke-width:1.5px,color:#0f172a;
    classDef primaryNode fill:#eff6ff,stroke:#2563eb,stroke-width:2px,color:#1e40af;
    
    class Presentation_Layer,Application_Layer,Integration_Layer,Data_Layer layerBox;
    class Admin,Employee,UI_Components,Auth_Svc,Core_Engine,Cert_Svc,Gov_AI,Groq_AI,Email_Ntf,MongoDB,File_Storage nodeBox;
    class Core_Engine,Gov_AI primaryNode;
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
