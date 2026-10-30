/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateAeroVoltAnalytics } from './src/services/aerovoltPhysics.ts';
import { SystemTelemetryInput, AeroVoltCoreOutput } from './src/types/aerovolt.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize server-side Gemini client
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `You are "AeroVolt-Core," an enterprise-grade AI analytics engine built for Renewable Energy Management Systems (REMS) and Smart Grid Controllers. Your task is to process real-time weather streams, sensor telemetry (IoT), and electrical grid status to calculate energy yield predictions, detect structural anomalies, and trigger autonomous grid actions.

You do NOT act as a standard consumer weather assistant. You do NOT reply with vague statements like "It is sunny." Every prediction must translate environmental metrics directly into active megawatt (MW) capacity, physical device strain, and automated grid commands.

PHYSICAL CALCULATIONS & CONSTRAINTS:
1. Solar PV Output (MW):
   - Derate for cloud cover and ambient/cell temperature (standard -0.38%/°C above 25°C STC). Account for soiling and inverter clipping.
2. Wind Turbine Generation (MW):
   - Model cut-in (3 m/s), rated (11.5 m/s), cut-out (25 m/s). Account for array wake losses. If wind >= 25 m/s, turbine must trip for storm safety.
3. Grid Balancing & BESS Dispatch:
   - Compare Total Generation (Solar + Wind) with Demand Load (MW).
   - If Generation > Demand: grid_status is SURPLUS. Command BESS to CHARGE up to max 95% SoC. If SoC >= 95%, mode is CURTAIL.
   - If Demand > Generation: grid_status is DEFICIT. Command BESS to DISCHARGE down to min 10% SoC. If SoC <= 10%, mode is IDLE and trigger backup peakers.
   - If balanced (within 0.5 MW): grid_status is BALANCED.
4. Anomaly Detection:
   - Gearbox vibration: >6.0 mm/s RMS is CRITICAL (ISO 10816). 3.8-6.0 mm/s is MEDIUM.
   - Bearing temp: >80°C is CRITICAL. 68-80°C is MEDIUM.
   - Cell temp: >75°C is CRITICAL.
   - Missing data: default to conservative safety estimates and flag in asset_health_alerts.

MANDATORY OUTPUT FORMAT:
You must strictly respond with a valid, parseable JSON object matching the schema. No introductory text or conversational markdown.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    timestamp: { type: Type.STRING, description: 'ISO 8601 Timestamp' },
    forecast_summary: {
      type: Type.OBJECT,
      properties: {
        solar_output_predicted_mw: { type: Type.NUMBER },
        wind_output_predicted_mw: { type: Type.NUMBER },
        total_generation_predicted_mw: { type: Type.NUMBER },
        confidence_score: { type: Type.NUMBER },
      },
      required: [
        'solar_output_predicted_mw',
        'wind_output_predicted_mw',
        'total_generation_predicted_mw',
        'confidence_score',
      ],
    },
    grid_stability_assessment: {
      type: Type.OBJECT,
      properties: {
        grid_status: { type: Type.STRING, description: 'BALANCED | DEFICIT | SURPLUS' },
        action_required: { type: Type.BOOLEAN },
        bess_command: {
          type: Type.OBJECT,
          properties: {
            mode: { type: Type.STRING, description: 'CHARGE | DISCHARGE | IDLE | CURTAIL' },
            target_rate_mw: { type: Type.NUMBER },
            target_soc_percentage: { type: Type.NUMBER },
          },
          required: ['mode', 'target_rate_mw', 'target_soc_percentage'],
        },
      },
      required: ['grid_status', 'action_required', 'bess_command'],
    },
    asset_health_alerts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          asset_id: { type: Type.STRING },
          component: { type: Type.STRING },
          risk_level: { type: Type.STRING, description: 'LOW | MEDIUM | CRITICAL' },
          detected_anomaly: { type: Type.STRING },
          recommended_action: { type: Type.STRING },
        },
        required: [
          'asset_id',
          'component',
          'risk_level',
          'detected_anomaly',
          'recommended_action',
        ],
      },
    },
    control_logs: {
      type: Type.STRING,
      description: 'Brief technical summary for SCADA system logs',
    },
  },
  required: [
    'timestamp',
    'forecast_summary',
    'grid_stability_assessment',
    'asset_health_alerts',
    'control_logs',
  ],
};

// API: Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'AeroVolt-Core REMS & Smart Grid Controller',
    hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// API: AeroVolt Analysis
app.post('/api/aerovolt/analyze', async (req: Request, res: Response) => {
  try {
    const input: SystemTelemetryInput = req.body.input;
    const preferAi: boolean = req.body.preferAi ?? false;

    if (!input || !input.environmental || !input.assets || !input.grid) {
      return res.status(400).json({
        error: 'Invalid telemetry structure. Requires environmental, assets, and grid objects.',
      });
    }

    // High precision physical calculation baseline
    const deterministic = calculateAeroVoltAnalytics(input);

    // If AI is requested and GEMINI_API_KEY is available, run Gemini 3.8 Flash
    if (preferAi && genAI) {
      try {
        const prompt = `Process the following live SCADA and weather telemetry stream for AeroVolt-Core:
