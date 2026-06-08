import { supabase } from "./supabase";

function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase client is not initialized.");
  }
  return supabase;
}

// 1. O'yin yaratish yoki boriga ulanish (Xavfsiz va aniq mantiq)
export async function findOrCreateMatch(playerId: string, playerName: string) {
  try {
    if (!playerId) return null;
    const client = getSupabaseClient();

    // 1. Eski qotib qolgan 'waiting' qatorlarimizni tozalaymiz
    await client
      .from("matches")
      .delete()
      .eq("player_id", playerId)
      .eq("status", "waiting");

    // 2. Kutib turgan birinchi faol real o'yinchini qidiramiz
    // .neq("player_id", playerId) orqali o'z-o'zimizga ulanib qolishni oldini olamiz
    const { data: waitingMatches, error: searchError } = await client
      .from("matches")
      .select("*")
      .eq("status", "waiting")
      .neq("player_id", playerId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (searchError) throw searchError;

    // 3. Agar kutayotgan o'yinchi topilsa, uning mavjud qatorini YANGILAYMIZ (Unga ulanamiz)
    if (waitingMatches && waitingMatches.length > 0) {
      const targetMatch = waitingMatches[0];
      const generatedRoomId = `room_${targetMatch.player_id}_${playerId}`;

      // MUHIM CHORRAHA: Faqat o'sha o'yinchi hali ham 'waiting' holatida bo'lsagina yangilaymiz
      const { data: updatedMatch, error: updateError } = await client
        .from("matches")
        .update({
          status: "matched",
          room_id: generatedRoomId,
          opponent_name: playerName // 1-o'yinchi bizning ismimizni raqib sifatida ko'radi
        })
        .eq("id", targetMatch.id)
        .eq("status", "waiting") // Xavfsizlik filtri: boshqa birov ulonib ketmagan bo'lsin
        .select()
        .maybeSingle();

      // Agar xatolik bo'lsa yoki biz ulgurgunimizcha kimdir ulanib ketgan bo'lsa, pastga o'tib yangi xona ochadi
      if (!updateError && updatedMatch) {
        return {
          id: updatedMatch.id,
          room_id: generatedRoomId,
          player_id: playerId,
          player_name: playerName,
          opponent_name: targetMatch.player_name || "Online Opponent",
          status: "matched"
        };
      }
    }

    // 4. Agar hech kim kutmayotgan bo'lsa, o'zimiz 1-o'yinchi bo'lib Lobbida navbatga turamiz
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
      .maybeSingle();

    if (insertError) throw insertError;
    return newMatch;

  } catch (error) {
    console.error("Matchmaking xatoligi (findOrCreateMatch):", error);
    return null;
  }
}

// 2. Realtime o'zgarishlarni eshitish
export function subscribeToMatchChanges(matchId: string, onUpdate: (payload: any) => void) {
  try {
    const client = getSupabaseClient();
    if (!matchId) return null;
    
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

// 3. Lobbini tark etish (Xatoliksiz, toza variant)
export async function leaveMatchLobby(playerId: string) {
  try {
    if (!playerId) return;
    const client = getSupabaseClient();
    
    // 1. Agar playerId matches jadvalidagi UUID bo'lsa
    if (playerId.includes('-') || playerId.length > 20) {
      await client
        .from("matches")
        .delete()
        .eq("id", playerId);
    }

    // 2. Foydalanuvchining o'z Telegram ID-si bo'yicha kutayotgan xonalarini o'chirish
    await client
      .from("matches")
      .delete()
      .eq("player_id", playerId)
      .eq("status", "waiting");
      
    console.log("Lobby muvaffaqiyatli tozalandi.");
  } catch (error) {
    console.error("Lobbini tark etishda xatolik:", error);
  }
}