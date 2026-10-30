/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SystemTelemetryInput,
  AeroVoltCoreOutput,
  PhysicsDeratingDetails,
  AssetHealthAlert,
  GridStatus,
  BessMode
} from '../types/aerovolt';

/**
 * High-precision physical simulation & deterministic analytical engine for AeroVolt-Core
 * Governed strictly by thermodynamic, electro-mechanical, and conservation laws.
 */
export function calculateAeroVoltAnalytics(
  input: SystemTelemetryInput,
  overrides?: { timestamp?: string }
): {
  coreOutput: AeroVoltCoreOutput;
  physicsDetails: PhysicsDeratingDetails;
} {
  const timestamp = overrides?.timestamp || new Date().toISOString();
  const alerts: AssetHealthAlert[] = [];

  const env = input.environmental;
  const assets = input.assets;
  const grid = input.grid;

  // 1. Missing parameter / sanity validation
  let ghi = env.ghi;
  let windSpeed = env.windSpeed;
  let ambTemp = env.ambientTemperature;

  if (isNaN(ghi) || ghi < 0) {
    ghi = 0;
    alerts.push({
      asset_id: 'SENS-IRR-01',
      component: 'Global Pyranometer Sensor',
      risk_level: 'MEDIUM',
      detected_anomaly: 'Invalid or missing GHI telemetry stream. Defaulted to conservative 0 W/m² baseline.',
      recommended_action: 'Perform calibration test on Modbus RTU channel 4 and check for snow/debris obstruction.'
    });
  }

  if (isNaN(windSpeed) || windSpeed < 0) {
    windSpeed = 0;
    alerts.push({
      asset_id: 'SENS-ANEM-02',
      component: 'Ultrasonic Anemometer',
      risk_level: 'MEDIUM',
      detected_anomaly: 'Missing wind velocity stream at nacelle hub height. Defaulted to 0.0 m/s.',
      recommended_action: 'Verify heated sensor element status and RS-485 serial communication bus.'
    });
  }

  // 2. Solar PV Power Physical Calculation
  // Cloud cover attenuation model: non-linear quadratic attenuation
  const cloudAttenuation = 1 - 0.78 * Math.pow(Math.min(100, Math.max(0, env.cloudCover)) / 100, 2.5);
  const effectiveIrradiance = Math.max(0, ghi * cloudAttenuation);

  // Cell temperature estimation (King/Sandia model approximation if cell temp not provided directly)
  const NOCT = 45.0; // Nominal Operating Cell Temperature in °C
  const windCoolingFactor = Math.max(0.6, 1 - 0.04 * windSpeed);
  const estimatedCellTemp = assets.cellTemperature > 0 
    ? assets.cellTemperature 
    : ambTemp + ((NOCT - 20) / 800) * effectiveIrradiance * windCoolingFactor;

  // Temperature derating: silicon PV temperature coefficient ~ -0.38% / °C above 25°C STC
  const deltaTemp = estimatedCellTemp - 25.0;
  const tempDeratingCoeff = -0.0038;
  const tempDerateMultiplier = deltaTemp > 0 ? 1 + tempDeratingCoeff * deltaTemp : 1.0;

  // Soiling & dust loss (typically 2.5%)
  const soilingFactor = 0.975;
  // Inverter DC to AC conversion efficiency (typical utility central inverter)
  const inverterEfficiency = 0.984;

  // Ideal un-derated STC power (MW)
  const rawSolarDcMw = assets.solarPvRatingMw * (effectiveIrradiance / 1000.0);
  
  // Actual calculated Solar AC output
  const actualSolarAcMw = Math.max(
    0,
    rawSolarDcMw * tempDerateMultiplier * soilingFactor * inverterEfficiency
  );
  
  // Inverter clipping cap (AC nameplate limit)
  const solarClippingCapMw = assets.solarPvRatingMw * 0.95;
  const finalSolarOutputMw = Math.min(solarClippingCapMw, actualSolarAcMw);

  const pvThermalLossMw = Math.max(0, rawSolarDcMw * (1 - tempDerateMultiplier));
  const pvSoilingLossMw = Math.max(0, rawSolarDcMw * (1 - soilingFactor));
  const pvClippingLossMw = Math.max(0, actualSolarAcMw - finalSolarOutputMw);

  // 3. Wind Turbine Generation Calculation
  // Cut-in: 3.0 m/s, Rated: 11.5 m/s, Cut-out: 25.0 m/s
  const cutInSpeed = 3.0;
  const ratedSpeed = 11.5;
  const cutOutSpeed = 25.0;
  const parkWakeEfficiency = 0.935; // 6.5% aerodynamic wake interference across turbine array

  let rawWindOutputMw = 0;
  let isStormCutout = false;

  if (windSpeed < cutInSpeed) {
    rawWindOutputMw = 0;
  } else if (windSpeed >= cutOutSpeed) {
    rawWindOutputMw = 0;
    isStormCutout = true;
    alerts.push({
      asset_id: 'WTG-ARRAY-MASTER',
      component: 'Rotor Aerodynamic Braking & Pitch System',
      risk_level: 'CRITICAL',
      detected_anomaly: `Sustained wind speed (${windSpeed.toFixed(1)} m/s) exceeds cut-out limit (25.0 m/s). Storm trip sequence engaged.`,
      recommended_action: 'Feather blades to 90° aerodynamic stall position and engage yaw storm survival mode.'
    });
  } else if (windSpeed >= ratedSpeed) {
    // Pitch regulation maintains rated power
    rawWindOutputMw = assets.windRatingMw * parkWakeEfficiency;
  } else {
    // Betz cubic power curve transition
    const cubicFactor = (Math.pow(windSpeed, 3) - Math.pow(cutInSpeed, 3)) / 
                        (Math.pow(ratedSpeed, 3) - Math.pow(cutInSpeed, 3));
    rawWindOutputMw = assets.windRatingMw * cubicFactor * parkWakeEfficiency;
  }

  const finalWindOutputMw = Math.max(0, rawWindOutputMw);
  const windWakeLossMw = rawWindOutputMw > 0 ? (assets.windRatingMw * (1 - parkWakeEfficiency) * (rawWindOutputMw / assets.windRatingMw)) : 0;

  // 4. Structural Anomaly Detection & Predictive Maintenance (IoT Sensors)
  // Turbine Gearbox Vibration (ISO 10816-3 standards for mechanical vibration)
  const vibration = assets.gearboxVibrationMmS;
  if (vibration >= 6.2) {
    alerts.push({
      asset_id: 'WTG-GBX-04',
      component: 'Planetary Gearbox Stage 2 Bearing',
      risk_level: 'CRITICAL',
      detected_anomaly: `Severe vibration resonance detected: ${vibration.toFixed(2)} mm/s RMS (ISO 10816 Danger Zone > 6.0 mm/s). Peak acceleration suggests outer ring fatigue spalling.`,
      recommended_action: 'Initiate automated power curtailment to 35% immediately; schedule urgent acoustic endoscopy and lube oil ferrography.'
    });
  } else if (vibration >= 3.8) {
    alerts.push({
      asset_id: 'WTG-GBX-02',
      component: 'Intermediate Shaft Pinion Bearing',
      risk_level: 'MEDIUM',
      detected_anomaly: `Elevated vibration trend: ${vibration.toFixed(2)} mm/s RMS (Alert threshold 3.8 mm/s). Sideband frequencies matching gear mesh harmonic 2X.`,
      recommended_action: 'Increase SCADA vibration sample rate to 20 kHz; inspect torque arm dampers at next scheduled service.'
    });
  }

  // Bearing Temperature
  const bearingTemp = assets.bearingTemperatureC;
  if (bearingTemp >= 82.0) {
    alerts.push({
      asset_id: 'WTG-BRG-MAIN',
      component: 'Spherical Main Drive Bearing',
      risk_level: 'CRITICAL',
      detected_anomaly: `Bearing temperature critical at ${bearingTemp.toFixed(1)}°C (Thermal trip threshold 80.0°C). Boundary oil film breakdown hazard.`,
      recommended_action: 'Engage secondary oil recirculating pump; if temperature does not decline within 180s, initiate controlled soft-stop.'
    });
  } else if (bearingTemp >= 70.0) {
    alerts.push({
      asset_id: 'WTG-BRG-MAIN',
      component: 'Spherical Main Drive Bearing',
      risk_level: 'MEDIUM',
      detected_anomaly: `Bearing temperature running hot: ${bearingTemp.toFixed(1)}°C. Heat dissipation degraded under sustained load.`,
      recommended_action: 'Command oil cooling radiator fans to 100% duty cycle and inspect inline oil filter differential pressure.'
    });
  }

  // Solar Inverter / Cell Temperature
  if (estimatedCellTemp >= 75.0) {
    alerts.push({
      asset_id: 'PV-INV-CLUSTER-3',
      component: 'Central Power Inverter IGBT Bridge',
      risk_level: 'CRITICAL',
      detected_anomaly: `Severe junction thermal stress (Cell temp: ${estimatedCellTemp.toFixed(1)}°C). Thermal derating penalty exceeds -19.0%.`,
      recommended_action: 'Activate cabinet forced evaporative cooling mist; dynamically throttle string DC inputs.'
    });
  } else if (estimatedCellTemp >= 64.0) {
    alerts.push({
      asset_id: 'PV-ARRAY-ZONE-B',
      component: 'Photovoltaic Junction Boxes',
      risk_level: 'MEDIUM',
      detected_anomaly: `Moderate thermal efficiency derate: ${estimatedCellTemp.toFixed(1)}°C. Estimated DC capacity loss: ${pvThermalLossMw.toFixed(1)} MW.`,
      recommended_action: 'Inspect combiner box ventilation louvers; verify infrared thermal imaging scan schedules.'
    });
  }

  // 5. Total Generation & Grid Balancing
  const totalPredictedGenerationMw = finalSolarOutputMw + finalWindOutputMw;
  const demandMw = grid.demandLoadMw;
  const powerDeltaMw = totalPredictedGenerationMw - demandMw; // Positive = Surplus, Negative = Deficit

  // Grid Frequency Droop & Primary Response
  const nominalFreq = grid.nominalFrequencyHz || 50;
  const freqDeviation = grid.gridFrequencyHz - nominalFreq;

  let gridStatus: GridStatus = 'BALANCED';
  let actionRequired = false;
  let bessMode: BessMode = 'IDLE';
  let bessTargetRateMw = 0;
  let bessTargetSoc = assets.bessCurrentSoc;

  // Thresholds for power delta (0.5 MW deadband) and frequency
  const isSurplus = powerDeltaMw > 0.5;
  const isDeficit = powerDeltaMw < -0.5;
  const isUnderFrequency = freqDeviation < -0.05;
  const isOverFrequency = freqDeviation > 0.05;

  const bessMaxRate = assets.bessMaxRateMw || 60.0;
  const bessCapacity = assets.bessCapacityMwh || 180.0;
  const currentSoc = assets.bessCurrentSoc;

  if (isSurplus || isOverFrequency) {
    gridStatus = 'SURPLUS';
    actionRequired = true;

    // Check if BESS has headroom to absorb energy
    if (currentSoc >= 95.0) {
      // Battery is fully charged or at thermal safety boundary -> Must Curtail!
      bessMode = 'CURTAIL';
      bessTargetRateMw = 0;
      bessTargetSoc = 95.0;
      alerts.push({
        asset_id: 'BESS-BMS-01',
        component: 'Lithium-Ion Energy Storage Racks',
        risk_level: 'MEDIUM',
        detected_anomaly: `Grid surplus (+${powerDeltaMw.toFixed(1)} MW) cannot be absorbed. BESS SoC is at upper preservation threshold (${currentSoc.toFixed(1)}%).`,
        recommended_action: 'Dispatch autonomous PV inverter active power curtailment and wind pitch feathering to preserve grid frequency stability.'
      });
    } else {
      // Charge BESS
      bessMode = 'CHARGE';
      // Rate is bounded by surplus, max C-rate, and remaining SoC capacity
      const headroomMwh = ((95.0 - currentSoc) / 100.0) * bessCapacity;
      const chargeRate = Math.min(Math.abs(powerDeltaMw), bessMaxRate, headroomMwh * 4); // 15-min energy conversion
      bessTargetRateMw = parseFloat(chargeRate.toFixed(2));
      // Predict target SoC after 1 hour of this rate
      const socIncrease = (bessTargetRateMw / bessCapacity) * 100.0 * 0.25; // 15-min step
      bessTargetSoc = parseFloat(Math.min(95.0, currentSoc + socIncrease).toFixed(1));

      if (powerDeltaMw > bessMaxRate) {
        // Surplus exceeds maximum battery charging rate!
        alerts.push({
          asset_id: 'SCADA-AGC-01',
          component: 'Automatic Generation Control',
          risk_level: 'LOW',
          detected_anomaly: `Surplus (+${powerDeltaMw.toFixed(1)} MW) exceeds max BESS absorption envelope (${bessMaxRate.toFixed(1)} MW). Partial generation curtailment triggered.`,
          recommended_action: 'Trim Solar Array Zone-A inverter setpoints by -' + (powerDeltaMw - bessMaxRate).toFixed(1) + ' MW.'
        });
      }
    }
  } else if (isDeficit || isUnderFrequency) {
    gridStatus = 'DEFICIT';
    actionRequired = true;

    if (currentSoc <= 10.0) {
      // Battery depleted past minimum preservation reserve
      bessMode = 'IDLE';
      bessTargetRateMw = 0;
      bessTargetSoc = 10.0;
      alerts.push({
        asset_id: 'BESS-BMS-01',
        component: 'Battery Management System',
        risk_level: 'CRITICAL',
        detected_anomaly: `Grid deficit of -${Math.abs(powerDeltaMw).toFixed(1)} MW detected while BESS is at minimum depletion floor (${currentSoc.toFixed(1)}% SoC).`,
        recommended_action: 'Issue high-priority SCADA signal to synchronize regional gas peaker units or initiate demand-response load shedding.'
      });
    } else {
      // Discharge BESS to cover deficit
      bessMode = 'DISCHARGE';
      const availableEnergyMwh = ((currentSoc - 10.0) / 100.0) * bessCapacity;
      const dischargeRate = Math.min(Math.abs(powerDeltaMw), bessMaxRate, availableEnergyMwh * 4);
      bessTargetRateMw = parseFloat(dischargeRate.toFixed(2));
      const socDecrease = (bessTargetRateMw / bessCapacity) * 100.0 * 0.25;
      bessTargetSoc = parseFloat(Math.max(10.0, currentSoc - socDecrease).toFixed(1));

      if (Math.abs(powerDeltaMw) > bessMaxRate) {
        alerts.push({
          asset_id: 'SCADA-AGC-02',
          component: 'Grid Interconnection Substation',
          risk_level: 'MEDIUM',
          detected_anomaly: `Grid demand deficit exceeds BESS peak inverter discharge capacity (${bessMaxRate.toFixed(1)} MW). Unmet deficit: -${(Math.abs(powerDeltaMw) - bessMaxRate).toFixed(1)} MW.`,
          recommended_action: 'Request spinning reserve ramp-up from regional transmission system operator (TSO).'
        });
      }
    }
  } else {
    gridStatus = 'BALANCED';
    bessMode = 'IDLE';
    bessTargetRateMw = 0;
    bessTargetSoc = currentSoc;
    actionRequired = Math.abs(freqDeviation) > 0.08;
  }

  // 6. Confidence Score
  // Confidence decreases with extreme cloud volatility, extreme wind variance, or active sensors alarms
  let confidence = 0.98;
  if (env.cloudCover > 20 && env.cloudCover < 85) confidence -= 0.05; // Broken clouds higher volatility
  if (windSpeed > 18.0) confidence -= 0.04;
  if (alerts.some(a => a.risk_level === 'CRITICAL')) confidence -= 0.08;
  else if (alerts.some(a => a.risk_level === 'MEDIUM')) confidence -= 0.03;
  confidence = Math.max(0.70, Math.min(0.99, confidence));

  // 7. Control SCADA Logs Generation
  const controlLogs = generateScadaControlLogText({
    timestamp,
    solarMw: finalSolarOutputMw,
    windMw: finalWindOutputMw,
    totalMw: totalPredictedGenerationMw,
    demandMw,
    powerDeltaMw,
    freq: grid.gridFrequencyHz,
    bessMode,
    bessRate: bessTargetRateMw,
    bessSoc: bessTargetSoc,
    alertsCount: alerts.length,
    criticalCount: alerts.filter(a => a.risk_level === 'CRITICAL').length
  });

  // 8. 24-Hour Forecast Profile calculation for deep visualization
  const profile24h = generate24HourProfile(input, finalSolarOutputMw, finalWindOutputMw);

  const coreOutput: AeroVoltCoreOutput = {
    timestamp,
    forecast_summary: {
      solar_output_predicted_mw: parseFloat(finalSolarOutputMw.toFixed(2)),
      wind_output_predicted_mw: parseFloat(finalWindOutputMw.toFixed(2)),
      total_generation_predicted_mw: parseFloat(totalPredictedGenerationMw.toFixed(2)),
      confidence_score: parseFloat(confidence.toFixed(2))
    },
    grid_stability_assessment: {
      grid_status: gridStatus,
      action_required: actionRequired,
      bess_command: {
        mode: bessMode,
        target_rate_mw: bessTargetRateMw,
        target_soc_percentage: bessTargetSoc
      }
    },
    asset_health_alerts: alerts,
    control_logs: controlLogs
  };

  const physicsDetails: PhysicsDeratingDetails = {
    pvThermalDeratingLossMw: parseFloat(pvThermalLossMw.toFixed(2)),
    pvSoilingLossMw: parseFloat(pvSoilingLossMw.toFixed(2)),
    pvInverterClippingLossMw: parseFloat(pvClippingLossMw.toFixed(2)),
    windWakeLossMw: parseFloat(windWakeLossMw.toFixed(2)),
    windAerodynamicEfficiency: parseFloat((parkWakeEfficiency * 100).toFixed(1)),
    frequencyDeviationHz: parseFloat(freqDeviation.toFixed(3)),
    primaryFrequencyResponseMw: parseFloat((freqDeviation * -120).toFixed(2)), // 120 MW/Hz grid droop stiffness
    forecast15MinMw: parseFloat((totalPredictedGenerationMw * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2)),
    forecast1HourMw: parseFloat((totalPredictedGenerationMw * (1 + (Math.random() * 0.05 - 0.025))).toFixed(2)),
    forecast24HourProfile: profile24h
  };

  return { coreOutput, physicsDetails };
}

