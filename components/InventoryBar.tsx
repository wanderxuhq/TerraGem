
import React from 'react';
import { Inventory, TileType } from '../types';
import { TILE_COLORS } from '../constants';
import { Pickaxe, Axe, Hammer, Flower, Box, Zap, Lightbulb, ToggleLeft, Bot, GitMerge, Combine, SquareTerminal, Spline, Waypoints, Map as MapIcon, Backpack } from 'lucide-react';

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
        case TileType.WALL: return <div className="w-4 h-4 bg-[#78350f] border border-amber-700" />;
        case TileType.STONE: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
        case TileType.WOOD: return <div className="w-3 h-6 bg-[#57534e] rounded-sm" />;
        case TileType.TREE: return <div className="w-4 h-4 bg-green-800 rounded-full" />;
        case TileType.FLOWER: return <Flower size={16} color="white" />;
        case TileType.AXE: return <Axe size={18} className="text-red-400" />;
        case TileType.PICKAXE: return <Pickaxe size={18} className="text-blue-400" />;
        case TileType.FLOOR: return <div className="w-5 h-5 bg-[#d6d3d1] border border-stone-400" />;
        case TileType.RAIL: return <div className="w-4 h-6 border-x-2 border-slate-400 flex flex-col justify-between py-1"><div className="h-0.5 bg-amber-900 w-full"></div><div className="h-0.5 bg-amber-900 w-full"></div></div>;
        case TileType.WIRE: return <Zap size={16} className="text-red-600" />;
        case TileType.LEVER: return <ToggleLeft size={16} className="text-amber-700" />;
        case TileType.LAMP: return <Lightbulb size={16} className="text-slate-400" />;
        case TileType.MINECART: return <div className="w-5 h-4 bg-slate-600 rounded-b-lg border-2 border-slate-400"></div>;
        case TileType.ROBOT: return <Bot size={18} className="text-sky-400" />;
        case TileType.AND_GATE: return <Combine size={16} className="text-slate-200" />;
        case TileType.OR_GATE: return <GitMerge size={16} className="text-slate-200" />;
        case TileType.NOT_GATE: return <SquareTerminal size={16} className="text-slate-200" />;
        default: return <Box size={16} color="white" />;
    }
};

export const InventoryBar: React.FC<InventoryBarProps> = ({ inventory, selectedItem, onSelect, onToggleCrafting, onToggleBlueprints, onToggleBackpack, strings }) => {
  const availableItems = (Object.keys(inventory) as TileType[]).filter(k => (inventory[k] || 0) > 0);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-3 z-50">
        
        {/* Backpack Toggle */}
        <button 
            onClick={onToggleBackpack}
            className="bg-slate-800 border-2 border-slate-600 w-14 h-14 rounded-xl flex flex-col items-center justify-center hover:bg-slate-700 transition shadow-xl"
            title="Backpack"
        >
            <Backpack size={20} className="text-purple-400 mb-1" />
            <span className="text-[9px] text-white font-bold uppercase">{strings.backpack}</span>
        </button>

        {/* Blueprints Toggle */}
        <button 
            onClick={onToggleBlueprints}
            className="bg-slate-800 border-2 border-slate-600 w-14 h-14 rounded-xl flex flex-col items-center justify-center hover:bg-slate-700 transition shadow-xl"
            title="Blueprints"
        >
            <MapIcon size={20} className="text-cyan-400 mb-1" />
            <span className="text-[9px] text-white font-bold uppercase">{strings.blueprints}</span>
        </button>

        {/* Crafting Toggle */}
        <button 
            onClick={onToggleCrafting}
            className="bg-slate-800 border-2 border-slate-600 w-14 h-14 rounded-xl flex flex-col items-center justify-center hover:bg-slate-700 transition shadow-xl"
            title="Crafting Menu"
        >
            <Hammer size={20} className="text-yellow-400 mb-1" />
            <span className="text-[9px] text-white font-bold uppercase">{strings.craft}</span>
        </button>

        {/* Inventory Slots */}
        <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-xl flex gap-2 items-center shadow-xl">
            <div 
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedItem === null ? 'border-yellow-400 bg-slate-800' : 'border-slate-600 hover:bg-slate-800'}`}
                onClick={() => onSelect(null)}
                title="Hand"
            >
                <span className="text-2xl">✋</span>
            </div>

            <div className="w-px h-8 bg-slate-700 mx-1" />

            {availableItems.length === 0 && (
                <span className="text-slate-500 text-xs italic px-2">{strings.empty}</span>
            )}

            {availableItems.map((type) => (
                <div
                key={type}
                onClick={() => onSelect(type)}
                className={`relative w-12 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${selectedItem === type ? 'border-yellow-400 bg-slate-800' : 'border-slate-600 hover:bg-slate-800'}`}
                >
                <div className="flex flex-col items-center">
                    <div style={{ color: TILE_COLORS[type] }}>{getIconForType(type)}</div>
                </div>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border border-slate-900 shadow-sm">
                    {inventory[type]}
                </span>
                </div>
            ))}
        </div>
    </div>
  );
};
