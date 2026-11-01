/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PlacedBrick, BrickType, ToolMode, MinifigureData } from './types.ts';
import { BRICK_CATALOG, LEGO_COLORS, STUD_PITCH } from './lego/legoGeometry.ts';
import { 
  generateCozyHousePreset, 
  generatePhysicsTowerPreset, 
  generateEmptyBoardPreset 
} from './lego/presets.ts';
import { LegoPhysicsWorld } from './physics/physicsWorld.ts';
import { Viewport3D } from './components/Viewport3D.tsx';
import { ControlDock } from './components/ControlDock.tsx';
import { SimsHUD } from './components/SimsHUD.tsx';
import { TopNav } from './components/TopNav.tsx';
import { legoAudio } from './audio/soundEffects.ts';
import { getHighestSurfaceAt } from './lego/collision.ts';

const RANDOM_NAMES = [
  'Макс Кирпичев', 'Оля Блокова', 'Дэн Мастер', 'Ева Моделькина', 
  'Капитан Лего', 'Лиза Деталька', 'Артем Инженер', 'София Архитектор'
];

export default function App() {
  const [physicsWorld] = useState(() => new LegoPhysicsWorld());

  // Simulation & Game State
  const [currentPresetId, setCurrentPresetId] = useState<string>('cozy_house');
  const [bricks, setBricks] = useState<PlacedBrick[]>([]);
  const [minifigures, setMinifigures] = useState<MinifigureData[]>([]);
  
  // Tools & Selection
  const [activeMode, setActiveMode] = useState<ToolMode>('build');
  const [selectedBrickType, setSelectedBrickType] = useState<BrickType>(BRICK_CATALOG[6]); // 2x4 Classic
  const [selectedColor, setSelectedColor] = useState<string>('#FFCD00');
  const [brickRotation, setBrickRotation] = useState<number>(0);
  
  // Physics & Sims State
  const [isSimulatingPhysics, setIsSimulatingPhysics] = useState<boolean>(false);
  const [selectedMinifigId, setSelectedMinifigId] = useState<string | null>('sim_1');
  const [followMinifig, setFollowMinifig] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Backup snapshot of bricks before physics is simulated
  const brickSnapshot = useRef<PlacedBrick[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  }, []);

  // LOAD PRESET
  const loadPreset = useCallback((presetId: string) => {
    physicsWorld.clear();
    setIsSimulatingPhysics(false);
    setSelectedMinifigId(null);
    setFollowMinifig(false);

    let preset;
    if (presetId === 'physics_tower') {
      preset = generatePhysicsTowerPreset();
    } else if (presetId === 'empty_sandbox') {
      preset = generateEmptyBoardPreset();
    } else {
      preset = generateCozyHousePreset();
    }

    setCurrentPresetId(preset.id);
    setBricks(preset.bricks);
    setMinifigures(preset.minifigures);
    brickSnapshot.current = JSON.parse(JSON.stringify(preset.bricks));
    if (preset.minifigures.length > 0) {
      setSelectedMinifigId(preset.minifigures[0].id);
    }
    showToast(`Загружен мир: ${preset.nameRu}`);
  }, [physicsWorld, showToast]);

  // Initial load
  useEffect(() => {
    loadPreset('cozy_house');
  }, [loadPreset]);

  // BRICK ROTATION (R KEY OR BUTTON)
  const handleRotateBrick = useCallback(() => {
    setBrickRotation((prev) => (prev + Math.PI / 2) % (Math.PI * 2));
  }, []);

  // GLOBAL KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        handleRotateBrick();
      } else if (e.key === '1') {
        setActiveMode('build');
      } else if (e.key === '2') {
        setActiveMode('sims');
      } else if (e.key === '3') {
        setActiveMode('physics');
      } else if (e.key === '4') {
        setActiveMode('destroy');
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePhysics();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ADD BRICK
  const handleAddBrick = useCallback((newBrick: PlacedBrick) => {
    setBricks((prev) => {
      const updated = [...prev, newBrick];
      brickSnapshot.current = JSON.parse(JSON.stringify(updated));
      return updated;
    });
  }, []);

  // REMOVE BRICK
  const handleRemoveBrick = useCallback((brickId: string) => {
    setBricks((prev) => {
      const updated = prev.filter((b) => b.id !== brickId);
      brickSnapshot.current = JSON.parse(JSON.stringify(updated));
      return updated;
    });
  }, []);

  // TOGGLE PHYSICS SIMULATION
  const handleTogglePhysics = () => {
    setIsSimulatingPhysics((prev) => {
      const next = !prev;
      physicsWorld.setAllDynamic(next);
      if (next) {
        showToast('💥 Реалистичная физика активирована! Кубики подвержены гравитации');
      } else {
        showToast('⏸️ Физика приостановлена');
      }
      return next;
    });
  };

  // EXPLOSION (TNT)
  const handleTriggerExplosion = () => {
    setIsSimulatingPhysics(true);
    physicsWorld.explode({ x: 0, y: 1.5, z: 0 } as any, 35, 15);
    showToast('💣 БАМ! Взрыв раскидал кубики по законам физики!');
  };

  // EARTHQUAKE
  const handleTriggerEarthquake = () => {
    setIsSimulatingPhysics(true);
    physicsWorld.earthquake(10);
    showToast('🌋 Землетрясение! Подземные толчки сотрясают постройки');
  };

  // RESET PHYSICS BACK TO STATIC BLUEPRINT
  const handleResetPhysics = () => {
    physicsWorld.clear();
    setIsSimulatingPhysics(false);
    // Reload from snapshot
    setBricks(JSON.parse(JSON.stringify(brickSnapshot.current)));
    showToast('🔄 Постройки собраны обратно в идеальный порядок');
  };

  // SPAWN NEW MINIFIGURE
  const handleSpawnMinifig = () => {
    const hairStyles: ('classic' | 'hair' | 'cap' | 'helmet' | 'chef')[] = ['hair', 'cap', 'helmet', 'chef'];
    const expressions: ('happy' | 'cool' | 'sleepy' | 'surprised')[] = ['happy', 'cool', 'surprised'];
    const randomOutfit = LEGO_COLORS[Math.floor(Math.random() * 8)].hex;
    const randomPants = LEGO_COLORS[Math.floor(Math.random() * 8)].hex;
    const randomHair = LEGO_COLORS[Math.floor(Math.random() * 6)].hex;

    const spawnX = (Math.random() - 0.5) * 6;
    const spawnZ = (Math.random() - 0.5) * 6;
    const spawnY = getHighestSurfaceAt(spawnX, spawnZ, bricks, 0.2);

    const newSim: MinifigureData = {
      id: `sim_${Date.now()}`,
      name: RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)],
      position: [spawnX, spawnY, spawnZ],
      rotation: Math.random() * Math.PI * 2,
      outfitColor: randomOutfit,
      pantsColor: randomPants,
      hairColor: randomHair,
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      faceExpression: expressions[Math.floor(Math.random() * expressions.length)],
      needs: { hunger: 90, energy: 90, fun: 90, social: 90 },
      currentActivity: 'idle',
      thoughtBubble: { icon: '👋', text: 'Привет, мир Lego!', expiresAt: performance.now() + 6000 },
    };

    setMinifigures((prev) => [...prev, newSim]);
    setSelectedMinifigId(newSim.id);
    legoAudio.playSimlish('happy');
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    showToast(`Создан новый житель: ${newSim.name}!`);
  };

  // MINIFIGURE SIMS ACTION COMMAND
  const handleMinifigAction = (action: 'eat' | 'sleep' | 'dance' | 'build') => {
    if (!selectedMinifigId) return;

    setMinifigures((prev) =>
      prev.map((sim) => {
        if (sim.id !== selectedMinifigId) return sim;

        const updated = { ...sim, needs: { ...sim.needs } };

        if (action === 'eat') {
          updated.needs.hunger = 100;
          updated.currentActivity = 'eating';
          updated.thoughtBubble = { icon: '🍕', text: 'Вкуснейшая лего-пицца!', expiresAt: performance.now() + 5000 };
          legoAudio.playSimlish('giggle');
        } else if (action === 'sleep') {
          updated.needs.energy = 100;
          updated.currentActivity = 'sleeping';
          updated.thoughtBubble = { icon: '😴', text: 'Сладкие сны...', expiresAt: performance.now() + 5000 };
          legoAudio.playSimlish('sleep');
        } else if (action === 'dance') {
          updated.needs.fun = 100;
          updated.currentActivity = 'dancing';
          updated.thoughtBubble = { icon: '🎵', text: 'Любимый трек!', expiresAt: performance.now() + 6000 };
          legoAudio.playSimlish('happy');
          confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
        } else if (action === 'build') {
          updated.needs.fun = 95;
          updated.currentActivity = 'building';
          updated.thoughtBubble = { icon: '🔨', text: 'Строю мини-башенку!', expiresAt: performance.now() + 5000 };
          legoAudio.playSnap();

          // Spawn a small Lego tower near Sim
          const [sx, sy, sz] = sim.position;
          const miniBricks: PlacedBrick[] = [
            {
              id: `simbuild_${Date.now()}_1`,
              typeId: 'brick_2x2',
              color: '#E3000B',
              position: [sx + 1.2, sy, sz],
              rotation: 0,
            },
            {
              id: `simbuild_${Date.now()}_2`,
              typeId: 'brick_2x2',
              color: '#FFCD00',
              position: [sx + 1.2, sy + 0.96, sz],
              rotation: 0,
            },
          ];
          setTimeout(() => {
            setBricks((b) => [...b, ...miniBricks]);
          }, 300);
        }

        return updated;
      })
    );
  };

  // RANDOMIZE OUTFIT
  const handleRandomizeOutfit = () => {
    if (!selectedMinifigId) return;
    const styles: ('classic' | 'hair' | 'cap' | 'helmet' | 'chef')[] = ['hair', 'cap', 'helmet', 'chef'];
    const expressions: ('happy' | 'cool' | 'sleepy' | 'surprised')[] = ['happy', 'cool', 'surprised'];

    setMinifigures((prev) =>
      prev.map((sim) => {
        if (sim.id !== selectedMinifigId) return sim;
        return {
          ...sim,
          outfitColor: LEGO_COLORS[Math.floor(Math.random() * LEGO_COLORS.length)].hex,
          pantsColor: LEGO_COLORS[Math.floor(Math.random() * LEGO_COLORS.length)].hex,
          hairStyle: styles[Math.floor(Math.random() * styles.length)],
          faceExpression: expressions[Math.floor(Math.random() * expressions.length)],
        };
      })
    );
    legoAudio.playSimlish('happy');
  };

  // SIMS NEEDS GRADUAL DECAY LOOP
  useEffect(() => {
    const interval = setInterval(() => {
      setMinifigures((prev) =>
        prev.map((sim) => {
          const hunger = Math.max(10, sim.needs.hunger - 1);
          const energy = Math.max(10, sim.needs.energy - 1);
          const fun = Math.max(10, sim.needs.fun - 1);
          const social = Math.max(10, sim.needs.social - 1);

          let bubble = sim.thoughtBubble;
          if (!bubble || performance.now() > bubble.expiresAt) {
            if (hunger < 35) {
              bubble = { icon: '🍕', text: 'Хочу кушать...', expiresAt: performance.now() + 4000 };
            } else if (energy < 30) {
              bubble = { icon: '☕', text: 'Нужен отдых...', expiresAt: performance.now() + 4000 };
            } else if (fun < 35) {
              bubble = { icon: '🧱', text: 'Хочу построить что-то!', expiresAt: performance.now() + 4000 };
            }
          }

          return {
            ...sim,
            needs: { hunger, energy, fun, social },
            thoughtBubble: bubble,
          };
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // SAVE WORLD TO LOCALSTORAGE
  const handleSaveWorld = () => {
    try {
      const data = {
        bricks,
        minifigures,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('legosim_save', JSON.stringify(data));
      showToast('💾 Мир успешно сохранен в память браузера!');
    } catch {
      showToast('⚠️ Ошибка сохранения');
    }
  };

  // CLEAR ALL
  const handleClearWorld = () => {
    physicsWorld.clear();
    setBricks([]);
    setMinifigures([]);
    setSelectedMinifigId(null);
    showToast('🗑️ Все объекты удалены');
  };

  const selectedMinifig = minifigures.find((m) => m.id === selectedMinifigId) || null;

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none relative">
      {/* 3D WebGL Viewport */}
      <Viewport3D
        bricks={bricks}
        onAddBrick={handleAddBrick}
        onRemoveBrick={handleRemoveBrick}
        selectedBrickType={selectedBrickType}
        selectedColor={selectedColor}
        activeMode={activeMode}
        brickRotation={brickRotation}
        physicsWorld={physicsWorld}
        minifigures={minifigures}
        selectedMinifigId={selectedMinifigId}
        onSelectMinifig={setSelectedMinifigId}
        onUpdateMinifig={(updated) => {
          setMinifigures((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        }}
        isSimulatingPhysics={isSimulatingPhysics}
        followMinifig={followMinifig}
      />

      {/* Top Header & Presets */}
      <TopNav
        currentPresetId={currentPresetId}
        onSelectPreset={loadPreset}
        brickCount={bricks.length}
        simsCount={minifigures.length}
        isMuted={isMuted}
        onToggleMute={() => {
          setIsMuted(!isMuted);
          legoAudio.isMuted = !isMuted;
        }}
        onSaveWorld={handleSaveWorld}
        onClearWorld={handleClearWorld}
      />

      {/* Selected Sim Inspector (The Sims style!) */}
      <SimsHUD
        minifig={selectedMinifig}
        onClose={() => setSelectedMinifigId(null)}
        onFulfillNeed={(need) => {
          handleMinifigAction(
            need === 'hunger' ? 'eat' :
            need === 'energy' ? 'sleep' :
            need === 'fun' ? 'dance' : 'eat'
          );
        }}
        onRandomizeOutfit={handleRandomizeOutfit}
      />

      {/* Collapsible Bottom Control Dock */}
      <ControlDock
        activeMode={activeMode}
        onSelectMode={(mode) => {
          setActiveMode(mode);
          if (mode === 'physics') {
            setIsSimulatingPhysics(true);
            physicsWorld.setAllDynamic(true);
          }
        }}
        selectedBrickType={selectedBrickType}
        onSelectBrickType={setSelectedBrickType}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        brickRotation={brickRotation}
        onRotateBrick={handleRotateBrick}
        isSimulatingPhysics={isSimulatingPhysics}
        onTogglePhysics={handleTogglePhysics}
        onTriggerExplosion={handleTriggerExplosion}
        onTriggerEarthquake={handleTriggerEarthquake}
        onResetPhysics={handleResetPhysics}
        onSpawnMinifig={handleSpawnMinifig}
        followMinifig={followMinifig}
        onToggleFollowMinifig={() => setFollowMinifig(!followMinifig)}
        selectedMinifigId={selectedMinifigId}
        onMinifigAction={handleMinifigAction}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-amber-300 border border-slate-700/80 px-4 py-2 rounded-xl shadow-xl text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-top duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
