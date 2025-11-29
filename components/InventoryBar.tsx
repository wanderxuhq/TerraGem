
import React from 'react';
import { Inventory, TileType } from '../types';
import { Pickaxe, Axe, Hammer, Flower, Box, Zap, Lightbulb, ToggleLeft, Bot, GitMerge, Combine, SquareTerminal, Map as MapIcon, Backpack, Hand } from 'lucide-react';

interface InventoryBarProps {
  inventory: Inventory;
  selectedItem: TileType | null;
  onSelect: (item: TileType | null) => void;
  onToggleCrafting: () => void;
  onToggleBlueprints: () => void;
  onToggleBackpack: () => void;
  strings: { craft: string; empty: string; blueprints: string; backpack: string };
}

const getIconForType = (type: TileType) => {
    switch (type) {
        case TileType.WALL: return <div className="w-6 h-6 bg-[#78350f] border-2 border-amber-900 shadow-sm" />;
        case TileType.STONE: return <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-gray-500 shadow-sm" />;
        case TileType.WOOD: return <div className="w-4 h-7 bg-[#57534e] rounded-sm border border-[#44403c] shadow-sm" />;
        case TileType.TREE: return <div className="w-6 h-6 bg-green-800 rounded-full border-2 border-green-900 shadow-sm" />;
        case TileType.FLOWER: return <Flower size={24} className="text-pink-400 drop-shadow-sm" />;
        case TileType.AXE: return <Axe size={24} className="text-red-500 drop-shadow-md" />;
        case TileType.PICKAXE: return <Pickaxe size={24} className="text-blue-500 drop-shadow-md" />;
        case TileType.FLOOR: return <div className="w-7 h-7 bg-[#d6d3d1] border border-stone-500 shadow-sm" />;
        case TileType.RAIL: return <div className="w-6 h-8 border-x-4 border-slate-500 flex flex-col justify-between py-1 bg-slate-900/50"><div className="h-1 bg-amber-800 w-full"></div><div className="h-1 bg-amber-800 w-full"></div></div>;
        case TileType.WIRE: return <Zap size={24} className="text-red-500 drop-shadow-md" />;
        case TileType.LEVER: return <ToggleLeft size={24} className="text-amber-600 drop-shadow-md" />;
        case TileType.LAMP: return <Lightbulb size={24} className="text-yellow-300 drop-shadow-md" />;
        case TileType.MINECART: return <div className="w-8 h-6 bg-slate-600 rounded-b-lg border-2 border-slate-400 shadow-sm"></div>;
        case TileType.ROBOT: return <Bot size={26} className="text-sky-400 drop-shadow-md" />;
        case TileType.AND_GATE: return <Combine size={24} className="text-slate-200" />;
        case TileType.OR_GATE: return <GitMerge size={24} className="text-slate-200" />;
        case TileType.NOT_GATE: return <SquareTerminal size={24} className="text-slate-200" />;
        default: return <Box size={20} className="text-white" />;
    }
};

// Helper for main menu buttons
const MenuButton = ({ onClick, colorClass, borderClass, icon, label }: any) => (
  <div className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto" onClick={onClick}>
      <div className={`w-14 h-14 ${colorClass} rounded-xl flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.3)] border-b-4 ${borderClass} active:border-b-0 active:translate-y-1 active:mt-1 transition-all z-20`}>
          {icon}
      </div>
      <span className="text-[10px] font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-600 shadow-md z-20">{label}</span>
  </div>
);

export const InventoryBar: React.FC<InventoryBarProps> = ({ inventory, selectedItem, onSelect, onToggleCrafting, onToggleBlueprints, onToggleBackpack, strings }) => {
  const availableItems = (Object.keys(inventory) as TileType[]).filter(k => (inventory[k] || 0) > 0);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-[100] pointer-events-none">
        
        {/* Main Action Buttons */}
        <div className="flex gap-6 pb-2">
            <MenuButton 
                onClick={onToggleBackpack}
                colorClass="bg-purple-600 hover:bg-purple-500"
                borderClass="border-purple-800"
                icon={<Backpack className="text-white w-7 h-7" />}
                label={strings.backpack}
            />
            <MenuButton 
                onClick={onToggleBlueprints}
                colorClass="bg-cyan-600 hover:bg-cyan-500"
                borderClass="border-cyan-800"
                icon={<MapIcon className="text-white w-7 h-7" />}
                label={strings.blueprints}
            />
            <MenuButton 
                onClick={onToggleCrafting}
                colorClass="bg-amber-600 hover:bg-amber-500"
                borderClass="border-amber-800"
                icon={<Hammer className="text-white w-7 h-7" />}
                label={strings.craft}
            />
        </div>

        {/* Inventory Slots Panel */}
        <div className="bg-slate-800/95 p-2.5 rounded-2xl border-2 border-slate-500 shadow-2xl flex gap-2 items-center pointer-events-auto max-w-[90vw] overflow-x-auto scrollbar-hide">
            
            {/* Hand Slot */}
            <div 
                className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-100 relative shrink-0
                    ${selectedItem === null 
                        ? 'border-yellow-400 bg-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
                        : 'border-slate-600 bg-slate-700 hover:bg-slate-600 hover:border-slate-400'}`}
                onClick={() => onSelect(null)}
                title="Empty Hand"
            >
                 <Hand size={24} className={selectedItem === null ? "text-yellow-400" : "text-slate-400"} />
                 {selectedItem === null && <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
            </div>

            <div className="w-0.5 h-10 bg-slate-600 mx-1 rounded-full opacity-50" />

            {availableItems.length === 0 && (
                <span className="text-slate-400 text-xs italic px-4 font-medium">{strings.empty}</span>
            )}

            {availableItems.map((type) => (
                <div
                    key={type}
                    onClick={() => onSelect(type)}
                    className={`relative w-14 h-14 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all duration-100 group shrink-0
                        ${selectedItem === type 
                            ? 'border-white bg-slate-600 shadow-md scale-105 z-10' 
                            : 'border-slate-600 bg-slate-700 hover:bg-slate-600 hover:border-slate-400'}`}
                >
                    <div className="transition-transform group-hover:scale-110">
                        {getIconForType(type)}
                    </div>
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full border-2 border-slate-800 shadow-sm z-20">
                        {inventory[type]}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
