
import { Inventory, Recipe, TileType } from '../types';
import { RECIPES } from '../constants';

// Internal helper to simulate crafting on a specific inventory instance
const simulateCraft = (recipe: Recipe, inv: Inventory, visited: Set<TileType>): boolean => {
    // Cycle detection
    if (visited.has(recipe.output)) return false;
    visited.add(recipe.output);

    for (const ing of recipe.ingredients) {
        const needed = ing.count;
        let available = inv[ing.type] || 0;

        // If not enough ingredients, try to craft them recursively
        if (available < needed) {
            const missing = needed - available;
            const subRecipe = RECIPES.find(r => r.output === ing.type);
            
            // If no recipe for ingredient, we can't craft it
            if (!subRecipe) return false;

            const craftsNeeded = Math.ceil(missing / subRecipe.count);
            for (let i = 0; i < craftsNeeded; i++) {
                // Recursively attempt craft. IMPORTANT: Pass 'inv' directly to mutate it.
                // We pass a copy of visited to allow distinct branches but stop circles.
                if (!simulateCraft(subRecipe, inv, new Set(visited))) return false;
            }
            
            // Re-check availability after sub-crafts
            available = inv[ing.type] || 0;
            if (available < needed) return false;
        }
        
        // Consume ingredients from the simulation inventory
        inv[ing.type] = (inv[ing.type] || 0) - needed;
    }

    // Produce output
    inv[recipe.output] = (inv[recipe.output] || 0) + recipe.count;
    return true;
};

// Public check function - uses a clone so it doesn't affect real inventory
export const canCraftRecursive = (recipe: Recipe, currentInv: Inventory): boolean => {
    const tempInv = { ...currentInv };
    return simulateCraft(recipe, tempInv, new Set());
};

// Public perform function - operates on the REAL inventory
export const performRecursiveCraft = (recipe: Recipe, realInv: Inventory): boolean => {
    // 1. Dry run to ensure it's possible before making any changes
    if (!canCraftRecursive(recipe, realInv)) return false;
    
    // 2. Execute for real
    return simulateCraft(recipe, realInv, new Set());
};
