{/* <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script> */}
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = 'title';
let frame = 0;
let keys = {};
let player = { x: 100, y: 400, width: 30, height: 50, vx: 0, vy: 0, onGround: false, oxygen: 100, panic: 0, facingShadow: false, shadowStrength: 0 };
let camera = { x: 0, y: 0 };
let bridgeSegments = [];
let debris = [];
let bubbles = [];
let ruins = [];
let puzzles = [];
let particles = [];
let shadow = { x: 0, y: 0, active: false, size: 0 };
let lightRays = [];
let audioCtx = null;
let transitionTimer = 0;
let levelIndicatorBase = '';

// === AI SYSTEM ===
let ai = {
    difficulty: 1, // 1 easy, 2 medium, 3 hard
    performance: [],
    lastCheck: 0
};

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, duration, type, volume) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playHeartbeat() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
    setTimeout(function() {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 55;
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.15);
    }, 200);
}

document.addEventListener('keydown', function(e) {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
});
document.addEventListener('keyup', function(e) {
    keys[e.code] = false;
});

function initBridge() {
    player = { x: 100, y: 300, width: 30, height: 50, vx: 3, vy: 0, onGround: false, oxygen: 100, panic: 0, facingShadow: false, shadowStrength: 0 };
    camera = { x: 0, y: 0 };
    bridgeSegments = [];
    debris = [];
    particles = [];
    let segX = 0;
    for (let i = 0; i < 80; i++) {
        let segWidth = 80 + Math.random() * 60;
        let gap = (i > 3 && Math.random() < 0.3) ? 60 + Math.random() * 80 : 0;
        bridgeSegments.push({ x: segX, y: 400, width: segWidth, height: 40, cracked: Math.random() < 0.4, collapsing: false });
        segX += segWidth + gap;
    }
    for (let i = 0; i < 15; i++) {
        debris.push({ x: 400 + i * 150 + Math.random() * 100, y: -50 - Math.random() * 300, width: 20 + Math.random() * 30, height: 20 + Math.random() * 30, vy: 2 + Math.random() * 3, vx: (Math.random() - 0.5) * 2 });
    }
    for (let i = 0; i < 100; i++) {
        particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vy: 8 + Math.random() * 6, vx: -2 + Math.random() * 2, life: Math.random() * 100 });
    }
    levelIndicatorBase = 'LEVEL 1: BRIDGE ESCAPE';
    updateLevelIndicator();
    document.getElementById('oxygenBar').style.display = 'none';
    document.getElementById('oxygenLabel').style.display = 'none';
    document.getElementById('panicBar').style.display = 'block';
    document.getElementById('panicLabel').style.display = 'block';
}

function initSinking() {
    player = { x: canvas.width / 2, y: 100, width: 30, height: 50, vx: 0, vy: 0.5, onGround: false, oxygen: 100, panic: 0, facingShadow: false, shadowStrength: 0 };
    camera = { x: 0, y: 0 };
    debris = [];
    bubbles = [];
    particles = [];
    lightRays = [];
    for (let i = 0; i < 20; i++) {
        debris.push({ x: Math.random() * canvas.width, y: 200 + Math.random() * 400, width: 15 + Math.random() * 25, height: 15 + Math.random() * 25, vy: -0.5 - Math.random() * 1, vx: (Math.random() - 0.5) * 1, rotation: Math.random() * Math.PI * 2 });
    }
    for (let i = 0; i < 30; i++) {
        bubbles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: 3 + Math.random() * 8, vy: -1 - Math.random() * 2, vx: (Math.random() - 0.5) * 0.5 });
    }
    for (let i = 0; i < 5; i++) {
        lightRays.push({ x: canvas.width / 2 + (i - 2) * 150, width: 30 + Math.random() * 40, alpha: 0.05 + Math.random() * 0.1 });
    }
    levelIndicatorBase = 'LEVEL 2: SINKING';
    updateLevelIndicator();
    document.getElementById('oxygenBar').style.display = 'block';
    document.getElementById('oxygenLabel').style.display = 'block';
    document.getElementById('panicBar').style.display = 'block';
    document.getElementById('panicLabel').style.display = 'block';
}

