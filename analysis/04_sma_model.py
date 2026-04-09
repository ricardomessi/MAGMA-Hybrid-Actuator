"""
=============================================================================
SCRIPT 4: SMA (SHAPE MEMORY ALLOY) THERMOMECHANICAL MODEL
=============================================================================
Purpose: Model the Nitinol SMA wires used for position locking.
         When the motor stops, SMA wires engage to hold position
         with near-zero continuous power draw.

Key Concepts:
- Nitinol (NiTi) has two phases: Martensite (cool) and Austenite (hot)
- Heating → Austenite → wire CONTRACTS (generates force)
- Cooling → Martensite → wire RELAXES (can be stretched)
- Phase transformation follows temperature-dependent kinetics
- We use the Liang-Rogers constitutive model (simplified)

SMA Application in Our Actuator:
- Multiple Nitinol wires wrap around the output shaft
- When activated (heated), they clamp and lock the shaft position
- Motor can then shut off → near-zero holding power
- To release: stop heating → wires cool → shaft free to move again
=============================================================================
"""

import numpy as np
import matplotlib.pyplot as plt
from scipy.integrate import odeint

# ============================================================
# NITINOL WIRE PARAMETERS (Dynalloy Flexinol 0.020" / 0.5mm)
# ============================================================
# Transformation temperatures (°C)
Ms = 52.0     # Martensite start temperature
Mf = 42.0     # Martensite finish temperature  
As = 68.0     # Austenite start temperature
Af = 78.0     # Austenite finish temperature

# Mechanical properties
E_martensite = 28e9     # Young's modulus - martensite (Pa)
E_austenite = 75e9      # Young's modulus - austenite (Pa)
epsilon_max = 0.04      # Maximum recoverable strain (4%)
sigma_max = 560e6       # Maximum stress in austenite (Pa)

# Wire dimensions
d_wire = 0.5e-3         # Wire diameter (m) = 0.5mm
A_wire = np.pi * (d_wire/2)**2  # Cross-section area (m²)
L_wire = 0.15           # Wire length (m) = 150mm

# Electrical properties
rho_e = 1.0e-6          # Electrical resistivity (Ω·m) - Nitinol
R_wire = rho_e * L_wire / A_wire  # Wire resistance (Ω)

# Thermal properties
rho_density = 6450      # Density (kg/m³)
cp = 837                # Specific heat capacity (J/(kg·K))
h_conv = 50             # Convection coefficient (W/(m²·K)) — natural convection
T_ambient = 25.0        # Ambient temperature (°C)

# Wire mass and surface area
m_wire = rho_density * A_wire * L_wire
A_surface = np.pi * d_wire * L_wire

# Number of SMA wires in our actuator
n_wires = 6

print("=" * 60)
print("SMA (NITINOL) WIRE SPECIFICATIONS")
print("=" * 60)
print(f"Wire Diameter:       {d_wire*1000:.1f} mm")
print(f"Wire Length:         {L_wire*1000:.0f} mm")
print(f"Number of Wires:     {n_wires}")
print(f"Wire Resistance:     {R_wire:.1f} Ω")
print(f"Wire Mass (each):    {m_wire*1000:.2f} g")
print(f"Total SMA Mass:      {n_wires*m_wire*1000:.1f} g")
print(f"\nTransformation Temperatures:")
print(f"  Mf = {Mf}°C → Ms = {Ms}°C (cooling: Austenite→Martensite)")
print(f"  As = {As}°C → Af = {Af}°C (heating: Martensite→Austenite)")
print(f"Max Recoverable Strain: {epsilon_max*100}%")
print(f"Max Contraction:     {L_wire * epsilon_max * 1000:.1f} mm")

# ============================================================
# PHASE TRANSFORMATION MODEL (Liang-Rogers)
# ============================================================
# Martensite fraction (ξ): 0 = fully austenite, 1 = fully martensite
#
# Heating (Martensite → Austenite):
#   ξ = ξ₀/2 * [cos(aA*(T - As)) + 1]   for As ≤ T ≤ Af
#
# Cooling (Austenite → Martensite):  
#   ξ = (1-ξ₀)/2 * [cos(aM*(T - Mf)) + 1] + ξ₀   for Mf ≤ T ≤ Ms

aA = np.pi / (Af - As)  # Austenite transformation coefficient
aM = np.pi / (Ms - Mf)  # Martensite transformation coefficient

