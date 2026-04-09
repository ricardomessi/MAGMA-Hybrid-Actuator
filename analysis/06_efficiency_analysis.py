"""
=============================================================================
SCRIPT 6: SYSTEM EFFICIENCY & LOSS ANALYSIS
=============================================================================
Purpose: Complete efficiency analysis of the hybrid actuator system.
         Maps all losses from electrical input to mechanical output.

Loss Sources:
1. BLDC Motor: Copper (I²R), Iron (eddy+hysteresis), Mechanical friction
2. Magnetic Gear: Eddy current in magnets, Iron loss in modulation ring
3. SMA System: Joule heating (useful!), Convection loss
4. Bearings & Mechanical: Friction in support bearings
=============================================================================
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# OPERATING POINTS TO ANALYZE
# ============================================================
# Sweep across the operating range

speed_out = np.linspace(10, 150, 50)   # Output speed (RPM)
torque_out = np.linspace(0.5, 5.0, 50) # Output torque (Nm)

# Create meshgrid for efficiency map
SPEED, TORQUE = np.meshgrid(speed_out, torque_out)

# Gear parameters
G = 4.25  # Gear ratio
eta_gear = 0.95  # Magnetic gear base efficiency

# Motor parameters  
Kt = 0.55
Ke = 0.55
R_phase = 1.2
V_supply = 24.0

# ============================================================
# LOSS CALCULATIONS AT EACH OPERATING POINT
# ============================================================

# Motor speed (before gear reduction)
SPEED_MOTOR = SPEED * G  # RPM
OMEGA_MOTOR = SPEED_MOTOR * 2 * np.pi / 60  # rad/s

# Required motor torque (before gear multiplication)
TORQUE_MOTOR = TORQUE / (G * eta_gear)

# Motor current
CURRENT = TORQUE_MOTOR / Kt

# Check if operating point is achievable
V_required = Ke * OMEGA_MOTOR + CURRENT * R_phase
achievable = (V_required <= V_supply) & (CURRENT <= 8.0) & (CURRENT > 0)

# === MOTOR LOSSES ===
P_copper = 3 * CURRENT**2 * R_phase  # 3-phase copper loss
P_iron = 0.002 * OMEGA_MOTOR**2       # Iron core loss
P_friction_motor = 0.005 * OMEGA_MOTOR # Bearing friction

# === MAGNETIC GEAR LOSSES ===
# Eddy current losses in permanent magnets (proportional to speed²)
P_eddy_magnets = 0.001 * OMEGA_MOTOR**2

# Iron losses in modulation ring
P_iron_modring = 0.0015 * OMEGA_MOTOR**2

# === BEARING LOSSES ===
OMEGA_OUT = SPEED * 2 * np.pi / 60
P_bearings = 0.003 * OMEGA_OUT * TORQUE  # Speed × torque dependent

# === TOTAL LOSSES ===
P_loss_total = P_copper + P_iron + P_friction_motor + P_eddy_magnets + P_iron_modring + P_bearings

# === POWER CALCULATIONS ===
P_mech_out = TORQUE * OMEGA_OUT          # Mechanical output power
P_elec_in = P_mech_out + P_loss_total     # Electrical input power

# System efficiency
ETA = np.where(achievable & (P_elec_in > 0), P_mech_out / P_elec_in * 100, 0)
ETA = np.where(ETA > 0, ETA, np.nan)  # Replace invalid with NaN

# ============================================================
# KEY OPERATING POINTS
# ============================================================
print("=" * 70)
print("SYSTEM EFFICIENCY ANALYSIS")
print("=" * 70)

# Target operating point
idx_speed = np.argmin(np.abs(speed_out - 150))
idx_torque = np.argmin(np.abs(torque_out - 5.0))

if achievable[idx_torque, idx_speed]:
    print(f"\n--- TARGET OPERATING POINT (5 Nm @ 60 RPM) ---")
    print(f"Output Power:        {P_mech_out[idx_torque, idx_speed]:.1f} W")
    print(f"Input Power:         {P_elec_in[idx_torque, idx_speed]:.1f} W")
    print(f"System Efficiency:   {ETA[idx_torque, idx_speed]:.1f}%")
    print(f"\nLoss Breakdown:")
    print(f"  Copper (I²R):      {P_copper[idx_torque, idx_speed]:.2f} W")
    print(f"  Iron (motor):      {P_iron[idx_torque, idx_speed]:.2f} W")
    print(f"  Motor friction:    {P_friction_motor[idx_torque, idx_speed]:.2f} W")
    print(f"  Eddy (magnets):    {P_eddy_magnets[idx_torque, idx_speed]:.2f} W")
    print(f"  Iron (mod ring):   {P_iron_modring[idx_torque, idx_speed]:.2f} W")
    print(f"  Bearings:          {P_bearings[idx_torque, idx_speed]:.2f} W")
    print(f"  TOTAL LOSSES:      {P_loss_total[idx_torque, idx_speed]:.2f} W")

# Peak efficiency point
valid_eta = np.where(np.isnan(ETA), 0, ETA)
peak_idx = np.unravel_index(np.argmax(valid_eta), ETA.shape)
print(f"\n--- PEAK EFFICIENCY POINT ---")
print(f"Speed:               {speed_out[peak_idx[1]]:.0f} RPM")
print(f"Torque:              {torque_out[peak_idx[0]]:.1f} Nm")
print(f"Efficiency:          {ETA[peak_idx]:.1f}%")

# ============================================================
# LOSS BREAKDOWN AT DIFFERENT OPERATING POINTS
# ============================================================
operating_points = [
    ("Low Load", 50, 1.0),
    ("Mid Load", 100, 3.0),
    ("Full Load", 150, 5.0),
]

print(f"\n{'='*70}")
print(f"{'Point':<12} {'Speed':<8} {'Torque':<8} {'P_out':<8} {'P_in':<8} {'η':<8} {'Losses':<8}")
print(f"{'':<12} {'RPM':<8} {'Nm':<8} {'W':<8} {'W':<8} {'%':<8} {'W':<8}")
print(f"{'-'*70}")

for name, spd, trq in operating_points:
    si = np.argmin(np.abs(speed_out - spd))
    ti = np.argmin(np.abs(torque_out - trq))
    if achievable[ti, si]:
        print(f"{name:<12} {speed_out[si]:<8.0f} {torque_out[ti]:<8.1f} "
              f"{P_mech_out[ti,si]:<8.1f} {P_elec_in[ti,si]:<8.1f} "
              f"{ETA[ti,si]:<8.1f} {P_loss_total[ti,si]:<8.2f}")

# ============================================================
# PLOTTING
# ============================================================
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('System Efficiency & Loss Analysis\n(Magnetic Gear + SMA Hybrid Actuator)',
             fontsize=14, fontweight='bold')

# Plot 1: Efficiency Map (Contour)
ax1 = axes[0, 0]
levels = np.arange(50, 100, 2)
cs = ax1.contourf(SPEED, TORQUE, ETA, levels=levels, cmap='RdYlGn')
ax1.contour(SPEED, TORQUE, ETA, levels=[80, 85, 90, 92, 94], colors='black',
            linewidths=0.5, linestyles='--')
plt.colorbar(cs, ax=ax1, label='Efficiency (%)')
ax1.plot(150, 5.0, 'r*', markersize=15, label='Target: 5Nm@150RPM')
ax1.set_xlabel('Output Speed (RPM)')
ax1.set_ylabel('Output Torque (Nm)')
ax1.set_title('System Efficiency Map')
ax1.legend()

# Plot 2: Loss Breakdown Pie Chart (at target operating point)
ax2 = axes[0, 1]
if achievable[idx_torque, idx_speed]:
    losses = [
        P_copper[idx_torque, idx_speed],
        P_iron[idx_torque, idx_speed],
        P_friction_motor[idx_torque, idx_speed],
        P_eddy_magnets[idx_torque, idx_speed],
        P_iron_modring[idx_torque, idx_speed],
        P_bearings[idx_torque, idx_speed]
    ]
    labels = ['Copper (I²R)', 'Iron (motor)', 'Motor friction',
              'Eddy (magnets)', 'Iron (mod ring)', 'Bearings']
    colors = ['#e74c3c', '#e67e22', '#f1c40f', '#3498db', '#2980b9', '#95a5a6']
    
    # Filter out zero/tiny losses for cleaner pie
    threshold = 0.01
    filtered = [(l, lab, c) for l, lab, c in zip(losses, labels, colors) if l > threshold]
    if filtered:
        f_losses, f_labels, f_colors = zip(*filtered)
        ax2.pie(f_losses, labels=f_labels, colors=f_colors, autopct='%1.1f%%',
                startangle=90, textprops={'fontsize': 9})
    ax2.set_title(f'Loss Breakdown @ 5Nm, 150RPM\n(Total: {sum(losses):.1f}W)')

# Plot 3: Efficiency vs Speed (at different torques)
ax3 = axes[1, 0]
torques_to_plot = [1.0, 2.0, 3.0, 4.0, 5.0]
for trq in torques_to_plot:
    ti = np.argmin(np.abs(torque_out - trq))
    eta_line = ETA[ti, :]
    valid = ~np.isnan(eta_line)
    if np.any(valid):
        ax3.plot(speed_out[valid], eta_line[valid], linewidth=2, label=f'{trq:.0f} Nm')
ax3.set_xlabel('Output Speed (RPM)')
ax3.set_ylabel('Efficiency (%)')
ax3.set_title('Efficiency vs Speed at Different Loads')
ax3.legend()
ax3.grid(True, alpha=0.3)
ax3.set_ylim(60, 100)

# Plot 4: Power Flow Sankey-style (simplified bar chart)
ax4 = axes[1, 1]
if achievable[idx_torque, idx_speed]:
    p_out = P_mech_out[idx_torque, idx_speed]
    p_in = P_elec_in[idx_torque, idx_speed]
    
    categories = ['Electrical\nInput', 'Mechanical\nOutput', 'Copper\nLoss', 
                  'Iron\nLoss', 'Gear\nLoss', 'Bearing\nLoss']
    values = [p_in, p_out, 
              P_copper[idx_torque, idx_speed],
              P_iron[idx_torque, idx_speed] + P_iron_modring[idx_torque, idx_speed],
              P_eddy_magnets[idx_torque, idx_speed],
              P_bearings[idx_torque, idx_speed] + P_friction_motor[idx_torque, idx_speed]]
    colors_bar = ['#3498db', '#27ae60', '#e74c3c', '#e67e22', '#9b59b6', '#95a5a6']
    
    bars = ax4.barh(categories, values, color=colors_bar, edgecolor='black', linewidth=0.5)
    ax4.set_xlabel('Power (W)')
    ax4.set_title('Power Flow @ Target Operating Point')
    
    for bar, val in zip(bars, values):
        ax4.text(bar.get_width() + 0.2, bar.get_y() + bar.get_height()/2,
                f'{val:.1f}W', va='center', fontsize=9)
    ax4.grid(True, alpha=0.3, axis='x')

plt.tight_layout()
plt.savefig('06_efficiency_analysis.png',
            dpi=150, bbox_inches='tight')
plt.close()
print("\n✅ Plot saved: 06_efficiency_analysis.png")
