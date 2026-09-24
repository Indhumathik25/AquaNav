# AquaNav

### Navigate Smarter. Save Fuel. Fish Better.

AquaNav is a fishing management and route-planning web application designed to help fishermen record fishing trips, analyze their fishing history, and make data-informed route decisions.

## Features

- 🔐 User registration and login
- 📊 Fishing dashboard
- 🎣 Fishing trip logging
- 📜 Fishing history
- 📈 Fishing analytics
- 🧭 Route optimizer
- 👤 User profile
- 🚪 Secure logout
- 📱 Responsive mobile-friendly interface
- 🔒 User-based trip data protection

## Technology Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- CSS

### Backend
- Python
- FastAPI
- MySQL Connector
- bcrypt
- python-dotenv

### Database
- MySQL
- Aiven MySQL

### Deployment
- Frontend: Render
- Backend: Render
- Database: Aiven MySQL

## Project Architecture

```text
                    AquaNav
                       │
                       ▼
              React + TypeScript
                 Frontend
                       │
                       ▼
                 FastAPI API
                   Backend
                       │
                       ▼
                 Aiven MySQL
                   Database