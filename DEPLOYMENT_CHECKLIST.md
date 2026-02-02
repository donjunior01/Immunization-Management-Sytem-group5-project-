# Render Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- [ ] Create PostgreSQL database on Render
- [ ] Note down connection details
- [ ] Verify Flyway migrations are ready

### 2. Backend Configuration
- [ ] Update application-production.yml with correct environment variables
- [ ] Verify JWT secret is secure
- [ ] Check CORS configuration
- [ ] Test build locally: `mvn clean install`

### 3. Frontend Configuration
- [ ] Update environment.prod.ts with backend URL
- [ ] Test build locally: `npm run build:prod`
- [ ] Verify API endpoints are correct

## 🚀 Deployment Steps

### Step 1: Deploy Database
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `immunizationdb-postgres`
   - **Database**: `immunizationdb`
   - **User**: Keep default
   - **Plan**: Free (testing) or Starter+ (production)
4. **Save connection details**:
   - Internal Database URL: `postgresql://user:password@hostname:5432/database`
   - Host, Port, Database, Username, Password

### Step 2: Deploy Backend
1. Click "New +" → "Web Service"
2. Connect repository or upload code
3. Configure:
   - **Name**: `immunizationdb-backend`
   - **Root Directory**: `immunizationdb-backend`
   - **Environment**: Native Environment
   - **Build Command**: `mvn clean install -DskipTests`
   - **Start Command**: `java -Dspring.profiles.active=production -jar target/immunizationdb-backend-1.0.0.jar`
   - **Plan**: Free (testing) or Starter (production)

4. **Environment Variables**:
   ```
   DATABASE_URL=<your-postgres-internal-url>
   DATABASE_USERNAME=<your-postgres-username>
   DATABASE_PASSWORD=<your-postgres-password>
   JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   SPRING_PROFILES_ACTIVE=production
   PORT=8080
   AFRICASTALKING_API_KEY=atsk_0af9b7a0b348b497c087daf72f2ac03f4a548273e70eacec16c2723de1e847ca9cf1a331
   AFRICASTALKING_USERNAME=sandbox
   AFRICASTALKING_SENDER_ID=ImmunizationDB
   SMS_ENABLED=true
   ```

5. **Deploy and wait for completion**
6. **Note the backend URL**: `https://immunizationdb-backend.onrender.com`

### Step 3: Deploy Frontend
1. Click "New +" → "Static Site"
2. Connect repository
3. Configure:
   - **Name**: `vaxtrack-frontend`
   - **Root Directory**: `immunizationdatabase-frontend/vaxtrack-web`
   - **Build Command**: `npm install && npm run build:prod`
   - **Publish Directory**: `dist/vaxtrack-web`

4. **Environment Variables**:
   ```
   BACKEND_URL=https://immunizationdb-backend.onrender.com
   NODE_ENV=production
   ```

5. **Deploy and wait for completion**
6. **Note the frontend URL**: `https://vaxtrack-frontend.onrender.com`

## 🧪 Testing Deployment

### Backend Testing
1. **Health Check**: `GET https://immunizationdb-backend.onrender.com/api/actuator/health`
2. **Database**: Check logs for successful Flyway migrations
3. **Authentication**: `POST https://immunizationdb-backend.onrender.com/api/auth/login`

### Frontend Testing
1. **Load Application**: Visit frontend URL
2. **API Connection**: Check browser console for API errors
3. **Login Test**: Use default credentials:
   - Username: `health.worker`, Password: `Password123!`
   - Username: `facility.manager`, Password: `Password123!`
   - Username: `gov.official`, Password: `Password123!`

### Full Integration Test
1. **Login**: Authenticate with any user
2. **Navigation**: Test different pages/modules
3. **Data Operations**: Create/read/update operations
4. **Reports**: Generate and view reports

## 🔧 Troubleshooting

### Common Issues

**Backend Build Fails**:
- Check Java version (should be 17)
- Verify Maven dependencies
- Check build logs in Render dashboard

**Database Connection Issues**:
- Verify DATABASE_URL format
- Check username/password
- Ensure database is running

**Frontend Build Fails**:
- Check Node.js version compatibility
- Verify npm dependencies
- Check Angular build configuration

**CORS Errors**:
- Update backend CORS configuration
- Verify frontend URL is allowed
- Check browser console for specific errors

**API Connection Issues**:
- Verify backend URL in environment.prod.ts
- Check network requests in browser dev tools
- Ensure backend is running and accessible

## 📋 Post-Deployment

### Security
- [ ] Change default JWT secret
- [ ] Update default user passwords
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS only

### Monitoring
- [ ] Set up health checks
- [ ] Monitor application logs
- [ ] Set up alerts for downtime
- [ ] Monitor database performance

### Backup
- [ ] Configure database backups
- [ ] Test backup restoration
- [ ] Document backup procedures

## 📞 Support

If you encounter issues:
1. Check Render service logs
2. Review application logs
3. Verify environment variables
4. Test locally first
5. Check database connectivity

## 🎉 Success Criteria

Deployment is successful when:
- [ ] Backend health endpoint returns 200
- [ ] Frontend loads without errors
- [ ] User can login successfully
- [ ] Database operations work
- [ ] All main features are functional
- [ ] No CORS errors in browser console