function initUnderwater() {
    player = { x: 100, y: 300, width: 30, height: 50, vx: 0, vy: 0, onGround: false, oxygen: 100, panic: 0, facingShadow: false, shadowStrength: 0 };
    camera = { x: 0, y: 0 };
    debris = [];
    bubbles = [];
    ruins = [];
    puzzles = [];
    particles = [];
    shadow = { x: 800, y: 300, active: false, size: 0 };
    ruins = [
        { x: 200, y: 350, width: 60, height: 250, type: 'pillar' },
        { x: 500, y: 300, width: 80, height: 300, type: 'pillar' },
        { x: 800, y: 380, width: 50, height: 220, type: 'pillar' },
        { x: 1100, y: 320, width: 70, height: 280, type: 'pillar' },
        { x: 1400, y: 360, width: 55, height: 240, type: 'pillar' },
        { x: 350, y: 200, width: 300, height: 30, type: 'arch' },
        { x: 1000, y: 180, width: 250, height: 25, type: 'arch' }
    ];
    puzzles = [
        { x: 550, y: 250, width: 40, height: 50, type: 'lever', activated: false, symbol: '1' },
        { x: 1050, y: 130, width: 40, height: 50, type: 'lever', activated: false, symbol: '2' },
        { x: 1600, y: 300, width: 60, height: 80, type: 'door', open: false, required: 2 },
        { x: 300, y: 250, width: 35, height: 35, type: 'key', collected: false, id: 'key1' },
        { x: 1300, y: 280, width: 35, height: 35, type: 'symbol', matched: false, symbol: 'A' }
    ];
    for (let i = 0; i < 40; i++) {
        bubbles.push({ x: Math.random() * 2000, y: Math.random() * canvas.height, size: 3 + Math.random() * 10, vy: -0.5 - Math.random() * 1.5, vx: (Math.random() - 0.5) * 0.3 });
    }
    for (let i = 0; i < 60; i++) {
        particles.push({ x: Math.random() * 2000, y: Math.random() * canvas.height, vy: -0.2 + Math.random() * 0.4, vx: -0.2 + Math.random() * 0.4, size: 1 + Math.random() * 3, alpha: 0.2 + Math.random() * 0.4 });
    }
    for (let i = 0; i < 6; i++) {
        lightRays.push({ x: 200 + i * 250, width: 40 + Math.random() * 50, alpha: 0.04 + Math.random() * 0.08 });
    }
    levelIndicatorBase = 'LEVEL 3: THE DEPTHS';
    updateLevelIndicator();
    document.getElementById('oxygenBar').style.display = 'block';
    document.getElementById('oxygenLabel').style.display = 'block';
    document.getElementById('panicBar').style.display = 'block';
    document.getElementById('panicLabel').style.display = 'block';
}

