

import React from 'react';
import { Blueprint, Inventory, TileType } from '../types';
import { DEFAULT_BLUEPRINTS, TILE_COLORS } from '../constants';
import { Map, X, Check, Plus } from 'lucide-react';
import { canBuildBlueprint, getBlueprintCost } from '../systems/blueprints';

interface BlueprintMenuProps {
  inventory: Inventory;
  customBlueprints: Blueprint[];
  onSelect: (blueprint: Blueprint) => void;
  onEnterCreationMode: () => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const BlueprintMenu: React.FC<BlueprintMenuProps> = ({ inventory, customBlueprints, onSelect, onEnterCreationMode, onClose, t }) => {
  const allBlueprints = [...DEFAULT_BLUEPRINTS, ...customBlueprints];

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2 text-white">
            <Map size={20} className="text-cyan-400" />
            <h2 className="font-bold text-lg">{t('blueprints_btn')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Blueprint List */}
        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          
          <button 
            onClick={() => { onClose(); onEnterCreationMode(); }}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg p-3 text-slate-400 hover:text-cyan-400 hover:border-cyan-400 transition"
          >
              <Plus size={20} />
              <span className="font-bold">{t('create_blueprint')}</span>
          </button>

          {allBlueprints.map((bp) => {
            const buildable = canBuildBlueprint(bp, inventory);
            const cost = getBlueprintCost(bp);
            
            return (
              <div 
                key={bp.id} 
                className={`flex justify-between items-center p-3 rounded-lg border transition-all ${buildable ? 'bg-slate-800 border-slate-600 hover:bg-slate-750' : 'bg-slate-800/50 border-slate-700 opacity-70'}`}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-white font-bold text-sm">{t(bp.name) || bp.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(cost).map(([type, count]) => {
                      const hasEnough = (inventory[type as TileType] || 0) >= count;
                      return (
                        <div key={type} className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded text-[10px] border border-slate-700">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TILE_COLORS[type as TileType] }} />
                            <span className={`${hasEnough ? 'text-slate-300' : 'text-red-400'}`}>
                                {count}
                            </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                      if (buildable) {
                          onSelect(bp);
                          onClose();
                      }
                  }}
                  disabled={!buildable}
                  className={`ml-3 p-2 rounded-lg transition-all ${
                    buildable 
                      ? 'bg-cyan-700 hover:bg-cyan-600 text-white shadow-lg' 
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check size={16} />
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};