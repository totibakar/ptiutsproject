const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let runModeActive = false;

canvas.width = 800;
canvas.height = 600;

let worldWidth = canvas.width;
let worldHeight = canvas.height;

const charWidth = 32;
const charHeight = 42;
const zoomLevel = 2.0;
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    viewWidth: canvas.width / zoomLevel,
    viewHeight: canvas.height / zoomLevel,
    deadzoneX: canvas.width / 4,
    deadzoneY: canvas.height / 4,
    initialSetupDone: false
};
let isMapMode = false;
const animFramesConfig = { 
    idle: { count: 8, perDirection: 2 }, 
    walk: { count: 36, perDirection: 9 }, 
    run: { count: 32, perDirection: 8 },
    sit: { count: 4, perDirection: 1 }
};
const directionOrder = ['up', 'left', 'down', 'right'];

const collisionOffscreenCanvas = document.createElement('canvas');
let collisionOffscreenCtx = null;
let collisionDataReady = false;
const movementOffscreenCanvas = document.createElement('canvas');
let movementOffscreenCtx = null;
let movementDataReady = false;
const locationOffscreenCanvas = document.createElement('canvas');
let locationOffscreenCtx = null;
let locationDataReady = false;
const mapImage = new Image();
const collisionMapImage = new Image();
const movementMapImage = new Image();
const spawnMapImage = new Image();
const locationMapImage = new Image();
const liveLocationMapImage = new Image();
const mapPlayerIconImage = new Image();
let mapLoaded = false;
let collisionMapLoaded = false;
let movementMapLoaded = false;
let spawnMapLoaded = false;
let locationMapLoaded = false;
let liveLocationMapLoaded = false;
let mapIconLoaded = false;
let allSpritesLoaded = false;
let initialSpawnSet = false;
let currentLocationName = null;
let previousLocationName = null;
let locationTextAnimProgress = 0;
const locationTextAnimDuration = 1000;
let locationTextAnimStartTime = 0;
const locationColorMap = {
    '#0d00ff': 'Kota Willburg',
    '#0c049f': 'Desa Uwu',
    '#02064c': 'Desa Poke',
    '#2f3490': 'Kota Kecil',
    '#5b61de': 'Perkemahan Bandit',
    '#0c1067': 'Reruntuhan Hatiku',
    '#4a51d3': 'Pusat Kota Managarmr',
    '#888ab5': 'Kastil Kerajaan',
    '#5b5c6a': 'Menara Penyihir Sarungman',
    '#aeb2ff': 'Pelabuhan Indah Kapal',
    '#3e4171': 'Markas Tungtungtung Sahur',
    '#111235': 'Goa Monster Ambadala Crocodila',
    '#2d32a5': 'Goa Osas',
    '#232cde': 'Pohon Gede'
};
let gameLoopRunning = false;
const bounceAmplitude = 0.4;
const bounceSpeed = 0.004;
let loadSpriteFunction = null;

const openMapSound = new Audio('assets/sound/openmap.mp3');
const closeMapSound = new Audio('assets/sound/closemap.mp3');
const backgroundMusic = new Audio('assets/sound/bgm.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;
const walkSound = document.getElementById('walkSound');
const runSound = document.getElementById('runSound');
const hoverSound = document.getElementById('hoverSound');
let lastWalkSoundTime = 0;
let lastRunSoundTime = 0;
const SOUND_COOLDOWN = 500;

let lastStaminaDepletionTime = 0;
const RUN_COOLDOWN = 2000;
openMapSound.onerror = () => console.error("Gagal memuat sound/openmap.mp3");
closeMapSound.onerror = () => console.error("Gagal memuat sound/closemap.mp3");
backgroundMusic.onerror = () => console.error("Gagal memuat sound/bgm.mp3");
let userInteracted = false;
let bgmPlaying = false;

function tryStartBackgroundMusic() {
    if (userInteracted && !bgmPlaying) {
        backgroundMusic.play().then(() => {
            bgmPlaying = true;
            console.log("Background music dimulai.");
        }).catch(error => {
            console.error("Gagal memulai background music:", error);
        });
    }
}

mapImage.onload = () => { mapLoaded = true; if (worldWidth === canvas.width) { worldWidth = mapImage.naturalWidth; worldHeight = mapImage.naturalHeight; console.log(`Dimensi Dunia di-set oleh Peta Visual: ${worldWidth}x${worldHeight}`); } console.log(`Peta visual (${mapImage.src}) dimuat.`); centerCameraOnPlayer(); checkAllAssetsLoaded(); };
collisionMapImage.onload = () => { collisionMapLoaded = true; if (worldWidth === canvas.width) { worldWidth = collisionMapImage.naturalWidth; worldHeight = collisionMapImage.naturalHeight; console.log(`Dimensi Dunia di-set oleh Collision Map: ${worldWidth}x${worldHeight}`); } else if (worldWidth > canvas.width && (worldWidth !== collisionMapImage.naturalWidth || worldHeight !== collisionMapImage.naturalHeight)) { console.warn("PERINGATAN: Ukuran Collision Map berbeda!"); } console.log(`Collision map (${collisionMapImage.src}) dimuat.`); checkAllAssetsLoaded(); };
movementMapImage.onload = () => { movementMapLoaded = true; if (worldWidth === canvas.width) { worldWidth = movementMapImage.naturalWidth; worldHeight = movementMapImage.naturalHeight; console.log(`Dimensi Dunia di-set oleh Movement Map: ${worldWidth}x${worldHeight}`); } else if (worldWidth > canvas.width && (worldWidth !== movementMapImage.naturalWidth || worldHeight !== movementMapImage.naturalHeight)) { console.warn("PERINGATAN: Ukuran Movement Map berbeda!"); } console.log(`Movement map (${movementMapImage.src}) dimuat.`); checkAllAssetsLoaded(); };
spawnMapImage.onload = () => {
    spawnMapLoaded = true;
    if (worldWidth === canvas.width) {
        worldWidth = spawnMapImage.naturalWidth;
        worldHeight = spawnMapImage.naturalHeight;
        console.log(`Dimensi Dunia di-set oleh Spawn Map: ${worldWidth}x${worldHeight}`);
     } else if (worldWidth > canvas.width && (worldWidth !== spawnMapImage.naturalWidth || worldHeight !== spawnMapImage.naturalHeight)) {
         console.warn("PERINGATAN: Ukuran Spawn Map berbeda dengan peta lain!");
     }
    console.log(`Spawn map (${spawnMapImage.src}) dimuat.`);
    checkAllAssetsLoaded();
};
locationMapImage.onload = () => {
    locationMapLoaded = true;
    if (worldWidth === canvas.width) {
        worldWidth = locationMapImage.naturalWidth;
        worldHeight = locationMapImage.naturalHeight;
        console.log(`Dimensi Dunia di-set oleh Location Map: ${worldWidth}x${worldHeight}`);
     } else if (worldWidth > canvas.width && (worldWidth !== locationMapImage.naturalWidth || worldHeight !== locationMapImage.naturalHeight)) {
         console.warn("PERINGATAN: Ukuran Location Map berbeda dengan peta lain!");
     }
    console.log(`Location map (${locationMapImage.src}) dimuat.`);
    checkAllAssetsLoaded();
};
liveLocationMapImage.onload = () => {
    liveLocationMapLoaded = true;
    if (worldWidth === canvas.width) {
        worldWidth = liveLocationMapImage.naturalWidth;
        worldHeight = liveLocationMapImage.naturalHeight;
        console.log(`Dimensi Dunia di-set oleh Live Location Map: ${worldWidth}x${worldHeight}`);
     } else if (worldWidth > canvas.width && (worldWidth !== liveLocationMapImage.naturalWidth || worldHeight !== liveLocationMapImage.naturalHeight)) {
         console.warn("PERINGATAN: Ukuran Live Location Map berbeda dengan peta lain!");
     }
    console.log(`Live Location map (${liveLocationMapImage.src}) dimuat.`);
    checkAllAssetsLoaded();
};
mapPlayerIconImage.onload = () => {
    mapIconLoaded = true;
    console.log(`Map player icon (${mapPlayerIconImage.src}) dimuat.`);
    checkAllAssetsLoaded();
};

mapImage.onerror = () => console.error("Gagal memuat gambar peta visual!");
collisionMapImage.onerror = () => console.error("Gagal memuat collision map!");
movementMapImage.onerror = () => console.error("Gagal memuat movement map!");
spawnMapImage.onerror = () => console.error("Gagal memuat spawn map!");
locationMapImage.onerror = () => console.error("Gagal memuat location map!");
liveLocationMapImage.onerror = () => console.error("Gagal memuat live location map!");
mapPlayerIconImage.onerror = () => console.error("Gagal memuat map player icon!");

mapImage.src = 'assets/map/Elendor.png';
collisionMapImage.src = 'assets/map/TerrainBlock.png';
movementMapImage.src = 'assets/map/TerrainMovement.png';
spawnMapImage.src = 'assets/map/Spawn.png';
locationMapImage.src = 'assets/map/Locations.png'; 
liveLocationMapImage.src = 'assets/map/LiveLocation.png'; 
mapPlayerIconImage.src = 'assets/mapplayericon.png';

console.log("About to load player data from main menu");
window.loadSpriteFunction = loadPlayerDataFromMainMenu();
console.log("Player data loaded, sprite function:", typeof window.loadSpriteFunction);

console.log("Player stats in Arena:", {
    class: player.characterClass,
    hp: player.hp,
    maxHp: player.maxHp,
    damage: player.damage,
    speed: player.speed,
    armor: player.armor
});

let totalImagesToLoad = animFramesConfig.idle.count + animFramesConfig.walk.count + animFramesConfig.run.count + animFramesConfig.sit.count;
let imagesLoaded = 0;

function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImagesToLoad) {
        allSpritesLoaded = true;
        console.log("Semua gambar sprite berhasil dimuat.");
        checkAllAssetsLoaded();
    }
}

function checkAllAssetsLoaded() {
    if (mapLoaded && allSpritesLoaded && collisionMapLoaded && movementMapLoaded && spawnMapLoaded && locationMapLoaded && liveLocationMapLoaded && mapIconLoaded) {
        console.log("Semua gambar dasar (termasuk ikon) telah dimuat.");

        if (!collisionDataReady) setupCollisionDataCanvas();
        if (!movementDataReady) setupMovementDataCanvas();
        if (!locationDataReady) setupLocationDataCanvas();

        if (collisionDataReady && movementDataReady && locationDataReady && !initialSpawnSet) {
             findSpawnPointsAndSetPlayer();
             initialSpawnSet = true;
        }

        if (collisionDataReady && movementDataReady && locationDataReady && initialSpawnSet) {
             console.log("Semua data siap & spawn point di-set. Memulai game loop.");
             if (!camera.initialSetupDone) {
                centerCameraOnPlayer();
                camera.initialSetupDone = true;
                updateCurrentSprite();
             }

             tryStartBackgroundMusic();

             updateUI();

             if (!gameLoopRunning) {
                 setupDPadListeners();
                 gameLoopRunning = true;
                 gameLoop();
             }
        }
    }
}

function loadSprites() {
    if (typeof window.loadSpriteFunction === 'function') {
        console.log("Using custom sprite loader for character class:", player.characterClass);
        window.loadSpriteFunction();
        return;
    } else {
        console.log("No custom sprite loader found, using default Soldier sprites");
    }
    
    console.log("Mulai memuat semua gambar sprite...");
    ['idle', 'walk', 'run', 'sit'].forEach(state => {
        const config = animFramesConfig[state];
        if (!config) return;
        console.log(`Memuat ${config.count} frame untuk state: ${state}`);
        player.sprites[state] = [];
        for (let i = 1; i <= config.count; i++) {
            const img = new Image();
            const path = `assets/soldier/${state}/${state}${i}.png`;
            img.src = path;
            player.sprites[state].push(img);
            img.onload = imageLoaded;
            img.onerror = () => console.error(`Gagal memuat sprite: ${path}`);
        }
    });
}

const keys = {
    w: false, a: false, s: false, d: false, shift: false, m: false
};

let mKeyPressed = false;
let lastMapToggleTime = 0;
const MAP_TOGGLE_COOLDOWN = 300; 

let isInteractionPopupOpen = false;
let isGamePaused = false;
let isSaveLoadMenuOpen = false;
let ruinsPuzzleAttempted = false; 

const hpBarElement = document.getElementById('hp-bar');
const hungerBarElement = document.getElementById('hunger-bar');
const staminaBarElement = document.getElementById('stamina-bar');
const goldValueElement = document.getElementById('gold-value');
const playerGoldElement = document.getElementById('player-gold');
const relicSlots = document.querySelectorAll('.relic-slot');
const hpHungerFrame = document.getElementById('hp-hunger-frame');
const staminaFrame = document.getElementById('stamina-frame');
const popupContentElement = document.querySelector('#uiPanel .popup-content');
const popupLocationNameElement = document.querySelector('#uiPanel .popup-location-name');
const popupOptionsElement = document.querySelector('#uiPanel .popup-options');
const popupCloseBtnElement = document.querySelector('#uiPanel .popup-close-btn');
const pauseMenuElement = document.getElementById('pause-menu');
const saveloadMenuElement = document.getElementById('saveload-menu');
const saveloadTitleElement = document.getElementById('saveload-title');
const saveloadNewSection = document.getElementById('saveload-new');
const saveNameInputElement = document.getElementById('save-name-input');
const createSaveBtnElement = document.getElementById('create-save-btn');
const saveSlotsListElement = document.getElementById('save-slots-list');
const saveloadBackBtnElement = document.getElementById('saveload-back-btn');

const dpadContainer = document.getElementById('dpad-container');
const dpadUp = document.getElementById('dpad-up');
const dpadDown = document.getElementById('dpad-down');
const dpadLeft = document.getElementById('dpad-left');
const dpadRight = document.getElementById('dpad-right');
const dpadE = document.getElementById('dpad-e');
const dpadM = document.getElementById('dpad-m');
const dpadPause = document.getElementById('dpad-pause');
const dpadR = document.getElementById('dpad-r');

const SAVE_SLOT_PREFIX = 'elendorSave_';
const MAX_SAVE_SLOTS = 10;

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if (key === 'escape') {
        if (isSaveLoadMenuOpen) {
            hideSaveLoadMenu();
        } else if (isGamePaused) {
            continueGame();
        } else if (isInteractionPopupOpen) {
            closeInteractionPopup();
        } else {
            openPauseMenu();
        }
        return;
    }

    if (!isInteractionPopupOpen && !isGamePaused && !isSaveLoadMenuOpen) {
        if (key === 'e') {
            if (!isMapMode && currentLocationName) {
                createLocationPanel(currentLocationName);
            }
            return;
        }

        if (key in keys) keys[key] = true;
        
        if (key === 'm') {
            const currentTime = performance.now();
            if (currentTime - lastMapToggleTime >= MAP_TOGGLE_COOLDOWN) {
                lastMapToggleTime = currentTime;
                toggleMap();
            }
        }
    } else if (isInteractionPopupOpen && key === 'e') {
        closeInteractionPopup();
    }
});

window.addEventListener('keyup', (e) => {
     const key = e.key.toLowerCase();
     if (key in keys) keys[key] = false;
     if (key === 'm') mKeyPressed = false;
});

if (popupCloseBtnElement) {
    popupCloseBtnElement.addEventListener('click', closeInteractionPopup);
}

canvas.addEventListener('click', (e) => {
    if (isInteractionPopupOpen || isGamePaused || isSaveLoadMenuOpen) return;

    if (!isMapMode && collisionDataReady) {
        const rect = canvas.getBoundingClientRect();
        const clickCanvasX = e.clientX - rect.left;
        const clickCanvasY = e.clientY - rect.top;

        const clickWorldX = (clickCanvasX / zoomLevel) + camera.x;
        const clickWorldY = (clickCanvasY / zoomLevel) + camera.y;

        if (isPassable(clickWorldX, clickWorldY)) {
            player.targetX = clickWorldX - player.width / 2;
            player.targetY = clickWorldY - player.height / 2;
            keys.w = keys.a = keys.s = keys.d = keys.shift = false;
        } else {
            console.log("Klik pada area yang tidak bisa dilewati (berdasarkan collision map).");
        }
    }
});

function centerCameraOnPlayer() {
    let idealCamX = (player.x + player.width / 2) - (camera.viewWidth / 2);
    let idealCamY = (player.y + player.height / 2) - (camera.viewHeight / 2);

    camera.x = Math.max(0, Math.min(idealCamX, worldWidth - camera.viewWidth));
    camera.y = Math.max(0, Math.min(idealCamY, worldHeight - camera.viewHeight));
}

function update() {
    if (!allSpritesLoaded || !mapLoaded || !collisionDataReady || !movementDataReady || !locationDataReady) return;
    updateUI();

    if (!isGamePaused) {
        if (locationTextAnimProgress < 1) {
            const elapsed = performance.now() - locationTextAnimStartTime;
            if (elapsed < locationTextAnimDuration) {
                const t = elapsed / locationTextAnimDuration;
                locationTextAnimProgress = t * (2 - t);
            } else {
                locationTextAnimProgress = 1;
            }
        }

        if (!isMapMode) {
            const footX = player.x + player.width / 2;
            const footY = player.y + player.height;
            const newLocationName = getLocationName(footX, footY);
             if (newLocationName !== previousLocationName) {
                currentLocationName = newLocationName;
                if (currentLocationName) {
                    locationTextAnimStartTime = performance.now();
                    locationTextAnimProgress = 0;
                    console.log("Memasuki:", currentLocationName);
                } else {
                    locationTextAnimProgress = 0;
                }
                previousLocationName = currentLocationName;
             }

            player.dx = 0;
            player.dy = 0;
            player.isRunning = runModeActive || keys.shift;
            let baseSpeed = player.isRunning ? player.speed * player.runSpeedMultiplier : player.speed;
            const speedModifier = getSpeedModifier(player.x + player.width / 2, player.y + player.height);
            let effectiveSpeed = baseSpeed * speedModifier;

             if (player.targetX !== null && player.targetY !== null) {
                 const angle = Math.atan2(player.targetY - player.y, player.targetX - player.x);
                 const distance = Math.hypot(player.targetY - player.y, player.targetX - player.x);
                 const tolerance = effectiveSpeed;
                if (distance > tolerance) {
                    player.dx = Math.cos(angle) * effectiveSpeed;
                    player.dy = Math.sin(angle) * effectiveSpeed;
                    if (Math.abs(player.dx) > Math.abs(player.dy)) {
                        player.direction = player.dx > 0 ? 'right' : 'left';
                    } else {
                        player.direction = player.dy > 0 ? 'down' : 'up';
                    }
                } else {
                    player.x = player.targetX;
                    player.y = player.targetY;
                    player.targetX = null;
                    player.targetY = null;
                    player.dx = 0;
                    player.dy = 0;
                }
             } else {
                 let movedByKey = false;
                 if (keys.w) { player.dy = -effectiveSpeed; player.direction = 'up'; movedByKey = true; }
                 if (keys.s) { player.dy = effectiveSpeed; player.direction = 'down'; movedByKey = true; }
                 if (keys.a) { player.dx = -effectiveSpeed; player.direction = 'left'; movedByKey = true; }
                 if (keys.d) { player.dx = effectiveSpeed; player.direction = 'right'; movedByKey = true; }
                if (player.dx !== 0 && player.dy !== 0) {
                    const factor = effectiveSpeed / Math.sqrt(player.dx * player.dx + player.dy * player.dy);
                    player.dx *= factor;
                    player.dy *= factor;
                }
            }

            let nextX = player.x + player.dx;
            let nextY = player.y + player.dy;

            const collisionCheckPointX = nextX + player.width / 2;
            const collisionCheckPointY = nextY + player.height;
            const collisionFootWidth = player.width * 0.3;
            const collisionFootHeight = player.height * 0.2;

            let canMoveX = true;
            if (player.dx !== 0) {
                const checkY1 = collisionCheckPointY - collisionFootHeight * 0.25;
                const checkY2 = collisionCheckPointY - collisionFootHeight * 0.75;
                canMoveX = isPassable(collisionCheckPointX, checkY1) && isPassable(collisionCheckPointX, checkY2);
            }

            let canMoveY = true;
            if (player.dy !== 0) {
                const checkX1 = collisionCheckPointX - collisionFootWidth * 0.4;
                const checkX2 = collisionCheckPointX + collisionFootWidth * 0.4;
                canMoveY = isPassable(checkX1, collisionCheckPointY) && isPassable(checkX2, collisionCheckPointY);
            }

            if (!isPassable(collisionCheckPointX, collisionCheckPointY)) {
                canMoveX = false;
                canMoveY = false;
            }

            if (canMoveX) { player.x = Math.max(0, Math.min(nextX, worldWidth - player.width)); }
            if (canMoveY) { player.y = Math.max(0, Math.min(nextY, worldHeight - player.height)); }
            player.moving = (canMoveX && player.dx !== 0) || (canMoveY && player.dy !== 0);

             if (player.moving && player.isRunning) {
                 if (player.stamina > 0) {
                     player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN_RATE_RUN);
                     if (player.stamina === 0) { 
                         player.isRunning = false; 
                         keys.shift = false;
                        lastStaminaDepletionTime = performance.now();
                     }
                 } else {
                     player.isRunning = false; 
                     keys.shift = false;
                 }
             } else if (player.stamina < player.maxStamina) {
                 const regenRate = STAMINA_REGEN_RATE * (player.staminaRegenMultiplier || 1.0);
                 player.stamina = Math.min(player.maxStamina, player.stamina + regenRate);
             }

             if (player.stamina === 0) {
                 const currentTime = performance.now();
                 if (currentTime - lastStaminaDepletionTime < RUN_COOLDOWN) {
                     player.isRunning = false;
                     keys.shift = false;
                 }
             }

             if (player.hunger > 0) {
                 player.hunger = Math.max(0, player.hunger - PASSIVE_HUNGER_DRAIN_RATE);
             }

             if (player.hunger <= 0 && player.hp > 0) {
                 player.hp = Math.max(0, player.hp - HP_DRAIN_RATE_STARVATION);
                if (player.hp <= 0) {
                    showGameOverPopup();
                    return;
                }
            }

            if (player.moving) {
                player.animationState = player.isRunning ? 'run' : 'walk';
                player.lastMovementTime = performance.now();
            } else {
                const idleCheckTime = performance.now();
                if (idleCheckTime - player.lastMovementTime >= player.IDLE_TO_SIT_TIME) {
                    player.animationState = 'sit';
                } else {
                    player.animationState = 'idle';
                }
            }

             updateAnimation();
             centerCameraOnPlayer();

            const currentTime = performance.now();
            if (player.moving) {
                if (player.isRunning) {
                    if (currentTime - lastRunSoundTime >= SOUND_COOLDOWN) {
                        try {
                            runSound.currentTime = 0;
                            runSound.play();
                            lastRunSoundTime = currentTime;
                        } catch (e) {
                            console.error("Error playing run sound:", e);
                        }
                    }
                } else {
                    if (currentTime - lastWalkSoundTime >= SOUND_COOLDOWN) {
                        try {
                            walkSound.currentTime = 0;
                            walkSound.play();
                            lastWalkSoundTime = currentTime;
                        } catch (e) {
                            console.error("Error playing walk sound:", e);
                        }
                    }
                }
            }
        }

         updateCurrentSprite();
    }
}

