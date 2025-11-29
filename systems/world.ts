

import { INTERACTABLE_TILES, LOOT_TABLE, DIRS, STRINGS } from '../constants';
import { CHUNK_SIZE, TileType, GameState, Tile } from '../types';
import { getTile, modifyTile, isGate, isConductive, isPowerSourceFor } from '../utils/gameUtils';

// Helper to get lang for strings inside systems (where hooks aren't available)
const getLang = () => {
  if (typeof navigator === 'undefined') return 'en';
  const navLang = navigator.language.toLowerCase();
  return navLang.startsWith('zh') ? 'zh' : 'en';
};
const t = (key: string) => STRINGS[key]?.[getLang()] || key;

export const attemptMine = (state: GameState, x: number, y: number, onLoot?: () => void) => {
    const tile = getTile(state.chunks, x, y);
    if (!tile || !INTERACTABLE_TILES.has(tile.type)) return;

    const loot = LOOT_TABLE[tile.type];
    if (loot) {
        // If the tile has a background type (it was an overlay), revert to it.
        // Otherwise, revert to default ground (Floor for Walls, Grass for others usually, but simplify to Grass/Floor toggle)
        let nextType = tile.backgroundType;
        
        if (!nextType) {
             nextType = tile.type === TileType.WALL ? TileType.FLOOR : TileType.GRASS;
        }

        modifyTile(state.chunks, x, y, (t) => ({ 
            ...t, 
            type: nextType!, 
            active: false,
            // If turning into a floor from a placed wall, keep it placed. Otherwise revert to natural state.
            placed: nextType === TileType.FLOOR ? t.placed : false,
            backgroundType: undefined, // Clear background since we exposed it
            variant: t.variant // Keep variant? For grass noise it helps.
        }));
        
        const inv = state.inventory;
        inv[loot.item] = (inv[loot.item] || 0) + loot.count;
        if (onLoot) onLoot();
        
        // Block update neighbors
        updateCircuit(state, x+1, y);
        updateCircuit(state, x-1, y);
        updateCircuit(state, x, y+1);
        updateCircuit(state, x, y-1);
    }
};

// Helper: Check if tile at (sx, sy) is providing an active HIGH signal to (tx, ty)
const getSignal = (state: GameState, sx: number, sy: number, tx: number, ty: number): boolean => {
    const t = getTile(state.chunks, sx, sy);
    if (!t) return false;

    // Omnidirectional sources/conductors
    if (t.type === TileType.WIRE || t.type === TileType.LEVER || t.type === TileType.LAMP || t.type === TileType.LAMP_ON) {
        return !!t.active;
    }
    // Directional sources (Gates)
    if (isGate(t)) {
        // Strictly check if it acts as a source for this specific target
        return isPowerSourceFor(t, tx, ty);
    }
    return false;
};

