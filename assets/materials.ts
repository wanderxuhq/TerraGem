
import { TileType } from '../types';

// Registry mapping TileTypes to their corresponding image file paths.
// Ensure these files exist in your public/textures/ directory.
export const TEXTURE_PATHS: Partial<Record<TileType, string>> = {
  [TileType.GRASS]: '/textures/grass.png',
  [TileType.WATER]: '/textures/water.png',
  [TileType.SAND]: '/textures/sand.png',
  [TileType.TREE]: '/textures/tree.png',
  [TileType.STONE]: '/textures/stone.png',
  [TileType.WALL]: '/textures/wall.png',
  [TileType.FLOWER]: '/textures/flower.png',
  [TileType.FLOOR]: '/textures/floor.png',
  [TileType.WOOD]: '/textures/wood.png',
  [TileType.AXE]: '/textures/axe.png',
  [TileType.PICKAXE]: '/textures/pickaxe.png',
  [TileType.RAIL]: '/textures/rail.png',
  [TileType.MINECART]: '/textures/minecart.png',
  [TileType.WIRE]: '/textures/wire.png',
  [TileType.LEVER]: '/textures/lever.png',
  [TileType.LAMP]: '/textures/lamp.png',
  [TileType.LAMP_ON]: '/textures/lamp_on.png',
  [TileType.ROBOT]: '/textures/robot.png',
  [TileType.SAPLING]: '/textures/sapling.png',
  [TileType.AND_GATE]: '/textures/and_gate.png',
  [TileType.OR_GATE]: '/textures/or_gate.png',
  [TileType.NOT_GATE]: '/textures/not_gate.png'
};