function updateAnimation() {
    const currentAnimSpeed = player.isRunning ? player.framesPerRunAnimFrame : player.framesPerAnimFrame;
    player.animTimer++;
    if (player.animTimer >= currentAnimSpeed) {
        player.animTimer = 0;
        player.animFrameIndex++;
        const state = player.animationState;
        const config = animFramesConfig[state];
        if (config && player.animFrameIndex >= config.count) {
            player.animFrameIndex = 0;
        }
    }
}

function updateCurrentSprite() {
    const state = player.animationState;
    const direction = player.direction;

    const config = animFramesConfig[state];
    if (!config || !player.sprites[state] || player.sprites[state].length === 0) {
        console.error(`Sprite atau config untuk state '${state}' tidak ditemukan/kosong.`);
         ctx.fillStyle = 'magenta';
         ctx.fillRect(player.x, player.y, player.width, player.height);
         player.currentFrameImage = null;
        return;
    }

    const framesPerDir = config.perDirection;
    const totalFramesForState = config.count;
    const dirIndex = directionOrder.indexOf(direction);

    if (dirIndex === -1) {
        console.error(`Arah tidak valid: ${direction}`);
        dirIndex = 2;
    }

    const baseFrameIndex = dirIndex * framesPerDir;

     if (baseFrameIndex >= player.sprites[state].length) {
         console.error(`Error: Base frame index (${baseFrameIndex}) melebihi jumlah frame (${player.sprites[state].length}) untuk state '${state}'. Periksa config dan jumlah file.`);
         ctx.fillStyle = 'orange';
         ctx.fillRect(player.x, player.y, player.width, player.height);
         player.currentFrameImage = null;
         return;
     }

    const currentFrameInSequence = player.animFrameIndex % framesPerDir;
    const finalFrameIndex = baseFrameIndex + currentFrameInSequence;

     if(finalFrameIndex < player.sprites[state].length) {
        player.currentFrameImage = player.sprites[state][finalFrameIndex];
     } else {
         console.error(`Error: Final frame index (${finalFrameIndex}) out of bounds for state '${state}' (Total: ${player.sprites[state].length}). Resetting.`);
         player.animFrameIndex = 0;
         player.currentFrameImage = player.sprites[state][baseFrameIndex];
         if (!player.currentFrameImage) {
             ctx.fillStyle = 'cyan';
             ctx.fillRect(player.x, player.y, player.width, player.height);
             player.currentFrameImage = null;
         }
     }
}



