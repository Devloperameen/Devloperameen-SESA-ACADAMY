# SafeEdu AI Features Guide

## Overview

SafeEdu platform now includes comprehensive AI-powered features using OpenAI's GPT models to enhance the learning experience for students, teachers, and administrators.

---

## Setup

### 1. Environment Configuration

Add your OpenAI API key to `backend/.env`:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 2. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste into `.env` file

### 3. Verify Setup

```bash
# Start backend
cd backend
npm run dev

# Test AI health endpoint
curl http://localhost:5000/api/ai/health
```

---

## AI Features

### 1. Auto-Generate Quiz Questions 🎯

Automatically generate quiz questions from lesson content.

**Endpoint:** `POST /api/ai/generate-quiz`

**Request:**
```json
{
  "lessonContent": "JavaScript is a programming language...",
  "numberOfQuestions": 5,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "questionText": "What is JavaScript primarily used for?",
      "options": ["A) Database management", "B) Web development", "C) Operating systems", "D) Hardware control"],
      "correctAnswer": "B",
      "explanation": "JavaScript is primarily used for web development...",
      "points": 10
    }
  ]
}
```

**Use Cases:**
- Teachers can quickly create quizzes from lesson transcripts
- Auto-generate practice questions
- Create assessment banks

---

### 2. Extract Key Points 📝

Extract the most important points from educational content.

**Endpoint:** `POST /api/ai/extract-key-points`

**Request:**
```json
{
  "content": "Long lesson content here...",
  "numberOfPoints": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    "JavaScript is a high-level programming language",
    "Variables can be declared using let, const, or var",
    "Functions are first-class citizens in JavaScript",
    "JavaScript supports both object-oriented and functional programming",
    "The language is primarily used for web development"
  ]
}
```

**Use Cases:**
- Create lesson summaries
- Generate study guides
- Highlight important concepts

---

### 3. Personalized Course Recommendations 🎓

Get AI-powered course recommendations based on student profile.

**Endpoint:** `GET /api/ai/recommendations`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "courseId": "course123",
      "reason": "Based on your completion of JavaScript Basics and interest in web development...",
      "benefit": "This course will help you build full-stack applications",
      "priority": 1
    }
  ]
}
```

**How It Works:**
- Analyzes completed courses
- Identifies weak and strong areas
- Considers student interests
- Recommends next best courses

---

### 4. AI Chatbot Support 💬

24/7 AI-powered student support chatbot.

**Endpoint:** `POST /api/ai/chatbot`

**Request:**
```json
{
  "message": "How do I submit an assignment?",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you today?"
    }
  ],
  "context": {
    "courseName": "JavaScript Fundamentals",
    "lessonName": "Variables and Data Types",
    "studentLevel": "beginner"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "To submit an assignment, go to the assignment page..."
  }
}
```

**Features:**
- Context-aware responses
- Maintains conversation history
- Provides platform guidance
- Offers study tips

---

### 5. Personalized Study Plan 📅

Generate customized study plans based on goals and availability.

**Endpoint:** `POST /api/ai/study-plan`

**Request:**
```json
{
  "courseId": "course123",
  "targetCompletionDate": "2026-05-01",
  "availableHoursPerWeek": 10,
  "preferredStudyDays": ["Monday", "Wednesday", "Friday"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "weeklyPlan": [
      {
        "week": 1,
        "days": [
          {
            "day": "Monday",
            "lessons": ["Lesson 1", "Lesson 2"],
            "duration": "2 hours"
          }
        ]
      }
    ],
    "milestones": [
      "Complete first 5 lessons by Week 2",
      "Finish all quizzes by Week 4"
    ],
    "tips": [
      "Review previous lessons before starting new ones",
      "Take breaks every 45 minutes"
    ]
  }
}
```

**Benefits:**
- Realistic timelines
- Respects student availability
- Includes buffer time
- Provides study tips

---

### 6. Performance Analysis 📊

AI-powered analysis of student performance with actionable feedback.

**Endpoint:** `GET /api/ai/performance-analysis`

**Response:**
```json
{
  "success": true,
  "data": {
    "assessment": "You're performing well overall with strong quiz scores...",
    "strengths": [
      "Excellent quiz performance (avg 85%)",
      "Consistent study habits",
      "Strong understanding of core concepts"
    ],
    "improvements": [
      "Assignment completion rate could be higher",
      "Spend more time on advanced topics"
    ],
    "recommendations": [
      "Review assignment feedback carefully",
      "Practice more coding exercises",
      "Join study groups for peer learning"
    ],
    "motivation": "Keep up the great work! You're on track to excel in this course.",
    "rawData": {
      "quizScores": [85, 90, 78, 92],
      "assignmentScores": [75, 80, 85],
      "completionRate": 65,
      "averageTimePerLesson": 25
    }
  }
}
```

**Features:**
- Comprehensive performance review
- Identifies strengths and weaknesses
- Provides actionable recommendations
- Motivational feedback

---

### 7. Generate Lesson Content 📚

Create complete lesson outlines from topics (existing feature).

**Endpoint:** `POST /api/ai/generate-lesson`

**Request:**
```json
{
  "topic": "Introduction to React Hooks",
  "level": "intermediate",
  "language": "English"
}
```

**Response:**
```json
{
  "lesson": {
    "title": "Introduction to React Hooks",
    "introduction": "React Hooks are functions that let you...",
    "objectives": [
      "Understand what React Hooks are",
      "Learn to use useState and useEffect"
    ],
    "plan": [
      "Explain the concept of Hooks",
      "Demonstrate useState with examples"
    ],
    "quiz": [
      {
        "question": "What is a React Hook?",
        "options": ["A", "B", "C", "D"],
        "correct": "A"
      }
    ],
    "resources": ["React documentation", "Tutorial links"]
  }
}
```

---

### 8. Summarize Content 📄

Summarize long text into concise bullet points (existing feature).

**Endpoint:** `POST /api/ai/summarize`

**Request:**
```json
{
  "text": "Long educational content...",
  "maxSentences": 5
}
```

**Response:**
```json
{
  "summary": "• Key point 1\n• Key point 2\n• Key point 3..."
}
```

---

## Integration Examples

### Frontend Integration

#### 1. Quiz Generation in Teacher Dashboard

```typescript
const generateQuiz = async (lessonContent: string) => {
  const response = await fetch('/api/ai/generate-quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      lessonContent,
      numberOfQuestions: 5,
      difficulty: 'medium'
    })
  });
  
  const data = await response.json();
  return data.data; // Array of questions
};
```

#### 2. Chatbot Widget

```typescript
const sendChatMessage = async (message: string, history: any[]) => {
  const response = await fetch('/api/ai/chatbot', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message,
      conversationHistory: history,
      context: {
        courseName: currentCourse,
        lessonName: currentLesson
      }
    })
  });
  
  const data = await response.json();
  return data.data.response;
};
```

#### 3. Course Recommendations

```typescript
const getRecommendations = async () => {
  const response = await fetch('/api/ai/recommendations', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.data; // Array of recommendations
};
```

---

## Cost Management

### OpenAI API Pricing (as of 2024)

- **GPT-4o-mini:** ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **GPT-4:** ~$30 per 1M input tokens, ~$60 per 1M output tokens

### Cost Optimization Tips

1. **Use GPT-4o-mini by default** (configured in aiService.ts)
2. **Cache common responses** (implement Redis caching)
3. **Set token limits** (already configured)
4. **Rate limit AI endpoints** (implement per-user limits)
5. **Monitor usage** (track API calls in database)

### Estimated Costs

For a platform with 1000 active students:
- Quiz generation: ~$5-10/month
- Chatbot: ~$20-30/month
- Recommendations: ~$5/month
- Performance analysis: ~$5/month

**Total: ~$35-50/month**

---

## Error Handling

All AI endpoints include proper error handling:

```json
{
  "success": false,
  "message": "Unable to generate quiz questions at this time",
  "error": "OpenAI API rate limit exceeded"
}
```

### Common Errors

1. **OpenAI API Key Not Set**
   - Error: "OpenAI client not configured"
   - Solution: Add OPENAI_API_KEY to .env

2. **Rate Limit Exceeded**
   - Error: "Rate limit exceeded"
   - Solution: Implement caching or upgrade OpenAI plan

3. **Invalid Request**
   - Error: "Missing required field"
   - Solution: Check request body format

---

## Security Considerations

1. **API Key Protection**
   - Never expose API key in frontend
   - Store in environment variables
   - Rotate keys regularly

2. **Rate Limiting**
   - Implement per-user rate limits
   - Prevent abuse of AI endpoints
   - Monitor usage patterns

3. **Content Filtering**
   - Validate user inputs
   - Sanitize AI responses
   - Filter inappropriate content

4. **Access Control**
   - Authenticate all AI endpoints
   - Role-based permissions
   - Audit AI usage

---

## Testing

### Manual Testing

```bash
# Test quiz generation
curl -X POST http://localhost:5000/api/ai/generate-quiz \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lessonContent": "JavaScript is a programming language...",
    "numberOfQuestions": 3,
    "difficulty": "easy"
  }'

