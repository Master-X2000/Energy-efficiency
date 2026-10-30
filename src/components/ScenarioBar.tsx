/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sun, Wind, BatteryWarning, ThermometerSnowflake, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { PRESET_SCENARIOS } from '../data/presetScenarios';
import { PresetScenario } from '../types/aerovolt';

interface ScenarioBarProps {
  activeScenarioId: string | null;
  onSelectScenario: (scenario: PresetScenario) => void;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  activeScenarioId,
  onSelectScenario,
}) => {
  const getIcon = (category: PresetScenario['category']) => {
    switch (category) {
      case 'SURPLUS':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />;
      case 'DEFICIT':
        return <BatteryWarning className="w-4 h-4 text-orange-400" />;
      case 'THERMAL':
        return <ThermometerSnowflake className="w-4 h-4 text-yellow-400" />;
      case 'NOMINAL':
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getBadgeStyle = (category: PresetScenario['category'], isSelected: boolean) => {
    if (isSelected) {
      return 'bg-cyan-950 border-cyan-400 text-white shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400';
    }
    switch (category) {
      case 'CRITICAL':
        return 'bg-rose-950/40 border-rose-800/60 text-rose-200 hover:border-rose-600';
      case 'SURPLUS':
        return 'bg-amber-950/30 border-amber-800/60 text-amber-200 hover:border-amber-600';
      case 'DEFICIT':
        return 'bg-orange-950/30 border-orange-800/60 text-orange-200 hover:border-orange-600';
      case 'THERMAL':
        return 'bg-yellow-950/30 border-yellow-800/60 text-yellow-200 hover:border-yellow-600';
      case 'NOMINAL':
      default:
        return 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-600';
    }
  };

  return (
    <div className="bg-slate-950 border-b border-cyan-950/50 px-4 py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-400">
            SCADA TELEMETRY PRESETS:
          </span>
          <span className="text-[11px] text-slate-400">
            Test AeroVolt-Core generation forecasting, BESS dispatch, and ISO anomaly thresholds
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
          <span>Click to inject real-world telemetry stream</span>
          <ChevronRight className="w-3.5 h-3.5 text-cyan-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {PRESET_SCENARIOS.map((scenario) => {
          const isSelected = activeScenarioId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`text-left p-2.5 rounded-lg border transition flex flex-col justify-between ${getBadgeStyle(
                scenario.category,
                isSelected
              )}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center space-x-1.5">
                  {getIcon(scenario.category)}
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                    {scenario.category}
                  </span>
                </div>
                {isSelected && (
                  <span className="text-[9px] font-mono uppercase bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">
                    ACTIVE
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-xs leading-snug line-clamp-1 text-slate-100">
                {scenario.title}
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {scenario.subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
