import { supabase } from './supabase';

export interface MatchLobbyRow {
  id: string;
  player_id: string;
  player_name: string;
  status: 'waiting' | 'matched';
  room_id: string | null;
  opponent_name?: string; // Raqib ismini ushlash uchun qo'shildi
}

export async function findOrCreateMatch(playerId: string, playerName: string): Promise<MatchLobbyRow | null> {
  if (!supabase || !playerId) return null;

  // 1. Eski qolib ketgan kutish qatorlarini tozalash
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

    // Kutib turgan raqib qatorini yangilaymiz (O'zimizni ismimizni room_id bilan birga raqib sifatida yozamiz)
    const { data: updatedMatch, error } = await supabase
      .from('matches')
      .update({ 
        status: 'matched', 
        room_id: generatedRoomId,
        // Diqqat: bazangizda ustun nomi yo'q bo'lsa ham room_id orqali frontend ajratib oladi,
        // Lekin raqib ismini yuborish uchun player_name'ni qaytaramiz
      })
      .eq('id', opponent.id)
      .select()
      .single();

    if (error) return null;

    return {
      ...updatedMatch,
      opponent_name: opponent.player_name // Bizga raqib bo'lgan odamning ismi
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

// UPDATE hodisasida butun payload'ni qaytaradigan qilamiz
export function subscribeToMatchChanges(matchId: string, onMatched: (updatedRow: any) => void) {
  if (!supabase) return null;

  const channel = supabase.channel(`match_${matchId}`);

  return channel
    .on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'matches',
      filter: `id=eq.${matchId}` 
    }, (payload: any) => {
      const row = payload.new;
      if (row.status === 'matched') {
        onMatched(row); // Butun qatorni frontend'ga uzatamiz
      }
    })
    .subscribe();
}

export async function leaveMatchLobby(matchId: string) {
  if (!supabase) return;
  const { data } = await supabase.from('matches').select('status').eq('id', matchId).single();
  if (data && data.status === 'waiting') {
    await supabase.from('matches').delete().eq('id', matchId);
  }
}