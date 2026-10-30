/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Activity,
  CheckCircle2,
  Wrench,
  Download,
  Flame,
  Gauge,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { AssetHealthAlert, SystemTelemetryInput } from '../types/aerovolt';

interface AssetHealthRadarProps {
  alerts: AssetHealthAlert[];
  input: SystemTelemetryInput;
}

export const AssetHealthRadar: React.FC<AssetHealthRadarProps> = ({
  alerts,
  input,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'MEDIUM' | 'LOW'>('ALL');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]);

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.risk_level === filter;
  });

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedAlerts((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const vibration = input.assets.gearboxVibrationMmS;
  const bearingTemp = input.assets.bearingTemperatureC;
  const cellTemp = input.assets.cellTemperature;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Predictive Anomaly Detection &amp; Structural Health Radar</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                ISO 10816 / IEC 61400-25
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Continuous IoT sensor analytics on turbine powertrains, bearings, and PV inverters
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded transition ${
              filter === 'ALL' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            ALL ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={`px-2.5 py-1 rounded transition ${
              filter === 'CRITICAL' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            CRITICAL ({alerts.filter((a) => a.risk_level === 'CRITICAL').length})
          </button>
          <button
            onClick={() => setFilter('MEDIUM')}
            className={`px-2.5 py-1 rounded transition ${
              filter === 'MEDIUM' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            MEDIUM ({alerts.filter((a) => a.risk_level === 'MEDIUM').length})
          </button>
          <button
            onClick={() => setFilter('LOW')}
            className={`px-2.5 py-1 rounded transition ${
              filter === 'LOW' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            LOW ({alerts.filter((a) => a.risk_level === 'LOW').length})
          </button>
        </div>
      </div>

      {/* Sensor Physical Health Gauges Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {/* Gearbox Vibration Monitor */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gearbox Vibration (ISO 10816)</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
              vibration >= 6.0
                ? 'bg-rose-950 text-rose-300 border-rose-500'
                : vibration >= 3.5
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}>
              {vibration >= 6.0 ? 'CLASS IV DANGER' : vibration >= 3.5 ? 'CLASS III WARN' : 'CLASS I/II NOMINAL'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-mono font-bold text-white">
              {vibration.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">mm/s RMS</span>
          </div>
          {/* Gauge Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: '35%' }} title="Good (< 3.5 mm/s)" />
            <div className="bg-amber-500 h-full" style={{ width: '25%' }} title="Alert (3.5 - 6.0 mm/s)" />
            <div className="bg-rose-500 h-full" style={{ width: '40%' }} title="Danger (> 6.0 mm/s)" />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>0</span>
            <span>3.5 (ISO Alert)</span>
            <span>6.0 (Trip Limit)</span>
            <span>10+ mm/s</span>
          </div>
        </div>

        {/* Bearing Temperature Monitor */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Turbine Main Bearing Temp</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
              bearingTemp >= 80.0
                ? 'bg-rose-950 text-rose-300 border-rose-500'
                : bearingTemp >= 68.0
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}>
              {bearingTemp >= 80.0 ? 'THERMAL RUNAWAY' : bearingTemp >= 68.0 ? 'ELEVATED' : 'OPTIMAL'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-mono font-bold text-white">
              {bearingTemp.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">°C</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                bearingTemp >= 80.0 ? 'bg-rose-500' : bearingTemp >= 68.0 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (bearingTemp / 100) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>20°C</span>
            <span>68°C (Warn)</span>
            <span>80°C (Shutdown)</span>
            <span>100°C</span>
          </div>
        </div>

        {/* PV Cell / Inverter Junction Temp */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
            <span className="flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5 text-yellow-400" />
              <span>PV Cell &amp; Inverter Thermal</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
              cellTemp >= 75.0
                ? 'bg-rose-950 text-rose-300 border-rose-500'
                : cellTemp >= 64.0
                ? 'bg-amber-950 text-amber-300 border-amber-500'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500'
            }`}>
              {cellTemp >= 75.0 ? 'SEVERE DERATE' : cellTemp >= 64.0 ? 'THERMAL LOSS' : 'NORMAL'}
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-mono font-bold text-white">
              {cellTemp.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-slate-400">°C</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                cellTemp >= 75.0 ? 'bg-rose-500' : cellTemp >= 64.0 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (cellTemp / 90) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>25°C STC</span>
            <span>50°C</span>
            <span>75°C (IGBT Limit)</span>
            <span>90°C</span>
          </div>
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">All Physical Sensors Within Tolerances</h4>
            <p className="text-xs text-slate-400 font-mono mt-1">
              No anomalous vibrations, thermal overruns, or communication dropouts detected.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => {
            const isAck = acknowledgedAlerts.includes(`${alert.asset_id}-${idx}`);
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  alert.risk_level === 'CRITICAL'
                    ? 'bg-rose-950/20 border-rose-600/70'
                    : alert.risk_level === 'MEDIUM'
                    ? 'bg-amber-950/20 border-amber-600/60'
                    : 'bg-slate-950/80 border-slate-800'
                } ${isAck ? 'opacity-60' : ''}`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      alert.risk_level === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                        : alert.risk_level === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300 border-amber-500'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500'
                    }`}>
                      {alert.risk_level} RISK
                    </span>

                    <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      ASSET: {alert.asset_id}
                    </span>

                    <span className="text-xs text-slate-300 font-semibold">
                      {alert.component}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-mono leading-relaxed">
                    <strong className="text-slate-400">ANOMALY:</strong> {alert.detected_anomaly}
                  </p>

                  <div className="flex items-start space-x-1.5 text-xs text-cyan-300 font-mono bg-slate-950/90 p-2 rounded border border-slate-800/80">
                    <Wrench className="w-3.5 h-3.5 mt-0.5 shrink-0 text-cyan-400" />
                    <span>
                      <strong>AUTONOMOUS ACTION:</strong> {alert.recommended_action}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => toggleAcknowledge(`${alert.asset_id}-${idx}`)}
                    className={`px-3 py-1.5 rounded text-xs font-mono font-medium border transition ${
                      isAck
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                    }`}
                  >
                    {isAck ? 'ACKNOWLEDGED' : 'ACKNOWLEDGE'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
