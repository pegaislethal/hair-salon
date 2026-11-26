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
- These values are server-only. Add them to the backend Vercel project's environment, not to the frontend or any `NEXT_PUBLIC_` variable. Set `NODE_ENV=production` and `FRONTEND_URL` to the deployed Next.js app's public HTTPS origin. `FRONTEND_URL` is also used to build verification and password-reset links. Set `CORS_ORIGIN` to the exact frontend origin (or comma-separated allowed origins). The backend also allows `http://localhost:3000` and `http://127.0.0.1:3000` for local development.
- The shared backend email service uses Gmail SMTP over TLS, keeps the existing branded HTML templates, and generates a plain-text alternative. Successful sends log a Gmail SMTP message ID; failures log a sanitized SMTP error without logging credentials or message contents. Check backend deployment logs for `[EMAIL] Gmail SMTP accepted message` or `[EMAIL] Gmail SMTP delivery failed`.
- Set the frontend's build-time `NEXT_PUBLIC_API_URL` to the backend origin without a path (for example, `https://hair-salon-w24x.vercel.app`; locally this is `http://localhost:5000`). The frontend adds `/api` because that is the prefix used by the Express route mounts. Rebuild/redeploy the frontend after changing this variable.
- Registration stores the account and verification credentials before attempting email delivery. If delivery fails, the registration response says so and offers resend. The verification link requires an explicit confirmation click (rather than verifying on page load); the six-digit email code is also supported. Resending is limited to five requests per IP every 15 minutes and one delivery per account per minute. The resend endpoint uses a generic response to avoid confirming whether an email is registered.

### Vercel Deployment & API Verification

The frontend and backend are deployed separately. Configure these environment variables in the matching Vercel projects for **Production** (and Preview if used), without quotes or trailing slashes:

```env
# Frontend Vercel project (build-time)
NEXT_PUBLIC_API_URL=https://hair-salon-w24x.vercel.app

# Backend Vercel project
FRONTEND_URL=https://hair-salon-gray-mu.vercel.app
CORS_ORIGIN=https://hair-salon-gray-mu.vercel.app,https://hair-salon-chohatmap-pegas-projects-be8fc807.vercel.app
```

Keep `FRONTEND_URL` set to the canonical frontend URL used in verification and password-reset links. `CORS_ORIGIN` can include the canonical origin and any active Vercel preview origins as a comma-separated list; update it when preview URLs change. The backend route definitions are mounted at `/api/auth`, `/api/gallery`, and `/api/services`, so the corresponding public endpoints are `/api/auth/login`, `/api/gallery`, and `/api/services`. The centralized frontend Axios client appends `/api` to the configured backend origin, including when the origin is configured with a trailing slash or already ends in `/api`. Local development origins are allowed automatically.

Redeploy **both** Vercel projects after applying these code changes: the frontend build needs the API URL environment variable, and the backend deployment needs the API rewrite/handler and CORS update. Verify after redeploy:

1. Open `https://hair-salon-w24x.vercel.app/`; expect HTTP 200 and JSON containing `"message":"Salon backend is running"`. The health route should return `{"success":true,"status":"healthy"}` at `/api/health`.
2. In a terminal, send a preflight:
   ```powershell
   curl.exe -i -X OPTIONS "https://hair-salon-w24x.vercel.app/api/health" -H "Origin: https://hair-salon-gray-mu.vercel.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization,content-type"
   ```
   Expect HTTP 204 and `Access-Control-Allow-Origin: https://hair-salon-gray-mu.vercel.app`.
3. Open the frontend and check the browser Network panel. Login should call `https://hair-salon-w24x.vercel.app/api/auth/login`; gallery and services should call `/api/gallery` and `/api/services` on that backend host. If `/api/health` returns Vercel's `X-Vercel-Error: NOT_FOUND`, the backend deployment is not routing requests through its Express API handler.

### Bulk Gallery Add

- Sign in as a Super Admin and open `/admin/gallery` → **Bulk Add**. Choose multiple JPG, PNG, GIF, or WebP files (up to 20 files, 5 MB each), or add image URLs one at a time. Set per-item titles/captions and shared category, comma-separated tags, and public visibility before submitting.
- File uploads are stored in Cloudinary, so configure the backend's `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. URL-based batches do not upload files and do not require Cloudinary.
- The modal shows upload progress and item-by-item results. A failed item does not prevent other valid items from being created. Active entries appear in `/gallery` under their category; inactive entries remain visible to admins but are hidden publicly.
- The API is `POST /api/gallery/bulk` and requires an authenticated `super_admin` or `sub_admin` token. To verify authorization, send the request without a token and confirm it returns HTTP 401; an authenticated customer should receive HTTP 403. The admin page calls the protected `GET /api/gallery/admin` endpoint to include both active and hidden records.
- To smoke-test the complete flow, add two valid URLs with different titles, submit, and confirm the success count in the modal/toast and the new items in `/admin/gallery`. Then open `/gallery` and check the selected category. The UI blocks malformed URLs before submission. To verify server-side partial validation, use an authorized API client to submit a batch containing one valid URL and one malformed URL in the `metadata.items` array; expect HTTP 207 with the valid item in `data` and the invalid item in `errors`.

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
