# Deployment Guide: SESA Educational Platform

## Overview
Deploy your full-stack educational platform to:
- **Frontend**: Vercel (React + TypeScript + Vite)
- **Backend**: Render (Node.js + Express + TypeScript)
- **Database**: MongoDB Atlas (Cloud)

## Prerequisites

### 1. Accounts Required
- [Vercel Account](https://vercel.com/signup) (Free tier available)
- [Render Account](https://render.com/signup) (Free tier available)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register) (Free tier available)

### 2. Local Setup Complete
Ensure your project works locally:
```bash
# Test backend
cd backend
npm run dev
# Server should start on http://localhost:5000

# Test frontend
cd frontend
npm run dev
# App should start on http://localhost:3000
```

## Part 1: MongoDB Atlas Setup

### Step 1: Create Database User
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to "Database Access" → "Add New Database User"
3. Create a user with:
   - **Authentication Method**: Password
   - **Username**: `sesa_admin` (or your preferred username)
   - **Password**: Generate a strong password
   - **Database User Privileges**: `Read and write to any database`
4. Click "Add User"

### Step 2: Get Connection String
1. Go to "Database" → "Connect"
2. Choose "Drivers" connection method
3. Select "Node.js" driver
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.2amblcf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
5. Replace `<username>` and `<password>` with your database user credentials

### Step 3: Update Network Access
1. Go to "Network Access" → "Add IP Address"
2. Add `0.0.0.0/0` (Allow access from anywhere) for development
3. For production, use Render's IP or specific IP ranges

## Part 2: Backend Deployment on Render

### Step 1: Prepare Backend Code
1. Update `backend/.env` with your MongoDB Atlas URI:
   ```env
   MONGO_URI=mongodb+srv://sesa_admin:your_password@cluster0.2amblcf.mongodb.net/sesa?retryWrites=true&w=majority&appName=Cluster0
   ```

2. Commit your changes:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   ```

### Step 2: Deploy to Render
**Option A: Using GitHub (Recommended)**
1. Push code to GitHub:
   ```bash
   git push origin main
   ```

2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure service:
   - **Name**: `sesa-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`

6. Add environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=generate_a_strong_secret_here
   CORS_ORIGIN=https://your-frontend.vercel.app (update after frontend deploy)
   ```

7. Click "Create Web Service"

**Option B: Using render.yaml (Advanced)**
1. Update `render.yaml` with your settings
2. Push to GitHub
3. Render will automatically detect and deploy

### Step 3: Get Backend URL
After deployment, Render will provide:
- **URL**: `https://sesa-backend.onrender.com`
- Save this URL for frontend configuration

## Part 3: Frontend Deployment on Vercel

### Step 1: Prepare Frontend Code
1. Update `frontend/.env.production` with your backend URL:
   ```env
   VITE_API_URL=https://sesa-backend.onrender.com
   ```

2. Update `frontend/vercel.json`:
   ```json
   {
     "env": {
       "VITE_API_URL": "https://sesa-backend.onrender.com"
     }
   }
   ```

### Step 2: Deploy to Vercel
**Option A: Using Vercel CLI (Recommended)**
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   cd frontend
   vercel
   ```
   - Follow prompts to link project
   - Choose default settings

**Option B: Using GitHub Integration**
1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. Add environment variables:
   ```
   VITE_API_URL=https://sesa-backend.onrender.com
   ```

7. Click "Deploy"

### Step 3: Get Frontend URL
After deployment, Vercel will provide:
- **URL**: `https://sesa-frontend.vercel.app`
- Save this URL for backend CORS configuration

## Part 4: Post-Deployment Configuration

### Step 1: Update Backend CORS
1. Go to Render Dashboard → `sesa-backend` → "Environment"
2. Update `CORS_ORIGIN` and `SOCKET_CORS_ORIGIN`:
   ```
   CORS_ORIGIN=https://sesa-frontend.vercel.app
   SOCKET_CORS_ORIGIN=https://sesa-frontend.vercel.app
   ```
3. Click "Save Changes"
4. Redeploy if necessary

### Step 2: Test the Application
1. **Test Backend API**:
   ```bash
   curl https://sesa-backend.onrender.com/
   # Should return: "SESA Secure API with Real-time Notifications is running..."
   ```

2. **Test Frontend**:
   - Visit your Vercel URL
   - Test login functionality
   - Test course creation (teacher)
   - Test course review (admin)
   - Test enrollment (student)

### Step 3: Set Up Custom Domains (Optional)
**Vercel Custom Domain:**
1. Go to Vercel Project → Settings → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records as instructed

**Render Custom Domain:**
1. Go to Render Service → Settings → Custom Domain
2. Add domain (e.g., `api.yourdomain.com`)
3. Update DNS records

## Part 5: Monitoring & Maintenance

### 1. Backend Monitoring (Render)
- **Logs**: Render Dashboard → Service → Logs
- **Metrics**: CPU, Memory, Response times
- **Alerts**: Set up email notifications for downtime

### 2. Frontend Monitoring (Vercel)
- **Analytics**: Vercel Analytics for page views
- **Performance**: Core Web Vitals monitoring
- **Logs**: Serverless function logs

### 3. Database Monitoring (MongoDB Atlas)
- **Metrics**: CPU, Memory, Connections
- **Alerts**: Set up for high connection counts
- **Backups**: Enable automatic backups

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start on Render
**Symptoms**: Build succeeds but service won't start
**Solution**:
- Check Render logs for errors
- Verify `MONGO_URI` is correct
- Ensure `package.json` has correct `main` field
- Check if port is correctly set to `5000`

#### 2. CORS Errors
**Symptoms**: Frontend can't connect to backend
**Solution**:
- Verify `CORS_ORIGIN` matches frontend URL exactly
- Check for trailing slashes
- Test with `curl` to see CORS headers

#### 3. MongoDB Connection Issues
**Symptoms**: Database connection errors
**Solution**:
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check database user credentials
- Test connection locally with the same URI

#### 4. Frontend Build Fails on Vercel
**Symptoms**: Build fails during deployment
**Solution**:
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation passes locally

### Debug Commands
```bash
# Test backend locally with production config
cd backend
NODE_ENV=production npm start

# Test frontend build locally
cd frontend
npm run build
npm run preview

# Check environment variables
echo $MONGO_URI
echo $VITE_API_URL
```

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to Git
- Use strong JWT secrets (generate with `openssl rand -base64 32`)
- Rotate secrets periodically

### 2. Database Security
- Use strong database passwords
- Limit IP access in production
- Enable MongoDB Atlas encryption
- Regular backup schedules

### 3. API Security
- Rate limiting enabled
- CORS properly configured
- JWT token expiration (7 days recommended)
- Input validation on all endpoints

### 4. Frontend Security
- Content Security Policy headers
- HTTPS enforcement
- XSS protection headers
- Secure cookie settings

## Scaling Considerations

### When to Scale Up
1. **Render Plan Upgrade**:
   - From Free → Starter: When exceeding 750 hours/month
   - From Starter → Standard: When needing more RAM/CPU

2. **MongoDB Atlas Upgrade**:
   - M0 (Free) → M10: When exceeding 512MB storage
   - Consider dedicated clusters for high traffic

3. **Vercel Plan**:
   - Hobby → Pro: For custom domains, more bandwidth

### Performance Optimization
1. **Backend**:
   - Implement Redis caching
   - Database connection pooling
   - Query optimization with indexes

2. **Frontend**:
   - Code splitting
   - Image optimization
   - CDN for static assets

3. **Database**:
   - Add indexes on frequently queried fields
   - Use MongoDB Atlas performance advisor
   - Monitor slow queries

## Cost Management

### Free Tier Limits
- **Render**: 750 hours/month, 512MB RAM
- **Vercel**: 100GB bandwidth/month
- **MongoDB Atlas**: 512MB storage, shared RAM

### Estimated Monthly Costs (Small Scale)
- **Render Starter**: $7/month
- **Vercel Pro**: $20/month
- **MongoDB M10**: $9/month
- **Total**: ~$36/month

### Cost Saving Tips
1. Use Free tier as long as possible
2. Monitor usage with alerts
3. Optimize images and assets
4. Implement caching to reduce database calls

## Support & Resources

### Official Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

### Community Support
- [Vercel Community](https://vercel.com/community)
- [Render Community](https://community.render.com)
- [MongoDB Community](https://community.mongodb.com)

### Emergency Contacts
- **Render Support**: support@render.com
- **Vercel Support**: support@vercel.com
- **MongoDB Support**: Cloud support portal

## Next Steps After Deployment

1. **Set up monitoring alerts**
2. **Configure backup schedules**
3. **Implement CI/CD pipeline**
4. **Set up staging environment**
5. **Create deployment documentation for team**
6. **Plan for scaling based on user growth**

## Success Checklist
- [ ] Backend deployed to Render and accessible
- [ ] Frontend deployed to Vercel and accessible
- [ ] Database connected and working
- [ ] CORS properly configured
- [ ] Authentication working end-to-end
- [ ] Course creation workflow tested
- [ ] Enrollment workflow tested
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Team trained on deployment process