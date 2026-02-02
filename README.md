# 🩺 VaxTrack - Immunization Management System

A comprehensive, full-stack web application for managing immunization records, patient data, vaccine stock, and generating coverage reports for health facilities.

## 🌟 Features

### 👥 Role-Based Access Control (RBAC)
- **🏥 Health Worker**: Patient registration, vaccination recording, basic reporting
- **👨‍💼 Facility Manager**: Full facility management, staff oversight, inventory, advanced reporting  
- **🏛️ Government Official**: System administration, multi-facility oversight, policy management

### 🔧 Key Functionalities

#### 🔐 Authentication & Authorization
- Secure JWT-based authentication with 30-minute sessions
- Role-based route guards and permissions
- Auto-login with secure token storage

#### 👤 Patient Management
- Patient registration with comprehensive validation
- Advanced search (by name, phone, national ID)
- Complete vaccination history tracking
- Guardian information management

#### 💉 Vaccination Recording
- Record vaccinations with batch tracking
- Automatic next appointment scheduling
- Adverse event reporting system
- Dose number validation and scheduling

#### 📦 Stock Management
- Real-time vaccine stock levels
- Low stock alerts and notifications
- Batch tracking with expiry date monitoring
- Stock status indicators (Good/Low/Critical/Expired)

#### 📅 Appointment Management
- Today's appointments dashboard
- Date-based filtering and search
- SMS reminder system integration
- Appointment status tracking

#### 📊 Reporting & Analytics
- Vaccination coverage reports
- Statistical dashboards with charts
- Dropout rate calculations
- CSV export functionality
- Multi-facility reporting (for officials)

## 🛠️ Technology Stack

### Frontend
- **Framework**: Angular 21 with TypeScript
- **Styling**: SCSS with responsive design
- **UI Components**: Custom component library
- **Charts**: Chart.js with ng2-charts
- **HTTP**: Angular HttpClient with interceptors
- **Date Handling**: date-fns library

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Security**: Spring Security with JWT
- **Database**: PostgreSQL with JPA/Hibernate
- **Migration**: Flyway for database versioning
- **API**: RESTful APIs with comprehensive validation

### Database
- **Primary**: PostgreSQL 13+
- **ORM**: Hibernate with JPA
- **Migration**: Flyway scripts
- **Features**: UUID primary keys, soft deletes, audit trails

## 🏗️ Project Structure

```
VaxTrack/
├── immunizationdatabase-frontend/vaxtrack-web/    # Angular Frontend
│   ├── src/app/
│   │   ├── core/                    # Core services, models, guards
│   │   ├── pages/                   # Feature pages (admin, manager, vaccinator)
│   │   └── shared/                  # Shared components and utilities
│   └── src/environments/            # Environment configurations
├── immunizationdb-backend/          # Spring Boot Backend
│   ├── src/main/java/com/immunizationdb/
│   │   ├── auth/                    # Authentication & authorization
│   │   ├── patient/                 # Patient management
│   │   ├── vaccination/             # Vaccination records
│   │   ├── inventory/               # Stock management
│   │   └── reporting/               # Reports and analytics
│   └── src/main/resources/
│       ├── db/migration/            # Flyway database migrations
│       └── application.yml          # Application configuration
└── docs/                            # Documentation and setup scripts
```

## 🚀 Quick Start (Local Development)