function draw() {
    if (!mapLoaded) {
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText("Loading map...", canvas.width / 2, canvas.height / 2);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const verticalBounceOffset = Math.sin(performance.now() * bounceSpeed) * bounceAmplitude;

    if (isMapMode) {
        ctx.drawImage(mapImage, 0, 0, worldWidth, worldHeight, 0, 0, canvas.width, canvas.height);

        if (liveLocationMapLoaded) {
            const mapModeBounceOffset = verticalBounceOffset * 2;
            ctx.drawImage(
                liveLocationMapImage,
                0, 0, worldWidth, worldHeight,
                0, mapModeBounceOffset, canvas.width, canvas.height
            );
        }

        if (allSpritesLoaded && mapIconLoaded) { 
            const mapPlayerX = (player.x / worldWidth) * canvas.width;
            const mapPlayerY = (player.y / worldHeight) * canvas.height;
            const iconDrawWidth = 24;
            const iconDrawHeight = 24;
            const iconDrawX = mapPlayerX - iconDrawWidth / 2;
            const iconDrawY = mapPlayerY - iconDrawHeight / 2;
            try {
                ctx.drawImage(
                    mapPlayerIconImage,
                    iconDrawX,
                    iconDrawY,
                    iconDrawWidth,
                    iconDrawHeight
                );
            } catch (e) {
                console.error("Gagal menggambar ikon map player:", e);
                ctx.fillStyle = 'red';
                ctx.fillRect(mapPlayerX - 3, mapPlayerY - 3, 6, 6);
            }
        } else if (allSpritesLoaded) { 
             const mapPlayerX = (player.x / worldWidth) * canvas.width;
             const mapPlayerY = (player.y / worldHeight) * canvas.height;
             ctx.fillStyle = 'orange'; 
             ctx.fillRect(mapPlayerX - 3, mapPlayerY - 3, 6, 6);
        }

    } else {

        ctx.drawImage(mapImage, camera.x, camera.y, camera.viewWidth, camera.viewHeight, 0, 0, camera.width, camera.height);

        const playerCanvasX = (player.x - camera.x) * zoomLevel;
        const playerCanvasY = (player.y - camera.y) * zoomLevel;
        const playerDrawWidth = player.width * zoomLevel;
        const playerDrawHeight = player.height * zoomLevel;

        if (allSpritesLoaded) {
            ctx.save();
            const shadowOffsetY = playerDrawHeight * 0.95;
            const shadowRadiusX = playerDrawWidth * 0.35;
            const shadowRadiusY = shadowRadiusX * 0.3;
            const shadowX = playerCanvasX + (playerDrawWidth / 2);
            const shadowY = playerCanvasY + shadowOffsetY;
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            ctx.beginPath();
            ctx.ellipse(shadowX, shadowY, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        if (player.currentFrameImage) {
            try {
                ctx.drawImage(
                    player.currentFrameImage,
                    playerCanvasX,
                    playerCanvasY,
                    playerDrawWidth,
                    playerDrawHeight
                );
            } catch (e) {
                console.error("Error saat menggambar sprite:", e);
                ctx.fillStyle = 'red';
                ctx.fillRect(playerCanvasX, playerCanvasY, playerDrawWidth, playerDrawHeight);
                player.currentFrameImage = null;
            }
        } else {
            if (allSpritesLoaded) {
                const fallbackX = (player.x - camera.x) * zoomLevel;
                const fallbackY = (player.y - camera.y) * zoomLevel;
                const fallbackW = player.width * zoomLevel;
                const fallbackH = player.height * zoomLevel;
                if (!ctx.fillStyle || ctx.fillStyle === '#bdc3c7') ctx.fillStyle = 'gray';
                ctx.fillRect(fallbackX, fallbackY, fallbackW, fallbackH);
            }
        }

        if (currentLocationName && locationTextAnimProgress > 0) {
            ctx.save();
            const currentOpacity = locationTextAnimProgress;
            const currentScale = 0.8 + (0.2 * locationTextAnimProgress);
            ctx.globalAlpha = currentOpacity;
            const textPosX = canvas.width / 2;
            const textPosY = 35;
            ctx.translate(textPosX, textPosY);
            ctx.scale(currentScale, currentScale);
            ctx.translate(-textPosX, -textPosY);
            ctx.font = `bold ${28 / currentScale}px 'Uncial Antiqua', serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const gradient = ctx.createLinearGradient(0, textPosY - 15, 0, textPosY + 15);
            gradient.addColorStop(0, "#FEEA8C"); gradient.addColorStop(0.5, "#B08D57"); gradient.addColorStop(1, "#8E5A2B");
            ctx.strokeStyle = "#2C1E10"; ctx.lineWidth = 4 / currentScale; ctx.lineJoin = 'round';
            ctx.fillStyle = "#4A3113";
            const shadowOffset = 1.5 / currentScale;
            ctx.strokeText(currentLocationName, textPosX + shadowOffset, textPosY + shadowOffset);
            ctx.fillText(currentLocationName, textPosX + shadowOffset, textPosY + shadowOffset);
            ctx.fillStyle = gradient;
            ctx.strokeText(currentLocationName, textPosX, textPosY);
            ctx.fillText(currentLocationName, textPosX, textPosY);
            ctx.restore();
        }
    }
}

function updateGameTime(timestamp) {
    if (!timestamp || typeof timestamp !== 'number') {
        return;
    }
    
    if (gameTime.lastUpdate === 0) {
        gameTime.lastUpdate = timestamp;
        return;
    }
    if (isGamePaused || isMapMode) {
        gameTime.lastUpdate = timestamp;
        return;
    }

    const elapsedRealMs = timestamp - gameTime.lastUpdate;
    if (isNaN(elapsedRealMs) || elapsedRealMs < 0 || elapsedRealMs > 1000) {
        gameTime.lastUpdate = timestamp;
        return;
    }
    gameTime.lastUpdate = timestamp;
    const elapsedGameMinutes = (elapsedRealMs / 1000) * gameTime.timeScale;
    
    gameTime.minute += elapsedGameMinutes;
    
    if (gameTime.minute >= 60) {
        gameTime.hour += Math.floor(gameTime.minute / 60);
        gameTime.minute = gameTime.minute % 60;
        
        if (gameTime.hour >= 24) {
            gameTime.day += Math.floor(gameTime.hour / 24);
            gameTime.hour = gameTime.hour % 24;
        }
    }

    const timeValueElement = document.getElementById('time-value');
    if (timeValueElement) {
        timeValueElement.textContent = formatGameTime();
    }
}

function formatGameTime() {
    const hour = Math.floor(typeof gameTime.hour === 'number' ? gameTime.hour : 0);
    const minute = Math.floor(typeof gameTime.minute === 'number' ? gameTime.minute : 0);
    const day = typeof gameTime.day === 'number' ? gameTime.day : 1;
    
    const period = hour >= 12 ? 'PM' : 'AM';
    
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    
    const displayMinute = minute < 10 ? `0${minute}` : minute;
    
    return `Day ${day} - ${displayHour}:${displayMinute} ${period}`;
}

function gameLoop(timestamp) {
    update();
    draw();
    updateGameTime(timestamp);
    requestAnimationFrame(gameLoop);
}

function setupCollisionDataCanvas() {
    if (!collisionMapLoaded || worldWidth <= canvas.width || worldHeight <= canvas.height) {
        console.error("Tidak bisa setup collision canvas: collision map atau dimensi dunia belum siap.");
        return;
    }
    try {
        collisionOffscreenCanvas.width = worldWidth;
        collisionOffscreenCanvas.height = worldHeight;
        collisionOffscreenCtx = collisionOffscreenCanvas.getContext('2d', { willReadFrequently: true });
        collisionOffscreenCtx.drawImage(collisionMapImage, 0, 0, worldWidth, worldHeight);
        collisionDataReady = true;
        console.log("Offscreen canvas data collision siap.");
    } catch(e) { console.error("Gagal setup collision canvas:", e); collisionDataReady = false; }
}

function setupMovementDataCanvas() {
    if (!movementMapLoaded || worldWidth <= canvas.width || worldHeight <= canvas.height) {
        console.error("Tidak bisa setup movement canvas: movement map atau dimensi dunia belum siap.");
        return;
    }
     try {
        movementOffscreenCanvas.width = worldWidth;
        movementOffscreenCanvas.height = worldHeight;
        movementOffscreenCtx = movementOffscreenCanvas.getContext('2d', { willReadFrequently: true });
        movementOffscreenCtx.drawImage(movementMapImage, 0, 0, worldWidth, worldHeight);
        movementDataReady = true;
        console.log("Offscreen canvas data movement speed siap.");
    } catch(e) { console.error("Gagal setup movement canvas:", e); movementDataReady = false; }
}

function setupLocationDataCanvas() {
    if (!locationMapLoaded || worldWidth <= canvas.width || worldHeight <= canvas.height) {
        console.error("Tidak bisa setup location canvas: location map atau dimensi dunia belum siap.");
        return;
    }
    try {
        locationOffscreenCanvas.width = worldWidth;
        locationOffscreenCanvas.height = worldHeight;
        locationOffscreenCtx = locationOffscreenCanvas.getContext('2d', { willReadFrequently: true });
        locationOffscreenCtx.drawImage(locationMapImage, 0, 0, worldWidth, worldHeight);
        locationDataReady = true;
        console.log("Offscreen canvas data lokasi siap.");
    } catch(e) { console.error("Gagal setup location canvas:", e); locationDataReady = false; }
}

function isPassable(worldX, worldY) {
    if (!collisionDataReady || !collisionOffscreenCtx) return false;

    const x = Math.floor(worldX);
    const y = Math.floor(worldY);
    if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
        return false;
    }

    try {
        const pixelData = collisionOffscreenCtx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        if (r < 15 && g < 15 && b < 15) {
            return false;
        }

        return true;

    } catch (e) {
        return false;
    }
}

function getSpeedModifier(worldX, worldY) {
    if (!movementDataReady || !movementOffscreenCtx) return 1.0;

    const x = Math.floor(worldX);
    const y = Math.floor(worldY);
    if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
        return 1.0;
    }

    try {
        const pixelData = movementOffscreenCtx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        if (r > 200 && g < 50 && b < 50) {
            return 1.25;
        }


        if (r < 15 && g < 15 && b < 15) {
            return 0.5;
        }

        return 1.0;

    } catch (e) {
        return 1.0;
    }
}

function findSpawnPointsAndSetPlayer() {
    if (!spawnMapLoaded || worldWidth <= canvas.width || worldHeight <= canvas.height) {
        console.error("Tidak bisa mencari spawn point, spawn map atau dimensi dunia belum siap.");
        player.x = worldWidth / 2 - player.width / 2;
        player.y = worldHeight / 2 - player.height / 2;
        return;
    }

    console.log("Mencari AREA spawn point dari Spawn.png menggunakan BFS...");
    const spawnAreaCentroids = [];
    let visited = null;

    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = worldWidth;
        tempCanvas.height = worldHeight;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCtx.drawImage(spawnMapImage, 0, 0, worldWidth, worldHeight);
        const imageData = tempCtx.getImageData(0, 0, worldWidth, worldHeight).data;
        visited = Array(worldHeight).fill(null).map(() => Array(worldWidth).fill(false));
        const isPixelBlack = (px, py) => {
            if (px < 0 || px >= worldWidth || py < 0 || py >= worldHeight) return false;
            const index = (py * worldWidth + px) * 4;
            const r = imageData[index]; const g = imageData[index + 1]; const b = imageData[index + 2];
            return r < 15 && g < 15 && b < 15;
        };

        for (let y = 0; y < worldHeight; y++) {
            for (let x = 0; x < worldWidth; x++) {
                if (isPixelBlack(x, y) && !visited[y][x]) {
                    const queue = [{ x, y }]; visited[y][x] = true;
                    const currentAreaPixels = []; let sumX = 0; let sumY = 0;
                    while (queue.length > 0) {
                        const currentPixel = queue.shift(); currentAreaPixels.push(currentPixel);
                        sumX += currentPixel.x; sumY += currentPixel.y;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = currentPixel.x + dx; const ny = currentPixel.y + dy;
                                if (nx >= 0 && nx < worldWidth && ny >= 0 && ny < worldHeight && isPixelBlack(nx, ny) && !visited[ny][nx]) {
                                    visited[ny][nx] = true; queue.push({ x: nx, y: ny });
                                }
                            }
                        }
                    }
                    if (currentAreaPixels.length > 0) {
                        const centerX = Math.round(sumX / currentAreaPixels.length);
                        const centerY = Math.round(sumY / currentAreaPixels.length);
                        spawnAreaCentroids.push({ x: centerX, y: centerY });
                    }
                }
            }
        }

        console.log(`Selesai scan. Ditemukan ${spawnAreaCentroids.length} area spawn.`);

        if (spawnAreaCentroids.length > 0) {
            const randomIndex = Math.floor(Math.random() * spawnAreaCentroids.length);
            const randomSpawnCenter = spawnAreaCentroids[randomIndex];

            player.x = randomSpawnCenter.x - player.width / 2;
            player.y = randomSpawnCenter.y - player.height / 2;
            player.x = Math.max(0, Math.min(player.x, worldWidth - player.width));
            player.y = Math.max(0, Math.min(player.y, worldHeight - player.height));
            console.log(`Player spawn di area ${randomIndex + 1}, koordinat: x=${player.x.toFixed(0)}, y=${player.y.toFixed(0)}`);
        } else {
            console.error("Tidak ditemukan area spawn di Spawn.png! Menggunakan fallback.");
            player.x = worldWidth / 2 - player.width / 2;
            player.y = worldHeight / 2 - player.height / 2;
            console.log(`Fallback spawn: x=${player.x}, y=${player.y}`);
        }

    } catch(e) {
        console.error("Error saat mencari area spawn point:", e);
        player.x = worldWidth / 2 - player.width / 2;
        player.y = worldHeight / 2 - player.height / 2;
    } finally {
         visited = null;
    }
}

function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getLocationName(worldX, worldY) {
    if (!locationDataReady || !locationOffscreenCtx) return null;

    const x = Math.floor(worldX);
    const y = Math.floor(worldY);
    if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
        return null;
    }

    try {
        const pixelData = locationOffscreenCtx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        const hexColor = rgbToHex(r, g, b).toLowerCase();

        return locationColorMap[hexColor] || null;

    } catch (e) {
        return null;
    }
}

function updateUI() {
    if (hpBarElement && hungerBarElement && staminaBarElement) {
        const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        const staminaPercent = Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100));
        const hungerPercent = Math.max(0, Math.min(100, (player.hunger / player.maxHunger) * 100));

        const isVisible = !isMapMode;
        hpBarElement.style.visibility = isVisible ? 'visible' : 'hidden';
        hungerBarElement.style.visibility = isVisible ? 'visible' : 'hidden';
        staminaBarElement.style.visibility = isVisible ? 'visible' : 'hidden';
        goldValueElement.style.visibility = isVisible ? 'visible' : 'hidden';
        playerGoldElement.style.visibility = isVisible ? 'visible' : 'hidden';
        hpHungerFrame.style.visibility = isVisible ? 'visible' : 'hidden';
        staminaFrame.style.visibility = isVisible ? 'visible' : 'hidden';
        hpBarElement.style.width = `${hpPercent}%`;
        staminaBarElement.style.width = `${staminaPercent}%`;
        const scaledHungerPercent = hungerPercent * 0.75;
        hungerBarElement.style.height = `${scaledHungerPercent}%`;
    }

    if (goldValueElement) {
        goldValueElement.textContent = player.gold;
    }
    
    const timeValueElement = document.getElementById('time-value');
    if (timeValueElement) {
        timeValueElement.textContent = formatGameTime();
    }

    if (relicSlots.length > 0) {
        const relicsCount = player.relicsFound.size;
        relicSlots.forEach((slot, index) => {
            if (index < relicsCount) {
                slot.classList.add('found');
                slot.title = `Relic ${index + 1} (Ditemukan)`;
            } else {
                slot.classList.remove('found');
                slot.title = `Relic ${index + 1} (Belum Ditemukan)`;
            }
        });
    }

    if (dpadContainer) {
        const isGameplayActive = !isMapMode && !isGamePaused && !isInteractionPopupOpen && !isSaveLoadMenuOpen;
        if (isGameplayActive) {
            dpadContainer.classList.add('visible');
        } else {
            dpadContainer.classList.remove('visible');
            keys.w = false;
            keys.a = false;
            keys.s = false;
            keys.d = false;
        }
    }
}

loadSprites();

function handleFirstInteraction() {
    if (!userInteracted) {
        userInteracted = true;
        console.log("Interaksi pengguna terdeteksi.");
        tryStartBackgroundMusic();
        window.removeEventListener('keydown', handleFirstInteraction);
        window.removeEventListener('click', handleFirstInteraction);
    }
}

window.addEventListener('keydown', handleFirstInteraction, { once: false });
window.addEventListener('click', handleFirstInteraction, { once: false }); 

function openInteractionPopup(locationName) {
    if (!popupContentElement || !popupLocationNameElement || !popupOptionsElement || !locationName) return;

    console.log(`Membuka popup interaksi untuk: ${locationName}`);
    popupLocationNameElement.textContent = locationName;

    const location = locationData[locationName];
    if (!location) {
        console.error(`Data lokasi tidak ditemukan untuk: ${locationName}`);
        return;
    }

    popupOptionsElement.innerHTML = '';

    location.interactions.forEach(interaction => {
        switch(interaction) {
            case 'beli_makanan':
                if (location.shopItems.length > 0) {
                    const shopSection = document.createElement('div');
                    shopSection.className = 'shop-section';
                    shopSection.innerHTML = '<h4>Makanan yang Tersedia:</h4>';
                    
                    location.shopItems.forEach(item => {
                        const itemElement = document.createElement('div');
                        itemElement.className = 'shop-item';
                        itemElement.innerHTML = `
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">${item.price} G</span>
                            <span class="item-stats">+${item.hunger} Hunger${item.hp > 0 ? `, +${item.hp} HP` : ''}</span>
                            <button onclick="buyItem('${locationName}', '${item.name}')">Beli</button>
                        `;
                        shopSection.appendChild(itemElement);
                    });
                    
                    popupOptionsElement.appendChild(shopSection);
                }
                break;
            case 'armor_shop':
                const armorOption = document.createElement('li');
                armorOption.textContent = 'Beli Armor';
                armorOption.onclick = () => handleShopInteraction('armor_shop', locationName);
                popupOptionsElement.appendChild(armorOption);
                break;
            case 'weapon_shop':
                const weaponOption = document.createElement('li');
                weaponOption.textContent = 'Beli Senjata';
                weaponOption.onclick = () => handleShopInteraction('weapon_shop', locationName);
                popupOptionsElement.appendChild(weaponOption);
                break;
            case 'potion_shop':
                const potionOption = document.createElement('li');
                potionOption.textContent = 'Beli Ramuan';
                potionOption.onclick = () => handleShopInteraction('potion_shop', locationName);
                popupOptionsElement.appendChild(potionOption);
                break;
            case 'bicara':
                const talkOption = document.createElement('li');
                talkOption.textContent = 'Bicara dengan Penduduk';
                talkOption.onclick = () => handleInteractionOption('bicara', locationName);
                popupOptionsElement.appendChild(talkOption);
                break;
            case 'quest':
                const questOption = document.createElement('li');
                questOption.textContent = 'Cek Quest';
                questOption.onclick = () => handleInteractionOption('quest', locationName);
                popupOptionsElement.appendChild(questOption);
                break;
            case 'eksplorasi':
                const exploreOption = document.createElement('li');
                exploreOption.textContent = 'Eksplorasi Area';
                exploreOption.onclick = () => handleInteractionOption('eksplorasi', locationName);
                popupOptionsElement.appendChild(exploreOption);
                break;
            case 'berjudi':
                if (locationName === 'Desa Uwu') {
                    if (player.gold < 10) {
                        alert("Gold tidak cukup untuk berjudi! Minimal 10 gold diperlukan.");
                        return;
                    }
                    updatePanelContent(locationName, 'gamble');
                }
                break;
            case 'beribadah':
                if (locationName === 'Pusat Kota Managarmr') {
                    const donationAmount = 75;
                    if (player.gold >= donationAmount) {
                        player.gold -= donationAmount;
                        const hpRecovery = Math.floor(player.maxHp * 0.5);
                        const hungerLoss = Math.floor(player.maxHunger * 0.25);
                        player.hp = Math.min(player.maxHp, player.hp + hpRecovery);
                        player.hunger = Math.max(0, player.hunger - hungerLoss);
                        alert(`Anda merasa terpulihkan setelah berdoa (+${hpRecovery} HP, -${hungerLoss} Hunger), dan mendonasikan ${donationAmount} Gold ke tempat ibadah. Namun, Anda menjadi sedikit lapar.`);
                        updateUI();
                    } else {
                        const hpRecovery = Math.floor(player.maxHp * 0.5);
                        const hungerLoss = Math.floor(player.maxHunger * 0.25);
                        player.hp = Math.min(player.maxHp, player.hp + hpRecovery);
                        player.hunger = Math.max(0, player.hunger - hungerLoss);
                        alert(`Anda merasa terpulihkan setelah berdoa (+${hpRecovery} HP, -${hungerLoss} Hunger), tetapi sedikit bersalah karena tidak dapat berdonasi. Anda juga menjadi sedikit lapar.`);
                        updateUI();
                    }
                }
                break;
            case 'puzzle':
                if (locationName === 'Reruntuhan Hatiku') {
                    if (!ruinsPuzzleAttempted) {
                        showTicTacToePuzzle();
                    } else {
                        alert("Kamu sudah mencoba memecahkan puzzle di reruntuhan ini.");
                    }
                } else {
                    alert("Tidak ada puzzle yang terlihat di sini.");
                }
                break;
        }
    });

    popupContentElement.style.display = 'block';
    isInteractionPopupOpen = true;
}

function buyItem(locationName, itemName) {
    const location = locationData[locationName];
    if (!location) return;

    const item = location.shopItems.find(i => i.name === itemName);
    if (!item) return;

    if (player.gold >= item.price) {
        player.gold -= item.price;
        player.hunger = Math.min(player.maxHunger, player.hunger + item.hunger);
        player.hp = Math.min(player.maxHp, player.hp + item.hp);
        
        updateUI();
        
        alert(`Berhasil membeli ${itemName}! Hunger +${item.hunger}${item.hp > 0 ? `, HP +${item.hp}` : ''}`);
    } else {
        alert('Gold tidak cukup!');
    }
}

function buyArmor(locationName, armorName) {
    const location = locationData[locationName];
    if (!location || !location.armorItems) return;

    const armor = location.armorItems.find(a => a.name === armorName);
    if (!armor) return;

    if (player.gold >= armor.price) {
        player.gold -= armor.price;
        
        player.maxHp += armor.maxHpBonus;
        player.hp += armor.maxHpBonus;
        
        player.armorName = armor.name;
        player.armorDescription = armor.description;
        
        console.log('Added armor:', armor.name);
        
        updateUI();
        
        alert(`Berhasil membeli ${armorName}! Max HP +${armor.maxHpBonus}`);
        
        updatePanelContent(locationName, 'beli_armor');
    } else {
        alert('Gold tidak cukup!');
    }
}

function buyWeapon(locationName, weaponName) {
    const location = locationData[locationName];
    if (!location || !location.weaponItems) return;

    const weapon = location.weaponItems.find(w => w.name === weaponName);
    if (!weapon) return;

    if (player.gold >= weapon.price) {
        player.gold -= weapon.price;
        
        player.damage += weapon.damageBonus;
        
        player.weaponName = weapon.name;
        player.weaponDescription = weapon.description;
        
        console.log('Added weapon:', weapon.name);
        
        updateUI();
        
        alert(`Berhasil membeli ${weaponName}! Damage +${weapon.damageBonus}`);
        
        updatePanelContent(locationName, 'beli_senjata');
    } else {
        alert('Gold tidak cukup!');
    }
}

function buyPotion(locationName, potionName) {
    console.log("Duplicate buyPotion function detected at line 4570.");
    console.log("This shouldn't be called directly. Check your shop button implementations.");
    return false;
}

function handleInteractionOption(optionType, locationName, data = null) {
    console.log(`handleInteractionOption called with: type=${optionType}, location=${locationName}, data=${data}`);

    if (optionType === 'armor_shop') {
        handleShopInteraction('armor_shop', locationName);
        return;
    }
    
    if (optionType === 'weapon_shop') {
        handleShopInteraction('weapon_shop', locationName);
        return;
    }
    
    if (optionType === 'potion_shop') {
        handleShopInteraction('potion_shop', locationName);
        return;
    }

    const location = locationData[locationName];
    if (!location) return;

    switch(optionType) {
        case 'kembalikan_relic':
            if (player.relicsFound.size >= 8) {
                handleReturnRelics();
            } else {
                alert(`Kamu baru menemukan ${player.relicsFound.size} dari 8 relik. Temukan semua relik terlebih dahulu untuk menyelesaikan petualangan!`);
            }
            break;
            
        case 'quest':
            if (quests[locationName] && quests[locationName].length > 0) {
                const quest = quests[locationName][0];
                const questHTML = `
                    <div class="quest-content">
                        <h3>Quest</h3>
                        <p>${quest.question}</p>
                        <div class="quest-options">
                            ${quest.options.map((option) => `
                                <button onclick="handleQuestAnswer('${locationName}', 0, '${option.replace(/'/g, "\\'")}')">
                                    ${option}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
                const panel = document.querySelector(`[data-location="${locationName}"]`);
                if (panel) panel.innerHTML = questHTML;
            } else {
                alert("Tidak ada quest tersedia di lokasi ini.");
            }
            break;

        case 'beli_makanan':
            updatePanelContent(locationName, 'shop');
            break;

        case 'beli_ramuan':
            updatePanelContent(locationName, 'beli_ramuan');
            break;

        case 'beli_armor':
            updatePanelContent(locationName, 'beli_armor');
            break;

        case 'beli_senjata':
            updatePanelContent(locationName, 'beli_senjata');
            break;

        case 'bicara':
            updatePanelContent(locationName, 'talk');
            break;

        case 'bicara_commander':
            if (locationName === 'Kastil Kerajaan') {
                updatePanelContent(locationName, 'talk_commander');
            } else {
                alert("Tidak ada commander di lokasi ini.");
            }
            break;

        case 'jelajah':
            if (locationName === 'Goa Osas' || locationName === 'Goa Monster Ambadala Crocodila') {
                const chance = Math.random();
                let message = '';
                if (chance < 0.3) {
                    const foundGold = Math.floor(Math.random() * 41) + 10;
                    player.gold += foundGold;
                    message = `Kamu menjelajahi lorong gelap dan menemukan ${foundGold} Gold peninggalan penjelajah sebelumnya!`;
                } else if (chance < 0.6) {
                    message = 'Kamu menjelajahi goa lebih dalam, tetapi tidak menemukan sesuatu yang berharga.';
                } else {
                    const hpLoss = 20;
                    player.hp = Math.max(0, player.hp - hpLoss);
                    message = `Bahaya! Kamu terperosok dalam kegelapan dan kehilangan ${hpLoss} HP!`;
                    if (player.hp <= 0) {
                        message += '\nHP-mu habis!';
                    }
                }
                alert(message)
                updateUI();
            } else {
                alert('Kamu menjelajahi area ini, tapi belum ada mekanik spesifik.');
            }
            break;

        case 'cari_info':
            const panelInfo = document.querySelector(`[data-location="${locationName}"]`);
            if (panelInfo) {
                const tips = locationTips[locationName] || ["Tidak ada informasi khusus saat ini."];
                panelInfo.innerHTML = `
                    <h3>${locationName} - Informasi</h3>
                    <div class="info-content">
                        <p>Informasi yang kamu dapatkan:</p>
                        <ul>
                            ${tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                    <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
                `;
            }
            break;

        case 'cari_clue':
            if (locationName === 'Reruntuhan Hatiku') {
                alert("Kedamaian dunia akan tercapai jika 8 relic terkumpul dan keberadaan makhluk jahat dibinasakan.");
            } else {
                alert("Kamu mencari petunjuk, tapi tidak menemukan apapun yang berarti di sini.");
            }
            break;

        case 'berjudi':
            if (locationName === 'Desa Uwu') {
                if (player.gold < 10) {
                    alert("Gold tidak cukup untuk berjudi! Minimal 10 gold diperlukan.");
                    return;
                }
                updatePanelContent(locationName, 'gamble');
            }
            break;

        case 'beribadah':
            if (locationName === 'Pusat Kota Managarmr') {
                const donationAmount = 75;
                if (player.gold >= donationAmount) {
                    player.gold -= donationAmount;
                    const hpRecovery = Math.floor(player.maxHp * 0.5);
                    const hungerLoss = Math.floor(player.maxHunger * 0.25);
                    player.hp = Math.min(player.maxHp, player.hp + hpRecovery);
                    player.hunger = Math.max(0, player.hunger - hungerLoss);
                    alert(`Anda merasa terpulihkan setelah berdoa (+${hpRecovery} HP, -${hungerLoss} Hunger), dan mendonasikan ${donationAmount} Gold ke tempat ibadah. Namun, Anda menjadi sedikit lapar.`);
                    updateUI();
                } else {
                    const hpRecovery = Math.floor(player.maxHp * 0.5);
                    const hungerLoss = Math.floor(player.maxHunger * 0.25);
                    player.hp = Math.min(player.maxHp, player.hp + hpRecovery);
                    player.hunger = Math.max(0, player.hunger - hungerLoss);
                    alert(`Anda merasa terpulihkan setelah berdoa (+${hpRecovery} HP, -${hungerLoss} Hunger), tetapi sedikit bersalah karena tidak dapat berdonasi. Anda juga menjadi sedikit lapar.`);
                    updateUI();
                }
            }
            break;
            
        case 'pindah_map':
            if (locationName === 'Pelabuhan Indah Kapal') {
                const panelTravel = document.querySelector(`[data-location="${locationName}"]`);
                if (panelTravel) {
                    const destinations = [
                        { name: 'Pusat Kota Managarmr', cost: 25, x: 1600, y: 1100 },
                        { name: 'Kastil Kerajaan', cost: 50, x: 1250, y: 790 },
                        { name: 'Desa Uwu', cost: 125, x: 440, y: 870 },
                        { name: 'Kota Willburg', cost: 150, x: 540, y: 650 }
                    ];
                    
                    panelTravel.innerHTML = `
                        <h3>${locationName} - Pindah Map</h3>
                        <div class="travel-content">
                            <p>Pilih tujuan perjalanan:</p>
                            <div class="travel-destinations">
                                ${destinations.map(dest => `
                                    <div class="travel-option">
                                        <span class="destination-name">${dest.name}</span>
                                        <span class="destination-cost">${dest.cost} Gold</span>
                                        <button onclick="handleFastTravel('${dest.name}', ${dest.cost}, ${dest.x}, ${dest.y})" 
                                            ${player.gold < dest.cost ? 'disabled' : ''}>
                                            ${player.gold < dest.cost ? 'Gold Tidak Cukup' : 'Pergi'}
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
                    `;
                }
            }
            break;

        case 'puzzle':
            if (locationName === 'Reruntuhan Hatiku') {
                if (!ruinsPuzzleAttempted) {
                    showTicTacToePuzzle();
                } else {
                    alert("Kamu sudah mencoba memecahkan puzzle di reruntuhan ini.");
                }
            } else {
                alert("Tidak ada puzzle yang terlihat di sini.");
            }
            break;

        case 'bertanya_relic':
            if (locationName === 'Menara Penyihir Sarungman') {
                const panel = document.querySelector(`[data-location="${locationName}"]`);
                if (panel) {
                    let relicListHTML = '';
                    Object.keys(relicInfo).forEach(relicName => {
                        relicListHTML += `
                            <div class="shop-item">
                                <span class="item-name">${relicName}</span>
                                <span class="item-price">Relic Kuno</span>
                                <button onclick="handleInteractionOption('show_relic_info', '${locationName}', '${relicName}')">
                                    Info Lengkap
                                </button>
                            </div>
                        `;
                    });
                    
                    panel.innerHTML = `
                        <h3>${locationName} - Informasi Relic</h3>
                        <div class="shop-section">
                            <h4>Pilih Relic untuk info lengkap:</h4>
                            ${relicListHTML}
                        </div>
                        <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
                    `;
                }
            } else {
                alert('Hanya Penyihir Sarungman yang tahu soal Relic.');
            }
            break;

        case 'show_relic_info':
            console.log(`show_relic_info case with relicName: ${data}`);
            if (locationName === 'Menara Penyihir Sarungman' && data) {
                const panel = document.querySelector(`[data-location="${locationName}"]`);
                if (panel) {
                    const relic = relicInfo[data];
                    if (relic) {
                        panel.innerHTML = `
                            <h3>${data} - Detail Relic</h3>
                            <div class="talk-content">
                                <p><strong>Jenis:</strong> ${relic.type}</p>
                                <p><strong>Asal:</strong> ${relic.origin}</p>
                                <p><strong>Kegunaan:</strong> ${relic.use}</p>
                            </div>
                            <button class="close-btn" onclick="handleInteractionOption('bertanya_relic', '${locationName}')">Kembali</button>
                        `;
            } else {
                        console.log('Relic info not found for:', data);
                        panel.innerHTML = `
                            <h3>Relic Tidak Ditemukan</h3>
                            <div class="talk-content">
                                <p>Informasi tentang relic ini tidak tersedia.</p>
                            </div>
                            <button class="close-btn" onclick="handleInteractionOption('bertanya_relic', '${locationName}')">Kembali</button>
                        `;
                    }
                }
            } else {
                console.log('Invalid location or missing data for show_relic_info');
                updatePanelContent(locationName, 'main');
            }
            break;

        default:
            const result = handleSpecialInteraction(locationName, optionType);
            if (result) {
                alert(result);
                updateUI();
            }
            break;
    }
}

function closeInteractionPopup() {
    if (!popupContentElement) return;
    console.log("Menutup popup interaksi.");
    popupContentElement.style.display = 'none';
    isInteractionPopupOpen = false;
}

function openPauseMenu() {
    if (!pauseMenuElement) return;
    console.log("Game Dijeda.");
    pauseMenuElement.classList.add('visible');
    isGamePaused = true;
    backgroundMusic.pause();
    playPauseSound();
}

function closePauseMenu() {
    if (!pauseMenuElement) return;
    console.log("Game Dilanjutkan.");
    pauseMenuElement.classList.remove('visible');
    isGamePaused = false;
    playUnpauseSound();
    if (userInteracted && bgmPlaying && backgroundMusic.paused) {
        backgroundMusic.play().catch(e => console.error("Gagal melanjutkan BGM:", e));
    }
}

function continueGame() {
    closePauseMenu();
}

function restartGame() {
    player.hp = player.maxHp;
    player.hunger = player.maxHunger;
    player.stamina = player.maxStamina;
    player.gold = 0;
    player.relicsFound = new Set();
    isGameOver = false;
    currentLocationName = null;
    previousLocationName = null;

    gameTime.day = 1;
    gameTime.hour = 6;
    gameTime.minute = 0;
    gameTime.lastUpdate = 0;

    resetVolumeSliders();
    
    isGamePaused = false;
    isInteractionPopupOpen = false;
    isSaveLoadMenuOpen = false;
    
    const gameOverPopup = document.getElementById('game-over-popup');
    if (gameOverPopup) {
        gameOverPopup.remove();
    }

    updateUI();
    closePauseMenu();
    closeInteractionPopup();
    hideSaveLoadMenu();
    
    findSpawnPointsAndSetPlayer();
    centerCameraOnPlayer();

    if (bgmPlaying && backgroundMusic.paused) {
        tryStartBackgroundMusic();
    }
    console.log("Game restarted.");
}

function goToMainMenu() {
    player.hp = player.maxHp;
    player.hunger = player.maxHunger;
    player.stamina = player.maxStamina;
    player.gold = 0;
    player.relicsFound = new Set();
    
    if (backgroundMusic) {
        backgroundMusic.pause();
    }
    
    window.location.href = "index.html";
}

function exitGame() {
    goToMainMenu();
}
function showSaveLoadMenu(mode) {
    if (!saveloadMenuElement) return;

    console.log(`Membuka menu Save/Load dalam mode: ${mode}`);
    saveloadTitleElement.textContent = mode === 'save' ? 'Simpan Game' : 'Muat Game';

    saveloadNewSection.style.display = mode === 'save' ? 'flex' : 'none';
    if (mode === 'save') {
        saveNameInputElement.value = `Save ${new Date().toLocaleDateString()}`;
    }

    populateSaveLoadList(mode);

    pauseMenuElement.classList.remove('visible');
    saveloadMenuElement.classList.add('visible');
    isSaveLoadMenuOpen = true;
}

function hideSaveLoadMenu() {
    if (!saveloadMenuElement) return;
    saveloadMenuElement.classList.remove('visible');
    isSaveLoadMenuOpen = false;
    if (isGamePaused) {
         pauseMenuElement.classList.add('visible');
    }
}

function populateSaveLoadList(mode) {
    if (!saveSlotsListElement) return;
    saveSlotsListElement.innerHTML = '';

    let savesFound = 0;
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const key = `${SAVE_SLOT_PREFIX}${i}`;
        const saveDataJson = localStorage.getItem(key);

        if (saveDataJson) {
            savesFound++;
            try {
                const saveData = JSON.parse(saveDataJson);
                const li = document.createElement('li');
                const timestamp = new Date(saveData.timestamp);
                const formattedTime = timestamp.toLocaleString('id-ID', {
                    dateStyle: 'medium', timeStyle: 'short'
                });

                li.innerHTML = `
                    <img src="${saveData.screenshot || 'placeholder.png'}" alt="Preview" class="save-preview" onerror="this.src='placeholder.png'; this.alt='Preview Gagal';">
                    <div class="save-info">
                        <div class="save-name">${saveData.name || `Save Slot ${i}`}</div>
                        <div class="save-timestamp">${formattedTime}</div>
                    </div>
                    <div class="save-actions">
                        ${mode === 'load' ? `<button class="load-btn" onclick="loadGame('${key}')">Muat</button>` : ''}
                        <button class="delete-btn" onclick="deleteSave('${key}')">Hapus</button>
                    </div>
                `;
                saveSlotsListElement.appendChild(li);
            } catch (e) {
                console.error(`Gagal parse save data untuk slot ${key}:`, e);
                localStorage.removeItem(key);
            }
        }
    }

    if (savesFound === 0) {
        saveSlotsListElement.innerHTML = '<li class="no-saves">Belum ada game yang disimpan.</li>';
    }
}

function saveGame(slotKey, saveName) {
    try {
        const saveData = {
            saveName: saveName,
            timestamp: new Date().toISOString(),
            player: {
                x: player.x,
                y: player.y,
                direction: player.direction,
                animationState: player.animationState,
                hp: player.hp,
                maxHp: player.maxHp,
                hunger: player.hunger,
                maxHunger: player.maxHunger,
                stamina: player.stamina,
                maxStamina: player.maxStamina,
                gold: player.gold,
                damage: player.damage,
                armor: player.armor,
                relicsFound: Array.from(player.relicsFound),
                armorName: player.armorName || '',
                armorDescription: player.armorDescription || '',
                weaponName: player.weaponName || '',
                weaponDescription: player.weaponDescription || '',
                potionName: player.potionName || '',
                potionDescription: player.potionDescription || ''
            },
            gameTime: {
                day: gameTime.day,
                hour: gameTime.hour,
                minute: gameTime.minute,
                timeScale: gameTime.timeScale
            }
        };

        localStorage.setItem(`gameElendorSave_${slotKey}`, JSON.stringify(saveData));
        alert(`Game berhasil disimpan ke slot "${slotKey}"!`);
        
        populateSaveLoadList('save');
        
        return true;
    } catch (e) {
        console.error("Error saving game:", e);
        alert(`Gagal menyimpan game! Error: ${e.message}`);
        return false;
    }
}

function loadGame(slotKey) {
    try {
        const saveDataJson = localStorage.getItem(`gameElendorSave_${slotKey}`);
        if (!saveDataJson) {
            alert(`Tidak ada data save di slot "${slotKey}"`);
            return false;
        }

        const saveData = JSON.parse(saveDataJson);
        
        player.x = saveData.player.x;
        player.y = saveData.player.y;
        player.direction = saveData.player.direction;
        player.animationState = saveData.player.animationState;
        player.hp = saveData.player.hp;
        player.maxHp = saveData.player.maxHp;
        player.hunger = saveData.player.hunger;
        player.maxHunger = saveData.player.maxHunger;
        player.stamina = saveData.player.stamina;
        player.maxStamina = saveData.player.maxStamina;
        player.gold = saveData.player.gold;
        player.damage = saveData.player.damage;
        player.armor = saveData.player.armor || 0;
        player.relicsFound = new Set(saveData.player.relicsFound);
        
        player.armorName = saveData.player.armorName || '';
        player.armorDescription = saveData.player.armorDescription || '';
        player.weaponName = saveData.player.weaponName || '';
        player.weaponDescription = saveData.player.weaponDescription || '';
        player.potionName = saveData.player.potionName || '';
        player.potionDescription = saveData.player.potionDescription || '';
        
        if (saveData.gameTime) {
            gameTime.day = saveData.gameTime.day;
            gameTime.hour = saveData.gameTime.hour;
            gameTime.minute = saveData.gameTime.minute;
            gameTime.timeScale = saveData.gameTime.timeScale;
            gameTime.lastUpdate = 0;
        }
        
        updateUI();
        
        centerCameraOnPlayer();
        
        alert(`Game berhasil dimuat dari slot "${slotKey}"!`);
        hideSaveLoadMenu();
        closePauseMenu();
        
        return true;
    } catch (e) {
        console.error("Error loading game:", e);
        alert(`Gagal memuat game! Error: ${e.message}`);
        return false;
    }
}

function deleteSave(slotKey) {
    const saveDataJson = localStorage.getItem(slotKey);
    let saveName = `Slot ${slotKey.replace(SAVE_SLOT_PREFIX, '')}`;
    if (saveDataJson) {
        try { saveName = JSON.parse(saveDataJson).name || saveName; } catch (e) {}
    }

    if (confirm(`Apakah Anda yakin ingin menghapus save "${saveName}"?\nTindakan ini tidak bisa dibatalkan.`)) {
        try {
            localStorage.removeItem(slotKey);
            console.log(`Save slot ${slotKey} dihapus.`);
            alert(`Save "${saveName}" berhasil dihapus.`);
            const currentMode = saveloadNewSection.style.display === 'none' ? 'load' : 'save';
            populateSaveLoadList(currentMode);
        } catch (e) {
            console.error(`Gagal menghapus save slot ${slotKey}:`, e);
            alert("Gagal menghapus save.");
        }
    }
}


if (createSaveBtnElement) {
    createSaveBtnElement.addEventListener('click', () => {
        const name = saveNameInputElement.value.trim();
        if (!name) {
            alert("Nama save tidak boleh kosong!");
            return;
        }
        let targetSlotKey = null;
        for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
             const key = `${SAVE_SLOT_PREFIX}${i}`;
             if (!localStorage.getItem(key)) {
                 targetSlotKey = key;
                 break;
             }
        }
        if (!targetSlotKey) {
             alert(`Gagal menyimpan: Semua ${MAX_SAVE_SLOTS} slot save sudah penuh! Hapus save lama.`);
             return;
        }
        saveGame(targetSlotKey, name);
    });
}

if (saveloadBackBtnElement) {
    saveloadBackBtnElement.addEventListener('click', hideSaveLoadMenu);
}

function playHoverSound() {
    const hoverSound = document.getElementById('hoverSound');
    if (hoverSound) {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(e => console.error("Error playing hover sound:", e));
    }
}

function playPauseSound() {
    const pauseSound = document.getElementById('pauseSound');
    if (pauseSound) {
        pauseSound.currentTime = 0;
        pauseSound.play().catch(e => console.error("Error playing pause sound:", e));
    }
}

function playUnpauseSound() {
    const unpauseSound = document.getElementById('unpauseSound');
    if (unpauseSound) {
        unpauseSound.currentTime = 0;
        unpauseSound.play().catch(e => console.error("Error playing unpause sound:", e));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const popupOptions = document.querySelectorAll('#uiPanel .popup-options li');
    popupOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });

    const pauseOptions = document.querySelectorAll('#pause-options li');
    pauseOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });

    const saveLoadOptions = document.querySelectorAll('#save-slots-list li:not(.no-saves)');
    saveLoadOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });
});

