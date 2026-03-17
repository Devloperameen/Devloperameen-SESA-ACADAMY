# SafeEdu API Testing Guide

## Prerequisites
- Backend server running on `http://localhost:5000`
- Valid JWT tokens for different user roles (Admin, Teacher, Student)
- Postman or curl installed

## Authentication

### Get JWT Token
```bash
# Login as Admin
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@safeedu.com",
  "password": "your_password"
}

# Response includes: { token: "jwt_token_here", user: {...} }
```

Use the token in subsequent requests:
```
Authorization: Bearer <your_jwt_token>
```

---

## Quiz API Tests

### 1. Create Quiz (Teacher/Admin)
```bash
POST http://localhost:5000/api/quizzes
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "courseId": "course_id_here",
  "title": "JavaScript Fundamentals Quiz",
  "description": "Test your knowledge of JavaScript basics",
  "questions": [
    {
      "questionText": "What is the output of typeof null?",
      "questionType": "multiple-choice",
      "options": ["null", "object", "undefined", "number"],
      "correctAnswer": "object",
      "points": 10
    },
    {
      "questionText": "JavaScript is a compiled language",
      "questionType": "true-false",
      "correctAnswer": "false",
      "points": 5
    }
  ],
  "timeLimit": 30,
  "passingScore": 70,
  "maxAttempts": 3
}
```

### 2. Get All Quizzes for a Course
```bash
GET http://localhost:5000/api/quizzes/course/:courseId
Authorization: Bearer <token>
```

### 3. Get Single Quiz
```bash
GET http://localhost:5000/api/quizzes/:quizId
Authorization: Bearer <token>
```

### 4. Submit Quiz Attempt
```bash
POST http://localhost:5000/api/quizzes/:quizId/submit
Authorization: Bearer <student_token>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "question_id_1",
      "answer": "object"
    },
    {
      "questionId": "question_id_2",
      "answer": "false"
    }
  ]
}
```

### 5. Get Quiz Results
```bash
GET http://localhost:5000/api/quizzes/:quizId/results
Authorization: Bearer <student_token>
```

### 6. Get Student Attempts (Teacher/Admin)
```bash
GET http://localhost:5000/api/quizzes/:quizId/attempts/:studentId
Authorization: Bearer <teacher_token>
```

### 7. Update Quiz (Teacher/Admin)
```bash
PUT http://localhost:5000/api/quizzes/:quizId
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "title": "Updated Quiz Title",
  "timeLimit": 45
}
```

### 8. Delete Quiz (Teacher/Admin)
```bash
DELETE http://localhost:5000/api/quizzes/:quizId
Authorization: Bearer <teacher_token>
```

---

## Assignment API Tests

### 1. Create Assignment (Teacher/Admin)
```bash
POST http://localhost:5000/api/assignments
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "courseId": "course_id_here",
  "title": "Build a Todo App",
  "description": "Create a full-stack todo application using MERN stack",
  "instructions": "1. Setup MongoDB\n2. Create Express API\n3. Build React frontend",
  "dueDate": "2026-04-01T23:59:59Z",
  "maxScore": 100,
  "allowedFileTypes": ["zip", "pdf", "png", "jpg"],
  "maxFileSize": 10485760,
  "allowScreenshots": true
}
```

### 2. Get All Assignments for a Course
```bash
GET http://localhost:5000/api/assignments/course/:courseId
Authorization: Bearer <token>
```

### 3. Get Single Assignment
```bash
GET http://localhost:5000/api/assignments/:assignmentId
Authorization: Bearer <token>
```

### 4. Submit Assignment (Student)
```bash
POST http://localhost:5000/api/assignments/:assignmentId/submit
Authorization: Bearer <student_token>
Content-Type: multipart/form-data

# Form data:
- file: <file_upload>
- screenshots: <screenshot_1>
- screenshots: <screenshot_2>
- comments: "Completed all requirements"
```

### 5. Get My Submissions (Student)
```bash
GET http://localhost:5000/api/assignments/:assignmentId/my-submissions
Authorization: Bearer <student_token>
```

### 6. Get All Submissions (Teacher/Admin)
```bash
GET http://localhost:5000/api/assignments/:assignmentId/submissions
Authorization: Bearer <teacher_token>
```

