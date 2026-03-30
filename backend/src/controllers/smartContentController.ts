import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import Assignment from '../models/Assignment.js';
import logger from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateCourseOutline = async (req: AuthRequest, res: Response) => {
    try {
        const { 
            title, 
            description, 
            level = 'intermediate', 
            duration = '4 weeks',
            learningObjectives = [],
            targetAudience = 'general'
        } = req.body;

        const prompt = `
        Create a comprehensive course outline for:
        
        Title: ${title}
        Description: ${description}
        Level: ${level}
        Duration: ${duration}
        Target Audience: ${targetAudience}
        Learning Objectives: ${learningObjectives.join(', ')}
        
        Generate a detailed course structure with:
        1. Course overview and prerequisites
        2. 8-12 lessons with titles, descriptions, and key topics
        3. Learning outcomes for each lesson
        4. Suggested activities and assessments
        5. Resources and materials needed
        6. Timeline and pacing recommendations
        
        Format as JSON:
        {
            "courseOverview": {
                "prerequisites": ["prerequisite1", "prerequisite2"],
                "estimatedHours": number,
                "skillsGained": ["skill1", "skill2"]
            },
            "lessons": [
                {
                    "title": "Lesson Title",
                    "description": "Lesson description",
                    "duration": "2 hours",
                    "keyTopics": ["topic1", "topic2"],
                    "learningOutcomes": ["outcome1", "outcome2"],
                    "activities": ["activity1", "activity2"],
                    "resources": ["resource1", "resource2"]
                }
            ],
            "assessments": [
                {
                    "type": "quiz|assignment|project",
                    "title": "Assessment Title",
                    "description": "Assessment description",
                    "weight": "percentage"
                }
            ],
            "timeline": {
                "totalWeeks": number,
                "hoursPerWeek": number,
                "milestones": ["milestone1", "milestone2"]
            }
        }
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const courseOutline = JSON.parse(result.response.text());

        res.json({
            outline: courseOutline,
            generatedAt: new Date(),
            metadata: {
                title,
                level,
                duration,
                targetAudience
            }
        });

    } catch (error) {
        logger.error('Error generating course outline:', error);
        res.status(500).json({ error: 'Failed to generate course outline' });
    }
};

export const generateLessonContent = async (req: AuthRequest, res: Response) => {
    try {
        const {
            lessonTitle,
            courseContext,
            learningObjectives,
            duration = '1 hour',
            level = 'intermediate',
            includeInteractive = true
        } = req.body;

        const prompt = `
        Create detailed lesson content for:
        
        Lesson: ${lessonTitle}
        Course Context: ${courseContext}
        Learning Objectives: ${learningObjectives.join(', ')}
        Duration: ${duration}
        Level: ${level}
        
        Generate comprehensive lesson content including:
        1. Lesson introduction and hook
        2. Main content sections with explanations
        3. Examples and case studies
        4. Interactive elements (if requested)
        5. Practice exercises
        6. Summary and key takeaways
        7. Additional resources
        
        ${includeInteractive ? 'Include interactive elements like polls, discussions, and hands-on activities.' : ''}
        
        Format as JSON:
        {
            "introduction": {
                "hook": "Engaging opening statement",
                "overview": "What students will learn",
                "objectives": ["objective1", "objective2"]
            },
            "sections": [
                {
                    "title": "Section Title",
                    "content": "Detailed explanation",
                    "examples": ["example1", "example2"],
                    "keyPoints": ["point1", "point2"]
                }
            ],
            "interactiveElements": [
                {
                    "type": "poll|discussion|activity",
                    "title": "Element Title",
                    "description": "Element description",
                    "instructions": "How to participate"
                }
            ],
            "exercises": [
                {
                    "title": "Exercise Title",
                    "description": "Exercise description",
                    "difficulty": "easy|medium|hard",
                    "estimatedTime": "15 minutes"
                }
            ],
            "summary": {
                "keyTakeaways": ["takeaway1", "takeaway2"],
                "nextSteps": "What comes next"
            },
            "resources": [
                {
                    "title": "Resource Title",
                    "type": "article|video|tool|book",
                    "description": "Resource description",
                    "url": "optional"
                }
            ]
        }
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const lessonContent = JSON.parse(result.response.text());

        res.json({
            content: lessonContent,
            generatedAt: new Date(),
            metadata: {
                lessonTitle,
                duration,
                level,
                includeInteractive
            }
        });

    } catch (error) {
        logger.error('Error generating lesson content:', error);
        res.status(500).json({ error: 'Failed to generate lesson content' });
    }
};

