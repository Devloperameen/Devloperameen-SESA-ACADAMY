# Course Management & Access Control System

## Overview
Enhanced course management system for the educational platform with teacher course creation, admin review, free previews, and role-based access control.

## Core Features Implemented

### 1. Teacher Course Creation
- **Auto Admin Review**: Teacher-created courses automatically go into "Pending Approval" status
- **Status Control**: Courses are hidden from students until approved by admin
- **Notification**: Teachers receive notifications when courses are approved/rejected

### 2. Admin Review System
- **Review Panel**: `/api/admin/courses/pending-review` - List all pending courses
- **Course Preview**: `/api/admin/courses/:courseId/preview` - Detailed preview for review
- **Decision Making**: `/api/admin/courses/:courseId/review` - Accept or reject courses
- **Auto Publishing**: Accepted courses become published and visible to students

### 3. Admin Course Control
- **Lock/Unlock**: `/api/courses/:courseId/toggle-lock` - Prevent/allow student access
- **Show/Hide**: `/api/courses/:courseId/toggle-visibility` - Control course visibility
- **Status Management**: Full control over course status (pending, approved, rejected, locked, hidden)

### 4. Free Course Preview System
- **Part 1 Free**: First lesson always available for free preview
- **Public Access**: `/api/courses/:courseId/free-preview` - Anyone can access Part 1
- **Lesson Access**: `/api/courses/:courseId/lesson/:lessonIndex` - Smart access control

### 5. Enrollment & Payment Access
- **Payment Verification**: Admin verifies payments before granting access
- **Enrollment Queue**: `/api/admin/enrollments/verification` - View pending verifications
- **Grant Access**: `/api/admin/enrollments/:enrollmentId/verify` - Verify and grant full access
- **Full Content**: `/api/courses/:courseId/full-content` - Requires verified enrollment

### 6. Role-Based Access Control
- **Roles**: Admin, Teacher (Instructor), Student
- **Permissions**:
  - Teachers: Create courses, manage their own courses
  - Admin: Approve/reject courses, verify enrollments, lock/unlock courses
  - Students: Preview Part 1, enroll in courses, access verified content

## Database Schemas

### Course Model (Enhanced)
```typescript
interface ICourse {
    status: 'pending' | 'approved' | 'rejected' | 'locked' | 'hidden';
    isPublished: boolean;
    isHidden: boolean;
    lockedAt?: Date;
    adminComment?: string;
    // ... other fields
}
```

### Enrollment Model
```typescript
interface IEnrollment {
    status: 'pending' | 'approved' | 'rejected';
    paymentProofUrl?: string;
    adminComment?: string;
    // ... other fields
}
```

### Payment Model
```typescript
interface IPayment {
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    // ... other fields
}
```

## API Endpoints

### Course Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/courses` | Create course (auto pending for teachers) | Teacher/Admin |
| GET | `/api/admin/courses/pending-review` | Get pending courses | Admin |
| GET | `/api/admin/courses/:courseId/preview` | Preview course for review | Admin |
| PUT | `/api/admin/courses/:courseId/review` | Accept/reject course | Admin |
| PATCH | `/api/courses/:courseId/toggle-lock` | Lock/unlock course | Admin/Instructor |
| PATCH | `/api/courses/:courseId/toggle-visibility` | Show/hide course | Admin/Instructor |

### Free Preview System
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/courses/:courseId/free-preview` | Get Part 1 free preview | Public |
| GET | `/api/courses/:courseId/lesson/:lessonIndex` | Get lesson with access control | Varies |

### Enrollment & Verification
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/enrollments/verification` | Get enrollments needing verification | Admin |
| PUT | `/api/admin/enrollments/:enrollmentId/verify` | Verify enrollment & grant access | Admin |
| GET | `/api/courses/:courseId/full-content` | Get full course content | Verified Students |

