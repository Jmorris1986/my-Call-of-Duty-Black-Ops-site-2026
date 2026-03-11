// Black Ops Mini FPS Game - Enhanced Realistic Version
// Uses Three.js for 3D rendering with advanced mechanics

let scene, camera, renderer;
let player = { 
  x: 0, 
  y: 0, 
  z: 0, 
  health: 100, 
  maxHealth: 100,
  ammo: 30,
  maxAmmo: 30,
  kills: 0,
  headshots: 0,
  currentWeapon: 'xm4',
  stance: 'standing' // standing, crouching
};

let weapons = {
  xm4: {
    name: 'XM4',
    damage: 25,
    fireRate: 100,
    recoil: 0.12,
    spread: 0.02,
    magSize: 30,
    fireMode: 'auto'
  },
  pistol: {
    name: '1911',
    damage: 40,
    fireRate: 150,
    recoil: 0.3,
    spread: 0.05,
    magSize: 8,
    fireMode: 'semi'
  }
};

let enemies = [];
let particles = [];
let bloodSplats = [];
let canShoot = true;
let lastShotTime = 0;
let gameRunning = false;
let keys = { w: false, a: false, s: false, d: false, ctrl: false };
let mouseDown = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let camShake = 0;

function initGame() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 800, 1500);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 1.6, 0);

  // Renderer setup
  const canvas = document.getElementById('gameCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;
  renderer.shadowMap.resolution = 2048;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
  directionalLight.position.set(100, 100, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 4096;
  directionalLight.shadow.mapSize.height = 4096;
  directionalLight.shadow.camera.left = -200;
  directionalLight.shadow.camera.right = 200;
  directionalLight.shadow.camera.top = 200;
  directionalLight.shadow.camera.bottom = -200;
  directionalLight.shadow.bias = -0.0001;
  scene.add(directionalLight);

  // Additional fill light
  const fillLight = new THREE.DirectionalLight(0x7777ff, 0.3);
  fillLight.position.set(-100, 50, -50);
  scene.add(fillLight);

  // Create enhanced arena
  createDetailedArena();

  // Create enemies
  createEnemies();

  // Input handling
  setupInput();

  // Window resize
  window.addEventListener('resize', onWindowResize);

  // Initialize HUD
  updateHUD();

  // Start game loop
  gameRunning = true;
  animate();
}

function createDetailedArena() {
  // Ground with texture-like pattern
  const groundGeometry = new THREE.PlaneGeometry(600, 600);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a3a3a,
    metalness: 0.1,
    roughness: 0.8
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Ground lines for perspective
  const lineGeometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = -300; i <= 300; i += 50) {
    vertices.push(-300, 0.01, i);
    vertices.push(300, 0.01, i);
    vertices.push(i, 0.01, -300);
    vertices.push(i, 0.01, 300);
  }
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 1 });
  const lineGeometry2 = new THREE.BufferGeometry();
  lineGeometry2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  const gridLines = new THREE.LineSegments(lineGeometry2, lineMaterial);
  gridLines.position.y = 0.02;
  scene.add(gridLines);

  // Concrete walls with details
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555555,
    metalness: 0.2,
    roughness: 0.9
  });
  const wallHeight = 120;
  const wallThickness = 8;

  // Create walls with multiple segments for better detail
  const wallSegments = [
    { x: 0, z: -300, rotY: 0, width: 600 },
    { x: 0, z: 300, rotY: 0, width: 600 },
    { x: -300, z: 0, rotY: Math.PI / 2, width: 600 },
    { x: 300, z: 0, rotY: Math.PI / 2, width: 600 }
  ];

  wallSegments.forEach(seg => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(seg.width, wallHeight, wallThickness), wallMaterial);
    wall.position.set(seg.x, wallHeight / 2, seg.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  });

  // Large structural obstacles
  const obstacles = [
    { x: -120, z: 80, w: 60, h: 50, d: 60, color: 0x444444 },
    { x: 140, z: -100, w: 70, h: 45, d: 50, color: 0x333333 },
    { x: 0, z: -120, w: 55, h: 60, d: 55, color: 0x404040 },
    { x: -150, z: -80, w: 45, h: 40, d: 40, color: 0x363636 },
    { x: 170, z: 120, w: 50, h: 55, d: 65, color: 0x3a3a3a }
  ];

  obstacles.forEach(obs => {
    const obstacle = new THREE.Mesh(
      new THREE.BoxGeometry(obs.w, obs.h, obs.d),
      new THREE.MeshStandardMaterial({ color: obs.color, metalness: 0.1, roughness: 0.8 })
    );
    obstacle.position.set(obs.x, obs.h / 2, obs.z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
  });

  // Small barriers for cover
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 200;
    const barrierX = Math.cos(angle) * radius;
    const barrierZ = Math.sin(angle) * radius;

    const barrier = new THREE.Mesh(
      new THREE.BoxGeometry(30, 35, 15),
      new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.15, roughness: 0.85 })
    );
    barrier.position.set(barrierX, 17.5, barrierZ);
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    scene.add(barrier);
  }

  // Pillars
  for (let i = 0; i < 6; i++) {
    const pillarX = (i % 3) * 150 - 150;
    const pillarZ = Math.floor(i / 3) * 200 - 100;

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(12, 12, 100, 16),
      new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.2, roughness: 0.8 })
    );
    pillar.position.set(pillarX, 50, pillarZ);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
  }
}

