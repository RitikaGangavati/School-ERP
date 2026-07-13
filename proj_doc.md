# 📚 School ERP - Project Documentation

## Project Overview

**Project Name:** School ERP

**Description:**

School ERP is a web-based application developed to manage school operations efficiently. It provides modules for authentication, user management, students, teachers, attendance, fees, examinations, library, transport, reports, and other administrative activities.

---

# Technology Stack

## Frontend

| Technology        | Purpose            |
| ----------------- | ------------------ |
| React.js          | Frontend Framework |
| Material UI (MUI) | UI Components      |
| Redux Toolkit     | State Management   |
| React Router DOM  | Routing            |
| Axios             | API Communication  |
| Vite              | Build Tool         |

## Backend

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| Node.js    | Runtime Environment           |
| Express.js | Backend Framework             |
| MongoDB    | Database                      |
| Mongoose   | MongoDB ODM                   |
| JWT        | Authentication                |
| bcryptjs   | Password Encryption           |
| dotenv     | Environment Variables         |
| cors       | Cross-Origin Resource Sharing |
| nodemon    | Development Server            |

---

# Project Folder Structure

## Backend

```text
backend/
│
├── controllers/
│   └── authController.js
│
├── db/
│   └── connect.js
│
├── middleware/
│
├── models/
│   └── userModel.js
│
├── routes/
│   └── authRoutes.js
│
├── services/
│
├── utils/
│
├── .env
├── app.js
├── package.json
└── package-lock.json
```

### Backend Folder Description

| Folder      | Description                              |
| ----------- | ---------------------------------------- |
| controllers | Contains business logic for APIs         |
| db          | Database connection files                |
| middleware  | JWT authentication and custom middleware |
| models      | MongoDB schemas                          |
| routes      | API route definitions                    |
| services    | Business/service layer                   |
| utils       | Helper functions                         |
| app.js      | Backend entry point                      |

---

## Frontend

```text
frontend/
│
├── assets/
│
├── components/
│   ├── common/
│   │   └── PasswordField.jsx
│   │
│   └── layout/
│       ├── Sidebar.jsx
│       ├── Navbar.jsx
│       ├── Footer.jsx
│       └── MainLayout.jsx
│
├── pages/
│   ├── login/
│   │   └── Login.jsx
│   │
│   └── dashboard/
│       └── Dashboard.jsx
│
├── redux/
│   ├── auth/
│   └── store.js
│
├── routes/
│   ├── AppRoutes.jsx
│   └── ProtectedRoute.jsx
│
├── services/
│   └── authService.js
│
├── utils/
│   └── axios.js
│
├── App.jsx
├── main.jsx
└── package.json
```

### Frontend Folder Description

| Folder     | Description                              |
| ---------- | ---------------------------------------- |
| assets     | Images, icons and static files           |
| components | Reusable UI components                   |
| pages      | Application pages                        |
| redux      | Global state management                  |
| routes     | Route configuration and protected routes |
| services   | API service files                        |
| utils      | Helper functions and Axios configuration |

---

# Database

## Database Name

```text
school_erp
```

## Current Collection

### users

| Field      | Type               |
| ---------- | ------------------ |
| firstName  | String             |
| lastName   | String             |
| email      | String             |
| password   | String (Encrypted) |
| mobile     | String             |
| profile    | String             |
| role       | String             |
| active     | Boolean            |
| created_at | Timestamp          |
| updated_at | Timestamp          |

---

## Planned Collections

```text
roles
users
students
teachers
parents
classes
subjects
attendance
fees
examinations
library
transport
hostel
reports
settings
```

---

# Project Setup

## Prerequisites

- Node.js
- MongoDB
- Git
- VS Code

---

## Backend Setup

### Install Dependencies

```bash
cd backend
npm install
```

### Create .env File

```env
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/school_erp

JWT_SECRET=your_secret_key
```

### Run Backend

```bash
npm start
```

Backend URL

```text
http://localhost:5000
```

---

## Frontend Setup

### Install Dependencies

```bash
cd frontend
npm install
```

### Create .env File

