import { useState, useEffect } from 'react';
import HomeScreen from './screens/HomeScreen';
import BattleScreen from './screens/BattleScreen';
import ResultsScreen from './screens/ResultsScreen';
import DevModal from './screens/DevModal';
import type { Screen, Opponent, MatchFilters, BattleResult, UserProfile } from './types';
import { getOrCreateProfile, updateProfileStats } from './utils/supabase';
import { findOrCreateMatch, subscribeToMatchChanges, leaveMatchLobby } from './utils/matchmaking';
import { Share2, Bot, ArrowLeft } from 'lucide-react';

const tg = (window as any).Telegram?.WebApp;
const tgUser = tg?.initDataUnsafe?.user;

const TELEGRAM_USER_ID = tgUser?.id ? tgUser.id.toString() : "123456789";
const DEFAULT_NAME = tgUser?.first_name || "Alex Thunder";

const AI_OPPONENT: Opponent = {
  name: 'ARIA-7 Trainer',
  rank: 'S',
  xp: 9999,
  avatar: 'AI',
  country: 'BOT',
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [opponent, setOpponent] = useState<Opponent>(AI_OPPONENT);
  const [filters, setFilters] = useState<MatchFilters>({ gender: 'any', difficulty: 'intermediate' });
  const [result, setResult] = useState<BattleResult | null>(null);
  const [isAI, setIsAI] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  
  // Realtime qidiruv holatlari
  const [searchingMatch, setSearchingMatch] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setTimeout> | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: TELEGRAM_USER_ID,
    name: DEFAULT_NAME,
    avatar: DEFAULT_NAME.slice(0, 2).toUpperCase(),
    xp: 0,
    rank: 'C',
    wins: 0,
    losses: 0,
    streak: 0,
    winRate: '0%',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const profile = await getOrCreateProfile(TELEGRAM_USER_ID, DEFAULT_NAME);
        setUserProfile(profile);
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  // Komponent unmount bo'lganda timer'ni tozalash
  useEffect(() => {
    return () => {
      if (timerRef) clearTimeout(timerRef);
    };
  }, [timerRef]);

  async function handleMatchFound(_opp: Opponent, f: MatchFilters) {
    setFilters(f);
    setSearchingMatch(true);
    setShowFallbackOptions(false);

    // Agar oldingi timer bo'lsa tozalash
    if (timerRef) clearTimeout(timerRef);

    const matchRow = await findOrCreateMatch(userProfile.id, userProfile.name);

    if (!matchRow) {
      handleAIDuel(f);
      return;
    }

    setCurrentMatchId(matchRow.id);

    if (matchRow.status === 'matched' && matchRow.room_id) {
      const realOpponent: Opponent = {
        name: matchRow.player_name || 'Arena Fighter',
        rank: 'B',
        xp: 1200,
        avatar: (matchRow.player_name || 'AF').slice(0, 2).toUpperCase(),
        country: 'UZB',
      };
      setOpponent(realOpponent);
      setIsAI(false);
      setSearchingMatch(false);
      setScreen('battle');
      return;
    }

    const subscription = subscribeToMatchChanges(matchRow.id, (_roomId) => {
      const realOpponent: Opponent = {
        name: 'Online Opponent',
        rank: 'A',
        xp: 1500,
        avatar: 'OP',
        country: 'UZB',
      };
      
      subscription?.unsubscribe();
      setOpponent(realOpponent);
      setIsAI(false);
      setSearchingMatch(false);
      setScreen('battle');
    });

    // 10 soniyalik fallback taymerni o'rnatish
    const newTimer = setTimeout(() => {
      setShowFallbackOptions(true);
    }, 10000);
    
    setTimerRef(newTimer);
  }

  function handleAIDuel(f: MatchFilters) {
    setOpponent(AI_OPPONENT);
    setFilters(f);
    setIsAI(true);
    setSearchingMatch(false);
    setShowFallbackOptions(false);
    setScreen('battle');
  }

  function handleInviteFriend() {
    const botLink = "https://t.me/share/url?url=" + encodeURIComponent("https://t.me/Akm_04") + "&text=" + encodeURIComponent("⚔️ Come and duel with me in English Speaking Arena! Let's see who speaks better! 🔥");
    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink(botLink);
    } else {
      window.open(botLink, '_blank');
    }
  }

  async function handleBattleEnd(r: BattleResult) {
    setResult(r);
    setScreen('results');

    const xpGained = r.won ? Math.floor(Math.random() * 50) + 30 : 10;

    try {
      const updatedProfile = await updateProfileStats(TELEGRAM_USER_ID, xpGained, r.won);
      if (updatedProfile) setUserProfile(updatedProfile);
    } catch (error) {
      console.error("Failed to update stats in Supabase:", error);
    }
    
    if (currentMatchId) {
      await leaveMatchLobby(currentMatchId);
      setCurrentMatchId(null);
    }
  }

  function handlePlayAgain() {
    setResult(null);
    setOpponent(AI_OPPONENT);
    setIsAI(false);
    setScreen('home');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex items-center justify-center text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#e94560] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs tracking-[0.2em] uppercase text-slate-400">Loading Arena Profile...</div>
        </div>
      </div>
    );
  }

  if (searchingMatch) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center text-white p-6 select-none" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
        {!showFallbackOptions ? (
          <>
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-[#e94560]/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#e94560] border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-3 bg-slate-800/50 rounded-full flex items-center justify-center font-black text-xl text-[#e94560]">VS</div>
            </div>
            <h2 className="text-xl font-black tracking-widest text-center uppercase mb-1">Searching for Opponent...</h2>
            <p className="text-xs text-slate-400 tracking-wider text-center animate-pulse">CONNECTING TO LOBBY VIA SUPABASE REALTIME</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl mb-4 animate-bounce">⏳</div>
            <h2 className="text-lg font-black tracking-wide text-center uppercase text-amber-400 mb-1">Lobby is taking a bit long...</h2>
            <p className="text-xs text-slate-400 text-center max-w-xs mb-8">No online fighters found right now. Choose how you want to proceed:</p>
            <div className="w-full space-y-3 max-w-xs">
              <button onClick={() => handleAIDuel(filters)} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-gradient-to-r from-[#e94560] to-[#c0392b] font-black text-sm tracking-wider hover:opacity-90 active:scale-95 transition-all text-white shadow-lg shadow-[#e94560]/20">
                <Bot size={18} /> START WITH AI TRAINER
              </button>
              <button onClick={handleInviteFriend} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-sky-500 text-sky-400 font-black text-sm tracking-wider active:scale-95 transition-all">
                <Share2 size={16} /> INVITE REAL FRIEND
              </button>
            </div>
          </>
        )}
        <button 
          onClick={async () => {
            if (timerRef) clearTimeout(timerRef); // Qidiruvni to'xtatsak timer ham o'chadi
            if (currentMatchId) await leaveMatchLobby(currentMatchId);
            setSearchingMatch(false);
          }}
          className="mt-12 flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors uppercase font-bold tracking-wider"
        >
          <ArrowLeft size={14} /> Cancel Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative">
      {screen === 'home' && <HomeScreen user={userProfile} onMatchFound={handleMatchFound} onAIDuel={handleAIDuel} onAvatarTripleClick={() => setShowDevModal(true)} />}
      {screen === 'battle' && <BattleScreen user={userProfile} opponent={opponent} filters={filters} isAI={isAI} onBattleEnd={handleBattleEnd} />}
      {screen === 'results' && result && <ResultsScreen user={userProfile} opponent={opponent} result={result} isAI={isAI} onPlayAgain={handlePlayAgain} />}
      {showDevModal && <DevModal onClose={() => setShowDevModal(false)} />}
    </div>
  );
}