const locationData = {
    'Kota Willburg': {
        type: 'city',
        interactions: ['quest', 'beli_makanan', 'bicara'],
        shopItems: [
            { name: 'Roti Gandum Premium', price: 15, hunger: 40, hp: 5 },
            { name: 'Sup Daging Spesial', price: 25, hunger: 60, hp: 15 },
            { name: 'Pie Buah Segar', price: 20, hunger: 50, hp: 10 }
        ]
    },
    'Kota Kecil': {
        type: 'city',
        interactions: ['quest', 'beli_makanan', 'bicara'],
        shopItems: [
            { name: 'Roti Tawar', price: 8, hunger: 30, hp: 0 },
            { name: 'Sup Ayam', price: 15, hunger: 45, hp: 8 },
            { name: 'Pie Apel', price: 12, hunger: 35, hp: 5 }
        ]
    },
    'Desa Poke': {
        type: 'village',
        interactions: ['quest', 'beli_makanan', 'bicara'],
        shopItems: [
            { name: 'Roti Desa', price: 5, hunger: 25, hp: 0 },
            { name: 'Sup Sayur', price: 10, hunger: 35, hp: 5 },
            { name: 'Kue Tradisional', price: 8, hunger: 30, hp: 3 }
        ]
    },
    'Kastil Kerajaan': {
        type: 'castle',
        interactions: ['quest', 'bicara_commander', 'armor_shop'],
        armorItems: [
            { name: 'Baju Zirah Besi', price: 100, maxHpBonus: 50, description: 'Meningkatkan Max HP sebesar 50 poin dan mengurangi damage 20%' },
            { name: 'Helm Ksatria', price: 50, maxHpBonus: 25, description: 'Meningkatkan Max HP sebesar 25 poin dan mengurangi damage 10%' },
            { name: 'Perisai Kerajaan', price: 75, maxHpBonus: 40, description: 'Meningkatkan Max HP sebesar 40 poin dan mengurangi damage 15%' }
        ]
    },
    'Menara Penyihir Sarungman': {
        type: 'tower',
        interactions: ['quest', 'bicara', 'potion_shop', 'bertanya_relic'],
        potionItems: [
            { name: 'Ramuan Penyembuh', price: 30, effect: 'Memulihkan 50 HP', hp: 50, hunger: 0 },
            { name: 'Ramuan Stamina Kecil', price: 25, effect: 'Meningkatkan Max Stamina sebesar 25 poin', staminaBonus: 25, hp: 0, hunger: 0 },
            { name: 'Ramuan Stamina Besar', price: 50, effect: 'Meningkatkan Max Stamina sebesar 50 poin', staminaBonus: 50, hp: 0, hunger: 0 },
            { name: 'Ramuan Kenyang', price: 20, effect: 'Memulihkan hunger penuh', hp: 0, hunger: 100 },
            { name: 'Ramuan Jitu Pemulih HP', price: 200, effect: 'Memulihkan HP hingga penuh', hp: 100, hunger: 0 },
            { name: 'Ramuan Jitu Pemulih Hunger', price: 200, effect: 'Memulihkan Hunger hingga penuh', hp: 0, hunger: 100 },
            { name: 'Ramuan Kutukan', price: 50, effect: 'Mengurangi HP dan Hunger sebesar 50%', hp: -50, hunger: -50 }
        ]
    },
    'Pusat Kota Managarmr': {
        type: 'capital',
        interactions: ['quest', 'beli_makanan', 'bicara', 'bicara_raja', 'beribadah', 'weapon_shop'],
        shopItems: [
            { name: 'Roti Emas', price: 30, hunger: 70, hp: 20 },
            { name: 'Sup Raja', price: 50, hunger: 100, hp: 30 },
            { name: 'Hidangan Istana', price: 40, hunger: 80, hp: 25 }
        ],
        weaponItems: [
            { name: 'Pedang Kayu', price: 50, damageBonus: 5, description: 'Meningkatkan damage sebesar 5 poin' },
            { name: 'Pedang Besi', price: 150, damageBonus: 15, description: 'Meningkatkan damage sebesar 15 poin' },
            { name: 'Pedang Perak', price: 350, damageBonus: 30, description: 'Meningkatkan damage sebesar 30 poin' }
        ],
        hasMetKing: false
    },
    'Reruntuhan Hatiku': {
        type: 'ruins',
        interactions: ['cari_harta', 'puzzle', 'cari_clue']
    },
    'Perkemahan Bandit': {
        type: 'camp',
        interactions: ['quest', 'lawan_bandit', 'cari_info']
    },
    'Pelabuhan Indah Kapal': {
        type: 'port',
        interactions: ['pindah_map', 'minta_warisan', 'cod_relic']
    },
    'Goa Monster Ambadala Crocodila': {
        type: 'cave',
        interactions: ['jelajah', 'lawan_monster', 'lawan_boss', 'kembalikan_relic']
    },
    'Markas Tungtungtung Sahur': {
        type: 'camp',
        interactions: ['quest', 'lawan_orc', 'cari_info']
    },
    'Goa Osas': {
        type: 'cave',
        interactions: ['jelajah', 'cari_harta', 'lawan_monster']
    },
    'Pohon Gede': {
        type: 'landmark',
        interactions: ['melamun']
    },
    'Desa Uwu': {
        type: 'village',
        interactions: ['quest', 'beli_makanan', 'bicara', 'berjudi'],
        shopItems: [
            { name: 'Roti Uwu', price: 6, hunger: 28, hp: 2 },
            { name: 'Sup Uwu', price: 12, hunger: 38, hp: 6 },
            { name: 'Kue Uwu', price: 9, hunger: 32, hp: 4 }
        ]
    },
    'Kastil Kerajaan_Commander': [
        "Selamat datang, Petualang! Aku adalah Komandan Agrat, pemimpin pasukan kerajaan. Jaga sikapmu selagi berada di wilayah Kerajaan Elendor yang telah berdiri selama 500 tahun.",
        "Kerajaan Elendor didirikan oleh Raja Pertama, Arslan Muda, setelah menyatukan lima suku yang berperang. Kastil ini dibangun dari batu Gunung Azur yang tahan terhadap serangan sihir.",
        "Berhati-hatilah dengan Perkemahan Bandit di timur. Mereka sering menyerang para pedagang yang lewat dan mencuri barang-barang berharga. Pasukanku sedang berencana melakukan serangan terhadap markas mereka.",
        "Markas Tungtungtung Sahur di selatan dihuni oleh klan orc yang dipimpin oleh Sahur si Pemulung. Mereka menggelar ritual misterius tiap malam saat bulan purnama, mungkin untuk memanggil monster kuno.",
        "Dengar-dengar, di Desa Uwu ada aktivitas perjudian ilegal. Aku berniat memberantasnya segera. Kegiatan tersebut sudah meresahkan kerajaan dan menyebabkan banyak petani kehilangan harta mereka.",
        "Di seluruh dunia Elendor, terdapat delapan relic kuno yang konon memiliki kekuatan luar biasa. Para peneliti istana telah mempelajari beberapa di antaranya yang berhasil kami temukan.",
        "Celurit, senjata melengkung yang berasal dari Madura, memiliki kekuatan untuk meningkatkan hasil panen dan melindungi tanah. Di Elendor, siapa yang memegangnya bisa mengendalikan kesuburan tanah.",
        "Gambus, alat musik dengan akar dari Timur Tengah yang berkembang di Indonesia, konon dapat menenangkan bahkan monster terganas sekalipun. Para penyanyi istana sering memainkannya untuk menghalau energi negatif.",
        "Keris, belati bergelombang dari Jawa, memiliki semangat penjaga di dalamnya. Di Elendor, Keris bisa memberi peringatan akan bahaya dan melindungi pemiliknya dari serangan sihir.",
        "Kujang, senjata melengkung dari Sunda, melambangkan kebijaksanaan dan kekuatan spiritual. Para petinggi istana percaya Kujang bisa membantu mengambil keputusan bijak dalam situasi sulit.",
        "Parang, senjata dan alat yang tersebar di seluruh Nusantara, menjadi simbol kerja keras dan bertahan hidup. Di dunia kita, Parang meningkatkan kemampuan bertahan pemegangnya dalam situasi genting.",
        "Topeng Barong, mewakili roh pelindung dari Bali, memiliki kekuatan untuk mengusir kegelapan. Di Elendor, konon Topeng ini bisa mengalahkan kegelapan terpekat dan melindungi seluruh kota.",
        "Topeng Ondel-ondel, figur besar dari Jakarta, yang dahulu digunakan untuk mengusir roh jahat. Di dunia kita, katanya bisa memberkati seluruh komunitas dan memberikan keberuntungan pada pemegangnya.",
        "Gunungan Wayang, simbol dalam pertunjukan wayang yang mewakili alam semesta, adalah relic paling kuat. Menurut legenda, siapa yang memilikinya bisa melihat masa depan dan mengubah takdir dunia Elendor.",
        "Kedelapan relic ini tersebar di berbagai penjuru Elendor. Beberapa disembunyikan di gua-gua berbahaya, beberapa mungkin ada di tangan bandit atau penjahat lainnya. Jika kau berhasil mengumpulkan semuanya... kekuatan luar biasa menantimu."
    ]
};

