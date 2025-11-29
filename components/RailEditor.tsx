
import React, { useState } from 'react';
import { Tile } from '../types';
import { X, Save, Backpack, GitCommitHorizontal } from 'lucide-react';

interface RailEditorProps {
    tile: Tile;
    onSave: (variant: number) => void;
    onSaveToInventory: (variant: number, name: string) => void;
    onClose: () => void;
    t: (key: string) => string;
}

// Rail Bitmask: N=1, E=2, S=4, W=8
export const RailEditor: React.FC<RailEditorProps> = ({ tile, onSave, onSaveToInventory, onClose, t }) => {
    // 0 means Auto. If variant > 0, it is a bitmask.
    const initialAuto = tile.variant === 0;
    const initialMask = tile.variant === 0 ? 15 : tile.variant; // Default to all if auto

    const [isAuto, setIsAuto] = useState(initialAuto);
    const [mask, setMask] = useState(initialMask);
    const [name, setName] = useState(`Custom Rail`);

    const toggleBit = (bit: number) => {
        if (isAuto) setIsAuto(false);
        setMask(prev => prev ^ bit);
    };

    const isBitOn = (bit: number) => (mask & bit) !== 0;

    const getBtnClass = (bit: number) => {
        const isActive = isBitOn(bit);
        if (isActive) return 'bg-[#525252] ring-1 ring-[#a8a29e] text-white';
        return 'bg-slate-700 text-slate-500';
    };

    // Helper to calculate effective mask for saving
    const saveValue = isAuto ? 0 : mask;

    return (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900/90 border border-slate-600 rounded-xl p-6 shadow-2xl w-full max-w-sm backdrop-blur-md">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                         <GitCommitHorizontal size={20} className="text-cyan-400"/>
                        {t('configure_rail')} 
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="flex items-center gap-2 mb-4 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                    <input 
                        type="checkbox" 
                        id="autoMode" 
                        checked={isAuto} 
                        onChange={e => setIsAuto(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-500 text-cyan-600 focus:ring-cyan-500 bg-slate-700"
                    />
                    <label htmlFor="autoMode" className="text-sm font-bold text-slate-200 cursor-pointer select-none">
                        {t('rail_auto')}
                    </label>
                </div>

                {/* Visual Editor */}
                <div 
                    className={`relative w-48 h-48 mx-auto mb-6 rounded-xl border-2 border-dashed border-slate-600 flex items-center justify-center transition-opacity ${isAuto ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
                    style={{
                        backgroundImage: 'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        backgroundColor: 'transparent' 
                    }}
                >
                    
                    {/* Rail Visuals */}
                    <div className="absolute inset-0 flex items-center justify-center drop-shadow-xl">
                        {/* Center Hub */}
                        <div className={`w-4 h-4 rounded-full z-10 ${mask > 0 ? 'bg-[#525252]' : 'bg-transparent border-2 border-[#525252]'}`}></div>
                        
                        {/* Arms */}
                        {isBitOn(1) && <div className="absolute top-10 w-4 h-14 bg-[#525252]"></div>}
                        {isBitOn(4) && <div className="absolute bottom-10 w-4 h-14 bg-[#525252]"></div>}
                        {isBitOn(8) && <div className="absolute left-10 h-4 w-14 bg-[#525252]"></div>}
                        {isBitOn(2) && <div className="absolute right-10 h-4 w-14 bg-[#525252]"></div>}
                    </div>

                    {/* Controls */}
                    {/* N (1) */}
                    <button onClick={() => toggleBit(1)} className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg transition-all hover:scale-105 ${getBtnClass(1)}`}>
                        N
                    </button>

                    {/* S (4) */}
                    <button onClick={() => toggleBit(4)} className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg transition-all hover:scale-105 ${getBtnClass(4)}`}>
                        S
                    </button>

                    {/* W (8) */}
                    <button onClick={() => toggleBit(8)} className={`absolute left-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg transition-all hover:scale-105 ${getBtnClass(8)}`}>
                        W
                    </button>

                    {/* E (2) */}
                    <button onClick={() => toggleBit(2)} className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg transition-all hover:scale-105 ${getBtnClass(2)}`}>
                        E
                    </button>
                </div>

                <div className="mb-4">
                     <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">{t('item_name')}</label>
                     <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                        placeholder="My Custom Rail"
                     />
                </div>

                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => onSave(saveValue)} 
                        className="w-full py-2 rounded font-bold text-sm bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Save size={16}/> {t('save')}
                    </button>
                    <button 
                         onClick={() => onSaveToInventory(saveValue, name)}
                         disabled={!name.trim()}
                         className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 border ${name.trim() ? 'border-purple-500 text-purple-400 hover:bg-purple-900/30' : 'border-slate-700 text-slate-600 cursor-not-allowed'}`}
                    >
                        <Backpack size={16}/>
                        {t('save_to_backpack')}
                    </button>
                </div>
            </div>
        </div>
    );
};
