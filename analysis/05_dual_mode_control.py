"""
=============================================================================
SCRIPT 5: DUAL-MODE CONTROL LOGIC
=============================================================================
Purpose: Simulate the control strategy that switches between:
         - MOTION MODE: BLDC motor + magnetic gear for movement
         - HOLD MODE: SMA wires lock position, motor shuts off
         
The handoff sequence:
1. Motor drives to target position via magnetic gear
2. Position reached → SMA wires begin heating
3. SMA reaches activation temperature → wires clamp shaft
4. Clamping force sufficient → motor power cut
5. SMA maintains hold with minimal power
6. New motion command → SMA deactivates → motor resumes
=============================================================================
"""

import numpy as np
import matplotlib.pyplot as plt

# ============================================================
# SYSTEM PARAMETERS
# ============================================================
# Motor parameters
P_motor_rated = 350.0     # Motor power during motion (W)
T_motor_max = 85.0        # Max output torque after gear (Nm)
speed_max = 60.0          # Max output speed (RPM)

# SMA parameters
P_sma_hold = 12.0         # SMA holding power (W)
T_sma_activate = 1.5      # Time to activate SMA (seconds)
T_sma_deactivate = 3.0    # Time to cool/release SMA (seconds)
T_sma_hold_max = 100.0    # Max holding torque (Nm)
Af_temp = 78.0            # Full activation temperature (°C)
T_ambient = 25.0          # Ambient temperature (°C)

# Control thresholds
position_threshold = 0.5   # Position error threshold for "arrived" (degrees)
sma_ready_threshold = 0.9  # SMA force threshold for "locked" (fraction of max)

# ============================================================
# MISSION PROFILE SIMULATION
# ============================================================
# Simulate a realistic mission: move-hold-move-hold cycle
# Like a robotic arm picking something up and holding it

dt = 0.01  # Time step (s)
t_total = 30.0  # Total simulation time (s)
t = np.arange(0, t_total, dt)
n_steps = len(t)

# Target position profile (degrees)
target_position = np.zeros(n_steps)
target_position[0:200] = 0              # Start at 0°
target_position[200:800] = np.linspace(0, 90, 600)   # Move to 90°
target_position[800:1500] = 90          # Hold at 90°
target_position[1500:1900] = np.linspace(90, 45, 400) # Move to 45°
target_position[1900:2500] = 45         # Hold at 45°
target_position[2500:2800] = np.linspace(45, 0, 300)  # Return to 0°
target_position[2800:] = 0              # Hold at 0°

# ============================================================
# STATE MACHINE SIMULATION
# ============================================================
# States: IDLE, MOVING, TRANSITION_TO_HOLD, HOLDING, TRANSITION_TO_MOVE

actual_position = np.zeros(n_steps)
motor_power = np.zeros(n_steps)
sma_power = np.zeros(n_steps)
total_power = np.zeros(n_steps)
sma_temperature = np.ones(n_steps) * T_ambient
sma_force_fraction = np.zeros(n_steps)
motor_torque = np.zeros(n_steps)
state = np.zeros(n_steps, dtype=int)  # 0=idle, 1=moving, 2=trans_hold, 3=holding, 4=trans_move

# State labels
state_labels = ['IDLE', 'MOVING', 'TRANS→HOLD', 'HOLDING', 'TRANS→MOVE']

# Simulation
prev_target = 0.0
hold_timer = 0.0
transition_timer = 0.0
current_state = 0  # IDLE