function handleSpecialInteraction(locationName, interactionType) {
    switch(interactionType) {
        case 'bicara_raja':
            if (!locationData['Pusat Kota Managarmr'].hasMetKing) {
                player.gold += 100;
                locationData['Pusat Kota Managarmr'].hasMetKing = true;
                return "Raja memberikan hadiah 100 Gold kepadamu sebagai sambutan!";
            }
            return "Raja sudah memberikan hadiahnya kepadamu sebelumnya.";

        case 'minta_warisan':
            player.gold += 500;
            return "Kamu mendapatkan warisan sebesar 500 Gold!";

        case 'cod_relic':
            window.relicsObtainedViaCOD = true;
            
            for (let i = 1; i <= 8; i++) {
                player.relicsFound.add(i);
            }
            
            setTimeout(() => {
                window.relicsObtainedViaCOD = false;
            }, 100);
            
            updateUI();
            return "Kamu mendapatkan semua relic!";

        case 'melamun':
            player.animationState = 'sit';
            return "Kamu duduk dan melamun di bawah Pohon Gede...";

        case 'cari_harta':
            const chance = Math.random();
            if (chance > 0.5) {
                const gold = Math.floor(Math.random() * 50) + 10;
                player.gold += gold;
                return `Kamu menemukan ${gold} Gold!`;
            }
            return "Kamu tidak menemukan apa-apa kali ini.";
    }
}

function updatePanelContent(locationName, panelTypeOrObject) {- 
     console.log(`updatePanelContent called for location: ${locationName}, type/object:`, panelTypeOrObject);

    const panel = document.querySelector(`[data-location="${locationName}"]`);
    if (!panel) return;

    const location = locationData[locationName];
    if (!location) return;

    let panelType;
    let panelData = null;

    if (typeof panelTypeOrObject === 'object' && panelTypeOrObject !== null && panelTypeOrObject.type) {
        panelType = panelTypeOrObject.type;
        panelData = panelTypeOrObject.data;
    } else {
        panelType = panelTypeOrObject;
    }

    switch (panelType) {
        case 'main':
            let interactionButtons = '';
            location.interactions.forEach(interaction => {
                let buttonText = '';
                switch(interaction) {
                    case 'quest': buttonText = 'Quest'; break;
                    case 'beli_makanan': buttonText = 'Beli Makanan'; break;
                    case 'bicara': 
                        if (locationName === 'Menara Penyihir Sarungman') {
                            buttonText = 'Berbicara Dengan Penyihir';
                        } else {
                            buttonText = 'Berbicara Dengan Penduduk Lokal';
                        }
                        break;
                    case 'bicara_commander': buttonText = 'Berbicara Dengan Commander'; break;
                    case 'beli_armor': buttonText = 'Membeli Upgrade Armor'; break;
                    case 'beli_senjata': buttonText = 'Membeli Senjata'; break;
                    case 'beli_ramuan': buttonText = 'Membeli Ramuan'; break;
                    case 'armor_shop': buttonText = 'Toko Armor'; break;
                    case 'weapon_shop': buttonText = 'Toko Senjata'; break;
                    case 'potion_shop': buttonText = 'Toko Ramuan'; break;
                    case 'bicara_raja': buttonText = 'Berbicara Dengan Raja'; break;
                    case 'cari_harta': buttonText = 'Mencari Harta Karun'; break;
                    case 'puzzle': buttonText = 'Memecahkan Puzzle'; break;
                    case 'cari_clue': buttonText = 'Mencari Clue'; break;
                    case 'lawan_bandit': buttonText = 'Melawan Bandit'; break;
                    case 'cari_info': buttonText = 'Mencari Informasi'; break;
                    case 'pindah_map': buttonText = 'Pindah Map'; break;
                    case 'minta_warisan': buttonText = 'Minta Warisan'; break;
                    case 'cod_relic': buttonText = 'COD Relic'; break;
                    case 'jelajah': buttonText = 'Menjelajah Goa'; break;
                    case 'lawan_monster': buttonText = 'Melawan Monster'; break;
                    case 'lawan_boss': buttonText = 'Melawan Boss'; break;
                    case 'lawan_orc': buttonText = 'Melawan Orc'; break;
                    case 'melamun': buttonText = 'Melamun'; break;
                    case 'berjudi': buttonText = 'Berjudi'; break;
                    case 'beribadah': buttonText = 'Beribadah'; break;
                    case 'bertanya_relic': buttonText = 'Bertanya Soal Relic'; break;
                    case 'kembalikan_relic': buttonText = 'Kembalikan Relic'; break;
                }
                
                interactionButtons += `
                    <li onclick="handleInteractionOption('${interaction}', '${locationName}')">
                        ${buttonText}
                    </li>
                `;
            });

            panel.innerHTML = `
                <h3>${locationName}</h3>
                <ul class="location-options">
                    ${interactionButtons}
                </ul>
                <button class="close-btn" onclick="closeLocationPanel('${locationName}')">Tutup</button>
            `;
            break;

        case 'shop':
            if (!location.shopItems) return;
            panel.innerHTML = `
                <h3>${locationName} - Toko</h3>
                <div class="shop-section">
                    <h4>Makanan yang Tersedia:</h4>
                    ${location.shopItems.map(item => `
                        <div class="shop-item">
                            <span class="item-name">${item.name}</span>
                            <span class="item-price">${item.price} Gold</span>
                            <span class="item-stats">+${item.hunger} Hunger${item.hp > 0 ? `, +${item.hp} HP` : ''}</span>
                            <button onclick="buyItem('${locationName}', '${item.name}')">Beli</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;

        case 'beli_ramuan':
            if (!location.potionItems) return;
            panel.innerHTML = `
                <h3>${locationName} - Toko Ramuan</h3>
                <div class="shop-section">
                    <h4>Ramuan yang Tersedia:</h4>
                    ${location.potionItems.map(potion => `
                        <div class="shop-item">
                            <span class="item-name">${potion.name}</span>
                            <span class="item-price">${potion.price} Gold</span>
                            <span class="item-stats">${potion.description || potion.effect}</span>
                            <button onclick="buyPotion('${locationName}', '${potion.name}')">Beli</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;

        case 'beli_armor':
            if (!location.armorItems) return;
            panel.innerHTML = `
                <h3>${locationName} - Toko Armor</h3>
                <div class="shop-section">
                    <h4>Armor yang Tersedia:</h4>
                    ${location.armorItems.map(armor => `
                        <div class="shop-item">
                            <span class="item-name">${armor.name}</span>
                            <span class="item-price">${armor.price} Gold</span>
                            <span class="item-stats">+${armor.maxHpBonus} Max HP</span>
                            <span class="item-desc">${armor.description}</span>
                            <button onclick="buyArmor('${locationName}', '${armor.name}')">Beli</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;
            
        case 'beli_senjata':
            if (!location.weaponItems) return;
            panel.innerHTML = `
                <h3>${locationName} - Toko Senjata</h3>
                <div class="shop-section">
                    <h4>Senjata yang Tersedia:</h4>
                    ${location.weaponItems.map(weapon => `
                        <div class="shop-item">
                            <span class="item-name">${weapon.name}</span>
                            <span class="item-price">${weapon.price} Gold</span>
                            <span class="item-stats">+${weapon.damageBonus} Damage</span>
                            <span class="item-desc">${weapon.description}</span>
                            <button onclick="buyWeapon('${locationName}', '${weapon.name}')">Beli</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;

        case 'talk':
            const tips = locationTips[locationName] || ["Tidak ada informasi khusus saat ini."];
            const talkerText = locationName === 'Menara Penyihir Sarungman' ? 'Penyihir memberi tahu' : 'Penduduk lokal memberi tahu';
            panel.innerHTML = `
                <h3>${locationName} - Berbicara</h3>
                <div class="talk-content">
                    <p>${talkerText}:</p>
                    <ul>
                        ${tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;

        case 'travel':
            if (locationName !== 'Pelabuhan Indah Kapal') return;

            panel.innerHTML = `
                <h3>${locationName} - Tujuan Perjalanan</h3>
                <div class="shop-section"> <!-- Menggunakan class shop-section -->
                    <h4>Pilih Tujuan (Biaya Perjalanan):</h4>
                    ${Object.entries(travelDestinations).map(([destName, destData]) => {
                        const cost = destData.cost;
                        const canAfford = player.gold >= cost;
                        const disabledAttribute = canAfford ? '' : 'disabled';
                        const buttonText = canAfford ? 'Berangkat' : 'Gold Tidak Cukup';
                        const buttonClass = canAfford ? '' : 'disabled-button'; 
                        return `
                        <div class="shop-item"> <!-- Menggunakan class shop-item -->
                            <span class="item-name">${destName}</span>
                            <span class="item-price">${cost} Gold</span> <!-- Tampilkan biaya -->
                            <button onclick="handleMapTransfer('${destName}')" ${disabledAttribute} class="${buttonClass}">
                                ${buttonText}
                                </button>
                        </div>
                        `;
                    }).join('')}
                    </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;

        case 'gamble':
            if (locationName !== 'Desa Uwu') return;

            let betOptionsHTML = '';

            betOptionsHTML += `
                <div class="shop-item">
                    <span class="item-name">Taruhan 10 Gold</span>
                    <span class="item-price">Peluang Menang: 45%</span>
                    <span class="item-stats">Jackpot: 10%</span>
                    <button onclick="handleGambling('${locationName}', 10)">Pasang</button>
                </div>
            `;

            if (player.gold >= 100) {
                betOptionsHTML += `
                    <div class="shop-item">
                        <span class="item-name">Taruhan 100 Gold</span>
                        <span class="item-price">Peluang Menang: 45%</span>
                        <span class="item-stats">Jackpot: 10%</span>
                        <button onclick="handleGambling('${locationName}', 100)">Pasang</button>
                    </div>
                `;
            }

            if (player.gold >= 500) {
                betOptionsHTML += `
                    <div class="shop-item">
                        <span class="item-name">Taruhan 500 Gold</span>
                        <span class="item-price">Peluang Menang: 45%</span>
                        <span class="item-stats">Jackpot: 10%</span>
                        <button onclick="handleGambling('${locationName}', 500)">Pasang</button>
                    </div>
                `;
            }

            panel.innerHTML = `
                <h3>${locationName} - Berjudi</h3>
                <div class="shop-section"> <!-- Menggunakan class shop-section -->
                    <h4>Pilih Taruhan:</h4>
                    ${betOptionsHTML}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;
        case 'puzzle':
            if (locationName === 'Reruntuhan Hatiku') {
                if (!ruinsPuzzleAttempted) {
                    showTicTacToePuzzle();
            } else {
                    alert("Kamu sudah mencoba memecahkan puzzle di reruntuhan ini.");
                }
            } else {
                alert("Tidak ada puzzle yang terlihat di sini.");
            }
            break;

        case 'bertanya_relic':
            if (locationName === 'Menara Penyihir Sarungman') {
                updatePanelContent(locationName, 'bertanya_relic');
            } else {
                alert('Hanya Penyihir Sarungman yang tahu soal Relic.');
            }
            break;

        case 'show_relic_info':
            console.log(`  -> Entered 'show_relic_info' case in handleInteractionOption. Data: ${data}`);
            if (locationName === 'Menara Penyihir Sarungman' && data) {
                updatePanelContent(locationName, { type: 'show_relic_info', data: data });
            } else {
                 console.log('  -> Condition not met for calling updatePanelContent from show_relic_info');
            }
            break;

        case 'talk_commander':
            const commanderTips = locationTips['Kastil Kerajaan_Commander'] || ["Tidak ada informasi dari Commander saat ini."];
            panel.innerHTML = `
                <h3>${locationName} - Komandan Kastil</h3>
                <div class="talk-content">
                    <p>Commander memberi tahu:</p>
                    <ul>
                        ${commanderTips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;

        default:
            const result = handleSpecialInteraction(locationName, optionType);
            if (result) {
                alert(result);
                updateUI();
            }
            break;
    }
}

function closeInteractionPopup() {
    if (!popupContentElement) return;
    console.log("Menutup popup interaksi.");
    popupContentElement.style.display = 'none';
    isInteractionPopupOpen = false;
}

function openPauseMenu() {
    if (!pauseMenuElement) return;
    console.log("Game Dijeda.");
    pauseMenuElement.classList.add('visible');
    isGamePaused = true;
    backgroundMusic.pause();
    playPauseSound();
}

function closePauseMenu() {
    if (!pauseMenuElement) return;
    console.log("Game Dilanjutkan.");
    pauseMenuElement.classList.remove('visible');
    isGamePaused = false;
    playUnpauseSound();
    if (userInteracted && bgmPlaying && backgroundMusic.paused) {
        backgroundMusic.play().catch(e => console.error("Gagal melanjutkan BGM:", e));
    }
}

function continueGame() {
    closePauseMenu();
}

function restartGame() {
    player.hp = player.maxHp;
    player.hunger = player.maxHunger;
    player.stamina = player.maxStamina;
    player.gold = 0;
    player.relicsFound = new Set();
    isGameOver = false;
    currentLocationName = null;
    previousLocationName = null;

    gameTime.day = 1;
    gameTime.hour = 6;
    gameTime.minute = 0;
    gameTime.lastUpdate = 0;

    resetVolumeSliders();
    
    isGamePaused = false;
    isInteractionPopupOpen = false;
    isSaveLoadMenuOpen = false;
    
    const gameOverPopup = document.getElementById('game-over-popup');
    if (gameOverPopup) {
        gameOverPopup.remove();
    }

    updateUI();
    closePauseMenu();
    closeInteractionPopup();
    hideSaveLoadMenu();
    
    findSpawnPointsAndSetPlayer();
    centerCameraOnPlayer();

    if (bgmPlaying && backgroundMusic.paused) {
        tryStartBackgroundMusic();
    }
    console.log("Game restarted.");
}

function goToMainMenu() {
    player.hp = player.maxHp;
    player.hunger = player.maxHunger;
    player.stamina = player.maxStamina;
    player.gold = 0;
    player.relicsFound = new Set();
    
    if (backgroundMusic) {
        backgroundMusic.pause();
    }
    
    window.location.href = "index.html";
}

function exitGame() {
    goToMainMenu();
}

function showSaveLoadMenu(mode) {
    if (!saveloadMenuElement) return;

    console.log(`Membuka menu Save/Load dalam mode: ${mode}`);
    saveloadTitleElement.textContent = mode === 'save' ? 'Simpan Game' : 'Muat Game';

    saveloadNewSection.style.display = mode === 'save' ? 'flex' : 'none';
    if (mode === 'save') {
        saveNameInputElement.value = `Save ${new Date().toLocaleDateString()}`;t
    }

    populateSaveLoadList(mode);

    pauseMenuElement.classList.remove('visible');
    saveloadMenuElement.classList.add('visible');
    isSaveLoadMenuOpen = true;
}

function hideSaveLoadMenu() {
    if (!saveloadMenuElement) return;
    saveloadMenuElement.classList.remove('visible');
    isSaveLoadMenuOpen = false;
    if (isGamePaused) {
         pauseMenuElement.classList.add('visible');
    }
}

function populateSaveLoadList(mode) {
    if (!saveSlotsListElement) return;
    saveSlotsListElement.innerHTML = '';

    let savesFound = 0;
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const key = `${SAVE_SLOT_PREFIX}${i}`;
        const saveDataJson = localStorage.getItem(key);

        if (saveDataJson) {
            savesFound++;
            try {
                const saveData = JSON.parse(saveDataJson);
                const li = document.createElement('li');

                const timestamp = new Date(saveData.timestamp);
                const formattedTime = timestamp.toLocaleString('id-ID', {
                    dateStyle: 'medium', timeStyle: 'short'
                });

                li.innerHTML = `
                    <img src="${saveData.screenshot || 'placeholder.png'}" alt="Preview" class="save-preview" onerror="this.src='placeholder.png'; this.alt='Preview Gagal';">
                    <div class="save-info">
                        <div class="save-name">${saveData.name || `Save Slot ${i}`}</div>
                        <div class="save-timestamp">${formattedTime}</div>
                 </div>
                    <div class="save-actions">
                        ${mode === 'load' ? `<button class="load-btn" onclick="loadGame('${key}')">Muat</button>` : ''}
                        <button class="delete-btn" onclick="deleteSave('${key}')">Hapus</button>
                    </div>
                `;
                saveSlotsListElement.appendChild(li);
            } catch (e) {
                console.error(`Gagal parse save data untuk slot ${key}:`, e);
                localStorage.removeItem(key);
            }
        }
    }

    if (savesFound === 0) {
        saveSlotsListElement.innerHTML = '<li class="no-saves">Belum ada game yang disimpan.</li>';
    }
}

function saveGame(slotKey, saveName) {
    try {
        const saveData = {
            saveName: saveName,
            timestamp: new Date().toISOString(),
            player: {
                x: player.x,
                y: player.y,
                direction: player.direction,
                animationState: player.animationState,
                hp: player.hp,
                maxHp: player.maxHp,
                hunger: player.hunger,
                maxHunger: player.maxHunger,
                stamina: player.stamina,
                maxStamina: player.maxStamina,
                gold: player.gold,
                damage: player.damage,
                armor: player.armor,
                relicsFound: Array.from(player.relicsFound),
                armorName: player.armorName || '',
                armorDescription: player.armorDescription || '',
                weaponName: player.weaponName || '',
                weaponDescription: player.weaponDescription || '',
                potionName: player.potionName || '',
                potionDescription: player.potionDescription || ''
            },
            gameTime: {
                day: gameTime.day,
                hour: gameTime.hour,
                minute: gameTime.minute,
                timeScale: gameTime.timeScale
            }
        };

        localStorage.setItem(`gameElendorSave_${slotKey}`, JSON.stringify(saveData));
        alert(`Game berhasil disimpan ke slot "${slotKey}"!`);
        
        populateSaveLoadList('save');
        
        return true;
    } catch (e) {
        console.error("Error saving game:", e);
        alert(`Gagal menyimpan game! Error: ${e.message}`);
        return false;
    }
}

function loadGame(slotKey) {
    try {
        const saveDataJson = localStorage.getItem(`gameElendorSave_${slotKey}`);
        if (!saveDataJson) {
            alert(`Tidak ada data save di slot "${slotKey}"`);
            return false;
        }

        const saveData = JSON.parse(saveDataJson);
        
        player.x = saveData.player.x;
        player.y = saveData.player.y;
        player.direction = saveData.player.direction;
        player.animationState = saveData.player.animationState;
        player.hp = saveData.player.hp;
        player.maxHp = saveData.player.maxHp;
        player.hunger = saveData.player.hunger;
        player.maxHunger = saveData.player.maxHunger;
        player.stamina = saveData.player.stamina;
        player.maxStamina = saveData.player.maxStamina;
        player.gold = saveData.player.gold;
        player.damage = saveData.player.damage;
        player.armor = saveData.player.armor || 0;
        player.relicsFound = new Set(saveData.player.relicsFound);
        
        player.armorName = saveData.player.armorName || '';
        player.armorDescription = saveData.player.armorDescription || '';
        player.weaponName = saveData.player.weaponName || '';
        player.weaponDescription = saveData.player.weaponDescription || '';
        player.potionName = saveData.player.potionName || '';
        player.potionDescription = saveData.player.potionDescription || '';
        
        if (saveData.gameTime) {
            gameTime.day = saveData.gameTime.day;
            gameTime.hour = saveData.gameTime.hour;
            gameTime.minute = saveData.gameTime.minute;
            gameTime.timeScale = saveData.gameTime.timeScale;
            gameTime.lastUpdate = 0;
        }
        
        updateUI();
        
        centerCameraOnPlayer();
        
        alert(`Game berhasil dimuat dari slot "${slotKey}"!`);
        hideSaveLoadMenu();
        closePauseMenu();
        
        return true;
    } catch (e) {
        console.error("Error loading game:", e);
        alert(`Gagal memuat game! Error: ${e.message}`);
        return false;
    }
}

function deleteSave(slotKey) {
    const saveDataJson = localStorage.getItem(slotKey);
    let saveName = `Slot ${slotKey.replace(SAVE_SLOT_PREFIX, '')}`;
    if (saveDataJson) {
        try { saveName = JSON.parse(saveDataJson).name || saveName; } catch (e) {}
    }

    if (confirm(`Apakah Anda yakin ingin menghapus save "${saveName}"?\nTindakan ini tidak bisa dibatalkan.`)) {
        try {
            localStorage.removeItem(slotKey);
            console.log(`Save slot ${slotKey} dihapus.`);
            alert(`Save "${saveName}" berhasil dihapus.`);
            const currentMode = saveloadNewSection.style.display === 'none' ? 'load' : 'save';
            populateSaveLoadList(currentMode);
        } catch (e) {
            console.error(`Gagal menghapus save slot ${slotKey}:`, e);
            alert("Gagal menghapus save.");
        }
    }
}


