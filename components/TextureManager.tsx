
import React, { useState } from 'react';
import { TileType } from '../types';
import { TILE_COLORS } from '../constants';
import { generateTexture } from '../services/geminiService';
import { X, Sparkles, RefreshCw, Palette } from 'lucide-react';

interface TextureManagerProps {
    customTextures: Partial<Record<TileType, string>>;
    onUpdateTexture: (type: TileType, base64: string | null) => void;
    onRestoreDefaults: () => void;
    onClose: () => void;
    t: (key: string) => string;
}

const CUSTOMIZABLE_TILES: TileType[] = [
    TileType.GRASS,
    TileType.WATER,
    TileType.SAND,
    TileType.STONE,
    TileType.WALL,
    TileType.FLOOR,
    TileType.WOOD,
    TileType.TREE,
    TileType.FLOWER
];

export const TextureManager: React.FC<TextureManagerProps> = ({ customTextures, onUpdateTexture, onRestoreDefaults, onClose, t }) => {
    const [selectedTile, setSelectedTile] = useState<TileType>(TileType.GRASS);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const texture = await generateTexture(selectedTile, prompt);
        if (texture) {
            onUpdateTexture(selectedTile, texture);
        }
        setLoading(false);
    };

    const handleReset = () => {
        onUpdateTexture(selectedTile, null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[85vh]">
                
                {/* Sidebar */}
                <div className="w-full md:w-56 bg-slate-800 p-2 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-700 shrink-0">
                    <h3 className="text-white font-bold p-3 mb-2 flex items-center gap-2 border-b border-slate-700">
                        <Palette size={18} className="text-pink-400"/>
                        {t('texture_manager')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2 p-1">
                        {CUSTOMIZABLE_TILES.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedTile(type)}
                                className={`p-2 rounded-lg flex items-center gap-3 text-sm font-bold transition-all border ${selectedTile === type ? 'bg-cyan-900/50 border-cyan-500 text-white shadow-md' : 'bg-slate-700/50 border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
                            >
                                <div className="w-8 h-8 rounded bg-slate-900 border border-slate-600 overflow-hidden shrink-0 relative shadow-sm">
                                    {customTextures[type] ? (
                                        <img src={customTextures[type]} alt={type} className="w-full h-full object-cover pixelated" style={{imageRendering: 'pixelated'}} />
                                    ) : (
                                        <div className="w-full h-full" style={{ backgroundColor: TILE_COLORS[type] }}></div>
                                    )}
                                </div>
                                <span className="truncate">{t(type)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6 flex flex-col items-center bg-slate-900 relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={24}/>
                    </button>

                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-2 w-full justify-center">
                        {t(selectedTile)}
                    </h2>

                    <div className="flex-1 w-full flex flex-col items-center justify-start gap-6">
                        {/* Preview Area with Checkerboard Background for Transparency */}
                        <div className="relative group">
                            <div 
                                className="w-48 h-48 rounded-xl border-4 border-slate-700 overflow-hidden shadow-2xl bg-slate-800"
                                style={{
                                    backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
                                    backgroundSize: '10px 10px'
                                }}
                            >
                                {customTextures[selectedTile] ? (
                                    <img src={customTextures[selectedTile]} alt="Preview" className="w-full h-full object-cover" style={{imageRendering: 'pixelated'}} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-24 h-24 rounded shadow-lg" style={{ backgroundColor: TILE_COLORS[selectedTile] }}></div>
                                    </div>
                                )}
                            </div>
                            
                            {loading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl border-4 border-transparent">
                                    <div className="flex flex-col items-center gap-2">
                                        <RefreshCw className="text-cyan-400 animate-spin" size={32} />
                                        <span className="text-xs font-bold text-cyan-400 animate-pulse">{t('generating')}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="w-full max-w-sm space-y-4 bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                            <div>
                                <label className="text-xs text-slate-400 font-bold uppercase block mb-1.5">{t('prompt_style')}</label>
                                <input 
                                    type="text" 
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    placeholder="e.g. Cyberpunk, Stone Brick, mossy..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500 text-sm transition-colors"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${loading ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg transform hover:-translate-y-0.5 active:translate-y-0'}`}
                                >
                                    <Sparkles size={16} />
                                    {loading ? t('generating') : t('generate')}
                                </button>
                                
                                {customTextures[selectedTile] && (
                                    <button 
                                        onClick={handleReset}
                                        disabled={loading}
                                        className="px-4 py-2 rounded-lg font-bold text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600 transition-colors"
                                    >
                                        {t('reset')}
                                    </button>
                                )}
                            </div>

                            <div className="border-t border-slate-700 pt-3 mt-2">
                                <button 
                                    onClick={onRestoreDefaults}
                                    disabled={loading}
                                    className="w-full py-2 rounded-lg font-bold text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <RefreshCw size={12} />
                                    {t('defaults')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
