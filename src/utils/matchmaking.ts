import { supabase } from "./supabase";

function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase client is not initialized.");
  }
  return supabase;
}

// 1. O'yin yaratish yoki boriga ulanish
export async function findOrCreateMatch(playerId: string, playerName: string) {
  try {
    if (!playerId) return null;
    const client = getSupabaseClient();

    // Eski qotib qolgan qatorlarni tozalash
    await client
      .from("matches")
      .delete()
      .eq("player_id", playerId);

    // Kutib turgan birinchi faol o'yinchini qidiramiz
    const { data: waitingMatches, error: searchError } = await client
      .from("matches")
      .select("*")
      .eq("status", "waiting")
      .neq("player_id", playerId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (searchError) throw searchError;

    // Agar raqib bo'lsa, unga ulanamiz
    if (waitingMatches && waitingMatches.length > 0) {
      const targetMatch = waitingMatches[0];
      const generatedRoomId = `room_${targetMatch.player_id}_${playerId}`;

      const { data: updatedMatch, error: updateError } = await client
        .from("matches")
        .update({
          status: "matched",
          room_id: generatedRoomId,
          opponent_name: playerName
        })
        .eq("id", targetMatch.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        ...updatedMatch,
        opponent_name: targetMatch.player_name || "Online Opponent"
      };
    }

    // Hech kim bo'lmasa, o'zimiz navbatga turamiz
    const { data: newMatch, error: insertError } = await client
      .from("matches")
      .insert([
        {
          player_id: playerId,
          player_name: playerName || "Anonymous Fighter",
          status: "waiting",
          room_id: null,
          opponent_name: null
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;
    return newMatch;

  } catch (error) {
    console.error("Matchmaking xatoligi:", error);
    return null;
  }
}

// 2. 🔥 APP.TSX KUTAYOTGAN FUNKSIYA: Realtime o'zgarishlarni eshitish
export function subscribeToMatchChanges(matchId: string, onUpdate: (payload: any) => void) {
  try {
    const client = getSupabaseClient();
    
    return client
      .channel(`match_${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        (payload) => {
          onUpdate(payload.new);
        }
      )
      .subscribe();
  } catch (error) {
    console.error("Realtime obuna xatoligi:", error);
    return null;
  }
}

// 3. 🔥 APP.TSX KUTAYOTGAN FUNKSIYA: Lobbini tark etish (Taymer tugaganda o'chirish)
export async function leaveMatchLobby(playerId: string) {
  try {
    if (!playerId) return;
    const client = getSupabaseClient();
    
    await client
      .from("matches")
      .delete()
      .eq("player_id", playerId)
      .eq("status", "waiting");
  } catch (error) {
    console.error("Lobbini tark etishda xatolik:", error);
  }
}