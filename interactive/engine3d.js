import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ================================================================
   COMPONENT SPEC DATA
   ================================================================ */
const SPECS = {
    stator: { name:"Stator", tag:"BLDC MOTOR", color:0xf97316,
        desc:"Fixed copper windings (8 pole pairs) on laminated silicon-steel core. Creates rotating magnetic field via 3-phase trapezoidal BEMF commutation.",
        dims:[{l:"Outer Ø",v:"45 mm"},{l:"Inner Ø",v:"24 mm"},{l:"Length",v:"15 mm"},{l:"Poles",v:"8 pairs"},{l:"Phase R",v:"1.2 Ω"},{l:"Core",v:"M19 Si-Steel"},{l:"Wire",v:"AWG 22"},{l:"Mass",v:"45 g"}]},
    rotor: { name:"Rotor (BLDC)", tag:"BLDC MOTOR", color:0xef4444,
        desc:"Surface-mounted NdFeB N42 permanent magnets (Br=1.3T). Direct-coupled to high-speed gear rotor.",
        dims:[{l:"Outer Ø",v:"23 mm"},{l:"Inner Ø",v:"8 mm"},{l:"Length",v:"15 mm"},{l:"Magnets",v:"N42 NdFeB"},{l:"Br",v:"1.3 T"},{l:"Kt",v:"0.035 Nm/A"},{l:"Max RPM",v:"6545"},{l:"Mass",v:"35 g"}]},
    highSpeedRotor: { name:"High-Speed Rotor", tag:"COAXIAL GEAR", color:0xa855f7,
        desc:"Inner gear rotor with 4 pole pairs. Spins at motor speed, couples magnetically through modulation ring.",
        dims:[{l:"Outer Ø",v:"40 mm"},{l:"Inner Ø",v:"24 mm"},{l:"Length",v:"40 mm"},{l:"Poles",v:"4 pairs"},{l:"Magnets",v:"8 arcs"},{l:"Input RPM",v:"638"},{l:"Torque",v:"1.24 Nm"},{l:"Gap",v:"1 mm"}]},
    modulationRing: { name:"Modulation Ring", tag:"COAXIAL GEAR", color:0x64748b,
        desc:"21 stationary ferromagnetic segments. Modulates field harmonics for contactless torque transfer between rotors.",
        dims:[{l:"Outer Ø",v:"48 mm"},{l:"Inner Ø",v:"42 mm"},{l:"Length",v:"40 mm"},{l:"Segments",v:"21"},{l:"Width",v:"3 mm"},{l:"Material",v:"SMC Fe"},{l:"Gap",v:"1 mm"},{l:"Mass",v:"65 g"}]},
    lowSpeedRotor: { name:"Low-Speed Rotor", tag:"COAXIAL GEAR", color:0x3b82f6,
        desc:"Outer gear rotor with 17 pole pairs. Outputs 85.0 Nm at 60 RPM. Pull-out torque 7.5 Nm provides overload protection.",
        dims:[{l:"Outer Ø",v:"70 mm"},{l:"Inner Ø",v:"50 mm"},{l:"Length",v:"40 mm"},{l:"Poles",v:"17 pairs"},{l:"Ratio",v:"4.25:1"},{l:"Output",v:"85.0 Nm"},{l:"Pull-out",v:"7.5 Nm"},{l:"η",v:"95%"}]},
    outputShaft: { name:"Output Shaft", tag:"OUTPUT", color:0x8b5cf6,
        desc:"17-4PH stainless steel shaft. Precision-ground brake zone surface (Ra 0.2μm) for SMA wire clamping.",
        dims:[{l:"Diameter",v:"12 mm"},{l:"Length",v:"95 mm"},{l:"Material",v:"17-4PH SS"},{l:"Brake Ø",v:"30 mm"},{l:"Ra",v:"0.2 μm"},{l:"Max Torque",v:"7.5 Nm"},{l:"Keyway",v:"3×3 mm"},{l:"Mass",v:"40 g"}]},
    smaWires: { name:"SMA Wires (Nitinol)", tag:"SMA BRAKE", color:0x22c55e,
        desc:"6 Nitinol wires contract 4% when heated past 78°C, clamping the brake drum. 100 Nm hold torque at only 3.5W.",
        dims:[{l:"Wire Ø",v:"0.5 mm"},{l:"Length",v:"150 mm"},{l:"Count",v:"6"},{l:"Strain",v:"4%"},{l:"Contract.",v:"6 mm"},{l:"Af",v:"78°C"},{l:"Force/wire",v:"3.6 N"},{l:"Hold",v:"100 Nm"}]},
    brakeDrum: { name:"Brake Drum", tag:"SMA BRAKE", color:0x78716c,
        desc:"30mm precision-ground drum on output shaft. Ceramic friction pads provide μ=0.45 for reliable position locking.",
        dims:[{l:"Drum Ø",v:"30 mm"},{l:"Width",v:"12 mm"},{l:"Surface",v:"Ground"},{l:"Ra",v:"0.2 μm"},{l:"μ",v:"0.45"},{l:"Pad",v:"Ceramic"},{l:"Hold",v:"100 Nm"},{l:"Mass",v:"25 g"}]}
};

/* ================================================================
   SIMULATION STATE
   ================================================================ */
const sim = {
    mode:'standby', rpm:0, targetRpm:75, torque:0, targetTorque:2.5,
    power:0, efficiency:0, smaTemp:25, smaForce:0, smaContraction:0,
    exploded:false, explodeT:0, crossSection:false, wireframe:false,
    selectedComp:null, time:0
};

// Chart History Buffer
const chartData = { rpm: [], torque: [], power: [], maxLen: 100 };
for(let i=0; i<100; i++) { chartData.rpm.push(0); chartData.torque.push(0); chartData.power.push(0); }
const chartCanvas = document.getElementById('perf-chart');
const ctxChart = chartCanvas.getContext('2d');

/* ================================================================
   THREE.JS SETUP — Photorealistic rendering
   ================================================================ */