if (createSaveBtnElement) {
    createSaveBtnElement.addEventListener('click', () => {
        const name = saveNameInputElement.value.trim();
        if (!name) {
            alert("Nama save tidak boleh kosong!");
            return;
        }
        let targetSlotKey = null;
        for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
             const key = `${SAVE_SLOT_PREFIX}${i}`;
             if (!localStorage.getItem(key)) {
                 targetSlotKey = key;
                 break;
             }
        }
        if (!targetSlotKey) {
             alert(`Gagal menyimpan: Semua ${MAX_SAVE_SLOTS} slot save sudah penuh! Hapus save lama.`);
             return;
        }
        saveGame(targetSlotKey, name);
    });
}

if (saveloadBackBtnElement) {
    saveloadBackBtnElement.addEventListener('click', hideSaveLoadMenu);
}

function playHoverSound() {
    const hoverSound = document.getElementById('hoverSound');
    if (hoverSound) {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(e => console.error("Error playing hover sound:", e));
    }
}

function playPauseSound() {
    const pauseSound = document.getElementById('pauseSound');
    if (pauseSound) {
        pauseSound.currentTime = 0;
        pauseSound.play().catch(e => console.error("Error playing pause sound:", e));
    }
}

function playUnpauseSound() {
    const unpauseSound = document.getElementById('unpauseSound');
    if (unpauseSound) {
        unpauseSound.currentTime = 0;
        unpauseSound.play().catch(e => console.error("Error playing unpause sound:", e));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const popupOptions = document.querySelectorAll('#uiPanel .popup-options li');
    popupOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });

    const pauseOptions = document.querySelectorAll('#pause-options li');
    pauseOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });

    const saveLoadOptions = document.querySelectorAll('#save-slots-list li:not(.no-saves)');
    saveLoadOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });
});

function closeLocationPanel(locationName) {
    const panel = document.querySelector(`[data-location="${locationName}"]`);
    if (panel) {
        panel.style.display = 'none';
        isInteractionPopupOpen = false;
    }
}

function closeInteractionPopup() {
    document.getElementById('location-panels').innerHTML = '';
    
    isInteractionPopupOpen = false;
    
    updateUI();
}

function handleQuestAnswer(locationName, questIndex, selectedAnswer) {
    console.log(`Quest answer: location=${locationName}, index=${questIndex}, answer=${selectedAnswer}`);
    
    const locationQuests = quests[locationName];
    if (!locationQuests || questIndex >= locationQuests.length) {
        console.error("Quest tidak ditemukan!");
        updatePanelContent(locationName, 'main');
        return;
    }

    const quest = locationQuests[questIndex];
    console.log(`Quest data:`, quest);
    console.log(`Comparing: Selected="${selectedAnswer}" vs Correct="${quest.correctAnswer}"`);
    
    const isCorrect = String(selectedAnswer) === String(quest.correctAnswer);
    
    if (!locationCorrectAnswers.has(locationName)) {
        locationCorrectAnswers.set(locationName, 0);
    }
    
    if (isCorrect) {
        const currentCorrect = locationCorrectAnswers.get(locationName) + 1;
        locationCorrectAnswers.set(locationName, currentCorrect);
        player.gold += quest.reward.gold;
        locationQuests.splice(questIndex, 1);
        
        let resultMessage = "Jawaban Benar!";
        let rewardMessage = `Selamat! Kamu mendapatkan ${quest.reward.gold} Gold.`;
        
        if (currentCorrect >= 3) {
            const nextRelicId = Math.min(player.relicsFound.size + 1, 8);
            if (nextRelicId <= 8 && !player.relicsFound.has(nextRelicId)) {
                player.relicsFound.add(nextRelicId);
                rewardMessage += ` Kamu juga mendapatkan Relic ${nextRelicId} dari ${locationName}!`;
                
                if (!window.relicsObtainedViaCOD) {
                    setTimeout(() => {
                        showRelicDiscoveryPopup(nextRelicId);
                    }, 1500);
                }
            }
        }
        
        showQuestResult(locationName, resultMessage, rewardMessage, locationQuests);
    } else {
        player.hp = Math.max(0, player.hp - 25);
        
        if (player.hp <= 0) {
            closeLocationPanel(locationName);
            showGameOverPopup();
            return;
        }
        
        let resultMessage = "Jawaban Salah! (-25 HP)";
        let rewardMessage = `HP kamu sekarang: ${player.hp}/${player.maxHp}`;
        showQuestResult(locationName, resultMessage, rewardMessage, locationQuests);
    }

    updateUI();
}

function showQuestResult(locationName, resultMessage, rewardMessage, remainingQuests) {
    const panel = document.querySelector(`[data-location="${locationName}"]`);
    if (!panel) return;

    if (remainingQuests.length > 0) {
        const nextQuest = remainingQuests[0];
    panel.innerHTML = `
        <h3>${locationName} - Hasil Quest</h3>
        <p>${resultMessage}</p>
        <p>${rewardMessage}</p>
        <p>Jawaban benar saat ini: ${locationCorrectAnswers.get(locationName)}/3</p>
            <div class="quest-content">
                <h4>Quest Berikutnya:</h4>
                <p>${nextQuest.question}</p>
                <div class="quest-options">
                    ${nextQuest.options.map((option) => `
                        <button onclick="handleQuestAnswer('${locationName}', 0, '${option.replace(/'/g, "\\'")}')">
                            ${option}
                        </button>
                    `).join('')}
                    <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
                </div>
            </div>
        `;
    } else {
        panel.innerHTML = `
            <h3>${locationName} - Hasil Quest</h3>
            <p>${resultMessage}</p>
            <p>${rewardMessage}</p>
            <p>Jawaban benar saat ini: ${locationCorrectAnswers.get(locationName)}/3</p>
            <p>Semua quest di lokasi ini telah selesai!</p>
            <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
        `;
    }
}

function openInteractionPopup(locationName) {
    if (!locationName) return;
    createLocationPanel(locationName);
}

function closeInteractionPopup() {
    if (currentLocation) {
        closeLocationPanel(currentLocation);
    }
}

let mainVolume = 1.0;
let musicVolume = 1.0;
let uiVolume = 1.0;

function initializeVolumeControls() {
    const mainVolumeSlider = document.getElementById('main-volume');
    const musicVolumeSlider = document.getElementById('music-volume');
    const uiVolumeSlider = document.getElementById('ui-volume');

    const savedMainVolume = localStorage.getItem('mainVolume');
    const savedMusicVolume = localStorage.getItem('musicVolume');
    const savedUiVolume = localStorage.getItem('uiVolume');

    if (savedMainVolume) {
        mainVolume = parseFloat(savedMainVolume);
        mainVolumeSlider.value = mainVolume * 100;
    }
    if (savedMusicVolume) {
        musicVolume = parseFloat(savedMusicVolume);
        musicVolumeSlider.value = musicVolume * 100;
    }
    if (savedUiVolume) {
        uiVolume = parseFloat(savedUiVolume);
        uiVolumeSlider.value = uiVolume * 100;
    }

    mainVolumeSlider.addEventListener('input', (e) => {
        mainVolume = e.target.value / 100;
        localStorage.setItem('mainVolume', mainVolume);
        updateAllVolumes();
    });

    musicVolumeSlider.addEventListener('input', (e) => {
        musicVolume = e.target.value / 100;
        localStorage.setItem('musicVolume', musicVolume);
        updateAllVolumes();
    });

    uiVolumeSlider.addEventListener('input', (e) => {
        uiVolume = e.target.value / 100;
        localStorage.setItem('uiVolume', uiVolume);
        updateAllVolumes();
    });
}

function updateAllVolumes() {
    if (backgroundMusic) {
        backgroundMusic.volume = musicVolume;
    }

    const uiSoundElements = document.querySelectorAll('#hoverSound, #pauseSound, #unpauseSound');
    uiSoundElements.forEach(sound => {
        sound.volume = uiVolume;
    });

    const gameSoundElements = document.querySelectorAll('#walkSound, #runSound');
    gameSoundElements.forEach(sound => {
        sound.volume = mainVolume;
    });
}

function playUISound(soundName) {
    const sound = uiSounds[soundName];
    if (sound) {
        sound.volume = uiVolume;
        sound.play();
    }
}

function playGameSound(soundName) {
    const sound = gameSounds[soundName];
    if (sound) {
        sound.volume = mainVolume;
        sound.play();
    }
}

initializeVolumeControls();

function resetVolumeSliders() {
    mainVolume = 1.0;
    musicVolume = 1.0;
    uiVolume = 1.0;

    document.getElementById('main-volume').value = 100;
    document.getElementById('music-volume').value = 100;
    document.getElementById('ui-volume').value = 100;

    localStorage.setItem('mainVolume', mainVolume);
    localStorage.setItem('musicVolume', musicVolume);
    localStorage.setItem('uiVolume', uiVolume);
    updateAllVolumes();
}

const locationCorrectAnswers = new Map();

const interactionLabels = {
    'quest': 'Quest',
    'beli_makanan': 'Beli Makanan',
    'bicara': 'Bicara',
    'bicara_raja': 'Bicara dengan Raja',
    'beribadah': 'Beribadah',
    'weapon_shop': 'Toko Senjata',
    'armor_shop': 'Toko Armor',
    'potion_shop': 'Toko Ramuan',
    'jelajah': 'Jelajahi',
    'lawan_monster': 'Lawan Monster',
    'lawan_boss': 'Lawan Boss',
    'cari_harta': 'Cari Harta',
    'puzzle': 'Pecahkan Puzzle',
    'cari_clue': 'Cari Petunjuk',
    'pindah_map': 'Pindah Map',
    'minta_warisan': 'Minta Warisan',
    'cod_relic': 'COD Relic',
    'lawan_bandit': 'Lawan Bandit',
    'cari_info': 'Cari Informasi',
    'lawan_orc': 'Lawan Orc',
    'melamun': 'Melamun',
    'berjudi': 'Berjudi',
    'kembalikan_relic': 'Kembalikan Relic'
};

function getInteractionLabel(interactionType) {
    return interactionLabels[interactionType] || interactionType;
}

const locationTips = {
    'Kota Willburg': [
        "Kamu bisa mendapatkan relic dengan menyelesaikan 3 quest di lokasi tertentu.",
        "Jaga hunger bar agar tidak kosong, atau HP akan berkurang.",
        "Gunakan shift untuk berlari, tapi perhatikan stamina bar."
    ],
    'Kota Kecil': [
        "Beberapa lokasi menyediakan makanan untuk mengisi hunger bar.",
        "Kamu bisa mendapatkan gold dari menyelesaikan quest.",
        "Perhatikan HP bar saat menjawab quest, jawaban salah akan mengurangi HP."
    ],
    'Desa Poke': [
        "Makanan di desa lebih murah dari kota.",
        "Kunjungi Menara Penyihir untuk informasi tentang relic.",
        "Raja di Pusat Kota bisa memberimu gold."
    ],
    'Pusat Kota Managarmr': [
        "Kota ini adalah pusat dari segala aktivitas.",
        "Raja sangat dermawan kepada pengunjung baru.",
        "Makanan di sini berkualitas tinggi tapi mahal."
    ],
    'Perkemahan Bandit':[
        "Terdapat sebuah rumor bahwa Goa Monster Ambadala Crocodila ada monster sungguhan.",
        "Jika kamu diam untuk beberapa saat, karaktermu akan duduk untuk beristirahat.",
        "Relic-relic yang ada di dunia ini mungkin ada hubungannya dengan monster yang dirumorkan."
    ],
    'Desa Uwu': [
        "Ada rumor bahwa commander dari kastil kerajaan sedang memberantas perjudian... kami harap dia tidak menemukan kami.",
        "Tahukah kamu jika untuk mengalahkan sebuah orc, diperlukan 5 orang sekaligus? kami tahu karena 5 warga desa kami tewas dalam pertarungan untuk membunuh orc yang mengamuk.",
        "Sebulan lalu, kami mendapatkan info dari seorang penjelajah bahwa dia kesulitan untuk bergerak di daerah perhutanan karena pepohonan yang memperlambatnya."
    ],
    'Markas Tungtungtung Sahur': [
        "Awalnya, kami membangun markas ini untuk memburu penyihir yang dirumorkan tinggal di dekat sini, tetapi belakangan ini muncul rumor yang lebih mendesak tentang keberadaan monster di sebuah goa dekat sini.",
        "Kami cukup berpengalaman dalam bertarung, terutama dengan bandit. mereka cukup lincah sehingga sulit untuk melancarkan serangan terhadap mereka, tetapi kekurangan mereka adalah pertahanan yang cukup rapuh!",
        "Sudah lama kami tidak beribadah. Kedengarannya sebuah gereja baru saja didirikan disekitar Kastil Kerajaan!"
    ],
    'Menara Penyihir Sarungman': [
        "Halo anak muda! pastikan pertemuan kita disini dirahasiakan oleh kita berdua, karena jika tidak, kamu akan kuburu sampai akhir hayat!",
        "Hanya di tempat ini kamu bisa membeli ramuan berkualitas tertinggi! tetapi dengan kualiatas ada harga! hehehe.",
        "Jika kamu bosan dengan kesehatan, aku memiliki satu ramuan yang bisa membuatmu jatuh sakit, dan harganya sangat terjangkau! hehehe."
    ],
    'Kastil Kerajaan_Commander': [
        "Selamat datang, Petualang! Jaga sikapmu selagi berada di wilayah Kerajaan.",
        "Kami selalu waspada terhadap ancaman, terutama dari arah Perkemahan Bandit dan goa-goa di sekitar sini.",
        "Jika kau melihat sesuatu yang mencurigakan, laporkan segera!"
    ]
};

const shopItems = {
    'Kota Willburg': [
        { name: 'Roti Gandum Premium', price: 15, hunger: 40, hp: 5 },
        { name: 'Sup Daging Spesial', price: 25, hunger: 60, hp: 15 },
        { name: 'Pie Buah Segar', price: 20, hunger: 50, hp: 10 }
    ],
    'Kota Kecil': [
        { name: 'Roti Tawar', price: 8, hunger: 30, hp: 0 },
        { name: 'Sup Ayam', price: 15, hunger: 45, hp: 8 },
        { name: 'Pie Apel', price: 12, hunger: 35, hp: 5 }
    ],
    'Desa Poke': [
        { name: 'Roti Desa', price: 5, hunger: 25, hp: 0 },
        { name: 'Sup Sayur', price: 10, hunger: 35, hp: 5 },
        { name: 'Kue Tradisional', price: 8, hunger: 30, hp: 3 }
    ],
    'Pusat Kota Managarmr': [
        { name: 'Roti Emas', price: 30, hunger: 70, hp: 20 },
        { name: 'Sup Raja', price: 50, hunger: 100, hp: 30 },
        { name: 'Hidangan Istana', price: 40, hunger: 80, hp: 25 }
    ]
};

const potionItems = [
    { name: 'Ramuan Penyembuh', price: 30, effect: 'Memulihkan 50 HP', hp: 50, hunger: 0 },
    { name: 'Ramuan Stamina', price: 25, effect: 'Memulihkan stamina penuh', hp: 0, hunger: 0 },
    { name: 'Ramuan Kenyang', price: 20, effect: 'Memulihkan hunger penuh', hp: 0, hunger: 100 }
];

const armorUpgrades = [
    { name: 'Baju Zirah Besi', price: 100, effect: 'Mengurangi damage 20%' },
    { name: 'Helm Ksatria', price: 50, effect: 'Mengurangi damage 10%' },
    { name: 'Perisai Kerajaan', price: 75, effect: 'Mengurangi damage 15%' }
];

const relicInfo = {
    'Celurit': { type: 'Senjata Tajam', origin: 'Madura', use: 'Senjata tradisional yang ikonik, sering dikaitkan dengan keberanian.' },
    'Gambus': { type: 'Alat Musik Petik', origin: 'Timur Tengah/Melayu', use: 'Digunakan dalam musik tradisional Melayu dan bernuansa Islami.' },
    'Keris': { type: 'Senjata Tikam/Pusaka', origin: 'Jawa/Nusantara', use: 'Memiliki nilai historis, spiritual, dan seni tinggi, dianggap memiliki kekuatan magis.' },
    'Kujang': { type: 'Senjata/Alat Pertanian', origin: 'Sunda', use: 'Simbol masyarakat Sunda, memiliki makna filosofis dan spiritual.' },
    'Parang': { type: 'Senjata Tebas/Alat Kerja', origin: 'Nusantara', use: 'Alat serbaguna untuk bekerja di hutan atau sebagai senjata.' },
    'Topeng Barong': { type: 'Topeng Sakral', origin: 'Bali', use: 'Mewakili roh pelindung dalam mitologi Bali, digunakan dalam tarian sakral.' },
    'Topeng Ondel-Ondel': { type: 'Topeng Pertunjukan', origin: 'Betawi', use: 'Ikon budaya Betawi, digunakan dalam arak-arakan dan perayaan.' },
    'Wayang Gunungan': { type: 'Simbol Wayang Kulit', origin: 'Jawa', use: 'Melambangkan alam semesta atau kehidupan, digunakan sebagai pembuka dan penutup pertunjukan wayang.' }
};

function createLocationPanel(locationName) {
    if (!locationName || !locationData[locationName]) {
        console.error("Invalid location name:", locationName);
        return;
    }

    const locationPanels = document.getElementById('location-panels');
    if (!locationPanels) {
        console.error("Location panels container not found");
        return;
    }

    const existingPanel = locationPanels.querySelector(`[data-location="${locationName}"]`);
    if (existingPanel) {
        existingPanel.remove();
    }

    const panel = document.createElement('div');
        panel.className = 'location-panel';
        panel.dataset.location = locationName;
        locationPanels.appendChild(panel);

    updatePanelContent(locationName, 'main');
    panel.style.display = 'block';
    isInteractionPopupOpen = true;

    console.log(`Opening interaction panel for: ${locationName}`);
}

function toggleMap() {
    isMapMode = !isMapMode;
    console.log(`Mode Peta: ${isMapMode ? 'Aktif' : 'Nonaktif'}`);
    
    try {
        if (isMapMode) {
            openMapSound.currentTime = 0;
            openMapSound.play();
        } else {
            closeMapSound.currentTime = 0;
            closeMapSound.play();
        }
    } catch (err) {
        console.error("Gagal play sound:", err);
    }

    player.targetX = null;
    player.targetY = null;
    player.dx = 0;
    player.dy = 0;
    player.moving = false;
    player.isRunning = false;
    player.animationState = 'idle';
    player.animFrameIndex = 0;
    player.animTimer = 0;
    
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    keys.shift = false;

    updateCurrentSprite();
    
    if (!isMapMode && mapLoaded && camera.initialSetupDone) {
        centerCameraOnPlayer();
    }

    updateUI();
}

function handleGambling(locationName, betAmount) {
    if (player.gold < betAmount) {
        alert(`Gold tidak cukup! Kamu membutuhkan ${betAmount} gold.`);
        return;
    }

    player.gold -= betAmount;

    const random = Math.random();
    let resultMessage = '';
    let winnings = 0;

    if (random < 0.45) {
        winnings = betAmount * 2;
        resultMessage = "Selamat! anda beruntung dapat memenangkan pertaruhan anda. Taruhan anda sudah dikembalikan dalam bentuk 2x lipat!";
    } else if (random < 0.9) {
        winnings = 0;
        resultMessage = "Sayang sekali! anda kurang beruntung. Anda kehilangan gold yang anda pertaruhkan... mungkin coba lagi nanti!";
    } else {
        winnings = betAmount * 3;
        resultMessage = "Anda adalah orang yang paling beruntung karena sudah memenangkan JACKPOT! taruhan anda sudah dikembalikan dalam bentuk 3x lipat!";
    }

    player.gold += winnings;

    updateUI();

    const panel = document.querySelector(`[data-location="${locationName}"]`);
    if (panel) {
        panel.innerHTML = `
            <h3>${locationName} - Hasil Judi</h3>
            <div class="gambling-result">
                <p>${resultMessage}</p>
                <p>Gold kamu sekarang: ${player.gold}</p>
            </div>
            <button class="close-btn" onclick="updatePanelContent('${locationName}', 'berjudi')">Main Lagi</button>
            <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
        `;
    }
}

