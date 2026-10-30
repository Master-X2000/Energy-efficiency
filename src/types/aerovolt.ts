/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EnvironmentalTelemetry {
  ghi: number; // Global Horizontal Irradiance in W/m² (0 - 1400)
  dni: number; // Direct Normal Irradiance in W/m² (0 - 1100)
  windSpeed: number; // Wind speed at hub height in m/s (0 - 35)
  windDirection: number; // Wind direction in degrees (0 - 360)
  ambientTemperature: number; // Ambient temperature in °C (-30 to 55)
  cloudCover: number; // Cloud cover percentage (0 - 100%)
}

export interface AssetSpecifications {
  solarPvRatingMw: number; // Solar PV nameplate capacity in MW
  pvSurfaceAreaM2?: number; // Solar array surface area in m²
  cellTemperature: number; // PV module cell temperature in °C
  windRatingMw: number; // Wind park rated capacity in MW
  windTurbineCount: number; // Number of operational turbines
  hubHeightM: number; // Hub height in meters
  gearboxVibrationMmS: number; // Turbine gearbox vibration RMS in mm/s
  bearingTemperatureC: number; // Turbine main bearing temperature in °C
  bessCapacityMwh: number; // Battery storage capacity in MWh
  bessCurrentSoc: number; // Current state of charge in % (0 - 100)
  bessMaxRateMw: number; // Maximum charge/discharge C-rate in MW
}

export interface GridStatusTelemetry {
  gridFrequencyHz: number; // Live grid frequency in Hz (e.g. 50.00 or 60.00)
  nominalFrequencyHz: 50 | 60; // Nominal target frequency standard
  demandLoadMw: number; // Current local grid demand load in MW
}

export interface SystemTelemetryInput {
  environmental: EnvironmentalTelemetry;
  assets: AssetSpecifications;
  grid: GridStatusTelemetry;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'CRITICAL';
export type GridStatus = 'BALANCED' | 'DEFICIT' | 'SURPLUS';
export type BessMode = 'CHARGE' | 'DISCHARGE' | 'IDLE' | 'CURTAIL';

export interface AssetHealthAlert {
  asset_id: string;
  component: string;
  risk_level: RiskLevel;
  detected_anomaly: string;
  recommended_action: string;
}

export interface BessCommand {
  mode: BessMode;
  target_rate_mw: number;
  target_soc_percentage: number;
}

export interface ForecastSummary {
  solar_output_predicted_mw: number;
  wind_output_predicted_mw: number;
  total_generation_predicted_mw: number;
  confidence_score: number;
}

export interface GridStabilityAssessment {
  grid_status: GridStatus;
  action_required: boolean;
  bess_command: BessCommand;
}

/**
 * MANDATORY AEROVOLT-CORE OUTPUT STRUCTURE
 * Matches user's exact specification
 */
export interface AeroVoltCoreOutput {
  timestamp: string; // ISO 8601 Timestamp
  forecast_summary: ForecastSummary;
  grid_stability_assessment: GridStabilityAssessment;
  asset_health_alerts: AssetHealthAlert[];
  control_logs: string;
}

/**
 * Extended physics metadata for high-fidelity visualization
 */
export interface PhysicsDeratingDetails {
  pvThermalDeratingLossMw: number;
  pvSoilingLossMw: number;
  pvInverterClippingLossMw: number;
  windWakeLossMw: number;
  windAerodynamicEfficiency: number;
  frequencyDeviationHz: number;
  primaryFrequencyResponseMw: number;
  forecast15MinMw: number;
  forecast1HourMw: number;
  forecast24HourProfile: Array<{
    hour: number;
    solarMw: number;
    windMw: number;
    demandMw: number;
    netBalanceMw: number;
  }>;
}

export interface SCADALogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'DISPATCH' | 'WARN' | 'CRITICAL' | 'ALARM';
  source: 'SCADA_BUS' | 'BESS_CONTROLLER' | 'AEROVOLT_AI' | 'INVERTER_GRID' | 'TURBINE_SUPERVISOR';
  message: string;
}

export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  category: 'SURPLUS' | 'CRITICAL' | 'DEFICIT' | 'THERMAL' | 'NOMINAL';
  input: SystemTelemetryInput;
  description: string;
}