for i in range(1, n_steps):
    target = target_position[i]
    prev_pos = actual_position[i-1]
    error = target - prev_pos
    target_changed = abs(target - target_position[i-1]) > 0.01
    
    # State transitions
    if current_state == 0:  # IDLE
        if abs(error) > position_threshold:
            current_state = 1  # Start moving
    
    elif current_state == 1:  # MOVING
        # Move towards target (simple proportional control)
        move_rate = 300.0  # degrees/sec max
        move = np.clip(error, -move_rate*dt, move_rate*dt)
        actual_position[i] = prev_pos + move
        motor_power[i] = P_motor_rated * min(abs(error)/10, 1.0)
        motor_torque[i] = T_motor_max * min(abs(error)/10, 1.0)
        
        if abs(error) < position_threshold:
            current_state = 2  # Start transition to hold
            transition_timer = 0.0
    
    elif current_state == 2:  # TRANSITION TO HOLD
        actual_position[i] = prev_pos
        transition_timer += dt
        
        # SMA heating up
        heat_fraction = min(transition_timer / T_sma_activate, 1.0)
        sma_temperature[i] = T_ambient + (Af_temp + 5 - T_ambient) * heat_fraction
        sma_force_fraction[i] = max(0, (heat_fraction - 0.3) / 0.7)  # Force builds after 30% heated
        sma_power[i] = P_sma_hold * heat_fraction
        
        # Motor still on during transition (tapering down)
        motor_power[i] = P_motor_rated * max(0, 1 - heat_fraction)
        motor_torque[i] = T_motor_max * max(0, 1 - heat_fraction)
        
        if sma_force_fraction[i] >= sma_ready_threshold:
            current_state = 3  # SMA locked, switch to holding
    
    elif current_state == 3:  # HOLDING (SMA active, motor off)
        actual_position[i] = prev_pos
        sma_temperature[i] = Af_temp + 5  # Maintained above Af
        sma_force_fraction[i] = 1.0
        sma_power[i] = P_sma_hold  # Minimal holding power
        motor_power[i] = 0.0  # Motor completely OFF
        motor_torque[i] = 0.0
        
        if target_changed:
            current_state = 4  # Need to move again
            transition_timer = 0.0
    
    elif current_state == 4:  # TRANSITION TO MOVE
        actual_position[i] = prev_pos
        transition_timer += dt
        
        # SMA cooling down
        cool_fraction = min(transition_timer / T_sma_deactivate, 1.0)
        sma_temperature[i] = (Af_temp + 5) - (Af_temp + 5 - T_ambient) * cool_fraction
        sma_force_fraction[i] = max(0, 1 - cool_fraction)
        sma_power[i] = P_sma_hold * max(0, 1 - cool_fraction)
        
        # Motor ramping up
        motor_power[i] = P_motor_rated * cool_fraction
        
        if cool_fraction >= 1.0:
            current_state = 1  # Back to moving
    
    else:
        actual_position[i] = prev_pos
    
    if current_state == 0:
        actual_position[i] = prev_pos
    
    state[i] = current_state
    total_power[i] = motor_power[i] + sma_power[i]

# ============================================================
# ENERGY ANALYSIS
# ============================================================
E_total_hybrid = np.trapezoid(total_power, t)
E_motor_only = np.trapezoid(np.where(motor_power > 0, P_motor_rated, P_motor_rated*0.3), t)
# Motor-only system: motor stays on even during holding (at reduced power)

E_saved = E_motor_only - E_total_hybrid
savings_pct = E_saved / E_motor_only * 100

print("=" * 60)
print("DUAL-MODE CONTROL ANALYSIS")
print("=" * 60)
print(f"Total Simulation Time:   {t_total:.0f} s")
print(f"\nEnergy Consumption:")
print(f"  Hybrid (Motor+SMA):   {E_total_hybrid:.1f} J ({E_total_hybrid/3600:.3f} Wh)")
print(f"  Motor-Only System:    {E_motor_only:.1f} J ({E_motor_only/3600:.3f} Wh)")
print(f"  Energy Saved:         {E_saved:.1f} J ({savings_pct:.1f}%)")

# Time in each state
for s in range(5):
    time_in_state = np.sum(state == s) * dt
    pct = time_in_state / t_total * 100
    print(f"  Time in {state_labels[s]:<15}: {time_in_state:.1f}s ({pct:.0f}%)")

