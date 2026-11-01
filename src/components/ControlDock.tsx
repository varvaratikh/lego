import React, { useState } from 'react';
import { 
  Hammer, 
  Users, 
  Flame, 
  Trash2, 
  RotateCw, 
  Play, 
  Pause, 
  Bomb, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  UserPlus, 
  Sparkles,
  Camera,
  Coffee,
  Bed,
  Music,
  Eye
} from 'lucide-react';
import { ToolMode, BrickCategory, BrickType } from '../types.ts';
import { BRICK_CATALOG, LEGO_COLORS } from '../lego/legoGeometry.ts';

interface ControlDockProps {
  activeMode: ToolMode;
  onSelectMode: (mode: ToolMode) => void;
  selectedBrickType: BrickType;
  onSelectBrickType: (type: BrickType) => void;
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  brickRotation: number;
  onRotateBrick: () => void;
  isSimulatingPhysics: boolean;
  onTogglePhysics: () => void;
  onTriggerExplosion: () => void;
  onTriggerEarthquake: () => void;
  onResetPhysics: () => void;
  onSpawnMinifig: () => void;
  followMinifig: boolean;
  onToggleFollowMinifig: () => void;
  selectedMinifigId: string | null;
  onMinifigAction: (action: 'eat' | 'sleep' | 'dance' | 'build') => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  activeMode,
  onSelectMode,
  selectedBrickType,
  onSelectBrickType,
  selectedColor,
  onSelectColor,
  brickRotation,
  onRotateBrick,
  isSimulatingPhysics,
  onTogglePhysics,
  onTriggerExplosion,
  onTriggerEarthquake,
  onResetPhysics,
  onSpawnMinifig,
  followMinifig,
  onToggleFollowMinifig,
  selectedMinifigId,
  onMinifigAction,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<BrickCategory>('basic');

  const categories: { id: BrickCategory; label: string }[] = [
    { id: 'basic', label: 'Кубики' },
    { id: 'plates', label: 'Пластины' },
    { id: 'slopes', label: 'Скаты/Крыши' },
    { id: 'doors_windows', label: 'Двери и Окна' },
    { id: 'furniture', label: 'Симс-Мебель' },
    { id: 'special', label: 'Деревья' },
  ];

