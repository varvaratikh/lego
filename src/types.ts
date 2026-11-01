export type ToolMode = 'build' | 'sims' | 'physics' | 'destroy';

export type BrickCategory = 'basic' | 'plates' | 'slopes' | 'doors_windows' | 'furniture' | 'special';

export interface BrickType {
  id: string;
  name: string;
  nameRu: string;
  category: BrickCategory;
  width: number;  // studs (X)
  depth: number;  // studs (Z)
  height: number; // units (1 brick height = 1.2 units, 1 plate = 0.4 units)
  isPlate?: boolean;
  isSlope?: boolean;
  slopeDirection?: 'x' | 'z';
  hasStuds?: boolean;
  isCustomModel?: 'door' | 'window' | 'chair' | 'table' | 'bed' | 'tree' | 'tv' | 'fridge' | 'toilet';
}

export interface PlacedBrick {
  id: string;
  typeId: string;
  color: string;
  position: [number, number, number]; // [x, y, z] in world units
  rotation: number; // in radians around Y (0, Math.PI/2, Math.PI, 3*Math.PI/2)
  isPhysicsActive?: boolean;
}

export interface LegoColor {
  name: string;
  hex: string;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
}

export interface SimNeeds {
  hunger: number;    // 0 to 100
  energy: number;    // 0 to 100
  fun: number;       // 0 to 100
  social: number;    // 0 to 100
}

export type SimActivity = 
  | 'idle' 
  | 'walking' 
  | 'building' 
  | 'eating' 
  | 'sleeping' 
  | 'dancing' 
  | 'chatting' 
  | 'exploring';

export interface MinifigureData {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  outfitColor: string;
  pantsColor: string;
  hairColor: string;
  hairStyle: 'classic' | 'hair' | 'cap' | 'helmet' | 'chef';
  faceExpression: 'happy' | 'cool' | 'sleepy' | 'surprised' | 'working';
  needs: SimNeeds;
  currentActivity: SimActivity;
  thoughtBubble?: {
    icon: string;
    text: string;
    expiresAt: number;
  };
  heldItem?: 'cup' | 'wrench' | 'pizza' | 'flower' | 'brick';
}
