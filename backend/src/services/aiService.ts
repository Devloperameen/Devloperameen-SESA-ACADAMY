import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set. AI features will be disabled.');
}

export const openAiClient = apiKey ? new OpenAI({ apiKey }) : null;

export type ChatMessagePayload = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export const createChatResponse = async (
  messages: ChatMessagePayload[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
) => {
  if (!openAiClient) throw new Error('OpenAI client not configured. Set OPENAI_API_KEY in env.');
  const model = options?.model || 'gpt-4o-mini';
  const temperature = typeof options?.temperature === 'number' ? options.temperature : 0.7;
  const maxTokens = options?.maxTokens || 1000;

  const response = await openAiClient.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices?.[0]?.message?.content || '';
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