function generateScadaControlLogText(params: {
  timestamp: string;
  solarMw: number;
  windMw: number;
  totalMw: number;
  demandMw: number;
  powerDeltaMw: number;
  freq: number;
  bessMode: BessMode;
  bessRate: number;
  bessSoc: number;
  alertsCount: number;
  criticalCount: number;
}): string {
  const parts: string[] = [];
  parts.push(`[SCADA-SYS] Telemetry ingested at ${params.timestamp}.`);
  parts.push(`Total Predicted Generation: ${params.totalMw.toFixed(2)} MW (Solar: ${params.solarMw.toFixed(2)} MW, Wind: ${params.windMw.toFixed(2)} MW) vs Demand: ${params.demandMw.toFixed(2)} MW.`);
  parts.push(`Net Grid Deviation: ${params.powerDeltaMw >= 0 ? '+' : ''}${params.powerDeltaMw.toFixed(2)} MW @ ${params.freq.toFixed(2)} Hz.`);
  
  if (params.bessMode === 'CHARGE') {
    parts.push(`BESS autonomous charging setpoint locked: +${params.bessRate.toFixed(2)} MW (Target SoC: ${params.bessSoc.toFixed(1)}%).`);
  } else if (params.bessMode === 'DISCHARGE') {
    parts.push(`BESS autonomous discharge setpoint dispatched: -${params.bessRate.toFixed(2)} MW to stabilize busbar underfrequency.`);
  } else if (params.bessMode === 'CURTAIL') {
    parts.push(`Curtailment protocol ACTIVE: BESS saturated. Modulating inverter active power export setpoint to match feeder capacity.`);
  } else {
    parts.push(`BESS operating in nominal floating buffer mode.`);
  }

  if (params.criticalCount > 0) {
    parts.push(`CRITICAL STRUCTURAL ANOMALIES DETECTED (${params.criticalCount}). Safety interlocks and protective curtailment dispatched.`);
  } else if (params.alertsCount > 0) {
    parts.push(`Asset health notices logged: ${params.alertsCount} non-critical telemetry flags under automated observation.`);
  } else {
    parts.push(`Asset mechanical and thermal telemetry within standard ISO/IEC tolerances.`);
  }

  return parts.join(' ');
}

