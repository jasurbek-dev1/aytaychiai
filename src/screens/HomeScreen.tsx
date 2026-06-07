import { useState, useEffect, useRef } from 'react';
import type { MatchFilters, Opponent, UserProfile } from '../types';
import { MOCK_OPPONENTS } from '../types';
import type { MatchmakingState, Gender, Difficulty } from '../types';
import { Swords, HelpCircle, Copy, Check, Bot } from 'lucide-react';
import AvatarCard from './AvatarCard';

interface HomeScreenProps {
  user: UserProfile;
  onMatchFound: (opponent: Opponent, filters: MatchFilters) => void;
  onAIDuel: (filters: MatchFilters) => void;
  onAvatarTripleClick: () => void;
}

export default function HomeScreen({ user, onMatchFound, onAIDuel, onAvatarTripleClick }: HomeScreenProps) {
  const [filters, setFilters] = useState<MatchFilters>({ gender: 'any', difficulty: 'intermediate' });
  const [mmState, setMmState] = useState<MatchmakingState>('idle');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarClickRef = useRef(0);
  const avatarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function startMatchmaking() {
    if (mmState === 'searching') {
      setMmState('idle');
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    setMmState('searching');
    const roll = Math.random();
    const delay = roll > 0.4 ? 4000 : 6200;
    timerRef.current = setTimeout(() => {
      if (delay <= 4000) {
        const opponent = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
        setMmState('found');
        setTimeout(() => onMatchFound(opponent, filters), 800);
      } else {
        setMmState('notfound');
      }
    }, delay);
  }

  function copyInviteLink() {
    const link = `https://t.me/ClashOfEnglish_bot/app?startapp=invite_${Math.random().toString(36).slice(2, 9)}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleAvatarClick() {
    avatarClickRef.current += 1;
    if (avatarTimerRef.current) clearTimeout(avatarTimerRef.current);
    if (avatarClickRef.current >= 3) {
      avatarClickRef.current = 0;
      onAvatarTripleClick();
    } else {
      avatarTimerRef.current = setTimeout(() => { avatarClickRef.current = 0; }, 600);
    }
  }

  const genderOptions: { value: Gender; label: string }[] = [
    { value: 'any', label: 'Any' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  const difficultyOptions: { value: Difficulty; label: string; color: string }[] = [
    { value: 'beginner', label: 'Beginner', color: 'text-emerald-400' },
    { value: 'intermediate', label: 'Intermediate', color: 'text-amber-400' },
    { value: 'advanced', label: 'Advanced', color: 'text-rose-400' },
  ];

  const rankColors: Record<string, string> = {
    S: 'text-yellow-300 shadow-yellow-400',
    A: 'text-rose-400 shadow-rose-500',
    B: 'text-sky-400 shadow-sky-500',
    C: 'text-slate-300 shadow-slate-400',
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col" style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}>
      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(233,69,96,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(233,69,96,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-3" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
          <AvatarCard initials={user.avatar} size="md" glowing />
          <div>
            <div className="text-white font-bold text-base tracking-wider">{user.name}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-black tracking-widest px-2 py-0.5 rounded border ${rankColors[user.rank] || 'text-slate-300'} border-current animate-pulse`} style={{ textShadow: '0 0 8px currentColor' }}>
                RANK {user.rank}
              </span>
              <span className="text-xs text-slate-400">{(user.xp || 0).toLocaleString()} XP</span>
            </div>
          </div>
        </div>
        <a
          href="https://t.me/dasturchi_27"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#e94560] transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-[#e94560]/50"
        >
          <HelpCircle size={13} />
          Help Arena
        </a>
      </header>

      {/* Title Bar */}
      <div className="relative z-10 text-center px-4 py-3">
        <h1 className="text-2xl font-black tracking-[0.3em] text-transparent bg-clip-text" style={{
          backgroundImage: 'linear-gradient(135deg, #e94560 0%, #ff6b6b 50%, #e94560 100%)',
          textShadow: 'none',
          WebkitBackgroundClip: 'text',
        }}>
          CLASH OF ENGLISH
        </h1>
        <p className="text-xs text-slate-500 tracking-widest mt-0.5">COMPETITIVE LANGUAGE ARENA</p>
        <div className="h-px bg-gradient-to-r from-transparent via-[#e94560]/50 to-transparent mt-3" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 px-4 py-2 flex flex-col gap-4">

        {/* Dynamic Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'WINS', value: (user.wins ?? 0).toString(), color: '#e94560' },
            { label: 'WIN RATE', value: user.winRate || '0%', color: '#f59e0b' },
            { label: 'STREAK', value: `${user.streak ?? 0}🔥`, color: '#10b981' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#16213e] border border-slate-700/50 rounded-xl p-3 text-center">
              <div className="text-lg font-black" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-slate-500 tracking-widest mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-[#16213e] border border-slate-700/50 rounded-2xl p-4 space-y-4">
          <div className="text-xs text-slate-400 tracking-widest font-semibold">MATCH FILTERS</div>

          {/* Gender */}
          <div>
            <div className="text-xs text-slate-500 mb-2 tracking-wider">OPPONENT GENDER</div>
            <div className="flex gap-2">
              {genderOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(f => ({ ...f, gender: opt.value }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 border ${
                    filters.gender === opt.value
                      ? 'bg-[#e94560] border-[#e94560] text-white shadow-lg shadow-[#e94560]/30'
                      : 'bg-transparent border-slate-600 text-slate-400 hover:border-slate-400'
                  }`}
                >
                  {opt.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <div className="text-xs text-slate-500 mb-2 tracking-wider">DIFFICULTY TIER</div>
            <div className="flex gap-2">
              {difficultyOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters(f => ({ ...f, difficulty: opt.value }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 border ${
                    filters.difficulty === opt.value
                      ? `border-current text-current ${opt.color} shadow-lg`
                      : 'bg-transparent border-slate-600 text-slate-500 hover:border-slate-400'
                  }`}
                  style={filters.difficulty === opt.value ? { boxShadow: '0 0 12px currentColor' } : {}}
                >
                  {opt.label.toUpperCase().slice(0, 5)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matchmaking Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={startMatchmaking}
            disabled={mmState === 'found'}
            className={`relative w-full py-5 rounded-2xl font-black text-lg tracking-[0.2em] transition-all duration-300 overflow-hidden ${
              mmState === 'searching'
                ? 'bg-transparent border-2 border-[#e94560] text-[#e94560]'
                : 'bg-gradient-to-r from-[#e94560] to-[#c0392b] text-white border-2 border-transparent shadow-2xl shadow-[#e94560]/40 hover:shadow-[#e94560]/60 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {mmState === 'searching' && (
              <span className="absolute inset-0 rounded-2xl animate-ping opacity-30 bg-[#e94560]" />
            )}
            <span className="relative flex items-center justify-center gap-3">
              {mmState === 'searching' ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-[#e94560] border-t-transparent rounded-full animate-spin" />
                  SCANNING ARENA...
                </>
              ) : mmState === 'found' ? (
                <><Check size={20} /> OPPONENT LOCKED</>
              ) : (
                <><Swords size={20} /> FIND DUEL PARTNER</>
              )}
            </span>
          </button>

          {/* Radar scanning animation */}
          {mmState === 'searching' && (
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#e94560]/20" />
              <div className="absolute inset-2 rounded-full border border-[#e94560]/30" />
              <div className="absolute inset-4 rounded-full border border-[#e94560]/40" />
              <div
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: '#e94560',
                  animation: 'spin 1.2s linear infinite',
                }}
              />
              <div className="text-[#e94560] text-xs tracking-widest animate-pulse font-bold">RADAR</div>
            </div>
          )}
        </div>

        {/* No opponent fallback */}
        {mmState === 'notfound' && (
          <div className="bg-[#16213e] border border-[#e94560]/30 rounded-2xl p-4 space-y-3 animate-fade-in">
            <div className="text-center">
              <div className="text-[#e94560] font-black text-base tracking-wider mb-1">NO PLAYERS FOUND</div>
              <p className="text-slate-400 text-sm">No online players found in your tier right now.</p>
            </div>
            <div className="h-px bg-[#e94560]/20" />
            <button
              onClick={copyInviteLink}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-sky-500/50 text-sky-400 text-sm font-bold tracking-wider hover:bg-sky-500/10 transition-all duration-200"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'LINK COPIED!' : 'INVITE FRIEND VIA TELEGRAM'}
            </button>
            <button
              onClick={() => onAIDuel(filters)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 text-white text-sm font-bold tracking-wider hover:from-emerald-500 hover:to-teal-500 transition-all duration-200 shadow-lg shadow-emerald-900/40"
            >
              <Bot size={15} />
              DUEL WITH AI TRAINER
            </button>
            <button
              onClick={() => setMmState('idle')}
              className="w-full text-xs text-slate-600 hover:text-slate-400 transition-colors py-1"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Bottom safe area */}
      <div className="h-6" />
    </div>
  );
}