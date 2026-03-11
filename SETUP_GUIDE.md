# Course Management System Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create or update `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sesa
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup
Ensure MongoDB is running:
```bash
# Start MongoDB (if using local installation)
mongod

# Or use Docker
docker run -d -p 27017:27017 --name sesa-mongo mongo
```

### 4. Start the Server
```bash
cd backend
npm run dev
```

## Testing the System

### Option 1: Manual Testing with API Client
Use Postman, Insomnia, or curl to test:

#### Create Test Users First
```bash
# Create admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "password": "admin123",
    "role": "admin"
  }'

# Create teacher user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teacher User",
    "email": "teacher@test.com",
    "password": "teacher123",
    "role": "instructor"
  }'

# Create student user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Student User",
    "email": "student@test.com",
    "password": "student123",
    "role": "student"
  }'
```

#### Login to Get Tokens
```bash
# Login as teacher
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "teacher123"
  }'
# Save the token from response
```

### Option 2: Automated Test Script
```bash
cd backend
node test_course_management.js
```

## API Workflow Examples

### Complete Teacher → Admin → Student Flow

#### Step 1: Teacher Creates Course
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Authorization: Bearer <teacher_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "JavaScript Masterclass",
    "description": "Learn JavaScript from beginner to advanced",
    "resourceUrl": "https://www.youtube.com/watch?v=example",
    "previewVideoUrl": "https://www.youtube.com/watch?v=example",
    "lessons": [
      {"title": "Part 1: JavaScript Basics", "videoUrl": "https://youtube.com/video1", "order": 0},
      {"title": "Part 2: Functions & Scope", "videoUrl": "https://youtube.com/video2", "order": 1},
      {"title": "Part 3: Async Programming", "videoUrl": "https://youtube.com/video3", "order": 2}
    ],
    "price": 29.99,
    "level": "beginner",
    "duration": "6 weeks",
    "tags": ["javascript", "programming", "web"]
  }'
```

#### Step 2: Admin Reviews Pending Courses
```bash
# View all pending courses
curl -X GET http://localhost:5000/api/course-management/admin/courses/pending-review \
  -H "Authorization: Bearer <admin_token>"

# Preview specific course
curl -X GET http://localhost:5000/api/course-management/admin/courses/<course_id>/preview \
  -H "Authorization: Bearer <admin_token>"

# Accept the course
curl -X PUT http://localhost:5000/api/course-management/admin/courses/<course_id>/review \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "accept",
    "adminComment": "Great content! Approved for publishing."
  }'
```

#### Step 3: Student Views Free Preview
```bash
# Anyone can view free preview (no auth required)
curl -X GET http://localhost:5000/api/course-management/courses/<course_id>/free-preview

# Student views Part 1 (free)
curl -X GET http://localhost:5000/api/course-management/courses/<course_id>/lesson/0 \
  -H "Authorization: Bearer <student_token>"
```

#### Step 4: Student Requests Enrollment
```bash
curl -X POST http://localhost:5000/api/enrollments/request/<course_id> \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentProofUrl": "https://example.com/payment.pdf",
    "watchedPart1": true
  }'
```

#### Step 5: Admin Verifies Enrollment
```bash
# View pending verifications
curl -X GET http://localhost:5000/api/course-management/admin/enrollments/verification \
  -H "Authorization: Bearer <admin_token>"

# Verify enrollment
curl -X PUT http://localhost:5000/api/course-management/admin/enrollments/<enrollment_id>/verify \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "adminComment": "Payment verified via PayPal"
  }'
```

#### Step 6: Student Accesses Full Content
```bash
# Access full course content
curl -X GET http://localhost:5000/api/course-management/courses/<course_id>/full-content \
  -H "Authorization: Bearer <student_token>"

# Access all lessons
curl -X GET http://localhost:5000/api/course-management/courses/<course_id>/lesson/1 \
  -H "Authorization: Bearer <student_token>"
```

## Frontend Integration Points

### Teacher Dashboard Components
```typescript
// Course creation form
POST /api/courses

// View pending courses
GET /api/course-management/teacher/courses/my-pending

