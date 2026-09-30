# SeismoBench: Precision Shake Table Controller & Telemetry Dashboard

**SeismoBench** is a modern, dark-mode, engineering-grade web application and hardware controller designed for an **ESP32-S3 dual-stepper shake table simulator** with an **ADXL356 accelerometer sensor**.

---

## ⚡ Key Highlights & Capabilities

### 1. Data Ingestion & Preloaded Seismic Records
- **1940 El Centro (NS Component)**: Classic benchmark record from the Imperial Valley, California earthquake.
- **1995 Kobe (Kobe JMA Station)**: Near-fault high-velocity pulse destructive record.
- **1994 Northridge (Sylmar County Hospital)**: High-PGA forward-directivity fling-step record.
- **Synthetic Sine Sweep (1 Hz – 15 Hz)**: Chirp vibration sweep to test mechanical table and specimen natural resonant frequencies.
- **Custom CSV Seismogram Ingest**: Drag-and-drop or browse files with columns (`time,accel` or `time,acceleration`). Supports units in $g$, $m/s^2$, or $gal$.

### 2. Digital Signal Processing (DSP) Pipeline
- **2nd-Order Digital Butterworth High-Pass Filter**: Configurable cutoff frequency ($f_c \in [0.05, 1.50\text{ Hz}]$, default $0.20\text{ Hz}$). Implements forward-backward zero-phase (`filtfilt`) filtering with pre-warping bilinear transform to eliminate phase distortion.
- **Numerical Double Integration**:
  $$\text{Acceleration } a(t) \xrightarrow{\text{Trapezoidal Rule}} \text{Velocity } v(t) \xrightarrow{\text{Trapezoidal Rule}} \text{Displacement } x(t)$$
- **Zero-Drift Baseline Correction**: Eliminates runaway DC sensor integration drift and applies boundary cosine tapering, guaranteeing that table displacement starts at $0.0\text{ mm}$ and returns cleanly to $0.0\text{ mm}$.
- **Cooley-Tukey Radix-2 FFT**: Single-sided spectral magnitude calculation ($0 - 25\text{ Hz}$) with Hanning/Hamming windowing to identify dominant structural excitation frequencies.

### 3. Hardware & Mechanical Kinematics Configuration
- **Drive System**: GT2 Timing Belt (Pitch: 2mm) with 16T / 20T / 24T / 32T pulleys (Default: 20T = $40\text{ mm/rev}$).
- **Stepper Motors**: Dual NEMA 17 ($1.8^\circ$ step angle = $200\text{ steps/rev}$).
- **Stepper Drivers**: Trinamic TMC2209 with selectable microstepping ($1/1$ to $1/64$, Default: $1/16$).
- **Calculated Kinematic Resolution**:
  $$\text{Steps per mm} = \frac{\text{Steps/rev} \times \text{Microstepping}}{\text{Teeth} \times \text{Pitch}} = \frac{200 \times 16}{20 \times 2} = 80.0\text{ steps/mm}\quad (1\text{ step} = 12.5\,\mu\text{m})$$
- **Physical Stroke Limits**: Single-sided carriage limit $\pm 40\text{ mm}$ (80 mm total travel) with dynamic clip warnings and automatic down-scaling.
- **Safety Clamping**: Max velocity clamp ($250\text{ mm/s}$) and max acceleration clamp ($5000\text{ mm/s}^2$).

### 4. Visualization Dashboards (4 Synchronized Interactive Graphs)
1. **Input Ground Acceleration**: $a(t)$ in $g$ vs. time ($s$) with PGA markers.
2. **Table Displacement Profile**: $x(t)$ in $mm$ with marked physical limits ($\pm 40\text{ mm}$) and optional velocity curve overlay.
3. **FFT Frequency Spectrum**: Magnitude vs. Frequency ($0 - 25\text{ Hz}$) with dominant peak frequency detection.
4. **Telemetry Overlay**: Commanded input vs. Measured ADXL356 accelerometer response with:
   - **Root Mean Square Error (RMSE)**
   - **Cross-Correlation ($R_{xy}$)** percentage
   - **Phase Latency / Lag ($\tau$)** in milliseconds

### 5. Hardware Connectivity & Code Generation
- **Native Web Serial API**: Direct USB-C communication with the ESP32-S3 @ 921600 baud.
- **Built-in Hardware Loopback Simulator**: Demonstrates table inertia, mechanical chassis resonance ($9.5\text{ Hz}$), and ADXL356 Gaussian sensor noise ($0.0035g$).
- **Serial Terminal Monitor**: Live inspection of TX/RX raw serial packets with timestamping and quick commands (`PING`, `STATUS`, `HOME`, `ESTOP`).
- **ESP32-S3 Firmware & Payload Generator**: One-click generation and copy/download of ready-to-flash FreeRTOS Arduino firmware (`.ino`), JSON chunked trajectory buffers, and C/C++ PROGMEM headers.

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Or build for production
npm run build
```

Open **`http://localhost:3000/`** in Google Chrome, Microsoft Edge, or Opera.
