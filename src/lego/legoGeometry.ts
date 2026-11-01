import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BrickType, LegoColor } from '../types.ts';

export const STUD_PITCH = 0.8;       // Horizontal stud distance (X, Z)
export const BRICK_HEIGHT = 0.96;    // Height of 1 standard brick
export const PLATE_HEIGHT = 0.32;    // Height of 1 plate (1/3 of a brick)
export const STUD_RADIUS = 0.24;     // Stud cylinder radius
export const STUD_HEIGHT = 0.16;     // Stud height

export const LEGO_COLORS: LegoColor[] = [
  { name: 'Red', hex: '#E3000B' },
  { name: 'Blue', hex: '#0055BF' },
  { name: 'Yellow', hex: '#FFCD00' },
  { name: 'Green', hex: '#009944' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#1C1C1C' },
  { name: 'Orange', hex: '#FF7700' },
  { name: 'Azure', hex: '#00A3DA' },
  { name: 'Lime', hex: '#9ACA3A' },
  { name: 'Pink', hex: '#F06EA9' },
  { name: 'Purple', hex: '#84329B' },
  { name: 'Tan', hex: '#E4CD9E' },
  { name: 'Brown', hex: '#583927' },
  { name: 'Dark Grey', hex: '#4C5156' },
  { name: 'Light Grey', hex: '#A0A5A9' },
  { name: 'Gold', hex: '#E5A00D', metalness: 0.6, roughness: 0.2 },
  { name: 'Clear Blue', hex: '#68B6E8', transparent: true, opacity: 0.5 },
];

export const BRICK_CATALOG: BrickType[] = [
  // Basic Bricks
  { id: 'brick_1x1', name: 'Brick 1x1', nameRu: 'Кубик 1x1', category: 'basic', width: 1, depth: 1, height: BRICK_HEIGHT, hasStuds: true },
  { id: 'brick_1x2', name: 'Brick 1x2', nameRu: 'Кубик 1x2', category: 'basic', width: 2, depth: 1, height: BRICK_HEIGHT, hasStuds: true },
  { id: 'brick_1x3', name: 'Brick 1x3', nameRu: 'Кубик 1x3', category: 'basic', width: 3, depth: 1, height: BRICK_HEIGHT, hasStuds: true },
  { id: 'brick_1x4', name: 'Brick 1x4', nameRu: 'Кубик 1x4', category: 'basic', width: 4, depth: 1, height: BRICK_HEIGHT, hasStuds: true },
  { id: 'brick_2x2', name: 'Brick 2x2', nameRu: 'Кубик 2x2', category: 'basic', width: 2, depth: 2, height: BRICK_HEIGHT, hasStuds: true },
  { id: 'brick_2x3', name: 'Brick 2x3', nameRu: 'Кубик 2x3', category: 'basic', width: 3, depth: 2, height: BRICK_HEIGHT, hasStuds: true },
  { id: 'brick_2x4', name: 'Brick 2x4 (Classic)', nameRu: 'Кубик 2x4 (Классика)', category: 'basic', width: 4, depth: 2, height: BRICK_HEIGHT, hasStuds: true },
  { id: 'brick_2x6', name: 'Brick 2x6', nameRu: 'Кубик 2x6', category: 'basic', width: 6, depth: 2, height: BRICK_HEIGHT, hasStuds: true },
  
  // Round Bricks
  { id: 'cyl_1x1', name: 'Round Pillar 1x1', nameRu: 'Колонка 1x1', category: 'basic', width: 1, depth: 1, height: BRICK_HEIGHT, hasStuds: true },
  { id: 'cyl_2x2', name: 'Round Pillar 2x2', nameRu: 'Колонка 2x2', category: 'basic', width: 2, depth: 2, height: BRICK_HEIGHT, hasStuds: true },

  // Plates
  { id: 'plate_1x1', name: 'Plate 1x1', nameRu: 'Пластина 1x1', category: 'plates', width: 1, depth: 1, height: PLATE_HEIGHT, isPlate: true, hasStuds: true },
  { id: 'plate_1x2', name: 'Plate 1x2', nameRu: 'Пластина 1x2', category: 'plates', width: 2, depth: 1, height: PLATE_HEIGHT, isPlate: true, hasStuds: true },
  { id: 'plate_2x2', name: 'Plate 2x2', nameRu: 'Пластина 2x2', category: 'plates', width: 2, depth: 2, height: PLATE_HEIGHT, isPlate: true, hasStuds: true },
  { id: 'plate_2x4', name: 'Plate 2x4', nameRu: 'Пластина 2x4', category: 'plates', width: 4, depth: 2, height: PLATE_HEIGHT, isPlate: true, hasStuds: true },
  { id: 'plate_4x4', name: 'Plate 4x4', nameRu: 'Пластина 4x4', category: 'plates', width: 4, depth: 4, height: PLATE_HEIGHT, isPlate: true, hasStuds: true },
  { id: 'plate_8x8', name: 'Baseplate 8x8', nameRu: 'Основание 8x8', category: 'plates', width: 8, depth: 8, height: PLATE_HEIGHT, isPlate: true, hasStuds: true },

  // Slopes (Roofs)
  { id: 'slope_1x2', name: 'Slope 1x2 (45°)', nameRu: 'Скат 1x2', category: 'slopes', width: 2, depth: 1, height: BRICK_HEIGHT, isSlope: true, slopeDirection: 'x' },
  { id: 'slope_2x2', name: 'Slope 2x2 (45°)', nameRu: 'Скат 2x2', category: 'slopes', width: 2, depth: 2, height: BRICK_HEIGHT, isSlope: true, slopeDirection: 'x' },
  { id: 'slope_2x4', name: 'Slope 2x4 (Roof)', nameRu: 'Крыша 2x4', category: 'slopes', width: 4, depth: 2, height: BRICK_HEIGHT, isSlope: true, slopeDirection: 'z' },

  // Doors & Windows
  { id: 'door_frame', name: 'Lego Door & Frame', nameRu: 'Дверь с коробкой', category: 'doors_windows', width: 2, depth: 1, height: BRICK_HEIGHT * 3, isCustomModel: 'door' },
  { id: 'window_frame', name: 'Lego Glass Window', nameRu: 'Окно со стеклом', category: 'doors_windows', width: 2, depth: 1, height: BRICK_HEIGHT * 2, isCustomModel: 'window' },

  // Furniture (Sims)
  { id: 'furn_bed', name: 'Lego Cozy Bed', nameRu: 'Кровать Lego', category: 'furniture', width: 2, depth: 3, height: BRICK_HEIGHT * 1.2, isCustomModel: 'bed' },
  { id: 'furn_sofa', name: 'Lego Soft Sofa', nameRu: 'Диван Lego', category: 'furniture', width: 3, depth: 2, height: BRICK_HEIGHT * 1.5, isCustomModel: 'chair' },
  { id: 'furn_chair', name: 'Lego Armchair', nameRu: 'Кресло Lego', category: 'furniture', width: 1, depth: 1, height: BRICK_HEIGHT * 1.5, isCustomModel: 'chair' },
  { id: 'furn_table', name: 'Lego Table 2x2', nameRu: 'Стол 2x2', category: 'furniture', width: 2, depth: 2, height: BRICK_HEIGHT * 1.3, isCustomModel: 'table' },
  { id: 'furn_tv', name: 'Lego Flat TV', nameRu: 'Телевизор Lego', category: 'furniture', width: 2, depth: 1, height: BRICK_HEIGHT * 2, isCustomModel: 'tv' },
  { id: 'furn_fridge', name: 'Lego Kitchen Fridge', nameRu: 'Холодильник Lego', category: 'furniture', width: 1, depth: 1, height: BRICK_HEIGHT * 3, isCustomModel: 'fridge' },
  { id: 'furn_toilet', name: 'Lego Toilet', nameRu: 'Унитаз Lego', category: 'furniture', width: 1, depth: 1, height: BRICK_HEIGHT * 1.5, isCustomModel: 'toilet' },

  // Special / Town
  { id: 'special_tree', name: 'Lego Pine Tree', nameRu: 'Дерево Lego', category: 'special', width: 2, depth: 2, height: BRICK_HEIGHT * 4, isCustomModel: 'tree' },
];

// Material & Geometry Cache
const geometryCache = new Map<string, THREE.BufferGeometry>();
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function getLegoMaterial(colorHex: string, isGhost: boolean = false): THREE.MeshStandardMaterial {
  const cacheKey = `${colorHex}_${isGhost ? 'ghost' : 'solid'}`;
  let mat = materialCache.get(cacheKey);
  if (!mat) {
    const isTrans = colorHex === '#68B6E8';
    mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.22,
      metalness: colorHex === '#E5A00D' ? 0.6 : 0.04,
      transparent: isGhost || isTrans,
      opacity: isGhost ? 0.55 : (isTrans ? 0.6 : 1.0),
    });
    materialCache.set(cacheKey, mat);
  }
  return mat;
}

