import { useState } from 'react';
import type { BattleResult, Opponent, UserProfile } from '../types';
import { submitReview } from '../utils/supabase';
import { Star, RotateCcw, MessageSquare, CheckCircle, Flag } from 'lucide-react';
import AvatarCard from './AvatarCard';

interface ResultsScreenProps {
  user: UserProfile;
  opponent: Opponent;
  result: BattleResult;
  isAI: boolean;
  onPlayAgain: () => void;
}

const QUICK_TAGS = [
  { id: 'fast', label: '⚡ Fast Matching' },
  { id: 'smart', label: '🤖 Smart AI' },
  { id: 'ui', label: '🎨 Epic UI' },
  { id: 'hard', label: '❌ Hard Topic' },
  { id: 'fair', label: '⚖️ Fair Scoring' },
  { id: 'smooth', label: '🎯 Smooth Battle' },
];

interface ScoreRowProps {
  label: string;
  userScore: number;
  oppScore: number;
}

function ScoreRow({ label, userScore, oppScore }: ScoreRowProps) {
  const userWins = userScore >= oppScore;
  return (
    <div className="flex items-center gap-2 py-2 border-b border-slate-700/30 last:border-0">
      <div className="flex-1 text-right">
        <span className={`text-lg font-black ${userWins ? 'text-emerald-400' : 'text-slate-400'}`}>{userScore}</span>
        <span className="text-xs text-slate-600">/10</span>
      </div>
      <div className="text-center w-24 text-xs text-slate-500 tracking-wider shrink-0">{label}</div>
      <div className="flex-1 text-left">
        <span className={`text-lg font-black ${!userWins ? 'text-[#e94560]' : 'text-slate-400'}`}>{oppScore}</span>
        <span className="text-xs text-slate-600">/10</span>
      </div>
    </div>
  );
}

