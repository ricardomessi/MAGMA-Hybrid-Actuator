"""
=============================================================================
SCRIPT 7: POWER COMPARISON — MOTOR-ONLY vs HYBRID SYSTEM
=============================================================================
Purpose: Compare energy consumption across different usage scenarios:
         1. Motor-Only (conventional actuator)
         2. Hybrid (Magnetic Gear + SMA holding)
         
Scenarios tested:
- Continuous motion (worst case for hybrid — no holding advantage)
- Frequent hold (best case for hybrid — lots of holding time)  
- Typical robotic arm mission (realistic mix)
- Battery life estimation
=============================================================================
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# SYSTEM POWER SPECIFICATIONS
# ============================================================
# Motor-only system
P_motor_moving = 50.0      # Power during motion (W)
P_motor_holding = 15.0     # Power to hold position with motor (W) - motor fights gravity
P_motor_idle = 2.0         # Idle power - electronics (W)

# Hybrid system (magnetic gear + SMA)
P_hybrid_moving = 48.0     # Slightly less due to magnetic gear efficiency
P_hybrid_holding = 3.5     # SMA holding power (W) — near zero!
P_hybrid_idle = 1.0        # Idle power (W)
P_hybrid_transition = 30.0 # During motor↔SMA handoff (W)

# Battery
battery_capacity_Wh = 50.0  # 50 Wh battery (typical for portable robots)
battery_voltage = 24.0       # V

print("=" * 70)
print("POWER COMPARISON: MOTOR-ONLY vs HYBRID ACTUATOR")
print("=" * 70)
print(f"{'Parameter':<30} {'Motor-Only':<15} {'Hybrid':<15} {'Savings':<10}")
print("-" * 70)
print(f"{'Moving Power (W)':<30} {P_motor_moving:<15.1f} {P_hybrid_moving:<15.1f} {(1-P_hybrid_moving/P_motor_moving)*100:<10.1f}%")
print(f"{'Holding Power (W)':<30} {P_motor_holding:<15.1f} {P_hybrid_holding:<15.1f} {(1-P_hybrid_holding/P_motor_holding)*100:<10.1f}%")
print(f"{'Idle Power (W)':<30} {P_motor_idle:<15.1f} {P_hybrid_idle:<15.1f} {(1-P_hybrid_idle/P_motor_idle)*100:<10.1f}%")

# ============================================================
# SCENARIO ANALYSIS
# ============================================================
# Define different duty cycles (fraction of time in each mode)

scenarios = {
    "Continuous Motion\n(CNC Machine)": {
        "move": 0.90, "hold": 0.05, "idle": 0.05, "transition": 0.00
    },
    "Frequent Hold\n(Pick & Place)": {
        "move": 0.20, "hold": 0.65, "idle": 0.10, "transition": 0.05
    },
    "Robotic Arm\n(Assembly)": {
        "move": 0.35, "hold": 0.45, "idle": 0.15, "transition": 0.05
    },
    "Prosthetic\n(Daily Walk)": {
        "move": 0.25, "hold": 0.55, "idle": 0.15, "transition": 0.05
    },
    "Surveillance\n(Camera Gimbal)": {
        "move": 0.10, "hold": 0.80, "idle": 0.08, "transition": 0.02
    }
}

t_operation = 8 * 3600  # 8-hour operation day (seconds)

print(f"\n{'='*70}")
print(f"{'Scenario':<20} {'Motor-Only':<12} {'Hybrid':<12} {'Saving':<10} {'Battery Life':<15}")
print(f"{'':<20} {'(Wh)':<12} {'(Wh)':<12} {'(%)':<10} {'Motor / Hybrid':<15}")
print("-" * 70)

E_motor_all = []
E_hybrid_all = []
scenario_names = []

for name, duty in scenarios.items():
    clean_name = name.replace('\n', ' ')
    
    # Motor-only energy (Wh)
    E_motor = (P_motor_moving * duty["move"] + 
               P_motor_holding * duty["hold"] + 
               P_motor_idle * duty["idle"]) * t_operation / 3600
    
    # Hybrid energy (Wh)
    E_hybrid = (P_hybrid_moving * duty["move"] + 
                P_hybrid_holding * duty["hold"] + 
                P_hybrid_idle * duty["idle"] +
                P_hybrid_transition * duty["transition"]) * t_operation / 3600
    
    saving = (1 - E_hybrid / E_motor) * 100
    
    # Battery life (hours)
    P_avg_motor = E_motor / 8  # Average power (W)
    P_avg_hybrid = E_hybrid / 8
    battery_life_motor = battery_capacity_Wh / P_avg_motor
    battery_life_hybrid = battery_capacity_Wh / P_avg_hybrid
    
    E_motor_all.append(E_motor)
    E_hybrid_all.append(E_hybrid)
    scenario_names.append(clean_name)
    
    print(f"{clean_name:<20} {E_motor:<12.1f} {E_hybrid:<12.1f} {saving:<10.1f} "
          f"{battery_life_motor:.1f}h / {battery_life_hybrid:.1f}h")

# ============================================================
# 24-HOUR BATTERY LIFE SIMULATION
# ============================================================
# Simulate a typical robotic arm day: 8hr work, 16hr standby

t_day = np.linspace(0, 24, 24*60)  # minute resolution
P_motor_day = np.zeros_like(t_day)
P_hybrid_day = np.zeros_like(t_day)

for i, hour in enumerate(t_day):
    if 8 <= hour < 16:  # Working hours
        # Alternating motion and hold cycles
        cycle_pos = (hour * 60) % 10  # 10-minute cycles
        if cycle_pos < 3:  # Moving
            P_motor_day[i] = P_motor_moving
            P_hybrid_day[i] = P_hybrid_moving
        elif cycle_pos < 3.3:  # Transition
            P_motor_day[i] = P_motor_holding
            P_hybrid_day[i] = P_hybrid_transition
        elif cycle_pos < 8:  # Holding
            P_motor_day[i] = P_motor_holding
            P_hybrid_day[i] = P_hybrid_holding
        else:  # Brief idle
            P_motor_day[i] = P_motor_idle
            P_hybrid_day[i] = P_hybrid_idle
    else:  # Off hours
        P_motor_day[i] = 0
        P_hybrid_day[i] = 0

# Cumulative energy
E_motor_cum = np.cumsum(P_motor_day) * (24*60) / len(t_day) / 60  # Wh
E_hybrid_cum = np.cumsum(P_hybrid_day) * (24*60) / len(t_day) / 60

# Battery remaining
battery_motor = np.clip(battery_capacity_Wh - E_motor_cum, 0, battery_capacity_Wh)
battery_hybrid = np.clip(battery_capacity_Wh - E_hybrid_cum, 0, battery_capacity_Wh)

# Find when battery dies
motor_dies = np.where(battery_motor <= 0)[0]
hybrid_dies = np.where(battery_hybrid <= 0)[0]
motor_life = t_day[motor_dies[0]] if len(motor_dies) > 0 else 24.0
hybrid_life = t_day[hybrid_dies[0]] if len(hybrid_dies) > 0 else 24.0

print(f"\n--- 24-HOUR BATTERY SIMULATION ---")
print(f"Battery Capacity:     {battery_capacity_Wh} Wh")
print(f"Motor-Only Dies At:   {motor_life:.1f} hours")
print(f"Hybrid Dies At:       {hybrid_life:.1f} hours")
print(f"Extra Operating Time: {hybrid_life - motor_life:.1f} hours ({(hybrid_life/motor_life - 1)*100:.0f}% more)")

# ============================================================
# PLOTTING
# ============================================================
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Power & Energy Comparison: Motor-Only vs Hybrid\n(Magnetic Gear + SMA Position Lock)',
             fontsize=14, fontweight='bold')

# Plot 1: Energy by Scenario
ax1 = axes[0, 0]
x = np.arange(len(scenario_names))
width = 0.35
bars1 = ax1.bar(x - width/2, E_motor_all, width, label='Motor-Only',
                color='#e74c3c', edgecolor='black', linewidth=0.5)
bars2 = ax1.bar(x + width/2, E_hybrid_all, width, label='Hybrid',
                color='#27ae60', edgecolor='black', linewidth=0.5)
ax1.set_ylabel('Energy (Wh) per 8-hr shift')
ax1.set_title('Energy Consumption by Scenario')
ax1.set_xticks(x)
ax1.set_xticklabels([s.replace(' ', '\n') for s in scenario_names], fontsize=8)
ax1.legend()
ax1.grid(True, alpha=0.3, axis='y')

# Add savings percentage on top
for i in range(len(scenario_names)):
    saving = (1 - E_hybrid_all[i] / E_motor_all[i]) * 100
    ax1.text(x[i], max(E_motor_all[i], E_hybrid_all[i]) + 2,
             f'-{saving:.0f}%', ha='center', fontsize=9, fontweight='bold', color='green')

# Plot 2: Power Profile Over 24 Hours
ax2 = axes[0, 1]
ax2.plot(t_day, P_motor_day, 'r-', linewidth=1, alpha=0.7, label='Motor-Only')
ax2.plot(t_day, P_hybrid_day, 'g-', linewidth=1, alpha=0.7, label='Hybrid')
ax2.set_xlabel('Time of Day (hours)')
ax2.set_ylabel('Power Draw (W)')
ax2.set_title('24-Hour Power Profile (Robotic Arm)')
ax2.legend()
ax2.grid(True, alpha=0.3)
ax2.set_xlim(0, 24)
ax2.axvspan(8, 16, alpha=0.05, color='blue', label='Working Hours')

# Plot 3: Battery Life Over 24 Hours
ax3 = axes[1, 0]
ax3.plot(t_day, battery_motor / battery_capacity_Wh * 100, 'r-', linewidth=2.5, 
         label=f'Motor-Only (dies @ {motor_life:.1f}h)')
ax3.plot(t_day, battery_hybrid / battery_capacity_Wh * 100, 'g-', linewidth=2.5,
         label=f'Hybrid (dies @ {hybrid_life:.1f}h)')
ax3.axhline(y=20, color='orange', linestyle='--', alpha=0.5, label='Low Battery (20%)')
ax3.axhline(y=0, color='red', linestyle='-', alpha=0.3)
ax3.fill_between(t_day, 0, 20, alpha=0.05, color='red')
ax3.set_xlabel('Time of Day (hours)')
ax3.set_ylabel('Battery Remaining (%)')
ax3.set_title(f'Battery Life: {battery_capacity_Wh}Wh Battery')
ax3.legend()
ax3.grid(True, alpha=0.3)
ax3.set_xlim(0, 24)
ax3.set_ylim(-5, 105)

# Plot 4: Holding Power Comparison (the key advantage)
ax4 = axes[1, 1]
hold_times = np.array([1, 5, 10, 30, 60, 120])  # minutes
E_hold_motor = P_motor_holding * hold_times / 60  # Wh
E_hold_hybrid = P_hybrid_holding * hold_times / 60  # Wh

ax4.semilogy(hold_times, E_hold_motor, 'ro-', linewidth=2, markersize=8, label='Motor Holding')
ax4.semilogy(hold_times, E_hold_hybrid, 'go-', linewidth=2, markersize=8, label='SMA Holding')
ax4.fill_between(hold_times, E_hold_hybrid, E_hold_motor, alpha=0.15, color='green')
ax4.set_xlabel('Holding Duration (minutes)')
ax4.set_ylabel('Energy Consumed (Wh)')
ax4.set_title('Energy Cost of Holding Position')
ax4.legend()
ax4.grid(True, alpha=0.3, which='both')

# Annotate the savings
for i, t_hold in enumerate(hold_times):
    if i % 2 == 0:
        saving = (1 - E_hold_hybrid[i] / E_hold_motor[i]) * 100
        ax4.annotate(f'{saving:.0f}% less', 
                    xy=(t_hold, (E_hold_motor[i] + E_hold_hybrid[i])/2),
                    fontsize=8, ha='center', color='green')

plt.tight_layout()
plt.savefig('07_power_comparison.png',
            dpi=150, bbox_inches='tight')
plt.close()
print("\n✅ Plot saved: 07_power_comparison.png")
