const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// -- Pengaturan Awal --
canvas.width = 800; // Lebar viewport
canvas.height = 600; // Tinggi viewport

// -- Dimensi Dunia (akan diisi saat peta dimuat) --
let worldWidth = canvas.width;
let worldHeight = canvas.height;

// -- Karakter --
// PERKECIL ukuran karakter
const charWidth = 32; // Dari 32
const charHeight = 42; // Dari 48

const player = {
    x: null, // Posisi awal akan di-set dari spawn point
    y: null,
    width: charWidth,
    height: charHeight,
    speed: 0.75,
    runSpeedMultiplier: 1.8,
    dx: 0,
    dy: 0,
    targetX: null,
    targetY: null,
    moving: false,
    isRunning: false,
    direction: 'down',
    animationState: 'idle',
    sprites: { idle: [], walk: [], run: [], sit: [] }, // Tambah sit ke sprites
    currentFrameImage: null,
    animFrameIndex: 0,
    animTimer: 0,
    framesPerAnimFrame: 24,
    framesPerRunAnimFrame: 12,
    lastMovementTime: 0, // Tambah timer untuk idle
    IDLE_TO_SIT_TIME: 10000, // 10 detik dalam milidetik

    // --- STATS BARU ---
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    hunger: 100,
    maxHunger: 100,
    gold: 0, // Tambahkan gold juga
    relicsFound: new Set() // Untuk melacak relic (contoh: Set berisi nomor relic 1-8)
};

// --- Konstanta Stat Drain BARU ---
const PASSIVE_HUNGER_DRAIN_RATE = 0.002; // Tingkat pengurangan hunger pasif (sangat lambat)
const HP_DRAIN_RATE_STARVATION = 0.02; // Tingkat pengurangan HP saat kelaparan
const STAMINA_DRAIN_RATE_RUN = 0.4; // Tingkat pengurangan stamina saat lari
const STAMINA_REGEN_RATE = 0.05; // Tingkat regenerasi stamina (dikurangi dari 0.15)

// --- Zoom Level ---
const zoomLevel = 2.0; // Tingkatkan zoom ke 200% (dari 1.25)

// -- Kamera / Viewport --
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
    // Ukuran area DUNIA yang terlihat oleh kamera (DIHITUNG ULANG OTOMATIS)
    viewWidth: canvas.width / zoomLevel,
    viewHeight: canvas.height / zoomLevel,
    deadzoneX: canvas.width / 4,
    deadzoneY: canvas.height / 4,
    initialSetupDone: false
};

// -- Mode Peta --
let isMapMode = false; // Mulai dalam mode gameplay (zoomed-in)

// -- Info Animasi & Pemuatan Aset (Kode ini sebagian besar tetap sama) --
const animFramesConfig = { 
    idle: { count: 8, perDirection: 2 }, 
    walk: { count: 36, perDirection: 9 }, 
    run: { count: 32, perDirection: 8 },
    sit: { count: 4, perDirection: 1 } // Tambah state sit
};
const directionOrder = ['up', 'left', 'down', 'right'];

// --- Offscreen Canvas untuk Analisis Collision Map ---
const collisionOffscreenCanvas = document.createElement('canvas');
let collisionOffscreenCtx = null;
let collisionDataReady = false;

// --- Offscreen Canvas untuk Analisis Movement Speed ---
const movementOffscreenCanvas = document.createElement('canvas');
let movementOffscreenCtx = null;
let movementDataReady = false;

// --- Offscreen Canvas untuk Analisis Lokasi ---
const locationOffscreenCanvas = document.createElement('canvas');
let locationOffscreenCtx = null;
let locationDataReady = false;

// --- Deklarasi Gambar ---
const mapImage = new Image();
const collisionMapImage = new Image();
const movementMapImage = new Image();
const spawnMapImage = new Image();
const locationMapImage = new Image();
const liveLocationMapImage = new Image();
const mapPlayerIconImage = new Image(); // Tambahkan ikon pemain untuk peta

// --- Status Pemuatan Gambar ---
let mapLoaded = false;
let collisionMapLoaded = false;
let movementMapLoaded = false;
let spawnMapLoaded = false;
let locationMapLoaded = false;
let liveLocationMapLoaded = false;
let mapIconLoaded = false; // Tambahkan flag untuk ikon
let allSpritesLoaded = false;

// --- Status Setup Data & Spawn ---
let initialSpawnSet = false;

// --- Variabel Status & Animasi Lokasi ---
let currentLocationName = null;
let previousLocationName = null; // Lacak nama sebelumnya
let locationTextAnimProgress = 0; // Progress animasi (0 = hilang, 1 = penuh)
const locationTextAnimDuration = 350; // Durasi animasi (ms) - cepat
let locationTextAnimStartTime = 0;

// --- Mapping Warna Lokasi ---
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

// Tambahkan flag untuk mencegah multiple game loop start
let gameLoopRunning = false;

// --- Variabel Animasi Bounce ---
const bounceAmplitude = 0.4; // DIKURANGI DRASTIS dari 1.5
const bounceSpeed = 0.004; // Kecepatan bounce tetap sama

// --- Audio ---
const openMapSound = new Audio('assets/sound/openmap.mp3');
const closeMapSound = new Audio('assets/sound/closemap.mp3');
const backgroundMusic = new Audio('assets/sound/bgm.mp3'); // Tambahkan BGM
backgroundMusic.loop = true; // Aktifkan looping
backgroundMusic.volume = 0.5; // Atur volume (0.0 - 1.0), sesuaikan jika perlu
const walkSound = document.getElementById('walkSound');
const runSound = document.getElementById('runSound');

// --- Sound Cooldown Variables ---
let lastWalkSoundTime = 0;
let lastRunSoundTime = 0;
const SOUND_COOLDOWN = 500; // 0.5 second cooldown in milliseconds

// --- Run Cooldown Variables ---
let lastStaminaDepletionTime = 0;
const RUN_COOLDOWN = 2000; // 2 seconds cooldown in milliseconds

// Optional: Error handling
openMapSound.onerror = () => console.error("Gagal memuat assets/sound/openmap.mp3");
closeMapSound.onerror = () => console.error("Gagal memuat assets/sound/closemap.mp3");
backgroundMusic.onerror = () => console.error("Gagal memuat assets/sound/bgm.mp3");

// Flag untuk autoplay setelah interaksi
let userInteracted = false;
let bgmPlaying = false;

// Fungsi untuk mencoba memulai BGM
function tryStartBackgroundMusic() {
    // Hanya mulai jika ada interaksi DAN BGM belum diputar
    if (userInteracted && !bgmPlaying) {
        backgroundMusic.play().then(() => {
            bgmPlaying = true;
            console.log("Background music dimulai.");
        }).catch(error => {
            console.error("Gagal memulai background music:", error);
            // Browser mungkin masih memblokir autoplay, user mungkin perlu klik lagi.
        });
    }
}

