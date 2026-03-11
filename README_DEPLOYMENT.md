# SESA Educational Platform - Deployment

## Quick Start Deployment

### 1. One-Click Setup
```bash
# Make scripts executable
chmod +x setup-deployment.sh deploy-test.sh

# Run setup script
./setup-deployment.sh
```

### 2. Test Deployment Configuration
```bash
./deploy-test.sh
```

### 3. Deploy to Production

#### Backend (Render)
1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Use these settings:
   - **Name**: `sesa-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm run render-start`

#### Frontend (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import GitHub repository
4. Use these settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

## Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb+srv://username:password@cluster0.2amblcf.mongodb.net/sesa?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_strong_jwt_secret_here
CORS_ORIGIN=https://your-frontend.vercel.app
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend.onrender.com
```

## Deployment Files

### Essential Files
- `render.yaml` - Render deployment configuration
- `frontend/vercel.json` - Vercel deployment configuration
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `backend/.env.example` - Backend environment template
- `frontend/.env.production` - Frontend production environment

### Scripts
- `setup-deployment.sh` - Interactive setup script
- `deploy-test.sh` - Deployment validation script

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Render        │    │   MongoDB Atlas │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ • React + Vite  │    │ • Node.js       │    │ • Cloud DB      │
│ • TypeScript    │    │ • Express       │    │ • Auto-scaling  │
│ • Tailwind CSS  │    │ • TypeScript    │    │ • Backups       │
│ • Vercel CDN    │    │ • Socket.IO     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features Deployed

### Course Management System
- ✅ Teacher course creation (auto-pending approval)
- ✅ Admin review panel
- ✅ Free preview system (Part 1 free)
- ✅ Enrollment verification
- ✅ Role-based access control

### User Roles
- **Students**: Preview, enroll, access courses
- **Teachers**: Create/manage courses, view stats
- **Admins**: Review courses, verify enrollments, platform control

### Technical Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, Socket.IO
- **Database**: MongoDB Atlas (Cloud)
- **Auth**: JWT with role-based permissions
- **Deployment**: Vercel + Render

## Quick Test Commands

### Local Testing
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Test API
curl http://localhost:5000/
```

### Production Testing
```bash
# Test backend
curl https://sesa-backend.onrender.com/

# Test frontend
# Visit your Vercel URL in browser
```

## Monitoring URLs

### After Deployment
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://sesa-backend.onrender.com`
- **Backend Health**: `https://sesa-backend.onrender.com/`
- **API Documentation**: See `COURSE_MANAGEMENT_SYSTEM.md`

## Troubleshooting

### Common Issues

#### 1. Backend Won't Start
```bash
# Check logs on Render dashboard
# Verify MONGO_URI is correct
# Check JWT_SECRET is set
```

#### 2. CORS Errors
```
# Update CORS_ORIGIN in Render environment
# Should match your Vercel URL exactly
```

#### 3. Database Connection
```
# Check MongoDB Atlas IP whitelist
# Verify username/password
# Test connection string with MongoDB Compass
```

#### 4. Frontend Build Fails
```
# Check Vercel build logs
# Verify VITE_API_URL is set
# Check TypeScript errors
```

### Debug Scripts
```bash
# Test deployment configuration
./deploy-test.sh

# Interactive setup
./setup-deployment.sh
```

## Support

### Documentation
- `DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `COURSE_MANAGEMENT_SYSTEM.md` - API documentation
- `SETUP_GUIDE.md` - Setup and configuration

### Quick Links
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)

### Getting Help
1. Check deployment logs on Vercel/Render
2. Review error messages in browser console
3. Test API endpoints with curl or Postman
4. Check MongoDB Atlas connection status

## Success Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Database connected
- [ ] CORS configured
- [ ] Authentication working
- [ ] Course creation tested
- [ ] Enrollment workflow tested
- [ ] Admin panel accessible
- [ ] Teacher dashboard working
- [ ] Student features functional

## Next Steps After Deployment

1. **Set up monitoring** (Render metrics, Vercel analytics)
2. **Configure backups** (MongoDB Atlas automatic backups)
3. **Set up alerts** (Email notifications for downtime)
4. **Implement CI/CD** (Automated testing and deployment)
5. **Add custom domains** (Your own domain names)
6. **Set up SSL certificates** (Auto-configured by Vercel/Render)
7. **Implement logging** (Centralized log management)
8. **Performance monitoring** (Response times, error rates)

## Security Notes

⚠️ **Important Security Steps**:
1. Change default JWT_SECRET
2. Use strong MongoDB passwords
3. Enable IP whitelisting in MongoDB Atlas
4. Set up rate limiting
5. Enable CORS for specific origins only
6. Regular security updates
7. Monitor for suspicious activity

## Maintenance

### Regular Tasks
- Monitor usage metrics
- Check error logs
- Update dependencies
- Backup verification
- Security patches

### Scaling Considerations
- Upgrade Render plan when needed
- Scale MongoDB Atlas cluster
- Implement caching (Redis)
- CDN for static assets
- Load balancing for high traffic

## License & Support

This deployment configuration is part of the SESA Educational Platform. For support, refer to the deployment documentation or contact the development team.

---

**Happy Deployment!** 🚀