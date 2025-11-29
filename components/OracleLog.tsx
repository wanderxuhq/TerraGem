import React, { useEffect, useRef } from 'react';
import { LogMessage } from '../types';
import { Sparkles } from 'lucide-react';

interface OracleLogProps {
  logs: LogMessage[];
}

export const OracleLog: React.FC<OracleLogProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="fixed top-4 left-4 w-80 max-h-64 overflow-y-auto bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-xl z-40 pointer-events-none">
      <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-slate-200">World Log</h3>
      </div>
      <div className="flex flex-col gap-2">
        {logs.map((log) => (
          <div key={log.id} className="text-xs">
            <span className={`font-bold ${log.sender === 'ORACLE' ? 'text-purple-400' : 'text-slate-400'}`}>
              {log.sender}:
            </span>
            <span className="ml-2 text-slate-200">{log.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
