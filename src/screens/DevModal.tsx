import { X, MessageCircle, Code2, Zap } from 'lucide-react';

interface DevModalProps {
  onClose: () => void;
}

export default function DevModal({ onClose }: DevModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#16213e] border border-[#e94560]/40 rounded-t-3xl p-6 pb-10 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-2" />

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#e94560]/10 border border-[#e94560]/30 mb-3">
            <Code2 size={24} className="text-[#e94560]" />
          </div>
          <div className="text-white font-black text-lg tracking-wider">DEVELOPER CONTACT</div>
          <div className="text-xs text-slate-500 mt-1">Secret Arena Gateway · Triple Tap Activated</div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#e94560]/40 to-transparent" />

        <div className="bg-[#1a1a2e] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-amber-400" />
            <div>
              <div className="text-xs text-slate-500">Project</div>
              <div className="text-sm text-white font-bold">Clash of English · v1.0</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Code2 size={16} className="text-sky-400" />
            <div>
              <div className="text-xs text-slate-500">Stack</div>
              <div className="text-sm text-white font-bold">React · TypeScript · Supabase · Vite</div>
            </div>
          </div>
        </div>

        <a
          href="https://t.me/dasturchi_27"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-[#e94560] to-[#c0392b] text-white font-black text-base tracking-wider shadow-xl shadow-[#e94560]/30 hover:shadow-[#e94560]/50 transition-all duration-200"
        >
          <MessageCircle size={20} />
          CONTACT DEVELOPER ON TELEGRAM
        </a>

        <button
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-600 text-slate-400 text-sm font-bold tracking-wider hover:border-slate-400 transition-all duration-200"
        >
          <X size={14} />
          CLOSE GATEWAY
        </button>
      </div>
    </div>
  );
}
