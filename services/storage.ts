

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
            customBlueprints: state.customBlueprints
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
            Object.values(parsed.chunks).forEach((c: any) => {
                c._dirty = true;
                c._cache = undefined;
            });
            if (!parsed.entities) parsed.entities = [];
            if (!parsed.customBlueprints) parsed.customBlueprints = [];
            return parsed as GameState;
        } catch (e) {
            console.error("Load failed", e);
        }
    }
    return null;
};