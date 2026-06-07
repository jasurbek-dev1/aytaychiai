import { useEffect, useState } from 'react';
import { findOrCreateMatch, subscribeToMatchChanges, leaveMatchLobby } from '../utils/matchmaking';
import type { UserProfile } from '../types'; // MatchFilters olib tashlandi

interface MatchmakingProps {
  user: UserProfile;
  onMatchStart: (roomId: string) => void;
  onAIStart: () => void;
}

export default function MatchmakingScreen({ user, onMatchStart, onAIStart }: MatchmakingProps) {
  // matchId ni ref yoki state orqali saqlash uchun
  const [matchId, setMatchId] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any = null;
    let timer: ReturnType<typeof setTimeout>;

    async function init() {
      const match = await findOrCreateMatch(user.id, user.name);
      
      if (!match) {
        onAIStart();
        return;
      }

      setMatchId(match.id);

      if (match.status === 'matched' && match.room_id) {
        onMatchStart(match.room_id);
      } else {
        // Obunani saqlab qo'yamiz
        subscription = subscribeToMatchChanges(match.id, (roomId) => {
          onMatchStart(roomId);
        });
      }
    }

    init();

    // 15 soniyalik taymer
    timer = setTimeout(() => {
      onAIStart();
    }, 15000);

    // Tozalash funksiyasi
    return () => {
      clearTimeout(timer);
      if (subscription) subscription.unsubscribe();
      // matchId mavjud bo'lsa lobby'ni tark etamiz
      if (matchId) leaveMatchLobby(matchId);
    };
  }, [user.id, user.name, onMatchStart, onAIStart, matchId]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white bg-[#1a1a2e]">
      <h2 className="text-2xl animate-pulse">Raqib qidirilmoqda...</h2>
      <button onClick={onAIStart} className="mt-4 text-slate-400 underline">
        AI bilan mashg'ulotni boshlash
      </button>
    </div>
  );
}