export const generateQuizQuestions = async (req: AuthRequest, res: Response) => {
    try {
        const {
            topic,
            difficulty = 'intermediate',
            questionCount = 10,
            questionTypes = ['multiple_choice', 'true_false', 'short_answer'],
            courseContext = ''
        } = req.body;

        const prompt = `
        Generate ${questionCount} quiz questions about: ${topic}
        
        Context: ${courseContext}
        Difficulty: ${difficulty}
        Question Types: ${questionTypes.join(', ')}
        
        Create a variety of questions that test:
        1. Knowledge recall
        2. Understanding and comprehension
        3. Application of concepts
        4. Analysis and critical thinking
        
        Format as JSON:
        {
            "questions": [
                {
                    "id": "unique_id",
                    "type": "multiple_choice|true_false|short_answer|essay",
                    "question": "Question text",
                    "options": ["option1", "option2", "option3", "option4"], // for multiple choice
                    "correctAnswer": "correct answer or index",
                    "explanation": "Why this is correct",
                    "difficulty": "easy|medium|hard",
                    "points": number,
                    "tags": ["tag1", "tag2"],
                    "bloomsLevel": "remember|understand|apply|analyze|evaluate|create"
                }
            ],
            "metadata": {
                "totalPoints": number,
                "estimatedTime": "minutes",
                "passingScore": "percentage"
            }
        }
        
        Ensure questions are clear, unambiguous, and educationally sound.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const quizData = JSON.parse(result.response.text());

        res.json({
            quiz: quizData,
            generatedAt: new Date(),
            metadata: {
                topic,
                difficulty,
                questionCount,
                questionTypes
            }
        });

    } catch (error) {
        logger.error('Error generating quiz questions:', error);
        res.status(500).json({ error: 'Failed to generate quiz questions' });
    }
};

export const generateAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const {
            topic,
            courseLevel,
            assignmentType = 'project',
            duration = '1 week',
            learningObjectives = [],
            skillsToAssess = []
        } = req.body;

        const prompt = `
        Create a comprehensive assignment for:
        
        Topic: ${topic}
        Course Level: ${courseLevel}
        Assignment Type: ${assignmentType}
        Duration: ${duration}
        Learning Objectives: ${learningObjectives.join(', ')}
        Skills to Assess: ${skillsToAssess.join(', ')}
        
        Generate a detailed assignment including:
        1. Clear assignment description and objectives
        2. Step-by-step instructions
        3. Requirements and deliverables
        4. Grading rubric
        5. Resources and references
        6. Timeline and milestones
        
        Format as JSON:
        {
            "title": "Assignment Title",
            "description": "Detailed assignment description",
            "objectives": ["objective1", "objective2"],
            "instructions": [
                {
                    "step": 1,
                    "title": "Step Title",
                    "description": "What to do",
                    "estimatedTime": "time needed"
                }
            ],
            "deliverables": [
                {
                    "name": "Deliverable Name",
                    "description": "What to submit",
                    "format": "file format",
                    "maxSize": "file size limit"
                }
            ],
            "rubric": {
                "criteria": [
                    {
                        "name": "Criteria Name",
                        "description": "What is being assessed",
                        "points": number,
                        "levels": [
                            {
                                "level": "Excellent",
                                "description": "Excellent performance",
                                "points": number
                            }
                        ]
                    }
                ],
                "totalPoints": number
            },
            "timeline": {
                "startDate": "relative date",
                "dueDate": "relative date",
                "milestones": [
                    {
                        "date": "relative date",
                        "milestone": "What should be completed"
                    }
                ]
            },
            "resources": [
                {
                    "title": "Resource Title",
                    "type": "book|article|video|tool",
                    "description": "Resource description"
                }
            ],
            "submissionGuidelines": [
                "guideline1",
                "guideline2"
            ]
        }
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const assignmentData = JSON.parse(result.response.text());

        res.json({
            assignment: assignmentData,
            generatedAt: new Date(),
            metadata: {
                topic,
                courseLevel,
                assignmentType,
                duration
            }
        });

    } catch (error) {
        logger.error('Error generating assignment:', error);
        res.status(500).json({ error: 'Failed to generate assignment' });
    }
};