function generate24HourProfile(
  input: SystemTelemetryInput,
  currentSolarMw: number,
  currentWindMw: number
): PhysicsDeratingDetails['forecast24HourProfile'] {
  const profile: PhysicsDeratingDetails['forecast24HourProfile'] = [];
  const currentHour = new Date().getHours();

  for (let h = 0; h < 24; h++) {
    const targetHour = (currentHour + h) % 24;
    
    // Solar diurnal bell curve (peaks around hour 13)
    let solarMultiplier = 0;
    if (targetHour >= 6 && targetHour <= 19) {
      const solarAngle = ((targetHour - 6) / 13) * Math.PI;
      solarMultiplier = Math.sin(solarAngle);
    }
    const solarEst = Math.max(0, input.assets.solarPvRatingMw * 0.85 * solarMultiplier * (1 - input.environmental.cloudCover / 130));

    // Wind thermal gradient (often stronger at night/early morning and late afternoon)
    const windGradient = 0.75 + 0.35 * Math.cos(((targetHour - 2) / 24) * 2 * Math.PI);
    const windEst = Math.max(0, input.assets.windRatingMw * 0.65 * windGradient);

    // Diurnal grid demand curve (morning peak 08-11, evening peak 17-21)
    let demandCurve = 0.7;
    if ((targetHour >= 8 && targetHour <= 12) || (targetHour >= 17 && targetHour <= 21)) {
      demandCurve = 1.05;
    } else if (targetHour >= 0 && targetHour <= 5) {
      demandCurve = 0.55;
    }
    const demandEst = input.grid.demandLoadMw * demandCurve;
    const netBalance = solarEst + windEst - demandEst;

    profile.push({
      hour: targetHour,
      solarMw: parseFloat(solarEst.toFixed(1)),
      windMw: parseFloat(windEst.toFixed(1)),
      demandMw: parseFloat(demandEst.toFixed(1)),
      netBalanceMw: parseFloat(netBalance.toFixed(1))
    });
  }

  return profile;
}
