import { PlacedBrick, MinifigureData } from '../types.ts';
import { STUD_PITCH, BRICK_HEIGHT, PLATE_HEIGHT } from './legoGeometry.ts';

export interface WorldPreset {
  id: string;
  name: string;
  nameRu: string;
  descriptionRu: string;
  bricks: PlacedBrick[];
  minifigures: MinifigureData[];
}

export function generateCozyHousePreset(): WorldPreset {
  const bricks: PlacedBrick[] = [];
  let idCounter = 1;

  // Base floor (green plate 8x8 tiled)
  for (let gx = -2; gx <= 2; gx++) {
    for (let gz = -2; gz <= 2; gz++) {
      bricks.push({
        id: `base_${idCounter++}`,
        typeId: 'plate_8x8',
        color: '#009944',
        position: [gx * 8 * STUD_PITCH, 0, gz * 8 * STUD_PITCH],
        rotation: 0,
      });
    }
  }

  // House walls (Yellow & Azure)
  const wallY = PLATE_HEIGHT;
  const houseW = 10;
  const houseD = 8;
  const startX = -3 * STUD_PITCH;
  const startZ = -2 * STUD_PITCH;

  // Floor tiles inside house (Light Grey)
  for (let ix = 0; ix < 4; ix++) {
    for (let iz = 0; iz < 3; iz++) {
      bricks.push({
        id: `floor_${idCounter++}`,
        typeId: 'plate_2x2',
        color: '#A0A5A9',
        position: [startX + (ix * 2) * STUD_PITCH, wallY, startZ + (iz * 2) * STUD_PITCH],
        rotation: 0,
      });
    }
  }

  // Walls 3 layers high
  for (let level = 0; level < 3; level++) {
    const curY = wallY + level * BRICK_HEIGHT;
    const wallColor = level % 2 === 0 ? '#FFCD00' : '#00A3DA';

    // Back wall (Z = -2)
    bricks.push({
      id: `w_back_${level}_1`,
      typeId: 'brick_2x4',
      color: wallColor,
      position: [startX, curY, startZ - STUD_PITCH],
      rotation: 0,
    });
    bricks.push({
      id: `w_back_${level}_2`,
      typeId: 'brick_2x4',
      color: wallColor,
      position: [startX + 4 * STUD_PITCH, curY, startZ - STUD_PITCH],
      rotation: 0,
    });

    // Left wall (X = startX - 2)
    bricks.push({
      id: `w_left_${level}`,
      typeId: 'brick_2x4',
      color: wallColor,
      position: [startX - 2 * STUD_PITCH, curY, startZ + 2 * STUD_PITCH],
      rotation: Math.PI / 2,
    });

    // Right wall
    bricks.push({
      id: `w_right_${level}`,
      typeId: 'brick_2x4',
      color: wallColor,
      position: [startX + 8 * STUD_PITCH, curY, startZ + 2 * STUD_PITCH],
      rotation: Math.PI / 2,
    });
  }

  // Door & Window
  bricks.push({
    id: `door_1`,
    typeId: 'door_frame',
    color: '#E3000B',
    position: [startX + 2 * STUD_PITCH, wallY, startZ + 6 * STUD_PITCH],
    rotation: 0,
  });

  bricks.push({
    id: `win_1`,
    typeId: 'window_frame',
    color: '#FFFFFF',
    position: [startX - 2 * STUD_PITCH, wallY + BRICK_HEIGHT, startZ + 2 * STUD_PITCH],
    rotation: Math.PI / 2,
  });

  // Red Slope Roof (Slopes 2x4)
  const roofY = wallY + 3 * BRICK_HEIGHT;
  for (let rx = 0; rx < 3; rx++) {
    bricks.push({
      id: `roof_l_${rx}`,
      typeId: 'slope_2x4',
      color: '#E3000B',
      position: [startX + rx * 4 * STUD_PITCH, roofY, startZ + STUD_PITCH],
      rotation: 0,
    });
    bricks.push({
      id: `roof_r_${rx}`,
      typeId: 'slope_2x4',
      color: '#E3000B',
      position: [startX + rx * 4 * STUD_PITCH, roofY, startZ + 3 * STUD_PITCH],
      rotation: Math.PI,
    });
  }

  // Furniture inside
  bricks.push({
    id: `bed_1`,
    typeId: 'furn_bed',
    color: '#0055BF',
    position: [startX, wallY, startZ + STUD_PITCH],
    rotation: 0,
  });

  bricks.push({
    id: `tv_1`,
    typeId: 'furn_tv',
    color: '#1C1C1C',
    position: [startX + 6 * STUD_PITCH, wallY, startZ + STUD_PITCH],
    rotation: -Math.PI / 2,
  });

  bricks.push({
    id: `sofa_1`,
    typeId: 'furn_sofa',
    color: '#E3000B',
    position: [startX + 2 * STUD_PITCH, wallY, startZ + 2 * STUD_PITCH],
    rotation: Math.PI,
  });

  bricks.push({
    id: `fridge_1`,
    typeId: 'furn_fridge',
    color: '#FFFFFF',
    position: [startX + 6 * STUD_PITCH, wallY, startZ + 4 * STUD_PITCH],
    rotation: -Math.PI / 2,
  });

  // Garden tree
  bricks.push({
    id: `tree_1`,
    typeId: 'special_tree',
    color: '#009944',
    position: [startX - 5 * STUD_PITCH, PLATE_HEIGHT, startZ + 4 * STUD_PITCH],
    rotation: 0,
  });

  const minifigures: MinifigureData[] = [
    {
      id: 'sim_1',
      name: 'Боб Стройкин',
      position: [startX + 2 * STUD_PITCH, wallY, startZ + 5 * STUD_PITCH],
      rotation: 0,
      outfitColor: '#0055BF',
      pantsColor: '#FF7700',
      hairColor: '#FFCD00',
      hairStyle: 'cap',
      faceExpression: 'happy',
      needs: { hunger: 85, energy: 90, fun: 75, social: 80 },
      currentActivity: 'idle',
      thoughtBubble: { icon: '🏗️', text: 'Пора строить!', expiresAt: performance.now() + 10000 },
      heldItem: 'wrench',
    },
    {
      id: 'sim_2',
      name: 'Алиса',
      position: [startX + 4 * STUD_PITCH, wallY, startZ + 2 * STUD_PITCH],
      rotation: -Math.PI / 2,
      outfitColor: '#F06EA9',
      pantsColor: '#FFFFFF',
      hairColor: '#583927',
      hairStyle: 'hair',
      faceExpression: 'cool',
      needs: { hunger: 70, energy: 65, fun: 95, social: 90 },
      currentActivity: 'dancing',
      thoughtBubble: { icon: '🎵', text: 'Лего вечеринка!', expiresAt: performance.now() + 10000 },
      heldItem: 'pizza',
    },
  ];

  return {
    id: 'cozy_house',
    name: 'Cozy Lego Cottage',
    nameRu: 'Уютный Домик Lego (Симс)',
    descriptionRu: 'Жилой дом с комнатами, мебелью, садом и двумя лего-жителями.',
    bricks,
    minifigures,
  };
}