function updateBridge() {
    player.x += player.vx;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += 2;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= 1;
    player.vy += 0.6;
    player.y += player.vy;
    player.onGround = false;
    for (let seg of bridgeSegments) {
        if (player.x + player.width > seg.x && player.x < seg.x + seg.width && player.y + player.height > seg.y && player.y + player.height < seg.y + seg.height + 20) {
            if (player.vy > 0) {
                player.y = seg.y - player.height;
                player.vy = 0;
                player.onGround = true;
                if (seg.cracked && !seg.collapsing) {
                    seg.collapsing = true;
                    player.panic += 10;
                    playTone(200, 0.3, 'sawtooth', 0.08);
                }
            }
        }
        if (seg.collapsing) seg.y += 2;
    }
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround) {
        player.vy = -12;
        playTone(400, 0.1, 'sine', 0.05);
    }
    for (let d of debris) {
        d.y += d.vy;
        d.x += d.vx;
        if (d.y > canvas.height + 50) {
            d.y = -50 - Math.random() * 200;
            d.x = player.x + 200 + Math.random() * 400;
        }
        if (player.x < d.x + d.width && player.x + player.width > d.x && player.y < d.y + d.height && player.y + player.height > d.y) {
            player.panic += 15;
            trackPerformance(false);
            playTone(150, 0.4, 'square', 0.1);
            d.y = -100;
        }
    }
    player.panic += 0.05 *ai.difficulty;
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
        player.panic += 0.1;
        player.vx = 5;
    } else {
        player.vx = 3;
    }
    document.getElementById('panicFill').style.width = Math.min(player.panic, 100) + '%';
    camera.x = player.x - 200;
    for (let p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y > canvas.height) {
            p.y = -10;
            p.x = camera.x + Math.random() * canvas.width;
        }
    }
    if (player.y > canvas.height + 100 || player.x > bridgeSegments[bridgeSegments.length - 1].x + 200) {
        gameState = 'transition';
        transitionTimer = 0;
    }
    if (player.panic >= 100) {
        endGame(false, 'Panic consumed you before the water could.');
    }
}

function updateTransition() {
    transitionTimer++;
    player.y += 3;
    player.panic -= 0.5;
    if (transitionTimer > 120) {
        gameState = 'sinking';
        initSinking();
        playTone(300, 1, 'sine', 0.1);
    }
}

function updateSinking() {
    player.y += player.vy;
    player.vy = Math.min(player.vy + 0.02, 1.5);
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= 1.5;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += 1.5;
    player.x = Math.max(30, Math.min(canvas.width - 30, player.x));
    let oxygenDrain = 0.08 * ai.difficulty;
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
        oxygenDrain = 0.2;
        player.panic += 0.1;
    } else {
        player.panic -= 0.05;
    }
    player.oxygen -= oxygenDrain;
    player.panic = Math.max(0, Math.min(100, player.panic));
    document.getElementById('oxygenFill').style.width = Math.max(0, player.oxygen) + '%';
    document.getElementById('panicFill').style.width = player.panic + '%';
    for (let d of debris) {
        d.y += d.vy;
        d.x += d.vx;
        d.rotation += 0.02;
        if (d.y < -50) {
            d.y = canvas.height + 50;
            d.x = Math.random() * canvas.width;
        }
        let dx = player.x - d.x;
        let dy = player.y - d.y;
        if (Math.sqrt(dx*dx + dy*dy) < 30) {
            player.oxygen -= 10;
            player.panic += 20;
            playTone(200, 0.3, 'sawtooth', 0.1);
            d.y = -50;
        }
    }
    for (let b of bubbles) {
        b.y += b.vy;
        b.x += b.vx + Math.sin(frame * 0.02 + b.y * 0.01) * 0.5;
        if (b.y < -20) {
            b.y = canvas.height + 20;
            b.x = Math.random() * canvas.width;
        }
    }
    if (player.oxygen <= 0) {
        endGame(false, 'Your lungs filled with water. The silence took you.');
    }
    if (player.y > canvas.height - 100) {
        gameState = 'underwater';
        initUnderwater();
        playTone(250, 1.5, 'sine', 0.08);
    }
    if (frame % Math.max(30, 120 - player.panic) === 0 && player.panic > 20) {
        playHeartbeat();
    }
}

