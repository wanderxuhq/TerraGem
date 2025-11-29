
import { Chunk, CHUNK_SIZE, Tile, TileType } from '../types';

// Simple deterministic random based on coordinates and seed
const random = (x: number, y: number, seed: number) => {
  const n = x * 374761393 + y * 668265263 + seed * 12345; // Primes
  let t = Math.sin(n) * 10000;
  return t - Math.floor(t);
};

// 2D Noise function (simple value noise for smoothness)
const noise = (x: number, y: number, seed: number) => {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const s = random(floorX, floorY, seed);
    const t = random(floorX + 1, floorY, seed);
    const u = random(floorX, floorY + 1, seed);
    const v = random(floorX + 1, floorY + 1, seed);

    const rec = (n: number) => n - Math.floor(n);
    const fX = rec(x);
    const fY = rec(y);

    // Smooth interpolation
    const i1 = s + (t - s) * fX;
    const i2 = u + (v - u) * fX;
    return i1 + (i2 - i1) * fY;
};

export const generateChunk = (chunkX: number, chunkY: number, seed: number): Chunk => {
  const tiles: Tile[][] = [];
  
  for (let y = 0; y < CHUNK_SIZE; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const worldX = chunkX * CHUNK_SIZE + x;
      const worldY = chunkY * CHUNK_SIZE + y;
      
      // Large scale noise for biome
      const biomeNoise = noise(worldX * 0.05, worldY * 0.05, seed);
      
      // Small scale noise for detail
      const detailNoise = random(worldX, worldY, seed);
      
      let type = TileType.GRASS;
      
      if (biomeNoise < 0.3) {
        type = TileType.WATER;
      } else if (biomeNoise < 0.4) {
        type = TileType.SAND;
      } else {
        // High ground vegetation
        if (detailNoise > 0.95) {
          type = TileType.STONE;
        } else if (detailNoise > 0.88) {
          type = TileType.TREE;
        } else if (detailNoise > 0.85) {
          type = TileType.FLOWER;
        }
      }

      row.push({
        x: worldX,
        y: worldY,
        type,
        variant: Math.floor(random(worldX, worldY, seed + 1) * 3),
        active: false
      });
    }
    tiles.push(row);
  }

  return {
    x: chunkX,
    y: chunkY,
    tiles
  };
};