function createEnemies() {
  const positions = [
    { x: -150, z: -150, difficulty: 'medium' },
    { x: 150, z: -150, difficulty: 'hard' },
    { x: -150, z: 150, difficulty: 'medium' },
    { x: 150, z: 150, difficulty: 'hard' },
    { x: 0, z: -200, difficulty: 'easy' },
    { x: 200, z: 0, difficulty: 'medium' },
    { x: 0, z: 200, difficulty: 'medium' }
  ];

  positions.forEach((pos, index) => {
    createEnemy(pos.x, pos.z, pos.difficulty);
  });
}

function createEnemy(x, z, difficulty = 'medium') {
  // Body
  const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5);
  const bodyColor = difficulty === 'hard' ? 0x660000 : difficulty === 'medium' ? 0x770000 : 0x550000;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.1, roughness: 0.8 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(x, 1, z);
  body.castShadow = true;
  body.receiveShadow = true;
  body.userData.isEnemy = true;
  body.userData.health = difficulty === 'hard' ? 150 : difficulty === 'medium' ? 100 : 80;
  scene.add(body);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa, metalness: 0, roughness: 0.8 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(x, 2.6, z);
  head.castShadow = true;
  head.receiveShadow = true;
  head.userData.isEnemy = true;
  head.userData.isHead = true;
  head.userData.health = Infinity; // headshot detection handled separately
  scene.add(head);

  // Arms
  const armGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.3);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa, metalness: 0, roughness: 0.8 });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(x - 0.6, 1.5, z);
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  scene.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(x + 0.6, 1.5, z);
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  scene.add(rightArm);

  enemies.push({
    body: body,
    head: head,
    leftArm: leftArm,
    rightArm: rightArm,
    health: difficulty === 'hard' ? 150 : difficulty === 'medium' ? 100 : 80,
    maxHealth: difficulty === 'hard' ? 150 : difficulty === 'medium' ? 100 : 80,
    x: x,
    z: z,
    vx: 0,
    vz: 0,
    dead: false,
    lastShootTime: 0,
    coverPos: null,
    difficulty: difficulty,
    ai: {
      state: 'idle', // idle, chase, cover
      timer: 0
    }
  });
}

function setupInput() {
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;
    if (key === 'control') keys.ctrl = true;
    if (key === 'r') reload();
    if (key === '1') switchWeapon('xm4');
    if (key === '2') switchWeapon('pistol');
  });

  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;
    if (key === 'control') keys.ctrl = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (!gameRunning) return;
    const deltaX = e.movementX || 0;
    const deltaY = e.movementY || 0;
    
    camera.rotation.order = 'YXZ';
    camera.rotation.y -= deltaX * 0.002;
    camera.rotation.x -= deltaY * 0.002;
    
    const maxLookAngle = Math.PI / 2;
    camera.rotation.x = Math.max(-maxLookAngle, Math.min(maxLookAngle, camera.rotation.x));
  });

  document.addEventListener('mousedown', () => {
    mouseDown = true;
  });

  document.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  document.getElementById('gameContainer').addEventListener('click', () => {
    document.getElementById('gameCanvas').requestPointerLock();
  });
}

function updatePlayer() {
  const baseSpeed = 0.4;
  const sprintSpeed = 0.7;
  const speed = keys.ctrl ? sprintSpeed : baseSpeed;
  
  const direction = new THREE.Vector3();

  if (keys.w) direction.z -= 1;
  if (keys.s) direction.z += 1;
  if (keys.a) direction.x -= 1;
  if (keys.d) direction.x += 1;

  if (direction.length() > 0) {
    direction.normalize();
    
    const forward = new THREE.Vector3(0, 0, -1);
    const right = new THREE.Vector3(1, 0, 0);
    
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), camera.rotation.y);

    const moveDirection = new THREE.Vector3();
    moveDirection.addScaledVector(forward, -direction.z);
    moveDirection.addScaledVector(right, direction.x);

    camera.position.x += moveDirection.x * speed;
    camera.position.z += moveDirection.z * speed;

    // Boundary check
    camera.position.x = Math.max(-290, Math.min(290, camera.position.x));
    camera.position.z = Math.max(-290, Math.min(290, camera.position.z));
  }

  // Camera shake from recoil
  if (camShake > 0) {
    camera.position.x += (Math.random() - 0.5) * camShake;
    camera.position.y += (Math.random() - 0.5) * camShake;
    camShake *= 0.85;
  }
}

