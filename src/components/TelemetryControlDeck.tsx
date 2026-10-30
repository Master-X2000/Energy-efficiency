/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sun,
  Wind,
  Battery,
  Zap,
  Activity,
  Sliders,
  RotateCcw,
  Sparkles,
  Thermometer,
  CloudSun
} from 'lucide-react';
import { SystemTelemetryInput } from '../types/aerovolt';

interface TelemetryControlDeckProps {
  input: SystemTelemetryInput;
  onChangeInput: (newInput: SystemTelemetryInput) => void;
  onResetToDefaults: () => void;
  onInjectNoise: () => void;
}

export const TelemetryControlDeck: React.FC<TelemetryControlDeckProps> = ({
  input,
  onChangeInput,
  onResetToDefaults,
  onInjectNoise,
}) => {
  const updateEnv = (key: keyof SystemTelemetryInput['environmental'], val: number) => {
    onChangeInput({
      ...input,
      environmental: {
        ...input.environmental,
        [key]: val,
      },
    });
  };

  const updateAsset = (key: keyof SystemTelemetryInput['assets'], val: number) => {
    onChangeInput({
      ...input,
      assets: {
        ...input.assets,
        [key]: val,
      },
    });
  };

  const updateGrid = (key: keyof SystemTelemetryInput['grid'], val: number) => {
    onChangeInput({
      ...input,
      grid: {
        ...input.grid,
        [key]: val,
      },
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>IoT Telemetry &amp; Environmental Sensor Control Station</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                SCADA REGISTERS
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Directly manipulate irradiance, anemometer velocity, vibration sensors, and grid dispatch demand
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onInjectNoise}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-cyan-800 text-cyan-300 text-xs font-mono transition"
            title="Inject minor realistic atmospheric jitter into telemetry streams"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ATMOSPHERIC JITTER</span>
          </button>
          <button
            onClick={onResetToDefaults}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs font-mono transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* BAY 1: Environmental Telemetry */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>BAY 1: Meteorological Telemetry</span>
          </div>

          {/* GHI */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Global Horizontal Irradiance (GHI)</span>
              <strong className="text-amber-300">{input.environmental.ghi} W/m²</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1300"
              step="10"
              value={input.environmental.ghi}
              onChange={(e) => updateEnv('ghi', Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0 (Night)</span>
              <span>1000 (STC Standard)</span>
              <span>1300 (Max)</span>
            </div>
          </div>

          {/* Wind Speed */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Hub-Height Wind Speed</span>
              <strong className="text-cyan-300">{input.environmental.windSpeed.toFixed(1)} m/s</strong>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              step="0.2"
              value={input.environmental.windSpeed}
              onChange={(e) => updateEnv('windSpeed', Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0</span>
              <span>3 (Cut-in)</span>
              <span>11.5 (Rated)</span>
              <span>25 (Cut-out)</span>
            </div>
          </div>

          {/* Ambient Temperature */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Ambient Temperature</span>
              <strong className="text-slate-200">{input.environmental.ambientTemperature.toFixed(1)} °C</strong>
            </div>
            <input
              type="range"
              min="-20"
              max="55"
              step="0.5"
              value={input.environmental.ambientTemperature}
              onChange={(e) => updateEnv('ambientTemperature', Number(e.target.value))}
              className="w-full accent-blue-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>-20°C</span>
              <span>25°C (STC)</span>
              <span>55°C (Desert)</span>
            </div>
          </div>

          {/* Cloud Cover */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Cloud Cover Extent</span>
              <strong className="text-slate-200">{input.environmental.cloudCover}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={input.environmental.cloudCover}
              onChange={(e) => updateEnv('cloudCover', Number(e.target.value))}
              className="w-full accent-slate-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0% (Clear Sky)</span>
              <span>50% (Scattered)</span>
              <span>100% (Overcast)</span>
            </div>
          </div>
        </div>

        {/* BAY 2: Asset Telemetry & Mechanical Health */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>BAY 2: Physical Asset IoT Telemetry</span>
          </div>

          {/* Gearbox Vibration */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Turbine Gearbox Vibration RMS</span>
              <strong className={input.assets.gearboxVibrationMmS > 6.0 ? 'text-rose-400 font-bold' : input.assets.gearboxVibrationMmS > 3.5 ? 'text-amber-400' : 'text-emerald-300'}>
                {input.assets.gearboxVibrationMmS.toFixed(2)} mm/s
              </strong>
            </div>
            <input
              type="range"
              min="0.5"
              max="10.0"
              step="0.05"
              value={input.assets.gearboxVibrationMmS}
              onChange={(e) => updateAsset('gearboxVibrationMmS', Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0.5 (Smooth)</span>
              <span>3.5 (ISO Alert)</span>
              <span>6.0 (ISO Danger)</span>
            </div>
          </div>

          {/* Bearing Temperature */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Main Bearing Temperature</span>
              <strong className={input.assets.bearingTemperatureC > 80 ? 'text-rose-400 font-bold' : input.assets.bearingTemperatureC > 68 ? 'text-amber-400' : 'text-emerald-300'}>
                {input.assets.bearingTemperatureC.toFixed(1)} °C
              </strong>
            </div>
            <input
              type="range"
              min="20"
              max="95"
              step="0.5"
              value={input.assets.bearingTemperatureC}
              onChange={(e) => updateAsset('bearingTemperatureC', Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>20°C</span>
              <span>68°C (Warn)</span>
              <span>80°C (Thermal Trip)</span>
            </div>
          </div>

          {/* PV Cell Junction Temperature */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">PV Cell Junction Temperature</span>
              <strong className={input.assets.cellTemperature > 75 ? 'text-rose-400 font-bold' : input.assets.cellTemperature > 64 ? 'text-amber-400' : 'text-slate-200'}>
                {input.assets.cellTemperature.toFixed(1)} °C
              </strong>
            </div>
            <input
              type="range"
              min="15"
              max="85"
              step="0.5"
              value={input.assets.cellTemperature}
              onChange={(e) => updateAsset('cellTemperature', Number(e.target.value))}
              className="w-full accent-yellow-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>15°C</span>
              <span>25°C (STC Nominal)</span>
              <span>75°C (IGBT Limit)</span>
            </div>
          </div>

          {/* BESS State of Charge */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">BESS State of Charge (SoC)</span>
              <strong className="text-emerald-300">{input.assets.bessCurrentSoc.toFixed(1)}%</strong>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="0.5"
              value={input.assets.bessCurrentSoc}
              onChange={(e) => updateAsset('bessCurrentSoc', Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10% (Floor)</span>
              <span>50%</span>
              <span>95% (Full / Curtail)</span>
            </div>
          </div>
        </div>

        {/* BAY 3: Electrical Grid & Demand Status */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-blue-300 uppercase tracking-wider pb-2 border-b border-slate-800">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>BAY 3: Grid Intertie &amp; Load Demand</span>
          </div>

          {/* Grid Frequency */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Live Grid Frequency</span>
              <strong className={
                Math.abs(input.grid.gridFrequencyHz - 50) > 0.15
                  ? 'text-rose-400 font-bold'
                  : Math.abs(input.grid.gridFrequencyHz - 50) > 0.05
                  ? 'text-amber-300'
                  : 'text-emerald-300'
              }>
                {input.grid.gridFrequencyHz.toFixed(3)} Hz
              </strong>
            </div>
            <input
              type="range"
              min="49.50"
              max="50.50"
              step="0.01"
              value={input.grid.gridFrequencyHz}
              onChange={(e) => updateGrid('gridFrequencyHz', Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>49.50 Hz</span>
              <span>50.00 Hz (Nominal)</span>
              <span>50.50 Hz</span>
            </div>
          </div>

          {/* Demand Load */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Scheduled Demand Load</span>
              <strong className="text-blue-300">{input.grid.demandLoadMw.toFixed(1)} MW</strong>
            </div>
            <input
              type="range"
              min="60"
              max="380"
              step="2"
              value={input.grid.demandLoadMw}
              onChange={(e) => updateGrid('demandLoadMw', Number(e.target.value))}
              className="w-full accent-blue-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>60 MW (Trough)</span>
              <span>200 MW (Baseload)</span>
              <span>380 MW (Peak)</span>
            </div>
          </div>

          {/* Plant Ratings */}
          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PV Rating:</span>
              <span className="text-slate-200 font-bold">{input.assets.solarPvRatingMw} MW</span>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Wind Rating:</span>
              <span className="text-slate-200 font-bold">{input.assets.windRatingMw} MW</span>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">BESS Capacity:</span>
              <span className="text-slate-200 font-bold">{input.assets.bessCapacityMwh} MWh</span>
            </div>
            <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">BESS Max Rate:</span>
              <span className="text-slate-200 font-bold">{input.assets.bessMaxRateMw} MW</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