// --- Onload Handlers ---
mapImage.onload = () => { mapLoaded = true; if (worldWidth === canvas.width) { worldWidth = mapImage.naturalWidth; worldHeight = mapImage.naturalHeight; console.log(`Dimensi Dunia di-set oleh Peta Visual: ${worldWidth}x${worldHeight}`); } console.log(`Peta visual (${mapImage.src}) dimuat.`); centerCameraOnPlayer(); checkAllAssetsLoaded(); };
collisionMapImage.onload = () => { collisionMapLoaded = true; if (worldWidth === canvas.width) { worldWidth = collisionMapImage.naturalWidth; worldHeight = collisionMapImage.naturalHeight; console.log(`Dimensi Dunia di-set oleh Collision Map: ${worldWidth}x${worldHeight}`); } else if (worldWidth > canvas.width && (worldWidth !== collisionMapImage.naturalWidth || worldHeight !== collisionMapImage.naturalHeight)) { console.warn("PERINGATAN: Ukuran Collision Map berbeda!"); } console.log(`Collision map (${collisionMapImage.src}) dimuat.`); checkAllAssetsLoaded(); };
movementMapImage.onload = () => { movementMapLoaded = true; if (worldWidth === canvas.width) { worldWidth = movementMapImage.naturalWidth; worldHeight = movementMapImage.naturalHeight; console.log(`Dimensi Dunia di-set oleh Movement Map: ${worldWidth}x${worldHeight}`); } else if (worldWidth > canvas.width && (worldWidth !== movementMapImage.naturalWidth || worldHeight !== movementMapImage.naturalHeight)) { console.warn("PERINGATAN: Ukuran Movement Map berbeda!"); } console.log(`Movement map (${movementMapImage.src}) dimuat.`); checkAllAssetsLoaded(); };
spawnMapImage.onload = () => {
    spawnMapLoaded = true;
     // Coba set dimensi dunia jika belum
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
     // Coba set dimensi dunia jika belum
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
    // Coba set dimensi dunia jika belum
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
    checkAllAssetsLoaded(); // Cek lagi jika semua sudah siap
};

// Error handlers
mapImage.onerror = () => console.error("Gagal memuat gambar peta visual!");
collisionMapImage.onerror = () => console.error("Gagal memuat collision map!");
movementMapImage.onerror = () => console.error("Gagal memuat movement map!");
spawnMapImage.onerror = () => console.error("Gagal memuat spawn map!");
locationMapImage.onerror = () => console.error("Gagal memuat location map!");
liveLocationMapImage.onerror = () => console.error("Gagal memuat live location map!");
mapPlayerIconImage.onerror = () => console.error("Gagal memuat map player icon!");

// Set Sources
mapImage.src = 'map/Elendor.png';
collisionMapImage.src = 'map/TerrainBlock.png';
movementMapImage.src = 'map/TerrainMovement.png';
spawnMapImage.src = 'map/Spawn.png'; // Set source untuk spawn map
locationMapImage.src = 'map/Locations.png'; // Set source
liveLocationMapImage.src = 'map/LiveLocation.png'; // Set source
mapPlayerIconImage.src = 'assets/mapplayericon.png'; // Set source untuk ikon

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

        // Setup semua data canvas jika belum
        if (!collisionDataReady) setupCollisionDataCanvas();
        if (!movementDataReady) setupMovementDataCanvas();
        if (!locationDataReady) setupLocationDataCanvas();

        // Cari spawn point jika belum (cek semua data canvas SEBELUM spawn)
        if (collisionDataReady && movementDataReady && locationDataReady && !initialSpawnSet) {
             findSpawnPointsAndSetPlayer();
             initialSpawnSet = true;
        }

        // Mulai game loop HANYA jika SEMUA data SIAP dan spawn SUDAH DICOBA
        if (collisionDataReady && movementDataReady && locationDataReady && initialSpawnSet) {
             console.log("Semua data siap & spawn point di-set. Memulai game loop.");
             if (!camera.initialSetupDone) {
                centerCameraOnPlayer();
                camera.initialSetupDone = true;
                updateCurrentSprite();
             }

             // Coba mulai BGM di sini jika user sudah berinteraksi sebelumnya
             tryStartBackgroundMusic();

             // !!! Panggil updateUI untuk set tampilan awal !!!
             updateUI();

             if (!gameLoopRunning) {
                 gameLoopRunning = true;
                 gameLoop();
             }
        }
    }
}

function loadSprites() {
    console.log("Mulai memuat semua gambar sprite...");
    ['idle', 'walk', 'run', 'sit'].forEach(state => { // Tambah 'sit' ke loop
        const config = animFramesConfig[state];
        if (!config) return;
        console.log(`Memuat ${config.count} frame untuk state: ${state}`);
        player.sprites[state] = [];
        for (let i = 1; i <= config.count; i++) {
            const img = new Image();
            const path = `sprite/${state}/${state}${i}.png`;
            img.src = path;
            player.sprites[state].push(img);
            img.onload = imageLoaded;
            img.onerror = () => console.error(`Gagal memuat sprite: ${path}`);
        }
    });
}

// -- Input Handling --
const keys = {
    w: false, a: false, s: false, d: false, shift: false, m: false // Tambahkan 'm'
};

// Variabel untuk mencegah toggle cepat saat tombol M ditahan
let mKeyPressed = false;
let lastMapToggleTime = 0;
const MAP_TOGGLE_COOLDOWN = 300; // 300ms cooldown between map toggles

// --- State Popup Interaksi ---
let isInteractionPopupOpen = false;
let isGamePaused = false;
let isSaveLoadMenuOpen = false;

// --- UI Element References ---
const hpBarElement = document.getElementById('hp-bar');
const hungerBarElement = document.getElementById('hunger-bar');
const staminaBarElement = document.getElementById('stamina-bar');
const goldValueElement = document.getElementById('gold-value');
const playerGoldElement = document.getElementById('player-gold'); // Tambah referensi container gold
const relicSlots = document.querySelectorAll('.relic-slot');
const hpHungerFrame = document.getElementById('hp-hunger-frame');
const staminaFrame = document.getElementById('stamina-frame');
// --- Referensi Popup BARU ---
const popupContentElement = document.querySelector('#uiPanel .popup-content');
const popupLocationNameElement = document.querySelector('#uiPanel .popup-location-name');
const popupOptionsElement = document.querySelector('#uiPanel .popup-options');
const popupCloseBtnElement = document.querySelector('#uiPanel .popup-close-btn');
// --- Referensi Menu Pause BARU ---
const pauseMenuElement = document.getElementById('pause-menu');
// --- Referensi Save/Load BARU ---
const saveloadMenuElement = document.getElementById('saveload-menu');
const saveloadTitleElement = document.getElementById('saveload-title');
const saveloadNewSection = document.getElementById('saveload-new');
const saveNameInputElement = document.getElementById('save-name-input');
const createSaveBtnElement = document.getElementById('create-save-btn');
const saveSlotsListElement = document.getElementById('save-slots-list');
const saveloadBackBtnElement = document.getElementById('saveload-back-btn');

const SAVE_SLOT_PREFIX = 'elendorSave_';
const MAX_SAVE_SLOTS = 10; // Batasi jumlah slot

// Fix the event listener for keydown
window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // --- Logika Tombol Escape (Prioritas: saveload -> pause -> interaksi) ---
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

    // --- Proses input lain HANYA jika TIDAK ADA POPUP, TIDAK PAUSE, TIDAK SAVELOAD ---
    if (!isInteractionPopupOpen && !isGamePaused && !isSaveLoadMenuOpen) {
        // Tombol E untuk Interaksi
        if (key === 'e') {
            if (!isMapMode && currentLocationName) {
                createLocationPanel(currentLocationName);
            }
            return;
        }

        // Input movement & map toggle
        if (key in keys) keys[key] = true;
        
        // Handle map toggle with cooldown
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
     // Keyup diproses bahkan jika popup terbuka untuk reset state tombol
     if (key in keys) keys[key] = false;
     if (key === 'm') mKeyPressed = false;
});

// Listener untuk tombol close popup
if (popupCloseBtnElement) {
    popupCloseBtnElement.addEventListener('click', closeInteractionPopup);
}