const quests = {
    'Kota Willburg': [
        {
            question: "Di mana kamu bisa mendapatkan informasi lebih lanjut mengenai Relic yang tersebar di dunia ini?",
            options: ["Menara Penyihir Sarungman", "Kastil Kerajaan", "Reruntuhan Hatiku"],
            correctAnswer: "Menara Penyihir Sarungman",
            reward: { gold: 50 }
        },
        {
            question: "Siapakah yang dikenal murah hati dan memberikan gold kepada pengunjung baru di kerajaannya?",
            options: ["Penyihir Sarungman", "Raja di Pusat Kota Managarmr", "Commander Kastil"],
            correctAnswer: "Raja di Pusat Kota Managarmr",
            reward: { gold: 50 }
        },
        {
            question: "Apa yang akan terkuras jika kamu berlari menggunakan tombol Shift?",
            options: ["HP", "Hunger", "Stamina"],
            correctAnswer: "Stamina",
            reward: { gold: 50 }
        }
    ],
    'Kota Kecil': [
        {
            question: "Tanaman pangan pokok utama yang menjadi tulang punggung ketahanan pangan Indonesia adalah?",
            options: ["Jagung", "Padi", "Singkong"],
            correctAnswer: "Padi",
            reward: { gold: 80 }
        },
        {
            question: "Sistem irigasi tradisional yang terkenal di Bali untuk mengelola sawah secara komunal disebut?",
            options: ["Terasering", "Subak", "Gotong Royong"],
            correctAnswer: "Subak",
            reward: { gold: 80 }
        },
        {
            question: "Rempah-rempah apa yang membuat Kepulauan Maluku dijuluki 'Spice Islands' oleh bangsa Eropa?",
            options: ["Lada dan Kayu Manis", "Jahe dan Kunyit", "Cengkeh dan Pala"],
            correctAnswer: "Cengkeh dan Pala",
            reward: { gold: 80 }
        }
    ],
    'Markas Tungtungtung Sahur': [
        {
            question: "Pada tahun berapa terjadi Perang Diponegoro yang berlangsung selama 5 tahun?",
            options: ["1825-1830", "1815-1820", "1835-1840"],
            correctAnswer: "1825-1830",
            reward: { gold: 100 }
        },
        {
            question: "Siapa pemimpin perlawanan rakyat Aceh melawan Belanda yang dikenal dengan sebutan 'Singa Aceh'?",
            options: ["Cut Nyak Dien", "Teuku Umar", "Panglima Polim"],
            correctAnswer: "Teuku Umar",
            reward: { gold: 100 }
        },
        {
            question: "Perang Padri terjadi di daerah mana?",
            options: ["Sumatra Barat", "Sumatra Utara", "Sumatra Selatan"],
            correctAnswer: "Sumatra Barat",
            reward: { gold: 100 }
        }
    ],
    'Perkemahan Bandit': [
        {
            question: "Monster seperti yang dirumorkan di Goa Monster Ambadala Crocodila memiliki serangan yang kuat. Bagaimana cara terbaik melawannya?",
            options: ["Serang terus menerus", "Memiliki pertahanan yang kuat", "Gunakan sihir api"],
            correctAnswer: "Memiliki pertahanan yang kuat",
            reward: { gold: 90 }
        },
        {
            question: "Orc dikenal memiliki regenerasi yang cepat. Strategi apa yang efektif untuk mengalahkannya?",
            options: ["Menghindar sampai lelah", "Fokus bertahan", "Memiliki kekuatan serangan yang kuat"],
            correctAnswer: "Memiliki kekuatan serangan yang kuat",
            reward: { gold: 90 }
        },
        {
            question: "Bandit sangat lincah dan sulit diserang. Apa kunci untuk mendaratkan serangan pada mereka?",
            options: ["Kecepatan serangan yang tinggi", "Serangan area luas", "Menggunakan jebakan"],
            correctAnswer: "Kecepatan serangan yang tinggi",
            reward: { gold: 90 }
        }
    ],
    'Pusat Kota Managarmr': [
        {
            question: "Kerajaan maritim terbesar di Nusantara yang berpusat di Palembang adalah?",
            options: ["Majapahit", "Sriwijaya", "Mataram Kuno"],
            correctAnswer: "Sriwijaya",
            reward: { gold: 150 }
        },
        {
            question: "Siapa raja paling terkenal dari Kerajaan Majapahit yang berhasil menyatukan Nusantara?",
            options: ["Hayam Wuruk", "Gajah Mada", "Raden Wijaya"],
            correctAnswer: "Hayam Wuruk",
            reward: { gold: 150 }
        },
        {
            question: "Candi Borobudur merupakan peninggalan monumental dari kerajaan?",
            options: ["Singasari", "Kediri", "Mataram Kuno (Syailendra)"],
            correctAnswer: "Mataram Kuno (Syailendra)",
            reward: { gold: 150 }
        }
    ],
    'Desa Uwu': [
        {
            question: "Peristiwa pembunuhan massal terhadap orang-orang yang dituduh komunis terjadi setelah insiden G30S pada tahun?",
            options: ["1945-1949", "1965-1966", "1998-1999"],
            correctAnswer: "1965-1966",
            reward: { gold: 75 }
        },
        {
            question: "Insiden penembakan terhadap pengunjuk rasa di depan pelabuhan Tanjung Priok yang menewaskan puluhan orang terjadi pada tahun?",
            options: ["1984", "1974", "1994"],
            correctAnswer: "1984",
            reward: { gold: 75 }
        },
        {
            question: "Penembakan terhadap mahasiswa saat demonstrasi menuntut reformasi di depan Universitas Trisakti terjadi pada tahun?",
            options: ["1990", "1998", "2001"],
            correctAnswer: "1998",
            reward: { gold: 75 }
        }
    ],
    'Desa Poke': [
        {
            question: "Tradisi lompat batu 'Fahombo' yang menguji kedewasaan pria berasal dari suku apa di Pulau Nias?",
            options: ["Suku Batak", "Suku Nias", "Suku Mentawai"],
            correctAnswer: "Suku Nias",
            reward: { gold: 60 }
        },
        {
            question: "Upacara pembakaran jenazah yang megah dan menjadi daya tarik wisata budaya di Bali dikenal dengan nama?",
            options: ["Rambu Solo'", "Ngaben", "Kasada"],
            correctAnswer: "Ngaben",
            reward: { gold: 60 }
        },
        {
            question: "Rumah adat dengan atap melengkung seperti perahu yang menjadi ciri khas suku Toraja di Sulawesi Selatan disebut?",
            options: ["Rumah Gadang", "Rumah Joglo", "Tongkonan"],
            correctAnswer: "Tongkonan",
            reward: { gold: 60 }
        }
    ],
    'Kastil Kerajaan': [
        {
            question: "Kapan proklamasi kemerdekaan Indonesia dibacakan?",
            options: ["17 Agustus 1945", "28 Oktober 1928", "1 Juni 1945"],
            correctAnswer: "17 Agustus 1945",
            reward: { gold: 120 }
        },
        {
            question: "Pada Olimpiade Barcelona 1992, cabang olahraga apa yang menyumbangkan medali emas pertama bagi Indonesia?",
            options: ["Angkat Besi", "Panahan", "Bulu Tangkis"],
            correctAnswer: "Bulu Tangkis",
            reward: { gold: 120 }
        },
        {
            question: "Seni pertunjukan wayang kulit Indonesia diakui oleh UNESCO sebagai warisan budaya takbenda dunia pada tahun?",
            options: ["2003", "2008", "1999"],
            correctAnswer: "2003",
            reward: { gold: 120 }
        }
    ]
};

const travelDestinations = {
    'Pusat Kota Managarmr': { x: 1600, y: 1100, cost: 25 },
    'Kastil Kerajaan': { x: 1250, y: 790, cost: 50 },
    'Desa Uwu': { x: 440, y: 870, cost: 125 },
    'Kota Willburg': { x: 540, y: 650, cost: 150 }
};

function showCharacterStats() {
    const locationPanels = document.getElementById('location-panels');
    locationPanels.innerHTML = '';
    
    const statsPanel = document.createElement('div');
    statsPanel.className = 'location-panel';
    statsPanel.dataset.location = 'Character Stats';
    
    let specialTraitDesc = '';
    let characterClassName = '';
    
    switch(player.characterClass) {
        case 0: 
            characterClassName = 'Mage';
            specialTraitDesc = 'Magic studies grant +25 HP points';
            break;
        case 1: 
            characterClassName = 'Mercenary';
            specialTraitDesc = 'Combat training grants +15% damage resistance';
            break;
        case 2: 
            characterClassName = 'Ranger';
            specialTraitDesc = 'Wilderness skills grant +10% movement speed';
            break;
        case 3: 
            characterClassName = 'Soldier';
            specialTraitDesc = 'Military training grants +20% stamina regeneration';
            break;
        default: 
            characterClassName = 'Unknown';
            specialTraitDesc = 'No special trait';
    }
    
    const characterSprite = document.createElement('div');
    characterSprite.className = 'character-sprite';
    characterSprite.id = 'stats-character-sprite';
    
    statsPanel.innerHTML = `
        <h3>Character Stats</h3>
        <div class="stats-content">
            <div class="character-info">
                <h4>${player.name}</h4>
                <div class="character-sprite-container">
                    ${characterSprite.outerHTML}
                </div>
                <p class="character-class">Class: ${characterClassName}</p>
            </div>
            <div class="character-stats">
                <div class="stat-row">
                    <span class="stat-label">HP:</span>
                    <div class="stat-bar">
                        <div class="stat-fill hp-fill" style="width: ${(player.hp / player.maxHp) * 100}%"></div>
                    </div>
                    <span class="stat-value">${Math.floor(player.hp)}/${player.maxHp}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Hunger:</span>
                    <div class="stat-bar">
                        <div class="stat-fill hunger-fill" style="width: ${(player.hunger / player.maxHunger) * 100}%"></div>
                    </div>
                    <span class="stat-value">${Math.floor(player.hunger)}/${player.maxHunger}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Stamina:</span>
                    <div class="stat-bar">
                        <div class="stat-fill stamina-fill" style="width: ${(player.stamina / player.maxStamina) * 100}%"></div>
                    </div>
                    <span class="stat-value">${Math.floor(player.stamina)}/${player.maxStamina}</span>
                </div>
                <div class="stat-row no-bar">
                    <span class="stat-label">Speed:</span>
                    <span class="stat-value">Normal</span>
                </div>
                <div class="stat-row no-bar">
                    <span class="stat-label">Attack:</span>
                    <span class="stat-value">${player.damage}</span>
                </div>
                <div class="stat-row no-bar">
                    <span class="stat-label">Armor:</span>
                    <span class="stat-value">${player.armor}</span>
                </div>
                <div class="special-trait">
                    <h4>Special Trait</h4>
                    <p>${specialTraitDesc}</p>
                </div>
                <div class="equipment-section">
                    <h4>Equipment</h4>
                    
                    <div class="equipment-category">
                        <h5 class="category-title">Armor</h5>
                        ${player.armorName ? 
                            `<div class="equipment-item">
                                <span class="item-name">${player.armorName}</span>
                                <span class="item-desc">${player.armorDescription || ''}</span>
                            </div>` : 
                            '<p class="no-items">Tidak ada armor</p>'
                        }
                    </div>
                    
                    <div class="equipment-category">
                        <h5 class="category-title">Senjata</h5>
                        ${player.weaponName ? 
                            `<div class="equipment-item">
                                <span class="item-name">${player.weaponName}</span>
                                <span class="item-desc">${player.weaponDescription || ''}</span>
                            </div>` : 
                            '<p class="no-items">Tidak ada senjata</p>'
                        }
                    </div>
                    
                    <div class="equipment-category">
                        <h5 class="category-title">Ramuan</h5>
                        ${player.potionName ? 
                            `<div class="equipment-item">
                                <span class="item-name">${player.potionName}</span>
                                <span class="item-desc">${player.potionDescription || ''}</span>
                            </div>` : 
                            '<p class="no-items">Tidak ada ramuan</p>'
                        }
                    </div>
                </div>
                </div>
            </div>
        </div>
        <button class="close-btn" onclick="closeStatsPanel()">Close</button>
    `;
    
    locationPanels.appendChild(statsPanel);
    
    animateCharacterSprite();
}

function animateCharacterSprite() {
    const spriteElement = document.getElementById('stats-character-sprite');
    if (!spriteElement) return;
    
    let currentFrame = 0;
    const totalFrames = player.sprites.idle.length;
    
    spriteElement.style.backgroundImage = `url(${player.sprites.idle[0].src})`;
    spriteElement.style.backgroundSize = 'contain';
    spriteElement.style.backgroundRepeat = 'no-repeat';
    spriteElement.style.backgroundPosition = 'center';
    spriteElement.style.width = '100px';
    spriteElement.style.height = '100px';
    
    const animInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % totalFrames;
        spriteElement.style.backgroundImage = `url(${player.sprites.idle[currentFrame].src})`;
        
        updateStatsDisplay();
    }, 150);
    
    window.statsAnimationInterval = animInterval;
}

function updateStatsDisplay() {
    const hpBar = document.querySelector('.stat-row:nth-child(1) .stat-fill');
    const hpValue = document.querySelector('.stat-row:nth-child(1) .stat-value');
    const hungerBar = document.querySelector('.stat-row:nth-child(2) .stat-fill');
    const hungerValue = document.querySelector('.stat-row:nth-child(2) .stat-value');
    const staminaBar = document.querySelector('.stat-row:nth-child(3) .stat-fill');
    const staminaValue = document.querySelector('.stat-row:nth-child(3) .stat-value');
    
    if (hpBar && hpValue) {
        hpBar.style.width = `${(player.hp / player.maxHp) * 100}%`;
        hpValue.textContent = `${Math.floor(player.hp)}/${player.maxHp}`;
    }
    
    if (hungerBar && hungerValue) {
        hungerBar.style.width = `${(player.hunger / player.maxHunger) * 100}%`;
        hungerValue.textContent = `${Math.floor(player.hunger)}/${player.maxHunger}`;
    }
    
    if (staminaBar && staminaValue) {
        staminaBar.style.width = `${(player.stamina / player.maxStamina) * 100}%`;
        staminaValue.textContent = `${Math.floor(player.stamina)}/${player.maxStamina}`;
    }
}

function closeStatsPanel() {
    document.getElementById('location-panels').innerHTML = '';
    
    if (window.statsAnimationInterval) {
        clearInterval(window.statsAnimationInterval);
        window.statsAnimationInterval = null;
    }
}

function handleShopInteraction(locationType, locationName) {
    const panel = document.querySelector(`[data-location="${locationName}"]`);
    if (!panel) return;
    
    const location = locationData[locationName];
    if (!location) return;
    
    switch(locationType) {
        case 'armor_shop':
            const armorItems = location.armorItems || [];
            
            panel.innerHTML = `
                <h3>${locationName} - Toko Armor</h3>
                <div class="shop-section">
                    <h4>Armor yang Tersedia:</h4>
                    ${armorItems.map(armor => `
                        <div class="shop-item">
                            <span class="item-name">${armor.name}</span>
                            <span class="item-price">${armor.price} Gold</span>
                            <span class="item-stats">+${armor.maxHpBonus} Max HP</span>
                            <span class="item-desc">${armor.description}</span>
                            <button onclick="buyArmor('${locationName}', '${armor.name}')">Beli</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;
            
        case 'weapon_shop':
            const weaponItems = location.weaponItems || [];
            
            panel.innerHTML = `
                <h3>${locationName} - Toko Senjata</h3>
                <div class="shop-section">
                    <h4>Senjata yang Tersedia:</h4>
                    ${weaponItems.map(weapon => `
                        <div class="shop-item">
                            <span class="item-name">${weapon.name}</span>
                            <span class="item-price">${weapon.price} Gold</span>
                            <span class="item-stats">+${weapon.damageBonus} Damage</span>
                            <span class="item-desc">${weapon.description}</span>
                            <button onclick="buyWeapon('${locationName}', '${weapon.name}')">Beli</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;
            
        case 'potion_shop':
            const potionItems = location.potionItems || [];
            
            panel.innerHTML = `
                <h3>${locationName} - Toko Ramuan</h3>
                <div class="shop-section">
                    <h4>Ramuan yang Tersedia:</h4>
                    ${potionItems.map(potion => `
                        <div class="shop-item">
                            <span class="item-name">${potion.name}</span>
                            <span class="item-price">${potion.price} Gold</span>
                            <span class="item-desc">${potion.effect}</span>
                            <button onclick="buyPotion('${locationName}', '${potion.name}')">Beli</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;
    }
}

function handleFastTravel(destinationName, cost, x, y) {
    if (player.gold < cost) {
        alert(`Gold tidak cukup untuk perjalanan ke ${destinationName}. Dibutuhkan ${cost} Gold.`);
        return;
    }
    
    player.gold -= cost;
    
    player.x = x;
    player.y = y;
    
    centerCameraOnPlayer();
    
    updateUI();
    
    closeInteractionPopup();
    
    alert(`Anda telah berhasil berpindah ke ${destinationName}. Biaya perjalanan: ${cost} Gold.`);
    
    const hungerLoss = Math.floor(player.maxHunger * 0.1);
    player.hunger = Math.max(0, player.hunger - hungerLoss);
    
    updateUI();
}

function handleMapTransfer(destinationLocationName) {
    const destination = travelDestinations[destinationLocationName];
    if (!destination) {
        console.error(`Koordinat tujuan tidak ditemukan untuk: ${destinationLocationName}`);
        alert('Gagal melakukan perjalanan: Tujuan tidak valid.');
        return;
    }

    const travelCost = destination.cost;

    if (player.gold >= travelCost) {
        player.gold -= travelCost;
        console.log(`Biaya perjalanan ${travelCost} Gold dibayarkan.`);

        console.log(`Melakukan perjalanan ke ${destinationLocationName} di koordinat x:${destination.x}, y:${destination.y}`);
        player.x = destination.x;
        player.y = destination.y;

        player.x = Math.max(0, Math.min(player.x, worldWidth - player.width));
        player.y = Math.max(0, Math.min(player.y, worldHeight - player.height));

        centerCameraOnPlayer();
        closeLocationPanel('Pelabuhan Indah Kapal');
        updateUI();
        alert(`Berhasil melakukan perjalanan ke ${destinationLocationName}!\nBiaya: ${travelCost} Gold.`);

        currentLocationName = getLocationName(player.x + player.width / 2, player.y + player.height);
        previousLocationName = currentLocationName;
        locationTextAnimProgress = 0;
        if (currentLocationName) {
             locationTextAnimStartTime = performance.now();
        }

    } else {
        console.log(`Gagal melakukan perjalanan ke ${destinationLocationName}: Gold tidak cukup (${player.gold}/${travelCost}).`);
        alert(`Gagal melakukan perjalanan: Gold tidak cukup. Anda memerlukan ${travelCost} Gold, tetapi hanya memiliki ${player.gold} Gold.`);
    }
}

