// Black Ops Mini FPS Game
// Controls: WASD to move, Mouse to look around, Click to shoot

let scene, camera, renderer;
let player = { x: 0, y: 0, z: 0, health: 100, ammo: 30, kills: 0 };
let enemies = [];
let canShoot = true;
let gameRunning = false;
let keys = { w: false, a: false, s: false, d: false };
let mouseDown = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

function initGame() {
  // Scene setup
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a1a);
  scene.fog = new THREE.Fog(0x1a1a1a, 500, 1000);

  // Camera setup
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 0);

  // Renderer setup
  const canvas = document.getElementById('gameCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowShadowMap;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);

  // Create arena
  createArena();

  // Create enemies
  createEnemies();

  // Input handling
  setupInput();

  // Window resize
  window.addEventListener('resize', onWindowResize);

  // Start game loop
  gameRunning = true;
  animate();
}

function createArena() {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(500, 500);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Walls
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const wallHeight = 100;
  const wallThickness = 5;

  // Create walls around arena
  for (let i = 0; i < 4; i++) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(250, wallHeight, wallThickness),
      wallMaterial
    );
    wall.castShadow = true;
    wall.receiveShadow = true;
    
    if (i === 0) wall.position.set(0, wallHeight / 2, -250);
    if (i === 1) wall.position.set(0, wallHeight / 2, 250);
    if (i === 2) wall.position.set(-250, wallHeight / 2, 0);
    if (i === 3) wall.position.set(250, wallHeight / 2, 0);
    
    scene.add(wall);
  }

  // Add some obstacles
  const obstacle1 = new THREE.Mesh(
    new THREE.BoxGeometry(50, 40, 50),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  obstacle1.position.set(-80, 20, 80);
  obstacle1.castShadow = true;
  obstacle1.receiveShadow = true;
  scene.add(obstacle1);

  const obstacle2 = new THREE.Mesh(
    new THREE.BoxGeometry(60, 35, 40),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  obstacle2.position.set(100, 17.5, -60);
  obstacle2.castShadow = true;
  obstacle2.receiveShadow = true;
  scene.add(obstacle2);

  const obstacle3 = new THREE.Mesh(
    new THREE.BoxGeometry(40, 50, 60),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
  );
  obstacle3.position.set(0, 25, 0);
  obstacle3.castShadow = true;
  obstacle3.receiveShadow = true;
  scene.add(obstacle3);
}

function createEnemies() {
  // Create 5 enemy soldiers
  const positions = [
    { x: -100, z: -100 },
    { x: 100, z: -100 },
    { x: -100, z: 100 },
    { x: 100, z: 100 },
    { x: 0, z: -150 }
  ];

  positions.forEach((pos, index) => {
    const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x330000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(pos.x, 1, pos.z);
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.isEnemy = true;
    body.userData.health = 100;
    scene.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(pos.x, 2.5, pos.z);
    head.castShadow = true;
    head.receiveShadow = true;
    scene.add(head);

    enemies.push({
      body: body,
      head: head,
      health: 100,
      x: pos.x,
      z: pos.z,
      dead: false
    });
  });
}

function setupInput() {
  // Keyboard
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = true;
    if (key === 'a') keys.a = true;
    if (key === 's') keys.s = true;
    if (key === 'd') keys.d = true;
  });

  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'w') keys.w = false;
    if (key === 'a') keys.a = false;
    if (key === 's') keys.s = false;
    if (key === 'd') keys.d = false;
  });

  // Mouse look
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

  // Shooting
  document.addEventListener('mousedown', () => {
    mouseDown = true;
  });

  document.addEventListener('mouseup', () => {
    mouseDown = false;
  });

  // Lock pointer
  document.getElementById('gameContainer').addEventListener('click', () => {
    document.getElementById('gameCanvas').requestPointerLock();
  });
}

function updatePlayer() {
  const speed = 0.5;
  const direction = new THREE.Vector3();

  if (keys.w) direction.z -= 1;
  if (keys.s) direction.z += 1;
  if (keys.a) direction.x -= 1;
  if (keys.d) direction.x += 1;

  if (direction.length() > 0) {
    direction.normalize();
    
    // Rotate direction based on camera rotation
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
    camera.position.x = Math.max(-245, Math.min(245, camera.position.x));
    camera.position.z = Math.max(-245, Math.min(245, camera.position.z));
  }
}

function shoot() {
  if (!canShoot || player.ammo <= 0) return;

  canShoot = false;
  player.ammo--;
  updateHUD();

  // Cast ray from camera
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects(scene.children);

  for (let intersection of intersects) {
    const obj = intersection.object;
    
    // Check if hit an enemy
    if (obj.userData.isEnemy) {
      obj.userData.health -= 50;
      if (obj.userData.health <= 0) {
        // Enemy dies
        enemies.forEach(enemy => {
          if (enemy.body === obj) {
            enemy.dead = true;
            enemy.body.visible = false;
            enemy.head.visible = false;
            player.kills++;
            updateHUD();
          }
        });
      }
      break;
    }
  }

  // Reload after 0.1 seconds
  setTimeout(() => {
    canShoot = true;
  }, 100);
}

function updateHUD() {
  document.getElementById('ammoCount').textContent = player.ammo;
  document.getElementById('killCount').textContent = player.kills;
  document.getElementById('healthCount').textContent = player.health;
}

function animate() {
  if (!gameRunning) return;

  requestAnimationFrame(animate);

  updatePlayer();

  // Shooting
  if (mouseDown) {
    shoot();
  }

  // Update enemy AI
  enemies.forEach(enemy => {
    if (enemy.dead) return;

    const dx = camera.position.x - enemy.x;
    const dz = camera.position.z - enemy.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Simple AI - move towards player
    if (distance > 10) {
      const speed = 0.15;
      enemy.x += (dx / distance) * speed;
      enemy.z += (dz / distance) * speed;
      enemy.body.position.set(enemy.x, 1, enemy.z);
      enemy.head.position.set(enemy.x, 2.5, enemy.z);
    }

    // Enemy shoots back
    if (distance < 200 && Math.random() > 0.98) {
      player.health -= 5;
      updateHUD();
      if (player.health <= 0) {
        endGame();
      }
    }
  });

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
  const gameHUD = document.getElementById('gameHUD');
  const crosshair = document.querySelector('.hud-crosshair');
  const exitBtn = document.getElementById('exitGameBtn');

  gameContainer.style.display = 'block';
  content.style.display = 'none';
  gameHUD.style.display = 'block';
  crosshair.style.display = 'block';
  exitBtn.style.display = 'block';

  if (!scene) {
    initGame();
  } else {
    gameRunning = true;
    animate();
  }

  // Request pointer lock
  document.getElementById('gameCanvas').requestPointerLock();
}

function exitGame() {
  gameRunning = false;
  const gameContainer = document.getElementById('gameContainer');
  const content = document.getElementById('content');
  const gameHUD = document.getElementById('gameHUD');
  const crosshair = document.querySelector('.hud-crosshair');
  const exitBtn = document.getElementById('exitGameBtn');

  gameContainer.style.display = 'none';
  content.style.display = 'block';
  gameHUD.style.display = 'none';
  crosshair.style.display = 'none';
  exitBtn.style.display = 'none';

  // Exit pointer lock
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  // Reset game state
  player = { x: 0, y: 0, z: 0, health: 100, ammo: 30, kills: 0 };
  enemies = [];
  canShoot = true;

  if (scene && renderer) {
    renderer.dispose();
    renderer = null;
    scene = null;
    camera = null;
  }
}

function endGame() {
  alert(`Game Over! You got ${player.kills} kills!`);
  exitGame();
}
