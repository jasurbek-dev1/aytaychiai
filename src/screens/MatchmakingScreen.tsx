import { useEffect, useRef } from 'react';
import { findOrCreateMatch, subscribeToMatchChanges, leaveMatchLobby } from '../utils/matchmaking';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onMatchStart: (roomId: string) => void;
  onAIStart: () => void;
}

export default function MatchmakingScreen({ user, onMatchStart, onAIStart }: Props) {
  const matchIdRef = useRef<string | null>(null);

  useEffect(() => {
    let subscription: any = null;
    let timer: ReturnType<typeof setTimeout>;

    async function init() {
      const match = await findOrCreateMatch(user.id, user.name);
      
      if (!match) {
        onAIStart();
        return;
      }

      matchIdRef.current = match.id;

      if (match.status === 'matched' && match.room_id) {
        onMatchStart(match.room_id);
      } else {
        subscription = subscribeToMatchChanges(match.id, (roomId) => {
          onMatchStart(roomId);
        });
      }
    }

    init();

    // 15 soniyadan keyin AI ga o'tkazish
    timer = setTimeout(() => {
      onAIStart();
    }, 15000);

    return () => {
      clearTimeout(timer);
      if (subscription) subscription.unsubscribe();
      if (matchIdRef.current) leaveMatchLobby(matchIdRef.current);
    };
  }, [user.id, user.name, onMatchStart, onAIStart]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white bg-[#1a1a2e]">
      <h2 className="text-2xl animate-pulse">Raqib qidirilmoqda...</h2>
      <button onClick={onAIStart} className="mt-4 text-slate-400 underline">
        AI bilan mashg'ulotni boshlash
      </button>
    </div>
  );
}