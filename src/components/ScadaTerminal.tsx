/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Terminal,
  Trash2,
  Download,
  Filter,
  CheckCircle,
  AlertTriangle,
  Zap,
  Radio
} from 'lucide-react';
import { SCADALogEntry } from '../types/aerovolt';

interface ScadaTerminalProps {
  logs: SCADALogEntry[];
  currentControlSummary: string;
  onClearLogs: () => void;
}

export const ScadaTerminal: React.FC<ScadaTerminalProps> = ({
  logs,
  currentControlSummary,
  onClearLogs,
}) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'DISPATCH' | 'CRITICAL' | 'WARN'>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'ALL') return true;
    return log.level === filterLevel;
  });

  const handleExportLogs = () => {
    const textContent = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}`
      )
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scada-audit-log-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelStyle = (level: SCADALogEntry['level']) => {
    switch (level) {
      case 'CRITICAL':
      case 'ALARM':
        return 'text-rose-400 font-bold bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-800';
      case 'DISPATCH':
        return 'text-cyan-300 font-bold bg-cyan-950/40 px-1.5 py-0.2 rounded border border-cyan-800';
      case 'WARN':
        return 'text-amber-300 font-bold bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800';
      case 'INFO':
      default:
        return 'text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>SCADA System Event Log &amp; AGC Dispatch Stream</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                IEC 60870-5-104
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Audit log of automatic generation control signals, frequency balancing actions, and device trips
            </p>
          </div>
        </div>

        {/* Log Actions */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-2 py-0.5 rounded ${
                filterLevel === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilterLevel('DISPATCH')}
              className={`px-2 py-0.5 rounded ${
                filterLevel === 'DISPATCH' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              DISPATCH
            </button>
            <button
              onClick={() => setFilterLevel('CRITICAL')}
              className={`px-2 py-0.5 rounded ${
                filterLevel === 'CRITICAL' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              CRITICAL
            </button>
          </div>

          <button
            onClick={handleExportLogs}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition"
            title="Export SCADA logs as plaintext"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT</span>
          </button>

          <button
            onClick={onClearLogs}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-mono transition"
            title="Clear terminal buffer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Latest SCADA Control Summary Box */}
      <div className="bg-slate-950/90 border border-cyan-900/50 p-3 rounded-lg mb-3">
        <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-cyan-400 mb-1">
          <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
          <span>LATEST AEROVOLT-CORE CONTROL_LOGS BROADCAST:</span>
        </div>
        <p className="text-xs font-mono text-slate-200 leading-relaxed bg-slate-900/80 p-2 rounded border border-slate-800">
          {currentControlSummary}
        </p>
      </div>

      {/* Terminal Output Window */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-xs max-h-64 overflow-y-auto space-y-2 select-text">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 py-4 text-center italic">
            No events logged for current filter criteria.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-2 text-[11px] hover:bg-slate-900/60 p-1 rounded transition"
            >
              <span className="text-slate-500 shrink-0 select-none">
                {log.timestamp.slice(11, 19)}
              </span>
              <span className={`shrink-0 ${getLevelStyle(log.level)}`}>
                [{log.level}]
              </span>
              <span className="text-cyan-500 shrink-0 font-semibold">
                [{log.source}]
              </span>
              <span className="text-slate-300 break-words flex-1">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