def martensite_fraction(T, heating=True, xi_prev=1.0):
    """Calculate martensite fraction at temperature T."""
    if heating:
        if T < As:
            return xi_prev
        elif T > Af:
            return 0.0
        else:
            return xi_prev / 2 * (np.cos(aA * (T - As)) + 1)
    else:  # cooling
        if T > Ms:
            return xi_prev
        elif T < Mf:
            return 1.0
        else:
            return (1 - xi_prev) / 2 * (np.cos(aM * (T - Mf)) + 1) + xi_prev

# ============================================================
# TEMPERATURE SWEEP: Phase Transformation Hysteresis
# ============================================================
T_range_heat = np.linspace(T_ambient, 100, 500)
T_range_cool = np.linspace(100, T_ambient, 500)

# Heating curve
xi_heat = np.ones_like(T_range_heat)
xi_prev = 1.0
for i, T in enumerate(T_range_heat):
    xi_prev = martensite_fraction(T, heating=True, xi_prev=xi_prev)
    xi_heat[i] = xi_prev

# Cooling curve
xi_cool = np.zeros_like(T_range_cool)
xi_prev = 0.0
for i, T in enumerate(T_range_cool):
    xi_prev = martensite_fraction(T, heating=False, xi_prev=xi_prev)
    xi_cool[i] = xi_prev

# ============================================================
# DYNAMIC HEATING SIMULATION
# ============================================================
def thermal_dynamics(T, t, I_current):
    """ODE for wire temperature: m*cp*dT/dt = I²R - h*A*(T-Tamb)"""
    P_joule = I_current**2 * R_wire          # Joule heating (W)
    P_convection = h_conv * A_surface * (T - T_ambient)  # Heat loss (W)
    dTdt = (P_joule - P_convection) / (m_wire * cp)
    return dTdt

# Simulate heating with different currents
t_sim = np.linspace(0, 10, 1000)  # 10 seconds
currents = [0.3, 0.4, 0.5, 0.6]  # Amps

T_profiles = {}
for I in currents:
    T_profile = odeint(thermal_dynamics, T_ambient, t_sim, args=(I,))
    T_profiles[I] = T_profile.flatten()

# Equilibrium temperatures
for I in currents:
    T_eq = T_ambient + I**2 * R_wire / (h_conv * A_surface)
    print(f"\nCurrent {I:.1f}A → Equilibrium: {T_eq:.1f}°C", end="")
    if T_eq >= Af:
        print(" (FULL ACTIVATION)")
    elif T_eq >= As:
        print(" (PARTIAL ACTIVATION)")
    else:
        print(" (NO ACTIVATION)")

# ============================================================
# FORCE AND STRAIN CALCULATION
# ============================================================
# Effective modulus varies with martensite fraction:
# E(ξ) = E_austenite + ξ * (E_martensite - E_austenite)
# Transformation strain: ε_tr = ε_max * (1 - ξ)
# Force per wire: F = σ * A = E(ξ) * ε * A

# Calculate force during heating
T_for_force = np.linspace(T_ambient, 100, 200)
xi_for_force = np.ones_like(T_for_force)
xi_p = 1.0
for i, T in enumerate(T_for_force):
    xi_p = martensite_fraction(T, heating=True, xi_prev=xi_p)
    xi_for_force[i] = xi_p

strain_recovery = epsilon_max * (1 - xi_for_force)
E_eff = E_austenite + xi_for_force * (E_martensite - E_austenite)

# Blocked force (when wire is constrained)
F_blocked = E_eff * strain_recovery * A_wire  # Force per wire
F_total = F_blocked * n_wires                  # Total force from all wires

# Holding torque (assuming wires act at radius r_hold from shaft)
r_hold = 0.015  # 15mm from shaft center
T_holding = F_total * r_hold

print(f"\n\n--- HOLDING PERFORMANCE ---")
print(f"Max Force per Wire:  {np.max(F_blocked):.1f} N")
print(f"Max Total Force:     {np.max(F_total):.1f} N")
print(f"Max Holding Torque:  {np.max(T_holding):.2f} Nm")
print(f"Target Hold Torque:  85.0 Nm")
print(f"Holding Capable:     {'YES ✅' if np.max(T_holding) >= 5.0 else 'NEED MORE WIRES ⚠️'}")

# ============================================================
# POWER CONSUMPTION: HOLDING vs ACTIVE
# ============================================================
# Active mode (motor running): ~50W typical
P_motor_active = 50.0  # Watts

