# AeroVolt-Core | Renewable Energy & Grid Analytics AI Engine

![AeroVolt-Core Dashboard Banner](https://img.shields.io/badge/AeroVolt--Core-v3.4--PRO-06b6d4?style=for-the-badge&logo=virtualbox&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Model-Google%20Gemini%201.5%20Pro-4285F4?style=for-the-badge&logo=google&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)

**AeroVolt-Core** is an enterprise-grade, single-file interactive dashboard designed for Renewable Energy Management Systems (REMS) and Smart Grid Controllers. Powered by AI telemetry parsing and real-time inference logic, it bridges environmental telemetry, asset performance diagnostics, and automated grid load balancing.

---

## ⚡ Core Features

* **Real-Time Generation Forecasting:** Dynamic conversion of solar irradiance ($GHI$), ambient temperature, cloud cover, and wind speed at hub height into megawatt ($MW$) electrical yield predictions.
* **Automated Grid Load Balancing:** Instantaneous comparison of predicted generation against target grid load demand with dynamic status alerts (`SURPLUS`, `DEFICIT`, `BALANCED`).
* **BESS Dispatch Control:** Autonomous battery storage commands (Charge/Discharge/Idle) based on grid load deltas and State of Charge (SoC).
* **Predictive Asset Maintenance:** Real-time anomaly detection for physical hardware (e.g., turbine gearbox thermal friction and solar array inverter derating).
* **SCADA Logging Console:** Streamed simulation log outputs recording operational state changes with UTC timestamping.

---

## 🛠️ Architecture & Tech Stack

The application is built using a lightweight, performant single-file architecture suitable for edge deployment or cloud dashboard hosting.

* **Frontend UI:** HTML5, Tailwind CSS (via CDN)
* **Icons & Typography:** FontAwesome 6, Google Fonts (*Inter*, *JetBrains Mono*)
* **Telemetry & Logic Engine:** Pure Vanilla JavaScript (Zero framework overhead)
* **AI Engine Prompt Model:** Configured for Google AI Studio (`Gemini 1.5 Pro` / `Flash`)

---

## 🚀 Getting Started

### Quick Start (Local Run)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/aerovolt-core.git
   cd aerovolt-core
   ```

2. **Run the application:**
   Since this is a fully self-contained HTML document, simply open `index.html` in any modern web browser:
   ```bash
   # On macOS
   open index.html

   # On Linux
   xdg-open index.html

   # On Windows
   start index.html
   ```

---

## 🤖 Google AI Studio Configuration

To connect this dashboard to a live Google AI Studio deployment using `Gemini 1.5 Pro`:

1. Open [Google AI Studio](https://aistudio.google.com/).
2. Set the **Model** to `Gemini 1.5 Pro`.
3. Set **Temperature** to `0.1` (to enforce deterministic numerical responses).
4. Paste the system instructions into the **System Instructions** block:

```text
You are "AeroVolt-Core," an enterprise-grade AI analytics engine built for Renewable Energy Management Systems (REMS) and Smart Grid Controllers.
Process environmental telemetry inputs (Solar Irradiance, Wind Speed, Temperature, Grid Load) and return structured JSON output containing:
- Solar Output Predicted (MW)
- Wind Output Predicted (MW)
- Total Generation & Confidence Score
- Grid Stability Assessment & BESS Commands
- Asset Health & Anomaly Alarms
```

5. Enable **JSON Output** mode in the model parameters panel.

---

## 📊 Telemetry Calculation Formulas

The core logic within `AeroVolt-Core` incorporates real-world physical constraints:

* **Solar Generation:**
  $$\text{Power}_{\text{solar}} = \left(\frac{\text{GHI}}{1000}\right) \times P_{\text{installed}} \times (1 - \text{Cloud \%}) \times \text{Derating}_{\text{thermal}}$$
  *(Thermal derating applies $0.4\%$ loss per ${}^\circ\text{C}$ above $25^\circ\text{C}$)*

* **Wind Generation:**
  $$\text{Power}_{\text{wind}} = \min\left(P_{\text{max}}, \left(\frac{v}{v_{\text{rated}}}\right)^{2.6} \times P_{\text{base}}\right)$$

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
```
