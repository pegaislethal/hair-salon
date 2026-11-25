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
4. Seed the database (Super Admin, salon services & settings; safe to rerun without duplicating services):
   ```bash
   npm run seed
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

### Email Verification & Render Configuration

- For local email testing, set `RESEND_API_KEY` in `backend/.env`. The example sender `onboarding@resend.dev` is restricted to testing with the email address associated with your Resend account. `RESEND_TEST_MODE=true` redirects messages to `EMAIL_TEST_RECIPIENT` (or `ADMIN_EMAIL`).
- For live email, verify your sending domain in Resend and set `EMAIL_FROM` to an address on that domain, such as `Iris Salon <noreply@your-verified-domain.com>`. On Render, set `NODE_ENV=production`, `RESEND_API_KEY`, `EMAIL_FROM`, `RESEND_TEST_MODE=false`, and `FRONTEND_URL` to the public HTTPS origin of the deployed Next.js app. Render does not read your local `.env`.
- Set the frontend's `NEXT_PUBLIC_API_URL` to the backend's public URL ending in `/api` (locally this is `http://localhost:5000/api`). This is a frontend build-time variable.
- Registration stores the account and verification credentials before attempting email delivery. If delivery fails, the registration response says so and offers resend. The verification link requires an explicit confirmation click (rather than verifying on page load); the six-digit email code is also supported. Resending is limited to five requests per IP every 15 minutes and one delivery per account per minute. Resend uses a generic response to avoid confirming whether an email is registered.
- After testing, check Render logs for `[EMAIL] Resend accepted message` and its `providerMessageId`, or `[EMAIL] Resend delivery failed` with the provider error. A Resend message ID means Resend accepted the request; check the message's status in the Resend Emails dashboard to confirm delivery, bounce, or rejection.

---

## Scheduling & Recruitment Setup

- Services and barber profiles are managed from the Super Admin dashboard. Configure each barber's assigned services, weekly hours, breaks, and days off before accepting online bookings.
- Appointment availability is calculated from active services, salon/barber hours, holidays, breaks, and existing bookings. New requests remain pending until an administrator accepts them.
- Public job applications accept PDF, DOC, or DOCX CVs. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env` to enable CV uploads; hiring and vacancy management remain available without applicant uploads configured.
- The public careers page is `/join-us`; Super Admin manages hiring and applicant decisions from `/admin/recruitment`. Sub Admins have read-only recruitment and barber schedule views.

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
