const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.66;
canvas.height = window.innerHeight - 50;

// Objek Pemain
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    speed: 5
};

let keys = {};

// Status Pemain (Dijamin Tidak Akan Game Over)
let playerStatus = {
    hunger: 50,
    energy: 50,
    hygiene: 50,
    happiness: 50,
    money: 100
};

// Lokasi dalam Game
let locations = ["Home", "Beach", "Lake", "Temple", "Mountain"];
let currentLocation = 0;

// Event Listener untuk Pergerakan
window.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Fungsi Perbarui Status (Pastikan Tidak Game Over)
function updateStatus() {
    document.getElementById("hunger").value = playerStatus.hunger;
    document.getElementById("energy").value = playerStatus.energy;
    document.getElementById("hygiene").value = playerStatus.hygiene;
    document.getElementById("happiness").value = playerStatus.happiness;
    document.getElementById("money").innerText = playerStatus.money;

    // Batasi agar tidak negatif, tapi tidak menyebabkan Game Over
    Object.keys(playerStatus).forEach(key => {
        if (playerStatus[key] < 0) playerStatus[key] = 0;
    });

    // Warna Indikator (Hijau: aman, Kuning: waspada, Merah: bahaya)
    ["hunger", "energy", "hygiene", "happiness"].forEach(status => {
        let bar = document.getElementById(status);
        bar.className = playerStatus[status] < 20 ? "critical" : playerStatus[status] < 50 ? "low" : "";
    });

    // **Hapus Game Over (tidak perlu pengecekan)**
}

// Kurangi status pemain setiap 10 detik (tidak menyebabkan Game Over)
function degradeStatus() {
    playerStatus.hunger -= Math.floor(Math.random() * 3);
    playerStatus.energy -= Math.floor(Math.random() * 3);
    playerStatus.hygiene -= Math.floor(Math.random() * 3);
    playerStatus.happiness -= Math.floor(Math.random() * 3);
    updateStatus();
}

// Update Posisi Pemain
function update() {
    if (keys["w"]) player.y = Math.max(0, player.y - player.speed);
    if (keys["s"]) player.y = Math.min(canvas.height - player.height, player.y + player.speed);
    if (keys["a"]) player.x = Math.max(0, player.x - player.speed);
    if (keys["d"]) player.x = Math.min(canvas.width - player.width, player.x + player.speed);
}

// Gambar Pemain di Canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Loop Game
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Event Listener untuk Aktivitas Pemain
document.getElementById("btn-meal").addEventListener("click", () => {
    if (playerStatus.money >= 10) {
        playerStatus.hunger = Math.min(playerStatus.hunger + 20, 100);
        playerStatus.money -= 10;
    }
    updateStatus();
});

document.getElementById("btn-bath").addEventListener("click", () => {
    playerStatus.hygiene = Math.min(playerStatus.hygiene + 15, 100);
    updateStatus();
});

document.getElementById("btn-sleep").addEventListener("click", () => {
    playerStatus.energy = Math.min(playerStatus.energy + 25, 100);
    updateStatus();
});

document.getElementById("btn-chores").addEventListener("click", () => {
    playerStatus.money += 10;
    playerStatus.hygiene = Math.max(playerStatus.hygiene - 5, 0);
    updateStatus();
});

document.getElementById("btn-travel").addEventListener("click", () => {
    currentLocation = (currentLocation + 1) % locations.length;
    document.getElementById("location-name").innerText = `You're at ${locations[currentLocation]}`;
});

// **Menghapus semua kode terkait Game Over**
document.getElementById("game-over-screen").style.display = "none"; // Sembunyikan layar Game Over

// Perbarui status pertama kali sebelum game dimulai
updateStatus();

// Mulai game loop dan penurunan status setelah 10 detik
setTimeout(() => {
    setInterval(degradeStatus, 10000);
}, 10000);

gameLoop();
