# 🤖 AI Prompts for SafeEdu Mobile App Development

## Quick Start with Cursor AI

### 1. Project Setup
```
Create a React Native Expo app with TypeScript for SafeEdu educational platform.
Include:
- React Navigation (Stack, Tab, Drawer)
- TypeScript configuration
- Zustand for state management
- React Query for API calls
- Folder structure: screens, components, api, store, utils
- Connect to backend: https://safeedu-backend.onrender.com/api
```

### 2. Authentication Flow
```
Build complete authentication with:
- Login/Register screens (React Native Paper UI)
- JWT token storage (AsyncStorage)
- Biometric auth (expo-local-authentication)
- Auto-login on app start
- Protected routes
- Zustand auth store
API: POST /api/auth/login, POST /api/auth/register
```

### 3. Student Dashboard
```
Create student dashboard screen showing:
- Enrolled courses with progress bars
- Upcoming assignments (due dates)
- Recent notifications
- Gamification stats (points, badges, streak)
- Leaderboard preview
- AI-recommended courses
Use FlatList for performance
```

### 4. Course System
```
Build course features:
- Course listing with search/filter
- Course detail with lesson list
- Video player (expo-av) with controls
- Lock/unlock lessons based on payment
- Progress tracking
- Download for offline
API: GET /api/courses, GET /api/courses/:id
```

### 5. Quiz System
```
Implement quiz taking:
- Question types: MCQ, True/False, Short Answer
- Timer countdown
- Progress indicator
- Submit with confirmation
- Results with score and feedback
- Points earned animation
API: GET /api/quizzes/:id, POST /api/quizzes/:id/submit
```


### 6. Assignment Submission
```
Create assignment submission flow:
- View assignment details
- Upload files (expo-document-picker)
- Take photos (expo-camera)
- Text submission
- View submission history
- Grade display with feedback
API: GET /api/assignments/:id, POST /api/assignments/:id/submit
```

### 7. Gamification Features
```
Build gamification system:
- Points balance with animated counter
- Badge collection grid
- Leaderboard (global, class, friends)
- Streak calendar with highlights
- Achievement notifications
Use react-native-reanimated for animations
API: GET /api/gamification/my-stats, GET /api/gamification/leaderboard
```

### 8. AI Chatbot
```
Create AI chatbot interface:
- Chat UI with message bubbles
- Typing indicator
- Quick action buttons
- Send message functionality
- Chat history
- Context-aware responses
API: POST /api/ai/chatbot
```

### 9. Push Notifications
```
Setup push notifications:
- Request permissions (expo-notifications)
- Register device token
- Handle foreground/background notifications
- Notification center screen
- Mark as read functionality
- Notification settings
```

### 10. Offline Support
```
Implement offline features:
- Download videos (expo-file-system)
- Cache course data
- Offline quiz taking (sync later)
- Download manager UI
- Progress indicators
- Sync when online
```

## Recommended AI Tools

### 1. Cursor AI ⭐ (Best Choice)
- Full IDE with AI
- Context-aware suggestions
- Multi-file editing
- Best for complete app development

### 2. GitHub Copilot
- Code completion
- Good for boilerplate
- Works in VS Code

### 3. v0.dev
- UI component generation
- Quick prototyping
- Copy-paste components

### 4. ChatGPT/Claude
- Architecture advice
- Debugging help
- Code reviews

## Quick Tips

1. Start with Cursor AI for fastest development
2. Use Expo for easier setup
3. Test on real devices early
4. Follow React Native best practices
5. Use TypeScript for type safety
6. Implement offline support from start
7. Test push notifications thoroughly
8. Optimize performance with FlatList
9. Use React Query for API caching
10. Follow platform guidelines (iOS/Android)

---

**Ready to build! Start with MOBILE_APP_REQUIREMENTS.md for complete guide.** 📱
