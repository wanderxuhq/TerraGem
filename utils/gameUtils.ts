
import { Chunk, CHUNK_SIZE, Tile, TileType } from '../types';

export const getTile = (chunks: Record<string, Chunk>, x: number, y: number): Tile | null => {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
    const key = `${chunkX},${chunkY}`;
    const chunk = chunks[key];
    if (!chunk) return null;
    
    let localX = x % CHUNK_SIZE;
    let localY = y % CHUNK_SIZE;
    if (localX < 0) localX += CHUNK_SIZE;
    if (localY < 0) localY += CHUNK_SIZE;

    return chunk.tiles[localY][localX];
};

export const modifyTile = (chunks: Record<string, Chunk>, x: number, y: number, modifier: (t: Tile) => Tile) => {
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkY = Math.floor(y / CHUNK_SIZE);
    const key = `${chunkX},${chunkY}`;
    const chunk = chunks[key];
    if (!chunk) return;

    let localX = x % CHUNK_SIZE;
    let localY = y % CHUNK_SIZE;
    if (localX < 0) localX += CHUNK_SIZE;
    if (localY < 0) localY += CHUNK_SIZE;
    
    chunk.tiles[localY][localX] = modifier(chunk.tiles[localY][localX]);
    chunk._dirty = true;
    
    // Neighbor invalidation for borders to ensure connected textures update
    if (localX === 0) { const c = chunks[`${chunkX-1},${chunkY}`]; if(c) c._dirty=true; }
    if (localX === CHUNK_SIZE-1) { const c = chunks[`${chunkX+1},${chunkY}`]; if(c) c._dirty=true; }
    if (localY === 0) { const c = chunks[`${chunkX},${chunkY-1}`]; if(c) c._dirty=true; }
    if (localY === CHUNK_SIZE-1) { const c = chunks[`${chunkX},${chunkY+1}`]; if(c) c._dirty=true; }
};

export const isRail = (tile: Tile | null) => tile?.type === TileType.RAIL;

export const isGate = (t: Tile | null) => t && (t.type === TileType.AND_GATE || t.type === TileType.OR_GATE || t.type === TileType.NOT_GATE);

export const isConductive = (t: Tile | null) => t && (t.type === TileType.WIRE || t.type === TileType.LEVER || t.type === TileType.LAMP || t.type === TileType.LAMP_ON);
