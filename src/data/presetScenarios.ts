/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresetScenario } from '../types/aerovolt';

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'solar-curtailment',
    title: 'Solar Flare Peak & BESS Saturated Curtailment',
    subtitle: 'Overgeneration event with BESS at 96% SoC requiring active inverter power curtailment',
    category: 'SURPLUS',
    description: 'Midday peak irradiance (1,060 W/m²) combined with low regional demand (145 MW). With BESS at 96% SoC, storage headroom is zero, triggering mandatory active curtailment to prevent substation busbar overvoltage.',
    input: {
      environmental: {
        ghi: 1060,
        dni: 940,
        windSpeed: 8.4,
        windDirection: 215,
        ambientTemperature: 36.5,
        cloudCover: 3
      },
      assets: {
        solarPvRatingMw: 160.0,
        pvSurfaceAreaM2: 780000,
        cellTemperature: 58.0,
        windRatingMw: 140.0,
        windTurbineCount: 46,
        hubHeightM: 115,
        gearboxVibrationMmS: 2.1,
        bearingTemperatureC: 56.0,
        bessCapacityMwh: 220.0,
        bessCurrentSoc: 96.0,
        bessMaxRateMw: 90.0
      },
      grid: {
        gridFrequencyHz: 50.12,
        nominalFrequencyHz: 50,
        demandLoadMw: 145.0
      }
    }
  },
  {
    id: 'gale-gearbox-critical',
    title: 'Gale Wind Shear & Gearbox Vibration Spike',
    subtitle: 'High wind velocity (23.2 m/s) with ISO 10816 Class IV structural vibration anomaly',
    category: 'CRITICAL',
    description: 'Turbine WTG-04 telemetry exhibits planetary gearbox vibration spikes of 7.45 mm/s RMS and bearing temperatures of 84.8°C under gale gust conditions. AeroVolt-Core commands emergency derating to 35% and schedules endoscopic maintenance.',
    input: {
      environmental: {
        ghi: 240,
        dni: 180,
        windSpeed: 23.2,
        windDirection: 285,
        ambientTemperature: 14.0,
        cloudCover: 88
      },
      assets: {
        solarPvRatingMw: 160.0,
        pvSurfaceAreaM2: 780000,
        cellTemperature: 19.5,
        windRatingMw: 180.0,
        windTurbineCount: 60,
        hubHeightM: 120,
        gearboxVibrationMmS: 7.45,
        bearingTemperatureC: 84.8,
        bessCapacityMwh: 200.0,
        bessCurrentSoc: 62.0,
        bessMaxRateMw: 80.0
      },
      grid: {
        gridFrequencyHz: 50.04,
        nominalFrequencyHz: 50,
        demandLoadMw: 195.0
      }
    }
  },
  {
    id: 'dusk-peak-deficit',
    title: 'Dusk Demand Spike & Underfrequency Deficit',
    subtitle: 'Solar ramp-down coincident with regional industrial peak load (310 MW)',
    category: 'DEFICIT',
    description: 'Sunset irradiance drop to 35 W/m² alongside low wind velocity (4.1 m/s) creates an acute -240 MW generation deficit. Grid frequency plunges to 49.81 Hz, commanding maximum BESS four-quadrant fast discharge (80 MW) and spinning reserve sync.',
    input: {
      environmental: {
        ghi: 35,
        dni: 10,
        windSpeed: 4.1,
        windDirection: 140,
        ambientTemperature: 21.0,
        cloudCover: 45
      },
      assets: {
        solarPvRatingMw: 160.0,
        pvSurfaceAreaM2: 780000,
        cellTemperature: 22.0,
        windRatingMw: 180.0,
        windTurbineCount: 60,
        hubHeightM: 120,
        gearboxVibrationMmS: 1.6,
        bearingTemperatureC: 48.0,
        bessCapacityMwh: 200.0,
        bessCurrentSoc: 74.0,
        bessMaxRateMw: 80.0
      },
      grid: {
        gridFrequencyHz: 49.81,
        nominalFrequencyHz: 50,
        demandLoadMw: 310.0
      }
    }
  },
  {
    id: 'thermal-inverter-derate',
    title: 'Extreme Heatwave & Inverter Thermal Derating',
    subtitle: 'Ambient 47.5°C driving cell junction temperatures to 76.5°C with severe efficiency loss',
    category: 'THERMAL',
    description: 'Desert ambient heatwave induces severe silicon photovoltaic derating (-19.6% power loss) and flags critical IGBT bridge junction thermal alarms on central inverter cluster PV-INV-03.',
    input: {
      environmental: {
        ghi: 980,
        dni: 890,
        windSpeed: 3.2,
        windDirection: 190,
        ambientTemperature: 47.5,
        cloudCover: 0
      },
      assets: {
        solarPvRatingMw: 180.0,
        pvSurfaceAreaM2: 850000,
        cellTemperature: 76.5,
        windRatingMw: 120.0,
        windTurbineCount: 40,
        hubHeightM: 110,
        gearboxVibrationMmS: 2.4,
        bearingTemperatureC: 69.2,
        bessCapacityMwh: 240.0,
        bessCurrentSoc: 48.0,
        bessMaxRateMw: 90.0
      },
      grid: {
        gridFrequencyHz: 49.96,
        nominalFrequencyHz: 50,
        demandLoadMw: 210.0
      }
    }
  },
  {
    id: 'balanced-nominal',
    title: 'Nominal Baseload & Stable Grid Operation',
    subtitle: 'Balanced renewable generation meeting 200 MW scheduled dispatch curve',
    category: 'NOMINAL',
    description: 'Ideal meteorological conditions (GHI 780 W/m², wind 9.8 m/s) with total predicted output (198.5 MW) perfectly tracking demand (200 MW). Frequency steady at 50.00 Hz; BESS in floating buffer mode.',
    input: {
      environmental: {
        ghi: 780,
        dni: 690,
        windSpeed: 9.8,
        windDirection: 240,
        ambientTemperature: 23.0,
        cloudCover: 18
      },
      assets: {
        solarPvRatingMw: 150.0,
        pvSurfaceAreaM2: 700000,
        cellTemperature: 44.0,
        windRatingMw: 160.0,
        windTurbineCount: 50,
        hubHeightM: 115,
        gearboxVibrationMmS: 1.8,
        bearingTemperatureC: 54.0,
        bessCapacityMwh: 200.0,
        bessCurrentSoc: 58.0,
        bessMaxRateMw: 80.0
      },
      grid: {
        gridFrequencyHz: 50.00,
        nominalFrequencyHz: 50,
        demandLoadMw: 200.0
      }
    }
  }
];