### 📋 Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Java** 17+ ([Download](https://adoptium.net/))
- **Maven** 3.6+ ([Download](https://maven.apache.org/))
- **PostgreSQL** 13+ ([Download](https://www.postgresql.org/))

### ⚡ Automated Setup (Windows)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/donjunior01/Immunization-Management-Sytem-group5-project-.git
   cd Immunization-Management-Sytem-group5-project-
   ```

2. **Run the setup script**:
   ```bash
   setup-local-dev.bat
   ```

3. **Start the development environment**:
   ```bash
   start-dev.bat
   ```

### 🔧 Manual Setup

#### 1. Database Setup
```sql
-- Connect to PostgreSQL as superuser and run:
CREATE DATABASE immunizationdb;
CREATE USER root WITH PASSWORD 'root';
GRANT ALL PRIVILEGES ON DATABASE immunizationdb TO root;
```

#### 2. Backend Setup
```bash
cd immunizationdb-backend
mvn clean install
mvn spring-boot:run
```
Backend will be available at: `http://localhost:8080/api`

#### 3. Frontend Setup
```bash
cd immunizationdatabase-frontend/vaxtrack-web
npm install
ng serve
```
Frontend will be available at: `http://localhost:4200`

## 🔑 Test Credentials

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| Health Worker | `health.worker` | `Password123!` | Patient management, basic reporting |
| Facility Manager | `facility.manager` | `Password123!` | Full facility management |
| Government Official | `gov.official` | `Password123!` | System administration |

## 🌐 Live Demo

- **Frontend**: [https://donjunior01.github.io/Immunization-Management-Sytem-group5-project-/](https://donjunior01.github.io/Immunization-Management-Sytem-group5-project-/)
- **Backend API**: [https://immunizationdb-backend.onrender.com/api](https://immunizationdb-backend.onrender.com/api)
- **Health Check**: [https://immunizationdb-backend.onrender.com/api/actuator/health](https://immunizationdb-backend.onrender.com/api/actuator/health)

## 📱 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Core Endpoints
- `GET /api/patients` - List patients
- `POST /api/patients` - Create new patient
- `GET /api/patients/{id}` - Get patient details
- `POST /api/vaccinations` - Record vaccination
- `GET /api/vaccinations/patient/{id}` - Get patient vaccinations
- `GET /api/inventory/stock` - Get stock levels
- `GET /api/appointments` - List appointments
- `GET /api/reports/coverage` - Coverage reports

### Admin Endpoints
- `GET /api/users` - User management
- `POST /api/users` - Create new user
- `GET /api/sms/logs` - SMS logs

## ✅ Features Implemented

### Core Features
- ✅ **Authentication System** - JWT-based with role management
- ✅ **Patient Registration** - Complete patient lifecycle management
- ✅ **Vaccination Recording** - Comprehensive vaccination tracking
- ✅ **Stock Management** - Real-time inventory with alerts
- ✅ **Appointment System** - Scheduling and reminder system
- ✅ **Reporting Dashboard** - Analytics and coverage reports

### Technical Features
- ✅ **Responsive Design** - Mobile-first approach
- ✅ **Real-time Updates** - Live data synchronization
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Loading States** - User-friendly loading indicators
- ✅ **Form Validation** - Client and server-side validation
- ✅ **Security** - CORS, CSRF protection, input sanitization

### Advanced Features
- ✅ **SMS Integration** - Africa's Talking SMS gateway
- ✅ **Data Export** - CSV export functionality
- ✅ **Audit Trails** - Complete action logging
- ✅ **Soft Deletes** - Data preservation with recovery
- ✅ **Database Migrations** - Version-controlled schema changes

## 📱 Responsive Design

Fully responsive across all devices:
- **Desktop** (1920px+) - Full dashboard experience
- **Laptop** (1024px-1920px) - Optimized layouts
- **Tablet** (768px-1024px) - Touch-friendly interface
- **Mobile** (320px-768px) - Mobile-first design

## 🌍 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🧪 Testing

### Frontend Testing
```bash
cd immunizationdatabase-frontend/vaxtrack-web
npm test                    # Run unit tests
ng e2e                      # Run end-to-end tests
```

### Backend Testing
```bash
cd immunizationdb-backend
mvn test                    # Run unit tests
mvn integration-test        # Run integration tests
```

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd immunizationdatabase-frontend/vaxtrack-web
npm run build:prod

# Backend
cd immunizationdb-backend
mvn clean package -Pprod
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Cloud Deployment
- **Frontend**: Deployed on GitHub Pages
- **Backend**: Deployed on Render.com
- **Database**: PostgreSQL on Render.com

## 🔧 Development Scripts

| Script | Description |
|--------|-------------|
| `setup-local-dev.bat` | Complete local development setup |
| `start-dev.bat` | Start both frontend and backend |
| `start-frontend.bat` | Start only frontend server |
| `start-backend.bat` | Start only backend server |
| `setup-database.sql` | Database initialization script |

## 📊 System Requirements

### Minimum Requirements
- **RAM**: 4GB
- **Storage**: 2GB free space
- **CPU**: Dual-core processor
- **Network**: Internet connection for API calls

### Recommended Requirements
- **RAM**: 8GB+
- **Storage**: 5GB+ free space
- **CPU**: Quad-core processor
- **Network**: Stable broadband connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the Immunization Management System for health facilities. All rights reserved.

## 🆘 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/donjunior01/Immunization-Management-Sytem-group5-project-/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Email**: Contact the development team for enterprise support

## 🎯 Roadmap

### Upcoming Features
- 📱 Mobile app (React Native)
- 🔔 Push notifications
- 📈 Advanced analytics dashboard
- 🌍 Multi-language support
- 📋 QR code integration

---

**🎉 VaxTrack - Making immunization management simple, efficient, and accessible for everyone.**