### Teacher Dashboard
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/teacher/courses/my-pending` | Get teacher's pending courses | Teacher |
| GET | `/api/teacher/courses/my-published` | Get teacher's published courses | Teacher |
| GET | `/api/teacher/courses/my-stats` | Get teacher statistics | Teacher |

## Workflow Examples

### 1. Teacher Creates Course
```
1. Teacher POST /api/courses
2. Course auto-sets status: 'pending'
3. Course auto-sets isHidden: true
4. Course appears in admin review panel
5. Teacher notified when reviewed
```

### 2. Student Enrolls & Accesses Content
```
1. Student views free preview (Part 1)
2. Student requests enrollment
3. Admin verifies payment
4. Admin grants full access
5. Student can access all lessons
```

### 3. Admin Manages Platform
```
1. Review pending courses
2. Verify enrollment payments
3. Lock/unlock courses as needed
4. Monitor teacher performance
```

## Middleware System

### 1. `allowFreePreview`
- Allows public access to Part 1
- Checks if course is published and approved

### 2. `requireFullAccess`
- Requires enrollment and payment verification
- Grants access based on role and status

### 3. `requireCourseManagement`
- Restricts course management to instructors and admins
- Ensures teachers can only manage their own courses

## Security Features

1. **Role Validation**: All endpoints validate user roles
2. **Access Control**: Middleware prevents unauthorized access
3. **Data Protection**: Sensitive data only accessible to authorized users
4. **Payment Verification**: Manual admin verification for security
5. **Course Status Control**: Prevents unauthorized publishing

## Testing the System

### Quick Test Commands
```bash
# Create a course as teacher (auto pending)
curl -X POST /api/courses -H "Authorization: Bearer <teacher_token>" -d '{"title":"New Course",...}'

# View pending courses as admin
curl -X GET /api/admin/courses/pending-review -H "Authorization: Bearer <admin_token>"

# Preview course for review
curl -X GET /api/admin/courses/<courseId>/preview -H "Authorization: Bearer <admin_token>"

# Accept course
curl -X PUT /api/admin/courses/<courseId>/review -H "Authorization: Bearer <admin_token>" -d '{"decision":"accept"}'

# View free preview (no auth required)
curl -X GET /api/courses/<courseId>/free-preview

# Get lesson with access control
curl -X GET /api/courses/<courseId>/lesson/0 -H "Authorization: Bearer <student_token>"
```

## Integration Points

### Frontend Components Needed
1. **Teacher Dashboard**: Course creation form, pending courses list
2. **Admin Panel**: Course review interface, enrollment verification
3. **Student View**: Free preview display, enrollment request
4. **Course Player**: Smart lesson access based on permissions

### Real-time Notifications
- Socket.io integration for instant notifications
- Teacher notified when course approved/rejected
- Student notified when enrollment verified

## Scalability Considerations

1. **Indexing**: Database indexes on status, instructor, enrolledStudents
2. **Caching**: Cache free preview content for performance
3. **Queue System**: For bulk enrollment verification
4. **Monitoring**: Track review times and approval rates

## Security Best Practices

1. **Input Validation**: All endpoints validate request data
2. **Role Checking**: Middleware validates user permissions
3. **Data Sanitization**: Prevent XSS and injection attacks
4. **Rate Limiting**: Prevent abuse of public endpoints
5. **Audit Logging**: Track all admin actions

## Deployment Notes

1. **Environment Variables**:
   - `JWT_SECRET`: For authentication
   - `MONGO_URI`: Database connection
   - `CORS_ORIGIN`: Frontend origin

2. **Database Migrations**:
   - Existing courses will work with new system
   - Status fields already exist in schema
   - No breaking changes to existing data

3. **Monitoring**:
   - Track course approval rates
   - Monitor enrollment verification times
   - Alert on system issues

## Support & Troubleshooting

### Common Issues
1. **Course not appearing**: Check `status` and `isPublished` fields
2. **Access denied**: Verify user role and enrollment status
3. **Payment verification**: Ensure payment record exists and is `completed`

### Debug Endpoints
- `/api/teacher/courses/my-stats`: Teacher performance metrics
- Course status history in `adminComment` field
- Enrollment timeline in `requestedAt` and `updatedAt`

## Future Enhancements

1. **Bulk Operations**: Approve multiple courses at once
2. **Automated Payments**: Integrate payment gateway
3. **Advanced Analytics**: Teacher performance dashboards
4. **Content Moderation**: AI-assisted content review
5. **Mobile Optimization**: Responsive admin interfaces