# Hire-a-Helper

**Hire-a-Helper** is a full-stack task management marketplace where users can create tasks requiring assistance and others can request to perform those tasks. The platform implements a **one-to-one assignment model**: when a task owner accepts a request, the task is assigned to that requester and all other pending requests are automatically rejected.

## 🚀 Key Features

*   **Secure Authentication**: Multi-stage verification using **6-digit OTPs** (sent via Gmail SMTP) with rate limiting (6 attempts/10-minute block) and JWT-based sessions stored in **HTTP-only cookies**.
*   **Task Management**: Users can create, edit, and browse tasks with details like location, category, and time range.
*   **Request System**: A transactional workflow for sending, accepting, and rejecting task requests.
*   **Automated Background Jobs**: Powered by **node-cron**, a scheduled job runs every minute to detect expired tasks and transition them to a "closed" status.
*   **Media Management**: Integrated **Multer** and **Cloudinary** pipeline for uploading and transforming task images and profile pictures.
*   **Event-Driven Notifications**: An asynchronous system that notifies users about request activity, with the frontend polling for updates every 10 seconds.

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, React Router DOM, Axios, React Toastify, Lucide Icons |
| **Backend** | Node.js, Express.js, JWT, bcryptjs |
| **Database** | MongoDB with Mongoose (UUID primary keys & Transactions) |
| **Automation** | node-cron |
| **Storage** | Cloudinary (Image hosting & transformations) |
| **Email** | Nodemailer (Gmail SMTP for OTPs) |

## 🏗️ Architecture Overview

The project follows a modular, layered architecture to ensure clear separation of concerns:

*   **Client**: React SPA with component-based UI and centralized state management.
*   **API Layer**: RESTful Express routes that delegate to specialized business logic handlers.
*   **Business Logic**: Handler functions that orchestrate database operations and external services.
*   **Data Layer**: Mongoose models utilizing **UUIDs** instead of ObjectIDs for portable, URL-safe identifiers.
*   **Middleware**: Robust pipeline for authentication, file handling (Multer), and CORS configuration.

## 📂 Directory Structure

### Backend
```text
backend/
├── config/         # Database and Email transport configurations
├── db/             # Mongoose schemas and models
├── handlers/       # Pure functions containing core business logic
├── middleware/     # JWT protection and Multer file handling
├── routes/         # HTTP endpoint definitions
├── utils/          # Cloudinary uploads, OTP generation, and cron jobs
└── index.js        # Server entry point
```

### Frontend
```text
webapp/src/
├── components/     # React components (Dashboard, Login, Settings, etc.)
├── constants/      # Shared constants like task categories
├── routes/         # Protected and Public route definitions
├── services/       # Centralized API client (Axios)
└── styles/         # Plain CSS files organized by functional area
```

## 🚥 Getting Started

### Prerequisites
*   Node.js (≥18.0.0)
*   npm (≥8.0.0)
*   MongoDB (≥4.4)
*   Cloudinary & Gmail SMTP (App Password enabled) accounts

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    ```

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    # Create a .env file based on the environment configuration below
    npm run dev  # Starts with nodemon
    ```

3.  **Frontend Setup**:
    ```bash
    cd ../webapp
    npm install
    npm start   # Runs on port 3000
    ```

### Environment Variables (`backend/.env`)

| Variable | Description |
| :--- | :--- |
| `PORT` | Server listening port (default: 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Strong secret for signing session tokens |
| `COOKIE_NAME` | Name for the HTTP-only JWT cookie |
| `FRONTEND_URL` | React app URL for CORS (e.g., http://localhost:3000) |
| `CLOUDINARY_*` | Cloud Name, API Key, and API Secret |
| `GMAIL_PASS` | Gmail App-specific password |
