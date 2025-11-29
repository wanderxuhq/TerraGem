
export enum TileType {
  GRASS = 'GRASS',
  WATER = 'WATER',
  SAND = 'SAND',
  TREE = 'TREE',
  STONE = 'STONE',
  WALL = 'WALL',
  FLOWER = 'FLOWER',
  FLOOR = 'FLOOR',
  WOOD = 'WOOD',
  AXE = 'AXE',
  PICKAXE = 'PICKAXE',
  // New Items
  RAIL = 'RAIL',
  MINECART = 'MINECART',
  WIRE = 'WIRE',
  LEVER = 'LEVER',
  LAMP = 'LAMP',
  LAMP_ON = 'LAMP_ON',
  ROBOT = 'ROBOT',
  SAPLING = 'SAPLING',
  // Logic Gates
  AND_GATE = 'AND_GATE',
  OR_GATE = 'OR_GATE',
  NOT_GATE = 'NOT_GATE'
}

// Visual variant logic remains, but we add state for logic components
export interface Tile {
  x: number;
  y: number;
  type: TileType;
  variant: number; // For gates: 0=Up, 1=Right, 2=Down, 3=Left
  active?: boolean; // For logic components
  placed?: boolean; // True if placed by player/system, false/undefined if natural
  
  // Bitmask Configuration:
  // Bits 0-3: Input Mask (0:Front, 1:Right, 2:Back, 3:Left relative to facing)
  // Bits 4-7: Output Mask (0:Front, 1:Right, 2:Back, 3:Left relative to facing)
  ioConfig?: number; 
}

export interface Entity {
    id: string;
    type: 'ROBOT' | 'MINECART';
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    rotation?: number; // Visual rotation in radians
    inventory?: Partial<Record<TileType, number>>;
    target?: { x: number, y: number } | null; // For robots
    state?: 'IDLE' | 'MOVING' | 'MINING';
}

export interface CustomItem {
    id: string;
    name: string;
    baseType: TileType; // AND_GATE, OR_GATE, etc.
    ioConfig: number;
    variant: number; // Default rotation preference
}

export interface Player {
  x: number; // Float
  y: number; // Float
  selectedItem: TileType | null;
  // If placing a custom item from backpack, this holds the config
  placingCustomConfig?: { ioConfig: number; variant: number; name: string } | null;
  direction: 'left' | 'right' | 'up' | 'down';
  ridingEntityId?: string | null;
}

export type Inventory = {
  [key in TileType]?: number;
};

export type CraftingCategory = 'TOOLS' | 'STRUCTURES' | 'LOGIC' | 'MECHANISMS';

export interface Recipe {
  output: TileType;
  count: number;
  ingredients: { type: TileType; count: number }[];
  category: CraftingCategory;
}

export interface Blueprint {
    id: string;
    name: string;
    tiles: { x: number; y: number; type: TileType; variant?: number; active?: boolean; ioConfig?: number }[];
}

// Chunk based system
export const CHUNK_SIZE = 16;

export interface Chunk {
  x: number; // Chunk coordinate X
  y: number; // Chunk coordinate Y
  tiles: Tile[][];
  _cache?: ImageBitmap | HTMLCanvasElement;
  _dirty?: boolean;
  _hasAnimations?: boolean;
}

export interface GameState {
  chunks: Record<string, Chunk>; // Key is "x,y"
  player: Player;
  inventory: Inventory;
  seed: number;
  entities: Entity[];
  customBlueprints: Blueprint[];
  customItems: CustomItem[]; // The "Backpack" of saved gates
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface LogMessage {
  id: string;
  text: string;
  sender: 'SYSTEM' | 'ORACLE';
  timestamp: number;
}