const container = document.getElementById('three-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1d24);
scene.fog = new THREE.FogExp2(0x1a1d24, 0.001);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
camera.position.set(120, 80, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 30;
controls.maxDistance = 600;
controls.target.set(0, 0, 0);

/* ================================================================
   ENVIRONMENT MAP — for realistic metallic reflections
   ================================================================ */
const pmremGen = new THREE.PMREMGenerator(renderer);
pmremGen.compileEquirectangularShader();
// Procedural studio environment
const envScene = new THREE.Scene();
envScene.background = new THREE.Color(0x222228);
// Soft gradient lights baked into env
const envLight1 = new THREE.Mesh(new THREE.PlaneGeometry(200,200), new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide}));
envLight1.position.set(0,100,0); envLight1.rotation.x=Math.PI/2; envScene.add(envLight1);
const envLight2 = new THREE.Mesh(new THREE.PlaneGeometry(100,100), new THREE.MeshBasicMaterial({color:0x8899aa, side:THREE.DoubleSide}));
envLight2.position.set(100,30,0); envLight2.rotation.y=-Math.PI/2; envScene.add(envLight2);
const envLight3 = new THREE.Mesh(new THREE.PlaneGeometry(80,80), new THREE.MeshBasicMaterial({color:0x667788, side:THREE.DoubleSide}));
envLight3.position.set(-80,50,60); envLight3.lookAt(0,0,0); envScene.add(envLight3);
const envMap = pmremGen.fromScene(envScene, 0.04).texture;
scene.environment = envMap;

/* ================================================================
   LIGHTING — neutral studio for photorealism
   ================================================================ */
const ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
keyLight.position.set(80, 150, 80);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xdde4f0, 1.0);
fillLight.position.set(-80, 100, -60);
scene.add(fillLight);

const backLight = new THREE.DirectionalLight(0xffeedd, 0.6);
backLight.position.set(-30, 40, -100);
scene.add(backLight);

const rimLight = new THREE.PointLight(0xffffff, 0.8, 400);
rimLight.position.set(-100, 60, 0);
scene.add(rimLight);

const topLight = new THREE.PointLight(0xffffff, 0.5, 400);
topLight.position.set(0, 150, 0);
scene.add(topLight);

/* Ground grid — subtle */
const gridHelper = new THREE.GridHelper(300, 30, 0x333340, 0x25252d);
scene.add(gridHelper);

/* Axis lines */
const axMat = new THREE.LineBasicMaterial({ color: 0x556677, transparent: true, opacity: 0.15 });
for (const dir of [[150,0,0],[0,150,0],[0,0,150]]) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(...dir)]);
    scene.add(new THREE.Line(geo, axMat));
}

/* ================================================================
   MATERIALS — real-world industrial colors, PBR accurate
   ================================================================ */
function makeMat(color, metalness=0.4, roughness=0.5, emissiveColor=0x000000, emissiveIntensity=0) {
    return new THREE.MeshStandardMaterial({
        color, metalness, roughness, side: THREE.DoubleSide,
        emissive: new THREE.Color(emissiveColor), emissiveIntensity,
        envMapIntensity: 1.0
    });
}
// STATOR CORE: dark grey silicon steel laminations
const matStator  = makeMat(0x4a4e55, 0.7, 0.35);
// COPPER windings: real copper tone
const matCopper  = makeMat(0xb87333, 0.9, 0.2);
// MAGNETS: industrial N/S — darker, matte
const matMagnetN = makeMat(0xaa2020, 0.3, 0.55);
const matMagnetS = makeMat(0x2040aa, 0.3, 0.55);
// HIGH-SPEED ROTOR: machined steel
const matHSR     = makeMat(0x5a5e65, 0.75, 0.3);
// MODULATION RING: sintered iron (SMC)
const matMod     = makeMat(0x6a6e72, 0.65, 0.4);
// LOW-SPEED ROTOR: dark anodized aluminum
const matLSR     = makeMat(0x3a3e48, 0.7, 0.35);
// SHAFT: polished 17-4PH stainless
const matShaft   = makeMat(0xc8ccd2, 0.95, 0.08);
// BRAKE DRUM: ground carbon steel
const matDrum    = makeMat(0x7a7e82, 0.8, 0.2);
// SMA WIRES: Nitinol (silver-grey, shiny)
const matSMAcool = makeMat(0xb0b8c0, 0.85, 0.15);
const matSMAhot  = makeMat(0xdd4040, 0.4, 0.4, 0xff2200, 0.3);
// HOUSING: cast aluminum (gunmetal)
const matHousing = makeMat(0x555d65, 0.65, 0.35);
const matGlow    = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.12 });

/* ================================================================
   BUILD 3D GEOMETRY
   All dimensions in mm matching actual specs
   ================================================================ */
const groups = {};
const allMeshes = [];

function tag(mesh, compName) {
    mesh.userData.component = compName;
    allMeshes.push(mesh);
}

// Helper: bolt ring
const matBolt = makeMat(0xbbbbcc, 0.9, 0.15, 0x666666, 0.05);
function addBolts(parent, radius, count, bR, bH, comp, yOff=0) {
    for (let i = 0; i < count; i++) {
        const a = (i/count)*Math.PI*2;
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(bR, bR*0.85, bH, 6), matBolt);
        bolt.position.set(Math.cos(a)*radius, yOff, Math.sin(a)*radius);
        tag(bolt, comp); parent.add(bolt);
        const head = new THREE.Mesh(new THREE.CylinderGeometry(bR*1.6, bR*1.6, bH*0.3, 6), matBolt);
        head.position.set(Math.cos(a)*radius, yOff+bH*0.65, Math.sin(a)*radius);
        tag(head, comp); parent.add(head);
    }
}

