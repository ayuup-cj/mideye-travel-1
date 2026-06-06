# Mideye – Integrated Flight Booking & Cargo Management System

> **Complete technical documentation and learning guide.**
> This README always reflects the current state of the project.
> Every time a new feature is added, this document is updated.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Concept](#2-system-concept)
3. [Objectives](#3-objectives)
4. [Features](#4-features)
5. [Project Structure](#5-project-structure)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [Database Design](#8-database-design)
9. [Authentication System](#9-authentication-system)
10. [User Dashboard](#10-user-dashboard)
11. [Admin Dashboard](#11-admin-dashboard)
12. [Booking System](#12-booking-system)
13. [Cargo System](#13-cargo-system)
14. [Tracking System](#14-tracking-system)
15. [API Endpoints](#15-api-endpoints)
16. [Security](#16-security)
17. [How to Run the Project](#17-how-to-run-the-project)
18. [Current Status](#18-current-status)
19. [Future Improvements](#19-future-improvements)
20. [Developer Notes](#20-developer-notes)

---

## 1. Project Overview

**Mideye** is a full-stack web application built for a local travel agency in **Galkacyo, Somalia**. It lets customers book domestic flights and submit cargo shipping requests online. Staff (admins) can then manage those requests through a protected admin dashboard.

| Item | Detail |
|---|---|
| **Project Name** | Mideye – Integrated Flight Booking & Cargo Management System |
| **Type** | Semi-automated travel management system |
| **Location** | Galkacyo, Somalia |
| **Frontend** | HTML5, CSS3, Bootstrap 5, JavaScript (ES6) |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL (via XAMPP) |
| **ORM** | Sequelize |
| **Authentication** | JWT (JSON Web Tokens) + bcrypt |
| **Server Port** | `http://localhost:5000` |

### What "semi-automated" means

This is **not** a fully automated system like booking.com. In this system:

- Users **submit** flight and cargo requests online
- An **admin** reviews and processes each request manually
- Payment happens **outside** the system (in person or by phone)
- The system is a **management tool**, not a full marketplace

---

## 2. System Concept

Think of Mideye like a digital booking form that replaces paper. Here is the big picture:

```
CUSTOMER                        ADMIN
   │                              │
   │  Visits website              │
   │  Creates account             │
   │  Submits booking request ──► Admin sees it in dashboard
   │  Submits cargo request  ──► Admin sees it in dashboard
   │                              │
   │                              Admin confirms / updates status
   │                              │
   │◄── User dashboard shows ─────┘
        updated status
```

The system has **two roles**:
- **User** — a regular customer who books flights or ships cargo
- **Admin** — a staff member who manages all requests

---

## 3. Objectives

1. **Replace paper forms** — customers fill forms online instead of visiting the office
2. **Centralize data** — all bookings and cargo requests stored in one database
3. **Reduce errors** — typed data is more accurate than handwritten notes
4. **Track cargo** — every cargo shipment gets a unique tracking ID (e.g., `MDY-0001`)
5. **Role-based access** — regular users cannot see admin data; admins can see everything
6. **Secure accounts** — passwords are hashed, sessions use JWT tokens

---

## 4. Features

### Currently Implemented ✅

| Feature | Description |
|---|---|
| User Registration | Create a new account with name, email, phone, password |
| User Login | Login with email + password, receive JWT token |
| Role-Based Access | Admin and User roles with separate dashboards |
| Flight Booking | Submit a flight booking request |
| Cargo Submission | Submit a cargo shipping request |
| Cargo Tracking | Search shipment by tracking ID |
| User Dashboard | View own bookings, cargo, profile, statistics |
| Admin Dashboard | View and manage all users, bookings, cargo |
| Default Admin Account | Auto-created on first server start |
| Auth Guards | Pages redirect unauthenticated users automatically |
| Dynamic Navbar | Shows Dashboard link and username when logged in |
| Responsive Design | Works on mobile, tablet, and desktop |
| Password Change | Users can change their own password |
| Profile Update | Users can update their name and phone |

### Not Yet Implemented 🔲

| Feature | Notes |
|---|---|
| Online Payment | Payments handled in person |
| Real-time Notifications | No email/SMS alerts yet |
| PDF Receipts | Planned future feature |
| Flight Search Engine | Routes are predefined, not dynamic |
| Admin Reports Page | Planned, not yet connected |

---

## 5. Project Structure

```
Mideye travel agency/
│
├── templates/                    ← All HTML pages live here
│   ├── index.html                ← Homepage
│   ├── booking.html              ← Book a flight
│   ├── cargo.html                ← Submit cargo request
│   ├── tracking.html             ← Track a shipment
│   ├── login.html                ← Login page
│   ├── register.html             ← Register page
│   ├── admin.html                ← Admin dashboard
│   └── user-dashboard.html       ← User dashboard
│
├── server/                       ← Node.js backend lives here
│   ├── config/
│   │   └── database.js           ← MySQL connection via Sequelize
│   ├── controllers/
│   │   ├── authController.js     ← Register, Login logic
│   │   ├── bookingController.js  ← Booking CRUD
│   │   ├── cargoController.js    ← Cargo CRUD + tracking
│   │   ├── adminController.js    ← Admin data access
│   │   └── userController.js     ← User profile, stats
│   ├── middleware/
│   │   ├── auth.js               ← JWT verification, role guards
│   │   └── validate.js           ← Input validation error handler
│   ├── models/
│   │   ├── User.js               ← User table definition
│   │   ├── Booking.js            ← Bookings table definition
│   │   ├── Cargo.js              ← Cargo table definition
│   │   └── index.js              ← Model associations
│   ├── routes/
│   │   ├── authRoutes.js         ← /api/auth/*
│   │   ├── userRoutes.js         ← /api/user/*
│   │   ├── bookingRoutes.js      ← /api/bookings/*
│   │   ├── cargoRoutes.js        ← /api/cargo/*
│   │   └── adminRoutes.js        ← /api/admin/*
│   ├── utils/
│   │   └── generateTrackingId.js ← Creates MDY-0001 style IDs
│   ├── app.js                    ← Express app setup
│   ├── server.js                 ← Server entry point + admin seed
│   ├── .env                      ← Secret config (not in git)
│   ├── .env.example              ← Template for .env
│   └── mideye_schema.sql         ← Database schema
│
├── sections-image/               ← Images used on the site
├── style.css                     ← Main stylesheet (inner pages)
├── style1.css                    ← Homepage-specific stylesheet
├── styles.css                    ← Additional styles
├── api.js                        ← Frontend API integration
├── auth-guard.js                 ← Frontend route protection
├── main.js                       ← Shared frontend JavaScript
├── script.js                     ← Additional JS
└── README.md                     ← This file
```

---

## 6. Frontend Architecture

### Why HTML files are in `templates/`

The HTML files were moved into a `templates/` subfolder to keep the project root clean. The backend serves them from there. All asset paths (CSS, JS, images) use `../` to step back up to the root where those files live.

---

### `templates/index.html` — Homepage

**What it does:** The public face of Mideye. Visitors see a hero section, available destinations, how the service works, and calls to action to book or track.

**Key components:**
- Hero section with animated stats counter (5000+ travelers, 12 destinations, 8 years)
- Flight search strip (UI demo, not connected to live data)
- Destination cards
- "How it works" section
- Testimonials
- Footer with contact info

**JavaScript (main.js handles):**
- Navbar scroll behavior — becomes solid after 60px of scroll
- Active nav link detection based on URL
- AOS (Animate On Scroll) library initialization
- Counter animations for hero stats
- `initDashboardNav()` — checks localStorage, shows Dashboard link and username if logged in

**Stylesheet:** `../style1.css` (homepage has its own styles for the hero section)

---

### `templates/booking.html` — Book a Flight

**What it does:** Lets users fill in a flight booking form. The form submits to the backend and saves the request in the database.

**Form fields:**
- Trip type (One Way / Round Trip)
- Origin and Destination cities
- Travel date (and return date if round trip)
- Number of adults, children, infants
- Cabin class (Economy / Business)
- Passenger name, phone, email
- Seat preference and special requests

**Backend connection:** `POST /api/bookings`

**JavaScript (api.js handles):**
- Form submission via `fetch()`
- Shows success/error alert
- Button loading state while submitting

**Stylesheet:** `../style.css`

---

### `templates/cargo.html` — Submit Cargo Request

**What it does:** Lets users request cargo shipping. The backend saves the request and generates a unique tracking ID.

**Form fields:**
- Sender name, phone, email, address
- Recipient name, phone
- Origin and Destination
- Cargo type, number of pieces, weight (kg)
- Dimensions (length × width in cm)
- Cargo description (textarea)
- Shipping speed (Standard / Express)
- Insurance checkbox
- Fragile / Signature Required checkboxes
- Special instructions

**Backend connection:** `POST /api/cargo` → returns a `tracking_id` like `MDY-0001`

**Stylesheet:** `../style.css`

---

### `templates/tracking.html` — Track a Shipment

**What it does:** A user types a tracking ID (e.g., `MDY-0001`) and the page shows the current status and timeline of that shipment.

**How it works:**
1. User enters a tracking ID
2. Page calls `GET /api/track/:tracking_id`
3. Backend looks up the cargo in the database
4. Response shows: sender, recipient, route, current status, timestamps

**Status values:** `Received` → `In Transit` → `Arrived`

**Stylesheet:** `../style.css`

---

### `templates/login.html` — Login Page

**What it does:** Existing users log in with their email and password.

**Flow:**
1. User fills email + password
2. `api.js` sends `POST /api/auth/login`
3. If successful: backend returns a JWT token + user info
4. Frontend stores token in `localStorage` as `mideye_token`
5. Frontend stores user info as `mideye_user` (JSON)
6. If role = `admin` → redirect to `admin.html`
7. If role = `user` → redirect to `user-dashboard.html`

**Auth guard:** If already logged in, automatically redirects away from login page.

**Stylesheet:** `../style.css`

---

### `templates/register.html` — Register Page

**What it does:** New users create an account.

**Flow:**
1. User fills name, email, phone, password, confirm password
2. `api.js` sends `POST /api/auth/register`
3. Backend creates the user, hashes the password, returns a JWT token
4. Frontend stores token and redirects to `user-dashboard.html`

**Rules:**
- Role is always set to `user` on registration (admin accounts are created by seeding)
- Password must be at least 6 characters
- Email must be unique

**Auth guard:** If already logged in, automatically redirects away.

**Stylesheet:** `../style.css`

---

### `templates/admin.html` — Admin Dashboard

**What it does:** The control panel for staff. Shows all users, bookings, and cargo in data tables. Admins can update statuses.

**Sections:**
- **Dashboard** — stats cards (Total Users, Total Bookings, Total Cargo)
- **Users** — searchable table of all registered users with delete option
- **Bookings** — searchable table of all booking requests, status update modal
- **Cargo** — searchable table of all cargo requests, status update modal

**Auth guard:** If not logged in OR role is not `admin`, shows "Access Denied" overlay and redirects to `user-dashboard.html`.

**Backend connections:**
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/bookings`
- `GET /api/admin/cargo`
- `PUT /api/bookings/:id`
- `PUT /api/cargo/:id`
- `DELETE /api/admin/users/:id`

---

### `templates/user-dashboard.html` — User Dashboard

**What it does:** A personal area for regular users to see their own activity.

**Sidebar navigation:**
- Dashboard (overview + stats)
- My Bookings (full table of own bookings)
- My Cargo (full table of own cargo requests)
- Profile Settings (edit name, phone, change password)
- Back to Website link
- Book a Flight / Ship Cargo quick links

**Stats widgets:**
- Total Bookings
- Total Cargo Requests
- Pending Bookings
- Cargo In Transit

**Auth guard:** If not logged in, redirects to `login.html`. If admin lands here, redirects to `admin.html`.

**Backend connections:**
- `GET /api/user/stats`
- `GET /api/user/bookings`
- `GET /api/user/cargo`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `PUT /api/user/change-password`

---

## 7. Backend Architecture

The backend is a **Node.js + Express.js** REST API that runs on port `5000`.

### `server/server.js` — Entry Point

This is the first file that runs when you start the server.

**What it does:**
1. Loads environment variables from `.env`
2. Connects to MySQL via `connectDB()`
3. Syncs Sequelize models (creates tables if they don't exist)
4. Runs `seedAdmin()` — checks if `admin@mideye.com` exists; if not, creates it with a bcrypt-hashed password
5. Starts Express on port 5000
6. Prints a startup summary with all API endpoints

---

### `server/app.js` — Express Application

**What it does:** Sets up the Express app — CORS, body parsers, static file serving, routes, 404 handler, and global error handler.

**Key configurations:**
```
Static files → served from project root (CSS, JS, images)
/templates   → served from templates/ folder (HTML pages)
GET /        → redirects to /templates/index.html
/api/auth    → auth routes
/api/user    → user routes
/api/bookings → booking routes
/api/cargo   → cargo routes
/api/admin   → admin routes
/api/track/:id → public tracking endpoint
```

**CORS origins allowed:**
- `http://localhost:3000`
- `http://localhost:5500` (VS Code Live Server)
- `http://127.0.0.1:5500`

---

### `server/config/database.js` — Database Connection

Uses **Sequelize** to connect to MySQL. It reads credentials from `.env`:

```
DB_HOST=localhost
DB_NAME=mideye_db
DB_USER=root
DB_PASSWORD=
```

On successful connection, prints `✅ MySQL connected successfully`.

---

### Controllers

Controllers contain the business logic. Each controller handles one resource.

#### `authController.js`

| Function | Purpose |
|---|---|
| `register` | Validate input, hash password with bcrypt, create user, return JWT |
| `login` | Find user by email, compare password with bcrypt, return JWT |
| `getMe` | Return the currently logged-in user's data (used for auth checks) |

#### `bookingController.js`

| Function | Purpose |
|---|---|
| `createBooking` | Save a new booking to the database (status = Pending) |
| `getBookings` | Admin gets all bookings; user gets only their own |
| `getBookingById` | Get one booking by ID |
| `updateBookingStatus` | Admin changes status (Pending → Confirmed → Completed) |

#### `cargoController.js`

| Function | Purpose |
|---|---|
| `createCargo` | Generate tracking ID, save cargo request |
| `getCargo` | Admin gets all cargo; user gets their own |
| `getCargoById` | Get one cargo record by ID |
| `updateCargoStatus` | Admin changes status (Received → In Transit → Arrived) |
| `trackCargo` | Public lookup by tracking ID (no login required) |

#### `userController.js`

| Function | Purpose |
|---|---|
| `getProfile` | Return current user's profile |
| `updateProfile` | Update name and phone |
| `changePassword` | Verify old password, hash new one, save |
| `getUserBookings` | Return only the logged-in user's bookings |
| `getUserCargo` | Return only the logged-in user's cargo |
| `getUserStats` | Return aggregated counts for dashboard widgets |

#### `adminController.js`

| Function | Purpose |
|---|---|
| `getAllUsers` | Return all registered users |
| `getAllBookings` | Return all bookings with user info |
| `getAllCargo` | Return all cargo records |
| `getDashboardStats` | Return total counts for admin stats cards |
| `deleteUser` | Remove a user from the database |

---

### Middleware

Middleware are functions that run **between** the request arriving and the controller handling it.

#### `auth.js`

| Middleware | Purpose |
|---|---|
| `authenticateToken` | Reads JWT from `Authorization: Bearer <token>` header, verifies it, attaches user to `req.user` |
| `isAdmin` | Runs after `authenticateToken`; blocks the request if `req.user.role !== 'admin'` |
| `isUser` | Runs after `authenticateToken`; blocks the request if `req.user.role !== 'user'` |
| `protect` | Alias for `authenticateToken` (backwards compatibility) |
| `adminOnly` | Alias for `isAdmin` (backwards compatibility) |

#### `validate.js`

Reads validation errors from `express-validator` and returns a `400 Bad Request` response with the error messages. Used on registration and login routes.

---

### Models

Models define the **shape of database tables** using Sequelize.

#### `User.js`

```
id          → Auto-increment integer
full_name   → String, required
email       → String, unique, required
phone       → String, optional
password    → String (bcrypt hash), required
role        → ENUM('user', 'admin'), default 'user'
created_at  → Timestamp
updated_at  → Timestamp
```

#### `Booking.js`

```
id                → Auto-increment integer
user_id           → Foreign key → users.id (nullable for guest bookings)
trip_type         → ENUM('oneway', 'roundtrip')
passenger_name    → String
phone             → String
email             → String
origin            → String
destination       → String
travel_date       → Date
return_date       → Date (optional)
adults            → Integer, default 1
children          → Integer, default 0
infants           → Integer, default 0
cabin_class       → ENUM('economy', 'business')
seat_preference   → String
special_requests  → Text
status            → ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled'), default 'Pending'
created_at        → Timestamp
updated_at        → Timestamp
```

#### `Cargo.js`

```
id                  → Auto-increment integer
tracking_id         → String, unique (e.g., MDY-0001)
user_id             → Foreign key → users.id (nullable)
sender_name         → String
sender_phone        → String
sender_email        → String
sender_address      → String
recipient_name      → String
recipient_phone     → String
origin              → String
destination         → String
cargo_type          → String
pieces              → Integer
weight              → Decimal
length_cm           → Decimal
width_cm            → Decimal
description         → Text
shipping_speed      → ENUM('standard', 'express')
insurance           → Boolean
fragile             → Boolean
signature_required  → Boolean
special_requests    → Text
status              → ENUM('Received', 'In Transit', 'Arrived', 'Cancelled'), default 'Received'
created_at          → Timestamp
updated_at          → Timestamp
```

#### `models/index.js` — Associations

Defines how tables relate to each other:

```javascript
User.hasMany(Booking)       // one user → many bookings
Booking.belongsTo(User)     // each booking belongs to one user

User.hasMany(Cargo)         // one user → many cargo requests
Cargo.belongsTo(User)       // each cargo belongs to one user
```

---

### `utils/generateTrackingId.js`

This utility generates unique cargo tracking IDs in the format `MDY-XXXX`.

**How it works:**
1. Queries the `cargo` table for the most recently inserted record
2. Reads its tracking ID (e.g., `MDY-0005`)
3. Increments the number by 1
4. Returns `MDY-0006`
5. If no records exist yet, starts at `MDY-0001`

This ensures every shipment gets a unique, human-readable ID.

---

## 8. Database Design

### Database name: `mideye_db`

### Tables overview

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  users   │──1:N──│   bookings   │       │  cargo   │
│          │       │              │       │          │
│ id (PK)  │       │ id (PK)      │  1:N  │ id (PK)  │
│ full_name│       │ user_id (FK) │◄──────│ user_id  │
│ email    │       │ origin       │       │ tracking │
│ phone    │       │ destination  │       │ _id      │
│ password │       │ status       │       │ status   │
│ role     │       └──────────────┘       └──────────┘
└──────────┘
```

### Relationships explained

- One **User** can have **many Bookings** (a customer can book multiple flights)
- One **User** can have **many Cargo** requests (same customer ships multiple times)
- Each **Booking** belongs to exactly one **User**
- Each **Cargo** record belongs to exactly one **User**
- Guest bookings/cargo (no account) set `user_id` to `NULL`

### Status lifecycle

**Booking statuses:**
```
Pending → Confirmed → Completed
                   → Cancelled
```

**Cargo statuses:**
```
Received → In Transit → Arrived
                     → Cancelled
```

---

## 9. Authentication System

### How JWT authentication works

**JWT** (JSON Web Token) is a way to prove who you are without storing sessions on the server.

Think of it like a stamped ticket:
- When you log in, the server creates a "ticket" (token) signed with a secret key
- You carry that ticket in every future request
- The server reads the ticket to know who you are, without checking the database every time

### Login flow (step by step)

```
1. User submits email + password
2. Backend finds the user by email
3. bcrypt.compare(password, stored_hash) → true/false
4. If match → jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '7d' })
5. Token sent back to the browser
6. Frontend stores: localStorage.setItem('mideye_token', token)
7. Frontend stores: localStorage.setItem('mideye_user', JSON.stringify(user))
8. Redirect based on role:
   - admin → admin.html
   - user  → user-dashboard.html
```

### How protected routes work

Every protected API endpoint runs `authenticateToken` middleware first:

```
Request arrives → middleware reads Authorization header
              → verifies token with jwt.verify()
              → looks up user in database
              → attaches user to req.user
              → passes to controller
```

If the token is missing, expired, or invalid → the request is rejected with `401 Unauthorized`.

### Role-based authorization

After token verification, some routes also run `isAdmin`:

```
GET /api/admin/users
         ↓
authenticateToken  →  req.user = { role: 'admin' }
         ↓
isAdmin  →  role === 'admin' ? next() : 403 Forbidden
         ↓
adminController.getAllUsers()
```

### Frontend auth guards (`auth-guard.js`)

The browser-side guard runs **immediately** when a protected page loads (before any content is visible):

| Page type | Guard used | If fails |
|---|---|---|
| Admin pages (`admin.html`) | `AuthGuard.requireAdmin()` | Shows "Access Denied", redirects to `user-dashboard.html` |
| User pages (`user-dashboard.html`) | `AuthGuard.requireUser()` | Redirects to `login.html` |
| Guest pages (`login.html`, `register.html`) | `AuthGuard.requireGuest()` | Redirects to appropriate dashboard |

### Default admin account

Created automatically on the **first server start**:

```
Email    : admin@mideye.com
Password : Admin@123
Role     : admin
```

The `seedAdmin()` function in `server.js` checks if this account exists on every startup. If it does not exist, it creates it with a freshly bcrypt-hashed password.

### Logout

Logging out simply removes the token and user data from localStorage:

```javascript
localStorage.removeItem('mideye_token');
localStorage.removeItem('mideye_user');
window.location.reload(); // or redirect to login.html
```

Since JWT is stateless, there is nothing to delete on the server side.

---

## 10. User Dashboard

### What a regular user can see and do

When a user logs in, they land on `user-dashboard.html`. This page only shows data that belongs to **that specific user**.

### Stats widgets

The dashboard fetches `GET /api/user/stats` which returns:

| Stat | What it counts |
|---|---|
| Total Bookings | All booking requests by this user |
| Total Cargo | All cargo requests by this user |
| Pending Bookings | Bookings with status "Pending" |
| Cargo In Transit | Cargo with status "In Transit" |

### My Bookings section

Fetches `GET /api/user/bookings` — returns only this user's bookings, sorted newest first. Displayed in a searchable table with status badges (color-coded).

### My Cargo section

Fetches `GET /api/user/cargo` — returns only this user's cargo, sorted newest first. Shows tracking ID, recipient, destination, weight, shipping speed, and status.

### Profile Settings

- **Edit profile:** `PUT /api/user/profile` — update name and phone number
- **Change password:** `PUT /api/user/change-password` — requires entering current password first

### Sidebar navigation

The sidebar stays fixed on the left. Each item switches the visible section without a page reload (single-page behavior using JavaScript `display` toggling).

---

## 11. Admin Dashboard

### What an admin can see and do

The admin dashboard (`admin.html`) shows **all data** from all users.

### Stats section

Fetches `GET /api/admin/stats`:
- Total Users registered
- Total Booking requests
- Total Cargo requests

### Users table

Fetches `GET /api/admin/users` — shows all registered accounts.
- Admin can delete a user: `DELETE /api/admin/users/:id`
- Includes: name, email, role, registration date

### Bookings table

Fetches `GET /api/admin/bookings` — shows every booking from every user.
- Admin can update status via a modal: `PUT /api/bookings/:id`
- Status options: Pending → Confirmed → Completed → Cancelled
- Includes: passenger name, phone, route, travel date, cabin class

### Cargo table

Fetches `GET /api/admin/cargo` — shows every cargo request from every user.
- Admin can update status via a modal: `PUT /api/cargo/:id`
- Status options: Received → In Transit → Arrived → Cancelled
- Includes: tracking ID, sender, recipient, destination, weight, speed

### Search / filter

Each table has a client-side search input. Typing filters rows instantly without hitting the server.

### Sidebar navigation

The admin sidebar has links to each section plus a "View Website" link that returns to `index.html`. Because the auth guard on the homepage detects an admin session, the navbar automatically shows a "Dashboard" link back to `admin.html`.

---

## 12. Booking System

### Full booking workflow

```
STEP 1: User visits booking.html
STEP 2: Fills the booking form
STEP 3: Clicks "Submit Booking Request"
STEP 4: api.js sends POST /api/bookings with form data
STEP 5: Backend validates the input (express-validator)
STEP 6: If user is logged in, booking is linked to their user_id
STEP 7: Booking saved to database with status = "Pending"
STEP 8: Backend returns { success: true, booking: {...} }
STEP 9: Frontend shows success message
STEP 10: User can see booking in their dashboard (status: Pending)
STEP 11: Admin sees it in the admin dashboard
STEP 12: Admin updates status → "Confirmed"
STEP 13: User's dashboard now shows "Confirmed"
STEP 14: Admin marks as "Completed" after the flight date
```

### Booking validation rules

| Field | Rule |
|---|---|
| first_name | Required, not empty |
| last_name | Required, not empty |
| email | Required, valid email format |
| phone | Required, not empty |
| origin | Required, not empty |
| destination | Required, not empty |
| travel_date | Required, valid date |

---

## 13. Cargo System

### Full cargo workflow

```
STEP 1: User visits cargo.html
STEP 2: Fills all sender, recipient, and shipment details
STEP 3: Clicks "Register Cargo"
STEP 4: api.js sends POST /api/cargo
STEP 5: Backend generates a unique tracking ID (e.g., MDY-0042)
STEP 6: Cargo saved to database with status = "Received"
STEP 7: Response includes the tracking ID
STEP 8: User copies tracking ID to track later
STEP 9: Admin sees the new cargo in admin dashboard
STEP 10: Admin updates → "In Transit" when shipment departs
STEP 11: Admin updates → "Arrived" when delivered
STEP 12: User can track at any time using the tracking ID
```

### Tracking ID generation

The tracking ID format is: `MDY-XXXX` where XXXX is a zero-padded number.

```
MDY-0001  ← first ever cargo
MDY-0002  ← second
MDY-0042  ← forty-second
```

The `generateTrackingId()` function:
1. Looks at the last record in the cargo table
2. Gets its tracking number
3. Adds 1
4. Zero-pads to 4 digits
5. Returns the new ID

---

## 14. Tracking System

### How public tracking works

The tracking endpoint is **public** — no login required. This is intentional because a customer may share a tracking ID with someone who doesn't have an account.

```
GET /api/track/MDY-0042
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cargo": {
      "tracking_id": "MDY-0042",
      "sender_name": "Ahmed Ali",
      "recipient_name": "Fatima Hassan",
      "origin": "Galkacyo",
      "destination": "Mogadishu",
      "cargo_type": "Electronics",
      "weight": "5",
      "status": "In Transit",
      "created_at": "2026-06-01T10:00:00Z"
    }
  }
}
```

**On `tracking.html`:** The user sees a visual progress bar (Received → In Transit → Arrived) and shipment details rendered dynamically by JavaScript.

---

## 15. API Endpoints

All endpoints are prefixed with `http://localhost:5000`.

### Authentication — `/api/auth`

| Method | URL | Protection | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create new user account |
| POST | `/api/auth/login` | Public | Login, receive JWT token |
| GET | `/api/auth/me` | JWT required | Get current logged-in user |

### User — `/api/user`

| Method | URL | Protection | Purpose |
|---|---|---|---|
| GET | `/api/user/profile` | JWT required | Get own profile |
| PUT | `/api/user/profile` | JWT required | Update name and phone |
| PUT | `/api/user/change-password` | JWT required | Change password |
| GET | `/api/user/stats` | JWT required | Get own stats for dashboard |
| GET | `/api/user/bookings` | JWT required | Get own bookings |
| GET | `/api/user/cargo` | JWT required | Get own cargo requests |

### Bookings — `/api/bookings`

| Method | URL | Protection | Purpose |
|---|---|---|---|
| POST | `/api/bookings` | Public | Submit a new booking |
| GET | `/api/bookings` | JWT required | Get bookings (own if user, all if admin) |
| GET | `/api/bookings/:id` | JWT required | Get one booking by ID |
| PUT | `/api/bookings/:id` | Admin only | Update booking status |

### Cargo — `/api/cargo`

| Method | URL | Protection | Purpose |
|---|---|---|---|
| POST | `/api/cargo` | Public | Submit new cargo request |
| GET | `/api/cargo` | JWT required | Get cargo (own if user, all if admin) |
| GET | `/api/cargo/:id` | JWT required | Get one cargo by ID |
| PUT | `/api/cargo/:id` | Admin only | Update cargo status |

### Tracking — `/api/track`

| Method | URL | Protection | Purpose |
|---|---|---|---|
| GET | `/api/track/:tracking_id` | **Public** | Track a shipment by tracking ID |

### Admin — `/api/admin`

| Method | URL | Protection | Purpose |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin only | Total users, bookings, cargo counts |
| GET | `/api/admin/users` | Admin only | All registered users |
| GET | `/api/admin/bookings` | Admin only | All bookings |
| GET | `/api/admin/cargo` | Admin only | All cargo records |
| DELETE | `/api/admin/users/:id` | Admin only | Delete a user |

### Health check

| Method | URL | Protection | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Confirm server is running |

---

## 16. Security

### Password Hashing (bcrypt)

Passwords are **never stored in plain text**. When a user registers:

```
plain text: "Admin@123"
         ↓  bcrypt.hash(password, saltRounds=12)
stored:  "$2a$12$LQv3c1yqBWVHxkd0LH..."
```

When logging in, `bcrypt.compare(entered, stored)` returns `true` or `false`. Even if the database is leaked, the passwords cannot be reversed.

### JWT Token Verification

Every protected API call must include:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The `authenticateToken` middleware:
1. Reads the token from the header
2. Calls `jwt.verify(token, process.env.JWT_SECRET)`
3. If expired or tampered → `401 Unauthorized`
4. If valid → decodes `{ id, email, role }` and fetches the full user from the database

### Role Authorization

Even if a user somehow gets a valid JWT token, the `isAdmin` middleware checks their role:
```javascript
if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
```

### Frontend Route Protection

The `auth-guard.js` script runs **immediately** on protected pages (it's in `<head>` before the page body renders). It hides the entire page (`visibility: hidden`) until it confirms the user has the right access level. If not, it shows a "🔒 Access Denied" overlay before redirecting.

### Input Validation

All form submissions are validated with `express-validator` before reaching the database:
- Required fields are checked for emptiness
- Email fields must be valid email format
- Passwords must be at least 6 characters
- Dates must be valid date values

### Environment Variables

Sensitive config (database password, JWT secret) is stored in `server/.env` — never in the code itself.

```
PORT=5000
DB_HOST=localhost
DB_NAME=mideye_db
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
```

---

## 17. How to Run the Project

### Prerequisites

- **XAMPP** installed (for MySQL)
- **Node.js** v18+ installed
- **npm** installed

### Step 1 — Start MySQL

Open your terminal and run:
```bash
sudo /opt/lampp/lampp startmysql
```

### Step 2 — Create the database

Open phpMyAdmin at `http://localhost/phpmyadmin` and create a database named `mideye_db`. Then import `server/mideye_schema.sql`.

Or use the terminal:
```bash
/opt/lampp/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS mideye_db;"
/opt/lampp/bin/mysql -u root mideye_db < "/home/cj/Pictures/Mideye travel agency/server/mideye_schema.sql"
```

### Step 3 — Install backend dependencies (first time only)

```bash
cd "/home/cj/Pictures/Mideye travel agency/server"
npm install
```

### Step 4 — Start the backend server

```bash
cd "/home/cj/Pictures/Mideye travel agency/server"
npm run dev
```

You will see:
```
✅ MySQL connected successfully via Sequelize
✅ Default admin account created → admin@mideye.com / Admin@123
╔══════════════════════════════════════════════════╗
║        Mideye Travel Agency – API Server         ║
║  Status   : Running                              ║
║  Port     : 5000                                 ║
╚══════════════════════════════════════════════════╝
```

### Step 5 — Open the website

Visit: **http://localhost:5000/templates/index.html**

Or directly:
- Homepage → `http://localhost:5000/templates/index.html`
- Login → `http://localhost:5000/templates/login.html`
- Admin → `http://localhost:5000/templates/admin.html`

### Default admin credentials

```
Email    : admin@mideye.com
Password : Admin@123
```

---

## 18. Current Status

### Completed ✅

| Component | Status |
|---|---|
| Project folder structure | ✅ Done |
| MySQL database + 3 tables | ✅ Done |
| User registration & login | ✅ Done |
| JWT authentication | ✅ Done |
| bcrypt password hashing | ✅ Done |
| Role-based access (admin / user) | ✅ Done |
| Frontend auth guards | ✅ Done |
| Admin dashboard UI + data | ✅ Done |
| User dashboard UI + data | ✅ Done |
| Flight booking form + backend | ✅ Done |
| Cargo request form + backend | ✅ Done |
| Cargo tracking by ID | ✅ Done |
| Tracking ID auto-generation | ✅ Done |
| Admin status update (bookings) | ✅ Done |
| Admin status update (cargo) | ✅ Done |
| User profile edit | ✅ Done |
| User password change | ✅ Done |
| Dynamic navbar (auth-aware) | ✅ Done |
| Dashboard link for admins & users | ✅ Done |
| Auto-seed admin account | ✅ Done |
| HTML files in `templates/` folder | ✅ Done |
| Consistent navbar across all pages | ✅ Done |
| Responsive design | ✅ Done |

### Pending 🔲

| Component | Notes |
|---|---|
| Admin Reports page | UI exists, not connected |
| PDF generation | Planned feature |
| Email notifications | No email system yet |
| SMS alerts | No SMS integration |
| Online payment | Not in scope currently |
| Flight schedule management | Predefined routes only |
| Image uploads | Profile photos not supported |
| Admin user role change | Admin cannot change user roles yet |

---

## 19. Future Improvements

| Improvement | Why it would help |
|---|---|
| **Email confirmations** | Users get a confirmation email when booking is approved |
| **PDF ticket generation** | Users download a PDF receipt after confirmation |
| **Admin analytics charts** | Visual charts of monthly bookings and cargo volume |
| **Search flights dynamically** | Connect to actual flight schedule data |
| **Multi-language support** | Add Somali language option for local users |
| **Mobile app** | React Native or Flutter version for easier access |
| **Payment gateway** | Connect EVC Plus or Hormuud Pay for online payments |
| **Push notifications** | Notify users when cargo status changes |
| **Audit log** | Track every admin action with timestamp |
| **Booking cancellation by user** | Allow users to cancel their own bookings |

---

## 20. Developer Notes

> This section teaches you the project step by step. Read this if you want to understand why things were built the way they were.

---

### Why Node.js and not PHP?

Node.js allows the same language (JavaScript) to be used on both the frontend (browser) and backend (server). This makes it easier to maintain. It is also fast and has a huge library ecosystem (npm).

---

### Why Sequelize instead of raw MySQL queries?

Writing raw SQL is error-prone for beginners. Sequelize lets you define your database tables as JavaScript objects (called models) and automatically writes the SQL for you. It also handles relationships, validations, and migration-like syncing.

---

### Why JWT instead of sessions?

Sessions store login state on the server. JWT stores it on the client (in localStorage). This means the server does not need to remember who is logged in — it just reads the signed token. This works well for APIs that are called from browsers.

---

### Why two CSS files (`style.css` and `style1.css`)?

- `style1.css` is the **homepage stylesheet**. The homepage has a special hero section with a transparent navbar, overlay gradients, and floating cards. These styles would conflict with inner pages.
- `style.css` is the **inner pages stylesheet**. It has a warm beige background, solid navbar, and card shadows designed for form pages.

---

### Why is `auth-guard.js` in `<head>` not at the bottom?

If you place the auth guard at the bottom of the page (like most scripts), the page content briefly flashes before the redirect happens. This is called "flash of unauthorized content." By loading it in `<head>` immediately, the page hides itself before anything renders.

---

### Why are HTML files in `templates/`?

Separating HTML pages from the root folder keeps the project organized. CSS, JS, and images remain at the root. HTML pages live in `templates/`. The Express server is configured to serve both correctly.

---

### Why does the Cargo have a tracking ID but Booking does not?

Cargo shipments need to be tracked over time (received → moving → arrived). A tracking ID lets anyone (even without an account) follow the shipment. Bookings are tied to a specific passenger and confirmed by phone, so a reference number is less critical.

---

### How does the auto-seed work?

Every time the server starts, `seedAdmin()` runs:
```javascript
const exists = await User.findOne({ where: { email: 'admin@mideye.com' } });
if (exists) return; // already there, do nothing
await User.create({ ..., password: bcrypt.hash('Admin@123') });
```

This is safe to run multiple times because it always checks first.

---

### How do I add a new feature?

1. Add a new column to a model if needed (Sequelize will auto-add it on `sync`)
2. Write a new function in the appropriate controller
3. Add a route in the appropriate routes file
4. Call the route from the frontend using `fetch()` in `api.js`
5. Update the relevant HTML page to display the result
6. Update this README

---

*Last updated: June 2026 — reflects all features currently implemented in the Mideye system.*
