"""
=============================================================================
SCRIPT 1: BLDC MOTOR MODEL
=============================================================================
Purpose: Model the Brushless DC motor that drives the magnetic gear stage.
         Generates torque-speed curves and motor efficiency map.

Key Concepts:
- BLDC motor produces torque proportional to current
- Back-EMF increases with speed, limiting max torque at high RPM
- Motor efficiency = mechanical power out / electrical power in
- Losses: copper (I²R), iron (eddy + hysteresis), mechanical (friction)

Motor Selected: Small BLDC (similar to Maxon EC 45 flat)
=============================================================================
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# MOTOR PARAMETERS (Maxon EC 45 flat inspired)
# ============================================================
# These are realistic parameters for a compact BLDC motor

Kt = 0.55          # Torque constant (Nm/A) - how much torque per amp
Ke = 0.55          # Back-EMF constant (V/(rad/s)) - equals Kt for BLDC
R_phase = 1.2       # Phase resistance (ohms) - winding resistance
L_phase = 0.5e-3    # Phase inductance (H)
V_supply = 24.0     # Supply voltage (V) - battery voltage
I_max = 45.0         # Max continuous current (A)
I_peak = 100.0       # Peak current (A) - short duration
n_poles = 8         # Number of pole pairs
motor_mass = 0.85   # Motor mass (kg) = 120g

# Loss parameters
k_iron = 0.002      # Iron loss coefficient (W/(rad/s)²)
k_friction = 0.005  # Mechanical friction coefficient (Nm/(rad/s))

# ============================================================
# DERIVED PARAMETERS
# ============================================================
# No-load speed: when back-EMF = supply voltage
omega_no_load = V_supply / Ke                    # rad/s
rpm_no_load = omega_no_load * 60 / (2 * np.pi)  # RPM

# Stall torque: when speed = 0, all voltage drives current
I_stall = V_supply / R_phase
T_stall = Kt * I_stall                          # Nm

print("=" * 60)
print("BLDC MOTOR SPECIFICATIONS")
print("=" * 60)
print(f"Supply Voltage:     {V_supply} V")
print(f"Torque Constant:    {Kt} Nm/A")
print(f"Phase Resistance:   {R_phase} Ω")
print(f"No-Load Speed:      {rpm_no_load:.0f} RPM ({omega_no_load:.1f} rad/s)")
print(f"Stall Torque:       {T_stall:.2f} Nm")
print(f"Max Cont. Current:  {I_max} A")
print(f"Motor Mass:         {motor_mass*1000:.0f} g")
print("=" * 60)

# ============================================================
# TORQUE-SPEED CHARACTERISTIC
# ============================================================
# The fundamental BLDC relationship:
#   V_supply = Ke * omega + I * R_phase
#   Therefore: I = (V_supply - Ke * omega) / R_phase
#   And: T = Kt * I

speed_rpm = np.linspace(0, rpm_no_load, 500)
speed_rads = speed_rpm * 2 * np.pi / 60

# Current at each speed point
current = (V_supply - Ke * speed_rads) / R_phase

# Limit current to max continuous
current_continuous = np.clip(current, 0, I_max)
current_peak = np.clip(current, 0, I_peak)

# Torque at each speed
torque_continuous = Kt * current_continuous
torque_peak = Kt * current_peak
torque_theoretical = Kt * current  # unlimited

# ============================================================
# EFFICIENCY CALCULATION
# ============================================================
# Mechanical power output
P_mech = torque_continuous * speed_rads

# Losses
P_copper = current_continuous**2 * R_phase * 2  # 2 active phases for BLDC
P_iron = k_iron * speed_rads**2                  # Iron losses
P_friction = k_friction * speed_rads             # Friction losses
P_total_loss = P_copper + P_iron + P_friction

# Electrical power input
P_elec = P_mech + P_total_loss

# Efficiency
efficiency = np.where(P_elec > 0, P_mech / P_elec * 100, 0)

# Find peak efficiency point
peak_eff_idx = np.argmax(efficiency)
peak_eff_speed = speed_rpm[peak_eff_idx]
peak_eff_torque = torque_continuous[peak_eff_idx]
peak_efficiency = efficiency[peak_eff_idx]

print(f"\nPeak Efficiency:    {peak_efficiency:.1f}%")
print(f"  at Speed:         {peak_eff_speed:.0f} RPM")
print(f"  at Torque:        {peak_eff_torque:.3f} Nm")
print(f"Max Mech Power:     {np.max(P_mech):.1f} W")

# ============================================================
# PLOTTING
# ============================================================
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('BLDC Motor Characterization\n(24V Supply, Compact Flat Motor)', 
             fontsize=14, fontweight='bold')

# Plot 1: Torque-Speed Curve
ax1 = axes[0, 0]
ax1.plot(speed_rpm, torque_peak, 'r--', linewidth=1.5, label='Peak Torque', alpha=0.7)
ax1.plot(speed_rpm, torque_continuous, 'b-', linewidth=2.5, label='Continuous Torque')
ax1.fill_between(speed_rpm, 0, torque_continuous, alpha=0.15, color='blue')
ax1.set_xlabel('Speed (RPM)')
ax1.set_ylabel('Torque (Nm)')
ax1.set_title('Torque-Speed Characteristic')
ax1.legend()
ax1.grid(True, alpha=0.3)
ax1.set_xlim(0, rpm_no_load)
ax1.set_ylim(0)

# Plot 2: Efficiency vs Speed
ax2 = axes[0, 1]
ax2.plot(speed_rpm, efficiency, 'g-', linewidth=2.5)
ax2.axhline(y=peak_efficiency, color='g', linestyle='--', alpha=0.5)
ax2.plot(peak_eff_speed, peak_efficiency, 'ro', markersize=10, 
         label=f'Peak: {peak_efficiency:.1f}% @ {peak_eff_speed:.0f} RPM')
ax2.set_xlabel('Speed (RPM)')
ax2.set_ylabel('Efficiency (%)')
ax2.set_title('Motor Efficiency')
ax2.legend()
ax2.grid(True, alpha=0.3)
ax2.set_xlim(0, rpm_no_load)
ax2.set_ylim(0, 100)

# Plot 3: Power vs Speed
ax3 = axes[1, 0]
ax3.plot(speed_rpm, P_mech, 'b-', linewidth=2.5, label='Mechanical Output')
ax3.plot(speed_rpm, P_elec, 'r-', linewidth=2, label='Electrical Input')
ax3.plot(speed_rpm, P_total_loss, 'k--', linewidth=1.5, label='Total Losses')
ax3.set_xlabel('Speed (RPM)')
ax3.set_ylabel('Power (W)')
ax3.set_title('Power Curves')
ax3.legend()
ax3.grid(True, alpha=0.3)
ax3.set_xlim(0, rpm_no_load)
ax3.set_ylim(0)

# Plot 4: Loss Breakdown
ax4 = axes[1, 1]
ax4.stackplot(speed_rpm, P_copper, P_iron, P_friction,
              labels=['Copper Loss (I²R)', 'Iron Loss', 'Friction Loss'],
              colors=['#FF6B6B', '#FFA07A', '#FFD700'], alpha=0.8)
ax4.set_xlabel('Speed (RPM)')
ax4.set_ylabel('Loss Power (W)')
ax4.set_title('Loss Breakdown')
ax4.legend(loc='upper left')
ax4.grid(True, alpha=0.3)
ax4.set_xlim(0, rpm_no_load)

plt.tight_layout()
plt.savefig('01_bldc_motor_model.png', 
            dpi=150, bbox_inches='tight')
plt.close()
print("\n✅ Plot saved: 01_bldc_motor_model.png")