canvas.addEventListener('click', (e) => {
    // Abaikan klik pada canvas jika popup terbuka
    if (isInteractionPopupOpen || isGamePaused || isSaveLoadMenuOpen) return;

    // Hanya proses klik jika TIDAK dalam mode peta & data siap
    if (!isMapMode && collisionDataReady) {
        const rect = canvas.getBoundingClientRect();
        const clickCanvasX = e.clientX - rect.left;
        const clickCanvasY = e.clientY - rect.top;

        // --- Konversi klik canvas ke koordinat dunia (DENGAN ZOOM) ---
        const clickWorldX = (clickCanvasX / zoomLevel) + camera.x;
        const clickWorldY = (clickCanvasY / zoomLevel) + camera.y;

        // Cek collision map (tidak berubah)
        if (isPassable(clickWorldX, clickWorldY)) {
            player.targetX = clickWorldX - player.width / 2;
            player.targetY = clickWorldY - player.height / 2;
            keys.w = keys.a = keys.s = keys.d = keys.shift = false;
        } else {
            console.log("Klik pada area yang tidak bisa dilewati (berdasarkan collision map).");
        }
    }
});

// -- Helper Function: Center Camera --
function centerCameraOnPlayer() {
    // Hitung posisi ideal kamera agar pemain di tengah VIEWPORT yang dizoom
    // Kita ingin titik tengah view (camera.viewWidth/2, camera.viewHeight/2)
    // berkorespondensi dengan titik tengah player (player.x + player.width/2, player.y + player.height/2)
    // Jadi, pojok kiri atas view (camera.x, camera.y) adalah:
    let idealCamX = (player.x + player.width / 2) - (camera.viewWidth / 2);
    let idealCamY = (player.y + player.height / 2) - (camera.viewHeight / 2);

    // Batasi kamera agar tidak keluar dari batas dunia (menggunakan viewWidth/viewHeight)
    camera.x = Math.max(0, Math.min(idealCamX, worldWidth - camera.viewWidth));
    camera.y = Math.max(0, Math.min(idealCamY, worldHeight - camera.viewHeight));
}

// -- Update Logic --
function update() {
    if (!allSpritesLoaded || !mapLoaded || !collisionDataReady || !movementDataReady || !locationDataReady) return;
    updateUI(); // UI selalu update

    // --- Logika Gameplay Inti (HANYA jika tidak ada popup/pause/saveload) ---
    if (!isInteractionPopupOpen && !isGamePaused && !isSaveLoadMenuOpen) {
        // Update Animasi Teks Lokasi
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
            // Update Lokasi Saat Ini & Trigger Animasi
             const footX = player.x + player.width / 2; const footY = player.y + player.height; const newLocationName = getLocationName(footX, footY);
             if (newLocationName !== previousLocationName) {
                currentLocationName = newLocationName; if (currentLocationName) { locationTextAnimStartTime = performance.now(); locationTextAnimProgress = 0; console.log("Memasuki:", currentLocationName); } else { locationTextAnimProgress = 0; } previousLocationName = currentLocationName;
             }

            // Logika Pergerakan, Collision, Stat Drain
            player.dx = 0; player.dy = 0; player.isRunning = keys.shift;
            let baseSpeed = player.isRunning ? player.speed * player.runSpeedMultiplier : player.speed;
            const speedModifier = getSpeedModifier(player.x + player.width / 2, player.y + player.height);
            let effectiveSpeed = baseSpeed * speedModifier;

            // Logika Input & Target
             if (player.targetX !== null && player.targetY !== null) {
                 const angle = Math.atan2(player.targetY - player.y, player.targetX - player.x);
                 const distance = Math.hypot(player.targetY - player.y, player.targetX - player.x);
                 const tolerance = effectiveSpeed;
                 if (distance > tolerance) {  player.dx = Math.cos(angle) * effectiveSpeed; player.dy = Math.sin(angle) * effectiveSpeed; if (Math.abs(player.dx) > Math.abs(player.dy)) { player.direction = player.dx > 0 ? 'right' : 'left'; } else { player.direction = player.dy > 0 ? 'down' : 'up'; } } else { player.x = player.targetX; player.y = player.targetY; player.targetX = null; player.targetY = null; player.dx = 0; player.dy = 0; }
             } else {
                 let movedByKey = false;
                 if (keys.w) { player.dy = -effectiveSpeed; player.direction = 'up'; movedByKey = true; }
                 if (keys.s) { player.dy = effectiveSpeed; player.direction = 'down'; movedByKey = true; }
                 if (keys.a) { player.dx = -effectiveSpeed; player.direction = 'left'; movedByKey = true; }
                 if (keys.d) { player.dx = effectiveSpeed; player.direction = 'right'; movedByKey = true; }
                 if (player.dx !== 0 && player.dy !== 0) { const factor = effectiveSpeed / Math.sqrt(player.dx * player.dx + player.dy * player.dy); player.dx *= factor; player.dy *= factor; }
             }
             let nextX = player.x + player.dx; let nextY = player.y + player.dy;

            // --- Collision Check Baru dengan Area Kaki ---
            const collisionCheckPointX = nextX + player.width / 2; // Titik tengah X sprite
            const collisionCheckPointY = nextY + player.height;    // Titik paling bawah Y sprite

            // Lebar dan tinggi area collision di kaki (sesuai visualisasi)
            const collisionFootWidth = player.width * 0.3; // 30% lebar sprite
            const collisionFootHeight = player.height * 0.2; // 20% tinggi sprite

            let canMoveX = true;
            if (player.dx !== 0) {
                // Cek collision vertikal saat gerak horizontal
                // Cek dua titik di dalam tinggi area kaki pada X tujuan
                const checkY1 = collisionCheckPointY - collisionFootHeight * 0.25; // Cek 25% dari atas area kaki
                const checkY2 = collisionCheckPointY - collisionFootHeight * 0.75; // Cek 75% dari atas area kaki
                canMoveX = isPassable(collisionCheckPointX, checkY1) && isPassable(collisionCheckPointX, checkY2);
            }

            let canMoveY = true;
            if (player.dy !== 0) {
                // Cek collision horizontal saat gerak vertikal
                // Cek dua titik di dalam lebar area kaki pada Y tujuan
                const checkX1 = collisionCheckPointX - collisionFootWidth * 0.4; // Cek 40% ke kiri dari tengah area kaki
                const checkX2 = collisionCheckPointX + collisionFootWidth * 0.4; // Cek 40% ke kanan dari tengah area kaki
                canMoveY = isPassable(checkX1, collisionCheckPointY) && isPassable(checkX2, collisionCheckPointY);
            }

            // Jika titik utama tidak bisa dilewati, batalkan semua gerakan
            if (!isPassable(collisionCheckPointX, collisionCheckPointY)) {
                canMoveX = false;
                canMoveY = false;
            }

            if (canMoveX) { player.x = Math.max(0, Math.min(nextX, worldWidth - player.width)); } else { player.dx = 0; }
            if (canMoveY) { player.y = Math.max(0, Math.min(nextY, worldHeight - player.height)); } else { player.dy = 0; }
            player.moving = (canMoveX && player.dx !== 0) || (canMoveY && player.dy !== 0); if (!player.moving && player.targetX !== null) { player.targetX = null; player.targetY = null; }


            // Logika Stat Drain (Stamina, Hunger PASIF, HP KARENA KELAPARAN)
             // 1. Stamina saat lari
             if (player.moving && player.isRunning) {
                 if (player.stamina > 0) {
                     player.stamina = Math.max(0, player.stamina - STAMINA_DRAIN_RATE_RUN);
                     if (player.stamina === 0) { 
                         player.isRunning = false; 
                         keys.shift = false;
                         lastStaminaDepletionTime = performance.now(); // Set waktu stamina habis
                     }
                 } else {
                     player.isRunning = false; 
                     keys.shift = false;
                 }
             } else if (player.stamina < player.maxStamina) {
                 // 2. Regenerasi Stamina saat tidak lari
                 player.stamina = Math.min(player.maxStamina, player.stamina + STAMINA_REGEN_RATE);
             }

             // Cek cooldown sebelum mengizinkan lari
             if (player.stamina === 0) {
                 const currentTime = performance.now();
                 if (currentTime - lastStaminaDepletionTime < RUN_COOLDOWN) {
                     player.isRunning = false;
                     keys.shift = false;
                 }
             }

             // 3. Pengurangan Hunger Pasif
             if (player.hunger > 0) {
                 player.hunger = Math.max(0, player.hunger - PASSIVE_HUNGER_DRAIN_RATE);
             }

             // 4. Pengurangan HP jika Hunger = 0 (Kelaparan)
             if (player.hunger <= 0 && player.hp > 0) {
                 player.hp = Math.max(0, player.hp - HP_DRAIN_RATE_STARVATION);
                 // Mungkin tambahkan efek visual/suara saat kelaparan di sini
             }


            // Update State Animasi
             if (player.moving) { player.animationState = player.isRunning ? 'run' : 'walk'; } else { player.animationState = 'idle'; }
             updateAnimation();
             centerCameraOnPlayer();

            // Play movement sounds with cooldown
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

            // Update last movement time dan cek idle state
            const idleCheckTime = performance.now();
            if (player.moving) {
                player.lastMovementTime = idleCheckTime;
                if (player.animationState === 'sit') {
                    player.animationState = 'idle';
                    player.animFrameIndex = 0;
                }
            } else if (idleCheckTime - player.lastMovementTime >= player.IDLE_TO_SIT_TIME) {
                player.animationState = 'sit';
            }

        } else {
            // Map mode - ensure player is completely stopped
            player.moving = false;
            player.dx = 0;
            player.dy = 0;
            player.isRunning = false;
            player.animationState = 'idle';
            keys.w = false;
            keys.a = false;
            keys.s = false;
            keys.d = false;
            keys.shift = false;
        }

        // Update Sprite Player
         updateCurrentSprite();

    } // Akhir dari if (!isInteractionPopupOpen)

    // (updateUI() sudah dipanggil di atas)
}