// Generate high quality Lego Stud
function createStudGeometry(): THREE.BufferGeometry {
  const geom = new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 16);
  geom.translate(0, STUD_HEIGHT / 2, 0);
  return geom;
}

const baseStudGeom = createStudGeometry();

// Generate complete Lego brick geometry with studs attached
export function getBrickGeometry(type: BrickType): THREE.BufferGeometry {
  if (geometryCache.has(type.id)) {
    return geometryCache.get(type.id)!;
  }

  const geometries: THREE.BufferGeometry[] = [];
  const totalW = type.width * STUD_PITCH;
  const totalD = type.depth * STUD_PITCH;
  const h = type.height;

  if (type.isCustomModel) {
    const customGeom = createCustomFurnitureGeometry(type.isCustomModel, totalW, totalD, h);
    geometryCache.set(type.id, customGeom);
    return customGeom;
  }

  if (type.id.startsWith('cyl_')) {
    // Round cylinder brick
    const r = (Math.min(totalW, totalD) / 2) * 0.96;
    const bodyGeom = new THREE.CylinderGeometry(r, r, h, 24);
    bodyGeom.translate(0, h / 2, 0);
    geometries.push(bodyGeom);

    // Center stud
    const stud = baseStudGeom.clone();
    stud.translate(0, h, 0);
    geometries.push(stud);
  } else if (type.isSlope) {
    // 45 degree slope brick (prism shape)
    const shape = new THREE.Shape();
    shape.moveTo(-totalW / 2, 0);
    shape.lineTo(totalW / 2, 0);
    shape.lineTo(totalW / 2, h);
    shape.lineTo(-totalW / 2 + STUD_PITCH, h);
    shape.lineTo(-totalW / 2, h * 0.3);
    shape.closePath();

    const extrudeSettings = {
      steps: 1,
      depth: totalD,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    };
    const slopeGeom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    slopeGeom.center();
    slopeGeom.translate(0, h / 2, 0);
    geometries.push(slopeGeom);
  } else {
    // Standard rectangular brick or plate
    // Main body box with slight bevel edge effect
    const boxGeom = new THREE.BoxGeometry(
      totalW - 0.02,
      h,
      totalD - 0.02,
      1, 1, 1
    );
    boxGeom.translate(0, h / 2, 0);
    geometries.push(boxGeom);

    // Studs on top grid
    if (type.hasStuds !== false) {
      for (let x = 0; x < type.width; x++) {
        for (let z = 0; z < type.depth; z++) {
          const stud = baseStudGeom.clone();
          const posX = (x - (type.width - 1) / 2) * STUD_PITCH;
          const posZ = (z - (type.depth - 1) / 2) * STUD_PITCH;
          stud.translate(posX, h, posZ);
          geometries.push(stud);
        }
      }
    }
  }

  // Merge all parts into one optimized BufferGeometry
  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.computeVertexNormals();
  geometryCache.set(type.id, merged);
  return merged;
}

