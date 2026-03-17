# 🚀 SafeEdu Production Deployment Guide

## Overview

This guide covers deploying SafeEdu platform to production with:
- **Backend:** Render
- **Frontend:** Vercel
- **Database:** MongoDB Atlas (already configured)

---

## Pre-Deployment Checklist

### ✅ Backend Ready
- [x] All routes integrated
- [x] No TypeScript errors
- [x] Environment variables configured
- [x] Security middleware enabled
- [x] Rate limiting configured
- [x] Error handling implemented
- [x] Database optimized

### ✅ Frontend Ready
- [x] Environment variables configured
- [x] API endpoints updated
- [x] Build tested locally
- [x] Assets optimized

### ✅ Database Ready
- [x] MongoDB Atlas configured
- [x] Connection string secured
- [x] IP whitelist configured (0.0.0.0/0)
- [x] Indexes created

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend

1. **Verify build works locally:**
```bash
cd backend
npm run build
npm start
```

2. **Create `render.yaml` (already exists):**
```yaml
services:
  - type: web
    name: safeedu-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: OPENAI_API_KEY
        sync: false
      - key: CORS_ORIGIN
        sync: false
      - key: PORT
        value: 5000
```

### Step 2: Deploy to Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service:**
   - **Name:** `safeedu-backend`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free or Starter ($7/month recommended)

4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   MONGO_URI=mongodb+srv://sadiqferegabdushukur_db_user:7Z5PapDvKAjTUGgS@cluster0.2amblcf.mongodb.net/safeedu
   JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this
   OPENAI_API_KEY=sk-your-openai-api-key-here
   CORS_ORIGIN=https://your-frontend-domain.vercel.app
   PORT=5000
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=1000
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your backend URL: `https://safeedu-backend.onrender.com`

### Step 3: Verify Backend Deployment

```bash
# Test health endpoint
curl https://safeedu-backend.onrender.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-03-14T...",
  "uptime": 123,
  "dbStatus": "connected",
  "memory": {...},
  "version": "1.0.0",
  "environment": "production"
}
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Update environment variables:**

Edit `frontend/.env.production`:
```env
VITE_API_URL=https://safeedu-backend.onrender.com/api
VITE_APP_NAME=SafeEdu
VITE_APP_VERSION=1.0.0
```

2. **Test build locally:**
```bash
cd frontend
npm run build
npm run preview
```

3. **Create `vercel.json` (already exists):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Step 2: Deploy to Vercel

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Add Environment Variables:**
   ```
   VITE_API_URL=https://safeedu-backend.onrender.com/api
   VITE_APP_NAME=SafeEdu
   VITE_APP_VERSION=1.0.0
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment (2-5 minutes)
   - Note your frontend URL: `https://safeedu.vercel.app`

### Step 3: Update Backend CORS

Go back to Render and update the `CORS_ORIGIN` environment variable:
```
CORS_ORIGIN=https://safeedu.vercel.app
```

Then redeploy the backend.

---

## Part 3: Configure Custom Domain (Optional)

### For Backend (Render)

1. Go to Render Dashboard → Your Service → Settings
2. Scroll to "Custom Domain"
3. Add your domain: `api.safeedu.com`
4. Add DNS records as instructed by Render
5. Wait for SSL certificate (automatic)

### For Frontend (Vercel)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `safeedu.com` or `www.safeedu.com`
3. Add DNS records as instructed by Vercel
4. Wait for SSL certificate (automatic)

### Update Environment Variables

After adding custom domains, update:

**Backend CORS_ORIGIN:**
```
CORS_ORIGIN=https://safeedu.com,https://www.safeedu.com
```

**Frontend VITE_API_URL:**
```
VITE_API_URL=https://api.safeedu.com/api
```

---

## Part 4: Post-Deployment Testing

### Test Backend

