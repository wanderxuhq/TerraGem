
import { Blueprint, Chunk, GameState, Inventory, TileType } from '../types';
import { getTile, modifyTile } from '../utils/gameUtils';
import { updateCircuit } from './world';
import { BLUEPRINT_IGNORED_TILES } from '../constants';

export const getBlueprintCost = (blueprint: Blueprint): Inventory => {
    const cost: Inventory = {};
    blueprint.tiles.forEach(tile => {
        // Assume cost is 1 of the item itself for simplicity
        if (!BLUEPRINT_IGNORED_TILES.has(tile.type)) {
            cost[tile.type] = (cost[tile.type] || 0) + 1;
        }
    });
    return cost;
};

export const canBuildBlueprint = (blueprint: Blueprint, inventory: Inventory): boolean => {
    const cost = getBlueprintCost(blueprint);
    for (const [type, count] of Object.entries(cost)) {
        if ((inventory[type as TileType] || 0) < count) {
            return false;
        }
    }
    return true;
};

export const placeBlueprint = (state: GameState, blueprint: Blueprint, anchorX: number, anchorY: number): boolean => {
    if (!canBuildBlueprint(blueprint, state.inventory)) return false;

    const cost = getBlueprintCost(blueprint);

    // 1. Deduct resources
    for (const [type, count] of Object.entries(cost)) {
        state.inventory[type as TileType]! -= count;
    }

    // 2. Place tiles
    const logicUpdates = new Set<string>();

    blueprint.tiles.forEach(t => {
        const worldX = anchorX + t.x;
        const worldY = anchorY + t.y;

        modifyTile(state.chunks, worldX, worldY, (existing) => ({
            ...existing,
            type: t.type,
            variant: t.variant !== undefined ? t.variant : existing.variant,
            active: t.active !== undefined ? t.active : false,
            // Restore IO Config if present in blueprint
            ioConfig: t.ioConfig,
            placed: true // Mark blueprint placements as player-placed
        }));

        if (
            t.type === TileType.WIRE || 
            t.type === TileType.LEVER || 
            t.type === TileType.LAMP || 
            t.type === TileType.AND_GATE || 
            t.type === TileType.OR_GATE || 
            t.type === TileType.NOT_GATE
        ) {
            logicUpdates.add(`${worldX},${worldY}`);
        }
    });

    // 3. Update circuits (debounce slightly by doing it after placement)
    logicUpdates.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        updateCircuit(state, x, y);
    });

    return true;
};

export const createBlueprint = (
    state: GameState, 
    x1: number, 
    y1: number, 
    x2: number, 
    y2: number, 
    name: string
): Blueprint => {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const centerX = Math.floor((minX + maxX) / 2);
    const centerY = Math.floor((minY + maxY) / 2);

    const tiles: { x: number; y: number; type: TileType; variant?: number; active?: boolean; ioConfig?: number }[] = [];

    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            const tile = getTile(state.chunks, x, y);
            if (tile) {
                // Only select tiles that have been placed by player/blueprints
                if (tile.placed) {
                    tiles.push({
                        x: x - centerX,
                        y: y - centerY,
                        type: tile.type,
                        variant: tile.variant,
                        active: tile.active,
                        ioConfig: tile.ioConfig
                    });
                }
            }
        }
    }

    return {
        id: Math.random().toString(36).substr(2, 9),
        name: name || 'Untitled',
        tiles
    };
};
