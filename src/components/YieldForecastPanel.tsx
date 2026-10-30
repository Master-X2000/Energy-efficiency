/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Flame,
  Wind,
  Layers,
  BarChart3,
  Percent,
  Sliders,
  ChevronDown
} from 'lucide-react';
import {
  ForecastSummary,
  PhysicsDeratingDetails,
  SystemTelemetryInput
} from '../types/aerovolt';

interface YieldForecastPanelProps {
  forecast: ForecastSummary;
  physics: PhysicsDeratingDetails;
  input: SystemTelemetryInput;
}

export const YieldForecastPanel: React.FC<YieldForecastPanelProps> = ({
  forecast,
  physics,
  input,
}) => {
  const [activeHorizon, setActiveHorizon] = useState<'15min' | '1hour' | '24hour'>('24hour');

  const profile = physics.forecast24HourProfile;
  const maxVal = Math.max(
    ...profile.map((p) => Math.max(p.solarMw + p.windMw, p.demandMw)),
    300
  );

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartWidth = 560;

  // Generate SVG polyline points
  const pointsGen = profile
    .map((p, idx) => {
      const x = (idx / (profile.length - 1)) * chartWidth;
      const total = p.solarMw + p.windMw;
      const y = chartHeight - (total / maxVal) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  const pointsDemand = profile
    .map((p, idx) => {
      const x = (idx / (profile.length - 1)) * chartWidth;
      const y = chartHeight - (p.demandMw / maxVal) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  const pointsSolar = profile
    .map((p, idx) => {
      const x = (idx / (profile.length - 1)) * chartWidth;
      const y = chartHeight - (p.solarMw / maxVal) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  const pointsWind = profile
    .map((p, idx) => {
      const x = (idx / (profile.length - 1)) * chartWidth;
      const y = chartHeight - (p.windMw / maxVal) * (chartHeight - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Predictive Generation Yield &amp; Thermodynamic Loss Model</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                AEROVOLT-FORECAST
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Thermodynamic derating, Betz limit aerodynamic wake loss, and 15m / 1h / 24h horizons
            </p>
          </div>
        </div>

        {/* Confidence Metric Gauge */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono text-slate-400">Model Confidence:</span>
          <strong className="text-xs font-mono text-emerald-300">
            {(forecast.confidence_score * 100).toFixed(0)}%
          </strong>
        </div>
      </div>

      {/* Horizon Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>15-Minute Ultra Nowcast</span>
            </span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800">
              HIGH CONFIDENCE
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-mono font-bold text-white">
              {physics.forecast15MinMw.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">MW</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-1">
            Instantaneous irradiance &amp; rotor inertia ramp
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>1-Hour Ahead Dispatch</span>
            </span>
            <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-800">
              DISPATCH SCHEDULE
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-mono font-bold text-white">
              {physics.forecast1HourMw.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">MW</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-1">
            Accounting for cloud front velocity vector
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>24-Hour Day-Ahead Peak</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
              DAY-AHEAD AUCTION
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-mono font-bold text-white">
              {Math.max(...profile.map((p) => p.solarMw + p.windMw)).toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">MW</span>
          </div>
          <p className="text-[11px] font-mono text-slate-500 mt-1">
            Calculated across diurnal meteorological cycles
          </p>
        </div>
      </div>

      {/* SVG 24-Hour Forecast Curve */}
      <div className="bg-slate-950/90 border border-slate-800/90 p-4 rounded-xl mb-5">
        <div className="flex flex-wrap items-center justify-between mb-3 text-xs font-mono gap-2">
          <div className="flex items-center space-x-4">
            <span className="text-slate-300 font-bold">24-HOUR POWER TRAJECTORY:</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-cyan-400 rounded-full inline-block"></span>
              <span className="text-slate-400">Total Gen</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-amber-400 rounded-full inline-block"></span>
              <span className="text-slate-400">Solar PV</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-blue-400 rounded-full inline-block"></span>
              <span className="text-slate-400">Wind Park</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-purple-400 rounded-full inline-block border-b border-dashed"></span>
              <span className="text-slate-400">Demand Target</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">Scale: 0 - {maxVal.toFixed(0)} MW</span>
        </div>

        {/* Dynamic Responsive SVG */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-44 text-slate-700"
            preserveAspectRatio="none"
          >
            {/* Horizontal Grid lines */}
            <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.2" />
            <line x1="0" y1="60" x2={chartWidth} y2="60" stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.2" />
            <line x1="0" y1="100" x2={chartWidth} y2="100" stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.2" />
            <line x1="0" y1="140" x2={chartWidth} y2="140" stroke="currentColor" strokeDasharray="3 3" strokeOpacity="0.2" />

            {/* Demand Line */}
            <polyline
              fill="none"
              stroke="#c084fc"
              strokeWidth="2"
              strokeDasharray="4 3"
              points={pointsDemand}
            />

            {/* Solar Line */}
            <polyline
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeOpacity="0.75"
              points={pointsSolar}
            />

            {/* Wind Line */}
            <polyline
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeOpacity="0.75"
              points={pointsWind}
            />

            {/* Total Generation Line */}
            <polyline
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2.5"
              points={pointsGen}
            />
          </svg>
        </div>

        {/* Hour Axis Labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
          {profile
            .filter((_, i) => i % 4 === 0)
            .map((p, i) => (
              <span key={i}>
                T+{i * 4}h ({String(p.hour).padStart(2, '0')}:00)
              </span>
            ))}
          <span>T+24h</span>
        </div>
      </div>

      {/* Physics Derating & Loss Breakdown */}
      <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-4">
        <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Thermodynamic &amp; Aerodynamic Physical Loss Derating</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">PV Thermal Derate Loss</span>
            <div className="text-base font-bold text-amber-400 mt-0.5">
              -{physics.pvThermalDeratingLossMw} MW
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              -0.38%/°C above 25°C STC (Cell: {input.assets.cellTemperature.toFixed(1)}°C)
            </span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Wind Wake Aerodynamic Loss</span>
            <div className="text-base font-bold text-cyan-400 mt-0.5">
              -{physics.windWakeLossMw} MW
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Turbine array spacing efficiency: {physics.windAerodynamicEfficiency}%
            </span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">PV Inverter Clipping Loss</span>
            <div className="text-base font-bold text-purple-400 mt-0.5">
              -{physics.pvInverterClippingLossMw} MW
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              DC/AC oversizing threshold limit
            </span>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Effective Net Capacity Factor</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {(((forecast.total_generation_predicted_mw) / (input.assets.solarPvRatingMw + input.assets.windRatingMw)) * 100).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              Normalized over {input.assets.solarPvRatingMw + input.assets.windRatingMw} MW rated nameplate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