function updateUnderwater() {
    player.vx *= 0.9;
    player.vy *= 0.9;
    if (keys['ArrowLeft'] || keys['KeyA']) player.vx -= 0.3;
    if (keys['ArrowRight'] || keys['KeyD']) player.vx += 0.3;
    if (keys['ArrowUp'] || keys['KeyW']) player.vy -= 0.3;
    if (keys['ArrowDown'] || keys['KeyS']) player.vy += 0.3;
    player.x += player.vx;
    player.y += player.vy;
    player.x = Math.max(30, Math.min(1900, player.x));
    player.y = Math.max(50, Math.min(canvas.height - 80, player.y));
    let oxygenDrain = 0.05 * ai.difficulty ;
    if (Math.abs(player.vx) > 2 || Math.abs(player.vy) > 2) {
        oxygenDrain = 0.12;
        player.panic += 0.05;
    } else {
        player.panic -= 0.03;
    }
    player.oxygen -= oxygenDrain;
    player.panic = Math.max(0, Math.min(100, player.panic));
    document.getElementById('oxygenFill').style.width = Math.max(0, player.oxygen) + '%';
    document.getElementById('panicFill').style.width = player.panic + '%';
    for (let r of ruins) {
        if (player.x + player.width > r.x && player.x < r.x + r.width && player.y + player.height > r.y && player.y < r.y + r.height) {
            let overlapX = (player.x + player.width/2) - (r.x + r.width/2);
            let overlapY = (player.y + player.height/2) - (r.y + r.height/2);
            if (Math.abs(overlapX) > Math.abs(overlapY)) {
                player.x += overlapX > 0 ? 2 : -2;
            } else {
                player.y += overlapY > 0 ? 2 : -2;
            }
        }
    }
    let activatedLevers = 0;
    for (let p of puzzles) {
        if (p.type === 'lever' && p.activated) activatedLevers++;
        let dist = Math.sqrt((player.x - p.x)**2 + (player.y - p.y)**2);
        if (dist < 50 && keys['KeyE']) {
            if (p.type === 'lever' && !p.activated) {
                p.activated = true;
                playTone(600, 0.3, 'sine', 0.1);
                keys['KeyE'] = false;
            }
            if (p.type === 'key' && !p.collected) {
                p.collected = true;
                playTone(800, 0.4, 'sine', 0.1);
                keys['KeyE'] = false;
            }
            if (p.type === 'symbol' && !p.matched) {
                p.matched = true;
                playTone(700, 0.3, 'sine', 0.1);
                keys['KeyE'] = false;
            }
        }
        if (p.type === 'door') {
            if (activatedLevers >= p.required) p.open = true;
            if (p.open && dist < 50) {
                endGame(true);
            }
        }
    }
    let playerMoving = Math.abs(player.vx) > 0.5 || Math.abs(player.vy) > 0.5;
    let distToShadow = Math.sqrt((player.x - shadow.x)**2 + (player.y - shadow.y)**2);
    if (distToShadow < 400) {
        shadow.active = true;
        if (playerMoving && distToShadow > 100) {
            shadow.size = Math.min(shadow.size + 0.5, 80);
            player.panic += 0.2;
            document.getElementById('shadowWarning').style.opacity = '1';
        } else if (!playerMoving || distToShadow < 150) {
            shadow.size = Math.max(shadow.size - 0.3, 0);
            document.getElementById('shadowWarning').style.opacity = '0';
        }
        let angle = Math.atan2(player.y - shadow.y, player.x - shadow.x);
        shadow.x += Math.cos(angle) * (0.8 * ai.difficulty);
        shadow.y += Math.sin(angle) * (0.8 * ai.difficulty);
    } else {
        shadow.active = false;
        shadow.size = Math.max(shadow.size - 0.2, 0);
        document.getElementById('shadowWarning').style.opacity = '0';
    }
    if (shadow.size > 50 && distToShadow < 80) {
        player.oxygen -= 0.3;
        player.panic += 0.3;
    }
    for (let b of bubbles) {
        b.y += b.vy;
        b.x += b.vx + Math.sin(frame * 0.01 + b.x * 0.01) * 0.3;
        if (b.y < -20) {
            b.y = canvas.height + 20;
            b.x = Math.random() * 2000;
        }
    }
    for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 2000;
        if (p.x > 2000) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
    }
    camera.x = player.x - canvas.width / 2;
    camera.x = Math.max(0, Math.min(1200, camera.x));
    if (player.oxygen <= 0) {
        endGame(false, 'The depths claimed you. Your panic became your tomb.');
    }
    if (frame % Math.max(40, 100 - player.panic * 0.8) === 0 && player.panic > 15) {
        playHeartbeat();
    }
}