// ── STATOR (BLDC) ──────────────────────────────────────
groups.stator = new THREE.Group();
groups.stator.userData.section = 'bldc';
// Core ring — chamfered edges
const stCorePts = [new THREE.Vector2(12,-7.5),new THREE.Vector2(22,-7.5),new THREE.Vector2(22.5,-7),new THREE.Vector2(22.5,7),new THREE.Vector2(22,7.5),new THREE.Vector2(12,7.5)];
const statorCore = new THREE.Mesh(new THREE.LatheGeometry(stCorePts, 64), matStator);
tag(statorCore, 'stator'); groups.stator.add(statorCore);
// Lamination rings
const lamMat = makeMat(0x333338, 0.6, 0.5);
for (let y = -6; y <= 6; y += 1.5) {
    const lam = new THREE.Mesh(new THREE.TorusGeometry(22.6, 0.12, 4, 64), lamMat);
    lam.rotation.x = Math.PI/2; lam.position.y = y;
    tag(lam, 'stator'); groups.stator.add(lam);
}
// Copper coils — double wound
for (let i = 0; i < 8; i++) {
    const a = (i/8)*Math.PI*2;
    for (const [r,tr] of [[3.2,1.0],[2.4,0.7]]) {
        const coil = new THREE.Mesh(new THREE.TorusGeometry(r, tr, 8, 16), matCopper);
        coil.position.set(Math.cos(a)*17.5, 0, Math.sin(a)*17.5);
        coil.rotation.y = a+Math.PI/2; coil.rotation.x = Math.PI/2;
        tag(coil, 'stator'); groups.stator.add(coil);
    }
}
// Housing — chamfered with cooling fins
const hPts = [new THREE.Vector2(22.8,-8.5),new THREE.Vector2(24,-8.5),new THREE.Vector2(24.5,-8),new THREE.Vector2(24.5,8),new THREE.Vector2(24,8.5),new THREE.Vector2(22.8,8.5)];
const housing = new THREE.Mesh(new THREE.LatheGeometry(hPts, 64), matHousing);
tag(housing, 'stator'); groups.stator.add(housing);
// Cooling fins
for (let i = 0; i < 16; i++) {
    const a = (i/16)*Math.PI*2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 14, 0.5), makeMat(0x4a5058,0.7,0.3));
    fin.position.set(Math.cos(a)*25.2, 0, Math.sin(a)*25.2); fin.rotation.y = -a;
    tag(fin, 'stator'); groups.stator.add(fin);
}
// End-bells with bearing pocket
const ebPts = [new THREE.Vector2(7,-1.25),new THREE.Vector2(24,-1.25),new THREE.Vector2(24.5,-0.75),new THREE.Vector2(24.5,0.75),new THREE.Vector2(24,1.25),new THREE.Vector2(7,1.25)];
for (const yOff of [9.5, -9.5]) {
    const eb = new THREE.Mesh(new THREE.LatheGeometry(ebPts, 64), matHousing);
    eb.position.y = yOff; tag(eb, 'stator'); groups.stator.add(eb);
}
// Mounting bolts
addBolts(groups.stator, 21, 6, 0.8, 2.5, 'stator', 9.5);
// Bearing
const bearMat = makeMat(0xc8c8d0, 0.95, 0.08);
const bearing = new THREE.Mesh(new THREE.TorusGeometry(9, 2, 16, 64), bearMat);
bearing.rotation.x = Math.PI/2; bearing.position.y = 9.5;
tag(bearing, 'stator'); groups.stator.add(bearing);
// Terminal block
const term = new THREE.Mesh(new THREE.BoxGeometry(5,4,3), makeMat(0x1a1a1a,0.3,0.7));
term.position.set(0,-11,20); tag(term,'stator'); groups.stator.add(term);
for (let i=-1; i<=1; i++) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,3,8), matCopper);
    pin.position.set(i*1.5,-11,21.5); pin.rotation.x=Math.PI/2;
    tag(pin,'stator'); groups.stator.add(pin);
}
groups.stator.rotation.z = Math.PI/2;
scene.add(groups.stator);

// ── ROTOR (BLDC) ───────────────────────────────────────
groups.rotor = new THREE.Group();
groups.rotor.userData.section = 'bldc';
// Core — chamfered machined cylinder
const rPts = [new THREE.Vector2(4,-7),new THREE.Vector2(11,-7),new THREE.Vector2(11.5,-6.5),new THREE.Vector2(11.5,6.5),new THREE.Vector2(11,7),new THREE.Vector2(4,7)];
const rotorCore = new THREE.Mesh(new THREE.LatheGeometry(rPts, 48), makeMat(0x404548,0.7,0.35));
tag(rotorCore, 'rotor'); groups.rotor.add(rotorCore);
// Arc magnets (16 = 8 pole pairs)
for (let i = 0; i < 16; i++) {
    const angle = (i/16)*Math.PI*2, span = (0.85/16)*Math.PI*2;
    const s = new THREE.Shape();
    s.absarc(0,0,11.8, angle, angle+span, false);
    s.absarc(0,0,10.2, angle+span, angle, true); s.closePath();
    const mg = new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:12,bevelEnabled:true,bevelThickness:0.2,bevelSize:0.2,bevelSegments:2}), i%2===0?matMagnetN:matMagnetS);
    mg.rotation.x=-Math.PI/2; mg.position.y=-6;
    tag(mg,'rotor'); groups.rotor.add(mg);
}
// Balancing holes
const bhMat = makeMat(0x1a1a1e,0.3,0.7);
for (const a of [0.3,2.8]) {
    const bh = new THREE.Mesh(new THREE.CylinderGeometry(1,1,14.1,12), bhMat);
    bh.position.set(Math.cos(a)*7,0,Math.sin(a)*7);
    tag(bh,'rotor'); groups.rotor.add(bh);
}
groups.rotor.rotation.z = Math.PI/2;
scene.add(groups.rotor);

// ── HIGH-SPEED ROTOR (Gear inner) ──────────────────────
groups.highSpeedRotor = new THREE.Group();
groups.highSpeedRotor.userData.section = 'gear';
// Core tube — chamfered
const hsPts = [new THREE.Vector2(12,-20),new THREE.Vector2(19.5,-20),new THREE.Vector2(20,-19.5),new THREE.Vector2(20,19.5),new THREE.Vector2(19.5,20),new THREE.Vector2(12,20)];
const hsrCore = new THREE.Mesh(new THREE.LatheGeometry(hsPts, 64), matHSR);
tag(hsrCore, 'highSpeedRotor'); groups.highSpeedRotor.add(hsrCore);
// Reinforcement ribs
for (let i = 0; i < 4; i++) {
    const a = (i/4)*Math.PI*2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.8,38,6), matHSR);
    rib.position.set(Math.cos(a)*15,0,Math.sin(a)*15); rib.rotation.y=-a;
    tag(rib,'highSpeedRotor'); groups.highSpeedRotor.add(rib);
}
// End flanges
for (const y of [19.5,-19.5]) {
    const flPts = [new THREE.Vector2(12,-0.75),new THREE.Vector2(20.5,-0.75),new THREE.Vector2(21,-0.25),new THREE.Vector2(21,0.25),new THREE.Vector2(20.5,0.75),new THREE.Vector2(12,0.75)];
    const fl = new THREE.Mesh(new THREE.LatheGeometry(flPts, 64), matHSR);
    fl.position.y = y; tag(fl,'highSpeedRotor'); groups.highSpeedRotor.add(fl);
}
// 8 arc magnets (4 pole pairs)
for (let i = 0; i < 8; i++) {
    const angle = (i/8)*Math.PI*2, span = (0.82/8)*Math.PI*2;
    const s = new THREE.Shape();
    s.absarc(0,0,20.2, angle, angle+span, false);
    s.absarc(0,0,17.5, angle+span, angle, true); s.closePath();
    const mg = new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:36,bevelEnabled:true,bevelThickness:0.3,bevelSize:0.3,bevelSegments:2}), i%2===0?matMagnetN:matMagnetS);
    mg.rotation.x=-Math.PI/2; mg.position.y=-18;
    tag(mg,'highSpeedRotor'); groups.highSpeedRotor.add(mg);
}
groups.highSpeedRotor.rotation.z = Math.PI/2;
scene.add(groups.highSpeedRotor);

