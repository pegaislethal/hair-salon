# 🌸 Iris Hair Cut and Salon

Iris Hair Cut and Salon is a modern salon management and online reservation web application designed with a luxury, minimalist aesthetic (premium white, black/charcoal typography, and subtle champagne/gold accents).

---

## 🏛️ Project Structure

```text
iris-hair-salon/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── types/
│   │   ├── utils/
│   │   └── styles/
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
│
├── README.md
└── .gitignore
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested with Node v24)
- **MongoDB** running locally or via MongoDB Atlas

---

### 2. Backend Setup & Run

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env` and update values:
   ```bash
   cp .env.example .env
   ```
4. Seed the database (Super Admin, Initial Services & Settings):
   ```bash
   npx ts-node scripts/seed.ts
   ```
5. Run development server:
   ```bash
   npm run dev
   ```
   *The backend will be running at `http://localhost:5000`.*

---

### 3. Frontend Setup & Run

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
4. Build the application:
   ```bash
   npm run build
   ```
5. Run development server:
   ```bash
   npm run dev
   ```
   *The frontend will be running at `http://localhost:3000`.*

---

## 🔑 Default Roles & Access

| Role | Default Email | Default Password | Dashboard URL |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@irissalon.com` | `Admin@123456` | `/admin/dashboard` |
| **Sub Admin** | Created via Admin Portal | Specified on creation | `/sub-admin/dashboard` |
| **Customer** | Registered via `/register` | User choice (min 6 chars) | `/customer/dashboard` |

---

## 💻 Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, Axios, React Hook Form, Zod.
- **Backend**: Express, TypeScript, Node.js, Mongoose (MongoDB), JWT, Bcrypt.
