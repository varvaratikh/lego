import React, { useState } from 'react';
import { 
  Box, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Save, 
  FolderOpen, 
  Trash, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { WorldPreset } from '../lego/presets.ts';

interface TopNavProps {
  currentPresetId: string;
  onSelectPreset: (presetId: string) => void;
  brickCount: number;
  simsCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onSaveWorld: () => void;
  onClearWorld: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentPresetId,
  onSelectPreset,
  brickCount,
  simsCount,
  isMuted,
  onToggleMute,
  onSaveWorld,
  onClearWorld,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header className="fixed top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: App Title and Stats Badge */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-700/80 shadow-xl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-xs sm:text-sm tracking-tighter shadow-md border border-red-400 select-none">
            LEGO
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs sm:text-sm text-slate-100 tracking-tight">
                LegoSim <span className="text-amber-400">3D</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-400/30">
                СИМУЛЯТОР
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-400 font-medium">
              <span>Кубиков: <b className="text-slate-200">{brickCount}</b></span>
              <span>•</span>
              <span>Жителей: <b className="text-emerald-400">{simsCount}</b></span>
            </div>
          </div>
        </div>

        {/* Center: Presets Switcher (Desktop Buttons / Mobile Dropdown) */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl sm:rounded-2xl border border-slate-700/80 shadow-xl">
          {/* Mobile Select dropdown */}
          <div className="md:hidden">
            <select
              value={currentPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="bg-slate-800 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none cursor-pointer"
            >
              <option value="cozy_house">🏡 Домик Симс</option>
              <option value="physics_tower">🏰 Башня Разрушений</option>
              <option value="empty_sandbox">🟩 Чистая Песочница</option>
            </select>
          </div>

          {/* Desktop segmented buttons */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectPreset('cozy_house')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                currentPresetId === 'cozy_house'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              🏡 Домик Симс
            </button>
            <button
              onClick={() => onSelectPreset('physics_tower')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                currentPresetId === 'physics_tower'
                  ? 'bg-rose-500 text-white shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              🏰 Башня Разрушений
            </button>
            <button
              onClick={() => onSelectPreset('empty_sandbox')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                currentPresetId === 'empty_sandbox'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              🟩 Чистая Песочница
            </button>
          </div>
        </div>

        {/* Right: Sound, Save, Clear & Help */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/95 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-slate-700/80 shadow-xl">
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
            className="p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg sm:rounded-xl transition"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button
            onClick={onSaveWorld}
            title="Сохранить мир в память браузера"
            className="p-1.5 sm:p-2 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded-lg sm:rounded-xl transition"
          >
            <Save size={15} />
          </button>

          <button
            onClick={onClearWorld}
            title="Очистить все кубики"
            className="p-1.5 sm:p-2 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-lg sm:rounded-xl transition"
          >
            <Trash size={15} />
          </button>

          <button
            onClick={() => setShowHelp(true)}
            title="Инструкция и управление"
            className="p-1.5 sm:p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg sm:rounded-xl transition"
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </header>

      {/* Help & Controls Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-lg w-full text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="font-extrabold text-base flex items-center gap-2 text-amber-400">
                <Box size={20} /> Руководство по игре LegoSim 3D
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <h4 className="font-bold text-amber-300 mb-1">🔨 Строительство:</h4>
                <p>• Наведите курсор на пластину или другой кубик — деталь примагнитится по сетке шипов LEGO.</p>
                <p>• Нажмите <b>Клавишу R</b> или кнопку на панели, чтобы повернуть кубик на 90 градусов.</p>
                <p>• Левый клик — установить кубик с реалистичным щелчком!</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <h4 className="font-bold text-emerald-300 mb-1">🏃 Жизнь человечков (Симс):</h4>
                <p>• Нажмите на любого лего-человечка, чтобы увидеть его потребности (Сытость, Бодрость, Веселье, Общение).</p>
                <p>• В режиме «Симс-Человечки» кликните на любую точку пола или постройки — человечек зашагает туда.</p>
                <p>• Используйте команды «Поесть», «Отдохнуть», «Танцевать!» или следите камерой за его жизнью.</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <h4 className="font-bold text-rose-300 mb-1">💥 Физика и Разрушения:</h4>
                <p>• Включите «Физику» — кубики превратятся в полноценные физические тела с весом, трением и отскоком!</p>
                <p>• В режиме пушки кликайте в любую точку, чтобы запустить тяжелое ядро и сбить постройку.</p>
                <p>• Кнопка «Взрыв ТНТ» раскидает кубики ударной волной, а «Землетрясение» проверит устойчивость здания.</p>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                <h4 className="font-bold text-blue-300 mb-1">🎥 Управление камерой:</h4>
                <p>• Зажмите левую или правую кнопку мыши и двигайте мышь — вращение камеры.</p>
                <p>• Колесико мыши — приближение и отдаление зума.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition shadow"
            >
              Всё понятно, погнали строить!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
