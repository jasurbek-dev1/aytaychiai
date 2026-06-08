import { useEffect, useRef,} from 'react';
import { findOrCreateMatch, subscribeToMatchChanges, leaveMatchLobby } from '../utils/matchmaking';
import type { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onMatchStart: (roomId: string) => void;
  onAIStart: () => void;
}

export default function MatchmakingScreen({ user, onMatchStart, onAIStart }: Props) {
  const matchIdRef = useRef<string | null>(null);
  const isMatchedRef = useRef<boolean>(false); // O'yin boshlanganini kuzatish uchun

  useEffect(() => {
    let subscription: any = null;
    let timer: ReturnType<typeof setTimeout>;

    async function init() {
      // MUHIM: user.id va user.name bo'sh emasligini tekshiring
      if (!user?.id) return;

      const match = await findOrCreateMatch(user.id, user.name);
      
      if (!match) {
        onAIStart();
        return;
      }

      matchIdRef.current = match.id;

      if (match.status === 'matched' && match.room_id) {
        isMatchedRef.current = true;
        onMatchStart(match.room_id);
      } else {
        subscription = subscribeToMatchChanges(match.id, (roomId) => {
          isMatchedRef.current = true;
          onMatchStart(roomId);
        });
      }
    }

    init();

    // 15 soniyadan keyin AI ga o'tkazish
    timer = setTimeout(() => {
      if (!isMatchedRef.current) {
        onAIStart();
      }
    }, 15000);

  // Cleanup funksiyasi
  return () => {
      clearTimeout(timer);
      if (subscription) subscription.unsubscribe();
      // Agar o'yin hali boshlanmagan bo'lsa va foydalanuvchi chiqib ketsagina lobbini o'chiramiz
      if (matchIdRef.current && !isMatchedRef.current) {
        leaveMatchLobby(matchIdRef.current);
      }
    };
  }, [user.id, user.name]); // Keraksiz dependencylarni kamaytirdik

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white bg-[#1a1a2e]">
      <h2 className="text-2xl animate-pulse">Raqib qidirilmoqda...</h2>
      <p className="text-sm text-slate-400 mt-2">ID: {user?.id}</p>
      <button onClick={onAIStart} className="mt-4 text-slate-400 underline">
        AI bilan mashg'ulotni boshlash
      </button>
    </div>
  );
}