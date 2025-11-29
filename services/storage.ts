
import { GameState } from '../types';

export const saveGame = (state: GameState): boolean => {
    try {
        const chunksToSave = Object.entries(state.chunks).reduce((acc, [k, v]) => {
            const { _cache, ...rest } = v;
            acc[k] = rest;
            return acc;
        }, {} as Record<string, any>);

        const serializableState = {
            chunks: chunksToSave,
            player: state.player,
            inventory: state.inventory,
            seed: state.seed,
            entities: state.entities,
            customBlueprints: state.customBlueprints,
            customItems: state.customItems,
            customTextures: state.customTextures
        };
        localStorage.setItem('terraGenSave', JSON.stringify(serializableState));
        return true;
    } catch (e) {
        console.error("Save failed", e);
        return false;
    }
};

export const loadGame = (): GameState | null => {
    const saved = localStorage.getItem('terraGenSave');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            
            // Validation: Ensure critical data exists and is valid
            if (!parsed.player || typeof parsed.player.x !== 'number' || isNaN(parsed.player.x)) {
                console.warn("Save corrupted: Invalid player data");
                return null;
            }
            if (!parsed.chunks || Object.keys(parsed.chunks).length === 0) {
                 console.warn("Save corrupted: No chunks");
                 return null;
            }

            Object.values(parsed.chunks).forEach((c: any) => {
                c._dirty = true;
                c._cache = undefined;
            });

            // Default fallbacks for new fields
            if (!parsed.entities) parsed.entities = [];
            if (!parsed.customBlueprints) parsed.customBlueprints = [];
            if (!parsed.customItems) parsed.customItems = [];
            if (!parsed.customTextures) parsed.customTextures = {};

            return parsed as GameState;
        } catch (e) {
            console.error("Load failed", e);
            // If load fails, clear it so next refresh works
            localStorage.removeItem('terraGenSave');
        }
    }
    return null;
};
