# Kush Motors Pro Management System

A high-end, professional management system designed for automotive studios, detailing centers, and workshops. Built with **React 19**, **Tailwind CSS**, and **Supabase**.

## 🚀 Key Features

### 1. Workshop Floor Control
- **Live Job Cards:** Real-time tracking of vehicles from "Pending" to "In Progress" to "Completed".
- **Technician Assignment:** Assign specific jobs to staff members for accountability and commission tracking.
- **Service Snapshots:** Captures service prices at the moment of job creation to ensure historical billing accuracy.

### 2. Referral & MLM Network
- **3-Tier Commission System:** Automatic calculation of referral bonuses (Configurable defaults: L1: 20%, L2: 10%, L3: 5%).
- **Upline Trace:** Visualize the referral chain for every customer.
- **Partner Ledger:** Detailed reporting on top referral earners and network growth.

### 3. Financial Management
- **Smart Billing:** Itemized invoices with automatic GST calculation and customizable discounts.
- **Multiple Payment Modes:** Support for Cash, UPI, Card, and Online transfers, including "Unpaid/Credit" tracking.
- **Printable Invoices:** Professional PDF-style printouts for customers.
- **WhatsApp Integration:** Quick-send invoice summaries directly to client mobile numbers.
- **Expense Tracker:** Log workshop outflows (Rent, Salary, Utilities) to calculate net margins.

### 4. Staff & Performance
- **Role-Based Access:** ADMIN (Full access) vs STAFF (Restricted to jobs and customers).
- **Labor Commission:** Automatic calculation of technician payouts based on labor charges only (parts are excluded from commission).
- **Efficiency Stats:** Track job release times and technician load.

---

## 📂 File Structure

```text
root/
├── App.tsx             # Main Router and Auth Provider (Minimalist)
├── index.tsx           # Entry point
├── index.html          # Shell with Tailwind and Import Maps
├── types.ts            # TypeScript Interfaces and Enums (Source of Truth)
├── components/         # Reusable UI Components
│   ├── ui/
│   │   ├── AceternityUI.tsx # Luxury UI Kit (Card, Button, Input, Badge)
│   │   └── ColorPicker.tsx  # Advanced car-color selector with hex-matching
│   ├── Login.tsx       # Auth UI (Sign in / Sign up)
│   └── MainLayout.tsx  # Persistent Sidebar & Shell Layout
├── pages/              # Application Views
│   ├── Dashboard.tsx   # Business "Pulse", Trajectory & Alerts
│   ├── JobManager.tsx  # Workflow & Job Card Creation
│   ├── CustomerManager.tsx # Client Directory & Referral Chains
│   ├── EmployeeManager.tsx # Staff Ledger & Performance
│   ├── Billing.tsx     # Invoices, Refunds & Settling Credits
│   ├── ServiceManager.tsx  # Catalog of detailing/mechanical services
│   ├── Expenses.tsx    # Outflow tracking
│   ├── Reports.tsx     # Net Profit & Commission Analytics
│   └── Settings.tsx    # Global variables (GST, Referral Rates)
└── services/           # Backend Logic
    ├── supabase.ts     # Supabase Client Configuration
    └── mockDb.ts       # Database Service Layer (CRUD operations)
```

---

## 🛠 Tech Stack

- **Frontend:** React 19 (Functional Components + Hooks)
- **Routing:** React Router DOM v6
- **Styling:** Tailwind CSS (Modern Glassmorphism & Aceternity UI aesthetics)
- **Backend:** Supabase (PostgreSQL + GoTrue Auth)
- **Icons:** Standard SVG Lucide-style icons

---

## 🛡 Security & Access

### Role-Based Permissions
- **Admin:** Can manage Team, Services, Expenses, Reports, and System Settings.
- **Staff:** Limited to viewing the Dashboard, managing Jobs, and adding Customers.

### System Bootstrap (First Run)
The system features an automatic "Bootstrap" logic. If no employees are present in the database, the **very first user** to sign up and log in is automatically promoted to the **ADMIN** role. All subsequent users default to **STAFF** until promoted by the Admin.

---

## 📋 Installation & Environment
The app expects the following environment variables (handled automatically in this environment):
- `process.env.API_KEY`: Supabase service/anon key.
- Supabase URL: Configured in `services/supabase.ts`.

---

## 📊 Business Logic: The Margin Formula
The **Net Profit** reported in the system is calculated as:
`[Total Revenue] - [Fixed Expenses] - [Technician Commissions] - [Referral Payouts]`
# car-kush
