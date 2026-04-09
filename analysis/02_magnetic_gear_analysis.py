"""
=============================================================================
SCRIPT 2: MAGNETIC GEAR RATIO & POLE-PAIR OPTIMIZATION
=============================================================================
Purpose: Model the coaxial magnetic gear stage that provides contactless
         torque multiplication from the BLDC motor to the output shaft.

Key Concepts:
- Coaxial magnetic gear has 3 components:
    1. Inner rotor (high-speed, few pole pairs) — connected to BLDC motor
    2. Outer rotor (low-speed, many pole pairs) — output shaft  
    3. Modulation ring (stationary, ferromagnetic segments)
    
- Gear ratio: G = p_outer / p_inner
- Modulation segments: n_s = p_outer + p_inner
- Torque multiplication: T_out = G × T_in (ignoring losses)
- The gear is CONTACTLESS — torque transfers via magnetic fields

Reference: Atallah & Howe (2001) — foundational coaxial magnetic gear paper
=============================================================================
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# MAGNETIC GEAR PARAMETERS
# ============================================================

# Design space exploration: different pole pair combinations
# Inner rotor pole pairs (p_i) and outer rotor pole pairs (p_o)
# Constraint: gear ratio should be between 3:1 and 7:1 for our application

configurations = [
    {"p_inner": 2, "p_outer": 7,  "label": "2:7"},
    {"p_inner": 2, "p_outer": 9,  "label": "2:9"},
    {"p_inner": 3, "p_outer": 11, "label": "3:11"},
    {"p_inner": 4, "p_outer": 13, "label": "4:13"},
    {"p_inner": 4, "p_outer": 17, "label": "4:17"},
    {"p_inner": 4, "p_outer": 21, "label": "4:21"},
    {"p_inner": 5, "p_outer": 22, "label": "5:22"},
]

# SELECTED CONFIGURATION (optimal for our 85 Nm / 60 RPM target)
p_inner = 4          # Inner rotor pole pairs (high-speed side)
p_outer = 17         # Outer rotor pole pairs (low-speed side)
n_mod = p_inner + p_outer  # Modulation ring segments = 21

# Gear ratio
G = p_outer / p_inner  # = 4.25:1

# Magnet properties (NdFeB N42 grade)
Br = 1.3             # Remanent flux density (T) — magnet strength
mu_0 = 4 * np.pi * 1e-7  # Permeability of free space

# Geometric parameters
r_inner_outer = 0.020    # Inner rotor outer radius (m) = 20mm
r_inner_inner = 0.012    # Inner rotor inner radius (m) = 12mm
r_outer_inner = 0.025    # Outer rotor inner radius (m) = 25mm
r_outer_outer = 0.035    # Outer rotor outer radius (m) = 35mm
r_mod_inner = 0.021      # Modulation ring inner radius (m)
r_mod_outer = 0.024      # Modulation ring outer radius (m)
axial_length = 0.040     # Axial length (m) = 40mm
air_gap = 0.001          # Air gap (m) = 1mm

# ============================================================
# GEAR RATIO ANALYSIS FOR ALL CONFIGURATIONS
# ============================================================
print("=" * 70)
print("MAGNETIC GEAR CONFIGURATION ANALYSIS")
print("=" * 70)
print(f"{'Config':<10} {'p_inner':<10} {'p_outer':<10} {'n_mod':<10} {'Gear Ratio':<12}")
print("-" * 70)

gear_ratios = []
for config in configurations:
    pi = config["p_inner"]
    po = config["p_outer"]
    ns = pi + po
    gr = po / pi
    gear_ratios.append(gr)
    marker = " ← SELECTED" if pi == p_inner and po == p_outer else ""
    print(f"{config['label']:<10} {pi:<10} {po:<10} {ns:<10} {gr:<12.2f}{marker}")

# ============================================================
# TORQUE TRANSMISSION MODEL
# ============================================================
# Maximum transmittable torque (pull-out torque) for coaxial magnetic gear
# Simplified analytical model based on Atallah's formulation:
#
# T_max ≈ (π/4) × Br² × r² × L × p / μ₀
# where r = average air gap radius, L = axial length, p = pole pairs

# Volume of active magnetic region
V_active = np.pi * (r_outer_outer**2 - r_inner_inner**2) * axial_length

# Torque density estimation (typical: 50-150 kNm/m³ for NdFeB)
# Based on literature values for well-designed coaxial magnetic gears
torque_density = 100e3  # 100 kNm/m³

# Maximum torque on outer rotor (output)
T_max_outer = torque_density * V_active  # Peak transmittable torque
T_max_inner = T_max_outer / G            # Corresponding inner rotor torque

print(f"\n{'='*70}")
print("SELECTED CONFIGURATION DETAILS")
print(f"{'='*70}")
print(f"Inner Rotor Pole Pairs (p_i):     {p_inner}")
print(f"Outer Rotor Pole Pairs (p_o):     {p_outer}")
print(f"Modulation Ring Segments (n_s):   {n_mod}")
print(f"Gear Ratio (G = p_o/p_i):         {G:.2f}:1")
print(f"Active Volume:                    {V_active*1e6:.1f} cm³")
print(f"Max Output Torque (pull-out):     {T_max_outer:.2f} Nm")
print(f"Corresponding Input Torque:       {T_max_inner:.3f} Nm")

# ============================================================
# TORQUE vs ANGULAR DISPLACEMENT (Magnetic Spring Behavior)
# ============================================================
# The magnetic gear behaves like a spring — torque varies sinusoidally
# with relative angular displacement between rotors

delta_theta = np.linspace(0, 2*np.pi/p_outer, 200)  # One magnetic period
T_transmitted = T_max_outer * np.sin(p_outer * delta_theta)

# ============================================================
# SPEED RELATIONSHIP
# ============================================================
# Input speed range (motor speed through magnetic gear)
motor_speed_rpm = np.linspace(0, 700, 100)
output_speed_rpm = motor_speed_rpm / G

# Input torque from motor (assuming linear T-ω characteristic)
Kt_motor = 0.035
V_supply = 24.0
R_phase = 1.2
Ke_motor = 0.035

motor_speed_rads = motor_speed_rpm * 2 * np.pi / 60
motor_current = np.clip((V_supply - Ke_motor * motor_speed_rads) / R_phase, 0, 8.0)
motor_torque = Kt_motor * motor_current

# Output torque (multiplied by gear ratio, with 95% efficiency)
gear_efficiency = 0.95  # Magnetic gear efficiency (typical 93-98%)
output_torque = motor_torque * G * gear_efficiency

# Find operating point that meets our target: 85 Nm @ 60 RPM
target_torque = 85.0
target_speed = 60.0
target_motor_speed = target_speed * G  # Required motor speed

print(f"\n--- TARGET OPERATING POINT ---")
print(f"Target Output:  {target_torque} Nm @ {target_speed} RPM")
print(f"Required Motor: {target_torque/G/gear_efficiency:.2f} Nm @ {target_motor_speed:.0f} RPM")
print(f"Gear Efficiency: {gear_efficiency*100:.0f}%")

# ============================================================
# PLOTTING
# ============================================================
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Coaxial Magnetic Gear Analysis\n(Contactless Torque Transmission)', 
             fontsize=14, fontweight='bold')

# Plot 1: Gear Ratio Comparison
ax1 = axes[0, 0]
labels = [c["label"] for c in configurations]
colors = ['#3498db' if not (c["p_inner"]==p_inner and c["p_outer"]==p_outer) 
          else '#e74c3c' for c in configurations]
bars = ax1.bar(labels, gear_ratios, color=colors, edgecolor='black', linewidth=0.5)
ax1.set_xlabel('Pole Pair Configuration (p_inner : p_outer)')
ax1.set_ylabel('Gear Ratio')
ax1.set_title('Gear Ratio vs Configuration')
ax1.axhline(y=G, color='red', linestyle='--', alpha=0.5, label=f'Selected: {G:.2f}:1')
ax1.legend()
ax1.grid(True, alpha=0.3, axis='y')

# Plot 2: Torque vs Angular Displacement (Magnetic Spring)
ax2 = axes[0, 1]
delta_deg = np.degrees(delta_theta)
ax2.plot(delta_deg, T_transmitted, 'b-', linewidth=2.5)
ax2.axhline(y=T_max_outer, color='r', linestyle='--', alpha=0.5, 
            label=f'Pull-out Torque: {T_max_outer:.1f} Nm')
ax2.axhline(y=-T_max_outer, color='r', linestyle='--', alpha=0.5)
ax2.fill_between(delta_deg, 0, T_transmitted, where=(T_transmitted > 0),
                 alpha=0.15, color='blue')
ax2.set_xlabel('Angular Displacement (degrees)')
ax2.set_ylabel('Transmitted Torque (Nm)')
ax2.set_title('Torque vs Displacement (Magnetic Spring)')
ax2.legend()
ax2.grid(True, alpha=0.3)

# Plot 3: Output Speed-Torque (after gear reduction)
ax3 = axes[1, 0]
ax3.plot(output_speed_rpm, output_torque, 'b-', linewidth=2.5, label='Output (after gear)')
ax3.plot(motor_speed_rpm, motor_torque, 'g--', linewidth=1.5, label='Motor (before gear)')
ax3.plot(target_speed, target_torque, 'r*', markersize=15, 
         label=f'Target: {target_torque} Nm @ {target_speed} RPM')
ax3.set_xlabel('Speed (RPM)')
ax3.set_ylabel('Torque (Nm)')
ax3.set_title('Speed-Torque: Motor vs Geared Output')
ax3.legend()
ax3.grid(True, alpha=0.3)

# Plot 4: Gear Assembly Schematic (Cross-section visualization)
ax4 = axes[1, 1]
theta = np.linspace(0, 2*np.pi, 100)

# Draw concentric rings
for r, color, label in [
    (r_inner_inner*1000, '#FFD700', 'Inner Shaft'),
    (r_inner_outer*1000, '#FF6B6B', f'Inner Rotor ({p_inner} pairs)'),
    (r_mod_inner*1000, '#95a5a6', ''),
    (r_mod_outer*1000, '#7f8c8d', f'Modulation Ring ({n_mod} segments)'),
    (r_outer_inner*1000, '#3498db', ''),
    (r_outer_outer*1000, '#2980b9', f'Outer Rotor ({p_outer} pairs)')
]:
    circle = plt.Circle((0, 0), r, fill=False, color=color, linewidth=2, label=label if label else None)
    ax4.add_patch(circle)

# Draw magnet positions on inner rotor
for i in range(p_inner * 2):
    angle = i * np.pi / p_inner
    r_mag = (r_inner_inner + r_inner_outer) / 2 * 1000
    ax4.plot(r_mag * np.cos(angle), r_mag * np.sin(angle), 
             's' if i % 2 == 0 else 'o', color='red' if i % 2 == 0 else 'blue', 
             markersize=5)

# Draw magnet positions on outer rotor  
for i in range(p_outer * 2):
    angle = i * np.pi / p_outer
    r_mag = (r_outer_inner + r_outer_outer) / 2 * 1000
    ax4.plot(r_mag * np.cos(angle), r_mag * np.sin(angle),
             's' if i % 2 == 0 else 'o', color='red' if i % 2 == 0 else 'blue',
             markersize=4)

ax4.set_xlim(-45, 45)
ax4.set_ylim(-45, 45)
ax4.set_aspect('equal')
ax4.set_xlabel('mm')
ax4.set_ylabel('mm')
ax4.set_title('Gear Cross-Section (Pole Layout)')
ax4.legend(loc='upper right', fontsize=8)
ax4.grid(True, alpha=0.2)

plt.tight_layout()
plt.savefig('02_magnetic_gear_analysis.png',
            dpi=150, bbox_inches='tight')
plt.close()
print("\n✅ Plot saved: 02_magnetic_gear_analysis.png")
