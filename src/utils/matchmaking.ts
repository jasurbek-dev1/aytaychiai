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

  // 1. Eski tasodifiy qolgan kutish qatorlarini o'chiramiz
  await supabase.from('matches').delete().eq('player_id', playerId).eq('status', 'waiting');

  // 2. Kutib turgan boshqa o'yinchini qidiramiz
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

    // Kutib turgan raqib qatorini 'matched' holatiga o'tkazamiz
    const { data: updatedMatch, error } = await supabase
      .from('matches')
      .update({ status: 'matched', room_id: generatedRoomId })
      .eq('id', opponent.id)
      .select()
      .single();

    if (error) return null;

    // Raqib topgan o'yinchi uchun ham xuddi shu ma'lumotni qaytaramiz (leking raqib ismini qo'shib)
    return {
      ...updatedMatch,
      player_name: opponent.player_name // Frontend raqib ismini bilishi uchun
    };
  }

  // 3. Agar hech kim kutmayotgan bo'lsa, o'zimiz navbatga turamiz
  const { data: newMatch, error } = await supabase
    .from('matches')
    .insert([{ player_id: playerId, player_name: playerName || 'Unknown Player', status: 'waiting', room_id: null }])
    .select()
    .single();

  if (error) return null;
  return newMatch;
}

export function subscribeToMatchChanges(matchId: string, onMatched: (roomId: string, opponentName: string) => void) {
  if (!supabase) return null;

  const channel = supabase.channel(`match_${matchId}`);

  channel
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'matches',
      filter: `id=eq.${matchId}` 
    }, async (payload: any) => {
      const row = payload.new;
      if (row.status === 'matched' && row.room_id) {
        // Biz kutib turgan edik, kimdir kelib bizni 'matched' qildi.
        // Bizni juftlagan o'yinchining ismini bazadan qidirib topamiz (ixtiyoriy, xatolik oldini olish uchun)
        onMatched(row.room_id, 'Online Opponent');
      }
    })
    .subscribe();

  return channel;
}

export async function leaveMatchLobby(matchId: string) {
  if (!supabase) return;
  const { data } = await supabase.from('matches').select('status').eq('id', matchId).single();
  if (data && data.status === 'waiting') {
    await supabase.from('matches').delete().eq('id', matchId);
  }
}