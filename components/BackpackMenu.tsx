
import React from 'react';
import { CustomItem, Inventory, TileType } from '../types';
import { TILE_COLORS } from '../constants';
import { X, Check, Box } from 'lucide-react';

interface BackpackMenuProps {
  inventory: Inventory;
  customItems: CustomItem[];
  onSelect: (item: CustomItem) => void;
  onClose: () => void;
  t: (key: string) => string;
}

export const BackpackMenu: React.FC<BackpackMenuProps> = ({ inventory, customItems, onSelect, onClose, t }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2 text-white">
            <Box size={20} className="text-purple-400" />
            <h2 className="font-bold text-lg">{t('backpack_title')}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {/* Item List */}
        <div className="p-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto min-h-[200px]">
          
          {customItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 italic mt-10">
                  <Box size={40} className="mb-2 opacity-50"/>
                  <p>No saved items.</p>
                  <p className="text-xs mt-2">Use Shift+Click on a gate to configure and save it.</p>
              </div>
          )}

          {customItems.map((item) => {
            const hasBaseItem = (inventory[item.baseType] || 0) > 0;
            
            return (
              <div 
                key={item.id} 
                className={`flex justify-between items-center p-3 rounded-lg border transition-all ${hasBaseItem ? 'bg-slate-800 border-slate-600 hover:bg-slate-750' : 'bg-slate-800/50 border-slate-700 opacity-70'}`}
              >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center border border-slate-600 font-bold text-white relative">
                        {item.baseType === TileType.AND_GATE ? '&' : (item.baseType === TileType.OR_GATE ? '≥1' : '!')}
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-slate-800"></div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                    <h3 className="text-white font-bold text-sm">{item.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span>Requires: 1x {t(item.baseType)}</span>
                        {!hasBaseItem && <span className="text-red-400">(Missing)</span>}
                    </div>
                    </div>
                </div>

                <button
                  onClick={() => {
                      if (hasBaseItem) {
                          onSelect(item);
                          onClose();
                      }
                  }}
                  disabled={!hasBaseItem}
                  className={`ml-3 p-2 rounded-lg transition-all ${
                    hasBaseItem 
                      ? 'bg-purple-700 hover:bg-purple-600 text-white shadow-lg' 
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