function showTicTacToePuzzle() {
    const overlay = document.getElementById('tictactoe-puzzle-overlay');
    const boardElement = document.getElementById('tictactoe-board');
    if (!overlay || !boardElement) return;

    const boardState = ['X', 'O', 'X', 'O', 'X', '', 'O', '', 'O'];
    const winningMoveIndex = 7;

    boardElement.innerHTML = '';
    boardState.forEach((cell, index) => {
        const cellElement = document.createElement('div');
        cellElement.classList.add('tictactoe-cell');
        cellElement.textContent = cell;
        if (cell === '') {
            cellElement.classList.add('empty');
            cellElement.onclick = () => handleTicTacToeMove(index, winningMoveIndex);
        } else {
             cellElement.classList.add(cell);
        }
        boardElement.appendChild(cellElement);
    });

    overlay.classList.add('visible');
    isGamePaused = true;
    console.log("Tic Tac Toe Puzzle opened. Game Paused.");
    if (bgmPlaying) backgroundMusic.pause();
}

function handleTicTacToeMove(selectedIndex, winningIndex) {
    const overlay = document.getElementById('tictactoe-puzzle-overlay');
    if (!overlay) return;

    ruinsPuzzleAttempted = true;

    if (selectedIndex === winningIndex) {
        const hpReward = Math.floor(player.maxHp * 0.25);
        const hungerReward = Math.floor(player.maxHunger * 0.25);
        player.gold += 100;
        player.hp = Math.min(player.maxHp, player.hp + hpReward);
        player.hunger = Math.min(player.maxHunger, player.hunger + hungerReward);

        alert("Benar! Kamu menyelesaikan puzzle. Sebuah formasi batu bergeser, mengungkapkan harta karun!\n+100 Gold, +" + hpReward + " HP, +" + hungerReward + " Hunger");

    } else {
        const hpPenalty = Math.floor(player.hp * 0.70);
        const hungerPenalty = Math.floor(player.hunger * 0.70);
        player.hp = Math.max(0, player.hp - hpPenalty);
        player.hunger = Math.max(0, player.hunger - hungerPenalty);

        alert("Salah! Formasi batu runtuh menimpamu!\n-" + hpPenalty + " HP, -" + hungerPenalty + " Hunger");
        if (player.hp <= 0) {
        }
    }

    updateUI();
    overlay.classList.remove('visible');
    isGamePaused = false;
    console.log("Tic Tac Toe Puzzle closed. Game Resumed.");
     if (userInteracted && !backgroundMusic.paused && bgmPlaying) {
         backgroundMusic.play().catch(e => console.error("Gagal melanjutkan BGM setelah puzzle:", e));
     }
}

function setupDPadListeners() {
    if (!dpadUp || !dpadDown || !dpadLeft || !dpadRight || !dpadE || !dpadM || !dpadPause || !dpadR) {
        console.warn("Satu atau lebih elemen pad tidak ditemukan, melewati listeners.");
        return;
    }

    const handlePress = (key) => {
        if (!isMapMode && !isGamePaused && !isInteractionPopupOpen && !isSaveLoadMenuOpen) {
            keys[key] = true;
            player.targetX = null;
            player.targetY = null;
        }
    };

    const handleRelease = (key) => {
        keys[key] = false;
    };

    dpadUp.addEventListener('mousedown', () => handlePress('w'));
    dpadUp.addEventListener('mouseup', () => handleRelease('w'));
    dpadUp.addEventListener('mouseleave', () => handleRelease('w'));
    dpadUp.addEventListener('touchstart', (e) => { e.preventDefault(); handlePress('w'); }, { passive: false });
    dpadUp.addEventListener('touchend', (e) => { e.preventDefault(); handleRelease('w'); }, { passive: false });
    dpadUp.addEventListener('touchcancel', (e) => { e.preventDefault(); handleRelease('w'); }, { passive: false });

    dpadDown.addEventListener('mousedown', () => handlePress('s'));
    dpadDown.addEventListener('mouseup', () => handleRelease('s'));
    dpadDown.addEventListener('mouseleave', () => handleRelease('s'));
    dpadDown.addEventListener('touchstart', (e) => { e.preventDefault(); handlePress('s'); }, { passive: false });
    dpadDown.addEventListener('touchend', (e) => { e.preventDefault(); handleRelease('s'); }, { passive: false });
    dpadDown.addEventListener('touchcancel', (e) => { e.preventDefault(); handleRelease('s'); }, { passive: false });

    dpadLeft.addEventListener('mousedown', () => handlePress('a'));
    dpadLeft.addEventListener('mouseup', () => handleRelease('a'));
    dpadLeft.addEventListener('mouseleave', () => handleRelease('a'));
    dpadLeft.addEventListener('touchstart', (e) => { e.preventDefault(); handlePress('a'); }, { passive: false });
    dpadLeft.addEventListener('touchend', (e) => { e.preventDefault(); handleRelease('a'); }, { passive: false });
    dpadLeft.addEventListener('touchcancel', (e) => { e.preventDefault(); handleRelease('a'); }, { passive: false });

    dpadRight.addEventListener('mousedown', () => handlePress('d'));
    dpadRight.addEventListener('mouseup', () => handleRelease('d'));
    dpadRight.addEventListener('mouseleave', () => handleRelease('d'));
    dpadRight.addEventListener('touchstart', (e) => { e.preventDefault(); handlePress('d'); }, { passive: false });
    dpadRight.addEventListener('touchend', (e) => { e.preventDefault(); handleRelease('d'); }, { passive: false });
    dpadRight.addEventListener('touchcancel', (e) => { e.preventDefault(); handleRelease('d'); }, { passive: false });

    console.log("Listeners D-Pad movement berhasil diatur.");
}

if (dpadE) {
    dpadE.addEventListener('click', () => {
        if (!isMapMode && !isGamePaused && !isSaveLoadMenuOpen) {
             if (currentLocationName) {
                if (isInteractionPopupOpen) {
                    closeInteractionPopup();
                } else {
                    openInteractionPopup(currentLocationName);
                }
             }
        } else if (isInteractionPopupOpen) {
            closeInteractionPopup();
        }
    });
} else { console.warn("Tombol D-Pad 'E' tidak ditemukan."); }

if (dpadM) {
    dpadM.addEventListener('click', () => {
        const currentTime = performance.now();
        if (currentTime - lastMapToggleTime >= MAP_TOGGLE_COOLDOWN) {
            lastMapToggleTime = currentTime;

            if (isInteractionPopupOpen) closeInteractionPopup();
            if (isSaveLoadMenuOpen) hideSaveLoadMenu();

            toggleMap();
        }
    });
} else { console.warn("Tombol D-Pad 'M' tidak ditemukan."); }

if (dpadPause) {
    dpadPause.addEventListener('click', () => {
        if (isSaveLoadMenuOpen) {
             hideSaveLoadMenu();
        } else if (isGamePaused) {
            continueGame();
        } else if (isInteractionPopupOpen) {
             closeInteractionPopup();
             openPauseMenu();
        } else if (!isMapMode) {
            openPauseMenu();
        }
    });
} else { console.warn("Tombol D-Pad 'Pause' tidak ditemukan."); }
if (dpadR) {
    function updateRunButtonAppearance() {
        if (runModeActive) {
            dpadR.classList.add('active-toggle');
            dpadR.style.backgroundColor = 'rgba(255, 160, 50, 0.8)';
        } else {
            dpadR.classList.remove('active-toggle');
            dpadR.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        }
    }
    
    dpadR.addEventListener('click', () => {
        if (!isMapMode && !isGamePaused && !isInteractionPopupOpen && !isSaveLoadMenuOpen) {
            runModeActive = !runModeActive;
            player.isRunning = runModeActive;

            if (!runModeActive) {
                keys.shift = false;
            }

            updateRunButtonAppearance();
            
            console.log(`Run mode ${runModeActive ? 'activated' : 'deactivated'}`);
        }
    });
    
    dpadR.addEventListener('touchstart', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || isMapMode || isGamePaused || isInteractionPopupOpen || isSaveLoadMenuOpen) {
            if (runModeActive) {
                runModeActive = false;
                player.isRunning = false;
                updateRunButtonAppearance();
            }
        }
    });
    
    updateRunButtonAppearance();
} else { 
    console.warn("Tombol Run (R) tidak ditemukan."); 
}

const relicsGivenByLocation = new Set();

function handleGameOver() {
    const gameOverPopup = document.getElementById('game-over-popup');
    if (gameOverPopup) {
        gameOverPopup.style.display = 'flex';
        pauseGame();
    }
}

function restartGame() {
    player.hp = player.maxHp;
    player.stamina = player.maxStamina;
    player.hunger = player.maxHunger;
    player.gold = 0;
    player.relicsFound = new Set();

    isGamePaused = false;
    isGameOver = false;
    isInteractionPopupOpen = false;
    isSaveLoadMenuOpen = false;
    
    const locationPanels = document.querySelectorAll('[data-location]');
    locationPanels.forEach(panel => {
        panel.style.display = 'none';
    });
    
    hideGameOverPopup();
    
    findSpawnPointsAndSetPlayer();
    centerCameraOnPlayer();
    
    player.targetX = null;
    player.targetY = null;
    player.dx = 0;
    player.dy = 0;
    player.moving = false;
    player.isRunning = false;
    player.animationState = 'idle';
    
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    keys.shift = false;
    
    updateUI();
    
    if (userInteracted && bgmPlaying) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(e => console.error("Gagal memulai BGM setelah restart:", e));
    }
    
    console.log("Game berhasil di-restart.");
}

function showGameOverPopup() {
    const popup = document.getElementById('game-over-popup');
    if (popup) {
        popup.style.display = 'flex';
        isGamePaused = true;
        if (bgmPlaying) {
            backgroundMusic.pause();
        }
    }
}

function hideGameOverPopup() {
    const popup = document.getElementById('game-over-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

function handleReturnRelics() {
    if (player.relicsFound.size >= 8) {
        showGameCompletionPopup();
    } else {
        alert(`Kamu baru menemukan ${player.relicsFound.size} dari 8 relik. Temukan semua relik terlebih dahulu untuk menyelesaikan petualangan!`);
    }
}

function showGameCompletionPopup() {
    const popup = document.getElementById('game-completion-popup');
    if (popup) {
        popup.style.display = 'flex';
        isGamePaused = true;
        
        const restartBtn = document.getElementById('restart-game-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', function() {
                hideGameCompletionPopup();
                restartGame();
            });
        }
    }
}

function hideGameCompletionPopup() {
    const popup = document.getElementById('game-completion-popup');
    if (popup) {
        popup.style.display = 'none';
    }
}

function restartGame() {
    player.hp = player.maxHp;
    player.stamina = player.maxStamina;
    player.hunger = player.maxHunger;
    player.gold = 0;
    player.relicsFound = new Set();

    isGamePaused = false;
    isGameOver = false;
    isInteractionPopupOpen = false;
    isSaveLoadMenuOpen = false;
    
    const locationPanels = document.querySelectorAll('[data-location]');
    locationPanels.forEach(panel => {
        panel.style.display = 'none';
    });
    
    hideGameOverPopup();
    
    findSpawnPointsAndSetPlayer();
    centerCameraOnPlayer();
    
    player.targetX = null;
    player.targetY = null;
    player.dx = 0;
    player.dy = 0;
    player.moving = false;
    player.isRunning = false;
    player.animationState = 'idle';
    
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    keys.shift = false;
    
    updateUI();
    
    if (userInteracted && bgmPlaying) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(e => console.error("Gagal memulai BGM setelah restart:", e));
    }
    
    console.log("Game berhasil di-restart.");
}

document.addEventListener('DOMContentLoaded', function() {
    const tryAgainButton = document.querySelector('#game-over-popup button');
    if (tryAgainButton) {
        tryAgainButton.addEventListener('click', restartGame);
    }
});

const gameTime = {
    day: 1,
    hour: 6,
    minute: 0,
    timeScale: 1,
    lastUpdate: 0
};

function playHoverSound() {
    hoverSound.currentTime = 0;
    hoverSound.play().catch(error => {
        console.error("Error playing hover sound:", error);
    });
}

function addHoverSoundToAllElements() {
    const pauseMenuItems = document.querySelectorAll('#pause-options li');
    pauseMenuItems.forEach(item => {
        item.addEventListener('mouseenter', playHoverSound);
    });
    
    const volumeSliders = document.querySelectorAll('.volume-slider input');
    volumeSliders.forEach(slider => {
        slider.addEventListener('mouseenter', playHoverSound);
    });
    
    const saveLoadButtons = document.querySelectorAll('#saveload-content button');
    saveLoadButtons.forEach(button => {
        button.addEventListener('mouseenter', playHoverSound);
    });
    
    const dpadButtons = document.querySelectorAll('.dpad-button');
    dpadButtons.forEach(button => {
        button.addEventListener('mouseenter', playHoverSound);
    });
    
    document.addEventListener('click', function() {
        const saveSlots = document.querySelectorAll('#save-slots-list li:not(.no-saves)');
        saveSlots.forEach(slot => {
            slot.addEventListener('mouseenter', playHoverSound);
        });
        
        const locationOptions = document.querySelectorAll('.location-options li');
        locationOptions.forEach(option => {
            option.addEventListener('mouseenter', playHoverSound);
        });
    });
    
    const closeButtons = document.querySelectorAll('.close-btn, .closed-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('mouseenter', playHoverSound);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initializeVolumeControls();
    
    addHoverSoundToAllElements();
    
    setupDPadListeners();
    
    loadPlayerDataFromMainMenu();
    
    function startGame() {
        console.log("Starting game...");
        
        if (!gameLoopRunning) {
            setupDPadListeners();
            gameLoopRunning = true;
            gameLoop();
        }
        
        centerCameraOnPlayer();
        
        updateUI();
        
        tryStartBackgroundMusic();
    }

    startGame();
    
    document.getElementById('dpad-stats').addEventListener('click', function() {
        showCharacterStats();
    });
    
    document.addEventListener('mouseover', function(e) {
        const interactiveClasses = [
            'dpad-button', 'popup-options li', 'volume-slider input', 
            'close-btn', 'save-slots-list li', 'location-options li'
        ];
        
        let target = e.target;
        let isInteractive = false;
        
        while (target && target !== document) {
            for (const className of interactiveClasses) {
                if (target.matches(className) || target.classList.contains(className.split(' ')[0])) {
                    isInteractive = true;
                    break;
                }
            }
            if (isInteractive) break;
            target = target.parentElement;
        }
        
        if (isInteractive) {
            playHoverSound();
        }
    }, { passive: true });
});

function openPauseMenu() {
    const pauseMenu = document.getElementById('pause-menu');
    pauseMenu.classList.add('visible');
    playPauseSound();
    
    setTimeout(addHoverSoundToAllElements, 100);
}

function showSaveLoadMenu(mode) {
    const saveloadMenu = document.getElementById('saveload-menu');
    const saveloadTitle = document.getElementById('saveload-title');
    
    saveloadTitle.textContent = mode === 'save' ? 'Simpan Game' : 'Muat Game';
    
    document.getElementById('saveload-new').style.display = mode === 'save' ? 'block' : 'none';
    
    populateSaveLoadList(mode);
    
    saveloadMenu.classList.add('visible');
    
    setTimeout(addHoverSoundToAllElements, 100);
}

const relicData = [
    {
        id: 1,
        name: "Celurit",
        image: "assets/relic/Celurit.png",
        description: "The Celurit (also known as clurit) is a traditional curved blade weapon originating from Madura, an island in East Java, Indonesia. It is often associated with the Madurese people and holds both cultural and symbolic significance."
    },
    {
        id: 2,
        name: "Gambus",
        image: "assets/relic/Gambus.png",
        description: "The Gambus is a traditional stringed instrument with roots in Middle Eastern music, but over centuries, it has evolved into a unique cultural expression in Indonesia and Malaysia — especially in regions with strong Islamic influence."
    },
    {
        id: 3,
        name: "Keris",
        image: "assets/relic/Keris.png",
        description: "The Keris is a traditional asymmetrical dagger from Indonesia, recognized for its distinctive wavy blade and deep spiritual symbolism. It is a revered cultural artifact with roots in ancient Javanese traditions."
    },
    {
        id: 4,
        name: "Kujang",
        image: "assets/relic/Kujang.png",
        description: "The Kujang is a traditional weapon from West Java, Indonesia, especially associated with the Sundanese people. With its unique, curved blade resembling a buffalo horn or sickle, the Kujang serves not only as a weapon but also as a symbol of wisdom, strength, and spiritual power."
    },
    {
        id: 5,
        name: "Parang",
        image: "assets/relic/Parang.png",
        description: "The Parang is a traditional bladed tool and weapon widely used across Indonesia, Malaysia, and the Philippines. In Indonesia, it's especially associated with rural and tribal communities, where it plays a vital role in daily life."
    },
    {
        id: 6,
        name: "Topeng Barong",
        image: "assets/relic/Topeng-barong.png",
        description: "The Topeng Barong is a traditional Balinese mask representing Barong, the king of spirits and a symbol of goodness in Balinese mythology. Barong is often depicted as a lion-like creature with a vibrant, elaborately decorated mask used in dramatic performances known as the Barong dance."
    },
    {
        id: 7,
        name: "Topeng Ondel-Ondel",
        image: "assets/relic/topeng-ondel.png",
        description: "Ondel-Ondel is a large puppet figure and a key part of Betawi (native Jakarta) cultural performances. The Topeng (mask) on Ondel-Ondel represents protective spirits, traditionally used to ward off evil and bring blessings to the community."
    },
    {
        id: 8,
        name: "Wayang Gunungan",
        image: "assets/relic/Wayang-gunungan.png",
        description: "The Gunungan is a symbolic element in Wayang (shadow puppet) performances from Indonesia, especially Java and Bali. It represents the beginning and end of a story, and serves as a divider between scenes or worlds — the spiritual and the physical."
    }
];

function showRelicDiscoveryPopup(relicId) {
    const relic = relicData.find(r => r.id === relicId);
    if (!relic) return;
    
    const relicPopup = document.getElementById('relic-discovery-popup');
    const relicImage = document.getElementById('discovered-relic-image');
    const relicName = document.getElementById('discovered-relic-name');
    const relicDescription = document.getElementById('discovered-relic-description');
    const closeButton = document.getElementById('close-relic-discovery');
    
    relicImage.src = relic.image;
    relicName.textContent = relic.name;
    relicDescription.textContent = relic.description;
    
    relicPopup.style.display = 'flex';
    setTimeout(() => {
        relicPopup.classList.add('visible');
    }, 10);
    
    if (playUISound) {
        playUISound('pauseSound');
    }
    
    closeButton.onclick = () => {
        closeRelicDiscoveryPopup();
    };
}

function closeRelicDiscoveryPopup() {
    const relicPopup = document.getElementById('relic-discovery-popup');
    relicPopup.classList.remove('visible');
    setTimeout(() => {
        relicPopup.style.display = 'none';
    }, 400);
    
    if (playUISound) {
        playUISound('unpauseSound');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const closeRelicPopupBtn = document.getElementById('close-relic-discovery');
    if (closeRelicPopupBtn) {
        closeRelicPopupBtn.addEventListener('click', closeRelicDiscoveryPopup);
    }
    
    const relicPopupBtn = document.getElementById('close-relic-discovery');
    if (relicPopupBtn && addHoverSoundToAllElements) {
        relicPopupBtn.addEventListener('mouseenter', playHoverSound);
    }
});

function buyPotion(locationName, potionName) {
    const location = locationData[locationName];
    if (!location || !location.potionItems) {
        console.error("Location or potionItems not found:", locationName);
        return;
    }
    
    const potion = location.potionItems.find(p => p.name === potionName);
    if (!potion) {
        console.error("Potion not found:", potionName);
        return;
    }
    
    if (player.gold >= potion.price) {
        player.gold -= potion.price;
        
        if (potion.hp) {
            player.hp = Math.min(player.maxHp, player.hp + potion.hp);
        }
        
        if (potion.hunger) {
            player.hunger = Math.min(player.maxHunger, player.hunger + potion.hunger);
        }
        
        if (potion.staminaBonus) {
            player.maxStamina += potion.staminaBonus;
            player.stamina += potion.staminaBonus;
        }
        
        updateUI();
        
        alert(`Berhasil membeli ${potionName}! ${potion.effect}`);
        
        updatePanelContent(locationName, 'beli_ramuan');
    } else {
        alert('Gold tidak cukup!');
    }
}