function shoot() {
  const now = Date.now();
  const currentWeaponStats = weapons[player.currentWeapon];
  
  if (!canShoot || player.ammo <= 0 || (now - lastShotTime) < currentWeaponStats.fireRate) {
    return;
  }

  lastShotTime = now;
  canShoot = false;
  player.ammo--;
  updateHUD();

  // Recoil effect
  camShake = currentWeaponStats.recoil;
  camera.rotation.x -= currentWeaponStats.recoil * 0.5;
  camera.rotation.y += (Math.random() - 0.5) * currentWeaponStats.recoil;

  // Muzzle flash
  createMuzzleFlash();

  // Cast ray from camera with spread
  const spread = currentWeaponStats.spread;
  raycaster.setFromCamera(new THREE.Vector2(
    (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread
  ), camera);

  const intersects = raycaster.intersectObjects(scene.children);

  for (let intersection of intersects) {
    const obj = intersection.object;
    
    if (obj.userData.isEnemy) {
      const isHeadshot = obj.userData.isHead;
      const damageMultiplier = isHeadshot ? 2.5 : 1;
      const damage = currentWeaponStats.damage * damageMultiplier;

      enemies.forEach(enemy => {
        if (enemy.body === obj || enemy.head === obj) {
          if (!enemy.dead) {
            enemy.health -= damage;
            
            // Blood effect
            createBloodEffect(intersection.point);

            if (enemy.health <= 0) {
              enemy.dead = true;
              enemy.body.visible = false;
              enemy.head.visible = false;
              enemy.leftArm.visible = false;
              enemy.rightArm.visible = false;
              player.kills++;
              
              if (isHeadshot) {
                player.headshots++;
              }
              
              updateHUD();
            }
          }
        }
      });
      break;
    }
  }

  setTimeout(() => {
    canShoot = true;
  }, 50);
}

function createMuzzleFlash() {
  const flashGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  
  const forward = new THREE.Vector3(0, 0, -5);
  forward.applyQuaternion(camera.quaternion);
  
  flash.position.copy(camera.position).add(forward);
  scene.add(flash);

  setTimeout(() => {
    scene.remove(flash);
  }, 50);
}

function createBloodEffect(position) {
  const particleGeometry = new THREE.SphereGeometry(0.1, 4, 4);
  const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
  for (let i = 0; i < 5; i++) {
    const particle = new THREE.Mesh(particleGeometry, particleMaterial.clone());
    particle.position.copy(position);
    
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 1.5,
      (Math.random() - 0.5) * 2
    );
    
    scene.add(particle);
    particles.push({ mesh: particle, life: 1, maxLife: 1 });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= 0.02;
    
    if (p.life <= 0) {
      scene.remove(p.mesh);
      particles.splice(i, 1);
      continue;
    }

    p.mesh.position.add(p.mesh.velocity);
    p.mesh.velocity.y -= 0.05; // Gravity
    p.mesh.material.opacity = p.life;
  }
}

function updateEnemyAI() {
  enemies.forEach(enemy => {
    if (enemy.dead) return;

    const dx = camera.position.x - enemy.x;
    const dz = camera.position.z - enemy.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    enemy.ai.timer++;

    // AI state machine
    if (distance < 400) {
      if (Math.random() > 0.98) {
        // Occasionally seek cover
        enemy.ai.state = enemy.ai.state === 'cover' ? 'chase' : 'cover';
        enemy.ai.timer = 0;
      }

      // Move towards/away from player
      const moveSpeed = enemy.difficulty === 'hard' ? 0.25 : 0.18;
      
      if (distance > 50) {
        enemy.x += (dx / distance) * moveSpeed;
        enemy.z += (dz / distance) * moveSpeed;
      } else {
        // Strafe when too close
        enemy.x += (Math.random() - 0.5) * 0.3;
        enemy.z += (Math.random() - 0.5) * 0.3;
      }

      // Boundary check
      enemy.x = Math.max(-280, Math.min(280, enemy.x));
      enemy.z = Math.max(-280, Math.min(280, enemy.z));

      enemy.body.position.set(enemy.x, 1, enemy.z);
      enemy.head.position.set(enemy.x, 2.6, enemy.z);
      enemy.leftArm.position.set(enemy.x - 0.6, 1.5, enemy.z);
      enemy.rightArm.position.set(enemy.x + 0.6, 1.5, enemy.z);

      // Shooting logic
      const shootCooldown = enemy.difficulty === 'hard' ? 300 : 400;
      if ((Date.now() - enemy.lastShootTime) > shootCooldown && distance < 300) {
        enemyShoot(enemy);
        enemy.lastShootTime = Date.now();
      }
    }
  });
}

