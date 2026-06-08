import { supabase } from "./supabase";

// TypeScript xatosini oldini olish uchun xavfsiz tekshiruv funksiyasi
function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase client is not initialized. Check your env variables.");
  }
  return supabase;
}

// 1. O'yin qidirish va yaratish funksiyasi
export async function findOrCreateMatch(playerId: string, playerName: string) {
  try {
    if (!playerId) {
      console.error("Xatolik: playerId bo'sh bo'lishi mumkin emas!");
      return null;
    }

    const client = getSupabaseClient();

    // Eski tiqilib qolgan 'waiting' o'yinlarimizni tozalaymiz
    await client
      .from("matches")
      .delete()
      .eq("player_id", playerId);

    // Boshqa o'yinchi kutib turibdimi tekshiramiz
    const { data: waitingMatches, error: searchError } = await client
      .from("matches")
      .select("*")
      .eq("status", "waiting")
      .neq("player_id", playerId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (searchError) throw searchError;

    // Agar raqib topilsa, unga ulanamiz
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

    // Kutayotgan hech kim bo'lmasa, navbatga turamiz
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
    console.error("Matchmaking tizimida xatolik yuz berdi:", error);
    return null;
  }
}

// 2. 🔥 APP.TSX KUTAYOTGAN EKSPORT: Realtime o'zgarishlarni eshitish funksiyasi
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
    console.error("Subscription xatoligi:", error);
    return null;
  }
}

// 3. 🔥 APP.TSX KUTAYOTGAN EKSPORT: Lobbini tark etish (Cancel search) funksiyasi
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