import React, { useState } from 'react';
import { Save, X } from 'lucide-react';

interface BlueprintSaveDialogProps {
    onSave: (name: string) => void;
    onCancel: () => void;
    t: (key: string) => string;
}

export const BlueprintSaveDialog: React.FC<BlueprintSaveDialogProps> = ({ onSave, onCancel, t }) => {
    const [name, setName] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-600 rounded-xl p-6 shadow-2xl w-full max-w-sm">
                <h3 className="text-white font-bold text-lg mb-4">{t('save_blueprint_title')}</h3>
                
                <div className="mb-4">
                    <label className="text-slate-400 text-xs uppercase font-bold block mb-2">{t('blueprint_name')}</label>
                    <input 
                        autoFocus
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)}
                        placeholder="My Structure"
                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:outline-none focus:border-cyan-400"
                        onKeyDown={e => {
                            if (e.key === 'Enter' && name.trim()) onSave(name);
                            if (e.key === 'Escape') onCancel();
                        }}
                    />
                </div>

                <div className="flex gap-2 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-300 hover:text-white font-bold text-sm">
                        {t('cancel')}
                    </button>
                    <button 
                        onClick={() => name.trim() && onSave(name)} 
                        disabled={!name.trim()}
                        className={`px-4 py-2 rounded font-bold text-sm flex items-center gap-2 ${name.trim() ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-slate-700 text-slate-500'}`}
                    >
                        <Save size={16} />
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
    );
};