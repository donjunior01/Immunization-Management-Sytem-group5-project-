# Deployment Guide

This guide provides instructions for deploying the Immunization Management System to Supabase and Render.

## Prerequisites

- Supabase account with a project
- Render account
- Docker installed (for local testing)
- PostgreSQL client (psql) or Supabase SQL Editor access

## Part 1: Deploy Schema to Supabase

### Step 1: Create Database in Supabase

1. Log in to your Supabase dashboard
2. Create a new project or select an existing one
3. Go to **Settings** > **Database**
4. Note your database connection details:
   - Host
   - Database name
   - Port (usually 5432)
   - Username
   - Password

### Step 2: Deploy Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the `supabase-schema.sql` file from this repository
3. Copy the entire contents of the file
4. Paste it into the SQL Editor
5. Click **Run** to execute the schema

Alternatively, use psql:

```bash
psql -h <supabase-host> -U postgres -d donjdb -f supabase-schema.sql
```

You will be prompted for the password: `l22aan099LItiQNi`

### Step 3: Verify Schema

Run the following query in the SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see tables like: `users`, `patients`, `vaccines`, `vaccinations`, `facilities`, etc.

## Part 2: Deploy to Render

### Step 1: Prepare Repository

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Ensure all files are committed:
   - `Dockerfile` files (backend and frontend)
   - `docker-compose.yml`
   - `render.yaml`
   - `supabase-schema.sql`

### Step 2: Configure Render Services

#### Option A: Using render.yaml (Recommended)

1. Log in to Render dashboard
2. Click **New** > **Blueprint**
3. Connect your Git repository
4. Render will automatically detect `render.yaml` and create services

#### Option B: Manual Setup

**Create PostgreSQL Database:**

1. Click **New** > **PostgreSQL**
2. Set:
   - **Name**: `immunizationdb`
   - **Database**: `immunizationdb`
   - **User**: `root`
   - **Plan**: Starter (or your preferred plan)
3. Note the connection string from **Connections** tab

**Create Backend Service:**

1. Click **New** > **Web Service**
2. Connect your Git repository
3. Configure:
   - **Name**: `immunizationdb-backend`
   - **Environment**: Docker
   - **Dockerfile Path**: `immunizationdb-backend/Dockerfile`
   - **Docker Context**: `immunizationdb-backend`
   - **Plan**: Starter
4. Add Environment Variables:
   ```
   SPRING_DATASOURCE_URL=jdbc:postgresql://<render-db-host>:5432/immunizationdb
   SPRING_DATASOURCE_USERNAME=root
   SPRING_DATASOURCE_PASSWORD=<render-db-password>
   SPRING_JPA_HIBERNATE_DDL_AUTO=update
   SPRING_FLYWAY_ENABLED=true
   SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
   JWT_SECRET=<generate-a-secret-key>
   AFRICASTALKING_API_KEY=<your-api-key>
   AFRICASTALKING_USERNAME=sandbox
   AFRICASTALKING_SENDER_ID=ImmunizationDB
   SMS_ENABLED=true
   SPRING_PROFILES_ACTIVE=production
   ```
5. Click **Create Web Service**

**Create Frontend Service:**

1. **Wait for backend to deploy first** - Note the backend service URL
2. Click **New** > **Web Service**
3. Connect your Git repository
4. Configure:
   - **Name**: `immunizationdb-frontend`
   - **Environment**: Docker
   - **Dockerfile Path**: `immunizationdatabase-frontend/vaxtrack-web/Dockerfile`
   - **Docker Context**: `immunizationdatabase-frontend/vaxtrack-web`
   - **Plan**: Starter
5. **Before deploying**, add Environment Variable:
   - **Key**: `API_URL`
   - **Value**: `https://your-backend-service.onrender.com/api`
   (Replace `your-backend-service` with your actual backend service name)
6. Click **Create Web Service**

### Step 3: Update Frontend API URL (If using manual setup)

If you set up services manually, update the frontend environment variable after backend deployment:

1. Go to your frontend service in Render
2. Navigate to **Environment** tab
3. Update `API_URL` to: `https://your-backend-service.onrender.com/api`
   (Replace with your actual backend service name)
4. The frontend will automatically rebuild with the new API URL

## Part 3: Update Application Configuration

### Backend Configuration

If using Supabase for production database, update the backend environment variables in Render:

```
SPRING_DATASOURCE_URL=jdbc:postgresql://<supabase-host>:5432/donjdb
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=l22aan099LItiQNi
```

### Frontend Configuration

Update `environment.prod.ts` if needed to point to your production API:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.onrender.com',
  // ... other settings
};
```

## Part 4: Local Testing with Docker Compose

To test the containerized application locally:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

The application will be available at:
- Frontend: http://localhost
- Backend: http://localhost:8080/api
- PostgreSQL: localhost:5432

## Troubleshooting

### Backend won't start

1. Check database connection string
2. Verify environment variables are set correctly
3. Check logs: `docker-compose logs backend`
4. Ensure PostgreSQL is accessible from Render

### Frontend can't connect to backend

1. Verify `API_URL` environment variable is correct
2. Check CORS settings in backend
3. Ensure backend is running and accessible
4. Check browser console for errors

### Database connection issues

1. Verify Supabase database is accessible
2. Check firewall rules (Supabase allows connections from anywhere by default)
3. Verify credentials are correct
4. Check connection string format

### Schema deployment fails

1. Check if tables already exist (use `CREATE TABLE IF NOT EXISTS`)
2. Verify foreign key dependencies (create tables in correct order)
3. Check for syntax errors in SQL file
4. Review Supabase logs

## Security Considerations

1. **Change default passwords** after initial setup
2. **Generate a strong JWT_SECRET** for production
3. **Use environment variables** for sensitive data (never commit secrets)
4. **Enable SSL/TLS** for database connections
5. **Configure CORS** properly in backend
6. **Use HTTPS** in production (Render provides this automatically)
7. **Regularly update dependencies** for security patches

## Environment Variables Reference

### Backend

| Variable | Description | Example |
|----------|-------------|---------|
| `SPRING_DATASOURCE_URL` | Database connection URL | `jdbc:postgresql://host:5432/db` |
| `SPRING_DATASOURCE_USERNAME` | Database username | `root` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | `password` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `AFRICASTALKING_API_KEY` | SMS API key | `your-api-key` |
| `AFRICASTALKING_USERNAME` | SMS username | `sandbox` |
| `AFRICASTALKING_SENDER_ID` | SMS sender ID | `ImmunizationDB` |
| `SMS_ENABLED` | Enable/disable SMS | `true` |

### Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `API_URL` | Backend API URL | `https://backend.onrender.com/api` |

## Default Credentials

After deploying the schema, you can use these default accounts:

- **Health Worker**: `health.worker` / `Password123!`
- **Facility Manager**: `facility.manager` / `Password123!`
- **Government Official**: `gov.official` / `Password123!`

**⚠️ IMPORTANT: Change these passwords immediately after first login in production!**

## Support

For issues or questions:
1. Check application logs in Render dashboard
2. Review Docker container logs
3. Check Supabase database logs
4. Review error messages in browser console (frontend)

