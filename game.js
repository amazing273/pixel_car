// --- ЭЛЕМЕНТЫ UI ---
const garageScreen = document.getElementById('garage-screen');
const gameScreen = document.getElementById('game-container');
const moneyEl = document.getElementById('money');
const carNameEl = document.getElementById('car-name');
const carSprite = document.getElementById('car-sprite');
const carStats = document.getElementById('car-stats');

// --- СОСТОЯНИЕ ---
let gameState = 'garage';
let money = 1000;
let hasTurbo = false;
let hasSpoiler = false;

// --- ЛОГИКА ГАРАЖА ---
function updateGarageUI() {
    moneyEl.textContent = money;
    carNameEl.textContent = currentCar.name;
    carSprite.style.background = currentCar.color;
    
    let maxSpd = currentCar.baseSpeed;
    if (hasTurbo) maxSpd += 40;
    carStats.textContent = `Макс. скорость: ${maxSpd} км/ч`;
}

document.getElementById('buy-turbo').addEventListener('click', () => {
    if (money >= 500 && !hasTurbo) {
        money -= 500;
        hasTurbo = true;
        alert("Турбина установлена! Максимальная скорость +40 км/ч.");
        updateGarageUI();
    } else if (hasTurbo) alert("Турбина уже стоит!");
    else alert("Недостаточно денег! Покатайся в гонке.");
});

document.getElementById('buy-spoiler').addEventListener('click', () => {
    if (money >= 200 && !hasSpoiler) {
        money -= 200;
        hasSpoiler = true;
        alert("Спойлер установлен! Теперь машина выглядит круче.");
        updateGarageUI();
    } else if (hasSpoiler) alert("Спойлер уже стоит!");
    else alert("Недостаточно денег!");
});

document.getElementById('btn-race').addEventListener('click', () => {
    garageScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    startRace();
});

document.getElementById('btn-back-garage').addEventListener('click', () => {
    garageScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    updateGarageUI();
});

// --- ЛОГИКА ГОНКИ ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const physics = { speed: 0, rpm: 800, gear: 1, gas: false, brake: false, steering: 0 };
let distance = 0;
let traffic = [];
let audioCtx, engineOsc, engineGain;

// ГИРОСКОП (Наклон телефона)
window.addEventListener('deviceorientation', (e) => {
    if (gameState !== 'race') return;
    let tilt = e.gamma || 0; // Наклон влево-вправо
    if (tilt > 25) tilt = 25;
    if (tilt < -25) tilt = -25;
    physics.steering = tilt / 25; // От -1 до 1
});

// ПЕДАЛИ
const btnGas = document.getElementById('btn-gas');
const btnBrake = document.getElementById('btn-brake');

btnGas.addEventListener('touchstart', (e) => { e.preventDefault(); physics.gas = true; });
btnGas.addEventListener('touchend', (e) => { e.preventDefault(); physics.gas = false; });
btnBrake.addEventListener('touchstart', (e) => { e.preventDefault(); physics.brake = true; });
btnBrake.addEventListener('touchend', (e) => { e.preventDefault(); physics.brake = false; });
// Для ПК
btnGas.addEventListener('mousedown', () => physics.gas = true);
btnGas.addEventListener('mouseup', () => physics.gas = false);
btnBrake.addEventListener('mousedown', () => physics.brake = true);
btnBrake.addEventListener('mouseup', () => physics.brake = false);

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'sawtooth';
    engineOsc.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();
}

function startRace() {
    gameState = 'race';
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    physics.speed = 0; physics.rpm = 800; physics.gear = 1; physics.steering = 0;
    distance = 0; traffic = [];
    document.getElementById('game-over').classList.add('hidden');
}

