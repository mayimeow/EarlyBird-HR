# EarlyBird HR Portal

EarlyBird HR is a robust, full-stack HR management platform built to enhance organizational transparency and operational efficiency. It provides a centralized ecosystem for managing attendance, leave requests, employee records, and workforce analytics.

## Key Features

### 🏢 Multi-Role Architecture
*   **Executive Portal**: High-level KPI dashboards, departmental workforce analytics, and super-admin access management.
*   **HR Portal**: Centralized command center for attendance tracking, leave approval queues, dispute resolution, and employee directory management.
*   **Employee Portal**: Self-service interface for filing leave requests, monitoring attendance logs, and managing individual profile settings.

### 📊 Intelligent Data Management
*   **Dynamic Spreadsheet Logs**: Visual attendance logs featuring a spreadsheet-style interface, sortable by month and year.
*   **Dispute Resolution Workflow**: Automated system for handling attendance discrepancies with integrated file-proof uploads and status tracking.
*   **Automated Onboarding**: Secure, automated credential provisioning for new hires, including temporary password generation and direct directory integration.

### 🛡️ Security & Reliability
*   **Role-Based Access Control (RBAC)**: Fine-grained security policies ensuring appropriate data visibility for different organizational levels.
*   **Data Integrity**: Automated system logic to ensure data accuracy and auditability for HR operations.

## Tech Stack
*   **Frontend**: React.js with Vite
*   **Styling**: Tailwind CSS
*   **Backend & Auth**: Supabase (Database, Authentication, Storage)
*   **Visualizations**: Recharts
*   **Utilities**: Lucide React, jsPDF

## Getting Started
1. **Clone the repository.**
2. **Install dependencies**: `npm install`
3. **Configure Environment Variables**:
   Create a `.env` file and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