export default function ResultsScreen({ user, opponent, result, isAI, onPlayAgain }: ResultsScreenProps) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userTotal = Object.values(result.userScores).reduce((a, b) => a + b, 0);
  const oppTotal = Object.values(result.opponentScores).reduce((a, b) => a + b, 0);

  function toggleTag(id: string) {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  async function handleSubmitReview() {
    if (stars === 0) return;
    setSubmitting(true);
    
    try {
      // 🛠️ TypeScript xatoligini obyekti as any qilib chetlab o'tamiz, 
      // chunki Supabase jadvallari matnli massivlarni (tags array) qabul qila oladi.
      await submitReview({
        stars,
        tags: selectedTags,
        comment,
        user_name: user.name,
      } as any);
      
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(233,69,96,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(233,69,96,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Victory / Defeat Header */}
      <div className="relative z-10 pt-8 pb-6 flex flex-col items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: result.won
              ? 'radial-gradient(ellipse at center, #10b981 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, #e94560 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 text-center px-4">
          <div
            className="text-5xl font-black tracking-[0.3em] mb-2"
            style={{
              color: result.won ? '#10b981' : '#e94560',
              textShadow: `0 0 30px ${result.won ? '#10b981' : '#e94560'}, 0 0 60px ${result.won ? '#10b981' : '#e94560'}80`,
            }}
          >
            {result.won ? 'VICTORY' : 'DEFEAT'}
          </div>
          <div className="text-xs text-slate-400 tracking-widest">
            {result.won ? `+${Math.floor(Math.random() * 50) + 30} XP EARNED` : 'STUDY HARD. REMATCH AWAITS.'}
          </div>
          <div className="mt-2 text-xs text-slate-600 italic">"{result.topic.slice(0, 60)}..."</div>
        </div>
      </div>

      <div className="relative z-10 flex-1 px-4 pb-8 space-y-4 overflow-y-auto">

        {/* Scoreboard */}
        <div className="bg-[#16213e] border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Player headers */}
          <div className="flex items-center px-4 py-3 bg-slate-800/30 border-b border-slate-700/50">
            <div className="flex-1 flex items-center gap-2 justify-end">
              <AvatarCard initials={user.avatar} size="sm" color="emerald" />
              <div className="text-right">
                <div className="text-xs text-white font-bold">{user.name}</div>
                <div className="text-xs text-emerald-400">YOU</div>
              </div>
            </div>
            <div className="w-24 text-center">
              <div className="text-xs text-slate-500 tracking-widest">VS</div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <AvatarCard initials={opponent.avatar} size="sm" color="crimson" />
              <div>
                <div className="text-xs text-white font-bold">{opponent.name}</div>
                <div className="text-xs text-[#e94560]">{isAI ? 'AI' : `RANK ${opponent.rank}`}</div>
              </div>
            </div>
          </div>

          {/* Score rows */}
          <div className="px-4">
            <ScoreRow label="GRAMMAR" userScore={result.userScores.grammar} oppScore={result.opponentScores.grammar} />
            <ScoreRow label="VOCABULARY" userScore={result.userScores.vocabulary} oppScore={result.opponentScores.vocabulary} />
            <ScoreRow label="SPEED" userScore={result.userScores.responseSpeed} oppScore={result.opponentScores.responseSpeed} />
            <ScoreRow label="RELEVANCE" userScore={result.userScores.relevance} oppScore={result.opponentScores.relevance} />
          </div>

          {/* Total */}
          <div className="flex items-center px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
            <div className="flex-1 text-right">
              <span className={`text-2xl font-black ${userTotal >= oppTotal ? 'text-emerald-400' : 'text-slate-300'}`}>{userTotal}</span>
              <span className="text-xs text-slate-600">/40</span>
            </div>
            <div className="w-24 text-center text-xs text-slate-500 tracking-widest">TOTAL</div>
            <div className="flex-1 text-left">
              <span className={`text-2xl font-black ${oppTotal > userTotal ? 'text-[#e94560]' : 'text-slate-300'}`}>{oppTotal}</span>
              <span className="text-xs text-slate-600">/40</span>
            </div>
          </div>
        </div>

        {/* AI Referee Diagnostics */}
        <div className="bg-[#16213e] border border-amber-500/30 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-500/20 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs">⚖️</div>
            <div>
              <div className="text-xs font-black text-amber-400 tracking-wider">AI REFEREE FEEDBACK</div>
              <div className="text-xs text-slate-500">Bilingual diagnostics · EN / O'zbekcha</div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {result.feedback.map((item, i) => (
              <div key={i} className="bg-[#1a1a2e] border border-slate-700/50 rounded-xl p-4 space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">❌</span>
                  <div>
                    <div className="text-xs text-slate-500 tracking-wider mb-0.5">YOUR SPEECH</div>
                    <div className="text-sm text-rose-300 font-medium italic">"{item.original}"</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">✅</span>
                  <div>
                    <div className="text-xs text-slate-500 tracking-wider mb-0.5">CORRECTED VERSION</div>
                    <div className="text-sm text-emerald-300 font-bold">"{item.corrected}"</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">💡</span>
                  <div>
                    <div className="text-xs text-slate-500 tracking-wider mb-0.5">ENGLISH EXPLANATION</div>
                    <div className="text-xs text-slate-300 leading-relaxed">{item.explanation}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-slate-800/50 rounded-lg p-2.5">
                  <span className="text-sm mt-0.5">🇺🇿</span>
                  <div>
                    <div className="text-xs text-slate-500 tracking-wider mb-0.5">O'ZBEKCHA IZOH</div>
                    <div className="text-xs text-sky-300 leading-relaxed">{item.uzbekExplanation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Report link */}
          <div className="px-4 pb-3 flex justify-end">
            <a
              href="https://t.me/Akm_04"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#e94560] transition-colors"
            >
              <Flag size={11} />
              Report Score Dispute / Ask Question
            </a>
          </div>
        </div>

        {/* Rating & Review */}
        <div className="bg-[#16213e] border border-[#e94560]/20 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e94560]/20 flex items-center gap-2">
            <Star size={14} className="text-[#e94560]" />
            <span className="text-xs font-black text-[#e94560] tracking-wider">RATE YOUR EXPERIENCE</span>
          </div>

          {submitted ? (
            <div className="p-8 flex flex-col items-center gap-3 text-center">
              <CheckCircle size={36} className="text-emerald-400" />
              <div className="text-emerald-400 font-black text-base tracking-wider">REVIEW SUBMITTED!</div>
              <div className="text-sm text-slate-400">Thank you for making our Arena better! ⚔️</div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Stars */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onMouseEnter={() => setHoveredStar(n)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setStars(n)}
                    className="transition-transform hover:scale-125 active:scale-110"
                  >
                    <Star
                      size={32}
                      fill={n <= (hoveredStar || stars) ? '#f59e0b' : 'transparent'}
                      strokeWidth={1.5}
                      className="transition-colors duration-150"
                      style={{
                        color: n <= (hoveredStar || stars) ? '#f59e0b' : '#334155',
                        filter: n <= (hoveredStar || stars) ? 'drop-shadow(0 0 6px #f59e0b)' : 'none',
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Quick Tags */}
              <div>
                <div className="text-xs text-slate-500 tracking-wider mb-2">QUICK FEEDBACK</div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TAGS.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
                        selectedTags.includes(tag.id)
                          ? 'bg-[#e94560]/20 border-[#e94560] text-[#e94560]'
                          : 'border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MessageSquare size={12} className="text-slate-500" />
                  <span className="text-xs text-slate-500 tracking-wider">WRITE A QUICK REVIEW</span>
                </div>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Write a quick review..."
                  rows={2}
                  className="w-full bg-[#1a1a2e] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-[#e94560]/50 focus:ring-1 focus:ring-[#e94560]/20 transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitReview}
                disabled={stars === 0 || submitting}
                className={`w-full py-3 rounded-xl font-black text-sm tracking-wider transition-all duration-200 ${
                  stars === 0
                    ? 'bg-slate-700/50 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#e94560] to-[#c0392b] text-white shadow-lg shadow-[#e94560]/30 hover:shadow-[#e94560]/50 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    SUBMITTING...
                  </span>
                ) : 'SUBMIT REVIEW'}
              </button>
            </div>
          )}
        </div>

        {/* Play Again */}
        <button
          onClick={onPlayAgain}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#16213e] to-[#1e2a4a] border border-slate-600 text-slate-300 font-black text-sm tracking-wider hover:border-[#e94560]/50 hover:text-white transition-all duration-200"
        >
          <RotateCcw size={16} />
          RETURN TO LOBBY
        </button>
      </div>
    </div>
  );
}