function updateAnimation() {
    const currentAnimSpeed = player.isRunning ? player.framesPerRunAnimFrame : player.framesPerAnimFrame;
    player.animTimer++;
    if (player.animTimer >= currentAnimSpeed) {
        player.animTimer = 0;
        player.animFrameIndex++;
        // Reset animation index if it exceeds the number of frames
        const state = player.animationState;
        const config = animFramesConfig[state];
        if (config && player.animFrameIndex >= config.count) {
            player.animFrameIndex = 0;
        }
    }
}

function updateCurrentSprite() {
    const state = player.animationState; // 'idle', 'walk', 'run'
    const direction = player.direction; // 'up', 'left', 'down', 'right'

    const config = animFramesConfig[state];
    if (!config || !player.sprites[state] || player.sprites[state].length === 0) {
        console.error(`Sprite atau config untuk state '${state}' tidak ditemukan/kosong.`);
        // Gambar kotak merah sebagai fallback
         ctx.fillStyle = 'magenta';
         ctx.fillRect(player.x, player.y, player.width, player.height);
         player.currentFrameImage = null; // Hapus frame saat ini jika error
        return;
    }

    const framesPerDir = config.perDirection;
    const totalFramesForState = config.count;
    const dirIndex = directionOrder.indexOf(direction); // 0=up, 1=left, 2=down, 3=right

    if (dirIndex === -1) {
        console.error(`Arah tidak valid: ${direction}`);
        dirIndex = 2; // Default ke bawah jika error
    }

    const baseFrameIndex = dirIndex * framesPerDir; // Index awal untuk arah ini

    // Pastikan baseFrameIndex tidak melebihi total frame yang dimuat untuk state itu
     if (baseFrameIndex >= player.sprites[state].length) {
         console.error(`Error: Base frame index (${baseFrameIndex}) melebihi jumlah frame (${player.sprites[state].length}) untuk state '${state}'. Periksa config dan jumlah file.`);
         // Gambar kotak sebagai fallback
         ctx.fillStyle = 'orange';
         ctx.fillRect(player.x, player.y, player.width, player.height);
         player.currentFrameImage = null;
         return;
     }

    // Loop index frame animasi khusus untuk arah ini
    const currentFrameInSequence = player.animFrameIndex % framesPerDir;
    const finalFrameIndex = baseFrameIndex + currentFrameInSequence;

     // Ambil gambar frame yang benar
     if(finalFrameIndex < player.sprites[state].length) {
        player.currentFrameImage = player.sprites[state][finalFrameIndex];
     } else {
         console.error(`Error: Final frame index (${finalFrameIndex}) out of bounds for state '${state}' (Total: ${player.sprites[state].length}). Resetting.`);
         player.animFrameIndex = 0; // Reset index jika error parah
         player.currentFrameImage = player.sprites[state][baseFrameIndex]; // Coba pakai frame pertama arah itu
         // Gambar fallback jika masih gagal
         if (!player.currentFrameImage) {
             ctx.fillStyle = 'cyan';
             ctx.fillRect(player.x, player.y, player.width, player.height);
             player.currentFrameImage = null;
         }
     }
}


// -- Draw Logic --
function draw() {
    if (!mapLoaded) { // Jika peta belum siap, tampilkan pesan loading
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center'; // Pusatkan teks
        ctx.fillText("Loading map...", canvas.width / 2, canvas.height / 2);
        return;
    }

    // Bersihkan canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Hitung offset bounce (digunakan hanya di mode peta)
    const verticalBounceOffset = Math.sin(performance.now() * bounceSpeed) * bounceAmplitude;

    if (isMapMode) {
        // --- Mode Peta (Zoomed Out) ---
        // 1. Gambar Peta Dasar (SAMA)
        ctx.drawImage(mapImage, 0, 0, worldWidth, worldHeight, 0, 0, canvas.width, canvas.height);

        // 2. Gambar Bangunan "Hidup" DENGAN BOUNCE (SAMA)
        if (liveLocationMapLoaded) {
            const mapModeBounceOffset = verticalBounceOffset * 2;
            ctx.drawImage(
                liveLocationMapImage,
                0, 0, worldWidth, worldHeight,
                0, mapModeBounceOffset, canvas.width, canvas.height
            );
        }

        // 3. Gambar Penanda Player (IKON BARU) (SAMA)
        if (allSpritesLoaded && mapIconLoaded) { // Pastikan ikon sudah dimuat
            const mapPlayerX = (player.x / worldWidth) * canvas.width;
            const mapPlayerY = (player.y / worldHeight) * canvas.height;
            const iconDrawWidth = 24; // Coba ukuran tetap dulu
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
        } else if (allSpritesLoaded) { // Fallback jika ikon BELUM dimuat tapi sprite SIAP
             const mapPlayerX = (player.x / worldWidth) * canvas.width;
             const mapPlayerY = (player.y / worldHeight) * canvas.height;
             ctx.fillStyle = 'orange'; // Warna beda untuk indikasi loading ikon
             ctx.fillRect(mapPlayerX - 3, mapPlayerY - 3, 6, 6);
        }

    } else {
        // --- Mode Gameplay (Zoomed In) ---

        // 1. Gambar Peta Dasar (Background)
        ctx.drawImage(mapImage, camera.x, camera.y, camera.viewWidth, camera.viewHeight, 0, 0, camera.width, camera.height);

        // --- Hitung Posisi & Ukuran Karakter di Canvas ---
        const playerCanvasX = (player.x - camera.x) * zoomLevel;
        const playerCanvasY = (player.y - camera.y) * zoomLevel;
        const playerDrawWidth = player.width * zoomLevel;
        const playerDrawHeight = player.height * zoomLevel;

        // 2. Gambar Bayangan Karakter
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

        // 3. Gambar Karakter
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

        // 4. Tampilkan Nama Lokasi
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

// -- Game Loop --
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Setup Offscreen Canvases (Dipanggil setelah semua gambar siap) ---
function setupCollisionDataCanvas() {
    // Pastikan gambar collision sudah ada & dimensi dunia diketahui
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
    // Pastikan gambar movement sudah ada & dimensi dunia diketahui
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
        locationDataReady = true; // Set flag baru
        console.log("Offscreen canvas data lokasi siap.");
    } catch(e) { console.error("Gagal setup location canvas:", e); locationDataReady = false; }
}

// --- Fungsi Pemeriksa Medan Collision (isPassable - Diperbarui) ---
function isPassable(worldX, worldY) {
    if (!collisionDataReady || !collisionOffscreenCtx) return false; // Belum siap

    const x = Math.floor(worldX);
    const y = Math.floor(worldY);
    if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
        return false; // Luar batas
    }

    try {
        const pixelData = collisionOffscreenCtx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        // Cek apakah warnanya HITAM (#000000)
        // Memberi sedikit toleransi jika ada sedikit noise/anti-alias
        if (r < 15 && g < 15 && b < 15) {
            return false; // Hitam = Tidak bisa dilewati
        }

        return true; // Warna lain (asumsi putih) = Bisa dilewati

    } catch (e) {
        return false; // Anggap tidak bisa dilewati jika error
    }
}

