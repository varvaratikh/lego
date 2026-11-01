import React from 'react';
import { MinifigureData } from '../types.ts';
import { Utensils, Zap, Smile, MessageCircle, X, Sparkles, Footprints } from 'lucide-react';

interface SimsHUDProps {
  minifig: MinifigureData | null;
  onClose: () => void;
  onFulfillNeed: (need: 'hunger' | 'energy' | 'fun' | 'social') => void;
  onRandomizeOutfit: () => void;
}

export const SimsHUD: React.FC<SimsHUDProps> = ({
  minifig,
  onClose,
  onFulfillNeed,
  onRandomizeOutfit,
}) => {
  if (!minifig) return null;

  const getNeedColor = (val: number) => {
    if (val > 60) return 'bg-emerald-500';
    if (val > 30) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const getMoodTitle = () => {
    const avg = (minifig.needs.hunger + minifig.needs.energy + minifig.needs.fun + minifig.needs.social) / 4;
    if (avg > 80) return 'В полном восторге!';
    if (avg > 50) return 'Хорошее настроение';
    if (avg > 30) return 'Немного устал';
    return 'Нуждается во внимании!';
  };

  return (
    <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-20 w-[calc(100vw-1rem)] sm:w-80 max-w-sm bg-slate-900/95 backdrop-blur-md rounded-2xl border border-emerald-500/50 shadow-2xl p-3.5 sm:p-4 text-slate-100 animate-in fade-in slide-in-from-right duration-200">
      {/* Header with Sim Avatar & Name */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          {/* Yellow Lego Minifig Avatar Icon */}
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border-2 border-amber-400/80"
            style={{ backgroundColor: minifig.outfitColor }}
          >
            <span className="filter drop-shadow">
              {minifig.faceExpression === 'cool' ? '😎' :
               minifig.faceExpression === 'sleepy' ? '😴' :
               minifig.faceExpression === 'surprised' ? '😮' : '😊'}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-sm text-slate-100">{minifig.name}</h3>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              {getMoodTitle()}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X size={16} />
        </button>
      </div>

      {/* Active Thought Bubble */}
      {minifig.thoughtBubble && (
        <div className="my-2.5 px-3 py-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl flex items-center gap-2 text-xs text-emerald-200">
          <span className="text-lg">{minifig.thoughtBubble.icon}</span>
          <span>{minifig.thoughtBubble.text}</span>
        </div>
      )}

      {/* Needs Bars (The Sims style!) */}
      <div className="space-y-2.5 my-3">
        {/* Hunger */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Utensils size={13} className="text-amber-400" /> Сытость
            </span>
            <button
              onClick={() => onFulfillNeed('hunger')}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
            >
              Перекусить +
            </button>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getNeedColor(minifig.needs.hunger)}`}
              style={{ width: `${minifig.needs.hunger}%` }}
            />
          </div>
        </div>

        {/* Energy */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Zap size={13} className="text-blue-400" /> Бодрость
            </span>
            <button
              onClick={() => onFulfillNeed('energy')}
              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
            >
              Отдохнуть +
            </button>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getNeedColor(minifig.needs.energy)}`}
              style={{ width: `${minifig.needs.energy}%` }}
            />
          </div>
        </div>

        {/* Fun */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Smile size={13} className="text-pink-400" /> Веселье
            </span>
            <button
              onClick={() => onFulfillNeed('fun')}
              className="text-[10px] text-pink-400 hover:text-pink-300 font-semibold"
            >
              Развлечься +
            </button>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getNeedColor(minifig.needs.fun)}`}
              style={{ width: `${minifig.needs.fun}%` }}
            />
          </div>
        </div>

        {/* Social */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1.5">
              <MessageCircle size={13} className="text-emerald-400" /> Общение
            </span>
            <button
              onClick={() => onFulfillNeed('social')}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Поболтать +
            </button>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getNeedColor(minifig.needs.social)}`}
              style={{ width: `${minifig.needs.social}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer controls: Randomize outfit / Walk hint */}
      <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between text-xs text-slate-400">
        <button
          onClick={onRandomizeOutfit}
          className="flex items-center gap-1 text-slate-300 hover:text-amber-300 transition"
        >
          <Sparkles size={13} /> <span>Сменить наряд</span>
        </button>

        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Footprints size={12} /> Клик по полу — идти
        </span>
      </div>
    </div>
  );
};
