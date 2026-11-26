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
- These values are server-only. Add them to the backend service's environment in Render, not to the frontend or any `NEXT_PUBLIC_` variable. Also set `NODE_ENV=production` and `FRONTEND_URL` to the deployed Next.js app's public HTTPS origin. `FRONTEND_URL` is allowed by CORS and is also used to build verification and password-reset links. To allow additional frontend origins, set `CORS_ORIGIN` to a comma-separated list of exact HTTPS origins. The backend also allows `http://localhost:3000` and `http://127.0.0.1:3000` for local development. Render does not read your local `.env`.
- The shared backend email service uses Gmail SMTP over TLS, keeps the existing branded HTML templates, and generates a plain-text alternative. Successful sends log a Gmail SMTP message ID; failures log a sanitized SMTP error without logging credentials or message contents. Check Render logs for `[EMAIL] Gmail SMTP accepted message` or `[EMAIL] Gmail SMTP delivery failed`.
- Set the frontend's build-time `NEXT_PUBLIC_API_URL` to the backend's public URL ending in `/api` (for example, `https://<backend-host>/api`; locally this is `http://localhost:5000/api`). Rebuild/redeploy the frontend after changing it.
- Registration stores the account and verification credentials before attempting email delivery. If delivery fails, the registration response says so and offers resend. The verification link requires an explicit confirmation click (rather than verifying on page load); the six-digit email code is also supported. Resending is limited to five requests per IP every 15 minutes and one delivery per account per minute. The resend endpoint uses a generic response to avoid confirming whether an email is registered.

### Render Deployment

The Express backend and Next.js frontend are separate services. For the backend Render Web Service, use:

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Do not use `npm run dev`, `nodemon`, or `ts-node` as the Render Start Command. Those run the development server and can exhaust the small Node heap; the production `npm start` runs the compiled `dist/app.js`. Set `NODE_ENV=production` and the backend environment variables in Render. Do not set `NODE_OPTIONS` to a heap size larger than the service's available memory. If the compiled production process still runs out of memory, increase the Render instance memory.

Deploy the Next.js app separately (the repository's `vercel.json` configures Vercel for the frontend and backend). Set the frontend build-time variable `NEXT_PUBLIC_API_URL` to the backend's public URL ending in `/api` when calling Render directly. A Render backend alone does not serve the Next.js `/services` page.

After deploying the backend, check Render logs for both `Iris Salon API listening` and `[DB] MongoDB connected`. Open `https://<backend-host>/` in a browser to see the JSON confirmation `Salon backend is running`; `https://<backend-host>/api/health` should return HTTP 200 with `{"success":true,"status":"healthy"}`. Then check `https://<backend-host>/api/services` returns a JSON array with active services. In the frontend browser DevTools → Network tab, confirm API requests go to `https://<backend-host>/api/...`, return successfully, and show the frontend origin in `Access-Control-Allow-Origin` (with credentials enabled where needed); there should be no CORS errors or 404s. If an API request fails, check the frontend's `NEXT_PUBLIC_API_URL` and the backend's `FRONTEND_URL`/`CORS_ORIGIN`. If the services API returns an empty array, the production MongoDB database has no active service records; seed the intended database once with `npm run seed` from the backend service shell. Service-catalog database errors are logged with a `[SERVICES]` prefix without returning internal details to visitors.

### Vercel CORS Setup & Verification

In the Vercel project hosting the Express backend, add these environment variables for **Production** (and Preview if used), without quotes or trailing slashes, then redeploy:

```env
FRONTEND_URL=https://hair-salon-w24x.vercel.app
CORS_ORIGIN=https://hair-salon-w24x.vercel.app
```

`CORS_ORIGIN` accepts multiple exact origins as a comma-separated value, for example `https://hair-salon-w24x.vercel.app,https://www.example.com`. `http://localhost:3000` and `http://127.0.0.1:3000` are allowed automatically. If the frontend and backend use the same domain, `/api/...` calls routed by `vercel.json` are same-origin; CORS matters when the browser calls a separate backend origin.

Verify after redeploy:

1. Open `https://hair-salon-w24x.vercel.app/`; expect HTTP 200 and JSON containing `"message":"Salon backend is running"`.
2. In a terminal, send a preflight:
   ```bash
   curl.exe -i -X OPTIONS "https://hair-salon-w24x.vercel.app/api/health" -H "Origin: https://hair-salon-w24x.vercel.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization,content-type"
   ```
   Expect HTTP 204, `Access-Control-Allow-Origin: https://hair-salon-w24x.vercel.app`, `Access-Control-Allow-Credentials: true`, and allowed methods/headers.
3. Open the frontend, then DevTools → Network. Check an API `GET` request and its `OPTIONS` preflight: both should succeed, the response should reflect the frontend origin (never `*` with credentials), and the console should have no CORS or 404 errors. The backend returns a JSON HTTP 403 for requests carrying an unconfigured `Origin`.

If Vercel returns its own `X-Vercel-Error: NOT_FOUND` for `/api/health` (rather than an Express JSON response), fix the Vercel service/rewrite routing for `/api/*`; CORS headers cannot fix a request that never reaches Express. Set the allowlist to the actual frontend origin(s); if the frontend is hosted on another domain, use that domain instead of the example above.

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