// --- Fungsi Pemeriksa Modifier Kecepatan ---
function getSpeedModifier(worldX, worldY) {
    if (!movementDataReady || !movementOffscreenCtx) return 1.0; // Default normal speed jika belum siap

    const x = Math.floor(worldX);
    const y = Math.floor(worldY);
    if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
        return 1.0; // Luar batas = normal speed
    }

    try {
        // Ambil pixel dari MOVEMENT offscreen canvas
        const pixelData = movementOffscreenCtx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        // Cek Warna Merah (Speed Up +25%) - SESUAIKAN RENTANG INI!
        if (r > 200 && g < 50 && b < 50) {
            // console.log("Speed Up Zone"); // Debug
            return 1.25;
        }

        // Cek Warna Hitam (Slow Down 50%) - SESUAIKAN RENTANG INI!
        if (r < 15 && g < 15 && b < 15) {
             // console.log("Slow Down Zone"); // Debug
            return 0.5;
        }

        // Jika tidak merah atau hitam, anggap normal speed
        return 1.0;

    } catch (e) {
        // console.error(`Error getting movement pixel data at ${x}, ${y}:`, e);
        return 1.0; // Default normal speed jika error
    }
}

// --- Fungsi Cari Spawn Point (Area) & Set Player ---
function findSpawnPointsAndSetPlayer() {
    if (!spawnMapLoaded || worldWidth <= canvas.width || worldHeight <= canvas.height) {
        console.error("Tidak bisa mencari spawn point, spawn map atau dimensi dunia belum siap.");
        // Tetapkan fallback jika gagal di awal
        player.x = worldWidth / 2 - player.width / 2;
        player.y = worldHeight / 2 - player.height / 2;
        return; // Tidak perlu return boolean
    }

    console.log("Mencari AREA spawn point dari Spawn.png menggunakan BFS...");
    const spawnAreaCentroids = [];
    let visited = null;

    try {
        // Buat canvas sementara dan gambar spawn map
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

        // Mulai scan gambar
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

        // Pilih area acak dan set player
        if (spawnAreaCentroids.length > 0) {
            const randomIndex = Math.floor(Math.random() * spawnAreaCentroids.length);
            const randomSpawnCenter = spawnAreaCentroids[randomIndex];

            player.x = randomSpawnCenter.x - player.width / 2; // Pusatkan sprite
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
    // Tidak perlu return boolean
}

// --- Helper: Konversi RGB ke Hex ---
function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// --- Fungsi Pemeriksa Lokasi ---
function getLocationName(worldX, worldY) {
    if (!locationDataReady || !locationOffscreenCtx) return null; // Belum siap

    const x = Math.floor(worldX);
    const y = Math.floor(worldY);
    if (x < 0 || x >= worldWidth || y < 0 || y >= worldHeight) {
        return null; // Luar batas
    }

    try {
        // Ambil pixel dari LOCATION offscreen canvas
        const pixelData = locationOffscreenCtx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        // Konversi ke hex (lowercase agar cocok dengan map keys)
        const hexColor = rgbToHex(r, g, b).toLowerCase();

        // Cari di map
        return locationColorMap[hexColor] || null; // Kembalikan nama atau null jika tidak ditemukan

    } catch (e) {
        // console.error(`Error getting location pixel data at ${x}, ${y}:`, e);
        return null;
    }
}

// --- Update UI Function ---
function updateUI() {
    // Update Bars
    if (hpBarElement && hungerBarElement && staminaBarElement) {
        const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
        const staminaPercent = Math.max(0, Math.min(100, (player.stamina / player.maxStamina) * 100));
        const hungerPercent = Math.max(0, Math.min(100, (player.hunger / player.maxHunger) * 100));

        // Update visibility based on map mode
        const isVisible = !isMapMode;
        hpBarElement.style.visibility = isVisible ? 'visible' : 'hidden';
        hungerBarElement.style.visibility = isVisible ? 'visible' : 'hidden';
        staminaBarElement.style.visibility = isVisible ? 'visible' : 'hidden';
        goldValueElement.style.visibility = isVisible ? 'visible' : 'hidden';
        playerGoldElement.style.visibility = isVisible ? 'visible' : 'hidden';
        hpHungerFrame.style.visibility = isVisible ? 'visible' : 'hidden';
        staminaFrame.style.visibility = isVisible ? 'visible' : 'hidden';

        // Update values
        hpBarElement.style.width = `${hpPercent}%`;
        staminaBarElement.style.width = `${staminaPercent}%`;
        const scaledHungerPercent = hungerPercent * 0.75;
        hungerBarElement.style.height = `${scaledHungerPercent}%`;
    }

    // Update Gold
    if (goldValueElement) {
        goldValueElement.textContent = player.gold;
    }

    // Update Relics Display - Fill slots sequentially
    if (relicSlots.length > 0) {
        const relicsCount = player.relicsFound.size;
        relicSlots.forEach((slot, index) => {
            if (index < relicsCount) {
                // Fill slots sequentially from left
                slot.classList.add('found');
                slot.title = `Relic ${index + 1} (Ditemukan)`;
            } else {
                slot.classList.remove('found');
                slot.title = `Relic ${index + 1} (Belum Ditemukan)`;
            }
        });
    }
}

// -- Mulai Pemuatan Gambar --
loadSprites();
// mapImage.src, collisionMapImage.src, movementMapImage.src, spawnMapImage.src, locationMapImage.src, liveLocationMapImage.src sudah di set 

// Fungsi untuk menandai interaksi pengguna
function handleFirstInteraction() {
    if (!userInteracted) {
        userInteracted = true;
        console.log("Interaksi pengguna terdeteksi.");
        // Coba mainkan BGM SEKARANG setelah interaksi
        tryStartBackgroundMusic();
        // Hapus listener ini agar tidak dipanggil lagi
        window.removeEventListener('keydown', handleFirstInteraction);
        window.removeEventListener('click', handleFirstInteraction);
    }
}

// Tambahkan listener untuk interaksi pertama
window.addEventListener('keydown', handleFirstInteraction, { once: false }); // once: false agar tidak auto remove jika keydown bukan interaksi pertama
window.addEventListener('click', handleFirstInteraction, { once: false }); 

// --- Fungsi untuk Membuka Popup ---
function openInteractionPopup(locationName) {
    if (!popupContentElement || !popupLocationNameElement || !popupOptionsElement || !locationName) return;

    console.log(`Membuka popup interaksi untuk: ${locationName}`);
    popupLocationNameElement.textContent = locationName;

    const location = locationData[locationName];
    if (!location) {
        console.error(`Data lokasi tidak ditemukan untuk: ${locationName}`);
        return;
    }

    // Bersihkan opsi sebelumnya
    popupOptionsElement.innerHTML = '';

    // Tambahkan opsi sesuai tipe lokasi
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
        }
    });

    popupContentElement.style.display = 'block';
    isInteractionPopupOpen = true;
}

