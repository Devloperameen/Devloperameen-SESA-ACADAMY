import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Providers ───────────────────────────────────────────────────────────────

// 1. OpenAI Configuration
const openaiApiKey = process.env.OPENAI_API_KEY;
export const openAiClient = openaiApiKey && !openaiApiKey.startsWith('sk-xxxx') 
  ? new OpenAI({ apiKey: openaiApiKey }) 
  : null;

// 2. Gemini Configuration
const geminiApiKey = process.env.GEMINI_API_KEY;
export const geminiClient = geminiApiKey && !geminiApiKey.startsWith('YOUR_GEMINI') 
  ? new GoogleGenerativeAI(geminiApiKey) 
  : null;

if (!openAiClient && !geminiClient) {
  console.warn('AI features are disabled: No valid OPENAI_API_KEY or GEMINI_API_KEY found.');
}

export type ChatMessagePayload = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// ── Unified Chat Response ───────────────────────────────────────────────────

export const createChatResponse = async (
  messages: ChatMessagePayload[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    provider?: 'openai' | 'gemini';
  }
) => {
  // Use specified provider or auto-detect
  const provider = options?.provider || (geminiClient ? 'gemini' : (openAiClient ? 'openai' : null));

  if (!provider) {
    throw new Error('AI providers are not configured. Please set GEMINI_API_KEY or OPENAI_API_KEY.');
  }

  // --- Option A: Gemini (Preferred for Native Integration) ---
  if (provider === 'gemini' && geminiClient) {
    try {
      const modelName = options?.model || 'gemini-2.0-flash';
      const model = geminiClient.getGenerativeModel({ model: modelName });
      
      // Extract system prompt separately for Gemini
      const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role !== 'system');
      
      const prompt = systemPrompt 
        ? `System Instructions: ${systemPrompt}\n\nUser: ${userMessages.map(m => m.content).join('\n')}`
        : userMessages.map(m => m.content).join('\n');

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (geminiError: any) {
      console.error('Gemini API error, falling back to mock:', geminiError.message);
      // Fall through to mock response below
    }
  }

  // --- Option B: OpenAI ---
  if (provider === 'openai' && openAiClient) {
    const model = options?.model || 'gpt-4o-mini';
    const response = await openAiClient.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    });
    return response.choices?.[0]?.message?.content || '';
  }

  // --- Option C: Mock AI (Fallback when no keys are set) ---
  return `[Mock AI Assistant]: I'm currently in "Offline Mode" because no API keys (Google Gemini or OpenAI) have been configured in the backend .env file. 

To enable my full capabilities, please:
1. Get an API key from Google AI Studio (Gemini) or OpenAI.
2. Add it to the .env file as GEMINI_API_KEY or OPENAI_API_KEY.
3. Restart the server.

In the meantime, feel free to explore the platform's features like courses, enrollments, and payments!`;
};