// ── MODULATION RING (Stationary) ───────────────────────
groups.modulationRing = new THREE.Group();
groups.modulationRing.userData.section = 'gear';
// Outer containment ring
const moPts = [new THREE.Vector2(24.2,-20.5),new THREE.Vector2(24.8,-20.5),new THREE.Vector2(25,-20.3),new THREE.Vector2(25,20.3),new THREE.Vector2(24.8,20.5),new THREE.Vector2(24.2,20.5)];
const modOuter = new THREE.Mesh(new THREE.LatheGeometry(moPts, 64), makeMat(0x585c60,0.75,0.3));
tag(modOuter,'modulationRing'); groups.modulationRing.add(modOuter);
// 21 ferromagnetic segments with bevels
const nSeg = 21;
for (let i = 0; i < nSeg; i++) {
    const angle = (i/nSeg)*Math.PI*2;
    const segAngle = (0.82/nSeg)*Math.PI*2;
    const shape = new THREE.Shape();
    const ri = 21, ro = 24;
    shape.absarc(0,0,ro, angle, angle+segAngle, false);
    shape.absarc(0,0,ri, angle+segAngle, angle, true); shape.closePath();
    const extGeo = new THREE.ExtrudeGeometry(shape, {depth:40,bevelEnabled:true,bevelThickness:0.15,bevelSize:0.15,bevelSegments:1});
    const seg = new THREE.Mesh(extGeo, i%2===0?matMod:makeMat(0x5a5e62,0.65,0.4));
    seg.rotation.x=-Math.PI/2; seg.position.y=-20;
    tag(seg,'modulationRing'); groups.modulationRing.add(seg);
}
// Retaining rings
for (const y of [20.5,-20.5]) {
    const ret = new THREE.Mesh(new THREE.TorusGeometry(22.5,0.5,8,64), matBolt);
    ret.rotation.x=Math.PI/2; ret.position.y=y;
    tag(ret,'modulationRing'); groups.modulationRing.add(ret);
}
groups.modulationRing.rotation.z = Math.PI/2;
scene.add(groups.modulationRing);

// ── LOW-SPEED ROTOR (Gear outer) ───────────────────────
groups.lowSpeedRotor = new THREE.Group();
groups.lowSpeedRotor.userData.section = 'gear';
// Body — chamfered
const lsPts = [new THREE.Vector2(25,-20),new THREE.Vector2(34,-20),new THREE.Vector2(35,-19),new THREE.Vector2(35,19),new THREE.Vector2(34,20),new THREE.Vector2(25,20)];
const lsrBody = new THREE.Mesh(new THREE.LatheGeometry(lsPts, 64), matLSR);
tag(lsrBody,'lowSpeedRotor'); groups.lowSpeedRotor.add(lsrBody);
// Reinforcing flanges
for (const y of [19,-19]) {
    const flPts = [new THREE.Vector2(25,-1.25),new THREE.Vector2(36,-1.25),new THREE.Vector2(36.5,-0.75),new THREE.Vector2(36.5,0.75),new THREE.Vector2(36,1.25),new THREE.Vector2(25,1.25)];
    const fl = new THREE.Mesh(new THREE.LatheGeometry(flPts, 64), matLSR);
    fl.position.y=y; tag(fl,'lowSpeedRotor'); groups.lowSpeedRotor.add(fl);
}
// 34 arc magnets (17 pole pairs)
for (let i = 0; i < 34; i++) {
    const a = (i/34)*Math.PI*2, span = (0.8/34)*Math.PI*2;
    const s = new THREE.Shape();
    s.absarc(0,0,30, a, a+span, false);
    s.absarc(0,0,26, a+span, a, true); s.closePath();
    const mg = new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:36,bevelEnabled:true,bevelThickness:0.2,bevelSize:0.2,bevelSegments:1}),
        i%2===0?matMagnetN:matMagnetS);
    mg.rotation.x=-Math.PI/2; mg.position.y=-18;
    tag(mg,'lowSpeedRotor'); groups.lowSpeedRotor.add(mg);
}
// Mounting bolts
addBolts(groups.lowSpeedRotor, 33, 8, 0.6, 2.5, 'lowSpeedRotor', 19);
groups.lowSpeedRotor.rotation.z = Math.PI/2;
scene.add(groups.lowSpeedRotor);

// ── OUTPUT SHAFT ───────────────────────────────────────
groups.outputShaft = new THREE.Group();
groups.outputShaft.userData.section = 'output';
// Stepped shaft via LatheGeometry — machined profile
const shPts = [
    new THREE.Vector2(0,-47.5), new THREE.Vector2(4,-47.5), new THREE.Vector2(6,-44),
    new THREE.Vector2(6,-30), new THREE.Vector2(6.5,-30), new THREE.Vector2(6.5,-29),
    new THREE.Vector2(5.5,-29), new THREE.Vector2(5.5,-28), new THREE.Vector2(6.5,-28),
    new THREE.Vector2(6.5,-27), new THREE.Vector2(6,-27), new THREE.Vector2(6,20),
    new THREE.Vector2(7,20), new THREE.Vector2(7,25), new THREE.Vector2(6,25),
    new THREE.Vector2(6,47.5), new THREE.Vector2(0,47.5)
];
const shaft = new THREE.Mesh(new THREE.LatheGeometry(shPts, 48), matShaft);
tag(shaft,'outputShaft'); groups.outputShaft.add(shaft);
// Keyway
const key = new THREE.Mesh(new THREE.BoxGeometry(1.5,25,1.2), makeMat(0x2a2a30,0.5,0.5));
key.position.set(5.8,35,0); tag(key,'outputShaft'); groups.outputShaft.add(key);
// Cross-drilled pin hole
const pinH = new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,13,12), makeMat(0x1a1a1e,0.3,0.7));
pinH.rotation.x=Math.PI/2; pinH.position.y=-40;
tag(pinH,'outputShaft'); groups.outputShaft.add(pinH);
groups.outputShaft.rotation.z = Math.PI/2;
scene.add(groups.outputShaft);