// --- Fungsi untuk Membeli Item ---
function buyItem(locationName, itemName) {
    const location = locationData[locationName];
    if (!location) return;

    const item = location.shopItems.find(i => i.name === itemName);
    if (!item) return;

    if (player.gold >= item.price) {
        player.gold -= item.price;
        player.hunger = Math.min(player.maxHunger, player.hunger + item.hunger);
        player.hp = Math.min(player.maxHp, player.hp + item.hp);
        
        // Update UI
        updateUI();
        
        // Tampilkan pesan sukses
        alert(`Berhasil membeli ${itemName}! Hunger +${item.hunger}${item.hp > 0 ? `, HP +${item.hp}` : ''}`);
    } else {
        alert('Gold tidak cukup!');
    }
}

// --- Fungsi untuk Menangani Opsi Interaksi ---
function handleInteractionOption(optionType, locationName) {
    const location = locationData[locationName];
    if (!location) return;

    switch(optionType) {
        case 'bicara':
            alert(`Berbicara dengan penduduk ${locationName}...`);
            break;
        case 'quest':
            if (quests[locationName] && quests[locationName].length > 0) {
                const quest = quests[locationName][0]; // Get first quest
                const questHTML = `
                    <div class="quest-content">
                        <h3>Quest</h3>
                        <p>${quest.question}</p>
                        <div class="quest-options">
                            ${quest.options.map((option, index) => `
                                <button onclick="handleQuestAnswer('${locationName}', 0, ${index})">
                                    ${option}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
                popupContentElement.innerHTML = questHTML;
            } else {
                alert("Tidak ada quest tersedia di lokasi ini.");
            }
            break;
        case 'eksplorasi':
            alert(`Mengeksplorasi ${locationName}...`);
            break;
    }
}

// --- Fungsi untuk Menutup Popup ---
function closeInteractionPopup() {
    if (!popupContentElement) return;
    console.log("Menutup popup interaksi.");
    popupContentElement.style.display = 'none';
    isInteractionPopupOpen = false;
}

// --- Fungsi Menu Pause BARU ---
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

// --- Fungsi Aksi Menu Pause ---
function continueGame() {
    closePauseMenu();
}

function restartGame() {
    // Reset game state
    player.hp = player.maxHp;
    player.hunger = player.maxHunger;
    player.stamina = player.maxStamina;
    player.gold = 0;
    player.relicsFound = new Set();
    isGameOver = false;
    currentLocationName = null;
    previousLocationName = null;

    // Reset volume sliders (assuming this function exists and works)
    resetVolumeSliders();
    
    // Reset other game states
    isGamePaused = false;
    isInteractionPopupOpen = false;
    isSaveLoadMenuOpen = false; // Ensure save/load is closed too
    
    // Remove the game over popup
    const gameOverPopup = document.getElementById('game-over-popup');
    if (gameOverPopup) {
        gameOverPopup.remove();
    }

    // Reset UI
    updateUI();
    closePauseMenu(); // Make sure pause menu is closed if somehow open
    closeInteractionPopup(); // Close any interaction panels
    hideSaveLoadMenu(); // Close save/load menu
    
    // Reset player position
    findSpawnPointsAndSetPlayer();
    centerCameraOnPlayer(); // Center camera on new spawn

    // Optionally, restart background music if it was playing
    if (bgmPlaying && backgroundMusic.paused) {
        tryStartBackgroundMusic();
    }
    console.log("Game restarted.");
}

function goToMainMenu() {
    // Reset game state
    playerStats = {
        health: 100,
        hunger: 100,
        stamina: 100,
        gold: 0
    };
    
    // Reset volume sliders
    resetVolumeSliders();
    
    // Reset other states
    isGamePaused = false;
    isInteractionPopupOpen = false;
    currentLocation = null;
    
    // Reset UI
    updateUI();
    closePauseMenu();
    closeInteractionPopup();
    
    // Show main menu
    // (Add your main menu display logic here)
}

function exitGame() {
    console.log("Keluar dari game...");
    // Menutup tab/window mungkin diblokir browser
    alert("Silakan tutup tab browser untuk keluar.");
    // window.close(); // Coba saja, mungkin berhasil jika window dibuka oleh script
}

// --- Fungsi-fungsi Save/Load BARU ---

// Membuka layar Save/Load
function showSaveLoadMenu(mode) { // mode = 'save' atau 'load'
    if (!saveloadMenuElement) return;

    console.log(`Membuka menu Save/Load dalam mode: ${mode}`);
    saveloadTitleElement.textContent = mode === 'save' ? 'Simpan Game' : 'Muat Game';

    // Tampilkan/sembunyikan bagian 'Simpan Baru'
    saveloadNewSection.style.display = mode === 'save' ? 'flex' : 'none';
    if (mode === 'save') {
        saveNameInputElement.value = `Save ${new Date().toLocaleDateString()}`; // Nama default
    }

    populateSaveLoadList(mode); // Isi daftar save sesuai mode

    pauseMenuElement.classList.remove('visible'); // Sembunyikan menu pause
    saveloadMenuElement.classList.add('visible');
    isSaveLoadMenuOpen = true;
}

// Menutup layar Save/Load
function hideSaveLoadMenu() {
    if (!saveloadMenuElement) return;
    saveloadMenuElement.classList.remove('visible');
    isSaveLoadMenuOpen = false;
    // Tampilkan lagi menu pause
    if (isGamePaused) { // Pastikan game memang sedang di-pause
         pauseMenuElement.classList.add('visible');
    }
}

