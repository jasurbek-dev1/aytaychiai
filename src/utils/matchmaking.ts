import { supabase } from './supabase';

export interface MatchLobbyRow {
  id: string;
  player_id: string;
  player_name: string;
  status: 'waiting' | 'matched';
  room_id: string | null;
}

export async function findOrCreateMatch(playerId: string, playerName: string): Promise<MatchLobbyRow | null> {
  if (!supabase) return null;

  // 1. MUHIM: Har qanday qidiruvdan oldin shu foydalanuvchining 
  // eski 'waiting' holatidagi qoldiqlarini o'chirib tashlaymiz (duplikatlar oldini olish uchun)
  await supabase.from('matches').delete().eq('player_id', playerId);

  // 2. Mavjud 'waiting' holatidagi raqibni izlash
  const { data: waitingPlayers } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'waiting')
    .neq('player_id', playerId) // O'zimizni raqib sifatida topmasligimiz uchun
    .order('created_at', { ascending: true })
    .limit(1);

  if (waitingPlayers && waitingPlayers.length > 0) {
    const opponent = waitingPlayers[0];
    const generatedRoomId = `room_${opponent.player_id}_${playerId}`;

    // Raqib topildi -> raqibning statusini 'matched' ga o'tkazamiz
    const { data: updatedMatch, error } = await supabase
      .from('matches')
      .update({ status: 'matched', room_id: generatedRoomId })
      .eq('id', opponent.id)
      .select()
      .single();

    if (error) return null;
    return updatedMatch;
  }

  // 3. Raqib topilmasa, o'zimizni kutish ro'yxatiga qo'shamiz
  const { data: newMatch, error } = await supabase
    .from('matches')
    .insert([{ player_id: playerId, player_name: playerName, status: 'waiting' }])
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
      // Agar status 'matched' ga o'zgarsa, o'yinni boshlaymiz
      if (row.status === 'matched' && row.room_id) {
        onMatched(row.room_id);
      }
    })
    .subscribe();

  return channel;
}

export async function leaveMatchLobby(matchId: string) {
  if (!supabase) return;
  // O'yin tugaganda yoki chiqib ketganda bazadan o'chiramiz
  await supabase.from('matches').delete().eq('id', matchId);
}