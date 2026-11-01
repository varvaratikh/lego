import { PlacedBrick, BrickType } from '../types.ts';
import { BRICK_CATALOG, STUD_PITCH } from './legoGeometry.ts';

export interface AABB {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

// Calculate axis-aligned bounding box for a placed brick
export function getBrickAABB(brick: PlacedBrick, margin: number = 0.02): AABB {
  const type = BRICK_CATALOG.find((b: BrickType) => b.id === brick.typeId) || BRICK_CATALOG[0];
  
  // Normalized rotation in 90 degree increments
  const rotNorm = Math.round((brick.rotation / (Math.PI / 2))) % 4;
  const isRotated = rotNorm === 1 || rotNorm === 3 || rotNorm === -1 || rotNorm === -3;

  const w = (isRotated ? type.depth : type.width) * STUD_PITCH;
  const d = (isRotated ? type.width : type.depth) * STUD_PITCH;
  const h = type.height;

  const halfW = w / 2 - margin;
  const halfD = d / 2 - margin;

  return {
    minX: brick.position[0] - halfW,
    maxX: brick.position[0] + halfW,
    minY: brick.position[1] + margin,
    maxY: brick.position[1] + h - margin,
    minZ: brick.position[2] - halfD,
    maxZ: brick.position[2] + halfD,
  };
}

// Check if two AABBs overlap in 3D
export function boxesOverlap(a: AABB, b: AABB): boolean {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minY < b.maxY &&
    a.maxY > b.minY &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
}

// Check if a candidate brick overlaps with any existing brick
export function checkBrickOverlap(
  candidate: PlacedBrick,
  existingBricks: PlacedBrick[],
  excludeId?: string
): boolean {
  const candidateBox = getBrickAABB(candidate);

  for (const existing of existingBricks) {
    if (excludeId && existing.id === excludeId) continue;
    const existingBox = getBrickAABB(existing);
    if (boxesOverlap(candidateBox, existingBox)) {
      return true;
    }
  }

  return false;
}

// Calculate safe non-penetrating Y height for snapping so brick never clips into structures
export function resolveSafeSnapHeight(
  x: number,
  z: number,
  typeId: string,
  rotation: number,
  existingBricks: PlacedBrick[],
  baseFloorY: number = 0.2
): number {
  const type = BRICK_CATALOG.find((b: BrickType) => b.id === typeId) || BRICK_CATALOG[0];

  const rotNorm = Math.round((rotation / (Math.PI / 2))) % 4;
  const isRotated = rotNorm === 1 || rotNorm === 3 || rotNorm === -1 || rotNorm === -3;

  const w = (isRotated ? type.depth : type.width) * STUD_PITCH;
  const d = (isRotated ? type.width : type.depth) * STUD_PITCH;
  const halfW = w / 2 - 0.04;
  const halfD = d / 2 - 0.04;

  const candMinX = x - halfW;
  const candMaxX = x + halfW;
  const candMinZ = z - halfD;
  const candMaxZ = z + halfD;

  // Find the highest overlapping top surface in the horizontal footprint
  let highestTop = baseFloorY;

  for (const brick of existingBricks) {
    const existingBox = getBrickAABB(brick, 0);

    // Check 2D horizontal overlap
    const overlapX = candMinX < existingBox.maxX && candMaxX > existingBox.minX;
    const overlapZ = candMinZ < existingBox.maxZ && candMaxZ > existingBox.minZ;

    if (overlapX && overlapZ) {
      if (existingBox.maxY > highestTop) {
        highestTop = existingBox.maxY;
      }
    }
  }

  return highestTop;
}

// Get the highest surface height for minifigure feet at position (x, z)
export function getHighestSurfaceAt(
  x: number,
  z: number,
  existingBricks: PlacedBrick[],
  baseFloorY: number = 0.2
): number {
  let highestY = baseFloorY;
  const playerRadius = 0.25;

  for (const brick of existingBricks) {
    const box = getBrickAABB(brick, 0);
    // Check if player footprint circle/box intersects brick horizontal footprint
    if (
      x + playerRadius > box.minX &&
      x - playerRadius < box.maxX &&
      z + playerRadius > box.minZ &&
      z - playerRadius < box.maxZ
    ) {
      if (box.maxY > highestY) {
        highestY = box.maxY;
      }
    }
  }

  return highestY;
}

// Check if minifigure can step from (fromX, fromZ, currentY) to (toX, toZ) without walking into walls
export function checkMinifigStep(
  fromX: number,
  fromZ: number,
  currentY: number,
  toX: number,
  toZ: number,
  existingBricks: PlacedBrick[],
  baseFloorY: number = 0.2
): { allowed: boolean; targetY: number } {
  const targetSurfaceY = getHighestSurfaceAt(toX, toZ, existingBricks, baseFloorY);
  const heightDifference = targetSurfaceY - currentY;

  // Maximum step height minifig can climb without a ladder/stairs (about 1 plate or small brick: ~0.45 units)
  const MAX_STEP_UP = 0.45;
  const MAX_STEP_DOWN = 1.6;

  if (heightDifference > MAX_STEP_UP) {
    // There is a wall or tall structure blocking the way - CANNOT walk through!
    return { allowed: false, targetY: currentY };
  }

  if (heightDifference < -MAX_STEP_DOWN) {
    // Steep drop off, safe step down or drop
    return { allowed: true, targetY: Math.max(targetSurfaceY, baseFloorY) };
  }

  return { allowed: true, targetY: Math.max(targetSurfaceY, baseFloorY) };
}