// Mengisi daftar slot save/load
function populateSaveLoadList(mode) {
    if (!saveSlotsListElement) return;
    saveSlotsListElement.innerHTML = ''; // Kosongkan list

    let savesFound = 0;
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
        const key = `${SAVE_SLOT_PREFIX}${i}`;
        const saveDataJson = localStorage.getItem(key);

        if (saveDataJson) {
            savesFound++;
            try {
                const saveData = JSON.parse(saveDataJson);
                const li = document.createElement('li');

                // Format timestamp
                const timestamp = new Date(saveData.timestamp);
                const formattedTime = timestamp.toLocaleString('id-ID', { // Format Indonesia
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
                // Opsional: tampilkan slot rusak atau hapus otomatis?
                localStorage.removeItem(key); // Hapus jika rusak
            }
        }
    }

    if (savesFound === 0) {
        saveSlotsListElement.innerHTML = '<li class="no-saves">Belum ada game yang disimpan.</li>';
    }
}

// Fungsi untuk menyimpan game
function saveGame(slotKey, saveName) {
    try {
        const saveData = {
            playerStats,
            currentLocation,
            timestamp: new Date().toISOString(),
            saveName,
            volumeSettings: {
                mainVolume,
                musicVolume,
                uiVolume
            }
        };
        localStorage.setItem(slotKey, JSON.stringify(saveData));
        populateSaveLoadList('save');
    } catch (error) {
        console.error('Error saving game:', error);
    }
}

// Fungsi untuk memuat game
function loadGame(slotKey) {
    try {
        const saveData = JSON.parse(localStorage.getItem(slotKey));
        if (saveData) {
            // Load game state
            playerStats = saveData.playerStats;
            currentLocation = saveData.currentLocation;
            
            // Load volume settings from save
            if (saveData.volumeSettings) {
                mainVolume = saveData.volumeSettings.mainVolume;
                musicVolume = saveData.volumeSettings.musicVolume;
                uiVolume = saveData.volumeSettings.uiVolume;
                
                // Update sliders
                document.getElementById('main-volume').value = mainVolume * 100;
                document.getElementById('music-volume').value = musicVolume * 100;
                document.getElementById('ui-volume').value = uiVolume * 100;
                
                // Update localStorage
                localStorage.setItem('mainVolume', mainVolume);
                localStorage.setItem('musicVolume', musicVolume);
                localStorage.setItem('uiVolume', uiVolume);
            } else {
                // If no volume settings in save, reset to default
                resetVolumeSliders();
            }
            
            // Update UI and close menus
            updateUI();
         hideSaveLoadMenu();
            closePauseMenu();
            
            // Update all volumes
            updateAllVolumes();
        }
    } catch (error) {
        console.error('Error loading game:', error);
        // If there's an error, reset to default
        resetVolumeSliders();
     }
}

// Fungsi untuk menghapus save
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
            // Refresh list sesuai mode saat ini
            const currentMode = saveloadNewSection.style.display === 'none' ? 'load' : 'save';
            populateSaveLoadList(currentMode);
        } catch (e) {
            console.error(`Gagal menghapus save slot ${slotKey}:`, e);
            alert("Gagal menghapus save.");
        }
    }
}


// --- Listener untuk Tombol Save Baru ---
if (createSaveBtnElement) {
    createSaveBtnElement.addEventListener('click', () => {
        const name = saveNameInputElement.value.trim();
        if (!name) {
            alert("Nama save tidak boleh kosong!");
            return;
        }
        // Cari slot kosong pertama
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

// --- Listener untuk Tombol Kembali Save/Load ---
if (saveloadBackBtnElement) {
    saveloadBackBtnElement.addEventListener('click', hideSaveLoadMenu);
}

// Sound effect functions
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

// Add hover sound to UI Panel options
document.addEventListener('DOMContentLoaded', function() {
    // Add hover sound to UI Panel options
    const popupOptions = document.querySelectorAll('#uiPanel .popup-options li');
    popupOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });

    // Add hover sound to Pause Menu options
    const pauseOptions = document.querySelectorAll('#pause-options li');
    pauseOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });

    // Add hover sound to Save/Load options
    const saveLoadOptions = document.querySelectorAll('#save-slots-list li:not(.no-saves)');
    saveLoadOptions.forEach(option => {
        option.addEventListener('mouseenter', playHoverSound);
    });
});

// --- Data Lokasi & Interaksi ---
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
        interactions: ['quest', 'bicara_commander', 'beli_armor'],
        armorItems: [
            { name: 'Baju Zirah Besi', price: 100, effect: 'Mengurangi damage 20%' },
            { name: 'Helm Ksatria', price: 50, effect: 'Mengurangi damage 10%' },
            { name: 'Perisai Kerajaan', price: 75, effect: 'Mengurangi damage 15%' }
        ]
    },
    'Menara Penyihir Sarungman': {
        type: 'tower',
        interactions: ['quest', 'bicara_penyihir', 'beli_ramuan'],
        potionItems: [
            { name: 'Ramuan Penyembuh', price: 30, effect: 'Memulihkan 50 HP', hp: 50, hunger: 0 },
            { name: 'Ramuan Stamina', price: 25, effect: 'Memulihkan stamina penuh', hp: 0, hunger: 0 },
            { name: 'Ramuan Kenyang', price: 20, effect: 'Memulihkan hunger penuh', hp: 0, hunger: 100 }
        ]
    },
    'Pusat Kota Managarmr': {
        type: 'capital',
        interactions: ['quest', 'beli_makanan', 'bicara', 'bicara_raja'],
        shopItems: [
            { name: 'Roti Emas', price: 30, hunger: 70, hp: 20 },
            { name: 'Sup Raja', price: 50, hunger: 100, hp: 30 },
            { name: 'Hidangan Istana', price: 40, hunger: 80, hp: 25 }
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
        interactions: ['jelajah', 'lawan_monster', 'lawan_boss']
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
    }
};

// Function to handle special interactions
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
            for (let i = 1; i <= 8; i++) {
                player.relicsFound.add(i);
            }
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

        // Add more special interactions here
    }
}