```env
VITE_API_URL=http://localhost:5000/api
```

### Run Frontend

```bash
npm run dev
```

Frontend URL

```text
http://localhost:5173
```

---

# Development Guidelines

## Backend

- Keep route definitions inside the `routes` folder.
- Business logic should be implemented inside the `controllers` folder.
- Store MongoDB schemas in the `models` folder.
- Use the `services` folder for reusable business logic when required.
- Store helper functions inside the `utils` folder.
- Use middleware for authentication and request validation.
- Keep sensitive information inside the `.env` file.
- Always use async/await with try-catch blocks.
- Return proper HTTP status codes and consistent JSON responses.

---

## Frontend

- Use functional components.
- Use React Hooks.
- Create reusable UI components inside the `components` folder.
- Place page-specific components inside the `pages` folder.
- Use Material UI for all UI components.
- Use Redux Toolkit for global state management.
- Store API calls inside the `services` folder.
- Configure Axios in the `utils` folder.
- Protect authenticated pages using `ProtectedRoute`.
- Avoid hardcoding values; use constants or API responses wherever possible.

---

## Naming Conventions

### Components

Use **PascalCase**

```text
Login.jsx
Dashboard.jsx
Sidebar.jsx
Navbar.jsx
MainLayout.jsx
```

### Variables

Use **camelCase**

```javascript
firstName;
lastName;
userData;
loginUser;
```

### API Routes

Use RESTful naming conventions.

```text
/api/auth/register
/api/auth/login
```

---

# Current Project Status

## Completed

- Project Setup
- MongoDB Connection
- Express Server Configuration
- User Model
- Register API
- Login API
- Password Encryption using bcrypt
- JWT Authentication
- React Login Page
- Redux Authentication
- Axios Configuration
- Protected Routes
- Dashboard Layout
  - Sidebar
  - Navbar
  - Footer
  - MainLayout

---

## In Progress

- Role Master

---

## Planned Modules

- Role Master
- User Management
- Student Management
- Teacher Management
- Parent Management
- Class Management
- Subject Management
- Attendance
- Fees
- Examinations
- Library
- Transport
- Reports
- Settings

---

# Required Dependencies

## Backend Dependencies

### Install All Dependencies

```bash
npm install
```

### Installed Packages

| Package      | Purpose                                          |
| ------------ | ------------------------------------------------ |
| express      | Backend framework                                |
| mongoose     | MongoDB ODM                                      |
| dotenv       | Environment variables                            |
| cors         | Cross-Origin Resource Sharing                    |
| bcryptjs     | Password hashing                                 |
| jsonwebtoken | JWT Authentication                               |
| multer       | File upload handling                             |
| nodemon      | Auto restart development server (dev dependency) |

### Manual Installation (if required)

```bash
npm install express
npm install mongoose
npm install dotenv
npm install cors
npm install bcryptjs
npm install jsonwebtoken
npm install multer
npm install --save-dev nodemon
```

---

## Frontend Dependencies

### Install All Dependencies

```bash
npm install
```

### Installed Packages

| Package             | Purpose                    |
| ------------------- | -------------------------- |
| react               | UI Library                 |
| react-dom           | React DOM Rendering        |
| vite                | Build Tool                 |
| @mui/material       | Material UI Components     |
| @mui/icons-material | Material UI Icons          |
| @emotion/react      | Material UI Styling Engine |
| @emotion/styled     | Material UI Styling Engine |
| react-router-dom    | Routing                    |
| axios               | API Requests               |
| @reduxjs/toolkit    | Redux Toolkit              |
| react-redux         | Redux Binding              |

### Manual Installation (if required)

```bash
npm install @mui/material
npm install @mui/icons-material
npm install @emotion/react
npm install @emotion/styled

npm install react-router-dom
npm install axios

npm install @reduxjs/toolkit
npm install react-redux
```

---

## Verify Installed Packages

### Backend

```bash
npm list
```

### Frontend

```bash
npm list
```

---

## Development Commands

### Backend

Start Development Server

```bash
npm start
```

---

### Frontend

Start Development Server

```bash
npm run dev
```

---