# ============================================================
# PLOTTING
# ============================================================
fig, axes = plt.subplots(4, 1, figsize=(14, 14), sharex=True)
fig.suptitle('Dual-Mode Control: Motor + SMA Handoff Simulation\n(30-Second Mission Profile)',
             fontsize=14, fontweight='bold')

# Plot 1: Position
ax1 = axes[0]
ax1.plot(t, target_position, 'r--', linewidth=1.5, label='Target Position', alpha=0.7)
ax1.plot(t, actual_position, 'b-', linewidth=2, label='Actual Position')
# Color background by state
for s, color, label in [(1, '#3498db', 'Moving'), (2, '#f39c12', 'Trans→Hold'),
                         (3, '#27ae60', 'Holding'), (4, '#e74c3c', 'Trans→Move')]:
    mask = state == s
    if np.any(mask):
        ax1.fill_between(t, 0, 100, where=mask, alpha=0.08, color=color, label=label)
ax1.set_ylabel('Position (°)')
ax1.set_title('Position Tracking')
ax1.legend(loc='upper right', ncol=3, fontsize=8)
ax1.grid(True, alpha=0.3)
ax1.set_ylim(-5, 100)

# Plot 2: Power Consumption
ax2 = axes[1]
ax2.fill_between(t, 0, motor_power, alpha=0.7, color='#e74c3c', label='Motor Power')
ax2.fill_between(t, motor_power, motor_power + sma_power, alpha=0.7, 
                 color='#27ae60', label='SMA Power')
ax2.plot(t, total_power, 'k-', linewidth=1, alpha=0.5, label='Total')
ax2.axhline(y=P_motor_rated, color='gray', linestyle=':', alpha=0.3)
ax2.set_ylabel('Power (W)')
ax2.set_title('Power Consumption Breakdown')
ax2.legend()
ax2.grid(True, alpha=0.3)
ax2.set_ylim(0, P_motor_rated * 1.2)

# Plot 3: SMA Status
ax3 = axes[2]
ax3_twin = ax3.twinx()
ax3.plot(t, sma_temperature, 'r-', linewidth=2, label='SMA Temperature')
ax3.axhline(y=Af_temp, color='r', linestyle='--', alpha=0.3, label=f'Af = {Af_temp}°C')
ax3_twin.plot(t, sma_force_fraction * 100, 'g-', linewidth=2, label='Clamp Force %')
ax3.set_ylabel('Temperature (°C)', color='r')
ax3_twin.set_ylabel('Clamping Force (%)', color='g')
ax3.set_title('SMA Wire Status')
lines1, labels1 = ax3.get_legend_handles_labels()
lines2, labels2 = ax3_twin.get_legend_handles_labels()
ax3.legend(lines1 + lines2, labels1 + labels2, fontsize=8)
ax3.grid(True, alpha=0.3)

# Plot 4: Energy Cumulative
ax4 = axes[3]
E_cumulative_hybrid = np.cumsum(total_power) * dt
E_cumulative_motor = np.cumsum(np.where(motor_power > 0, P_motor_rated, P_motor_rated*0.3)) * dt
ax4.plot(t, E_cumulative_motor, 'r-', linewidth=2, label='Motor-Only System')
ax4.plot(t, E_cumulative_hybrid, 'b-', linewidth=2.5, label='Hybrid (Motor+SMA)')
ax4.fill_between(t, E_cumulative_hybrid, E_cumulative_motor, alpha=0.15, color='green',
                 label=f'Energy Saved: {savings_pct:.0f}%')
ax4.set_xlabel('Time (s)')
ax4.set_ylabel('Cumulative Energy (J)')
ax4.set_title('Cumulative Energy: Hybrid vs Motor-Only')
ax4.legend()
ax4.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('05_dual_mode_control.png',
            dpi=150, bbox_inches='tight')
plt.close()
print("\n✅ Plot saved: 05_dual_mode_control.png")