export const enhanceExistingContent = async (req: AuthRequest, res: Response) => {
    try {
        const {
            contentType, // 'course', 'lesson', 'quiz', 'assignment'
            contentId,
            enhancementType, // 'accessibility', 'engagement', 'difficulty', 'interactivity'
            targetAudience = 'general'
        } = req.body;

        let content;
        let enhancementPrompt = '';

        // Fetch existing content
        switch (contentType) {
            case 'course':
                content = await Course.findById(contentId);
                break;
            case 'quiz':
                content = await Quiz.findById(contentId);
                break;
            case 'assignment':
                content = await Assignment.findById(contentId);
                break;
            default:
                return res.status(400).json({ error: 'Invalid content type' });
        }

        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Generate enhancement suggestions based on type
        switch (enhancementType) {
            case 'accessibility':
                enhancementPrompt = `
                Analyze this ${contentType} content and suggest accessibility improvements:
                
                Content: ${JSON.stringify(content, null, 2)}
                
                Provide suggestions for:
                1. Screen reader compatibility
                2. Visual accessibility (contrast, font size)
                3. Cognitive accessibility (clear language, structure)
                4. Motor accessibility (navigation, interaction)
                5. Alternative formats and media
                
                Format suggestions as actionable recommendations.
                `;
                break;

            case 'engagement':
                enhancementPrompt = `
                Analyze this ${contentType} content and suggest engagement improvements:
                
                Content: ${JSON.stringify(content, null, 2)}
                
                Provide suggestions for:
                1. Interactive elements
                2. Gamification opportunities
                3. Multimedia integration
                4. Social learning features
                5. Personalization options
                
                Focus on evidence-based engagement strategies.
                `;
                break;

            case 'difficulty':
                enhancementPrompt = `
                Analyze this ${contentType} content and suggest difficulty adjustments:
                
                Content: ${JSON.stringify(content, null, 2)}
                Target Audience: ${targetAudience}
                
                Provide suggestions for:
                1. Content complexity adjustments
                2. Scaffolding and support materials
                3. Progressive difficulty levels
                4. Alternative explanations
                5. Additional practice opportunities
                
                Ensure appropriate challenge level for the target audience.
                `;
                break;

            case 'interactivity':
                enhancementPrompt = `
                Analyze this ${contentType} content and suggest interactivity improvements:
                
                Content: ${JSON.stringify(content, null, 2)}
                
                Provide suggestions for:
                1. Interactive exercises and activities
                2. Real-time feedback mechanisms
                3. Collaborative learning opportunities
                4. Hands-on practice elements
                5. Technology integration
                
                Focus on active learning principles.
                `;
                break;
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(enhancementPrompt);
        const suggestions = result.response.text();

        res.json({
            suggestions,
            contentType,
            enhancementType,
            originalContent: content,
            generatedAt: new Date()
        });

    } catch (error) {
        logger.error('Error enhancing content:', error);
        res.status(500).json({ error: 'Failed to enhance content' });
    }
};

export const generateLearningPath = async (req: AuthRequest, res: Response) => {
    try {
        const {
            studentGoals,
            currentSkillLevel,
            availableTime, // hours per week
            preferredLearningStyle,
            interests = [],
            timeframe = '3 months'
        } = req.body;

        const prompt = `
        Create a personalized learning path for a student with:
        
        Goals: ${studentGoals}
        Current Skill Level: ${currentSkillLevel}
        Available Time: ${availableTime} hours per week
        Learning Style: ${preferredLearningStyle}
        Interests: ${interests.join(', ')}
        Timeframe: ${timeframe}
        
        Generate a comprehensive learning path including:
        1. Skill assessment and gap analysis
        2. Recommended course sequence
        3. Weekly study schedule
        4. Milestone checkpoints
        5. Resource recommendations
        6. Progress tracking methods
        
        Format as JSON:
        {
            "pathOverview": {
                "title": "Learning Path Title",
                "description": "Path description",
                "estimatedDuration": "timeframe",
                "skillsGained": ["skill1", "skill2"]
            },
            "phases": [
                {
                    "phase": 1,
                    "title": "Phase Title",
                    "duration": "weeks",
                    "objectives": ["objective1", "objective2"],
                    "courses": ["course1", "course2"],
                    "skills": ["skill1", "skill2"]
                }
            ],
            "weeklySchedule": {
                "hoursPerWeek": number,
                "schedule": [
                    {
                        "day": "Monday",
                        "activities": ["activity1", "activity2"],
                        "duration": "hours"
                    }
                ]
            },
            "milestones": [
                {
                    "week": number,
                    "milestone": "Milestone description",
                    "assessment": "How to measure progress"
                }
            ],
            "resources": [
                {
                    "title": "Resource Title",
                    "type": "course|book|video|practice",
                    "priority": "high|medium|low",
                    "estimatedTime": "hours"
                }
            ],
            "progressTracking": {
                "metrics": ["metric1", "metric2"],
                "checkpoints": ["checkpoint1", "checkpoint2"],
                "adjustmentTriggers": ["trigger1", "trigger2"]
            }
        }
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const learningPath = JSON.parse(result.response.text());

        res.json({
            learningPath,
            generatedAt: new Date(),
            metadata: {
                studentGoals,
                currentSkillLevel,
                availableTime,
                preferredLearningStyle,
                timeframe
            }
        });

    } catch (error) {
        logger.error('Error generating learning path:', error);
        res.status(500).json({ error: 'Failed to generate learning path' });
    }
};