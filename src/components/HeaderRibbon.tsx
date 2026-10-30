/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Activity,
  Zap,
  Radio,
  Cpu,
  Play,
  Pause,
  RefreshCw,
  Code2,
  Sliders,
  ShieldAlert,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { GridStatusTelemetry, BessCommand } from '../types/aerovolt';

interface HeaderRibbonProps {
  grid: GridStatusTelemetry;
  gridStatus: 'BALANCED' | 'DEFICIT' | 'SURPLUS';
  bessCommand: BessCommand;
  isStreaming: boolean;
  streamIntervalMs: number;
  onToggleStreaming: () => void;
  onStreamIntervalChange: (interval: number) => void;
  useAiEngine: boolean;
  onToggleAiEngine: () => void;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  activeTab: 'scada' | 'telemetry' | 'anomalies' | 'json' | 'api-tester';
  onTabChange: (tab: 'scada' | 'telemetry' | 'anomalies' | 'json' | 'api-tester') => void;
  hasApiKey: boolean;
  criticalAlertCount: number;
}

export const HeaderRibbon: React.FC<HeaderRibbonProps> = ({
  grid,
  gridStatus,
  bessCommand,
  isStreaming,
  streamIntervalMs,
  onToggleStreaming,
  onStreamIntervalChange,
  useAiEngine,
  onToggleAiEngine,
  isAnalyzing,
  onRunAnalysis,
  activeTab,
  onTabChange,
  hasApiKey,
  criticalAlertCount,
}) => {
  const nominal = grid.nominalFrequencyHz || 50;
  const deviation = grid.gridFrequencyHz - nominal;
  const isNormalFreq = Math.abs(deviation) <= 0.05;
  const isSevereFreq = Math.abs(deviation) > 0.15;

  return (
    <header className="border-b border-cyan-950/60 bg-slate-950/95 text-slate-100 backdrop-blur-md sticky top-0 z-40 select-none">
      {/* Top Status Strip */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 text-xs border-b border-cyan-950/40 bg-slate-900/60 gap-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-cyan-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="tracking-widest uppercase font-bold text-cyan-300">SCADA RTU LINK ACTIVE</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-800 font-mono text-slate-400 text-[11px]">
            <span>NODE: <strong className="text-slate-200">REMS-SUBSTATION-ALPHA</strong></span>
            <span>•</span>
            <span>IEC 61850 PROTOCOL: <strong className="text-emerald-400">SYNCED</strong></span>
          </div>
        </div>

        {/* Live Grid Frequency Telemetry Pill */}
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-2.5 py-0.5 rounded font-mono border text-[11px] ${
            isSevereFreq
              ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
              : !isNormalFreq
              ? 'bg-amber-950/60 border-amber-500 text-amber-300'
              : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
          }`}>
            <Activity className="w-3.5 h-3.5" />
            <span>FREQ:</span>
            <strong className="text-xs">{grid.gridFrequencyHz.toFixed(3)} Hz</strong>
            <span className="text-[10px] opacity-75">
              ({deviation >= 0 ? '+' : ''}{deviation.toFixed(3)} Hz)
            </span>
          </div>

          {/* Grid Status Badge */}
          <div className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider border ${
            gridStatus === 'SURPLUS'
              ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
              : gridStatus === 'DEFICIT'
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
          }`}>
            GRID: {gridStatus}
          </div>

          {/* BESS Mode Badge */}
          <div className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider border ${
            bessCommand.mode === 'CHARGE'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
              : bessCommand.mode === 'DISCHARGE'
              ? 'bg-amber-950/80 border-amber-500 text-amber-300'
              : bessCommand.mode === 'CURTAIL'
              ? 'bg-rose-950/80 border-rose-500 text-rose-300'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}>
            BESS: {bessCommand.mode} {bessCommand.target_rate_mw > 0 ? `(${bessCommand.target_rate_mw} MW)` : ''}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 gap-3">
        {/* Brand & Purpose */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 border border-cyan-400/30 shadow-lg shadow-cyan-950/50">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                AeroVolt-Core
              </h1>
              <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-semibold tracking-wider">
                v4.8-ENTERPRISE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Smart Grid Controller &amp; REMS Autonomous Analytics Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => onTabChange('scada')}
            className={`px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${
              activeTab === 'scada'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>SCADA Synoptic</span>
          </button>

          <button
            onClick={() => onTabChange('telemetry')}
            className={`px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${
              activeTab === 'telemetry'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Telemetry Deck</span>
          </button>

          <button
            onClick={() => onTabChange('anomalies')}
            className={`px-3 py-1.5 rounded transition flex items-center space-x-1.5 relative ${
              activeTab === 'anomalies'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Asset Diagnostics</span>
            {criticalAlertCount > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('json')}
            className={`px-3 py-1.5 rounded transition flex items-center space-x-1.5 ${
              activeTab === 'json'
                ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Core Output (JSON)</span>
          </button>
        </nav>

        {/* Engine Controls & Live Stream */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live stream ticker toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-1">
            <button
              onClick={onToggleStreaming}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition ${
                isStreaming
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={isStreaming ? 'Pause Real-Time Telemetry Stream' : 'Start Real-Time Telemetry Stream'}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="font-semibold">STREAM ON</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>STREAM OFF</span>
                </>
              )}
            </button>

            {isStreaming && (
              <select
                value={streamIntervalMs}
                onChange={(e) => onStreamIntervalChange(Number(e.target.value))}
                className="bg-transparent text-[11px] font-mono text-slate-400 px-1 py-0.5 outline-none cursor-pointer border-l border-slate-800 ml-1"
              >
                <option value={1000} className="bg-slate-900 text-slate-200">1s</option>
                <option value={3000} className="bg-slate-900 text-slate-200">3s</option>
                <option value={5000} className="bg-slate-900 text-slate-200">5s</option>
              </select>
            )}
          </div>

          {/* Engine Selector: Physics Core vs Gemini 3.8 Flash */}
          <button
            onClick={onToggleAiEngine}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border transition ${
              useAiEngine
                ? 'bg-violet-950/70 border-violet-500/70 text-violet-300 shadow-sm shadow-violet-900/50'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-500'
            }`}
            title="Toggle between deterministic thermo-mechanical physics engine and Gemini 3.8 Flash AI reasoning"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{useAiEngine ? 'Gemini 3.8 Flash' : 'Physics Core'}</span>
          </button>

          {/* Run Analysis Trigger */}
          <button
            onClick={onRunAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs font-mono shadow-md shadow-cyan-950/50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'PROCESSING...' : 'RUN DISPATCH'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
