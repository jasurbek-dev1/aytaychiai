import { supabase } from './supabase';

export interface MatchLobbyRow {
  id: string;
  player_id: string;
  player_name: string;
  status: 'waiting' | 'matched';
  room_id: string | null;
}

// 1. Kutish zaliga (Lobby) kirish yoki mavjud raqibni qidirish
export async function findOrCreateMatch(playerId: string, playerName: string): Promise<MatchLobbyRow | null> {
  // TypeScript xavfsizligi uchun supabase borligini tekshiramiz
  if (!supabase) {
    console.error('Supabase client is not initialized.');
    return null;
  }

  const { data: waitingPlayers, error: fetchError } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'waiting')
    .neq('player_id', playerId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (fetchError) {
    console.error('Error fetching waiting players:', fetchError);
    return null;
  }

  if (waitingPlayers && waitingPlayers.length > 0) {
    const opponentMatch = waitingPlayers[0];
    const generatedRoomId = `room_${opponentMatch.player_id}_${playerId}`;

    const { data: updatedMatch, error: updateError } = await supabase
      .from('matches')
      .update({
        status: 'matched',
        room_id: generatedRoomId
      })
      .eq('id', opponentMatch.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating opponent match:', updateError);
      return null;
    }

    return updatedMatch;
  }

  const { data: newMatch, error: insertError } = await supabase
    .from('matches')
    .insert([
      {
        player_id: playerId,
        player_name: playerName,
        status: 'waiting',
        room_id: null
      }
    ])
    .select()
    .single();

  if (insertError) {
    console.error('Error creating match row:', insertError);
    return null;
  }

  return newMatch;
}

// 2. Realtime obuna bo'lish
export function subscribeToMatchChanges(
  matchId: string,
  onMatched: (roomId: string) => void
) {
  if (!supabase) {
    console.error('Supabase client is not initialized.');
    return null;
  }

  // Kanal nomini soddalashtiramiz va log qo'shamiz
  const channel = supabase.channel(`match_channel:${matchId}`);

  channel
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      },
      (payload) => {
        console.log("Realtime payload keldi:", payload); // <-- Buni F12 da tekshiring!
        const updatedRow = payload.new as any;
        
        if (updatedRow.status === 'matched' && updatedRow.room_id) {
          console.log("Raqib topildi, Room ID:", updatedRow.room_id);
          onMatched(updatedRow.room_id);
        }
      }
    )
    .subscribe((status) => {
      console.log("Realtime ulanish holati:", status); // <-- "SUBSCRIBED" bo'lishi shart!
      if (status !== 'SUBSCRIBED') {
        console.error("Realtime ulanish xatosi:", status);
      }
    });

  return channel;
}

// 3. Kutish zalidan chiqib ketish
export async function leaveMatchLobby(matchId: string) {
  if (!supabase) return;
  await supabase.from('matches').delete().eq('id', matchId);
}