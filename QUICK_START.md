# SafeEdu Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (already configured)
- Git installed

---

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
The `.env` file is already configured with:
```env
MONGO_URI=mongodb+srv://sadiqferegabdushukur_db_user:7Z5PapDvKAjTUGgS@cluster0.2amblcf.mongodb.net/safeedu
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Seed Database (Optional)
Create test users and sample data:
```bash
npm run seed
```

This creates:
- Admin user: `admin@safeedu.com` / `Admin@123`
- Teacher user: `teacher@safeedu.com` / `Teacher@123`
- Student user: `student@safeedu.com` / `Student@123`
- Sample courses and lessons

### 4. Start Backend Server
```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 5. Test Backend
```bash
# Run automated tests
./test-backend.sh

# Or manually test health endpoint
curl http://localhost:5000/api/health
```

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
The `.env` file is already configured:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SafeEdu
```

### 3. Start Frontend Server
```bash
npm run dev
```

Frontend will start on `http://localhost:5173`

---

## 🧪 Testing the Platform

### 1. Access the Platform
Open your browser and go to: `http://localhost:5173`

### 2. Login with Test Accounts

**Admin Account:**
- Email: `admin@safeedu.com`
- Password: `Admin@123`
- Access: Full platform control, approve courses, manage users

**Teacher Account:**
- Email: `teacher@safeedu.com`
- Password: `Teacher@123`
- Access: Create courses, quizzes, assignments

**Student Account:**
- Email: `student@safeedu.com`
- Password: `Student@123`
- Access: Enroll in courses, take quizzes, submit assignments

### 3. Test New Features

#### Quiz System
1. Login as Teacher
2. Go to a course
3. Create a new quiz with multiple question types
4. Login as Student
5. Take the quiz
6. View auto-graded results
7. Check gamification points earned

#### Assignment System
1. Login as Teacher
2. Create an assignment with file upload
3. Login as Student
4. Submit assignment with files/screenshots
5. Login as Teacher
6. Grade the assignment
7. Student receives feedback

#### Gamification
1. Login as Student
2. Complete quizzes and assignments
3. View your stats at `/gamification/my-stats`
4. Check leaderboard
5. View earned badges
6. Track your streak

#### Video Approval Workflow
1. Login as Teacher
2. Upload a video lesson
3. Login as Admin
4. Go to pending videos
5. Preview and approve/reject
6. Video becomes available to students

---

## 📡 API Endpoints

### Authentication
```bash
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
```

### Quizzes
```bash
POST /api/quizzes                          # Create quiz
GET /api/quizzes/course/:courseId          # Get all quizzes
POST /api/quizzes/:quizId/submit           # Submit quiz
GET /api/quizzes/:quizId/results           # Get results
```

### Assignments
```bash
POST /api/assignments                      # Create assignment
GET /api/assignments/course/:courseId      # Get all assignments
POST /api/assignments/:assignmentId/submit # Submit assignment
POST /api/assignments/submissions/:id/grade # Grade submission
```

### Gamification
```bash
GET /api/gamification/my-stats             # Get my stats
GET /api/gamification/leaderboard          # Get leaderboard
GET /api/gamification/badges               # Get badges
POST /api/gamification/update-streak       # Update streak
```

### Video Workflow
```bash
POST /api/video-workflow/upload            # Upload video
GET /api/video-workflow/pending            # Get pending videos
POST /api/video-workflow/:videoId/review   # Approve/reject video
```

---

## 🔧 Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run seed         # Seed database with test data
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 📊 Database Structure

### Collections
- `users` - User accounts (Admin, Teacher, Student)
- `courses` - Course information
- `lessons` - Lesson content
- `quizzes` - Quiz data and questions
- `assignments` - Assignment details
- `gamifications` - User points, badges, streaks
- `videouploads` - Video upload tracking
- `lessonaccesses` - Lesson access control
- `payments` - Payment transactions
- `screenshots` - Screenshot uploads

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is accessible
curl -I https://cluster0.2amblcf.mongodb.net

# Check if port 5000 is available
lsof -i :5000

# View backend logs
cd backend
npm run dev
```

### Frontend won't start
```bash
# Check if port 5173 is available
lsof -i :5173

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database connection issues
1. Check MongoDB Atlas IP whitelist (should include 0.0.0.0/0 for testing)
2. Verify connection string in `backend/.env`
3. Check MongoDB Atlas cluster status

### CORS errors
1. Verify `CORS_ORIGIN` in `backend/.env` matches frontend URL
2. Check browser console for specific CORS error
3. Ensure backend is running before frontend

---

## 📚 Documentation

- **API Documentation:** `backend/API_DOCUMENTATION.md`
- **API Testing Guide:** `backend/API_TESTING_GUIDE.md`
- **Implementation Details:** `IMPLEMENTATION_COMPLETE.md`
- **Development Progress:** `DEVELOPMENT_PROGRESS.md`
- **Enhancement Plan:** `ENHANCEMENT_PLAN.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

---

## 🎯 Next Steps

1. **Test all features** using the test accounts
2. **Create your own content** (courses, quizzes, assignments)
3. **Customize the platform** (branding, colors, content)
4. **Deploy to production** (Vercel + Render)
5. **Add AI features** (Phase 2)
6. **Develop frontend components** (Phase 2)

---

## 💡 Tips

- Use the admin account to manage the platform
- Create courses as a teacher to test the workflow
- Enroll as a student to see the student experience
- Check the gamification leaderboard regularly
- Review pending videos in the admin dashboard
- Monitor the health endpoint for server status

---

## 🆘 Need Help?

1. Check the documentation files
2. Review the API testing guide
3. Check server logs for errors
4. Verify environment variables
5. Ensure database connection is working

---

**Platform:** SafeEdu Educational Platform  
**Version:** 1.0.0  
**Last Updated:** March 14, 2026  
**Status:** Phase 1 Complete - Ready for Testing