### 7. Grade Submission (Teacher/Admin)
```bash
POST http://localhost:5000/api/assignments/submissions/:submissionId/grade
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "score": 85,
  "feedback": "Great work! Consider adding error handling.",
  "status": "graded"
}
```

### 8. Update Assignment (Teacher/Admin)
```bash
PUT http://localhost:5000/api/assignments/:assignmentId
Authorization: Bearer <teacher_token>
Content-Type: application/json

{
  "dueDate": "2026-04-15T23:59:59Z",
  "maxScore": 120
}
```

### 9. Delete Assignment (Teacher/Admin)
```bash
DELETE http://localhost:5000/api/assignments/:assignmentId
Authorization: Bearer <teacher_token>
```

---

## Gamification API Tests

### 1. Get My Gamification Stats (Student)
```bash
GET http://localhost:5000/api/gamification/my-stats
Authorization: Bearer <student_token>
```

### 2. Get Leaderboard
```bash
GET http://localhost:5000/api/gamification/leaderboard?limit=10&period=all
Authorization: Bearer <token>

# Query params:
# - limit: number of users (default: 10)
# - period: 'daily', 'weekly', 'monthly', 'all' (default: 'all')
```

### 3. Get Available Badges
```bash
GET http://localhost:5000/api/gamification/badges
Authorization: Bearer <token>
```

### 4. Update Streak (Called on daily activity)
```bash
POST http://localhost:5000/api/gamification/update-streak
Authorization: Bearer <student_token>
```

### 5. Get Points History
```bash
GET http://localhost:5000/api/gamification/points-history?limit=20
Authorization: Bearer <student_token>
```

### 6. Award Badge (Admin Only)
```bash
POST http://localhost:5000/api/gamification/award-badge
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "student_id_here",
  "badgeId": "first_quiz_master"
}
```

### 7. Award Points Manually (Admin Only)
```bash
POST http://localhost:5000/api/gamification/award-points
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "student_id_here",
  "points": 50,
  "reason": "Excellent participation in forum"
}
```

### 8. Get User Gamification Stats (Teacher/Admin)
```bash
GET http://localhost:5000/api/gamification/user/:userId
Authorization: Bearer <teacher_token>
```

### 9. Get Gamification Analytics (Admin Only)
```bash
GET http://localhost:5000/api/gamification/analytics
Authorization: Bearer <admin_token>
```

---

## Expected Responses

### Success Response (200/201)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response (400/401/403/404/500)
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## Testing Workflow

### 1. Setup Test Users
- Create Admin account
- Create Teacher account
- Create Student account
- Login and save JWT tokens

### 2. Test Quiz Flow
1. Teacher creates quiz
2. Student views quiz
3. Student submits quiz
4. System auto-grades
5. Student views results
6. Teacher views all attempts

### 3. Test Assignment Flow
1. Teacher creates assignment
2. Student views assignment
3. Student uploads files/screenshots
4. Teacher views submissions
5. Teacher grades submission
6. Student views grade and feedback

### 4. Test Gamification Flow
1. Student completes quiz (earns points)
2. Student submits assignment (earns points)
3. Check leaderboard
4. View badges earned
5. Check streak status
6. Admin awards bonus points

---

## Common Issues & Solutions

### 401 Unauthorized
- Check if JWT token is valid
- Ensure token is in Authorization header
- Token may have expired (login again)

### 403 Forbidden
- User doesn't have required role
- Check role-based permissions

### 404 Not Found
- Verify resource ID is correct
- Resource may have been deleted

### 500 Internal Server Error
- Check server logs
- Verify MongoDB connection
- Check for missing required fields

---

## Automated Testing Script

```bash
#!/bin/bash

# Set base URL
BASE_URL="http://localhost:5000/api"

# Login and get token
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@safeedu.com","password":"password123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# Test quiz creation
curl -X POST "$BASE_URL/quizzes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "course123",
    "title": "Test Quiz",
    "questions": [
      {
        "questionText": "What is 2+2?",
        "questionType": "multiple-choice",
        "options": ["3", "4", "5"],
        "correctAnswer": "4",
        "points": 10
      }
    ]
  }'
```

---

**Last Updated:** March 14, 2026  
**Version:** 1.0.0
