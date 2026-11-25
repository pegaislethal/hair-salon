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
├── shared/
│   ├── nepalPhone.js
│   ├── nepalPhone.d.ts
│   └── nepalPhone.test.js
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

### Email Verification & Gmail SMTP Configuration

- Enable 2-Step Verification on the Gmail account, then create a Google App Password for mail. Use the generated 16-character password, not the normal Gmail password. If Google Workspace does not offer App Passwords, the account administrator must allow them or provide another SMTP account.
- Set `EMAIL_USER` to the Gmail account, `EMAIL_APP_PASSWORD` to its App Password, `EMAIL_FROM` to the same Gmail address (or a send-as alias configured in Gmail), and `ADMIN_EMAIL` to the salon administrator's address in `backend/.env`. The backend accepts app passwords pasted with spaces and removes those spaces before connecting.
- These values are server-only. Add them to the backend service's environment in Render, not to the frontend or any `NEXT_PUBLIC_` variable. Also set `NODE_ENV=production` and `FRONTEND_URL` to the deployed Next.js app's public HTTPS origin. Render does not read your local `.env`.
- The shared backend email service uses Gmail SMTP over TLS, keeps the existing branded HTML templates, and generates a plain-text alternative. Successful sends log a Gmail SMTP message ID; failures log a sanitized SMTP error without logging credentials or message contents. Check Render logs for `[EMAIL] Gmail SMTP accepted message` or `[EMAIL] Gmail SMTP delivery failed`.
- Set the frontend's `NEXT_PUBLIC_API_URL` to the backend's public URL ending in `/api` (locally this is `http://localhost:5000/api`). This is a frontend build-time variable.
- Registration stores the account and verification credentials before attempting email delivery. If delivery fails, the registration response says so and offers resend. The verification link requires an explicit confirmation click (rather than verifying on page load); the six-digit email code is also supported. Resending is limited to five requests per IP every 15 minutes and one delivery per account per minute. The resend endpoint uses a generic response to avoid confirming whether an email is registered.

### Nepal Phone Validation & Optional Verification

- Signup and customer profile accept 10-digit Nepal mobile numbers beginning with `98` or `97`, with optional `+977`, spaces, or hyphens. Phone numbers are stored as E.164 (`+97798XXXXXXXX`).
- Phone verification is optional and available from the customer profile; bookings require a valid phone number but do not require verification. Verification uses the existing `SMS_PROVIDER`, `SMS_API_KEY`, and `SMS_SENDER_ID` backend settings. Codes expire after 10 minutes, are stored as keyed hashes, and are protected by request and attempt limits.
- Run the shared normalization tests with `node --test shared/nepalPhone.test.js`.
- To confirm invalid values are blocked before network traffic, open browser DevTools → Network, enter an invalid signup/profile number (for example `9612345678`), and try to submit or request a code. The relevant `/api/auth/register`, `/api/auth/profile`, or `/api/auth/phone/request-verification` request must not appear. For booking, use an account with an invalid stored phone; the request button should be disabled and `/api/appointments` should not be sent.

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