${JSON.stringify(input, null, 2)}

Calculate predicted generation MW, grid stability assessment with BESS dispatch commands, structural anomaly alerts, and SCADA control logs.`;

        const geminiResponse = await genAI.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
          },
        });

        const rawText = geminiResponse.text?.trim() || '{}';
        const aiOutput: AeroVoltCoreOutput = JSON.parse(rawText);

        return res.json({
          engine: 'AEROVOLT_GEMINI_3_8_FLASH',
          coreOutput: aiOutput,
          physicsDetails: deterministic.physicsDetails,
        });
      } catch (aiErr) {
        console.warn('Gemini inference fallback to high-fidelity physics model:', aiErr);
        // Fallback directly to deterministic physics model
        return res.json({
          engine: 'AEROVOLT_PHYSICS_FALLBACK',
          coreOutput: deterministic.coreOutput,
          physicsDetails: deterministic.physicsDetails,
          warning: 'Gemini API call timed out or failed; used verified deterministic physics engine.',
        });
      }
    }

    // Default fast deterministic physics response
    return res.json({
      engine: 'AEROVOLT_PHYSICS_CORE',
      coreOutput: deterministic.coreOutput,
      physicsDetails: deterministic.physicsDetails,
    });
  } catch (err: any) {
    console.error('Error in /api/aerovolt/analyze:', err);
    return res.status(500).json({ error: err.message || 'Internal processing error' });
  }
});

// API: Direct SCADA endpoint returning strictly the prompt's mandated JSON format
app.post('/api/aerovolt/scada-raw', async (req: Request, res: Response) => {
  try {
    const telemetry = req.body;
    let input: SystemTelemetryInput;

    // Support both nested and flat inputs
    if (telemetry.environmental && telemetry.assets && telemetry.grid) {
      input = telemetry;
    } else {
      input = {
        environmental: {
          ghi: Number(telemetry.ghi ?? 850),
          dni: Number(telemetry.dni ?? 750),
          windSpeed: Number(telemetry.windSpeed ?? telemetry.wind_speed ?? 10.5),
          windDirection: Number(telemetry.windDirection ?? telemetry.wind_direction ?? 180),
          ambientTemperature: Number(telemetry.ambientTemperature ?? telemetry.ambient_temp ?? 25),
          cloudCover: Number(telemetry.cloudCover ?? telemetry.cloud_cover ?? 10),
        },
        assets: {
          solarPvRatingMw: Number(telemetry.solarPvRatingMw ?? telemetry.pv_rating_mw ?? 150),
          cellTemperature: Number(telemetry.cellTemperature ?? telemetry.cell_temp ?? 42),
          windRatingMw: Number(telemetry.windRatingMw ?? telemetry.wind_rating_mw ?? 160),
          windTurbineCount: Number(telemetry.windTurbineCount ?? 50),
          hubHeightM: Number(telemetry.hubHeightM ?? 115),
          gearboxVibrationMmS: Number(telemetry.gearboxVibrationMmS ?? telemetry.gearbox_vibration ?? 2.2),
          bearingTemperatureC: Number(telemetry.bearingTemperatureC ?? telemetry.bearing_temp ?? 55),
          bessCapacityMwh: Number(telemetry.bessCapacityMwh ?? telemetry.bess_capacity ?? 200),
          bessCurrentSoc: Number(telemetry.bessCurrentSoc ?? telemetry.bess_soc ?? 60),
          bessMaxRateMw: Number(telemetry.bessMaxRateMw ?? 80),
        },
        grid: {
          gridFrequencyHz: Number(telemetry.gridFrequencyHz ?? telemetry.grid_frequency ?? 50.0),
          nominalFrequencyHz: (telemetry.nominalFrequencyHz === 60 ? 60 : 50),
          demandLoadMw: Number(telemetry.demandLoadMw ?? telemetry.demand_load ?? 180),
        },
      };
    }

    const { coreOutput } = calculateAeroVoltAnalytics(input);
    // Return strictly the mandatory JSON format
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(coreOutput, null, 2));
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// Production / Dev Vite server setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev, attach Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`[AeroVolt-Core] SCADA engine online at http://localhost:${PORT}`);
  });
}

startServer();