function enemyShoot(enemy) {
  const dx = camera.position.x - enemy.x;
  const dz = camera.position.z - enemy.z;
  const distance = Math.sqrt(dx * dx + dz * dz);

  // Random chance to hit based on difficulty
  const hitChance = enemy.difficulty === 'hard' ? 0.6 : enemy.difficulty === 'medium' ? 0.4 : 0.25;
  
  if (Math.random() < hitChance) {
    const damage = enemy.difficulty === 'hard' ? 12 : enemy.difficulty === 'medium' ? 8 : 5;
    player.health -= damage;
    updateHUD();

    if (player.health <= 0) {
      endGame();
    }
  }
}

function reload() {
  player.ammo = player.maxAmmo;
  updateHUD();
}

function switchWeapon(weapon) {
  if (weapon in weapons) {
    player.currentWeapon = weapon;
    player.ammo = weapons[weapon].magSize;
    updateHUD();
  }
}

function updateHUD() {
  const weapon = weapons[player.currentWeapon];
  document.getElementById('ammoCount').textContent = player.ammo + '/' + weapon.magSize;
  document.getElementById('killCount').textContent = player.kills;
  document.getElementById('healthCount').textContent = player.health;
  document.getElementById('weaponName').textContent = weapon.name;
  document.getElementById('headshots').textContent = player.headshots;
  document.getElementById('targetCount').textContent = enemies.filter(e => !e.dead).length;
  
  // Update mission stats
  document.getElementById('killStats').textContent = player.kills;
  document.getElementById('headshotStats').textContent = player.headshots;
  
  const accuracy = player.kills > 0 ? Math.round((player.headshots / player.kills) * 100) : 0;
  document.getElementById('accuracyStats').textContent = accuracy;
  
  // Health bar and status
  const healthBar = document.getElementById('healthBar');
  const healthPercent = (player.health / player.maxHealth) * 100;
  healthBar.style.width = healthPercent + '%';
  
  let healthStatus = 'OPTIMAL';
  let healthColor = 'linear-gradient(90deg, #00ff00, #00cc00)';
  
  if (player.health <= 20) {
    healthStatus = 'CRITICAL';
    healthColor = 'linear-gradient(90deg, #ff0000, #cc0000)';
  } else if (player.health <= 50) {
    healthStatus = 'INJURED';
    healthColor = 'linear-gradient(90deg, #ffaa00, #ff6600)';
  } else if (player.health < 100) {
    healthStatus = 'DAMAGED';
    healthColor = 'linear-gradient(90deg, #ffff00, #ffaa00)';
  }
  
  document.getElementById('healthStatus').textContent = healthStatus;
  healthBar.style.background = healthColor;
}

function animate() {
  if (!gameRunning) return;

  requestAnimationFrame(animate);

  updatePlayer();
  updateEnemyAI();
  updateParticles();

  if (mouseDown) {
    shoot();
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function startGame() {
  const gameContainer = document.getElementById('gameContainer');
  const content = document.getElementById('content');
  const crosshair = document.querySelector('.hud-crosshair');
  const exitBtn = document.getElementById('exitGameBtn');

  gameContainer.style.display = 'block';
  content.style.display = 'none';
  window.showGameHUD();
  crosshair.style.display = 'block';
  exitBtn.style.display = 'block';

  if (!scene) {
    initGame();
  } else {
    gameRunning = true;
    animate();
  }

  document.getElementById('gameCanvas').requestPointerLock();
}

function exitGame() {
  gameRunning = false;
  const gameContainer = document.getElementById('gameContainer');
  const content = document.getElementById('content');
  const crosshair = document.querySelector('.hud-crosshair');
  const exitBtn = document.getElementById('exitGameBtn');

  gameContainer.style.display = 'none';
  content.style.display = 'block';
  window.hideGameHUD();
  crosshair.style.display = 'none';
  exitBtn.style.display = 'none';

  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  // Reset game state
  player = { 
    x: 0, y: 0, z: 0, health: 100, maxHealth: 100, ammo: 30, maxAmmo: 30, 
    kills: 0, headshots: 0, currentWeapon: 'xm4', stance: 'standing'
  };
  enemies = [];
  particles = [];
  canShoot = true;
  lastShotTime = 0;

  if (scene && renderer) {
    renderer.dispose();
    renderer = null;
    scene = null;
    camera = null;
  }
}

function endGame() {
  const accuracy = player.kills > 0 ? Math.round((player.headshots / player.kills) * 100) : 0;
  alert(`MISSION COMPLETE!\n\nKills: ${player.kills}\nHeadshots: ${player.headshots}\nAccuracy: ${accuracy}%`);
  exitGame();
}