  const filteredBricks = BRICK_CATALOG.filter((b) => b.category === activeCategory);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-[940px] px-3 pointer-events-none">
      {/* Collapse / Expand Toggle Tab */}
      <div className="flex justify-center mb-1 pointer-events-auto">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 text-amber-400 text-xs font-semibold rounded-t-lg border-t border-x border-slate-700/80 shadow-md hover:bg-slate-800 transition"
        >
          {isCollapsed ? (
            <>
              <ChevronUp size={14} /> <span>Показать панель управления</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} /> <span>Скрыть панель (Zen Mode)</span>
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-3 text-slate-100 flex flex-col gap-2.5">
          {/* Top Mode Selector Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => onSelectMode('build')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeMode === 'build'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Hammer size={15} /> <span>Строительство</span>
              </button>

              <button
                onClick={() => onSelectMode('sims')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeMode === 'sims'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Users size={15} /> <span>Симс-Человечки</span>
              </button>

              <button
                onClick={() => onSelectMode('physics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeMode === 'physics'
                    ? 'bg-rose-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Flame size={15} /> <span>Физика и Пушка</span>
              </button>

              <button
                onClick={() => onSelectMode('destroy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeMode === 'destroy'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Trash2 size={15} /> <span>Разделитель</span>
              </button>
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center gap-2">
              {activeMode === 'build' && (
                <button
                  onClick={onRotateBrick}
                  title="Повернуть деталь (Клавиша R)"
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
                >
                  <RotateCw size={14} />
                  <span>Поворот ({Math.round((brickRotation * 180) / Math.PI)}°)</span>
                  <span className="text-[10px] bg-slate-900 px-1 py-0.5 rounded text-slate-400">R</span>
                </button>
              )}

              {/* Physics Toggle Button */}
              <button
                onClick={onTogglePhysics}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  isSimulatingPhysics
                    ? 'bg-rose-600/90 hover:bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-900/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
                }`}
              >
                {isSimulatingPhysics ? <Pause size={14} /> : <Play size={14} />}
                <span>{isSimulatingPhysics ? 'Физика активна' : 'Вкл. Физику'}</span>
              </button>
            </div>
          </div>

          {/* MODE SPECIFIC CONTENT */}

          {/* 1. BUILD MODE: Categories, Brick types, and Color palette */}
          {activeMode === 'build' && (
            <div className="flex flex-col gap-2">
              {/* Category selector */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition ${
                      activeCategory === cat.id
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Brick Type Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {filteredBricks.map((brick) => (
                  <button
                    key={brick.id}
                    onClick={() => onSelectBrickType(brick)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                      selectedBrickType.id === brick.id
                        ? 'bg-slate-700 border-amber-400 text-amber-300 shadow'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{brick.nameRu}</span>
                  </button>
                ))}
              </div>

              {/* Lego Colors Swatches */}
              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-1 border-t border-slate-800/80 no-scrollbar">
                <span className="text-[11px] text-slate-400 font-medium mr-1 whitespace-nowrap">Цвет пластика:</span>
                {LEGO_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => onSelectColor(col.hex)}
                    title={col.name}
                    style={{ backgroundColor: col.hex }}
                    className={`w-6 h-6 rounded-md transition transform shrink-0 border border-slate-700/70 ${
                      selectedColor === col.hex
                        ? 'ring-2 ring-amber-400 scale-110 shadow-md'
                        : 'hover:scale-105 opacity-90'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. SIMS MODE: Minifig controls, activities, and spawner */}
          {activeMode === 'sims' && (
            <div className="flex items-center justify-between flex-wrap gap-2 py-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={onSpawnMinifig}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  <UserPlus size={15} /> <span>Создать Лего-жителя</span>
                </button>

                <button
                  onClick={onToggleFollowMinifig}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    followMinifig
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Camera size={14} /> <span>{followMinifig ? 'Камера следит за симом' : 'Следить камерой'}</span>
                </button>
              </div>

              {selectedMinifigId ? (
                <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700">
                  <span className="text-xs text-emerald-400 font-bold mr-1">Приказы симу:</span>
                  <button
                    onClick={() => onMinifigAction('eat')}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-amber-300 transition"
                  >
                    <Coffee size={13} /> <span>Поесть</span>
                  </button>
                  <button
                    onClick={() => onMinifigAction('sleep')}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-blue-300 transition"
                  >
                    <Bed size={13} /> <span>Отдохнуть</span>
                  </button>
                  <button
                    onClick={() => onMinifigAction('dance')}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-pink-300 transition"
                  >
                    <Music size={13} /> <span>Танцевать!</span>
                  </button>
                  <button
                    onClick={() => onMinifigAction('build')}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-yellow-300 transition"
                  >
                    <Hammer size={13} /> <span>Строить</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  💡 Нажмите на любого лего-человечка, чтобы управлять его желаниями и жизнью
                </div>
              )}
            </div>
          )}

          {/* 3. PHYSICS MODE: Destruction tools */}
          {activeMode === 'physics' && (
            <div className="flex items-center justify-between flex-wrap gap-2 py-1">
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-300 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  🎯 Кликните в сцену, чтобы <b>выстрелить чугунным ядром из пушки</b>!
                </div>

                <button
                  onClick={onTriggerExplosion}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  <Bomb size={15} /> <span>Взрыв ТНТ (Динамит)</span>
                </button>

                <button
                  onClick={onTriggerEarthquake}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  <Activity size={15} /> <span>Землетрясение</span>
                </button>
              </div>

              <button
                onClick={onResetPhysics}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Собрать постройки обратно
              </button>
            </div>
          )}

          {/* 4. DESTROY / DISASSEMBLE MODE */}
          {activeMode === 'destroy' && (
            <div className="flex items-center justify-between py-1 text-xs">
              <div className="text-rose-400 font-medium">
                ✂️ Режим разделителя кубиков: кликайте на любой кубик или предмет мебели, чтобы открепить его!
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
