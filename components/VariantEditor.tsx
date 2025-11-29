
import React, { useState } from 'react';
import { Tile, TileType } from '../types';
import { X, Save, Box, Backpack } from 'lucide-react';
import { TILE_COLORS } from '../constants';

interface VariantEditorProps {
    tile: Tile;
    onSave: (ioConfig: number) => void;
    onSaveToInventory: (ioConfig: number, name: string) => void;
    onClose: () => void;
    t: (key: string) => string;
}

// 0:Front, 1:Right, 2:Back, 3:Left
export const VariantEditor: React.FC<VariantEditorProps> = ({ tile, onSave, onSaveToInventory, onClose, t }) => {
    // Initial config
    const startConfig = tile.ioConfig !== undefined ? tile.ioConfig : 30; // 30 = 11110 (LBR Input, F Output)
    const [config, setConfig] = useState(startConfig);
    const [name, setName] = useState(`Custom ${t(tile.type)}`);

    const inputMask = config & 0x0F;
    const outputMask = (config >> 4) & 0x0F;

    const countInputs = (mask: number) => {
        let c = 0;
        for(let i=0; i<4; i++) if((mask>>i)&1) c++;
        return c;
    };

    const togglePort = (side: number) => {
        // Cycle: None -> Input -> Output -> None
        const isInput = (inputMask >> side) & 1;
        const isOutput = (outputMask >> side) & 1;

        let newInputMask = inputMask;
        let newOutputMask = outputMask;

        if (isInput) {
            // Switch to Output
            newInputMask &= ~(1 << side);
            newOutputMask |= (1 << side);
        } else if (isOutput) {
            // Switch to None
            newOutputMask &= ~(1 << side);
        } else {
            // Switch to Input
            newInputMask |= (1 << side);
        }

        setConfig(newInputMask | (newOutputMask << 4));
    };

    const getModeLabel = (side: number) => {
        if ((inputMask >> side) & 1) return t('mode_input');
        if ((outputMask >> side) & 1) return t('mode_output');
        return t('mode_none');
    };

    const getSideColor = (side: number) => {
        if ((inputMask >> side) & 1) return 'bg-[#ef4444] ring-1 ring-[#ef4444]'; // Wire active color
        if ((outputMask >> side) & 1) return 'bg-[#ef4444] ring-1 ring-white'; // Wire active color
        return 'bg-slate-700 text-slate-400';
    };

    // Validation: AND/OR needs >= 2 inputs
    const inputCount = countInputs(inputMask);
    const isValid = (tile.type !== TileType.AND_GATE && tile.type !== TileType.OR_GATE) || inputCount >= 2;

    return (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 shadow-2xl w-full max-w-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Box size={20} className="text-cyan-400"/>
                        {t('configure_gate')}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                {/* Visual Editor */}
                <div className="relative w-48 h-48 mx-auto mb-6 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center">
                    {/* Center Piece */}
                    <div className="w-16 h-16 bg-slate-600 rounded flex items-center justify-center shadow-lg relative z-10 border border-slate-500">
                         <div style={{color: '#ef4444'}} className="font-bold text-2xl drop-shadow-md">
                            {tile.type === TileType.AND_GATE ? '&' : (tile.type === TileType.OR_GATE ? '≥1' : '!')}
                         </div>
                         {/* Orientation Marker (Up) */}
                         <div className="absolute -top-1 w-2 h-2 bg-slate-400 rounded-full"></div>
                    </div>

                    {/* Controls */}
                    {/* Front (Top in logic visual) */}
                    <button onClick={() => togglePort(0)} className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-md transition-all hover:scale-105 ${getSideColor(0)}`}>
                        {getModeLabel(0)}
                    </button>

                    {/* Back (Bottom in logic visual) */}
                    <button onClick={() => togglePort(2)} className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-md transition-all hover:scale-105 ${getSideColor(2)}`}>
                        {getModeLabel(2)}
                    </button>

                    {/* Left (Left in logic visual) */}
                    <button onClick={() => togglePort(3)} className={`absolute left-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-md transition-all hover:scale-105 ${getSideColor(3)}`}>
                        {getModeLabel(3)}
                    </button>

                    {/* Right (Right in logic visual) */}
                    <button onClick={() => togglePort(1)} className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-md transition-all hover:scale-105 ${getSideColor(1)}`}>
                        {getModeLabel(1)}
                    </button>
                </div>

                {!isValid && (
                    <div className="text-red-400 text-xs text-center mb-4 font-bold bg-red-900/20 p-2 rounded">
                        {t('error_min_inputs')}
                    </div>
                )}
                
                <div className="mb-4">
                     <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Item Name</label>
                     <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm"
                        placeholder="My Gate Function"
                     />
                </div>

                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => isValid && onSave(config)} 
                        disabled={!isValid}
                        className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 ${isValid ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                        {t('save')}
                    </button>
                    <button 
                        onClick={() => isValid && onSaveToInventory(config, name)}
                        disabled={!isValid || !name.trim()}
                        className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 border ${isValid && name.trim() ? 'border-purple-500 text-purple-400 hover:bg-purple-900/30' : 'border-slate-700 text-slate-600 cursor-not-allowed'}`}
                    >
                        <Backpack size={16}/>
                        {t('save_to_backpack')}
                    </button>
                </div>
            </div>
        </div>
    );
};