function drawBridge() {
    let skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#1a1a2e');
    skyGrad.addColorStop(0.5, '#2a2a3e');
    skyGrad.addColorStop(1, '#3a3a4e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(150, 170, 200, 0.3)';
    ctx.lineWidth = 1;
    for (let p of particles) {
        let sx = p.x - camera.x;
        if (sx > -50 && sx < canvas.width + 50) {
            ctx.beginPath();
            ctx.moveTo(sx, p.y);
            ctx.lineTo(sx + p.vx * 2, p.y + p.vy * 2);
            ctx.stroke();
        }
    }
    for (let seg of bridgeSegments) {
        let sx = seg.x - camera.x;
        if (sx + seg.width < -50 || sx > canvas.width + 50) continue;
        ctx.fillStyle = seg.collapsing ? '#3a3a4a' : '#4a4a5a';
        ctx.fillRect(sx, seg.y, seg.width, seg.height);
        ctx.fillStyle = '#5a5a6a';
        ctx.fillRect(sx, seg.y, seg.width, 4);
        if (seg.cracked) {
            ctx.strokeStyle = '#2a2a3a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx + 10, seg.y + 5);
            ctx.lineTo(sx + 20, seg.y + 20);
            ctx.lineTo(sx + 15, seg.y + 35);
            ctx.stroke();
        }
    }
    for (let d of debris) {
        let dx = d.x - camera.x;
        if (dx > -50 && dx < canvas.width + 50) {
            ctx.fillStyle = '#5a5a6a';
            ctx.fillRect(dx, d.y, d.width, d.height);
            ctx.fillStyle = '#6a6a7a';
            ctx.fillRect(dx, d.y, d.width, 3);
        }
    }
    let waterGrad = ctx.createLinearGradient(0, 450, 0, canvas.height);
    waterGrad.addColorStop(0, 'rgba(20, 60, 100, 0.6)');
    waterGrad.addColorStop(1, 'rgba(10, 40, 80, 0.9)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 450, canvas.width, canvas.height - 450);
    ctx.strokeStyle = 'rgba(60, 140, 180, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 10) {
        let wy = 450 + Math.sin((x + frame * 2) * 0.02) * 5;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
    }
    ctx.stroke();
    drawPlayer();
    if (player.panic > 30) {
        let intensity = (player.panic - 30) / 70;
        ctx.fillStyle = 'rgba(100, 20, 20, ' + (intensity * 0.2) + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawTransition() {
    ctx.fillStyle = 'rgba(5, 15, 35, ' + Math.min(transitionTimer / 60, 1) + ')';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let py = player.y - camera.y;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(player.x - 15, py, 30, 50);
    for (let i = 0; i < 10; i++) {
        let bx = player.x + (Math.random() - 0.5) * 60;
        let by = py - 20 - Math.random() * 100;
        ctx.fillStyle = 'rgba(80, 160, 200, ' + (0.3 + Math.random() * 0.4) + ')';
        ctx.beginPath();
        ctx.arc(bx, by, 3 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSinking() {
    let waterGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    waterGrad.addColorStop(0, '#0a2848');
    waterGrad.addColorStop(0.5, '#051830');
    waterGrad.addColorStop(1, '#020c1a');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let ray of lightRays) {
        ctx.fillStyle = 'rgba(80, 160, 200, ' + ray.alpha + ')';
        ctx.beginPath();
        ctx.moveTo(ray.x - ray.width/2, 0);
        ctx.lineTo(ray.x + ray.width/2, 0);
        ctx.lineTo(ray.x + ray.width * 2, canvas.height);
        ctx.lineTo(ray.x - ray.width * 2, canvas.height);
        ctx.closePath();
        ctx.fill();
    }
    for (let d of debris) {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.fillStyle = '#2a4a6a';
        ctx.fillRect(-d.width/2, -d.height/2, d.width, d.height);
        ctx.restore();
    }
    for (let b of bubbles) {
        ctx.fillStyle = 'rgba(100, 180, 220, ' + (0.3 + Math.sin(frame * 0.05 + b.x) * 0.2) + ')';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(150, 220, 240, 0.5)';
        ctx.beginPath();
        ctx.arc(b.x - b.size/3, b.y - b.size/3, b.size/3, 0, Math.PI * 2);
        ctx.fill();
    }
    drawPlayerUnderwater();
    if (player.panic > 30) {
        let intensity = (player.panic - 30) / 70;
        ctx.fillStyle = 'rgba(120, 30, 30, ' + (intensity * 0.15) + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawUnderwater() {
    let activatedLevers = puzzles.filter(function(p) { return p.type === 'lever' && p.activated; }).length;
    let progress = activatedLevers / 2;
    let waterGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    waterGrad.addColorStop(0, 'rgba(' + (10 + progress * 20) + ',' + (40 + progress * 40) + ',' + (80 + progress * 40) + ', 1)');
    waterGrad.addColorStop(0.5, 'rgba(' + (5 + progress * 15) + ',' + (25 + progress * 30) + ',' + (50 + progress * 30) + ', 1)');
    waterGrad.addColorStop(1, 'rgba(' + (2 + progress * 10) + ',' + (15 + progress * 20) + ',' + (30 + progress * 20) + ', 1)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let ray of lightRays) {
        let rx = ray.x - camera.x;
        if (rx > -200 && rx < canvas.width + 200) {
            ctx.fillStyle = 'rgba(' + (100 + progress * 50) + ',' + (180 + progress * 40) + ',' + (220 + progress * 20) + ', ' + (ray.alpha + progress * 0.05) + ')';
            ctx.beginPath();
            ctx.moveTo(rx - ray.width/2, 0);
            ctx.lineTo(rx + ray.width/2, 0);
            ctx.lineTo(rx + ray.width * 2.5, canvas.height);
            ctx.lineTo(rx - ray.width * 2.5, canvas.height);
            ctx.closePath();
            ctx.fill();
        }
    }
    for (let r of ruins) {
        let rx = r.x - camera.x;
        if (rx + r.width < -50 || rx > canvas.width + 50) continue;
        ctx.fillStyle = 'rgba(' + (8 + progress * 10) + ',' + (25 + progress * 20) + ',' + (45 + progress * 15) + ', 0.8)';
        ctx.fillRect(rx, r.y, r.width, r.height);
        ctx.strokeStyle = 'rgba(5, 15, 30, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rx + 10, r.y + 30);
        ctx.lineTo(rx + 20, r.y + 60);
        ctx.lineTo(rx + 15, r.y + 90);
        ctx.stroke();
    }
    for (let p of puzzles) {
        let px = p.x - camera.x;
        if (px < -50 || px > canvas.width + 50) continue;
        if (p.type === 'lever') {
            ctx.fillStyle = p.activated ? '#4a9a6a' : '#3a6a8a';
            ctx.fillRect(px - 5, p.y, 10, 40);
            ctx.fillStyle = p.activated ? '#6aca8a' : '#5a9aba';
            ctx.beginPath();
            ctx.arc(px, p.activated ? p.y + 10 : p.y + 30, 8, 0, Math.PI * 2);
            ctx.fill();
            if (!p.activated) {
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(px, p.y + 30, 15, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (p.type === 'door') {
            ctx.fillStyle = p.open ? 'rgba(' + (20 + progress * 30) + ',' + (60 + progress * 40) + ',' + (40 + progress * 30) + ', 0.6)' : '#2a4a6a';
            ctx.fillRect(px, p.y, p.width, p.height);
            if (!p.open) {
                ctx.strokeStyle = '#4a8aaa';
                ctx.lineWidth = 3;
                ctx.strokeRect(px, p.y, p.width, p.height);
                ctx.fillStyle = '#6ab0d0';
                ctx.font = '20px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('🔒', px + p.width/2, p.y + p.height/2 + 7);
            } else {
                ctx.fillStyle = '#8ae0a0';
                ctx.font = '20px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('✓', px + p.width/2, p.y + p.height/2 + 7);
            }
        } else if (p.type === 'key') {
            if (!p.collected) {
                ctx.fillStyle = '#e0c060';
                ctx.beginPath();
                ctx.arc(px, p.y, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#f0e080';
                ctx.beginPath();
                ctx.arc(px - 3, p.y - 3, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (p.type === 'symbol') {
            if (!p.matched) {
                ctx.fillStyle = 'rgba(100, 60, 160, 0.6)';
                ctx.fillRect(px - 17, p.y - 17, 34, 34);
                ctx.strokeStyle = '#8a6aca';
                ctx.lineWidth = 2;
                ctx.strokeRect(px - 17, p.y - 17, 34, 34);
                ctx.fillStyle = '#c0a0f0';
                ctx.font = '18px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(p.symbol, px, p.y + 6);
            }
        }
    }
    for (let b of bubbles) {
        ctx.fillStyle = 'rgba(100, 180, 220, ' + (0.3 + Math.sin(frame * 0.05 + b.x) * 0.2) + ')';
        ctx.beginPath();
        ctx.arc(b.x - camera.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
    }
    for (let p of particles) {
        ctx.fillStyle = 'rgba(100, 180, 200, ' + p.alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    if (shadow.active && shadow.size > 0) {
        let sx = shadow.x - camera.x;
        ctx.fillStyle = 'rgba(10, 5, 20, ' + (shadow.size / 100) + ')';
        ctx.beginPath();
        ctx.arc(sx, shadow.y, shadow.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(80, 20, 20, ' + (shadow.size / 200) + ')';
        ctx.beginPath();
        ctx.arc(sx, shadow.y, shadow.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
    drawPlayerUnderwater();
    if (player.panic > 30) {
        let intensity = (player.panic - 30) / 70;
        ctx.fillStyle = 'rgba(120, 30, 30, ' + (intensity * 0.12) + ')';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // Interaction hint
    for (let p of puzzles) {
        let px = p.x - camera.x;
        let dist = Math.sqrt((player.x - p.x)**2 + (player.y - p.y)**2);
        if (dist < 60 && px > -50 && px < canvas.width + 50) {
            if ((p.type === 'lever' && !p.activated) || (p.type === 'key' && !p.collected) || (p.type === 'symbol' && !p.matched) || (p.type === 'door' && p.open)) {
                ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('[E] ' + (p.type === 'door' ? 'ENTER' : 'INTERACT'), px, p.y - 25);
            }
        }
    }
}

function drawPlayer() {
    let px = player.x - camera.x;
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(px, player.y, player.width, player.height);
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(px + 5, player.y + 5, 20, 15);
    ctx.fillStyle = '#4a4a5a';
    ctx.fillRect(px + 8, player.y + 25, 14, 20);
}

function drawPlayerUnderwater() {
    let px = player.x - camera.x;
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(px, player.y, player.width, player.height);
    ctx.fillStyle = '#2a3a4a';
    ctx.fillRect(px + 5, player.y + 5, 20, 15);
    ctx.fillStyle = '#3a4a5a';
    ctx.fillRect(px + 8, player.y + 25, 14, 20);
    // Arms floating
    ctx.fillStyle = '#1a2a3a';
    ctx.fillRect(px - 8, player.y + 15, 8, 25);
    ctx.fillRect(px + player.width, player.y + 15, 8, 25);
}

function trackPerformance(success) {
    ai.performance.push(success);
    if (ai.performance.length > 20) {
        ai.performance.shift();
    }
}

function updateAI() {
    if (ai.performance.length < 5) return;

    let successRate = ai.performance.filter(x => x).length / ai.performance.length;

    if (successRate > 0.7) {
        ai.difficulty = 3; // player strong → make hard
    } else if (successRate > 0.4) {
        ai.difficulty = 2;
    } else {
        ai.difficulty = 1; // player struggling → easy
    }
    updateLevelIndicator();
}

function updateLevelIndicator() {
    document.getElementById('levelIndicator').textContent = levelIndicatorBase + ' | AI: ' + (ai.difficulty === 1 ? 'CALM' : ai.difficulty === 2 ? 'RISING' : 'PANIC');
}

function gameLoop() {
    frame++;
    if (frame % 120 === 0 ) {
        trackPerformance(true);
        updateAI();
        collectData();
        trainModel();
        updateAIDifficulty();
    }
    if (gameState === 'bridge') {
        updateBridge();
        drawBridge();
    } else if (gameState === 'transition') {
        updateTransition();
        drawTransition();
    } else if (gameState === 'sinking') {
        updateSinking();
        drawSinking();
    } else if (gameState === 'underwater') {
        updateUnderwater();
        drawUnderwater();
    }
    requestAnimationFrame(gameLoop);
}

function showInstructions() {
    initAudio();
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('instructions').style.display = 'flex';
}

function startGame() {
    initAudio();
    document.getElementById('titleScreen').style.display = 'none';
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    gameState = 'bridge';
    initBridge();
    createModel();
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    gameState = 'bridge';
    initBridge();
}

function showTitle() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('victoryScreen').style.display = 'none';
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('titleScreen').style.display = 'flex';
    gameState = 'title';
}

function endGame(victory, text) {
    gameState = victory ? 'victory' : 'gameover';
    if (victory) {
        document.getElementById('victoryScreen').style.display = 'flex';
        playTone(523, 0.5, 'sine', 0.1);
        setTimeout(function() { playTone(659, 0.5, 'sine', 0.1); }, 400);
        setTimeout(function() { playTone(784, 0.8, 'sine', 0.15); }, 800);
    } else {
        document.getElementById('endText').textContent = text || 'The water claims another soul.';
        document.getElementById('gameOver').style.display = 'flex';
        playTone(100, 1.5, 'sawtooth', 0.1);
    }
    document.getElementById('oxygenBar').style.display = 'none';
    document.getElementById('oxygenLabel').style.display = 'none';
    document.getElementById('panicBar').style.display = 'none';
    document.getElementById('panicLabel').style.display = 'none';
    document.getElementById('shadowWarning').style.opacity = '0';
}

// Start the game loop
gameLoop();

let trainingData = [];

function collectData() {
    trainingData.push({
        panic: player.panic,
        oxygen: player.oxygen,
        speed: Math.abs(player.vx) + Math.abs(player.vy),
        label: player.panic > 60 || player.oxygen < 30 ? 0 : 1
        // 0 = struggling, 1 = doing well
    });

    if (trainingData.length > 200) {
        trainingData.shift();
    }
}

let model;

async function createModel() {
    model = tf.sequential();

    model.add(tf.layers.dense({ units: 8, inputShape: [3], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 4, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });
}

let isTraining = false;

async function trainModel() {
    if (trainingData.length < 50 || isTraining) return;

    isTraining = true;

    const xs = tf.tensor2d(trainingData.map(d => [
        d.panic / 100,
        d.oxygen / 100,
        d.speed / 10
    ]));

    const ys = tf.tensor2d(trainingData.map(d => [d.label]));

    await model.fit(xs, ys, {
        epochs: 1,
        shuffle: true
    });

    xs.dispose();
    ys.dispose();

    isTraining = false;
}
function predictPlayer() {
    if (!model) return 0.5; // safe fallback

    const input = tf.tensor2d([[
        player.panic / 100,
        player.oxygen / 100,
        (Math.abs(player.vx) + Math.abs(player.vy)) / 10
    ]]);

    const prediction = model.predict(input);
    const value = prediction.dataSync()[0];

    input.dispose();
    prediction.dispose();

    return value;
}

function updateAIDifficulty() {
    let result = predictPlayer();

    if (result > 0.7) {
        ai.difficulty = 3; // player strong
    } else if (result > 0.4) {
        ai.difficulty = 2;
    } else {
        ai.difficulty = 1; // struggling
    }
}
