const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const WIDTH = 400;
const HEIGHT = 700;
canvas.width = WIDTH;
canvas.height = HEIGHT;

const physics = {
    speed: 0, rpm: 800, gear: 1, maxGears: selectedCar.gears, 
    isAutomatic: false, gas: false, brake: false, positionX: 0, targetX: 0
};

let gameState = 'menu';
let distance = 0;
let traffic = [];

let audioCtx, engineOsc, engineGain, brakeOsc, brakeGain;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'sawtooth';
    engineGain.gain.value = 0;
    engineOsc.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();

    brakeOsc = audioCtx.createOscillator();
    brakeGain = audioCtx.createGain();
    brakeOsc.type = 'square';
    brakeGain.gain.value = 0;
    brakeOsc.connect(brakeGain);
    brakeGain.connect(audioCtx.destination);
    brakeOsc.start();
}

function updateAudio() {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const freq = 40 + (physics.rpm / 8000) * 250;
    engineOsc.frequency.setTargetAtTime(freq, now, 0.05);
    engineGain.gain.setTargetAtTime(physics.gas ? 0.1 : 0.02, now, 0.1);

    if (physics.brake && physics.speed > 10) {
        brakeGain.gain.setTargetAtTime(0.08, now, 0.1);
        brakeOsc.frequency.setTargetAtTime(400 + physics.speed * 2, now, 0.1);
    } else {
        brakeGain.gain.setTargetAtTime(0, now, 0.1);
    }
}

document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    if (['ArrowUp','w','W','ArrowDown','s','S','ArrowLeft','a','A','ArrowRight','d','D',' ','Control','t','T'].includes(e.key)) e.preventDefault();
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') physics.gas = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') physics.brake = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') physics.targetX = -1;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') physics.targetX = 1;
    if (!physics.isAutomatic && (e.key === ' ' || e.key === 'Shift')) upShift();
    if (e.key === 'Control') downShift();
    if (e.key === 't' || e.key === 'T') physics.isAutomatic = !physics.isAutomatic;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') physics.gas = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') physics.brake = false;
    if (['ArrowLeft','a','A','ArrowRight','d','D'].includes(e.key)) physics.targetX = 0;
});

function upShift() { if (physics.gear < physics.maxGears) { physics.gear++; physics.rpm -= 1500; } }
function downShift() { if (physics.gear > 1) { physics.gear--; physics.rpm += 1000; } }

