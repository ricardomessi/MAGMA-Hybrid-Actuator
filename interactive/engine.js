/* ============================================================
   HYBRID ACTUATOR — INTERACTIVE BLUEPRINT ENGINE
   Canvas-based motor visualization with real-time simulation
   ============================================================ */

// ── COMPONENT DATA ──────────────────────────────────────────
const COMPONENTS = {
    stator: {
        name: "Stator", tag: "BLDC MOTOR", color: "#f97316",
        desc: "Fixed copper windings (8 pole pairs) create rotating magnetic field. 3-phase trapezoidal BEMF pattern drives efficient commutation.",
        working: "Current flows through 3-phase copper coils wound around a laminated silicon-steel core. Sequential energization of phase pairs creates a rotating magnetic field that interacts with the rotor's permanent magnets, producing torque via Lorentz force (F = BIL). The stator is potted in thermal epoxy for heat dissipation.",
        dims: [
            {l:"Outer Ø",v:"45 mm"},{l:"Inner Ø",v:"24 mm"},{l:"Stack Length",v:"15 mm"},
            {l:"Pole Pairs",v:"8"},{l:"Phase R",v:"1.2 Ω"},{l:"Inductance",v:"0.5 mH"},
            {l:"Wire Gauge",v:"AWG 22"},{l:"Slot Fill",v:"42%"},{l:"Core Material",v:"M19 Si-Steel"}
        ]
    },
    rotor: {
        name: "Rotor (BLDC)", tag: "BLDC MOTOR", color: "#ef4444",
        desc: "Permanent magnet rotor with NdFeB N42 magnets. Coupled directly to the high-speed rotor of the magnetic gear.",
        working: "The rotor carries surface-mounted NdFeB N42 grade permanent magnets (Br = 1.3 T) arranged in alternating polarity. As the stator's rotating field sweeps past, electromagnetic torque is generated. The rotor is press-fit onto the high-speed shaft with a Halbach-inspired magnetization pattern for maximum air-gap flux density.",
        dims: [
            {l:"Outer Ø",v:"23 mm"},{l:"Inner Ø",v:"8 mm"},{l:"Length",v:"15 mm"},
            {l:"Magnet Grade",v:"N42 NdFeB"},{l:"Br",v:"1.3 T"},{l:"Torque Const.",v:"0.035 Nm/A"},
            {l:"BEMF Const.",v:"0.035 V·s/rad"},{l:"Max RPM",v:"6545"},{l:"Mass",v:"35 g"}
        ]
    },
    "high-speed-rotor": {
        name: "High-Speed Rotor", tag: "COAXIAL GEAR", color: "#a855f7",
        desc: "Inner rotor of the coaxial magnetic gear with 4 pole pairs. Rotates at motor speed, transmitting torque via magnetic field coupling.",
        working: "This rotor carries 4 pole pairs of NdFeB magnets on its outer surface. As it spins at motor speed, its magnetic field interacts with the modulation ring's ferromagnetic segments, which modulate the field harmonics to couple with the outer (low-speed) rotor's 17 pole pairs. This creates contactless torque transmission with a 4.25:1 gear ratio — no physical contact, no wear, no lubrication needed.",
        dims: [
            {l:"Outer Ø",v:"40 mm"},{l:"Inner Ø",v:"24 mm"},{l:"Length",v:"40 mm"},
            {l:"Pole Pairs",v:"4"},{l:"Magnet Arcs",v:"8"},{l:"Input Speed",v:"638 RPM"},
            {l:"Input Torque",v:"1.24 Nm"},{l:"Air Gap",v:"1 mm"},{l:"Mag. Material",v:"NdFeB N42"}
        ]
    },
    "modulation-ring": {
        name: "Modulation Ring", tag: "COAXIAL GEAR", color: "#64748b",
        desc: "Stationary ring of 21 ferromagnetic segments. Modulates magnetic field harmonics enabling contactless gear reduction.",
        working: "The modulation ring is the key innovation of the coaxial magnetic gear. Its 21 ferromagnetic pole pieces (n_s = p_inner + p_outer = 4 + 17 = 21) act as a magnetic flux 'lens'. They modulate the spatial harmonic content of the inner rotor's field, creating field components that match the outer rotor's pole count. This enables torque transfer across the air gap with ~95% efficiency. The ring is stationary — bolted to the housing.",
        dims: [
            {l:"Outer Ø",v:"48 mm"},{l:"Inner Ø",v:"42 mm"},{l:"Length",v:"40 mm"},
            {l:"Segments",v:"21"},{l:"Segment Width",v:"3 mm"},{l:"Material",v:"SMC Fe"},
            {l:"Air Gap (in)",v:"1 mm"},{l:"Air Gap (out)",v:"1 mm"},{l:"Mass",v:"65 g"}
        ]
    },
    "low-speed-rotor": {
        name: "Low-Speed Rotor", tag: "COAXIAL GEAR", color: "#3b82f6",
        desc: "Outer rotor with 17 pole pairs. Outputs amplified torque at reduced speed through magnetic field coupling.",
        working: "The outer rotor carries 17 pole pairs of permanent magnets on its inner surface. Through the modulation ring's harmonic coupling, it receives torque from the high-speed rotor at a 4.25:1 ratio. Output: 5.0 Nm at 150 RPM. The pull-out torque is 7.5 Nm — if overloaded beyond this, the magnetic coupling simply 'slips' without damage, providing inherent overload protection. This is impossible with mechanical gears.",
        dims: [
            {l:"Outer Ø",v:"70 mm"},{l:"Inner Ø",v:"50 mm"},{l:"Length",v:"40 mm"},
            {l:"Pole Pairs",v:"17"},{l:"Gear Ratio",v:"4.25:1"},{l:"Output Torque",v:"5.0 Nm"},
            {l:"Pull-out Torque",v:"7.5 Nm"},{l:"Output Speed",v:"150 RPM"},{l:"Efficiency",v:"95%"}
        ]
    },
    "output-shaft": {
        name: "Output Shaft", tag: "OUTPUT", color: "#8b5cf6",
        desc: "Central shaft connected to the low-speed rotor. Delivers final output torque to the load through SMA brake zone.",
        working: "The output shaft is machined from high-strength 17-4 PH stainless steel. It passes through the center of the coaxial gear assembly, keyed to the low-speed rotor. The shaft surface in the brake zone is precision-ground to Ra 0.2μm for optimal SMA wire contact. A splined end connects to the load.",
        dims: [
            {l:"Diameter",v:"12 mm"},{l:"Total Length",v:"95 mm"},{l:"Material",v:"17-4PH SS"},
            {l:"Brake Zone Ø",v:"30 mm"},{l:"Surface Ra",v:"0.2 μm"},{l:"Max Torque",v:"7.5 Nm"},
            {l:"Keyway",v:"3×3 mm"},{l:"Bearing Type",v:"Deep Groove"},{l:"Mass",v:"40 g"}
        ]
    },
    "sma-wires": {
        name: "SMA Wires (Nitinol)", tag: "SMA BRAKE", color: "#22c55e",
        desc: "6 Nitinol shape memory alloy wires wrap the output shaft. When heated, they contract and lock the shaft position with near-zero power.",
        working: "Each Nitinol (NiTi) wire undergoes a solid-state phase transformation. At room temperature, the wire is in its Martensite phase (soft, elongated). When heated above 78°C (Austenite finish temperature) by passing ~0.5A current, the crystal structure transforms to Austenite — the wire contracts by 4% (6mm over 150mm length), clamping the brake drum with up to 3.6N per wire. 6 wires × 3.6N × 15mm radius = 5.5 Nm holding torque. Total holding power: only 3.5W vs 50W for running the motor.",
        dims: [
            {l:"Wire Ø",v:"0.5 mm"},{l:"Length",v:"150 mm"},{l:"Count",v:"6 wires"},
            {l:"Material",v:"Nitinol NiTi"},{l:"Max Strain",v:"4%"},{l:"Contraction",v:"6 mm"},
            {l:"Af Temp",v:"78°C"},{l:"As Temp",v:"68°C"},{l:"Hold Power",v:"3.5 W"},
            {l:"Resistance",v:"764 Ω"},{l:"Force/Wire",v:"3.6 N"},{l:"Hold Torque",v:"5.5 Nm"}
        ]
    },
    "brake-drum": {
        name: "Brake Drum", tag: "SMA BRAKE", color: "#78716c",
        desc: "Precision-ground drum surface on the output shaft where SMA wires clamp to hold position.",
        working: "The brake drum is an integral section of the output shaft with an enlarged diameter (30mm) and precision-ground surface. When SMA wires contract, they press against this drum via ceramic-lined friction pads, creating a friction lock. The drum material (17-4PH) provides excellent wear resistance. The coefficient of friction is 0.45 (dry ceramic-on-steel), ensuring reliable holding even in the presence of vibration.",
        dims: [
            {l:"Drum Ø",v:"30 mm"},{l:"Width",v:"12 mm"},{l:"Surface",v:"Ground"},
            {l:"Roughness",v:"Ra 0.2μm"},{l:"Friction μ",v:"0.45"},{l:"Max Hold",v:"5.5 Nm"},
            {l:"Material",v:"17-4PH SS"},{l:"Pad Type",v:"Ceramic"},{l:"Mass",v:"25 g"}
        ]
    }
};