```bash
# Health check
curl https://safeedu-backend.onrender.com/api/health

# Test authentication
curl -X POST https://safeedu-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@safeedu.com","password":"Admin@123"}'

# Test AI endpoint (with token)
curl https://safeedu-backend.onrender.com/api/ai/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Frontend

1. Visit your Vercel URL
2. Test login with admin account
3. Navigate through all pages
4. Test creating a course
5. Test quiz functionality
6. Test assignment submission
7. Test gamification features

### Test AI Features

1. Login as teacher
2. Try generating a quiz from content
3. Test chatbot functionality
4. Check course recommendations
5. Verify performance analysis

---

## Part 5: Monitoring & Maintenance

### Render Monitoring

1. **View Logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Monitor for errors

2. **Metrics:**
   - CPU usage
   - Memory usage
   - Response times
   - Request count

3. **Alerts:**
   - Set up email alerts for downtime
   - Monitor deployment failures

### Vercel Monitoring

1. **Analytics:**
   - Go to Vercel Dashboard → Your Project → Analytics
   - View page views, unique visitors
   - Monitor performance metrics

2. **Logs:**
   - View function logs
   - Check for errors

### MongoDB Atlas Monitoring

1. **Database Metrics:**
   - Go to MongoDB Atlas → Cluster → Metrics
   - Monitor connections
   - Check query performance
   - View storage usage

2. **Alerts:**
   - Set up alerts for high CPU
   - Monitor connection limits
   - Track storage usage

### OpenAI Monitoring

1. **Usage Dashboard:**
   - Go to OpenAI Platform → Usage
   - Monitor API calls
   - Track costs
   - Set spending limits

2. **Cost Management:**
   - Set monthly budget alerts
   - Monitor token usage
   - Optimize prompts if needed

---

## Part 6: Security Checklist

### Backend Security

- [x] JWT_SECRET is strong and unique
- [x] CORS configured for production domain only
- [x] Rate limiting enabled
- [x] Helmet security headers enabled
- [x] Input validation on all endpoints
- [x] File upload restrictions
- [x] MongoDB connection string secured
- [x] OpenAI API key secured
- [x] HTTPS enforced

### Frontend Security

- [x] API URL uses HTTPS
- [x] No sensitive data in client code
- [x] Environment variables properly configured
- [x] XSS protection enabled
- [x] Content Security Policy configured

### Database Security

- [x] Strong password
- [x] IP whitelist configured
- [x] Network encryption enabled
- [x] Regular backups enabled
- [x] Access logs monitored

---

## Part 7: Backup & Recovery

### Database Backups

MongoDB Atlas provides automatic backups:
1. Go to MongoDB Atlas → Cluster → Backup
2. Enable Cloud Backup (if not already enabled)
3. Configure backup schedule
4. Test restore process

### Code Backups

Your code is backed up in GitHub:
1. Ensure all changes are committed
2. Push to GitHub regularly
3. Use tags for releases
4. Keep production branch protected

### Environment Variables Backup

Keep a secure backup of all environment variables:
1. Store in password manager
2. Document all variables
3. Keep separate for dev/staging/prod

---

## Part 8: Scaling Considerations

### When to Scale

Scale when you experience:
- High response times (>2 seconds)
- High CPU usage (>80%)
- High memory usage (>80%)
- Database connection limits reached
- API rate limits hit

### Scaling Options

**Backend (Render):**
- Upgrade to Starter plan ($7/month)
- Upgrade to Standard plan ($25/month)
- Enable autoscaling
- Add more instances

**Frontend (Vercel):**
- Free tier handles most traffic
- Upgrade to Pro if needed ($20/month)
- Enable Edge Functions for better performance

**Database (MongoDB Atlas):**
- Free tier: 512MB storage
- Upgrade to M10 ($57/month) for production
- Enable sharding for large datasets
- Add read replicas

**OpenAI:**
- Monitor usage and costs
- Implement caching to reduce calls
- Set spending limits
- Consider GPT-4o-mini for cost savings

---

## Part 9: Troubleshooting

### Backend Issues

**Issue: Backend not starting**
- Check Render logs
- Verify environment variables
- Check MongoDB connection
- Verify build succeeded

**Issue: CORS errors**
- Verify CORS_ORIGIN matches frontend URL
- Check for trailing slashes
- Ensure HTTPS is used

**Issue: Database connection failed**
- Check MongoDB Atlas IP whitelist
- Verify connection string
- Check database user permissions

### Frontend Issues

**Issue: API calls failing**
- Verify VITE_API_URL is correct
- Check backend is running
- Verify CORS configuration
- Check network tab for errors

**Issue: Build failing**
- Check for TypeScript errors
- Verify all dependencies installed
- Check Vercel build logs

### AI Issues

**Issue: AI features not working**
- Verify OPENAI_API_KEY is set
- Check OpenAI account has credits
- Review API usage limits
- Check server logs for errors

---

## Part 10: Cost Breakdown

### Monthly Costs (Estimated)

**Infrastructure:**
- Render (Starter): $7/month
- Vercel (Free): $0/month
- MongoDB Atlas (M10): $57/month
- **Subtotal: $64/month**

**AI Services:**
- OpenAI API (1000 students): $40-60/month
- **Subtotal: $40-60/month**

**Optional:**
- Custom domain: $10-15/year
- Email service: $0-10/month
- CDN/Storage: $0-20/month

**Total: ~$104-134/month**

### Cost Optimization

1. **Start with free tiers:**
   - Render Free (with cold starts)
   - MongoDB Atlas Free (512MB)
   - Vercel Free

2. **Implement caching:**
   - Redis for API responses
   - Cache AI responses
   - CDN for static assets

3. **Monitor usage:**
   - Set up cost alerts
   - Review usage weekly
   - Optimize expensive operations

---

## Part 11: Launch Checklist

### Pre-Launch

- [ ] All features tested
- [ ] Backend deployed and verified
- [ ] Frontend deployed and verified
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active
- [ ] Database backups enabled
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Documentation complete
- [ ] Test accounts created

### Launch Day

- [ ] Final smoke tests
- [ ] Monitor logs closely
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Test user registration
- [ ] Test payment flow (if applicable)
- [ ] Monitor error rates
- [ ] Check database performance

### Post-Launch

- [ ] Monitor for 24 hours
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Document issues and solutions
- [ ] Plan next iteration
- [ ] Celebrate! 🎉

---

## Part 12: Support & Resources

### Documentation
- Backend API: `/backend/API_DOCUMENTATION.md`
- AI Features: `/backend/AI_FEATURES_GUIDE.md`
- Testing: `/backend/API_TESTING_GUIDE.md`

### Platform Support
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- OpenAI: https://platform.openai.com/docs

### Community
- GitHub Issues: For bug reports
- GitHub Discussions: For questions
- Email: support@safeedu.com (configure)

---

## Conclusion

Your SafeEdu platform is now ready for production deployment! Follow this guide step by step, and you'll have a fully functional, scalable educational platform running in production.

**Remember:**
- Start with free tiers to test
- Monitor costs and usage
- Scale as needed
- Keep documentation updated
- Collect user feedback
- Iterate and improve

---

**Last Updated:** March 14, 2026  
**Version:** 1.0.0  
**Status:** Production Ready ✅

**🚀 Good luck with your launch!**
