# odoo-indus-hackathon-2026
Solution for Odoo x Indus University Hackathon 2026

# CoreInventory IMS
### Odoo × Indus University Hackathon 2026

![Node](https://img.shields.io/badge/Node.js-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-blue)
![Hackathon](https://img.shields.io/badge/Hackathon-Odoo%20x%20Indus-orange)

CoreInventory IMS is a **modern inventory management system** designed to manage **products, warehouses, inventory levels, suppliers, customers, and stock movements** in real time.

The system provides a **REST API backend and a modern frontend dashboard**, enabling businesses to track inventory operations efficiently.

This project was built during the **Odoo × Indus University Hackathon 2026** to demonstrate a scalable **ERP-style inventory module** similar to systems used in enterprise resource planning platforms.

---

# 📌 Project Overview

The goal of CoreInventory IMS is to simulate a **lightweight ERP inventory module** capable of managing the full lifecycle of inventory operations.

The system supports:

- Product management
- Warehouse management
- Inventory tracking
- Stock movement operations
- Inventory adjustments
- Supplier management
- Customer management
- Stock ledger history

All inventory changes are recorded in a **ledger system** to maintain full traceability.

---

# 🏗 System Architecture

**Frontend**  
React + Vite

**Backend**  
Node.js + Express

**Database**  
SQLite

**API Communication**  
REST APIs

Project Structure:
odoo-indus-hackathon-2026
│
├── backend
│ ├── models
│ ├── routes
│ ├── controllers
│ ├── middleware
│ ├── db
│ └── server.js
│
├── frontend
│ ├── src
│ ├── public
│ └── vite.config.js
│
├── package.json
└── README.md


---

# ✨ Features

## Product Management
- Create and manage products
- SKU tracking
- Category management
- Reorder level alerts

## Warehouse Management
- Support multiple warehouses
- Track product stock per warehouse

## Inventory Tracking
- Real-time stock quantity updates
- Inventory stored per product and warehouse

## Stock Movement Ledger
Every inventory change is logged with:

- Movement type
- Quantity change
- Updated balance
- Timestamp

Supported movement types:

- Receipt
- Delivery
- Transfer
- Adjustment

## Inventory Adjustments
Allows manual correction of inventory after physical stock checks.

## Supplier Management
- Add suppliers
- Store contact details
- Manage supplier database

## Customer Management
- Add customers
- Track customer deliveries
- Manage customer records

---

# 🛠 Technology Stack

## Frontend
- React
- Vite
- Axios
- React Router

## Backend
- Node.js
- Express.js
- JWT Authentication
- Socket.io

## Database
- SQLite

## Development Tools
- Git
- GitHub
- Postman

---

# ⚙ Installation

Clone the repository

---

# ✨ Features

## Product Management
- Create and manage products
- SKU tracking
- Category management
- Reorder level alerts

## Warehouse Management
- Support multiple warehouses
- Track product stock per warehouse

## Inventory Tracking
- Real-time stock quantity updates
- Inventory stored per product and warehouse

## Stock Movement Ledger
Every inventory change is logged with:

- Movement type
- Quantity change
- Updated balance
- Timestamp

Supported movement types:

- Receipt
- Delivery
- Transfer
- Adjustment

## Inventory Adjustments
Allows manual correction of inventory after physical stock checks.

## Supplier Management
- Add suppliers
- Store contact details
- Manage supplier database

## Customer Management
- Add customers
- Track customer deliveries
- Manage customer records

---

# 🛠 Technology Stack

## Frontend
- React
- Vite
- Axios
- React Router

## Backend
- Node.js
- Express.js
- JWT Authentication
- Socket.io

## Database
- SQLite

## Development Tools
- Git
- GitHub
- Postman

---

# ⚙ Installation

Clone the repository
https://github.com/VeerHaria/odoo-indus-hackathon-2026.git

Move into the project directory
cd odoo-indus-hackathon-2026

Install dependencies
npm install

Install frontend dependencies
cd frontend
npm install


---

# ▶ Running the Project

Run both backend and frontend simultaneously
GET /products
POST /products

Backend will run on:


http://localhost:5000


Frontend will run on:


http://localhost:5173


---

# 📡 API Endpoints

## Products

GET /products
POST /products


## Warehouses

GET /warehouses
POST /warehouses


## Inventory

GET /inventory
POST /inventory


## Stock Movements

GET /stock-movements
POST /stock-movements


## Stock Ledger

GET /stock-movements/ledger


## Adjustments

GET /adjustments
POST /adjustments


## Suppliers

GET /suppliers
POST /suppliers


## Customers

GET /customers
POST /customers


---

# 🧪 API Testing

The APIs can be tested using **Postman**.

Recommended testing flow:

1. Create product
2. Create warehouse
3. Add inventory
4. Perform stock movement
5. Verify ledger entry
6. Record adjustment
7. Add supplier
8. Add customer

---

# 🚀 Future Improvements

Potential enhancements include:

- Real-time inventory dashboard
- Role-based authentication
- Advanced analytics and reports
- QR code product scanning
- Automated low-stock alerts
- Full ERP integration modules

---

This project was created for **educational and hackathon purposes**.
