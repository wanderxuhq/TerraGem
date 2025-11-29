
import React, { useState } from 'react';
import { CraftingCategory, Inventory, Recipe, TileType } from '../types';
import { RECIPES, STRINGS, TILE_COLORS } from '../constants';
import { Hammer, X, Bot, Wrench, BrickWall, Cpu, Cog } from 'lucide-react';
import { canCraftRecursive } from '../systems/crafting';

interface CraftingMenuProps {
  inventory: Inventory;
  onCraft: (recipe: Recipe) => void;
  onClose: () => void;
  t: (key: string) => string;
}

const CATEGORIES: CraftingCategory[] = ['TOOLS', 'STRUCTURES', 'LOGIC', 'MECHANISMS'];

const getCategoryIcon = (cat: CraftingCategory) => {
    switch(cat) {
        case 'TOOLS': return <Wrench size={16} />;
        case 'STRUCTURES': return <BrickWall size={16} />;
        case 'LOGIC': return <Cpu size={16} />;
        case 'MECHANISMS': return <Cog size={16} />;
        default: return <Hammer size={16} />;
    }
};

export const CraftingMenu: React.FC<CraftingMenuProps> = ({ inventory, onCraft, onClose, t }) => {
  const [activeCategory, setActiveCategory] = useState<CraftingCategory>('TOOLS');
  
  const filteredRecipes = RECIPES.filter(r => r.category === activeCategory);

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[70vh]">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2 text-white">
            <Hammer size={20} className="text-yellow-400" />
            <h2 className="font-bold text-lg">{t('craft_btn')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-40 bg-slate-900 border-r border-slate-700 flex flex-col">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`p-4 text-left flex items-center gap-3 transition-colors border-l-4 ${activeCategory === cat ? 'bg-slate-800 border-yellow-400 text-white' : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    >
                        {getCategoryIcon(cat)}
                        <span className="font-bold text-sm">{t(`cat_${cat}`)}</span>
                    </button>
                ))}
            </div>

            {/* Recipe List */}
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto bg-slate-900/50">
            {filteredRecipes.length === 0 && (
                <div className="text-slate-500 text-center mt-10 italic">No recipes in this category.</div>
            )}
            {filteredRecipes.map((recipe, idx) => {
                const craftable = canCraftRecursive(recipe, inventory);
                
                return (
                <div 
                    key={idx} 
                    className={`flex justify-between items-center p-3 rounded-lg border ${craftable ? 'bg-slate-800 border-slate-600' : 'bg-slate-800/50 border-slate-700 opacity-70'}`}
                >
                    <div className="flex items-center gap-3">
                    {/* Icon Placeholder */}
                    <div 
                        className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center border border-slate-600"
                        style={{ color: TILE_COLORS[recipe.output] }}
                    >
                        {recipe.output === TileType.ROBOT ? <Bot size={20} /> : <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: TILE_COLORS[recipe.output] }} />}
                    </div>
                    
                    <div>
                        <h3 className="text-white font-bold text-sm">{t(recipe.output)} <span className="text-xs text-slate-400">x{recipe.count}</span></h3>
                        <div className="flex gap-2 mt-1">
                        {recipe.ingredients.map((ing, i) => {
                            const hasEnough = (inventory[ing.type] || 0) >= ing.count;
                            return (
                            <span key={i} className={`text-xs ${hasEnough ? 'text-green-400' : 'text-slate-500'}`}>
                                {ing.count} {t(ing.type)}
                            </span>
                            );
                        })}
                        </div>
                    </div>
                    </div>

                    <button
                    onClick={() => craftable && onCraft(recipe)}
                    disabled={!craftable}
                    className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${
                        craftable 
                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg transform hover:-translate-y-0.5 active:translate-y-0' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                    >
                    {t('craft_btn')}
                    </button>
                </div>
                );
            })}
            </div>
        </div>

      </div>
    </div>
  );
};
