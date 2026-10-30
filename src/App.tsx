/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SystemTelemetryInput,
  AeroVoltCoreOutput,
  PhysicsDeratingDetails,
  SCADALogEntry,
  PresetScenario
} from './types/aerovolt';
import { calculateAeroVoltAnalytics } from './services/aerovoltPhysics';
import { PRESET_SCENARIOS } from './data/presetScenarios';
import { HeaderRibbon } from './components/HeaderRibbon';
import { ScenarioBar } from './components/ScenarioBar';
import { PowerFlowDiagram } from './components/PowerFlowDiagram';
import { YieldForecastPanel } from './components/YieldForecastPanel';
import { AssetHealthRadar } from './components/AssetHealthRadar';
import { TelemetryControlDeck } from './components/TelemetryControlDeck';
import { JsonViewPanel } from './components/JsonViewPanel';
import { ScadaTerminal } from './components/ScadaTerminal';

export default function App() {
  // Default to the first scenario (or nominal)
  const initialScenario = PRESET_SCENARIOS[0];

  const [input, setInput] = useState<SystemTelemetryInput>(initialScenario.input);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(initialScenario.id);
  const [activeTab, setActiveTab] = useState<'scada' | 'telemetry' | 'anomalies' | 'json' | 'api-tester'>('scada');

  // Analytical outputs
  const [coreOutput, setCoreOutput] = useState<AeroVoltCoreOutput>(() => {
    return calculateAeroVoltAnalytics(initialScenario.input).coreOutput;
  });
  const [physicsDetails, setPhysicsDetails] = useState<PhysicsDeratingDetails>(() => {
    return calculateAeroVoltAnalytics(initialScenario.input).physicsDetails;
  });

  // Engine state
  const [engineName, setEngineName] = useState<string>('AeroVolt Physics Core');
  const [useAiEngine, setUseAiEngine] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  // Live Stream state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamIntervalMs, setStreamIntervalMs] = useState<number>(3000);

  // SCADA Logs state
  const [logs, setLogs] = useState<SCADALogEntry[]>([
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      level: 'INFO',
      source: 'SCADA_BUS',
      message: 'AeroVolt-Core REMS & Smart Grid Controller initialized. Substation RTU online.',
    },
    {
      id: 'log-2',
      timestamp: new Date().toISOString(),
      level: 'DISPATCH',
      source: 'AEROVOLT_AI',
      message: 'Initial state analysis: Autonomous generation forecasting active. Monitoring ISO 10816 vibration limits.',
    },
  ]);

  // Check backend health
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasGeminiApiKey) {
          setHasApiKey(true);
          setUseAiEngine(true);
        }
      })
      .catch(() => {
        // Fallback mode running purely client-side
      });
  }, []);

  // Compute analytics
  const runAnalytics = useCallback(async (currentInput: SystemTelemetryInput, triggerAi = false) => {
    setIsAnalyzing(true);

    try {
      if (triggerAi) {
        const response = await fetch('/api/aerovolt/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: currentInput,
            preferAi: true,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setCoreOutput(data.coreOutput);
          setPhysicsDetails(data.physicsDetails);
          setEngineName(data.engine === 'AEROVOLT_GEMINI_3_8_FLASH' ? 'Gemini 3.8 Flash' : 'AeroVolt Physics Core');

          // Log SCADA event
          addLogEntry(
            data.coreOutput.grid_stability_assessment.bess_command.mode === 'CURTAIL' ? 'WARN' : 'DISPATCH',
            'AEROVOLT_AI',
            `[${data.engine}] ${data.coreOutput.control_logs}`
          );
          setIsAnalyzing(false);
          return;
        }
      }

      // High-precision local physics calculation
      const { coreOutput: localOutput, physicsDetails: localPhysics } = calculateAeroVoltAnalytics(currentInput);
      setCoreOutput(localOutput);
      setPhysicsDetails(localPhysics);
      setEngineName('AeroVolt Physics Core');

      // Check for critical alerts
      const hasCritical = localOutput.asset_health_alerts.some((a) => a.risk_level === 'CRITICAL');
      if (hasCritical) {
        addLogEntry('CRITICAL', 'TURBINE_SUPERVISOR', 'Structural safety threshold breach flagged in Asset Diagnostics!');
      }

    } catch (err) {
      console.warn('Analysis execution error, falling back to local physics engine:', err);
      const { coreOutput: fallbackOut, physicsDetails: fallbackPhys } = calculateAeroVoltAnalytics(currentInput);
      setCoreOutput(fallbackOut);
      setPhysicsDetails(fallbackPhys);
      setEngineName('AeroVolt Physics Core');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const addLogEntry = (
    level: SCADALogEntry['level'],
    source: SCADALogEntry['source'],
    message: string
  ) => {
    const newEntry: SCADALogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 79)]);
  };

  // Real-time telemetry stream interval
  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      setInput((prev) => {
        // Natural atmospheric & grid load fluctuations
        const ghiDelta = (Math.random() - 0.5) * 12;
        const newGhi = Math.max(0, Math.min(1300, prev.environmental.ghi + ghiDelta));

        const windDelta = (Math.random() - 0.5) * 0.4;
        const newWind = Math.max(0, Math.min(32, prev.environmental.windSpeed + windDelta));

        const demandDelta = (Math.random() - 0.5) * 2.5;
        const newDemand = Math.max(50, Math.min(380, prev.grid.demandLoadMw + demandDelta));

        // Frequency fluctuates with balance
        const freqJitter = (Math.random() - 0.5) * 0.015;
        const newFreq = Math.max(49.6, Math.min(50.4, prev.grid.gridFrequencyHz + freqJitter));

        const updated: SystemTelemetryInput = {
          ...prev,
          environmental: {
            ...prev.environmental,
            ghi: Math.round(newGhi),
            windSpeed: parseFloat(newWind.toFixed(1)),
          },
          grid: {
            ...prev.grid,
            demandLoadMw: parseFloat(newDemand.toFixed(1)),
            gridFrequencyHz: parseFloat(newFreq.toFixed(3)),
          },
        };

        // Recalculate deterministic physics on each tick
        const { coreOutput: liveOutput, physicsDetails: livePhysics } = calculateAeroVoltAnalytics(updated);
        setCoreOutput(liveOutput);
        setPhysicsDetails(livePhysics);

        return updated;
      });
    }, streamIntervalMs);

    return () => clearInterval(timer);
  }, [isStreaming, streamIntervalMs]);

  // Handle Preset Selection
  const handleSelectScenario = (scenario: PresetScenario) => {
    setActiveScenarioId(scenario.id);
    setInput(scenario.input);
    runAnalytics(scenario.input, useAiEngine);
    addLogEntry('INFO', 'SCADA_BUS', `Injected scenario profile: "${scenario.title}"`);
  };

  // Manual Input Changes
  const handleInputChange = (newInput: SystemTelemetryInput) => {
    setInput(newInput);
    setActiveScenarioId(null);
    runAnalytics(newInput, false);
  };

  // Atmospheric Jitter Injection
  const handleInjectNoise = () => {
    setInput((prev) => {
      const noisy: SystemTelemetryInput = {
        ...prev,
        environmental: {
          ...prev.environmental,
          ghi: Math.round(Math.max(0, prev.environmental.ghi + (Math.random() * 40 - 20))),
          windSpeed: parseFloat(Math.max(0, prev.environmental.windSpeed + (Math.random() * 1.5 - 0.75)).toFixed(1)),
          ambientTemperature: parseFloat((prev.environmental.ambientTemperature + (Math.random() * 0.8 - 0.4)).toFixed(1)),
        },
        assets: {
          ...prev.assets,
          gearboxVibrationMmS: parseFloat(Math.max(0.2, prev.assets.gearboxVibrationMmS + (Math.random() * 0.2 - 0.1)).toFixed(2)),
        },
        grid: {
          ...prev.grid,
          gridFrequencyHz: parseFloat((prev.grid.gridFrequencyHz + (Math.random() * 0.03 - 0.015)).toFixed(3)),
          demandLoadMw: parseFloat((prev.grid.demandLoadMw + (Math.random() * 6 - 3)).toFixed(1)),
        },
      };
      runAnalytics(noisy, false);
      addLogEntry('INFO', 'SCADA_BUS', 'Simulated atmospheric perturbation injected across all sensors.');
      return noisy;
    });
  };

  const handleResetToDefaults = () => {
    handleSelectScenario(PRESET_SCENARIOS[4]); // Nominal
  };

  const criticalCount = coreOutput.asset_health_alerts.filter((a) => a.risk_level === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top SCADA Navigation & Status Ribbon */}
      <HeaderRibbon
        grid={input.grid}
        gridStatus={coreOutput.grid_stability_assessment.grid_status}
        bessCommand={coreOutput.grid_stability_assessment.bess_command}
        isStreaming={isStreaming}
        streamIntervalMs={streamIntervalMs}
        onToggleStreaming={() => setIsStreaming((prev) => !prev)}
        onStreamIntervalChange={setStreamIntervalMs}
        useAiEngine={useAiEngine}
        onToggleAiEngine={() => setUseAiEngine((prev) => !prev)}
        isAnalyzing={isAnalyzing}
        onRunAnalysis={() => runAnalytics(input, useAiEngine)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasApiKey={hasApiKey}
        criticalAlertCount={criticalCount}
      />

      {/* Preset Scenario Selector Bar */}
      <ScenarioBar
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
      />

      {/* Main Content Body */}
      <main className="flex-1 p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: SCADA Synoptic Dashboard (Primary View) */}
        {activeTab === 'scada' && (
          <div className="space-y-6">
            {/* Synoptic Power Flow & Substation Busbar Diagram */}
            <PowerFlowDiagram
              input={input}
              output={coreOutput}
              physics={physicsDetails}
            />

            {/* Yield Forecasting & Loss Models */}
            <YieldForecastPanel
              forecast={coreOutput.forecast_summary}
              physics={physicsDetails}
              input={input}
            />

            {/* Bottom Row: Asset Health + SCADA Terminal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <AssetHealthRadar
                alerts={coreOutput.asset_health_alerts}
                input={input}
              />
              <ScadaTerminal
                logs={logs}
                currentControlSummary={coreOutput.control_logs}
                onClearLogs={() => setLogs([])}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Telemetry Deck */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <TelemetryControlDeck
              input={input}
              onChangeInput={handleInputChange}
              onResetToDefaults={handleResetToDefaults}
              onInjectNoise={handleInjectNoise}
            />

            <PowerFlowDiagram
              input={input}
              output={coreOutput}
              physics={physicsDetails}
            />
          </div>
        )}

        {/* TAB 3: Asset Diagnostics & Anomaly Radar */}
        {activeTab === 'anomalies' && (
          <div className="space-y-6">
            <AssetHealthRadar
              alerts={coreOutput.asset_health_alerts}
              input={input}
            />

            <ScadaTerminal
              logs={logs}
              currentControlSummary={coreOutput.control_logs}
              onClearLogs={() => setLogs([])}
            />
          </div>
        )}

        {/* TAB 4: Core Output JSON & API Sandbox */}
        {activeTab === 'json' && (
          <div className="space-y-6">
            <JsonViewPanel
              output={coreOutput}
              input={input}
              engineName={engineName}
              onApplyCustomTelemetry={(customInput) => {
                setInput(customInput);
                setActiveScenarioId(null);
                runAnalytics(customInput, false);
                addLogEntry('DISPATCH', 'SCADA_BUS', 'Applied custom JSON telemetry payload to live registers.');
              }}
            />

            <ScadaTerminal
              logs={logs}
              currentControlSummary={coreOutput.control_logs}
              onClearLogs={() => setLogs([])}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-4 text-xs font-mono text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>AeroVolt-Core REMS &bull; IEC 61850-7-420 Smart Grid Interoperability Standard</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Active Engine: <strong className="text-slate-300">{engineName}</strong></span>
          <span>&bull;</span>
          <span>Confidence: <strong className="text-emerald-400">{(coreOutput.forecast_summary.confidence_score * 100).toFixed(0)}%</strong></span>
        </div>
      </footer>
    </div>
  );
}
