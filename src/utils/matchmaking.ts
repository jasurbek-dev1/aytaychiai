import { supabase } from './supabase';

export interface MatchLobbyRow {
  id: string;
  player_id: string;
  player_name: string;
  status: 'waiting' | 'matched';
  room_id: string | null;
}

export async function findOrCreateMatch(playerId: string, playerName: string): Promise<MatchLobbyRow | null> {
  if (!supabase || !playerId) return null;

  // 1. Eski qoldiqlarni tozalash (Faqat kutayotgan bo'lsa o'chirish)
  await supabase.from('matches').delete().eq('player_id', playerId).eq('status', 'waiting');

  // 2. Mavjud raqibni izlash
  const { data: waitingPlayers } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'waiting')
    .neq('player_id', playerId)
    .order('created_at', { ascending: true })
    .limit(1);

  if (waitingPlayers && waitingPlayers.length > 0) {
    const opponent = waitingPlayers[0];
    const generatedRoomId = `room_${opponent.player_id}_${playerId}`;

    // Raqib topildi -> Raqib qatorini 'matched' qilamiz
    const { data: updatedMatch, error } = await supabase
      .from('matches')
      .update({ status: 'matched', room_id: generatedRoomId })
      .eq('id', opponent.id)
      .select()
      .single();

    if (error) return null;
    return updatedMatch;
  }

  // 3. Raqib topilmasa, o'zimiz navbatga turamiz
  const { data: newMatch, error } = await supabase
    .from('matches')
    .insert([{ player_id: playerId, player_name: playerName || 'Unknown', status: 'waiting' }])
    .select()
    .single();

  if (error) return null;
  return newMatch;
}

export function subscribeToMatchChanges(matchId: string, onMatched: (roomId: string) => void) {
  if (!supabase) return null;

  const channel = supabase.channel(`match:${matchId}`);

  channel
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'matches',
      filter: `id=eq.${matchId}` 
    }, (payload: any) => {
      const row = payload.new;
      if (row.status === 'matched' && row.room_id) {
        onMatched(row.room_id);
      }
    })
    .subscribe();

  return channel;
}

// BU YERNI O'ZGARTIRDIK: Faqat o'yin boshlanmagan bo'lsa lobbidan o'chiradi
export async function leaveMatchLobby(matchId: string) {
  if (!supabase) return;
  
  // Avval statusni tekshiramiz
  const { data } = await supabase.from('matches').select('status').eq('id', matchId).single();
  if (data && data.status === 'waiting') {
    await supabase.from('matches').delete().eq('id', matchId);
  }
}