// Update a circuit network (contiguous wires/lamps) and trigger attached gates
// Converted to function declaration to safely handle hoisting for mutual recursion with evaluateGate
export function updateCircuit(state: GameState, startX: number, startY: number, recursionDepth = 0) {
    if (recursionDepth > 100) return; // Prevent infinite loops

    // 1. Identify the "Net" (connected conductive tiles) starting at x,y
    const queue = [{x: startX, y: startY}];
    const netTiles: Tile[] = [];
    const visited = new Set<string>();
    
    // Check if start is actually part of a net
    const startTile = getTile(state.chunks, startX, startY);
    
    // If we clicked a Gate directly to rotate it, just evaluate it
    if (startTile && isGate(startTile)) {
        evaluateGate(state, startTile, recursionDepth);
        return;
    }

    if (!isConductive(startTile)) return;

    // Flood fill to find the Net
    queue.push({x: startX, y: startY});
    while (queue.length > 0) {
        const cur = queue.pop()!;
        const key = `${cur.x},${cur.y}`;
        if (visited.has(key)) continue;
        
        const t = getTile(state.chunks, cur.x, cur.y);
        if (!t || !isConductive(t)) continue;
        
        visited.add(key);
        netTiles.push(t);
        
        // Add neighbors
        queue.push({x: cur.x+1, y: cur.y});
        queue.push({x: cur.x-1, y: cur.y});
        queue.push({x: cur.x, y: cur.y+1});
        queue.push({x: cur.x, y: cur.y-1});
    }

    // 2. Determine if this Net is Powered
    // It is powered if ANY tile in the net is adjacent to an active SOURCE (active Lever, active Gate Output)
    let isPowered = false;
    for (const tile of netTiles) {
        // If the net contains a lever that is on, the whole net is on
        if (tile.type === TileType.LEVER && tile.active) {
            isPowered = true;
            break;
        }

        // Check all neighbors of this tile for sources
        const neighbors = [
            {x: tile.x+1, y: tile.y}, {x: tile.x-1, y: tile.y},
            {x: tile.x, y: tile.y+1}, {x: tile.x, y: tile.y-1}
        ];
        
        for (const n of neighbors) {
            // Don't check tiles inside the net itself (unless it's a lever inside the net)
            const neighbor = getTile(state.chunks, n.x, n.y);
            if (neighbor) {
                // If neighbor is NOT part of the net (e.g. Gate Output feeding into net)
                if (!visited.has(`${neighbor.x},${neighbor.y}`)) {
                    if (isPowerSourceFor(neighbor, tile.x, tile.y)) {
                        isPowered = true;
                    }
                }
            }
        }
        if (isPowered) break;
    }

    // 3. Apply State to Net
    const processedGates = new Set<string>();

    for (const tile of netTiles) {
        // Handle Levers: they are sources, so they don't change state based on the net power,
        // but they MUST notify neighbors (Gate inputs) that their state (or existence) might have updated.
        // This is critical because if a lever is toggled, it calls updateCircuit, which must then trigger
        // adjacent gates to re-evaluate.
        if (tile.type === TileType.LEVER) {
             const neighbors = [
                {x: tile.x+1, y: tile.y}, {x: tile.x-1, y: tile.y},
                {x: tile.x, y: tile.y+1}, {x: tile.x, y: tile.y-1}
            ];
            for (const n of neighbors) {
                const neighbor = getTile(state.chunks, n.x, n.y);
                if (neighbor && isGate(neighbor) && !processedGates.has(`${neighbor.x},${neighbor.y}`)) {
                    processedGates.add(`${neighbor.x},${neighbor.y}`);
                    evaluateGate(state, neighbor, recursionDepth + 1);
                }
            }
            continue; 
        }
        
        const shouldBeActive = isPowered;
        
        // We perform the modification if state changes OR if type needs to swap (Lamp <-> Lamp_On)
        const currentIsLamp = tile.type === TileType.LAMP || tile.type === TileType.LAMP_ON;
        const targetType = currentIsLamp ? (shouldBeActive ? TileType.LAMP_ON : TileType.LAMP) : tile.type;
        
        if (tile.active !== shouldBeActive || tile.type !== targetType) {
            modifyTile(state.chunks, tile.x, tile.y, t => ({
                ...t, 
                active: shouldBeActive,
                type: targetType
            }));

            // Since state changed, we must notify neighbors that are Gates
            const neighbors = [
                {x: tile.x+1, y: tile.y}, {x: tile.x-1, y: tile.y},
                {x: tile.x, y: tile.y+1}, {x: tile.x, y: tile.y-1}
            ];
            for (const n of neighbors) {
                const neighbor = getTile(state.chunks, n.x, n.y);
                if (neighbor && isGate(neighbor) && !processedGates.has(`${neighbor.x},${neighbor.y}`)) {
                    processedGates.add(`${neighbor.x},${neighbor.y}`);
                    evaluateGate(state, neighbor, recursionDepth + 1);
                }
            }
        }
    }
}

