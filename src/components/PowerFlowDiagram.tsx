/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sun,
  Wind,
  BatteryCharging,
  Battery,
  Zap,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Gauge,
  AlertOctagon,
  ShieldCheck,
  Check,
  Flame,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import {
  SystemTelemetryInput,
  AeroVoltCoreOutput,
  PhysicsDeratingDetails
} from '../types/aerovolt';

interface PowerFlowDiagramProps {
  input: SystemTelemetryInput;
  output: AeroVoltCoreOutput;
  physics: PhysicsDeratingDetails;
}

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({
  input,
  output,
  physics,
}) => {
  const { forecast_summary, grid_stability_assessment } = output;
  const { bess_command, grid_status } = grid_stability_assessment;

  const solarMw = forecast_summary.solar_output_predicted_mw;
  const windMw = forecast_summary.wind_output_predicted_mw;
  const totalGenMw = forecast_summary.total_generation_predicted_mw;
  const demandMw = input.grid.demandLoadMw;
  const deltaMw = totalGenMw - demandMw;

  const freq = input.grid.gridFrequencyHz;
  const nominal = input.grid.nominalFrequencyHz || 50;
  const freqOffset = freq - nominal;

  // Percentage of battery filled
  const socPercent = Math.min(100, Math.max(0, input.assets.bessCurrentSoc));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, cyan 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Primary Electrical Power Flow &amp; Substation Busbar</span>
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                SCADA 132kV INTERCONNECT
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Real-time dynamic balance between renewable generation, utility load, and BESS dispatch
            </p>
          </div>
        </div>

        {/* System Balance Metric */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              NET GENERATION MARGIN
            </div>
            <div className={`text-xl font-mono font-bold flex items-center justify-end space-x-1 ${
              deltaMw >= 0 ? 'text-cyan-400' : 'text-amber-400'
            }`}>
              {deltaMw >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>{deltaMw >= 0 ? '+' : ''}{deltaMw.toFixed(2)} MW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Power Flow Synoptic Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch relative">
        
        {/* LEFT: Generation Sources (Solar + Wind) - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Renewable Generators</span>
            <span className="text-cyan-400">{totalGenMw.toFixed(1)} MW TOTAL</span>
          </div>

          {/* Solar PV Node */}
          <div className="bg-slate-950/80 border border-amber-900/40 hover:border-amber-500/60 transition p-4 rounded-xl relative group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 text-amber-400">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">Solar PV Farm</h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Rating: {input.assets.solarPvRatingMw} MW DC
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-amber-300">
                  {solarMw.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">MW</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono bg-slate-900/70 p-2 rounded border border-slate-800">
              <div>
                <span className="text-slate-400">GHI:</span>{' '}
                <strong className="text-slate-200">{input.environmental.ghi} W/m²</strong>
              </div>
              <div>
                <span className="text-slate-400">Cell Temp:</span>{' '}
                <strong className={input.assets.cellTemperature > 65 ? 'text-amber-400' : 'text-slate-200'}>
                  {input.assets.cellTemperature.toFixed(1)}°C
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Thermal Loss:</span>{' '}
                <strong className="text-amber-400">-{physics.pvThermalDeratingLossMw} MW</strong>
              </div>
              <div>
                <span className="text-slate-400">Cloud Atten:</span>{' '}
                <strong className="text-slate-200">{input.environmental.cloudCover}%</strong>
              </div>
            </div>
          </div>

          {/* Wind Turbine Park Node */}
          <div className="bg-slate-950/80 border border-cyan-900/40 hover:border-cyan-500/60 transition p-4 rounded-xl relative group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
                  <Wind className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">Wind Turbine Park</h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Rating: {input.assets.windRatingMw} MW ({input.assets.windTurbineCount} Turbines)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-cyan-300">
                  {windMw.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">MW</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-[11px] font-mono bg-slate-900/70 p-2 rounded border border-slate-800">
              <div>
                <span className="text-slate-400">Hub Wind:</span>{' '}
                <strong className="text-slate-200">{input.environmental.windSpeed.toFixed(1)} m/s</strong>
              </div>
              <div>
                <span className="text-slate-400">Vibration:</span>{' '}
                <strong className={input.assets.gearboxVibrationMmS > 6.0 ? 'text-rose-400 font-bold' : input.assets.gearboxVibrationMmS > 3.5 ? 'text-amber-400' : 'text-emerald-400'}>
                  {input.assets.gearboxVibrationMmS.toFixed(2)} mm/s
                </strong>
              </div>
              <div>
                <span className="text-slate-400">Wake Loss:</span>{' '}
                <strong className="text-cyan-400">-{physics.windWakeLossMw} MW</strong>
              </div>
              <div>
                <span className="text-slate-400">Bearing:</span>{' '}
                <strong className={input.assets.bearingTemperatureC > 78 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {input.assets.bearingTemperatureC.toFixed(1)}°C
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: Central Substation & Grid Frequency Busbar - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
              <span className="font-mono text-xs font-bold text-slate-200 uppercase tracking-wider">
                132 kV Substation Busbar
              </span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              grid_status === 'SURPLUS'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                : grid_status === 'DEFICIT'
                ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
            }`}>
              {grid_status}
            </span>
          </div>

          {/* Central Busbar Graphic / Meter */}
          <div className="py-4 my-auto text-center">
            {/* Frequency Dial Indicator */}
            <div className="inline-block relative p-4 rounded-full bg-slate-950 border border-slate-800 shadow-inner mb-3">
              <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Arc color glow */}
                <div 
                  className={`absolute inset-0 opacity-20 ${
                    Math.abs(freqOffset) > 0.15 ? 'bg-rose-500' : Math.abs(freqOffset) > 0.05 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <Gauge className={`w-6 h-6 mb-1 ${
                  Math.abs(freqOffset) > 0.15 ? 'text-rose-400 animate-pulse' : Math.abs(freqOffset) > 0.05 ? 'text-amber-400' : 'text-emerald-400'
                }`} />
                <span className="font-mono text-base font-bold text-white tracking-tight">
                  {freq.toFixed(2)}
                </span>
                <span className="font-mono text-[9px] text-slate-400 uppercase">Hz (Live)</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-300">
                Droop Stiffness: <strong className="text-cyan-400">120 MW/Hz</strong>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Primary Droop Response: <span className="text-slate-200">{physics.primaryFrequencyResponseMw > 0 ? '+' : ''}{physics.primaryFrequencyResponseMw} MW</span>
              </div>
            </div>
          </div>

          {/* Busbar Intertie Summary */}
          <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 text-xs font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Renewable Infeed:</span>
              <span className="text-cyan-300 font-bold">{totalGenMw.toFixed(2)} MW</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Demand Load:</span>
              <span className="text-slate-200 font-bold">{demandMw.toFixed(2)} MW</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Autonomous Action:</span>
              <span className={`font-bold ${grid_stability_assessment.action_required ? 'text-amber-400' : 'text-emerald-400'}`}>
                {grid_stability_assessment.action_required ? 'REQUIRED (DISPATCHED)' : 'NOMINAL (FLOAT)'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Grid Intertie & BESS System - 4 Cols */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Grid Demand &amp; BESS</span>
            <span className="text-slate-300">{demandMw.toFixed(1)} MW LOAD</span>
          </div>

          {/* Grid Demand Load Node */}
          <div className="bg-slate-950/80 border border-blue-900/40 hover:border-blue-500/60 transition p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-500/50 text-blue-400">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">Local Grid Load</h4>
                  <span className="text-[10px] font-mono text-slate-400">Scheduled Demand</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-mono font-bold text-blue-300">
                  {demandMw.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1">MW</span>
              </div>
            </div>

            <div className="text-[11px] font-mono bg-slate-900/70 p-2 rounded border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Feeder Infeed:</span>
              <span className="text-slate-200 font-bold">
                {Math.min(totalGenMw, demandMw).toFixed(1)} MW Renewable Covered
              </span>
            </div>
          </div>

          {/* BESS Autonomous Controller Node */}
          <div className={`bg-slate-950/80 border transition p-4 rounded-xl relative ${
            bess_command.mode === 'CHARGE'
              ? 'border-emerald-500/60 bg-emerald-950/10'
              : bess_command.mode === 'DISCHARGE'
              ? 'border-amber-500/60 bg-amber-950/10'
              : bess_command.mode === 'CURTAIL'
              ? 'border-rose-500/60 bg-rose-950/10'
              : 'border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg border ${
                  bess_command.mode === 'CHARGE'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-400'
                    : bess_command.mode === 'DISCHARGE'
                    ? 'bg-amber-950 border-amber-500 text-amber-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}>
                  {bess_command.mode === 'CHARGE' ? (
                    <BatteryCharging className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Battery className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">BESS Storage Bank</h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Capacity: {input.assets.bessCapacityMwh} MWh (Max {input.assets.bessMaxRateMw} MW)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-base font-mono font-bold ${
                  bess_command.mode === 'CHARGE'
                    ? 'text-emerald-300'
                    : bess_command.mode === 'DISCHARGE'
                    ? 'text-amber-300'
                    : bess_command.mode === 'CURTAIL'
                    ? 'text-rose-300'
                    : 'text-slate-400'
                }`}>
                  {bess_command.mode}
                </span>
                {bess_command.target_rate_mw > 0 && (
                  <div className="text-xs font-mono text-cyan-300 font-bold">
                    {bess_command.target_rate_mw.toFixed(1)} MW
                  </div>
                )}
              </div>
            </div>

            {/* Battery SoC Progress Bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">State of Charge (SoC):</span>
                <span className="text-slate-200 font-bold">
                  {socPercent.toFixed(1)}% &rarr; Target: {bess_command.target_soc_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    socPercent > 90
                      ? 'bg-cyan-400'
                      : socPercent < 15
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${socPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>10% Reserve Floor</span>
                <span>Usable Energy: {(((socPercent - 10) / 100) * input.assets.bessCapacityMwh).toFixed(1)} MWh</span>
                <span>95% Full Cap</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