// ── BRAKE DRUM ────────────────────────────────────────
groups.brakeDrum = new THREE.Group();
groups.brakeDrum.userData.section = 'brake';
// Drum body — chamfered
const dPts = [new THREE.Vector2(6.5,-6),new THREE.Vector2(14.5,-6),new THREE.Vector2(15,-5.5),new THREE.Vector2(15,5.5),new THREE.Vector2(14.5,6),new THREE.Vector2(6.5,6)];
const drum = new THREE.Mesh(new THREE.LatheGeometry(dPts, 48), matDrum);
tag(drum,'brakeDrum'); groups.brakeDrum.add(drum);
// Polished friction surface
const frPts = [new THREE.Vector2(14.5,-5),new THREE.Vector2(15.1,-5),new THREE.Vector2(15.2,-4.8),new THREE.Vector2(15.2,4.8),new THREE.Vector2(15.1,5),new THREE.Vector2(14.5,5)];
const friction = new THREE.Mesh(new THREE.LatheGeometry(frPts, 48), makeMat(0xaab0b5,0.9,0.08));
tag(friction,'brakeDrum'); groups.brakeDrum.add(friction);
// Machined groove rings
for (const y of [-4,-2,0,2,4]) {
    const gr = new THREE.Mesh(new THREE.TorusGeometry(15.1,0.08,4,48), makeMat(0x333336,0.5,0.5));
    gr.rotation.x=Math.PI/2; gr.position.y=y;
    tag(gr,'brakeDrum'); groups.brakeDrum.add(gr);
}
// Hub flanges with bolts
for (const y of [7,-7]) {
    const hubPts = [new THREE.Vector2(6.5,-1),new THREE.Vector2(9.5,-1),new THREE.Vector2(10,-0.5),new THREE.Vector2(10,0.5),new THREE.Vector2(9.5,1),new THREE.Vector2(6.5,1)];
    const hub = new THREE.Mesh(new THREE.LatheGeometry(hubPts, 32), matDrum);
    hub.position.y=y; tag(hub,'brakeDrum'); groups.brakeDrum.add(hub);
}
addBolts(groups.brakeDrum, 8.5, 4, 0.5, 2, 'brakeDrum', 7);
groups.brakeDrum.rotation.z = Math.PI/2;
groups.brakeDrum.position.x = 0;
scene.add(groups.brakeDrum);

// ── SMA WIRES ─────────────────────────────────────────
groups.smaWires = new THREE.Group();
groups.smaWires.userData.section = 'brake';
const smaWireMeshes = [];
// Anchor brackets
const brkMat = makeMat(0x484c50,0.7,0.3);
for (let i = 0; i < 6; i++) {
    const angle = (i/6)*Math.PI*2;
    for (const xp of [-11,11]) {
        const brk = new THREE.Mesh(new THREE.BoxGeometry(2,2.5,1.2), brkMat);
        brk.position.set(xp, Math.cos(angle)*18, Math.sin(angle)*18);
        tag(brk,'smaWires'); groups.smaWires.add(brk);
    }
}
for (let i = 0; i < 6; i++) {
    const angle = (i/6)*Math.PI*2;
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-11, Math.cos(angle)*18, Math.sin(angle)*18),
        new THREE.Vector3(-8, Math.cos(angle)*17, Math.sin(angle)*17),
        new THREE.Vector3(-5, Math.cos(angle)*16, Math.sin(angle)*16),
        new THREE.Vector3(-2, Math.cos(angle)*15.5, Math.sin(angle)*15.5),
        new THREE.Vector3(0, Math.cos(angle)*15.3, Math.sin(angle)*15.3),
        new THREE.Vector3(2, Math.cos(angle)*15.5, Math.sin(angle)*15.5),
        new THREE.Vector3(5, Math.cos(angle)*16, Math.sin(angle)*16),
        new THREE.Vector3(8, Math.cos(angle)*17, Math.sin(angle)*17),
        new THREE.Vector3(11, Math.cos(angle)*18, Math.sin(angle)*18),
    ]);
    const wireMat = matSMAcool.clone();
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.25, 8, false), wireMat);
    tag(wire,'smaWires'); smaWireMeshes.push(wire); groups.smaWires.add(wire);
    const glowMat = new THREE.MeshBasicMaterial({color:0x22c55e, transparent:true, opacity:0});
    const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 1.0, 8, false), glowMat);
    glow.userData.isGlow = true; smaWireMeshes.push(glow); groups.smaWires.add(glow);
}
// Electrical connector
const conn = new THREE.Mesh(new THREE.BoxGeometry(4,3,2), makeMat(0x1e1e22,0.4,0.6));
conn.position.set(-11,0,22); tag(conn,'smaWires'); groups.smaWires.add(conn);
for (const dx of [-0.8,0.8]) {
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,8,6), makeMat(0xcc2020,0.3,0.5,0xaa0000,0.15));
    cw.position.set(-11+dx,0,26); cw.rotation.x=Math.PI/2;
    tag(cw,'smaWires'); groups.smaWires.add(cw);
}
scene.add(groups.smaWires);

// ── MAGNETIC FLUX VISUALIZATION (exploded view only) ──
const fluxGroup = new THREE.Group();
const fluxLines = [];
const fluxMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0, linewidth: 2 });
// 8 flux loops showing field path: inner rotor → air gap → mod ring → outer rotor
for (let i = 0; i < 8; i++) {
    const baseAngle = (i / 8) * Math.PI * 2;
    const pts = [];
    // Trace a smooth loop from inner rotor radius out to outer rotor and back
    for (let t = 0; t <= 1; t += 0.02) {
        const phase = t * Math.PI; // half-loop arc
        const r = 12 + Math.sin(phase) * 22; // radius sweeps from 12mm to 34mm
        const dx = (t - 0.5) * 16; // spread along bore axis
        const y = Math.cos(baseAngle) * r;
        const z = Math.sin(baseAngle) * r;
        pts.push(new THREE.Vector3(dx, y, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(geo, fluxMat.clone());
    fluxLines.push(line);
    fluxGroup.add(line);
    // Arrow cone at midpoint showing flux direction
    const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 2.5, 6),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 })
    );
    const midR = 34;
    arrow.position.set(0, Math.cos(baseAngle) * midR, Math.sin(baseAngle) * midR);
    arrow.rotation.z = baseAngle + Math.PI/2;
    arrow.userData.isFluxArrow = true;
    fluxLines.push(arrow);
    fluxGroup.add(arrow);
}
scene.add(fluxGroup);

/* ================================================================
   DIMENSION LABELS (3D Sprites)
   ================================================================ */