// Update updatePanelContent function to handle new interactions
function updatePanelContent(locationName, panelType) {
    const panel = document.querySelector(`[data-location="${locationName}"]`);
    if (!panel) return;

    const location = locationData[locationName];
    if (!location) return;

    switch (panelType) {
        case 'main':
            let interactionButtons = '';
            location.interactions.forEach(interaction => {
                let buttonText = '';
                switch(interaction) {
                    case 'quest': buttonText = 'Quest'; break;
                    case 'beli_makanan': buttonText = 'Beli Makanan'; break;
                    case 'bicara': buttonText = 'Berbicara Dengan Penduduk Lokal'; break;
                    case 'bicara_commander': buttonText = 'Berbicara Dengan Commander'; break;
                    case 'beli_armor': buttonText = 'Membeli Upgrade Armor'; break;
                    case 'bicara_penyihir': buttonText = 'Berbicara Dengan Penyihir'; break;
                    case 'beli_ramuan': buttonText = 'Membeli Ramuan'; break;
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
                            <span class="item-price">${item.price} G</span>
                            <span class="item-stats">+${item.hunger} Hunger${item.hp > 0 ? `, +${item.hp} HP` : ''}</span>
                            <button onclick="buyItem('${locationName}', '${item.name}')">Beli</button>
                        </div>
                    `).join('')}
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;

        case 'talk':
            const tips = locationTips[locationName] || ["Tidak ada informasi khusus saat ini."];
            panel.innerHTML = `
                <h3>${locationName} - Berbicara</h3>
                <div class="talk-content">
                    <p>Penduduk lokal memberi tahu:</p>
                    <ul>
                        ${tips.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
                <button class="close-btn" onclick="updatePanelContent('${locationName}', 'main')">Kembali</button>
            `;
            break;

        // ... other cases remain the same ...
    }
}

// Update handleInteractionOption function
function handleInteractionOption(optionType, locationName) {
    const location = locationData[locationName];
    if (!location) return;

    switch(optionType) {
        case 'quest':
            if (quests[locationName] && quests[locationName].length > 0) {
                const quest = quests[locationName][0];
                const questHTML = `
                    <div class="quest-content">
                        <h3>Quest</h3>
                        <p>${quest.question}</p>
                        <div class="quest-options">
                            ${quest.options.map((option, index) => `
                                <button onclick="handleQuestAnswer('${locationName}', 0, '${option}')">
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

        case 'bicara':
            updatePanelContent(locationName, 'talk');
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

// --- Fungsi untuk Menutup Panel Lokasi ---
function closeLocationPanel(locationName) {
    const panel = document.querySelector(`[data-location="${locationName}"]`);
    if (panel) {
        panel.classList.remove('active');
        isInteractionPopupOpen = false;
        currentLocation = null;
        currentPanelType = null;
    }
}

// --- Fungsi untuk Menangani Jawaban Quest ---
function handleQuestAnswer(locationName, questIndex, selectedAnswer) {
    const locationQuests = quests[locationName];
    if (!locationQuests || questIndex >= locationQuests.length) {
        console.error("Quest tidak ditemukan!");
        updatePanelContent(locationName, 'main');
        return;
    }

    const quest = locationQuests[questIndex];
    // Perbaikan pengecekan jawaban benar
    const isCorrect = selectedAnswer === quest.correctAnswer;
    
    // Initialize or update correct answers count for this location
    if (!locationCorrectAnswers.has(locationName)) {
        locationCorrectAnswers.set(locationName, 0);
    }
    
    // Update correct answers count if answer is correct
    if (isCorrect) {
        const currentCorrect = locationCorrectAnswers.get(locationName) + 1;
        locationCorrectAnswers.set(locationName, currentCorrect);
    }
    
    // Tampilkan hasil
    const panel = document.querySelector(`[data-location="${locationName}"]`);
    if (!panel) return;

    let resultMessage = isCorrect ? "Jawaban Benar!" : "Jawaban Salah";
    let rewardMessage = "";
    
    if (isCorrect) {
        rewardMessage = `Selamat! Kamu mendapatkan ${quest.reward.gold} Gold.`;
        // Check if player has earned a relic (3 correct answers)
        if (locationCorrectAnswers.get(locationName) >= 3 && !player.relicsFound.has(locationName)) {
            player.relicsFound.add(locationName);
            rewardMessage += ` Kamu juga mendapatkan Relik ${locationName}!`;
        }
    } else {
        // Reduce HP for wrong answer
        player.hp = Math.max(0, player.hp - 25);
        if (player.hp <= 0) {
            showGameOver();
            return;
        }
        rewardMessage = "Maaf, jawabanmu salah. HP berkurang 25.";
    }

    panel.innerHTML = `
        <h3>${locationName} - Hasil Quest</h3>
        <p>${resultMessage}</p>
        <p>${rewardMessage}</p>
        <p>Jawaban benar saat ini: ${locationCorrectAnswers.get(locationName)}/3</p>
        <button class="close-btn" onclick="updatePanelContent('${locationName}', 'quest')">Lanjutkan Quest</button>
    `;

    // Update UI and remove quest if answered correctly
    if (isCorrect) {
        player.gold += quest.reward.gold;
        locationQuests.splice(questIndex, 1);
    }
    
    updateUI();
}

// --- Fungsi untuk Membuka Popup ---
function openInteractionPopup(locationName) {
    if (!locationName) return;
    createLocationPanel(locationName);
}

// --- Fungsi untuk Menutup Popup ---
function closeInteractionPopup() {
    if (currentLocation) {
        closeLocationPanel(currentLocation);
    }
}

// Volume control variables
let mainVolume = 1.0;
let musicVolume = 1.0;
let uiVolume = 1.0;

// Initialize volume controls
function initializeVolumeControls() {
    const mainVolumeSlider = document.getElementById('main-volume');
    const musicVolumeSlider = document.getElementById('music-volume');
    const uiVolumeSlider = document.getElementById('ui-volume');

    // Load saved volume settings
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

    // Add event listeners
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

// Update all audio volumes
function updateAllVolumes() {
    // Update background music volume (only affected by music volume)
    if (backgroundMusic) {
        backgroundMusic.volume = musicVolume;
    }

    // Update UI sounds (only affected by UI volume)
    const uiSoundElements = document.querySelectorAll('#hoverSound, #pauseSound, #unpauseSound');
    uiSoundElements.forEach(sound => {
        sound.volume = uiVolume;
    });

    // Update in-game sounds (only affected by main volume)
    const gameSoundElements = document.querySelectorAll('#walkSound, #runSound');
    gameSoundElements.forEach(sound => {
        sound.volume = mainVolume;
    });
}

// Play UI sound with UI volume
function playUISound(soundName) {
    const sound = uiSounds[soundName];
    if (sound) {
        sound.volume = uiVolume;
        sound.play();
    }
}

// Play in-game sound with main volume
function playGameSound(soundName) {
    const sound = gameSounds[soundName];
    if (sound) {
        sound.volume = mainVolume;
        sound.play();
    }
}

// Call this function when the game starts
initializeVolumeControls();

// ... existing code ...
function resetVolumeSliders() {
    // Reset volume variables to default (100%)
    mainVolume = 1.0;
    musicVolume = 1.0;
    uiVolume = 1.0;

    // Update slider values
    document.getElementById('main-volume').value = 100;
    document.getElementById('music-volume').value = 100;
    document.getElementById('ui-volume').value = 100;

    // Update localStorage
    localStorage.setItem('mainVolume', mainVolume);
    localStorage.setItem('musicVolume', musicVolume);
    localStorage.setItem('uiVolume', uiVolume);

    // Update all volumes
    updateAllVolumes();
}

// Add this at the top level of the script, before any functions
const locationCorrectAnswers = new Map();

// Add tips data
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
    ]
};

// Add shop items with different qualities and prices
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

// Add potion shop items
const potionItems = [
    { name: 'Ramuan Penyembuh', price: 30, effect: 'Memulihkan 50 HP', hp: 50, hunger: 0 },
    { name: 'Ramuan Stamina', price: 25, effect: 'Memulihkan stamina penuh', hp: 0, hunger: 0 },
    { name: 'Ramuan Kenyang', price: 20, effect: 'Memulihkan hunger penuh', hp: 0, hunger: 100 }
];

// Add armor upgrades
const armorUpgrades = [
    { name: 'Baju Zirah Besi', price: 100, effect: 'Mengurangi damage 20%' },
    { name: 'Helm Ksatria', price: 50, effect: 'Mengurangi damage 10%' },
    { name: 'Perisai Kerajaan', price: 75, effect: 'Mengurangi damage 15%' }
];

// Fix the createLocationPanel function
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

    // Remove any active panels
    const activePanels = locationPanels.querySelectorAll('.location-panel.active');
    activePanels.forEach(panel => panel.classList.remove('active'));

    // Create or get existing panel
    let panel = locationPanels.querySelector(`[data-location="${locationName}"]`);
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'location-panel';
        panel.dataset.location = locationName;
        locationPanels.appendChild(panel);
    }

    // Update panel content and show it
    updatePanelContent(locationName, 'main');
    panel.classList.add('active');
    isInteractionPopupOpen = true;

    console.log(`Opening interaction panel for: ${locationName}`);
}

// Add toggleMap function to handle map mode toggle
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

    // Reset ALL movement states
    player.targetX = null;
    player.targetY = null;
    player.dx = 0;
    player.dy = 0;
    player.moving = false;
    player.isRunning = false;
    player.animationState = 'idle';
    player.animFrameIndex = 0;
    player.animTimer = 0;
    
    // Reset ALL movement keys
    keys.w = false;
    keys.a = false;
    keys.s = false;
    keys.d = false;
    keys.shift = false;

    // Force update player state
    updateCurrentSprite();
    
    // Center camera on player when exiting map mode
    if (!isMapMode && mapLoaded && camera.initialSetupDone) {
        centerCameraOnPlayer();
    }

    // Force update UI to reflect changes
    updateUI();
}