function evaluateGate(state: GameState, gate: Tile, depth: number) {
    // Default: 3 Inputs (L,B,R) -> 1110 = 14; 1 Output (F) -> 0001 << 4 = 16. Total 30.
    const ioConfig = gate.ioConfig !== undefined ? gate.ioConfig : 30;

    const inputMask = ioConfig & 0x0F;
    const outputMask = (ioConfig >> 4) & 0x0F;

    let activeInputs = 0;
    let configuredInputs = 0;
    
    // Check all 4 sides for Inputs
    for(let i=0; i<4; i++) {
        // i=0: Front, 1: Right, 2: Back, 3: Left
        if ((inputMask >> i) & 1) {
            configuredInputs++;
            const absDirIndex = (gate.variant + i) % 4;
            const dir = DIRS[absDirIndex];
            const tx = gate.x + dir.dx;
            const ty = gate.y + dir.dy;
            
            // For AND/OR gate, checks if the specific input pin is receiving power
            if (getSignal(state, tx, ty, gate.x, gate.y)) {
                activeInputs++;
            }
        }
    }

    let outputActive = false;

    if (gate.type === TileType.NOT_GATE) {
        // NOT: Active if activeInputs == 0
        // If no inputs are configured, it defaults to ON (like a constant 1 source if you misuse it)
        outputActive = (activeInputs === 0);
    } else if (gate.type === TileType.OR_GATE) {
        // OR: Active if any input is active
        outputActive = (activeInputs > 0);
    } else if (gate.type === TileType.AND_GATE) {
        // AND: Active if ALL configured inputs are active
        // Also must have at least one input configured to be active (prevents empty AND being true)
        outputActive = configuredInputs > 0 && (activeInputs === configuredInputs);
    }

    if (gate.active !== outputActive) {
        modifyTile(state.chunks, gate.x, gate.y, t => ({...t, active: outputActive}));
        
        // Update all configured Output sides
        for(let i=0; i<4; i++) {
            if ((outputMask >> i) & 1) {
                const absDirIndex = (gate.variant + i) % 4;
                const dir = DIRS[absDirIndex];
                updateCircuit(state, gate.x + dir.dx, gate.y + dir.dy, depth + 1);
            }
        }
    }
}

export const handleInteraction = (state: GameState, worldX: number, worldY: number, onUpdate: () => void, isShiftHeld: boolean = false) => {
    const tile = getTile(state.chunks, worldX, worldY);
    if (!tile) return;

    if (tile.type === TileType.LEVER) {
        const newState = !tile.active;
        modifyTile(state.chunks, worldX, worldY, t => ({...t, active: newState}));
        updateCircuit(state, worldX, worldY); 
        onUpdate();
        return;
    }
    
    // Configure Gates (Rotation)
    if (isGate(tile)) {
         if (!isShiftHeld) {
             // Rotate
             modifyTile(state.chunks, worldX, worldY, t => ({...t, variant: (t.variant + 1) % 4}));
             
             // 1. Evaluate self FIRST to ensure internal active state is correct for new orientation
             evaluateGate(state, getTile(state.chunks, worldX, worldY)!, 0);

             // 2. Re-evaluate immediate surroundings as rotation changes connection points
             updateCircuit(state, worldX+1, worldY);
             updateCircuit(state, worldX-1, worldY);
             updateCircuit(state, worldX, worldY+1);
             updateCircuit(state, worldX, worldY-1);
         }
         onUpdate();
         return;
    }

    // Note: Rail configuration via Shift+Click is now handled in App.tsx via UI modal.
    // We removed the legacy cycling logic here.

    attemptMine(state, worldX, worldY);
    onUpdate();
};

export const simulateNature = (state: GameState) => {
    const chunks = Object.values(state.chunks);
    if (chunks.length === 0) return;
    const chunk = chunks[Math.floor(Math.random() * chunks.length)];
    const rx = Math.floor(Math.random() * CHUNK_SIZE);
    const ry = Math.floor(Math.random() * CHUNK_SIZE);
    const tile = chunk.tiles[ry][rx];
    const worldX = chunk.x * CHUNK_SIZE + rx;
    const worldY = chunk.y * CHUNK_SIZE + ry;

    if (tile.type === 'SAPLING' as TileType) {
        if (Math.random() < 0.1) {
            modifyTile(state.chunks, worldX, worldY, t => ({...t, type: TileType.TREE}));
        }
    }
    if (tile.type === TileType.FLOWER && Math.random() < 0.05) {
        const dx = Math.floor(Math.random()*3)-1;
        const dy = Math.floor(Math.random()*3)-1;
        const target = getTile(state.chunks, worldX+dx, worldY+dy);
        if (target && target.type === TileType.GRASS) {
            modifyTile(state.chunks, worldX+dx, worldY+dy, t => ({...t, type: TileType.FLOWER}));
        }
    }
};