// ── STATE ───────────────────────────────────────────────────
const state = {
    mode: 'standby', // standby, running, holding, transition
    rpm: 0, targetRpm: 75, torque: 0, targetTorque: 2.5,
    power: 0, efficiency: 0,
    smaTemp: 25, smaForce: 0, smaContraction: 0,
    rotation: 0, hsRotation: 0, lsRotation: 0,
    zoom: 1, panX: 0, panY: 0,
    exploded: false, explodeProgress: 0,
    selectedComponent: null, hoveredComponent: null,
    time: 0, chartData: [], dragging: false, dragStart: {x:0,y:0}
};

// ── CANVAS SETUP ────────────────────────────────────────────
const canvas = document.getElementById('motor-canvas');
const ctx = canvas.getContext('2d');
let W, H;

function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ── DRAWING HELPERS ─────────────────────────────────────────
function drawRing(cx, cy, rOuter, rInner, color, alpha=1, segments=0, segAngle=0, rot=0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    if (segments > 0) {
        const gap = 0.008;
        for (let i = 0; i < segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            const aEnd = ((i + 1) / segments) * Math.PI * 2 - gap;
            ctx.beginPath();
            ctx.arc(0, 0, rOuter, a, aEnd);
            ctx.arc(0, 0, rInner, aEnd, a, true);
            ctx.closePath();
            ctx.fillStyle = i % 2 === 0 ? color : shiftColor(color, 20);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56,189,248,0.15)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    } else {
        ctx.beginPath();
        ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
        ctx.arc(0, 0, rInner, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(56,189,248,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.restore();
}

function shiftColor(hex, amount) {
    let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, r + amount); g = Math.min(255, g + amount); b = Math.min(255, b + amount);
    return `rgb(${r},${g},${b})`;
}

function drawMagnets(cx, cy, radius, count, rot, size, colors=['#ef4444','#3b82f6']) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const y = Math.sin(a) * radius;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? colors[0] : colors[1];
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
    ctx.restore();
}

function drawCoils(cx, cy, rInner, rOuter, count, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const aMid = a + Math.PI / count;
        ctx.save();
        ctx.rotate(aMid);
        const w = (rOuter - rInner) * 0.7;
        const h = (2 * Math.PI * ((rInner + rOuter)/2) / count) * 0.6;
        const rx = rInner + (rOuter - rInner) * 0.5 - w / 2;
        // Coil color: alternate copper tones
        const grad = ctx.createLinearGradient(rx, -h/2, rx+w, h/2);
        grad.addColorStop(0, '#d97706');
        grad.addColorStop(0.5, '#f59e0b');
        grad.addColorStop(1, '#b45309');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(rx, -h/2, w, h, 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,200,50,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
    }
    ctx.restore();
}

function drawSMAWires(cx, cy, radius, count, temp, contraction) {
    ctx.save();
    ctx.translate(cx, cy);
    const heatFrac = Math.max(0, Math.min(1, (temp - 25) / 55));
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const r = radius - contraction * 0.3;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        // Wire glow
        if (heatFrac > 0) {
            ctx.beginPath();
            ctx.arc(x, y, 4 + heatFrac * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(239,68,68,${heatFrac * 0.3})`;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        const r_ = Math.round(34 + heatFrac * 205);
        const g_ = Math.round(197 - heatFrac * 140);
        const b_ = Math.round(94 - heatFrac * 50);
        ctx.fillStyle = `rgb(${r_},${g_},${b_})`;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
    ctx.restore();
}

function drawShaft(cx, cy, length, width, rot) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const grad = ctx.createLinearGradient(0, -width/2, 0, width/2);
    grad.addColorStop(0, '#94a3b8');
    grad.addColorStop(0.3, '#cbd5e1');
    grad.addColorStop(0.5, '#e2e8f0');
    grad.addColorStop(0.7, '#cbd5e1');
    grad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-length/2, -width/2, length, width, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,189,248,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

function drawLabel(x, y, text, targetX, targetY, color='rgba(56,189,248,0.7)') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(10,14,23,0.85)';
    ctx.font = '600 10px "JetBrains Mono"';
    const w = ctx.measureText(text).width + 10;
    ctx.fillRect(x - w/2, y - 8, w, 16);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - w/2, y - 8, w, 16);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
}

// ── MAIN MOTOR DRAWING ─────────────────────────────────────
function drawMotor() {
    ctx.save();
    const cx = W / 2 + state.panX;
    const cy = H / 2 + state.panY;
    ctx.translate(cx, cy);
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(-cx, -cy);

    const ep = state.explodeProgress;
    const scale = state.zoom;

    // Section positions (exploded offsets)
    const sec1X = cx - 180 * ep; // BLDC Motor section
    const sec2X = cx;             // Magnetic Gear section
    const sec3X = cx + 180 * ep; // Output/SMA section

    const baseY = cy;

    // Highlight logic
    const sel = state.selectedComponent;
    const hov = state.hoveredComponent;

    function getAlpha(comp) {
        if (!sel && !hov) return 1;
        if (sel === comp || hov === comp) return 1;
        return 0.25;
    }

    // ── SECTION 1: FLAT BLDC MOTOR ──
    // Stator (outer housing with coils)
    drawRing(sec1X, baseY, 85, 65, '#1e293b', getAlpha('stator'));
    drawCoils(sec1X, baseY, 65, 85, 8, 0);
    ctx.globalAlpha = getAlpha('stator');

    // Stator outline
    drawRing(sec1X, baseY, 88, 86, '#334155', getAlpha('stator'));

    // Rotor (inner with magnets)
    drawRing(sec1X, baseY, 60, 30, '#1e1e2e', getAlpha('rotor'), 0, 0, state.hsRotation);
    drawMagnets(sec1X, baseY, 48, 16, state.hsRotation, 5);
    ctx.globalAlpha = 1;

    // Center shaft bore
    drawRing(sec1X, baseY, 28, 10, '#0f172a', getAlpha('rotor'), 0, 0, state.hsRotation);

    // ── SECTION 2: COAXIAL MAGNETIC GEAR ──
    // Outer (low-speed) rotor
    drawRing(sec2X, baseY, 100, 80, '#1a1a3a', getAlpha('low-speed-rotor'), 0, 0, state.lsRotation);
    drawMagnets(sec2X, baseY, 88, 34, state.lsRotation, 3.5, ['#3b82f6','#60a5fa']);

    // Modulation ring (stationary)
    drawRing(sec2X, baseY, 76, 62, '#3f3f46', getAlpha('modulation-ring'), 21, 0, 0);

    // Inner (high-speed) rotor
    drawRing(sec2X, baseY, 58, 35, '#2d1b4e', getAlpha('high-speed-rotor'), 0, 0, state.hsRotation);
    drawMagnets(sec2X, baseY, 46, 8, state.hsRotation, 5, ['#a855f7','#c084fc']);

    // Center shaft
    drawRing(sec2X, baseY, 30, 10, '#0f172a', getAlpha('output-shaft'), 0, 0, state.lsRotation);

    // ── SECTION 3: OUTPUT SHAFT & SMA BRAKE ──
    // Brake drum housing
    drawRing(sec3X, baseY, 80, 60, '#27272a', getAlpha('brake-drum'));

    // SMA wires
    drawSMAWires(sec3X, baseY, 50, 6, state.smaTemp, state.smaContraction);

    // Inner drum surface
    drawRing(sec3X, baseY, 42, 30, '#3f3f46', getAlpha('brake-drum'), 0, 0, state.lsRotation);

    // Output shaft extending right
    drawShaft(sec3X + 60, baseY, 80, 16, 0);

    // ── DIMENSION LINES (when zoomed or exploded) ──
    if (ep > 0.3 || scale > 1.3) {
        const la = Math.min(1, (ep > 0.3 ? (ep - 0.3) / 0.5 : (scale - 1.3) / 0.5));
        ctx.globalAlpha = la;

        // Section labels
        drawLabel(sec1X, baseY - 120, 'FLAT BLDC MOTOR', sec1X, baseY - 92, 'rgba(249,115,22,0.8)');
        drawLabel(sec2X, baseY - 130, 'COAXIAL MAGNETIC GEAR', sec2X, baseY - 105, 'rgba(168,85,247,0.8)');
        drawLabel(sec3X, baseY - 120, 'SMA BRAKE SYSTEM', sec3X, baseY - 85, 'rgba(34,197,94,0.8)');

        // Component labels
        drawLabel(sec1X - 70, baseY - 95, 'Stator Coils', sec1X - 55, baseY - 70);
        drawLabel(sec1X + 70, baseY + 95, 'Rotor Magnets', sec1X + 40, baseY + 45);
        drawLabel(sec2X + 95, baseY - 70, 'Low-Speed Rotor (17pp)', sec2X + 85, baseY - 40);
        drawLabel(sec2X - 95, baseY + 70, 'Modulation Ring (21 seg)', sec2X - 62, baseY + 35);
        drawLabel(sec2X + 60, baseY + 95, 'High-Speed Rotor (4pp)', sec2X + 42, baseY + 50);
        drawLabel(sec3X - 80, baseY + 85, 'SMA Wires ×6', sec3X - 40, baseY + 42);
        drawLabel(sec3X + 60, baseY + 50, 'Output Shaft Ø12', sec3X + 60, baseY + 12);

        // Dimension: overall diameter
        ctx.strokeStyle = 'rgba(56,189,248,0.4)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([]);
        // Outer diameter arrow for gear section
        ctx.beginPath();
        ctx.moveTo(sec2X, baseY - 105);
        ctx.lineTo(sec2X - 100, baseY - 105);
        ctx.moveTo(sec2X, baseY - 105);
        ctx.lineTo(sec2X + 100, baseY - 105);
        ctx.stroke();
        ctx.fillStyle = 'rgba(56,189,248,0.5)';
        ctx.font = '500 9px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText('Ø70 mm', sec2X, baseY - 110);
        ctx.globalAlpha = 1;
    }

    // ── FIELD LINES (when running) ──
    if (state.mode === 'running' && state.rpm > 5) {
        const fieldAlpha = Math.min(0.3, state.rpm / 300);
        ctx.globalAlpha = fieldAlpha;
        const t = state.time;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 + t * 3;
            const r1 = 50, r2 = 88;
            ctx.beginPath();
            ctx.moveTo(sec2X + Math.cos(a) * r1, baseY + Math.sin(a) * r1);
            const cp1x = sec2X + Math.cos(a + 0.15) * (r1 + r2) / 2;
            const cp1y = baseY + Math.sin(a + 0.15) * (r1 + r2) / 2;
            ctx.quadraticCurveTo(cp1x, cp1y, sec2X + Math.cos(a + 0.3) * r2, baseY + Math.sin(a + 0.3) * r2);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    // ── CLICK/HOVER REGIONS ──
    state._regions = [
        { comp: 'stator', cx: sec1X, cy: baseY, rOut: 88, rIn: 65 },
        { comp: 'rotor', cx: sec1X, cy: baseY, rOut: 60, rIn: 10 },
        { comp: 'low-speed-rotor', cx: sec2X, cy: baseY, rOut: 100, rIn: 80 },
        { comp: 'modulation-ring', cx: sec2X, cy: baseY, rOut: 76, rIn: 62 },
        { comp: 'high-speed-rotor', cx: sec2X, cy: baseY, rOut: 58, rIn: 35 },
        { comp: 'output-shaft', cx: sec2X, cy: baseY, rOut: 30, rIn: 0 },
        { comp: 'sma-wires', cx: sec3X, cy: baseY, rOut: 58, rIn: 42 },
        { comp: 'brake-drum', cx: sec3X, cy: baseY, rOut: 80, rIn: 30 },
    ];

    ctx.restore();
}

// ── HIT TESTING ─────────────────────────────────────────────
function hitTest(mx, my) {
    if (!state._regions) return null;
    const cx = W/2 + state.panX, cy = H/2 + state.panY;
    for (const r of state._regions) {
        const dx = mx - r.cx, dy = my - r.cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist >= r.rIn * state.zoom && dist <= r.rOut * state.zoom) return r.comp;
    }
    return null;
}

// ── PHYSICS UPDATE ──────────────────────────────────────────
function updatePhysics(dt) {
    state.time += dt;
    const G = 4.25;
    if (state.mode === 'running') {
        state.rpm += (state.targetRpm - state.rpm) * dt * 2;
        state.torque += (state.targetTorque - state.torque) * dt * 3;
        const omega = state.rpm * 2 * Math.PI / 60;
        state.power = state.torque * omega;
        const Kt = 0.035, R = 1.2;
        const motorTorque = state.torque / (G * 0.95);
        const I = motorTorque / Kt;
        const Ploss = I * I * R * 2 + 0.002 * (omega * G) ** 2;
        state.efficiency = state.power > 0.1 ? (state.power / (state.power + Ploss)) * 100 : 0;
        // SMA cooling
        state.smaTemp += (25 - state.smaTemp) * dt * 0.5;
        state.smaForce *= (1 - dt * 2);
        state.smaContraction *= (1 - dt * 2);
    } else if (state.mode === 'holding') {
        state.rpm *= (1 - dt * 5);
        if (state.rpm < 0.5) state.rpm = 0;
        state.smaTemp += (83 - state.smaTemp) * dt * 1.5;
        const heatFrac = Math.max(0, Math.min(1, (state.smaTemp - 68) / 10));
        state.smaForce = heatFrac * 100;
        state.smaContraction = heatFrac * 6;
        state.power = 3.5 * heatFrac;
        state.torque = state.targetTorque * (1 - heatFrac * 0.02); // holds
        state.efficiency = 0;
    } else if (state.mode === 'transition') {
        state.smaTemp += (83 - state.smaTemp) * dt * 2;
        state.rpm *= (1 - dt * 3);
        if (state.smaTemp > 78 && state.rpm < 2) {
            state.mode = 'holding';
        }
    } else {
        state.rpm *= (1 - dt * 3);
        state.torque *= (1 - dt * 3);
        state.power *= (1 - dt * 3);
        state.smaTemp += (25 - state.smaTemp) * dt * 0.3;
        state.smaForce *= (1 - dt);
        state.smaContraction *= (1 - dt);
    }
    // Rotations
    const rpmRad = state.rpm * 2 * Math.PI / 60;
    state.lsRotation += rpmRad * dt;
    state.hsRotation += rpmRad * G * dt;

    // Explode animation
    const targetExplode = state.exploded ? 1 : 0;
    state.explodeProgress += (targetExplode - state.explodeProgress) * dt * 4;

    // Chart data
    if (state.chartData.length > 200) state.chartData.shift();
    state.chartData.push({ rpm: state.rpm, torque: state.torque, power: state.power });
}

// ── UI UPDATE ───────────────────────────────────────────────
function updateUI() {
    document.getElementById('rpm-display').textContent = Math.round(state.rpm);
    document.getElementById('torque-display').textContent = state.torque.toFixed(1) + ' Nm';
    document.getElementById('power-display').textContent = state.power.toFixed(1) + ' W';
    document.getElementById('hud-mode').textContent = 'MODE: ' + state.mode.toUpperCase();
    document.getElementById('hud-zoom').textContent = 'ZOOM: ' + state.zoom.toFixed(1) + '×';
    document.getElementById('hud-efficiency').textContent = 'η: ' + (state.efficiency > 0 ? state.efficiency.toFixed(1) + '%' : '—');
    document.getElementById('hud-temp').textContent = 'SMA: ' + Math.round(state.smaTemp) + '°C';

    const dot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    dot.className = 'dot ' + (state.mode === 'running' ? 'running' : state.mode === 'holding' ? 'holding' : '');
    statusText.textContent = state.mode.toUpperCase();

    // SMA bars
    const tempPct = Math.min(100, ((state.smaTemp - 25) / 60) * 100);
    document.getElementById('sma-temp-bar').style.width = tempPct + '%';
    document.getElementById('sma-temp-val').textContent = Math.round(state.smaTemp) + '°C';
    document.getElementById('sma-force-bar').style.width = Math.min(100, state.smaForce) + '%';
    document.getElementById('sma-force-val').textContent = Math.round(state.smaForce) + '%';
    document.getElementById('sma-contract-bar').style.width = Math.min(100, (state.smaContraction / 6) * 100) + '%';
    document.getElementById('sma-contract-val').textContent = state.smaContraction.toFixed(1) + ' mm';

    const phase = state.smaTemp > 78 ? 'AUSTENITE (Hot — Contracted)' : state.smaTemp > 68 ? 'TRANSFORMING...' : 'MARTENSITE (Cool)';
    document.getElementById('sma-phase-text').textContent = phase;

    // Power flow
    const pIn = state.power > 0.1 ? (state.power / (state.efficiency / 100 || 1)).toFixed(1) : '0';
    document.getElementById('pf-elec').textContent = pIn + ' W';
    document.getElementById('pf-output').textContent = state.power.toFixed(1) + ' W';

    // Viewport class
    const vp = document.getElementById('viewport');
    vp.className = state.mode === 'running' ? 'running' : state.mode === 'holding' ? 'holding' : '';
}

// ── GAUGES ──────────────────────────────────────────────────
function drawGauge(canvasId, value, max, unit, color) {
    const c = document.getElementById(canvasId);
    const g = c.getContext('2d');
    const w = c.width, h = c.height;
    g.clearRect(0, 0, w, h);
    const cx = w/2, cy = h/2, r = 45;
    const startA = 0.75 * Math.PI, endA = 2.25 * Math.PI;
    // Background arc
    g.beginPath();
    g.arc(cx, cy, r, startA, endA);
    g.strokeStyle = 'rgba(56,189,248,0.1)';
    g.lineWidth = 8;
    g.lineCap = 'round';
    g.stroke();
    // Value arc
    const valA = startA + (Math.min(value, max) / max) * (endA - startA);
    g.beginPath();
    g.arc(cx, cy, r, startA, valA);
    g.strokeStyle = color;
    g.lineWidth = 8;
    g.lineCap = 'round';
    g.stroke();
    // Glow
    g.shadowColor = color;
    g.shadowBlur = 10;
    g.beginPath();
    g.arc(cx, cy, r, valA - 0.05, valA);
    g.strokeStyle = color;
    g.lineWidth = 8;
    g.lineCap = 'round';
    g.stroke();
    g.shadowBlur = 0;
    // Text
    g.fillStyle = '#e2e8f0';
    g.font = '700 18px Orbitron';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(Math.round(value), cx, cy - 4);
    g.fillStyle = '#64748b';
    g.font = '400 9px "JetBrains Mono"';
    g.fillText(unit, cx, cy + 14);
}

// ── LIVE CHART ──────────────────────────────────────────────
function drawLiveChart() {
    const c = document.getElementById('live-chart');
    const g = c.getContext('2d');
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * devicePixelRatio;
    c.height = h * devicePixelRatio;
    g.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    g.clearRect(0, 0, w, h);
    const data = state.chartData;
    if (data.length < 2) return;
    // Draw RPM line
    g.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = (i / 200) * w;
        const y = h - (data[i].rpm / 160) * h;
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.strokeStyle = '#38bdf8';
    g.lineWidth = 1.5;
    g.stroke();
    // Draw power line
    g.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = (i / 200) * w;
        const y = h - (data[i].power / 100) * h;
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.strokeStyle = '#22c55e';
    g.lineWidth = 1;
    g.stroke();
}

// ── DETAIL MODAL ────────────────────────────────────────────
function openDetail(comp) {
    const info = COMPONENTS[comp];
    if (!info) return;
    document.getElementById('modal-title').textContent = info.name;
    document.getElementById('modal-tag').textContent = info.tag;
    document.getElementById('modal-working-text').textContent = info.working;

    const specsDiv = document.getElementById('modal-specs');
    specsDiv.innerHTML = `<div class="info-card"><div class="info-body"><p class="info-desc">${info.desc}</p></div></div>`;

    const dimGrid = document.getElementById('modal-dim-grid');
    dimGrid.innerHTML = info.dims.map(d => `<div class="dim-item"><span class="dim-label">${d.l}</span><span class="dim-value">${d.v}</span></div>`).join('');

    // Draw detail canvas
    drawDetailComponent(comp);

    document.getElementById('detail-modal').classList.add('visible');
}

function drawDetailComponent(comp) {
    const c = document.getElementById('detail-canvas');
    const g = c.getContext('2d');
    c.width = 500; c.height = 400;
    g.clearRect(0, 0, 500, 400);
    const cx = 250, cy = 200;

    // Blueprint grid
    g.strokeStyle = 'rgba(56,189,248,0.06)';
    g.lineWidth = 0.5;
    for (let x = 0; x < 500; x += 20) { g.beginPath(); g.moveTo(x,0); g.lineTo(x,400); g.stroke(); }
    for (let y = 0; y < 400; y += 20) { g.beginPath(); g.moveTo(0,y); g.lineTo(500,y); g.stroke(); }

    const info = COMPONENTS[comp];
    g.save();
    // Draw enlarged version of the component
    switch(comp) {
        case 'stator':
            drawRingOn(g, cx, cy, 140, 100, '#1e293b', 1);
            // Draw coils enlarged
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                const mr = 120;
                const x = cx + Math.cos(a) * mr, y = cy + Math.sin(a) * mr;
                g.beginPath(); g.arc(x, y, 14, 0, Math.PI*2);
                const grad = g.createRadialGradient(x,y,2,x,y,14);
                grad.addColorStop(0,'#f59e0b'); grad.addColorStop(1,'#b45309');
                g.fillStyle = grad; g.fill();
                g.strokeStyle='rgba(255,200,50,0.4)'; g.lineWidth=1; g.stroke();
            }
            drawRingOn(g, cx, cy, 145, 142, '#334155', 1);
            // Labels
            drawDimLine(g, cx, cy-145, cx, cy-100, '45mm', -60);
            drawDimLine(g, cx, cy+100, cx, cy+145, '', 60);
            break;
        case 'rotor':
            drawRingOn(g, cx, cy, 100, 40, '#1e1e2e', 1);
            for (let i = 0; i < 16; i++) {
                const a = (i/16)*Math.PI*2;
                const r = 75;
                g.beginPath(); g.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 8, 0, Math.PI*2);
                g.fillStyle = i%2===0?'#ef4444':'#3b82f6'; g.fill();
            }
            drawDimLine(g, cx-100, cy, cx+100, cy, 'Ø46mm', 0);
            break;
        case 'high-speed-rotor':
            drawRingOn(g, cx, cy, 110, 55, '#2d1b4e', 1);
            for (let i = 0; i < 8; i++) {
                const a = (i/8)*Math.PI*2; const r = 85;
                g.beginPath(); g.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 10, 0, Math.PI*2);
                g.fillStyle = i%2===0?'#a855f7':'#c084fc'; g.fill();
            }
            break;
        case 'modulation-ring':
            for (let i = 0; i < 21; i++) {
                const a1 = (i/21)*Math.PI*2, a2 = ((i+0.85)/21)*Math.PI*2;
                g.beginPath(); g.arc(cx,cy,130,a1,a2); g.arc(cx,cy,95,a2,a1,true); g.closePath();
                g.fillStyle = i%2===0?'#52525b':'#3f3f46'; g.fill();
                g.strokeStyle='rgba(56,189,248,0.15)'; g.lineWidth=0.5; g.stroke();
            }
            break;
        case 'low-speed-rotor':
            drawRingOn(g, cx, cy, 140, 110, '#1a1a3a', 1);
            for (let i = 0; i < 34; i++) {
                const a = (i/34)*Math.PI*2; const r = 124;
                g.beginPath(); g.arc(cx+Math.cos(a)*r, cy+Math.sin(a)*r, 5, 0, Math.PI*2);
                g.fillStyle = i%2===0?'#3b82f6':'#60a5fa'; g.fill();
            }
            break;
        case 'sma-wires':
            // Draw a schematic of SMA phase transformation
            drawRingOn(g, cx, cy, 80, 55, '#27272a', 0.5);
            for (let i = 0; i < 6; i++) {
                const a = (i/6)*Math.PI*2; const r = 67;
                const x = cx+Math.cos(a)*r, y = cy+Math.sin(a)*r;
                g.beginPath(); g.arc(x,y,8,0,Math.PI*2);
                g.fillStyle='#22c55e'; g.fill();
                g.strokeStyle='rgba(255,255,255,0.5)'; g.lineWidth=1; g.stroke();
                // Label
                g.fillStyle='rgba(56,189,248,0.7)';
                g.font='500 8px "JetBrains Mono"';
                g.textAlign='center';
                g.fillText('Ø0.5mm', cx+Math.cos(a)*100, cy+Math.sin(a)*100);
            }
            // Phase diagram below
            g.fillStyle='rgba(56,189,248,0.6)'; g.font='600 11px "JetBrains Mono"'; g.textAlign='center';
            g.fillText('MARTENSITE → [Heat 68-78°C] → AUSTENITE', cx, cy+150);
            g.fillText('(Relaxed)                           (Contracted 4%)', cx, cy+168);
            break;
        case 'output-shaft':
            g.fillStyle='#94a3b8';
            g.beginPath(); g.roundRect(cx-180, cy-12, 360, 24, 4); g.fill();
            // Brake drum zone
            g.fillStyle='#52525b';
            g.beginPath(); g.roundRect(cx+40, cy-22, 50, 44, 3); g.fill();
            g.strokeStyle='rgba(56,189,248,0.3)'; g.lineWidth=1; g.stroke();
            drawDimLine(g, cx-180, cy-30, cx+180, cy-30, '95mm total', 0);
            break;
        case 'brake-drum':
            drawRingOn(g, cx, cy, 120, 85, '#27272a', 1);
            drawRingOn(g, cx, cy, 80, 50, '#3f3f46', 1);
            break;
    }
    g.restore();
}

function drawRingOn(g, cx, cy, rO, rI, color, alpha) {
    g.globalAlpha = alpha;
    g.beginPath(); g.arc(cx,cy,rO,0,Math.PI*2); g.arc(cx,cy,rI,0,Math.PI*2,true); g.closePath();
    g.fillStyle = color; g.fill();
    g.strokeStyle='rgba(56,189,248,0.2)'; g.lineWidth=1; g.stroke();
    g.globalAlpha = 1;
}

function drawDimLine(g, x1,y1,x2,y2, text, offset) {
    g.strokeStyle='rgba(56,189,248,0.4)'; g.lineWidth=0.8; g.setLineDash([3,3]);
    g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); g.setLineDash([]);
    g.fillStyle='rgba(56,189,248,0.6)'; g.font='500 9px "JetBrains Mono"';
    g.textAlign='center'; g.fillText(text, (x1+x2)/2, (y1+y2)/2 + offset);
}

// ── UPDATE COMPONENT INFO PANEL ─────────────────────────────
function updateInfoPanel(comp) {
    const info = COMPONENTS[comp];
    if (!info) return;
    const infoContent = document.getElementById('info-content');
    infoContent.innerHTML = `
        <div class="info-header">
            <h4>${info.name}</h4>
            <span class="info-tag">${info.tag}</span>
        </div>
        <div class="info-body">
            <p class="info-desc">${info.desc}</p>
            <div class="spec-grid">
                ${info.dims.slice(0,8).map(d => `<div class="spec-item"><span class="spec-label">${d.l}</span><span class="spec-value">${d.v}</span></div>`).join('')}
            </div>
        </div>`;
}

// ── EVENT HANDLERS ──────────────────────────────────────────
document.getElementById('btn-run').addEventListener('click', () => {
    state.mode = 'running';
    document.getElementById('btn-run').classList.add('active');
});

document.getElementById('btn-hold').addEventListener('click', () => {
    if (state.mode === 'running') state.mode = 'transition';
    else state.mode = 'holding';
});

document.getElementById('btn-stop').addEventListener('click', () => {
    state.mode = 'standby';
    document.getElementById('btn-run').classList.remove('active');
});

document.getElementById('speed-slider').addEventListener('input', e => {
    state.targetRpm = +e.target.value;
    document.getElementById('speed-target-label').textContent = e.target.value + ' RPM';
});

document.getElementById('torque-slider').addEventListener('input', e => {
    state.targetTorque = +e.target.value;
    document.getElementById('torque-target-label').textContent = (+e.target.value).toFixed(1) + ' Nm';
});

document.getElementById('btn-full').addEventListener('click', () => {
    state.exploded = false;
    document.getElementById('btn-full').classList.add('active');
    document.getElementById('btn-exploded').classList.remove('active');
});

document.getElementById('btn-exploded').addEventListener('click', () => {
    state.exploded = true;
    document.getElementById('btn-exploded').classList.add('active');
    document.getElementById('btn-full').classList.remove('active');
});

// Zoom
document.getElementById('zoom-in').addEventListener('click', () => { state.zoom = Math.min(3, state.zoom + 0.25); });
document.getElementById('zoom-out').addEventListener('click', () => { state.zoom = Math.max(0.5, state.zoom - 0.25); });
document.getElementById('zoom-reset').addEventListener('click', () => { state.zoom = 1; state.panX = 0; state.panY = 0; });

canvas.addEventListener('wheel', e => {
    e.preventDefault();
    state.zoom = Math.max(0.5, Math.min(3, state.zoom - e.deltaY * 0.001));
});

// Pan
canvas.addEventListener('mousedown', e => { state.dragging = true; state.dragStart = {x: e.clientX - state.panX, y: e.clientY - state.panY}; });
canvas.addEventListener('mousemove', e => {
    if (state.dragging) {
        state.panX = e.clientX - state.dragStart.x;
        state.panY = e.clientY - state.dragStart.y;
    } else {
        const rect = canvas.getBoundingClientRect();
        state.hoveredComponent = hitTest(e.clientX - rect.left, e.clientY - rect.top);
        canvas.style.cursor = state.hoveredComponent ? 'pointer' : 'grab';
    }
});
canvas.addEventListener('mouseup', () => { state.dragging = false; });
canvas.addEventListener('mouseleave', () => { state.dragging = false; state.hoveredComponent = null; });

// Click to select & open detail
canvas.addEventListener('dblclick', e => {
    const rect = canvas.getBoundingClientRect();
    const comp = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (comp) openDetail(comp);
});

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const comp = hitTest(e.clientX - rect.left, e.clientY - rect.top);
    if (comp) {
        state.selectedComponent = comp;
        updateInfoPanel(comp);
        document.querySelectorAll('.component-btn').forEach(b => b.classList.toggle('active', b.dataset.component === comp));
    }
});

// Component buttons
document.querySelectorAll('.component-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const comp = btn.dataset.component;
        state.selectedComponent = comp;
        updateInfoPanel(comp);
        document.querySelectorAll('.component-btn').forEach(b => b.classList.toggle('active', b.dataset.component === comp));
    });
    btn.addEventListener('dblclick', () => openDetail(btn.dataset.component));
});

// Modal close
document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('detail-modal').classList.remove('visible');
});
document.getElementById('detail-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) document.getElementById('detail-modal').classList.remove('visible');
});

// ── MAIN LOOP ───────────────────────────────────────────────
let lastTime = performance.now();
function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    updatePhysics(dt);

    ctx.clearRect(0, 0, W, H);
    drawMotor();
    updateUI();
    drawGauge('gauge-speed', state.rpm, 160, 'RPM', '#38bdf8');
    drawGauge('gauge-torque', state.torque, 5.5, 'Nm', '#a855f7');
    drawLiveChart();

    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