function update() {
    if (gameState !== 'playing') return;
    if (physics.gas) {
        if (physics.isAutomatic && physics.rpm > 6500 && physics.gear < physics.maxGears) upShift();
        if (physics.rpm < 8000) {
            physics.rpm += 250 * selectedCar.accel;
            physics.speed += 0.15 * selectedCar.accel;
        }
    } else {
        physics.rpm -= 150; physics.speed -= 0.05;
    }
    if (physics.brake) { physics.speed -= 1.5; physics.rpm -= 400; }
    if (physics.rpm < 800) physics.rpm = 800;
    if (physics.speed < 0) physics.speed = 0;
    if (physics.speed > selectedCar.maxSpeed) physics.speed = selectedCar.maxSpeed;
    
    physics.positionX += (physics.targetX - physics.positionX) * 0.1;
    distance += physics.speed / 10;

    if (Math.random() < 0.03 && traffic.length < 4) {
        traffic.push({ x: Math.random() * 1.6 - 0.8, z: 1, speed: 40 + Math.random() * 40, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    }

    traffic.forEach(car => {
        car.z -= (physics.speed - car.speed) * 0.0005;
        if (car.z < 0.15 && car.z > 0 && Math.abs(car.x - physics.positionX) < 0.25) {
            physics.speed = 0; gameOver();
        }
    });
    traffic = traffic.filter(car => car.z > -0.1);

    updateAudio();
    document.getElementById('score').textContent = Math.floor(distance) + ' м';
}

function draw() {
    ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, WIDTH, HEIGHT / 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.moveTo(WIDTH/2-40, HEIGHT/2); ctx.lineTo(WIDTH/2+40, HEIGHT/2); ctx.lineTo(WIDTH+100, HEIGHT); ctx.lineTo(-100, HEIGHT); ctx.fill();

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 20; i++) {
        let z = (i / 20 - (distance * 0.02) % (1 / 20));
        if (z < 0) z += 1;
        const y = HEIGHT / 2 + (z * (HEIGHT / 2));
        const scale = z * z;
        const lineW = 2 + scale * 15;
        const lineH = 10 + scale * 40;
        ctx.fillRect(WIDTH/2 - (40 + z * 300), y, lineW, lineH);
        ctx.fillRect(WIDTH/2 + (40 + z * 300) - lineW, y, lineW, lineH);
    }

    traffic.sort((a, b) => b.z - a.z).forEach(car => {
        const scale = 1 - car.z;
        const x = WIDTH / 2 + car.x * (WIDTH / 1.5) * scale;
        const y = HEIGHT / 2 + car.z * (HEIGHT / 2);
        const w = 40 * scale + 10; const h = 60 * scale + 15;
        ctx.fillStyle = car.color || '#ff6b35';
        ctx.fillRect(x - w/2, y - h, w, h);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - w/2 + 4, y - h + 6, w/4, 6);
        ctx.fillRect(x + w/2 - w/4 - 4, y - h + 6, w/4, 6);
    });

    const hoodY = HEIGHT - 180 + physics.positionX * 30;
    ctx.fillStyle = selectedCar.color;
    ctx.beginPath(); ctx.moveTo(WIDTH/2-160+physics.positionX*60, HEIGHT); ctx.lineTo(WIDTH/2+160+physics.positionX*60, HEIGHT); ctx.lineTo(WIDTH/2+100+physics.positionX*40, hoodY); ctx.lineTo(WIDTH/2-100+physics.positionX*40, hoodY); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.moveTo(WIDTH/2-80+physics.positionX*50, hoodY+10); ctx.lineTo(WIDTH/2+80+physics.positionX*50, hoodY+10); ctx.lineTo(WIDTH/2+50+physics.positionX*40, hoodY+70); ctx.lineTo(WIDTH/2-50+physics.positionX*40, hoodY+70); ctx.fill();

    drawDashboard();
}

function drawDashboard() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(20, HEIGHT - 110, WIDTH - 40, 90);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 32px monospace'; ctx.fillText(`${Math.floor(physics.speed)}`, 40, HEIGHT - 40);
    ctx.font = '12px monospace'; ctx.fillStyle = '#b0b0c0'; ctx.fillText('км/ч', 40, HEIGHT - 20);
    ctx.fillStyle = physics.rpm > 7000 ? '#ff0000' : '#ffd700'; ctx.font = 'bold 46px monospace'; ctx.fillText(`${physics.gear}`, WIDTH / 2 - 15, HEIGHT - 35);

    const barW = 140; const barX = WIDTH - barW - 40;
    ctx.fillStyle = '#333'; ctx.fillRect(barX, HEIGHT - 65, barW, 15);
    ctx.fillStyle = physics.rpm > 6500 ? '#ff0000' : (physics.rpm > 6000 ? '#ff8800' : '#00ff00');
    ctx.fillRect(barX, HEIGHT - 65, (physics.rpm / 8000) * barW, 15);
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('RPM', barX, HEIGHT - 70);
}

function startGame() {
    initAudio(); if (audioCtx.state === 'suspended') audioCtx.resume();
    gameState = 'playing'; physics.speed = 0; physics.rpm = 800; physics.gear = 1; physics.positionX = 0; physics.maxGears = selectedCar.gears; distance = 0; traffic = [];
    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
}

function gameOver() {
    gameState = 'gameover'; physics.gas = false;
    if (engineGain) engineGain.gain.value = 0;
    if (brakeGain) brakeGain.gain.value = 0;
    document.getElementById('final-score').textContent = `Дистанция: ${Math.floor(distance)} м`;
    document.getElementById('game-over').classList.remove('hidden');
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();
