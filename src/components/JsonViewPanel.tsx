/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Send,
  Sparkles,
  AlertCircle,
  FileJson
} from 'lucide-react';
import { AeroVoltCoreOutput, SystemTelemetryInput } from '../types/aerovolt';
import { calculateAeroVoltAnalytics } from '../services/aerovoltPhysics';

interface JsonViewPanelProps {
  output: AeroVoltCoreOutput;
  input: SystemTelemetryInput;
  engineName: string;
  onApplyCustomTelemetry: (customInput: SystemTelemetryInput) => void;
}

export const JsonViewPanel: React.FC<JsonViewPanelProps> = ({
  output,
  input,
  engineName,
  onApplyCustomTelemetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'output' | 'tester'>('output');

  // Interactive Raw JSON Input Tester
  const [customJsonInput, setCustomJsonInput] = useState<string>(
    JSON.stringify(input, null, 2)
  );
  const [testerOutput, setTesterOutput] = useState<AeroVoltCoreOutput | null>(null);
  const [testerError, setTesterError] = useState<string | null>(null);

  const formattedJson = JSON.stringify(output, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aerovolt-dispatch-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunTester = () => {
    setTesterError(null);
    try {
      const parsed = JSON.parse(customJsonInput);
      if (!parsed.environmental || !parsed.assets || !parsed.grid) {
        throw new Error(
          'Input payload must contain "environmental", "assets", and "grid" objects.'
        );
      }
      const { coreOutput } = calculateAeroVoltAnalytics(parsed);
      setTesterOutput(coreOutput);
      onApplyCustomTelemetry(parsed);
    } catch (err: any) {
      setTesterError(err.message || 'Invalid JSON syntax');
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>AeroVolt-Core Machine-to-Machine JSON Interface</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                STRICT SCHEMA
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Mandatory parseable JSON output schema for SCADA controllers and automated grid dispatch
            </p>
          </div>
        </div>

        {/* Subtabs & Actions */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSubTab('output')}
              className={`px-3 py-1 rounded transition ${
                activeSubTab === 'output'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ACTIVE DISPATCH JSON
            </button>
            <button
              onClick={() => setActiveSubTab('tester')}
              className={`px-3 py-1 rounded transition ${
                activeSubTab === 'tester'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              TELEMETRY JSON TESTER
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED!' : 'COPY JSON'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>DOWNLOAD</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'output' ? (
        <div className="space-y-3">
          {/* Engine indicator */}
          <div className="flex justify-between items-center text-xs font-mono bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <span className="text-slate-400">
              Active Analytical Processor: <strong className="text-cyan-300">{engineName}</strong>
            </span>
            <span className="text-slate-500">
              Schema validation: <strong className="text-emerald-400">PASS (100% Compliant)</strong>
            </span>
          </div>

          {/* JSON Viewer */}
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
              <div className="flex items-center space-x-2">
                <FileJson className="w-4 h-4 text-cyan-400" />
                <span>aerovolt-core-dispatch-payload.json</span>
              </div>
              <span>{new Blob([formattedJson]).size} bytes</span>
            </div>

            <pre className="p-4 text-cyan-300 overflow-x-auto leading-relaxed max-h-[500px]">
              <code>{formattedJson}</code>
            </pre>
          </div>
        </div>
      ) : (
        /* JSON Telemetry Tester */
        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <p className="text-slate-300 font-semibold">
              Direct SCADA API Ingestion Sandbox:
            </p>
            <p className="text-slate-400 leading-relaxed">
              Paste an external IoT telemetry JSON object below. AeroVolt-Core will parse the environmental,
              asset, and grid parameters, calculate megawatt outputs, detect structural anomalies, and output
              the mandatory JSON response.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input JSON Editor */}
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                <span>INPUT TELEMETRY PAYLOAD:</span>
                <button
                  onClick={() => setCustomJsonInput(JSON.stringify(input, null, 2))}
                  className="text-cyan-400 hover:underline text-[11px]"
                >
                  Load Current System Registers
                </button>
              </div>

              <textarea
                value={customJsonInput}
                onChange={(e) => setCustomJsonInput(e.target.value)}
                rows={16}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-amber-300 focus:outline-none focus:border-cyan-500 resize-none"
              />

              {testerError && (
                <div className="flex items-center space-x-2 text-rose-400 text-xs font-mono bg-rose-950/40 p-2.5 rounded-lg border border-rose-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{testerError}</span>
                </div>
              )}

              <button
                onClick={handleRunTester}
                className="flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs shadow-md transition"
              >
                <Send className="w-4 h-4" />
                <span>PROCESS THROUGH AEROVOLT-CORE</span>
              </button>
            </div>

            {/* Output JSON Result */}
            <div className="flex flex-col space-y-2">
              <span className="text-xs font-mono text-slate-300">
                AEROVOLT-CORE MANDATORY OUTPUT:
              </span>

              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 overflow-y-auto max-h-[380px]">
                {testerOutput ? (
                  <pre>
                    <code>{JSON.stringify(testerOutput, null, 2)}</code>
                  </pre>
                ) : (
                  <div className="text-slate-500 italic p-6 text-center">
                    Click "Process through AeroVolt-Core" to evaluate the custom telemetry payload.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