// View published courses
GET /api/course-management/teacher/courses/my-published

// View statistics
GET /api/course-management/teacher/courses/my-stats
```

### Admin Panel Components
```typescript
// Course review
GET /api/course-management/admin/courses/pending-review
GET /api/course-management/admin/courses/:id/preview
PUT /api/course-management/admin/courses/:id/review

// Enrollment verification
GET /api/course-management/admin/enrollments/verification
PUT /api/course-management/admin/enrollments/:id/verify

// Course management
PATCH /api/course-management/courses/:id/toggle-lock
PATCH /api/course-management/courses/:id/toggle-visibility
```

### Student Interface Components
```typescript
// Free preview
GET /api/course-management/courses/:id/free-preview

// Lesson access
GET /api/course-management/courses/:id/lesson/:index

// Enrollment request
POST /api/enrollments/request/:id

// Full content access
GET /api/course-management/courses/:id/full-content
```

## Database Schema Updates

### Existing Models (No Changes Required)
- `Course` model already has all needed fields
- `User` model has role system
- `Enrollment` model has status fields
- `Payment` model exists

### New Collections Created
- None - all functionality uses existing schemas

## Migration from Old System

### Automatic Migration
The system is backward compatible:
1. Existing courses keep their current status
2. Teacher-created courses will now auto-set to "pending"
3. Admin-created courses auto-publish
4. All existing API endpoints remain functional

### Manual Updates (If Needed)
```javascript
// Update existing teacher courses to "pending" if they should be reviewed
db.courses.updateMany(
  { instructor: { $exists: true }, status: { $exists: false } },
  { $set: { status: "approved", isPublished: true } }
);

// Set isHidden based on status
db.courses.updateMany(
  { status: "pending" },
  { $set: { isHidden: true, isPublished: false } }
);
```

## Troubleshooting

### Common Issues

#### 1. "Course not found" errors
- Check if course ID is correct
- Verify course exists in database
- Ensure user has proper permissions

#### 2. "Access denied" errors
- Verify JWT token is valid
- Check user role permissions
- Ensure course is published (for free preview)

#### 3. "Invalid status" errors
- Course status must be one of: pending, approved, rejected, locked, hidden
- Use correct status values in API calls

#### 4. MongoDB connection issues
- Ensure MongoDB is running
- Check MONGO_URI in .env file
- Verify network connectivity

### Debug Endpoints
```bash
# Check server status
curl http://localhost:5000/

# Check database connection
# (Monitor server logs for MongoDB connection messages)

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## Production Deployment

### Security Considerations
1. **Change JWT_SECRET** to a strong, random string
2. **Set proper CORS_ORIGIN** to your frontend domain
3. **Enable HTTPS** for all API calls
4. **Implement rate limiting** (already included)
5. **Use environment variables** for all secrets

### Performance Optimization
1. **Database indexing** on frequently queried fields:
   - `status` in Course collection
   - `instructor` in Course collection  
   - `user` and `course` in Enrollment collection

2. **Caching strategy**:
   - Cache free preview content
   - Cache course lists
   - Implement Redis for session management

### Monitoring
1. **Log important events**:
   - Course approval/rejection
   - Enrollment verification
   - Payment processing

2. **Track metrics**:
   - Course approval rate
   - Average review time
   - Enrollment verification time

## Support

### Getting Help
1. Check server logs for error messages
2. Verify API endpoint URLs and parameters
3. Test with Postman/Insomnia first
4. Review the COURSE_MANAGEMENT_SYSTEM.md documentation

### Reporting Issues
When reporting issues, include:
1. API endpoint and method
2. Request headers and body
3. Response status and body
4. Server logs (if available)
5. Steps to reproduce

## Next Steps

### Immediate Actions
1. Test the system with the provided test script
2. Integrate frontend components
3. Train teachers on the new workflow
4. Train admins on the review process

### Future Enhancements
1. Add email notifications
2. Implement payment gateway integration
3. Add advanced analytics dashboard
4. Create mobile-responsive admin panel
5. Implement bulk operations for admins