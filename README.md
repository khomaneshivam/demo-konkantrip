# KonkanTrip Hospitality Backend API

> **High-Performance Hospitality Management & Booking Availability Backend Engine**

[![Test Coverage](https://img.shields.io/badge/coverage-95.54%25-brightgreen.svg)]()
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)]()
[![OpenAPI](https://img.shields.io/badge/swagger-OpenAPI%203.0-orange.svg)](http://localhost:3000/api-docs)

---

## 📖 Overview

KonkanTrip Hospitality Backend provides a complete RESTful API solution for managing hospitality properties, rooms, dynamic inventory calendars, stop-sell controls, owner registrations, admin dashboards, and master catalogs across the Konkan tourism region.

For the full in-depth codebase guide and functional specifications of every single file, refer to the **[Developer Documentation](DEVELOPER_DOCUMENTATION.md)**.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0+ (Tested with v22+)
- **MySQL**: 8.0+

### 2. Installation
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (or use existing `.env`):
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=evolware_konkantrip
DB_PORT=3306
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Database Setup
Execute the clean SQL schema and optional seed data in MySQL:
1. `evolware_konkantrip.sql` — Schema and table definitions
2. `dummy_records.sql` — 5+ seed records per table

```bash
mysql -u root -p evolware_konkantrip < evolware_konkantrip.sql
mysql -u root -p evolware_konkantrip < dummy_records.sql
```

### 5. Running the Application
```bash
# Start development server with live reload
npm run dev

# Start production server
npm start
```

---

## 🧪 Testing & Code Coverage

The project is backed by comprehensive unit and integration tests using Node's native test runner with **95.54% overall line coverage**.

```bash
# Run all automated tests
npm test

# Run tests with experimental coverage report
npm run coverage
```

---

## 📚 Interactive API Documentation (Swagger)

When the server is running, explore and test all API endpoints interactively:

- **Swagger UI:** `http://localhost:3000/api-docs`
- **Raw OpenAPI JSON Spec:** `http://localhost:3000/api-docs.json`
- **Health Check Endpoint:** `http://localhost:3000/api/v1/health`

---

## 📁 Repository Structure

```
backend/
├── DEVELOPER_DOCUMENTATION.md    # Complete Developer Handbook & Function Guide
├── evolware_konkantrip.sql       # Production Database Schema DDL
├── dummy_records.sql             # 5+ Seed Records per table
├── server.js                     # Application Entry Point & Global Middlewares
├── swagger.js                    # OpenAPI 3.0 Assembler
├── package.json                  # Dependencies & Scripts
├── src/
│   ├── config/                   # MySQL2 Database Connection Pool
│   ├── controllers/              # Business Logic & Controllers
│   │   ├── admin/                # Admin Dashboard & Approvals
│   │   ├── auth/                 # Owner & Admin Authentication, Logs, Passwords
│   │   ├── inventory/            # Room Inventory, Daily Calendar, Stop Sell
│   │   ├── lookups/              # Master Catalogs, Amenities & Room Types
│   │   ├── properties/           # Property CRUD & 11 Sub-Resources
│   │   └── rooms/                # Room Types, Beds, Images, Amenities
│   ├── docs/                     # Modular Swagger / OpenAPI Specs
│   ├── middlewares/              # JWT Auth, Validation, RBAC, Admin Guards
│   ├── routes/                   # Modular Express Routers
│   └── utils/                    # Request Metadata & Token Blacklist Cache
└── test/                         # 14 Automated Test Suites (95.54% Coverage)
```

---

## 📄 License
ISC