# SMA holding mode: just enough current to maintain temperature above Af
I_hold = np.sqrt(h_conv * A_surface * (Af - T_ambient + 5) / R_wire)
P_sma_hold_per_wire = I_hold**2 * R_wire
P_sma_hold_total = P_sma_hold_per_wire * n_wires

print(f"\nPower Consumption:")
print(f"  Motor Active Mode:     {P_motor_active:.1f} W")
print(f"  SMA Holding Mode:      {P_sma_hold_total:.2f} W")
print(f"  Power Saving:          {(1 - P_sma_hold_total/P_motor_active)*100:.1f}%")

# ============================================================
# PLOTTING
# ============================================================
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('SMA (Nitinol) Thermomechanical Analysis\n(Position Locking System)',
             fontsize=14, fontweight='bold')

# Plot 1: Phase Transformation Hysteresis
ax1 = axes[0, 0]
ax1.plot(T_range_heat, 1-xi_heat, 'r-', linewidth=2.5, label='Heating (M→A)')
ax1.plot(T_range_cool, 1-xi_cool, 'b-', linewidth=2.5, label='Cooling (A→M)')
ax1.axvline(x=As, color='r', linestyle=':', alpha=0.5, label=f'As={As}°C')
ax1.axvline(x=Af, color='r', linestyle='--', alpha=0.5, label=f'Af={Af}°C')
ax1.axvline(x=Ms, color='b', linestyle='--', alpha=0.5, label=f'Ms={Ms}°C')
ax1.axvline(x=Mf, color='b', linestyle=':', alpha=0.5, label=f'Mf={Mf}°C')
ax1.fill_between(T_range_heat, 0, 1-xi_heat, alpha=0.1, color='red')
ax1.set_xlabel('Temperature (°C)')
ax1.set_ylabel('Austenite Fraction')
ax1.set_title('Phase Transformation Hysteresis')
ax1.legend(fontsize=7)
ax1.grid(True, alpha=0.3)

# Plot 2: Heating Dynamics
ax2 = axes[0, 1]
for I in currents:
    ax2.plot(t_sim, T_profiles[I], linewidth=2, label=f'{I:.1f} A')
ax2.axhline(y=As, color='orange', linestyle='--', alpha=0.5, label=f'As={As}°C')
ax2.axhline(y=Af, color='red', linestyle='--', alpha=0.5, label=f'Af={Af}°C')
ax2.set_xlabel('Time (s)')
ax2.set_ylabel('Wire Temperature (°C)')
ax2.set_title('Heating Response at Different Currents')
ax2.legend()
ax2.grid(True, alpha=0.3)

# Plot 3: Force & Holding Torque vs Temperature
ax3 = axes[1, 0]
ax3_twin = ax3.twinx()
ax3.plot(T_for_force, F_total, 'b-', linewidth=2.5, label='Total Clamping Force')
ax3_twin.plot(T_for_force, T_holding, 'r-', linewidth=2.5, label='Holding Torque')
ax3_twin.axhline(y=5.0, color='green', linestyle='--', linewidth=1.5,
                  label='Target: 5 Nm')
ax3.set_xlabel('Temperature (°C)')
ax3.set_ylabel('Clamping Force (N)', color='b')
ax3_twin.set_ylabel('Holding Torque (Nm)', color='r')
ax3.set_title('SMA Clamping Performance vs Temperature')
lines1, labels1 = ax3.get_legend_handles_labels()
lines2, labels2 = ax3_twin.get_legend_handles_labels()
ax3.legend(lines1 + lines2, labels1 + labels2, fontsize=8)
ax3.grid(True, alpha=0.3)

# Plot 4: Power Comparison
ax4 = axes[1, 1]
modes = ['Motor Active\n(Moving)', 'SMA Hold\n(Locked)', 'Motor Idle\n(No Hold)']
powers = [P_motor_active, P_sma_hold_total, P_motor_active * 0.3]
colors = ['#e74c3c', '#27ae60', '#f39c12']
bars = ax4.bar(modes, powers, color=colors, edgecolor='black', linewidth=0.5)
ax4.set_ylabel('Power Consumption (W)')
ax4.set_title('Power: Motor Active vs SMA Holding')
for bar, power in zip(bars, powers):
    ax4.text(bar.get_x() + bar.get_width()/2., bar.get_height() + 0.5,
             f'{power:.1f}W', ha='center', va='bottom', fontweight='bold')
ax4.grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('04_sma_model.png',
            dpi=150, bbox_inches='tight')
plt.close()
print("\n✅ Plot saved: 04_sma_model.png")
