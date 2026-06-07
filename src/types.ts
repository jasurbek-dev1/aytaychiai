export type Screen = 'home' | 'battle' | 'results';
export type Gender = 'any' | 'male' | 'female';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type MatchmakingState = 'idle' | 'searching' | 'found' | 'notfound';

// 🌟 Supabase va Statlar uchun yangilangan UserProfile interfeysi
export interface UserProfile {
  id: string;        // Telegram foydalanuvchi IDsi uchun
  name: string;
  rank: 'S' | 'A' | 'B' | 'C' | string;
  xp: number;
  avatar: string;
  wins: number;      // HomeScreen va Supabase uchun yutuqlar soni
  losses: number;    // Supabase uchun mag'lubiyatlar soni
  streak: number;    // Ketma-ket yutuqlar (Streak) seriyasi
  winRate: string;   // Foizda ko'rsatiladigan yutuq ko'rsatkichi (masalan: "73%")
}

export interface Opponent {
  name: string;
  rank: string;
  xp: number;
  avatar: string;
  country: string;
}

export interface MatchFilters {
  gender: Gender;
  difficulty: Difficulty;
}

export interface ScoreMatrix {
  grammar: number;
  vocabulary: number;
  responseSpeed: number;
  relevance: number;
}

export interface FeedbackItem {
  original: string;
  corrected: string;
  explanation: string;
  uzbekExplanation: string;
}

export interface BattleResult {
  userScores: ScoreMatrix;
  opponentScores: ScoreMatrix;
  feedback: FeedbackItem[];
  topic: string;
  won: boolean;
}

export const DEBATE_TOPICS: Record<Difficulty, string[]> = {
  beginner: [
    'Social media: blessing or curse for teenagers?',
    'Should school uniforms be mandatory?',
    'Is homework beneficial for students?',
    'Online learning vs traditional classroom',
    'Should junk food be banned in schools?',
  ],
  intermediate: [
    'Artificial intelligence will replace most jobs within 20 years.',
    'Remote work is more productive than office work.',
    'Cryptocurrency should replace traditional banking.',
    'Space exploration funding vs solving Earth\'s problems.',
    'Is social media destroying human relationships?',
  ],
  advanced: [
    'Universal Basic Income is economically viable and morally necessary.',
    'Democracy is incompatible with rapid technological progress.',
    'The metaverse will fundamentally reshape human consciousness.',
    'Gene editing in embryos should be permitted for disease prevention.',
    'Algorithmic governance is superior to elected representatives.',
  ],
};

export const MOCK_OPPONENTS: Opponent[] = [
  { name: 'SkyWarden', rank: 'S', xp: 3200, avatar: 'SW', country: 'KZ' },
  { name: 'VoltPhoenix', rank: 'A', xp: 2600, avatar: 'VP', country: 'UZ' },
  { name: 'NightByte', rank: 'B', xp: 1850, avatar: 'NB', country: 'KG' },
  { name: 'CrystalEdge', rank: 'A', xp: 2900, avatar: 'CE', country: 'TJ' },
];

export const MOCK_FEEDBACK: FeedbackItem[] = [
  {
    original: "I has been studying English since 3 years.",
    corrected: "I have been studying English for 3 years.",
    explanation: "Use 'have been' (present perfect continuous) for ongoing actions. 'Since' marks a specific point in time, while 'for' expresses duration.",
    uzbekExplanation: "'Have been' fe'li hozirgi zamon mukammal davomli uchun ishlatiladi. 'Since' aniq vaqt nuqtasini belgilaydi, 'for' esa davomiylikni bildiradi.",
  },
  {
    original: "The government should to invest more money in education.",
    corrected: "The government should invest more money in education.",
    explanation: "Modal verbs (should, can, will, must) are always followed by the base form of the verb — never add 'to'.",
    uzbekExplanation: "Modal fe'llar (should, can, will, must) dan keyin har doim fe'lning asos shakli keladi — 'to' qo'shilmaydi.",
  },
  {
    original: "This topic is very importanted for our society.",
    corrected: "This topic is very important for our society.",
    explanation: "'Important' is already an adjective — do not add '-ed'. The '-ed' suffix creates a past tense verb or passive adjective, not an intensified adjective.",
    uzbekExplanation: "'Important' so'zi allaqachon sifat — unga '-ed' qo'shimchasini qo'shib bo'lmaydi. '-ed' qo'shimchasi o'tgan zamon yoki passiv sifat yasaydi.",
  },
];