# VaxTrack Web Application

A comprehensive, responsive Angular web application for managing immunization records, patient data, vaccine stock, and generating coverage reports.

## Features

### Role-Based Access Control (RBAC)
- **Admin**: User management, SMS logs, system overview
- **Vaccinator**: Patient registration, vaccination recording, stock viewing, appointment management
- **District Officer**: Coverage reports, analytics, data export

### Key Functionalities

1. **Authentication & Authorization**
   - Secure JWT-based authentication
   - Role-based route guards
   - Auto-login with token storage

2. **Patient Management**
   - Patient registration with validation
   - Patient search (by name, phone, ID)
   - Patient details and vaccination history

3. **Vaccination Recording**
   - Record vaccinations with batch tracking
   - Automatic appointment scheduling
   - Adverse event reporting
   - Dose number validation

4. **Stock Management**
   - Real-time stock levels
   - Low stock alerts
   - Batch tracking with expiry dates
   - Stock status indicators (Good/Low/Critical)

5. **Appointment Management**
   - Today's appointments view
   - Date-based filtering
   - SMS reminder tracking

6. **Reporting & Analytics**
   - Coverage reports
   - Vaccination statistics
   - Penta dropout rate calculation
   - CSV export functionality

## Technology Stack

- **Framework**: Angular 21
- **Styling**: SCSS with responsive design
- **Animations**: Angular Animations
- **HTTP Client**: Angular HttpClient with interceptors
- **Date Handling**: date-fns
- **Charts**: Chart.js (ng2-charts) - ready for implementation

## Project Structure

```
src/app/
├── core/
│   ├── models/          # Data models and interfaces
│   ├── services/        # API services
│   ├── guards/          # Route guards (auth, role)
│   └── interceptors/    # HTTP interceptors
├── pages/
│   ├── landing/         # Landing page
│   ├── login/           # Login page
│   ├── admin/           # Admin dashboard & user management
│   ├── vaccinator/      # Vaccinator dashboards and features
│   └── district/       # District officer dashboards and reports
└── shared/
    └── components/      # Reusable components (loader, alert, modal, layout)
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v21)

### Installation

1. Navigate to the project directory:
```bash
cd vaxtrack-web
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
   - Update `src/environments/environment.ts` with your backend API URL
   - Default: `http://localhost:8080`

4. Start development server:
```bash
ng serve
```

5. Open browser:
   - Navigate to `http://localhost:4200`

## Build for Production

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## API Integration

The application expects a Spring Boot backend with the following endpoints:

- `POST /api/v1/auth/login` - Authentication
- `GET /api/v1/patients` - Patient management
- `POST /api/v1/vaccinations` - Vaccination recording
- `GET /api/v1/stock` - Stock levels
- `GET /api/v1/appointments` - Appointments
- `GET /api/v1/reports/coverage` - Coverage reports
- `GET /api/v1/users` - User management (Admin only)
- `GET /api/v1/sms-logs` - SMS logs (Admin only)

## Features Implemented

✅ Landing page with feature showcase
✅ Login page with form validation
✅ Role-based dashboards
✅ Patient registration and search
✅ Vaccination recording with validation
✅ Stock level viewing with status indicators
✅ Appointment management
✅ Coverage reports and analytics
✅ User management (Admin)
✅ Responsive design
✅ Loading states and error handling
✅ Confirmation modals
✅ Alert notifications
✅ Professional animations

## Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px - 1920px)
- Tablet (768px - 1024px)
- Mobile (320px - 768px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Running unit tests
```bash
ng test
```

### Code scaffolding
```bash
ng generate component component-name
```

## License

This project is part of the Immunization Management System for health facilities in Cameroon.

## Support

For issues or questions, please contact the development team.

│   ├── models/          # Data models and interfaces
│   ├── services/        # API services
│   ├── guards/          # Route guards (auth, role)
│   └── interceptors/    # HTTP interceptors
├── pages/
│   ├── landing/         # Landing page
│   ├── login/           # Login page
│   ├── admin/           # Admin dashboard & user management
│   ├── vaccinator/      # Vaccinator dashboards and features
│   └── district/       # District officer dashboards and reports
└── shared/
    └── components/      # Reusable components (loader, alert, modal, layout)
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v21)