export const generateLessonFromTopic = async (
  topic: string,
  level: string,
  language = 'English'
) => {
  const prompt = `You are an educational content designer. Create a structured lesson outline for the topic: "${topic}". Provide:
1) A lesson title
2) A 3-5 sentence introduction
3) Key learning objectives (as a short array)
4) A step-by-step teaching plan (bullet points)
5) Suggested quiz questions (include 3 multiple-choice questions with 4 options each and indicate the correct option)
6) Suggested resources (links or keywords)

Format the response as a JSON object with these fields: title, introduction, objectives, plan, quiz, resources.

Respond in ${language}. Beginner level: keep explanations simple; Intermediate/Advanced: add deeper examples.`;

  const responseText = await createChatResponse([
    {
      role: 'system',
      content: 'You are a helpful AI assistant that generates lesson content for digital learning platforms.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.75,
    maxTokens: 1200,
  });

  // Try to parse JSON output; if parsing fails, return raw text.
  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (_err) {
    return { raw: responseText };
  }
};

export const summarizeText = async (text: string, maxSentences = 5) => {
  const prompt = `Summarize the following text into ${maxSentences} concise bullet points. Keep the summary clear and actionable:

${text}`;

  const responseText = await createChatResponse([
    {
      role: 'system',
      content: 'You are an AI assistant that summarizes educational content into short key points.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.4,
    maxTokens: 400,
  });

  return responseText;
};

// Generate quiz questions from lesson content
export const generateQuizFromContent = async (
  lessonContent: string,
  numberOfQuestions = 5,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
) => {


  const prompt = `Based on the following lesson content, generate ${numberOfQuestions} multiple-choice quiz questions at ${difficulty} difficulty level.

Lesson Content:
${lessonContent}

For each question, provide:
1. Question text
2. Four answer options (A, B, C, D)
3. The correct answer (letter)
4. A brief explanation of why it's correct
5. Points value (easy: 5, medium: 10, hard: 15)

Format the response as a JSON array of question objects with fields: questionText, options (array of 4 strings), correctAnswer (letter), explanation, points.`;

  const responseText = await createChatResponse([
    {
      role: 'system',
      content: 'You are an expert educational content creator specializing in assessment design.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.7,
    maxTokens: 1500,
  });

  try {
    const parsed = JSON.parse(responseText);
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  } catch (_err) {
    return { raw: responseText, error: 'Failed to parse quiz questions' };
  }
};

// Generate key points from lesson content
export const extractKeyPoints = async (content: string, numberOfPoints = 5) => {


  const prompt = `Extract the ${numberOfPoints} most important key points from the following educational content. Each point should be:
- Clear and concise (1-2 sentences)
- Actionable or memorable
- Focused on core concepts

Content:
${content}

Format as a JSON array of strings.`;

  const responseText = await createChatResponse([
    {
      role: 'system',
      content: 'You are an expert at identifying and extracting key learning points from educational content.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.5,
    maxTokens: 600,
  });

  try {
    const parsed = JSON.parse(responseText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return { raw: responseText, error: 'Failed to parse key points' };
  }
};

// Generate personalized learning recommendations
export const generateRecommendations = async (
  studentProfile: {
    completedCourses: string[];
    currentLevel: string;
    interests: string[];
    weakAreas: string[];
    strongAreas: string[];
  },
  availableCourses: Array<{ id: string; title: string; description: string; level: string; category: string }>
) => {


  const prompt = `Based on the student profile and available courses, recommend the top 5 courses that would best help this student progress.

Student Profile:
- Completed Courses: ${studentProfile.completedCourses.join(', ')}
- Current Level: ${studentProfile.currentLevel}
- Interests: ${studentProfile.interests.join(', ')}
- Weak Areas: ${studentProfile.weakAreas.join(', ')}
- Strong Areas: ${studentProfile.strongAreas.join(', ')}

Available Courses:
${availableCourses.map(c => `- ${c.title} (${c.level}, ${c.category}): ${c.description}`).join('\n')}

For each recommendation, provide:
1. Course ID
2. Reason for recommendation (2-3 sentences)
3. Expected benefit
4. Priority (1-5, where 1 is highest)

Format as JSON array with fields: courseId, reason, benefit, priority.`;

  const responseText = await createChatResponse([
    {
      role: 'system',
      content: 'You are an expert educational advisor who provides personalized learning path recommendations.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.6,
    maxTokens: 1000,
  });

  try {
    const parsed = JSON.parse(responseText);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return { raw: responseText, error: 'Failed to parse recommendations' };
  }
};

// AI Chatbot for student support
export const chatbotResponse = async (
  userMessage: string,
  conversationHistory: ChatMessagePayload[] = [],
  context?: {
    courseName?: string;
    lessonName?: string;
    studentLevel?: string;
  }
) => {


  const systemPrompt = `You are SafeEdu AI Assistant, a helpful and friendly educational support chatbot. You help students with:
- Understanding course content
- Navigating the platform
- Study tips and strategies
- Answering questions about lessons
- Providing encouragement and motivation

${context?.courseName ? `Current Course: ${context.courseName}` : ''}
${context?.lessonName ? `Current Lesson: ${context.lessonName}` : ''}
${context?.studentLevel ? `Student Level: ${context.studentLevel}` : ''}

Be concise, encouraging, and educational. If you don't know something specific about the platform, be honest and suggest contacting support.`;

  const messages: ChatMessagePayload[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  const responseText = await createChatResponse(messages, {
    temperature: 0.7,
    maxTokens: 500,
  });

  return responseText;
};

// Generate study plan
export const generateStudyPlan = async (
  courseDetails: {
    title: string;
    totalLessons: number;
    estimatedHours: number;
  },
  studentGoals: {
    targetCompletionDate: Date;
    availableHoursPerWeek: number;
    preferredStudyDays: string[];
  }
) => {


  const daysUntilTarget = Math.ceil((studentGoals.targetCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const prompt = `Create a personalized study plan for a student with the following details:

Course: ${courseDetails.title}
Total Lessons: ${courseDetails.totalLessons}
Estimated Course Hours: ${courseDetails.estimatedHours}

Student Goals:
- Target Completion: ${daysUntilTarget} days from now
- Available Study Time: ${studentGoals.availableHoursPerWeek} hours per week
- Preferred Study Days: ${studentGoals.preferredStudyDays.join(', ')}

Create a week-by-week study plan that:
1. Distributes lessons evenly
2. Respects preferred study days
3. Includes buffer time for review
4. Suggests daily study duration
5. Includes milestone checkpoints

Format as JSON with fields: weeklyPlan (array of weeks with days and lessons), milestones (array), tips (array of study tips).`;

  const responseText = await createChatResponse([
    {
      role: 'system',
      content: 'You are an expert learning strategist who creates effective, personalized study plans.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.6,
    maxTokens: 1200,
  });

  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (_err) {
    return { raw: responseText, error: 'Failed to parse study plan' };
  }
};

// Analyze student performance and provide feedback
export const analyzePerformance = async (
  performanceData: {
    quizScores: number[];
    assignmentScores: number[];
    completionRate: number;
    averageTimePerLesson: number;
    strugglingTopics: string[];
  }
) => {


  const avgQuizScore = performanceData.quizScores.length > 0
    ? performanceData.quizScores.reduce((a, b) => a + b, 0) / performanceData.quizScores.length
    : 0;

  const avgAssignmentScore = performanceData.assignmentScores.length > 0
    ? performanceData.assignmentScores.reduce((a, b) => a + b, 0) / performanceData.assignmentScores.length
    : 0;

  const prompt = `Analyze the following student performance data and provide constructive feedback and recommendations:

Performance Metrics:
- Average Quiz Score: ${avgQuizScore.toFixed(1)}%
- Average Assignment Score: ${avgAssignmentScore.toFixed(1)}%
- Course Completion Rate: ${performanceData.completionRate}%
- Average Time Per Lesson: ${performanceData.averageTimePerLesson} minutes
- Struggling Topics: ${performanceData.strugglingTopics.join(', ')}

Provide:
1. Overall performance assessment (2-3 sentences)
2. Strengths identified (array of strings)
3. Areas for improvement (array of strings)
4. Specific actionable recommendations (array of strings)
5. Motivational message (1-2 sentences)

Format as JSON with fields: assessment, strengths, improvements, recommendations, motivation.`;

  const responseText = await createChatResponse([
    {
      role: 'system',
      content: 'You are an expert educational analyst who provides constructive, encouraging performance feedback.',
    },
    {
      role: 'user',
      content: prompt,
    },
  ], {
    temperature: 0.6,
    maxTokens: 800,
  });

  try {
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (_err) {
    return { raw: responseText, error: 'Failed to parse performance analysis' };
  }
};
