import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// ==========================================
// LOCAL STORAGE YORDAMCHI FUNKSIYALARI
// ==========================================
function getLocalProfile(telegramId: string): UserProfile | null {
  const data = localStorage.getItem(`user_profile_${telegramId}`);
  return data ? JSON.parse(data) : null;
}

function saveLocalProfile(profile: UserProfile): UserProfile {
  localStorage.setItem(`user_profile_${profile.id}`, JSON.stringify(profile));
  return profile;
}

// ==========================================
// SUPABASE JADVALIGA MOSLANGAN ASOSIY FUNKSIYALAR
// ==========================================

export async function getOrCreateProfile(telegramId: string, defaultName: string): Promise<UserProfile> {
  const fallbackProfile: UserProfile = {
    id: telegramId,
    name: defaultName,
    avatar: defaultName.slice(0, 2).toUpperCase(),
    xp: 0,
    rank: 'C',
    wins: 0,
    losses: 0,
    streak: 0,
    winRate: '0%'
  };

  if (!supabase) {
    return getLocalProfile(telegramId) || saveLocalProfile(fallbackProfile);
  }

  try {
    // 🌟 image_a4aa80.png dagi 'telegram_id' ustuniga moslab so'raymiz
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    if (error && error.code === 'PGRST116') {
      // 🌟 Yangi foydalanuvchini faqat sizda bor ustunlar bilan bazaga qo'shamiz
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          telegram_id: telegramId,
          username: defaultName,
          wins: 0,
          streak: 0,
          xp: 0
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Kelgan ma'lumotni frontend (TypeScript) tipiga o'giramiz
      return {
        id: newProfile.telegram_id,
        name: newProfile.username,
        avatar: newProfile.username.slice(0, 2).toUpperCase(),
        xp: newProfile.xp,
        rank: 'C',
        wins: newProfile.wins,
        losses: 0,
        streak: newProfile.streak,
        winRate: '0%'
      };
    } else if (error) {
      throw error;
    }

    // 🌟 Bazadan kelgan ma'lumotni loyiha interfeysiga o'giramiz (Mapping)
    return {
      id: data.telegram_id,
      name: data.username || defaultName,
      avatar: (data.username || defaultName).slice(0, 2).toUpperCase(),
      xp: data.xp || 0,
      rank: (data.xp || 0) >= 5000 ? 'S' : (data.xp || 0) >= 2500 ? 'A' : (data.xp || 0) >= 1000 ? 'B' : 'C',
      wins: data.wins || 0,
      losses: 0, 
      streak: data.streak || 0,
      winRate: data.wins > 0 ? '100%' : '0%'
    };
  } catch (err) {
    console.warn('Supabase profile fetch failed, using localStorage:', err);
    return getLocalProfile(telegramId) || saveLocalProfile(fallbackProfile);
  }
}

export async function updateProfileStats(
  telegramId: string, 
  xpGained: number, 
  isWin: boolean
): Promise<UserProfile | null> {
  
  let currentProfile: UserProfile;
  
  if (supabase) {
    const { data } = await supabase.from('profiles').select('*').eq('telegram_id', telegramId).single();
    currentProfile = data ? {
      id: data.telegram_id,
      name: data.username,
      avatar: data.username.slice(0, 2).toUpperCase(),
      xp: data.xp || 0,
      rank: 'C',
      wins: data.wins || 0,
      losses: 0,
      streak: data.streak || 0,
      winRate: '0%'
    } : getLocalProfile(telegramId)!;
  } else {
    currentProfile = getLocalProfile(telegramId)!;
  }

  if (!currentProfile) return null;

  const newXp = currentProfile.xp + xpGained;
  const newWins = currentProfile.wins + (isWin ? 1 : 0);
  const newStreak = isWin ? currentProfile.streak + 1 : 0;

  // 🌟 Faqat Supabase jadvalingizda bor ustunlarni yangilash uchun obyekt
  const updatedData = {
    wins: newWins,
    streak: newStreak,
    xp: newXp
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('telegram_id', telegramId)
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.telegram_id,
        name: data.username,
        avatar: data.username.slice(0, 2).toUpperCase(),
        xp: data.xp,
        rank: data.xp >= 5000 ? 'S' : data.xp >= 2500 ? 'A' : data.xp >= 1000 ? 'B' : 'C',
        wins: data.wins,
        losses: 0,
        streak: data.streak,
        winRate: '100%'
      };
    } catch (err) {
      console.warn('Supabase update failed, backing up to local:', err);
    }
  }

  const localUpdated = { ...currentProfile, ...updatedData };
  return saveLocalProfile(localUpdated);
}

// ==========================================
// SHARHLARNI (REVIEWS) SAQLASH FUNKSIYASI
// ==========================================
export async function submitReview(review: { stars: number; comment: string; user_name: string }) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single();
    if (error) throw error;
    console.log('Review saved to Supabase:', data);
    return data;
  } catch (err) {
    console.error('Failed to save review:', err);
    return null;
  }
}