export function generatePhysicsTowerPreset(): WorldPreset {
  const bricks: PlacedBrick[] = [];
  let idCounter = 1;

  // Base green floor
  for (let gx = -2; gx <= 2; gx++) {
    for (let gz = -2; gz <= 2; gz++) {
      bricks.push({
        id: `tower_base_${idCounter++}`,
        typeId: 'plate_8x8',
        color: '#009944',
        position: [gx * 8 * STUD_PITCH, 0, gz * 8 * STUD_PITCH],
        rotation: 0,
      });
    }
  }

  // Jenga / Castle physics destruction tower (12 levels of interlocking 2x4 bricks)
  const colors = ['#E3000B', '#0055BF', '#FFCD00', '#009944', '#FF7700', '#A0A5A9'];
  for (let level = 0; level < 14; level++) {
    const y = PLATE_HEIGHT + level * BRICK_HEIGHT;
    const color = colors[level % colors.length];
    const isRotated = level % 2 === 1;

    if (!isRotated) {
      // 3 bricks side by side along X
      for (let i = -1; i <= 1; i++) {
        bricks.push({
          id: `tower_b_${level}_${i}`,
          typeId: 'brick_2x4',
          color,
          position: [0, y, i * 2 * STUD_PITCH],
          rotation: 0,
        });
      }
    } else {
      // 3 bricks rotated 90 deg along Z
      for (let i = -1; i <= 1; i++) {
        bricks.push({
          id: `tower_b_${level}_${i}`,
          typeId: 'brick_2x4',
          color,
          position: [i * 2 * STUD_PITCH, y, 0],
          rotation: Math.PI / 2,
        });
      }
    }
  }

  const minifigures: MinifigureData[] = [
    {
      id: 'sim_spec_1',
      name: 'Профессор Бум',
      position: [6 * STUD_PITCH, PLATE_HEIGHT, 6 * STUD_PITCH],
      rotation: -Math.PI * 0.75,
      outfitColor: '#FFFFFF',
      pantsColor: '#1C1C1C',
      hairColor: '#A0A5A9',
      hairStyle: 'hair',
      faceExpression: 'surprised',
      needs: { hunger: 90, energy: 90, fun: 100, social: 70 },
      currentActivity: 'idle',
      thoughtBubble: { icon: '💣', text: 'Стреляй из пушки!', expiresAt: performance.now() + 15000 },
      heldItem: 'brick',
    },
  ];

  return {
    id: 'physics_tower',
    name: 'Destruction Tower',
    nameRu: 'Башня Разрушений (Дженга)',
    descriptionRu: 'Высокая башня из кубиков, идеальная для стрельбы из пушки или динамита.',
    bricks,
    minifigures,
  };
}

export function generateEmptyBoardPreset(): WorldPreset {
  const bricks: PlacedBrick[] = [];
  let idCounter = 1;

  for (let gx = -2; gx <= 2; gx++) {
    for (let gz = -2; gz <= 2; gz++) {
      bricks.push({
        id: `empty_base_${idCounter++}`,
        typeId: 'plate_8x8',
        color: '#009944',
        position: [gx * 8 * STUD_PITCH, 0, gz * 8 * STUD_PITCH],
        rotation: 0,
      });
    }
  }

  const minifigures: MinifigureData[] = [
    {
      id: 'sim_builder',
      name: 'Лего Архитектор',
      position: [0, PLATE_HEIGHT, 0],
      rotation: 0,
      outfitColor: '#E3000B',
      pantsColor: '#0055BF',
      hairColor: '#583927',
      hairStyle: 'cap',
      faceExpression: 'happy',
      needs: { hunger: 100, energy: 100, fun: 100, social: 100 },
      currentActivity: 'idle',
      thoughtBubble: { icon: '✨', text: 'Свободное поле!', expiresAt: performance.now() + 10000 },
    },
  ];

  return {
    id: 'empty_sandbox',
    name: 'Empty Green Baseplate',
    nameRu: 'Чистая Пластина (Песочница)',
    descriptionRu: 'Большое свободное пространство для свободного строительства с нуля.',
    bricks,
    minifigures,
  };
}
