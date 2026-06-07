// Vercel Serverless Function placeholder for AI Referee
// POST /api/referee
// Body: { topic: string, userSpeech: string, opponentSpeech: string, difficulty: string }
// Returns: { feedback: FeedbackItem[], scores: ScoreMatrix }
// Integrates with Groq (groq-sdk) or Google Gemini (generative-ai) at zero cost tiers

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface FeedbackItem {
  original: string;
  corrected: string;
  explanation: string;
  uzbekExplanation: string;
}

interface ScoreMatrix {
  grammar: number;
  vocabulary: number;
  responseSpeed: number;
  relevance: number;
}

interface RefereeResponse {
  userFeedback: FeedbackItem[];
  userScores: ScoreMatrix;
  opponentScores: ScoreMatrix;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async function handler(_req: VercelRequest, res: VercelResponse): Promise<void> {
  // TODO: Replace with actual Groq or Gemini SDK call
  // const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  // const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  const mockResponse: RefereeResponse = {
    userFeedback: [
      {
        original: "I has been studying English since 3 years.",
        corrected: "I have been studying English for 3 years.",
        explanation: "Use 'have been' for present perfect continuous. 'Since' marks a point in time; 'for' marks duration.",
        uzbekExplanation: "Present perfect continuous zamonida 'have been' ishlatiladi. 'Since' vaqt nuqtasini belgilaydi; 'for' davomiylikni bildiradi.",
      },
    ],
    userScores: { grammar: 7, vocabulary: 8, responseSpeed: 9, relevance: 8 },
    opponentScores: { grammar: 6, vocabulary: 7, responseSpeed: 7, relevance: 6 },
  };

  res.status(200).json(mockResponse);
}