function makeLabel(text, position, color = '#38bdf8') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    ctx.fillStyle = 'rgba(6,10,18,0.85)';
    ctx.roundRect(0, 0, 256, 64, 6);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.roundRect(0, 0, 256, 64, 6);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '600 22px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.9 }));
    sprite.position.copy(position);
    sprite.scale.set(20, 5, 1);
    sprite.userData.isLabel = true;
    return sprite;
}

const labels = [];
labels.push(makeLabel('FLAT BLDC MOTOR', new THREE.Vector3(-135, 40, 0), '#f97316'));
labels.push(makeLabel('Stator Ø45mm', new THREE.Vector3(-135, -30, 0), '#f97316'));
labels.push(makeLabel('Rotor (N42 NdFeB)', new THREE.Vector3(-85, 40, 0), '#ef4444'));
labels.push(makeLabel('COAXIAL MAGNETIC GEAR', new THREE.Vector3(0, 55, 0), '#a855f7'));
labels.push(makeLabel('HS Rotor 4pp', new THREE.Vector3(-30, -35, 0), '#a855f7'));
labels.push(makeLabel('Mod Ring 21seg', new THREE.Vector3(30, -35, 0), '#8899aa'));
labels.push(makeLabel('LS Rotor 17pp Ø70mm', new THREE.Vector3(90, -40, 0), '#3b82f6'));
labels.push(makeLabel('SMA BRAKE SYSTEM', new THREE.Vector3(175, 45, 0), '#22c55e'));
labels.push(makeLabel('Output Shaft Ø12mm', new THREE.Vector3(145, -20, 0), '#8b5cf6'));
labels.push(makeLabel('Brake Drum Ø30mm', new THREE.Vector3(195, -25, 0), '#8c7a68'));
labels.push(makeLabel('SMA Nitinol ×6', new THREE.Vector3(195, 30, 0), '#22c55e'));
labels.push(makeLabel('4.25:1 Gear Ratio', new THREE.Vector3(30, 50, 0), '#38bdf8'));
labels.forEach(l => { l.visible = false; scene.add(l); });

/* ================================================================
   EXPLODED VIEW POSITIONS — wide spread to prevent overlap
   Each component is spaced by at least its radius + neighbor radius + 15mm gap
   ================================================================ */
const assembledPos = {};
const explodedPos = {};
for (const [k, g] of Object.entries(groups)) {
    assembledPos[k] = { x: g.position.x, y: g.position.y, z: g.position.z };
}
// Stator (r=24mm) far left
explodedPos.stator = { x: -135, y: 0, z: 0 };
// Rotor (r=11.5mm) 
explodedPos.rotor = { x: -85, y: 0, z: 0 };
// High-Speed Rotor (r=20mm)
explodedPos.highSpeedRotor = { x: -30, y: 0, z: 0 };
// Modulation Ring (r=24mm)
explodedPos.modulationRing = { x: 30, y: 0, z: 0 };
// Low-Speed Rotor (r=35mm)
explodedPos.lowSpeedRotor = { x: 95, y: 0, z: 0 };
// Output Shaft (r=6mm, long)
explodedPos.outputShaft = { x: 150, y: 0, z: 0 };
// Brake Drum (r=15mm)
explodedPos.brakeDrum = { x: 200, y: 0, z: 0 };
// SMA Wires (wrap around drum)
explodedPos.smaWires = { x: 195, y: 0, z: 0 };

/* ================================================================
   RAYCASTER FOR INTERACTION
   ================================================================ */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredComp = null;
const tooltip = document.getElementById('tooltip');
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.3 });

renderer.domElement.addEventListener('mousemove', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(allMeshes);
    const comp = hits.length > 0 ? hits[0].object.userData.component : null;
    if (comp && comp !== hoveredComp) {
        hoveredComp = comp;
        tooltip.style.display = 'block';
        tooltip.textContent = SPECS[comp]?.name || comp;
        renderer.domElement.style.cursor = 'pointer';
    } else if (!comp) {
        hoveredComp = null;
        tooltip.style.display = 'none';
        renderer.domElement.style.cursor = 'grab';
    }
    if (tooltip.style.display === 'block') {
        tooltip.style.left = (e.clientX - container.getBoundingClientRect().left + 15) + 'px';
        tooltip.style.top = (e.clientY - container.getBoundingClientRect().top - 10) + 'px';
    }
});

