
import { Chunk, CHUNK_SIZE, Tile, TileType } from '../types';
import { DIRS } from '../constants';

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
    
    // Neighbor invalidation
    if (localX === 0) { const c = chunks[`${chunkX-1},${chunkY}`]; if(c) c._dirty=true; }
    if (localX === CHUNK_SIZE-1) { const c = chunks[`${chunkX+1},${chunkY}`]; if(c) c._dirty=true; }
    if (localY === 0) { const c = chunks[`${chunkX},${chunkY-1}`]; if(c) c._dirty=true; }
    if (localY === CHUNK_SIZE-1) { const c = chunks[`${chunkX},${chunkY+1}`]; if(c) c._dirty=true; }
};

export const isRail = (tile: Tile | null) => tile?.type === TileType.RAIL;

export const isGate = (t: Tile | null) => t && (t.type === TileType.AND_GATE || t.type === TileType.OR_GATE || t.type === TileType.NOT_GATE);

export const isConductive = (t: Tile | null) => t && (t.type === TileType.WIRE || t.type === TileType.LEVER || t.type === TileType.LAMP || t.type === TileType.LAMP_ON);

// Check if a tile acts as a power source to its neighbors (Lever) or directed output (Gate)
export const isPowerSourceFor = (source: Tile, targetX: number, targetY: number): boolean => {
    if (!source.active) return false;
    
    if (source.type === TileType.LEVER) return true; // Levers power everything around them
    
    if (isGate(source)) {
        // Determine relationship from source to target
        const dx = targetX - source.x;
        const dy = targetY - source.y;
        
        // Find which relative side of the gate this target is on
        // 0:Front, 1:Right, 2:Back, 3:Left relative to facing (variant)
        // We iterate through DIRS rotated by variant
        let relativeSide = -1;
        for(let i=0; i<4; i++) {
            const absDirIndex = (source.variant + i) % 4;
            const dir = DIRS[absDirIndex];
            if (dir.dx === dx && dir.dy === dy) {
                relativeSide = i;
                break;
            }
        }
        
        if (relativeSide === -1) return false; // Not adjacent

        // Check if Output Mask has this side enabled
        // Output Mask is bits 4-7
        const ioConfig = source.ioConfig !== undefined ? source.ioConfig : 30; // Default 30
        const outputMask = (ioConfig >> 4) & 0x0F;
        
        return ((outputMask >> relativeSide) & 1) === 1;
    }
    return false;
};
