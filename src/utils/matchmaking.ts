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

    // 1. Eski qotib qolgan qatorlarni tozalash (Faqat 'waiting' holatidagilarni)
    await client
      .from("matches")
      .delete()
      .eq("player_id", playerId)
      .eq("status", "waiting");

    // 2. Kutib turgan birinchi faol o'yinchini qidiramiz
    const { data: waitingMatches, error: searchError } = await client
      .from("matches")
      .select("*")
      .eq("status", "waiting")
      .neq("player_id", playerId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (searchError) throw searchError;

    // 3. Agar kutayotgan real o'yinchi bo'lsa, unga ulanamiz
    if (waitingMatches && waitingMatches.length > 0) {
      const targetMatch = waitingMatches[0];
      // Ikki o'yinchi uchun ham bir xil bo'lgan unikal xona ID-si
      const generatedRoomId = `room_${targetMatch.player_id}_${playerId}`;

      // Kutayotgan o'yinchining qatorini yangilaymiz
      const { data: updatedMatch, error: updateError } = await client
        .from("matches")
        .update({
          status: "matched",
          room_id: generatedRoomId,
          opponent_name: playerName // Bizning ismimiz birinchi o'yinchi uchun raqib ismi bo'ladi
        })
        .eq("id", targetMatch.id)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;

      // App.tsx ga ma'lumot qaytaramiz (Biz 2-o'yinchi bo'lganimiz sababli, biz uchun raqib - targetMatch'dir)
      return {
        id: targetMatch.id,
        room_id: generatedRoomId,
        player_id: playerId,
        player_name: playerName,
        opponent_name: targetMatch.player_name || "Online Opponent",
        status: "matched"
      };
    }

    // 4. Agar hech kim kutmayotgan bo'lsa, o'zimiz navbatga (Lobby) turamiz
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
      .maybeSingle(); // single() o'rniga maybeSingle() xatolikni kamaytiradi

    if (insertError) throw insertError;
    return newMatch;

  } catch (error) {
    console.error("Matchmaking xatoligi (findOrCreateMatch):", error);
    return null;
  }
}

// 2. Realtime o'zgarishlarni eshitish (Agar kelajakda polling o'rniga ishlatmoqchi bo'lsangiz)
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

// 3. Lobbini tark etish (Faqat o'zimiz ochgan 'waiting' xonani o'chirish)
// 3. Lobbini tark etish (Xatoliksiz, toza variant)
export async function leaveMatchLobby(playerId: string) {
  try {
    if (!playerId) return;
    const client = getSupabaseClient();
    
    // Xavfsiz bo'lishi uchun har bir o'chirish so'rovini alohida-alohida va toza bajaramiz
    // 1. Agar playerId matches jadvalidagi avto-generatsiya bo'lgan ID (UUID) bo'lsa
    if (playerId.includes('-') || playerId.length > 20) {
      await client
        .from("matches")
        .delete()
        .eq("id", playerId);
    }

    // 2. Foydalanuvchining o'z Telegram/Test ID-si bo'yicha kutayotgan xonalarini o'chirish
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