renderer.domElement.addEventListener('click', (e) => {
    if (!hoveredComp) return;
    sim.selectedComp = hoveredComp;
    updateInfoPanel(hoveredComp);
    highlightComponent(hoveredComp);
    document.querySelectorAll('.component-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.component === hoveredComp));
});

renderer.domElement.addEventListener('dblclick', () => {
    if (!hoveredComp || !groups[hoveredComp]) return;
    const g = groups[hoveredComp];
    const box = new THREE.Box3().setFromObject(g);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    animateCamera(
        new THREE.Vector3(center.x + size, center.y + size * 0.5, center.z + size),
        center, 800
    );
});

/* ================================================================
   HIGHLIGHT & SELECTION
   ================================================================ */
let highlightOutline = null;
function highlightComponent(compName) {
    // Reset all opacity
    allMeshes.forEach(m => { if (m.material && !m.userData.isGlow) m.material.opacity = 1; m.material.transparent = false; });
    if (compName) {
        allMeshes.forEach(m => {
            if (m.userData.component !== compName && !m.userData.isGlow) {
                m.material = m.material.clone();
                m.material.transparent = true;
                m.material.opacity = 0.15;
            }
        });
    }
}

/* ================================================================
   CAMERA ANIMATION
   ================================================================ */
function animateCamera(targetPos, targetLook, duration=600) {
    const startPos = camera.position.clone();
    const startLook = controls.target.clone();
    const startTime = performance.now();
    function step(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = t < 0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
        camera.position.lerpVectors(startPos, targetPos, ease);
        controls.target.lerpVectors(startLook, targetLook, ease);
        controls.update();
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

// Camera presets
const camPresets = {
    front: { pos: [0, 10, 140], target: [0, 0, 0] },
    side: { pos: [140, 25, 0], target: [0, 0, 0] },
    top: { pos: [0, 150, 5], target: [0, 0, 0] },
    iso: { pos: [100, 70, 110], target: [0, 0, 0] },
    sma: { pos: [85, 30, 55], target: [38, 0, 0] }
};

/* ================================================================
   UI PANEL UPDATE
   ================================================================ */
function updateInfoPanel(comp) {
    const s = SPECS[comp];
    if (!s) return;
    document.getElementById('info-title').textContent = s.name;
    document.getElementById('info-tag').textContent = s.tag;
    document.getElementById('info-desc').textContent = s.desc;
    document.getElementById('spec-grid').innerHTML = s.dims.map(d =>
        `<div class="spec-item"><span class="spec-label">${d.l}</span><span class="spec-value">${d.v}</span></div>`
    ).join('');
}

/* ================================================================
   PHYSICS & ANIMATION
   ================================================================ */
function updatePhysics(dt) {
    sim.time += dt;
    const G = 4.25;
    if (sim.mode === 'running') {
        sim.rpm += (sim.targetRpm - sim.rpm) * dt * 2;
        sim.torque += (sim.targetTorque - sim.torque) * dt * 3;
        const omega = sim.rpm * 2 * Math.PI / 60;
        sim.power = sim.torque * omega;
        const I = (sim.torque / (G * 0.95)) / 0.035;
        const Ploss = I*I*1.2*2 + 0.002*(omega*G)**2;
        sim.efficiency = sim.power > 0.1 ? (sim.power/(sim.power+Ploss))*100 : 0;
        sim.smaTemp += (25 - sim.smaTemp) * dt * 0.5;
        sim.smaForce *= (1 - dt * 2);
        sim.smaContraction *= (1 - dt * 2);
    } else if (sim.mode === 'holding') {
        sim.rpm *= (1 - dt * 5); if (sim.rpm < 0.5) sim.rpm = 0;
        sim.smaTemp += (83 - sim.smaTemp) * dt * 1.5;
        const hf = Math.max(0, Math.min(1, (sim.smaTemp - 68) / 10));
        sim.smaForce = hf * 100;
        sim.smaContraction = hf * 6;
        sim.power = 3.5 * hf;
    } else if (sim.mode === 'transition') {
        sim.smaTemp += (83 - sim.smaTemp) * dt * 2;
        sim.rpm *= (1 - dt * 3);
        if (sim.smaTemp > 78 && sim.rpm < 2) sim.mode = 'holding';
    } else {
        sim.rpm *= (1 - dt * 3);
        sim.torque *= (1 - dt * 3);
        sim.power *= (1 - dt * 3);
        sim.smaTemp += (25 - sim.smaTemp) * dt * 0.3;
        sim.smaForce *= (1 - dt); sim.smaContraction *= (1 - dt);
    }

    // Rotate parts — spin around world X axis (the bore axis)
    const XAXIS = new THREE.Vector3(1, 0, 0);
    const lsRad = sim.rpm * 2 * Math.PI / 60 * dt;
    const hsRad = lsRad * G;
    groups.rotor.rotateOnWorldAxis(XAXIS, hsRad);
    groups.highSpeedRotor.rotateOnWorldAxis(XAXIS, hsRad);
    groups.lowSpeedRotor.rotateOnWorldAxis(XAXIS, lsRad);
    groups.brakeDrum.rotateOnWorldAxis(XAXIS, lsRad);
    groups.outputShaft.rotateOnWorldAxis(XAXIS, lsRad);

    // Explode animation
    const targetE = sim.exploded ? 1 : 0;
    sim.explodeT += (targetE - sim.explodeT) * dt * 4;
    for (const [k, g] of Object.entries(groups)) {
        const a = assembledPos[k], e = explodedPos[k];
        if (a && e) {
            g.position.x = a.x + (e.x - a.x) * sim.explodeT;
            g.position.y = a.y + (e.y - a.y) * sim.explodeT;
            g.position.z = a.z + (e.z - a.z) * sim.explodeT;
        }
    }
    labels.forEach(l => l.visible = sim.explodeT > 0.3);
    // Flux visualization — show in exploded view
    const fluxOpacity = sim.explodeT > 0.3 ? Math.min(0.6, (sim.explodeT - 0.3) * 2) : 0;
    fluxLines.forEach(item => {
        if (item.userData.isFluxArrow) {
            item.material.opacity = fluxOpacity;
        } else {
            item.material.opacity = fluxOpacity * 0.8;
        }
    });

    // SMA wire visual update — realistic Nitinol heat effect
    const heatFrac = Math.max(0, Math.min(1, (sim.smaTemp - 25) / 55));
    const pulse = (Math.sin(sim.time * 4) * 0.5 + 0.5) * heatFrac;
    const contractScale = 1 - heatFrac * 0.15;
    smaWireMeshes.forEach(m => {
        if (m.userData.isGlow) {
            m.material.opacity = heatFrac * 0.3 + pulse * 0.15;
            m.material.color.setHex(heatFrac > 0.5 ? 0xdd3322 : 0x8899aa);
        } else if (m.userData.component === 'smaWires') {
            m.material.color.lerpColors(
                new THREE.Color(0xb0b8c0), new THREE.Color(0xcc3020), heatFrac);
            m.material.emissive = new THREE.Color(0xcc2200);
            m.material.emissiveIntensity = heatFrac * 0.35 + pulse * 0.1;
        }
    });
    // Visually contract SMA wire group toward brake drum
    if (!sim.exploded) {
        groups.smaWires.scale.set(contractScale, contractScale, contractScale);
    }



    // Update chart data
    chartData.rpm.push(sim.rpm); chartData.rpm.shift();
    chartData.torque.push(sim.torque); chartData.torque.shift();
    chartData.power.push(sim.power); chartData.power.shift();
}

function updateUI() {
    document.getElementById('rpm-display').textContent = Math.round(sim.rpm);
    document.getElementById('torque-display').textContent = sim.torque.toFixed(1)+' Nm';
    document.getElementById('power-display').textContent = sim.power.toFixed(1)+' W';
    document.getElementById('hud-mode').textContent = 'MODE: '+sim.mode.toUpperCase();
    document.getElementById('hud-temp').textContent = 'SMA: '+Math.round(sim.smaTemp)+'°C';

    const dot = document.getElementById('status-dot');
    dot.className = 'dot'+(sim.mode==='running'?' running':sim.mode==='holding'?' holding':'');
    document.getElementById('status-text').textContent = sim.mode.toUpperCase();

    // SMA bars
    const tp = Math.min(100,((sim.smaTemp-25)/60)*100);
    document.getElementById('sma-temp-bar').style.width = tp+'%';
    document.getElementById('sma-temp-val').textContent = Math.round(sim.smaTemp)+'°C';
    document.getElementById('sma-force-bar').style.width = Math.min(100,sim.smaForce)+'%';
    document.getElementById('sma-force-val').textContent = Math.round(sim.smaForce)+'%';
    document.getElementById('sma-contract-bar').style.width = (sim.smaContraction/6*100)+'%';
    document.getElementById('sma-contract-val').textContent = sim.smaContraction.toFixed(1)+' mm';
    document.getElementById('sma-phase-text').textContent =
        sim.smaTemp>78?'AUSTENITE (Hot — Contracted)':sim.smaTemp>68?'TRANSFORMING...':'MARTENSITE (Cool)';

    // SMA wire SVG animation
    const hf = Math.max(0,Math.min(1,(sim.smaTemp-25)/55));
    const wave = document.getElementById('sma-wave');
    const amp = 20 * (1 - hf);
    wave.setAttribute('d', `M10,50 Q30,${50-amp} 50,50 Q70,${50+amp} 90,50 Q110,${50-amp} 130,50 Q150,${50+amp} 170,50 Q190,${50-amp} 195,50`);
    document.getElementById('wire-stop1').setAttribute('stop-color', hf > 0.5 ? '#ef4444' : '#22c55e');
    document.getElementById('wire-stop2').setAttribute('stop-color', hf > 0.5 ? '#ef4444' : '#22c55e');

    // Power flow
    const pIn = sim.power > 0.1 ? (sim.power / (sim.efficiency/100 || 0.01)) : 0;
    document.getElementById('pf-in').textContent = pIn.toFixed(1)+' W';
    document.getElementById('pf-motor').textContent = (pIn * 0.88).toFixed(1)+' W';
    document.getElementById('pf-gear').textContent = (pIn * 0.88 * 0.95).toFixed(1)+' W';
    document.getElementById('pf-out').textContent = sim.power.toFixed(1)+' W';

    drawChart();
}

function drawChart() {
    ctxChart.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    
    // Draw Grid
    ctxChart.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctxChart.lineWidth = 1;
    ctxChart.beginPath();
    for(let i=1; i<4; i++) {
        const y = i * 25;
        ctxChart.moveTo(0, y); ctxChart.lineTo(chartCanvas.width, y);
    }
    ctxChart.stroke();

    const drawLine = (data, color, maxVal) => {
        ctxChart.strokeStyle = color;
        ctxChart.lineWidth = 2;
        ctxChart.beginPath();
        const step = chartCanvas.width / (chartData.maxLen - 1);
        for(let i = 0; i < chartData.maxLen; i++) {
            const x = i * step;
            const normVal = Math.min(1, Math.max(0, data[i] / maxVal));
            const y = chartCanvas.height - (normVal * chartCanvas.height * 0.9);
            if(i === 0) ctxChart.moveTo(x, y);
            else ctxChart.lineTo(x, y);
        }
        ctxChart.stroke();
    };

    drawLine(chartData.rpm, '#38bdf8', 160); // Max 160 RPM
    drawLine(chartData.torque, '#e879f9', 6);  // Max 6 Nm
    drawLine(chartData.power, '#22c55e', 100); // Max 100 W
}

/* ================================================================
   EVENT HANDLERS
   ================================================================ */
document.getElementById('btn-run').addEventListener('click', () => { sim.mode='running'; });
document.getElementById('btn-hold').addEventListener('click', () => { sim.mode = sim.mode==='running'?'transition':'holding'; });
document.getElementById('btn-stop').addEventListener('click', () => { sim.mode='standby'; highlightComponent(null); });

document.getElementById('speed-slider').addEventListener('input', e => {
    sim.targetRpm = +e.target.value;
    document.getElementById('speed-val').textContent = e.target.value;
});
document.getElementById('torque-slider').addEventListener('input', e => {
    sim.targetTorque = +e.target.value;
    document.getElementById('torque-val').textContent = (+e.target.value).toFixed(1);
});

// View modes
document.getElementById('btn-assembled').addEventListener('click', () => {
    sim.exploded = false; sim.crossSection = false; sim.wireframe = false;
    setActiveView('btn-assembled');
    resetMaterials();
    animateCamera(new THREE.Vector3(100, 70, 110), new THREE.Vector3(0, 0, 0), 800);
});
document.getElementById('btn-exploded').addEventListener('click', () => {
    sim.exploded = true; sim.crossSection = false; sim.wireframe = false;
    setActiveView('btn-exploded');
    resetMaterials();
    animateCamera(new THREE.Vector3(30, 120, 280), new THREE.Vector3(30, 0, 0), 800);
});
document.getElementById('btn-cross').addEventListener('click', () => {
    sim.crossSection = !sim.crossSection;
    setActiveView('btn-cross');
    applyCrossSection();
});
document.getElementById('btn-wireframe').addEventListener('click', () => {
    sim.wireframe = !sim.wireframe;
    setActiveView('btn-wireframe');
    allMeshes.forEach(m => { if(m.material) { m.material = m.material.clone(); m.material.wireframe = sim.wireframe; }});
});

function setActiveView(id) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function resetMaterials() {
    allMeshes.forEach(m => {
        if (m.material) { m.material.wireframe = false; m.material.transparent = false; m.material.opacity = 1;
            m.material.clippingPlanes = []; }
    });
}

function applyCrossSection() {
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
    renderer.clippingPlanes = sim.crossSection ? [plane] : [];
    renderer.localClippingEnabled = sim.crossSection;
    allMeshes.forEach(m => {
        if (m.material) { m.material = m.material.clone(); m.material.clippingPlanes = sim.crossSection ? [plane] : [];
            m.material.clipShadows = true; m.material.side = THREE.DoubleSide; }
    });
}

// Component buttons
document.querySelectorAll('.component-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const comp = btn.dataset.component;
        sim.selectedComp = comp;
        updateInfoPanel(comp);
        highlightComponent(comp);
        document.querySelectorAll('.component-btn').forEach(b => b.classList.toggle('active', b.dataset.component === comp));
    });
    btn.addEventListener('dblclick', () => {
        const comp = btn.dataset.component;
        if (groups[comp]) {
            const box = new THREE.Box3().setFromObject(groups[comp]);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3()).length();
            animateCamera(new THREE.Vector3(center.x+size,center.y+size*0.5,center.z+size), center, 800);
        }
    });
});

// Camera presets
document.querySelectorAll('.cam-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const p = camPresets[btn.dataset.cam];
        if (p) animateCamera(new THREE.Vector3(...p.pos), new THREE.Vector3(...p.target), 700);
    });
});

/* ================================================================
   RESIZE
   ================================================================ */
function onResize() {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);
onResize();

/* ================================================================
   MAIN LOOP
   ================================================================ */
let lastTime = performance.now();
function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    updatePhysics(dt);
    updateUI();
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