# Test chatbot
curl -X POST http://localhost:5000/api/ai/chatbot \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I enroll in a course?"
  }'

# Test recommendations
curl http://localhost:5000/api/ai/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Future Enhancements

### Planned Features

1. **Voice-to-Text Transcription**
   - Convert video lectures to text
   - Generate subtitles automatically

2. **Image Analysis**
   - Analyze student screenshots
   - Detect plagiarism in assignments

3. **Adaptive Learning**
   - Adjust difficulty based on performance
   - Personalized question generation

4. **Multi-language Support**
   - Translate content automatically
   - Support multiple languages

5. **Advanced Analytics**
   - Predict student success
   - Identify at-risk students
   - Recommend interventions

---

## Best Practices

### For Teachers

1. **Review AI-generated content** before publishing
2. **Customize AI suggestions** to match your teaching style
3. **Use AI as a tool**, not a replacement
4. **Provide feedback** on AI-generated content

### For Students

1. **Use chatbot for quick questions**
2. **Review AI recommendations** but make your own decisions
3. **Follow AI study plans** but adjust as needed
4. **Use AI analysis** to identify improvement areas

### For Administrators

1. **Monitor AI usage** and costs
2. **Set usage limits** per user role
3. **Review AI responses** for quality
4. **Collect feedback** on AI features

---

## Troubleshooting

### AI Features Not Working

1. Check if OPENAI_API_KEY is set
2. Verify API key is valid
3. Check OpenAI account has credits
4. Review server logs for errors

### Slow Response Times

1. Reduce maxTokens in requests
2. Implement caching for common queries
3. Use GPT-4o-mini instead of GPT-4
4. Consider response streaming

### Poor Quality Responses

1. Improve prompts in aiService.ts
2. Adjust temperature settings
3. Provide more context
4. Use higher-quality models

---

## Support

For issues or questions:
1. Check this documentation
2. Review server logs
3. Test with OpenAI Playground
4. Contact OpenAI support

---

**Last Updated:** March 14, 2026  
**Version:** 2.0.0  
**Status:** Phase 2 AI Integration Complete