### Installation

1. Navigate to the project directory:
```bash
cd vaxtrack-web
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
   - Update `src/environments/environment.ts` with your backend API URL
   - Default: `http://localhost:8080`

4. Start development server:
```bash
ng serve
```

5. Open browser:
   - Navigate to `http://localhost:4200`

## Build for Production

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## API Integration

The application expects a Spring Boot backend with the following endpoints:

- `POST /api/v1/auth/login` - Authentication
- `GET /api/v1/patients` - Patient management
- `POST /api/v1/vaccinations` - Vaccination recording
- `GET /api/v1/stock` - Stock levels
- `GET /api/v1/appointments` - Appointments
- `GET /api/v1/reports/coverage` - Coverage reports
- `GET /api/v1/users` - User management (Admin only)
- `GET /api/v1/sms-logs` - SMS logs (Admin only)

## Features Implemented

✅ Landing page with feature showcase
✅ Login page with form validation
✅ Role-based dashboards
✅ Patient registration and search
✅ Vaccination recording with validation
✅ Stock level viewing with status indicators
✅ Appointment management
✅ Coverage reports and analytics
✅ User management (Admin)
✅ Responsive design
✅ Loading states and error handling
✅ Confirmation modals
✅ Alert notifications
✅ Professional animations

## Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px - 1920px)
- Tablet (768px - 1024px)
- Mobile (320px - 768px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Running unit tests
```bash
ng test
```

### Code scaffolding
```bash
ng generate component component-name
```

## License

This project is part of the Immunization Management System for health facilities in Cameroon.

## Support

For issues or questions, please contact the development team.

│   ├── models/          # Data models and interfaces
│   ├── services/        # API services
│   ├── guards/          # Route guards (auth, role)
│   └── interceptors/    # HTTP interceptors
├── pages/
│   ├── landing/         # Landing page
│   ├── login/           # Login page
│   ├── admin/           # Admin dashboard & user management
│   ├── vaccinator/      # Vaccinator dashboards and features
│   └── district/       # District officer dashboards and reports
└── shared/
    └── components/      # Reusable components (loader, alert, modal, layout)
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v21)

### Installation

1. Navigate to the project directory:
```bash
cd vaxtrack-web
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
   - Update `src/environments/environment.ts` with your backend API URL
   - Default: `http://localhost:8080`

4. Start development server:
```bash
ng serve
```

5. Open browser:
   - Navigate to `http://localhost:4200`

## Build for Production

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## API Integration

The application expects a Spring Boot backend with the following endpoints:

- `POST /api/v1/auth/login` - Authentication
- `GET /api/v1/patients` - Patient management
- `POST /api/v1/vaccinations` - Vaccination recording
- `GET /api/v1/stock` - Stock levels
- `GET /api/v1/appointments` - Appointments
- `GET /api/v1/reports/coverage` - Coverage reports
- `GET /api/v1/users` - User management (Admin only)
- `GET /api/v1/sms-logs` - SMS logs (Admin only)

## Features Implemented

✅ Landing page with feature showcase
✅ Login page with form validation
✅ Role-based dashboards
✅ Patient registration and search
✅ Vaccination recording with validation
✅ Stock level viewing with status indicators
✅ Appointment management
✅ Coverage reports and analytics
✅ User management (Admin)
✅ Responsive design
✅ Loading states and error handling
✅ Confirmation modals
✅ Alert notifications
✅ Professional animations

## Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px - 1920px)
- Tablet (768px - 1024px)
- Mobile (320px - 768px)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Running unit tests
```bash
ng test
```

### Code scaffolding
```bash
ng generate component component-name
```

## License

This project is part of the Immunization Management System for health facilities in Cameroon.

## Support

For issues or questions, please contact the development team.
