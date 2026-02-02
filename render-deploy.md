# Render Deployment Guide for Immunization Management System

## Prerequisites
1. Render account: https://dashboard.render.com
2. GitHub repository (recommended) or direct upload

## Step-by-Step Deployment

### 1. Database Setup (PostgreSQL)

1. **Create PostgreSQL Database**:
   - Go to Render Dashboard → New → PostgreSQL
   - Name: `immunizationdb-postgres`
   - Database: `immunizationdb`
   - User: Keep default or use `immunizationdb_user`
   - Plan: Free (for testing) or Starter+ (for production)

2. **Note Connection Details**:
   After creation, save these values:
   - Internal Database URL: `postgresql://user:password@hostname:5432/database`
   - External Database URL: For external connections
   - Individual values: Host, Port, Database, Username, Password

### 2. Backend Deployment (Java Spring Boot)

1. **Create Web Service**:
   - Go to Render Dashboard → New → Web Service
   - Connect your repository or upload code
   - Choose `immunizationdb-backend` as root directory

2. **Configuration**:
   ```
   Name: immunizationdb-backend
   Environment: Docker (if using Dockerfile) or Native Environment
   Build Command: mvn clean install -DskipTests
   Start Command: java -Dspring.profiles.active=production -jar target/immunizationdb-backend-1.0.0.jar
   ```

3. **Environment Variables**:
   ```
   DATABASE_URL=<your-postgres-internal-url>
   DATABASE_USERNAME=<your-postgres-username>
   DATABASE_PASSWORD=<your-postgres-password>
   JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   SPRING_PROFILES_ACTIVE=production
   PORT=8080
   AFRICASTALKING_API_KEY=<your-api-key>
   AFRICASTALKING_USERNAME=<your-username>
   AFRICASTALKING_SENDER_ID=ImmunizationDB
   SMS_ENABLED=true
   ```

### 3. Frontend Deployment (Angular)

1. **Create Static Site**:
   - Go to Render Dashboard → New → Static Site
   - Connect your repository
   - Choose `immunizationdatabase-frontend/vaxtrack-web` as root directory

2. **Configuration**:
   ```
   Name: vaxtrack-frontend
   Build Command: npm install && npm run build
   Publish Directory: dist/vaxtrack-web
   ```

3. **Environment Variables** (if needed):
   ```
   NODE_ENV=production
   API_BASE_URL=<your-backend-url>
   ```

### 4. Frontend API Configuration

Update your Angular environment files to point to the deployed backend:

**src/environments/environment.prod.ts**:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.onrender.com/api'
};
```

### 5. CORS Configuration

Ensure your backend allows requests from your frontend domain. Update the CORS configuration in your Spring Boot application.

## Expected URLs After Deployment

- **Frontend**: `https://vaxtrack-frontend.onrender.com`
- **Backend**: `https://immunizationdb-backend.onrender.com`
- **API Base**: `https://immunizationdb-backend.onrender.com/api`

## Testing Deployment

1. **Database**: Check that Flyway migrations ran successfully
2. **Backend**: Test API endpoints: `GET /api/health`
3. **Frontend**: Verify the application loads and can connect to the backend
4. **Authentication**: Test login with default users:
   - Username: `health.worker`, Password: `Password123!`
   - Username: `facility.manager`, Password: `Password123!`
   - Username: `gov.official`, Password: `Password123!`

## Troubleshooting

- **Build Failures**: Check build logs in Render dashboard
- **Database Connection**: Verify environment variables match database credentials
- **CORS Issues**: Ensure backend allows frontend domain
- **Migration Issues**: Check Flyway logs for database setup problems