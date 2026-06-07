import { useState, useEffect, useRef } from 'react';
import type { Opponent, UserProfile, MatchFilters, BattleResult } from '../types';
import { DEBATE_TOPICS } from '../types';
import { Mic, MicOff, Timer, Loader2 } from 'lucide-react';
import AvatarCard from './AvatarCard';

interface BattleScreenProps {
  user: UserProfile;
  opponent: Opponent;
  filters: MatchFilters;
  isAI: boolean;
  onBattleEnd: (result: BattleResult) => void;
}

export default function BattleScreen({ user, opponent, filters, isAI, onBattleEnd }: BattleScreenProps) {
  const [timeLeft, setTimeLeft] = useState(45);
  const [micActive, setMicActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const topics = DEBATE_TOPICS[filters.difficulty];
  const topic = useRef(topics[Math.floor(Math.random() * topics.length)]).current;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 🎤 Mikrofonni ishga tushirish
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.start(250); // Har 250ms da ma'lumot bo'laklarini yig'adi
      setMicActive(true);
    } catch (err) {
      console.error(err);
      alert("Mikrofonga ruxsat bering!");
    }
  }

  // 🛑 Yozishni to'xtatish va tahlilga yuborish
  async function stopRecordingAndAnalyze() {
    setMicActive(false);
    setIsAnalyzing(true);

    try {
      // MediaRecorder to'liq to'xtashini kafolatlaymiz
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          mediaRecorderRef.current!.onstop = () => resolve();
          mediaRecorderRef.current!.stop();
        });
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size < 1000) { // Juda qisqa yoki bo'sh ovoz
        throw new Error("Ovoz yetarlicha yozilmadi. Iltimos, qaytadan urinib ko'ring.");
      }

      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(audioBlob);
      });

      // Supabase Edge Function'ga so'rov
      const response = await fetch('https://soyduaaebyoecttbqgxl.supabase.co/functions/v1/analyze-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64Audio })
      });

      if (!response.ok) {
        throw new Error(`Server xatosi: ${response.status}`);
      }

      const result = await response.json();
      console.log("AI To'liq Javobi:", result);

      // Agarda Gemini xatolik qaytargan bo'lsa uni tutamiz
      if (result.error) {
        throw new Error(result.error.message || "Gemini API xatoligi yuz berdi");
      }

      // Gemini'dan kelgan tekstni obyektga parse qilish lozim (Agarda u string qaytargan bo'lsa)
      let parsedData = result;
      try {
        const textResponse = result.candidates[0].content.parts[0].text;
        // JSON bloklarini (```json ... ```) tozalash
        const cleanJson = textResponse.replace(/```json|```/g, "").trim();
        parsedData = JSON.parse(cleanJson);
      } catch (pErr) {
        console.error("JSON parse xatosi, eski holat qo'llaniladi", pErr);
      }

      onBattleEnd({
        userScores: parsedData.scores || { grammar: 6, vocabulary: 6, responseSpeed: 6, relevance: 6 },
        opponentScores: { grammar: 7, vocabulary: 7, responseSpeed: 7, relevance: 7 },
        feedback: parsedData.feedback || [{ 
          original: "N/A", 
          corrected: "N/A", 
          explanation: "Tahlil xatosi", 
          uzbekExplanation: "AI tahlil natijasini formatlashda xatolik." 
        }],
        topic,
        won: (parsedData.scores?.grammar || 6) > 6
      });

    } catch (error: any) {
      console.error("Tahlil xatosi:", error);
      setIsAnalyzing(false);
      alert(error.message || "AI tahlilida xatolik yuz berdi!");
    }
  }

  useEffect(() => {
    if (micActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            stopRecordingAndAnalyze();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [micActive]);

  if (isAnalyzing) return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center text-white">
      <Loader2 size={48} className="text-[#e94560] animate-spin mb-4" />
      <p>AI nutqingizni tahlil qilmoqda...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white p-6">
      <div className="text-center text-xs text-slate-500 mb-4 uppercase tracking-widest">
        {isAI ? "AI TRAINING MODE" : "PVP MATCH"}
      </div>

      <div className="flex justify-between items-center mb-8">
        <AvatarCard initials={opponent.avatar} size="lg" color="crimson" />
        <div className="flex flex-col items-center">
          <Timer className="text-slate-500 mb-1" size={20} />
          <span className="text-3xl font-black">{timeLeft}</span>
        </div>
        <AvatarCard initials={user.avatar} size="lg" color="emerald" />
      </div>

      <div className="bg-[#16213e] p-4 rounded-xl border border-slate-700 mb-8">
        <p className="text-slate-500 text-xs uppercase">Topic</p>
        <p className="font-bold text-lg">{topic}</p>
      </div>

      <button 
        onClick={micActive ? stopRecordingAndAnalyze : startRecording}
        className={`w-full py-4 rounded-full flex items-center justify-center gap-2 transition-all font-bold ${micActive ? 'bg-red-500' : 'bg-emerald-600'}`}
      >
        {micActive ? <MicOff /> : <Mic />} {micActive ? "STOP & ANALYZE" : "START SPEAKING"}
      </button>
    </div>
  );
}