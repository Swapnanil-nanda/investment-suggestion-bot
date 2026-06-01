# PrimeTrade.ai Backend Developer Assignment 🚀

A secure, scalable REST API featuring JWT Authentication, Role-Based Access Control (RBAC), and dynamic Product Inventory CRUD management, paired with a gorgeous, high-fidelity Vanilla HTML/CSS/JS frontend dashboard.

---

## 🌟 Key Features

### 🔒 Core Backend (API layer)
- **Robust JWT Authentication**: Registration & login APIs with secure password hashing via `bcryptjs` and structured `jsonwebtoken` issuing.
- **Role-Based Access Control (RBAC)**: Clear user levels (`user` vs `admin`). Actions like modifying or deleting a product are strictly validated (only the original creator of that item or an administrator can update/delete it!).
- **Standardized Secondary Entity CRUD**: Complete, versioned `/api/v1/products` endpoints supporting search query filters (`?search=...`), category selectors (`?category=...`), and pagination controls (`?page=...&limit=...`).
- **Comprehensive API Documentation**: High-fidelity Interactive Swagger UI served directly from the Node runtime at `/api-docs`.
- **Advanced API Defenses**: Security headers with `helmet`, CORS validation whitelists, API rate limiting, and defensive input schema validations using `express-validator`.
- **Zero-Config Database**: Automatic dynamic fallback to **MongoDB Memory Server** if no local MongoDB connection URI is configured! Runs instantly out-of-the-box.

### 🎨 Supportive Frontend (SPA client)
- **High-Fidelity UI**: Premium obsidian dark theme with HSL variables, glassmorphic acrylic panels, backdrop blurs, responsive grids, and clean visual layouts.
- **Dynamic Session Handling**: Client-side auth protection guards, redirect hooks, and persistent session tokens in `localStorage`.
- **Visual RBAC Lock System**: Product rows automatically detect if the logged-in session has permissions to edit/delete the record. If not, actions are hidden and replaced with a locked visual indicator.
- **Statistical Analytics Summary**: Renders statistical counters (Total Items, Out-of-Stock alert, Categories distribution) computed live.
- **Interactive Modals**: Seamlessly sliding creation and editing panels.
- **Real-Time Toasts**: Instant validation alerts and success signals.

---

## 🛠️ Tech Stack & Packages

- **Server Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database Model**: MongoDB with Mongoose ODM (featuring dynamic MongoMemoryServer for dev)
- **API Documentation**: Swagger (`swagger-jsdoc` & `swagger-ui-express`)
- **Containerization**: Docker & Docker Compose

---

## 🚀 Setup & Execution Guide

### Option 1: Native Local Installation (Zero-Config!)
The project will run out-of-the-box without requiring a local database setup by automatically spinning up an in-memory database server.

1. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Run Server**:
   ```bash
   npm start
   ```
   *The console will log:*
   `🚀 Server running in development mode on port 5000`  
   `📑 Swagger Documentation available at http://localhost:5000/api-docs`  
   `🌐 Frontend client served at http://localhost:5000`

3. **Navigate to App**:
   - Open your browser and go to: `http://localhost:5000`
   - Access Swagger API documentation at: `http://localhost:5000/api-docs`

---

### Option 2: Docker Container Setup
Ensure you have Docker and Docker Compose installed.

1. **Build & Spin Up Containers**:
   From the project's root folder (`primetrade.ai assignment/`):
   ```bash
   docker-compose up --build
   ```

2. **Access App**:
   - Web App URL: `http://localhost:5000`
   - Interactive API Docs: `http://localhost:5000/api-docs`
   - Server Health Check: `http://localhost:5000/api-v1/health`

---

## 📑 API Endpoints Summary

### Authentication Paths (`/api/v1/auth`)
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Registers a new user. Support roles `user` and `admin`. |
| `POST` | `/login` | Public | Authenticates credentials. Returns JWT. |
| `GET` | `/profile` | Authenticated | Retrieves current authenticated session details. |
| `GET` | `/users` | Admin Only | Retrieves complete registration list (RBAC check). |

### Product Inventory Paths (`/api/v1/products`)
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | Gets products catalog. Supports query filters `?search=...`, `?category=...`, `?page=...&limit=...`. |
| `POST` | `/` | Authenticated | Creates new product entry. Saves owner context. |
| `GET` | `/:id` | Authenticated | Retrieves detailed single product entry. |
| `PUT` | `/:id` | Owner / Admin | Updates product attributes. Blocked for standard users. |
| `DELETE` | `/:id` | Owner / Admin | Deletes product catalog entry. Blocked for standard users. |

---

## 🔒 Security Best Practices Implemented
1. **Bcrypt Salt Rounds**: All passwords are dynamically salted with 12 computational rounds before entering database records.
2. **JWT Signing Verification**: Bearer tokens are decoded on request cycles, verifying signatures and checking DB active user profiles.
3. **Helmet Header Defenses**: Protects against well-known web vulnerabilities (Clickjacking, XSS, MIME sniffing) by setting secure headers.
4. **IP Rate Limiter**: Implements Express rate limits restricting client calls to 100 requests per 15-minute interval.
5. **Escape Sanitization**: Prevents XSS injections inside database saves and template renderings by running escaping functions.
6. **Centralized Mongoose Schema Error Catching**: Prevents raw stack traces from exposing schema internals to API clients.

---

### Project Structure Breakdown
```
primetrade.ai assignment/
├── server/                           # Backend Node/Express Server
│   ├── src/
│   │   ├── config/db.js              # Database & dynamic Memory DB loader
│   │   ├── controllers/              # Business controllers (Auth, Product CRUD)
│   │   ├── middleware/               # Auth checks, RBAC gates, error formatters
│   │   ├── models/                   # Mongoose DB Schemas (User, Product)
│   │   ├── routes/v1/                # Versioned endpoint routers
│   │   ├── utils/                    # Swagger OpenApi docs generators
│   │   └── app.js                    # Express application mounting
│   ├── .env.example                  # Environment file blueprint
│   ├── package.json                  # Manifest configurations
│   └── server.js                     # HTTP server listener entry
├── client/                           # Static Vanilla CSS/JS client
│   ├── index.html                    # Login Screen
│   ├── register.html                 # Sign-up Screen
│   ├── dashboard.html                # Dynamic Inventory Management Dashboard
│   ├── css/style.css                 # Premium dark obsidian stylesheet
│   └── js/
│       ├── api.js                    # Session authorization fetch client
│       ├── auth.js                   # Handles user sign-in & sign-up forms
│       └── dashboard.js             # Table loaders, stat counters, modal actions
├── Dockerfile                        # Multi-stage image build file
├── docker-compose.yml                # Docker orchestrator config
├── README.md                         # Detailed project document
└── SCALABILITY.md                    # Technical scalability notes
```