// Procedural Lego furniture and props built purely with Lego shapes
function createCustomFurnitureGeometry(model: string, w: number, d: number, h: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  if (model === 'bed') {
    // Base frame
    const base = new THREE.BoxGeometry(w, h * 0.4, d);
    base.translate(0, h * 0.2, 0);
    parts.push(base);
    // Mattress / blanket
    const mattress = new THREE.BoxGeometry(w * 0.9, h * 0.4, d * 0.7);
    mattress.translate(0, h * 0.55, d * 0.1);
    parts.push(mattress);
    // Pillow
    const pillow = new THREE.BoxGeometry(w * 0.8, h * 0.25, d * 0.22);
    pillow.translate(0, h * 0.65, -d * 0.35);
    parts.push(pillow);
    // Headboard
    const headboard = new THREE.BoxGeometry(w, h * 0.9, 0.15);
    headboard.translate(0, h * 0.45, -d * 0.48);
    parts.push(headboard);
  } else if (model === 'chair') {
    // Seat base
    const seat = new THREE.BoxGeometry(w * 0.9, h * 0.25, d * 0.9);
    seat.translate(0, h * 0.35, 0);
    parts.push(seat);
    // 4 legs
    const legThick = 0.12;
    const legH = h * 0.35;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = new THREE.BoxGeometry(legThick, legH, legThick);
      leg.translate(sx * (w * 0.35), legH / 2, sz * (d * 0.35));
      parts.push(leg);
    });
    // Backrest
    const back = new THREE.BoxGeometry(w * 0.85, h * 0.65, 0.12);
    back.translate(0, h * 0.75, -d * 0.38);
    parts.push(back);
  } else if (model === 'table') {
    // Tabletop
    const top = new THREE.BoxGeometry(w, 0.18, d);
    top.translate(0, h - 0.09, 0);
    parts.push(top);
    // 4 legs
    const legThick = 0.18;
    const legH = h - 0.18;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
      const leg = new THREE.BoxGeometry(legThick, legH, legThick);
      leg.translate(sx * (w * 0.38), legH / 2, sz * (d * 0.38));
      parts.push(leg);
    });
    // Studs on tabletop
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 2; z++) {
        const stud = baseStudGeom.clone();
        stud.translate((x - 0.5) * STUD_PITCH, h, (z - 0.5) * STUD_PITCH);
        parts.push(stud);
      }
    }
  } else if (model === 'tv') {
    // Stand base
    const stand = new THREE.BoxGeometry(w * 0.6, 0.1, d * 0.8);
    stand.translate(0, 0.05, 0);
    parts.push(stand);
    // Pillar
    const pillar = new THREE.BoxGeometry(0.15, h * 0.3, 0.15);
    pillar.translate(0, h * 0.2, 0);
    parts.push(pillar);
    // Screen bezel
    const screen = new THREE.BoxGeometry(w, h * 0.7, 0.12);
    screen.translate(0, h * 0.65, 0);
    parts.push(screen);
  } else if (model === 'fridge') {
    // Tall fridge box
    const body = new THREE.BoxGeometry(w, h, d);
    body.translate(0, h / 2, 0);
    parts.push(body);
    // Handles
    const handleUpper = new THREE.BoxGeometry(0.08, 0.35, 0.06);
    handleUpper.translate(w * 0.35, h * 0.7, d / 2 + 0.03);
    parts.push(handleUpper);
    const handleLower = new THREE.BoxGeometry(0.08, 0.35, 0.06);
    handleLower.translate(w * 0.35, h * 0.3, d / 2 + 0.03);
    parts.push(handleLower);
  } else if (model === 'toilet') {
    // Base
    const base = new THREE.BoxGeometry(w * 0.6, h * 0.4, d * 0.8);
    base.translate(0, h * 0.2, d * 0.1);
    parts.push(base);
    // Tank
    const tank = new THREE.BoxGeometry(w * 0.8, h * 0.6, d * 0.3);
    tank.translate(0, h * 0.7, -d * 0.3);
    parts.push(tank);
    // Bowl ring
    const bowl = new THREE.CylinderGeometry(w * 0.35, w * 0.3, 0.15, 16);
    bowl.translate(0, h * 0.45, d * 0.1);
    parts.push(bowl);
  } else if (model === 'door') {
    // Frame
    const frameL = new THREE.BoxGeometry(0.18, h, 0.25);
    frameL.translate(-w / 2 + 0.09, h / 2, 0);
    parts.push(frameL);
    const frameR = new THREE.BoxGeometry(0.18, h, 0.25);
    frameR.translate(w / 2 - 0.09, h / 2, 0);
    parts.push(frameR);
    const frameTop = new THREE.BoxGeometry(w, 0.2, 0.25);
    frameTop.translate(0, h - 0.1, 0);
    parts.push(frameTop);
    // Door panel slightly ajar
    const doorPanel = new THREE.BoxGeometry(w - 0.36, h - 0.22, 0.1);
    doorPanel.translate(0, (h - 0.2) / 2, 0);
    parts.push(doorPanel);
  } else if (model === 'window') {
    // Window frame
    const top = new THREE.BoxGeometry(w, 0.15, 0.25);
    top.translate(0, h - 0.075, 0);
    parts.push(top);
    const bot = new THREE.BoxGeometry(w, 0.15, 0.25);
    bot.translate(0, 0.075, 0);
    parts.push(bot);
    const l = new THREE.BoxGeometry(0.15, h, 0.25);
    l.translate(-w / 2 + 0.075, h / 2, 0);
    parts.push(l);
    const r = new THREE.BoxGeometry(0.15, h, 0.25);
    r.translate(w / 2 - 0.075, h / 2, 0);
    parts.push(r);
    // Glass pane
    const glass = new THREE.BoxGeometry(w - 0.3, h - 0.3, 0.05);
    glass.translate(0, h / 2, 0);
    parts.push(glass);
  } else if (model === 'tree') {
    // Trunk (brown Lego cylinder)
    const trunk = new THREE.CylinderGeometry(0.2, 0.25, h * 0.35, 12);
    trunk.translate(0, h * 0.175, 0);
    parts.push(trunk);
    // Tiered green foliage cones
    [0.3, 0.55, 0.8].forEach((relY, idx) => {
      const radius = (0.9 - idx * 0.25) * (w / 2);
      const coneH = h * 0.35;
      const cone = new THREE.ConeGeometry(radius, coneH, 12);
      cone.translate(0, h * relY + coneH / 2, 0);
      parts.push(cone);
    });
  } else {
    const fallback = new THREE.BoxGeometry(w, h, d);
    fallback.translate(0, h / 2, 0);
    parts.push(fallback);
  }

  const merged = BufferGeometryUtils.mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}
