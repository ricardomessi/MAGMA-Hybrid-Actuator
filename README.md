# MAGMA — Magnetically Actuated Gear Mechanism Assembly

> **Honeywell Design-Thon 2026 Submission**  
> A Hybrid Coaxial Magnetic Gear + Shape Memory Alloy Actuator for Low-SWaP Robotic & Aerospace Applications

---

## Key Specifications

| Parameter | Value |
|-----------|-------|
| Rated Torque | 85.0 Nm |
| Output Speed | 60 RPM |
| System Mass | 3.5 kg |
| Hold Power (SMA) | 12.0 W |
| System Efficiency | 95% |
| Noise Level | <5 dB |
| Gear Wear | Zero (contactless) |

## Project Structure

```
MAGMA/
├── interactive/          # Original interactive 3D simulation
│   ├── index.html        # Main page
│   ├── style.css         # Styling
│   ├── engine3d.js       # Three.js 3D engine + physics
│   └── engine.js         # Core simulation logic
│
├── magma/                # Premium product website
│   ├── index.html        # Professional landing page
│   ├── style.css         # Apple-inspired styling
│   └── engine3d.js       # Engine with floating widget
│
├── analysis/             # Python simulation suite (8 scripts)
│   ├── 01_bldc_motor_model.py
│   ├── 02_magnetic_gear_analysis.py
│   ├── 03_torque_transmission.py
│   ├── 04_sma_model.py
│   ├── 05_dual_mode_control.py
│   ├── 06_efficiency_analysis.py
│   ├── 07_power_comparison.py
│   ├── 08_swap_dashboard.py
│   └── graphs/           # Generated analysis plots
│
├── docs/
│   └── MAGMA_Design_Report.docx
│
└── README.md
```

## Interactive Demos

### 1. Original Simulation (`/interactive`)
Full-featured 3D simulation with exploded/assembled/wireframe views, real-time physics, and telemetry charts.

### 2. MAGMA Product Page (`/magma`)
Premium, Apple-inspired product page with a floating glassmorphic simulation widget, live data binding, and competitive analysis.

## Python Analysis Suite

Eight independent scripts modeling every sub-system:

1. **BLDC Motor Model** — Torque-speed curves, efficiency mapping, loss decomposition
2. **Magnetic Gear Analysis** — CMG topology, flux harmonics, gear ratio optimization
3. **Torque Transmission** — Pull-out torque, ripple analysis, mechanical vs magnetic comparison
4. **SMA Thermal Model** — Nitinol phase transformation, contraction force, cycle endurance
5. **Dual-Mode Control** — Motor↔SMA handoff strategy, energy savings analysis
6. **Efficiency Analysis** — System-level efficiency mapping across operating envelope
7. **Power Comparison** — MAGMA vs conventional actuator power profiles
8. **SWaP Dashboard** — Multi-axis radar benchmarking against Kollmorgen, Maxon, Harmonic Drive

### Running the Analysis
```bash
pip install numpy matplotlib scipy
python analysis/01_bldc_motor_model.py
# ... through 08
```

## Technology

- **Frontend:** HTML5, CSS3, JavaScript, Three.js (WebGL)
- **Analysis:** Python 3, NumPy, Matplotlib, SciPy
- **Architecture:** Coaxial Magnetic Gear + SMA Nitinol Locking

## License

This project was developed for the Honeywell Design-Thon 2026.