function update() {
    if (gameState !== 'race') return;

    let maxSpd = currentCar.baseSpeed + (hasTurbo ? 40 : 0);
    let accel = hasTurbo ? 0.18 : 0.1;

    if (physics.gas) {
        if (physics.rpm > 6500 && physics.gear < 5) { physics.gear++; physics.rpm -= 1500; }
        if (physics.rpm < 8000) { physics.rpm += 200; physics.speed += accel; }
    } else {
        physics.rpm -= 100; physics.speed -= 0.05;
    }

    if (physics.brake) { physics.speed -= 1.2; physics.rpm -= 300; }
    
    if (physics.speed < 0) physics.speed = 0;
    if (physics.speed > maxSpd) physics.speed = maxSpd;
    if (physics.rpm < 800) physics.rpm = 800;

    distance += physics.speed / 10;

    // Трафик
    if (Math.random() < 0.03 && traffic.length < 3) {
        traffic.push({ x: Math.random() * 1.5 - 0.75, z: 1, speed: 40 + Math.random() * 40 });
    }

    traffic.forEach(car => {
        car.z -= (physics.speed - car.speed) * 0.0005;
        // Столкновение (учитываем наклон)
        if (car.z < 0.15 && car.z > 0 && Math.abs(car.x - physics.steering * 0.8) < 0.25) {
            physics.speed = 0;
            gameOver();
        }
    });
    traffic = traffic.filter(car => car.z > -0.1);

    // Звук
    if (audioCtx) {
        engineOsc.frequency.setTargetAtTime(40 + (physics.rpm / 8000) * 250, audioCtx.currentTime, 0.05);
        engineGain.gain.setTargetAtTime(physics.gas ? 0.05 : 0.01, audioCtx.currentTime, 0.1);
    }

    // HUD
    document.getElementById('speed').textContent = Math.floor(physics.speed);
    document.getElementById('gear').textContent = physics.gear;
    document.getElementById('rpm-fill').style.width = (physics.rpm / 8000) * 100 + '%';
    document.getElementById('rpm-fill').style.background = physics.rpm > 6500 ? '#ff0000' : '#00ff88';
}

function draw() {
    if (gameState !== 'race') return;

    ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    
    // Дорога
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 40, canvas.height / 2);
    ctx.lineTo(canvas.width / 2 + 40, canvas.height / 2);
    ctx.lineTo(canvas.width + 200, canvas.height);
    ctx.lineTo(-200, canvas.height);
    ctx.fill();

    // Разметка
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 20; i++) {
        let z = (i / 20 - (distance * 0.02) % (1 / 20));
        if (z < 0) z += 1;
        const y = canvas.height / 2 + (z * (canvas.height / 2));
        const scale = z * z;
        ctx.fillRect(canvas.width/2 - (40 + z * 300), y, 2 + scale * 15, 10 + scale * 40);
        ctx.fillRect(canvas.width/2 + (40 + z * 300) - (2 + scale * 15), y, 2 + scale * 15, 10 + scale * 40);
    }

    // Трафик
    traffic.sort((a, b) => b.z - a.z).forEach(car => {
        const scale = 1 - car.z;
        const parallax = physics.steering * 100 * scale;
        const x = canvas.width / 2 + car.x * canvas.width * scale - parallax;
        const y = canvas.height / 2 + car.z * (canvas.height / 2);
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(x - (40*scale+10)/2, y - (60*scale+15), 40*scale+10, 60*scale+15);
    });

    // Капот (Вид от водителя)
    const hoodOffset = physics.steering * 80;
    const hoodY = canvas.height - 150;
    
    ctx.fillStyle = currentCar.color;
    ctx.beginPath();
    ctx.moveTo(canvas.width/2 - 200 + hoodOffset, canvas.height);
    ctx.lineTo(canvas.width/2 + 200 + hoodOffset, canvas.height);
    ctx.lineTo(canvas.width/2 + 120 + hoodOffset * 0.5, hoodY);
    ctx.lineTo(canvas.width/2 - 120 + hoodOffset * 0.5, hoodY);
    ctx.fill();

    // Если куплен спойлер, рисуем его на капоте
    if (hasSpoiler) {
        ctx.fillStyle = '#333';
        ctx.fillRect(canvas.width/2 - 150 + hoodOffset, hoodY + 10, 300, 20);
    }
}

function gameOver() {
    gameState = 'gameover';
    let earned = Math.floor(distance / 10);
    money += earned;
    document.getElementById('final-score').textContent = `Дистанция: ${Math.floor(distance)} м`;
    document.getElementById('earned-money').textContent = `Заработано: ${earned} ₽`;
    document.getElementById('game-over').classList.remove('hidden');
}

// Главный цикл
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Инициализация
updateGarageUI();
loop();
