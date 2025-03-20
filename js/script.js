function updateDateTime() {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[now.getDay()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${day} | Day ${now.getDate()} | ${hours}:${minutes}:${seconds} AM`;

    document.getElementById('datetime').textContent = timeString;
}

setInterval(updateDateTime, 1000);
updateDateTime();

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        movePlayer(key);
    }
});

function movePlayer(direction) {
    const player = document.getElementById('player');
    const step = 10;

    if (!player.style.top) player.style.top = `${player.offsetTop}px`;
    if (!player.style.left) player.style.left = `${player.offsetLeft}px`;

    const currentTop = parseInt(player.style.top, 10);
    const currentLeft = parseInt(player.style.left, 10);
    const parentRect = player.parentElement.getBoundingClientRect();

    switch (direction) {
        case 'w':
            if (currentTop - step >= 0) {
                player.style.top = `${currentTop - step}px`;
            }
            break;
        case 'up':
            if (currentTop - step >= 0) {
                player.style.top = `${currentTop - step}px`;
            }
            break;
        case 's':
            if (currentTop + step + player.offsetHeight <= parentRect.height) {
                player.style.top = `${currentTop + step}px`;
            }
            break;
        case 'down':
            if (currentTop + step + player.offsetHeight <= parentRect.height) {
                player.style.top = `${currentTop + step}px`;
            }
            break;
        case 'a':
            if (currentLeft - step >= 0) {
                player.style.left = `${currentLeft - step}px`;
            }
            break;
        case 'left':
            if (currentLeft - step >= 0) {
                player.style.left = `${currentLeft - step}px`;
            }
            break;
        case 'd':
            if (currentLeft + step + player.offsetWidth <= parentRect.width) {
                player.style.left = `${currentLeft + step}px`;
            }
            break;
        case 'right':
            if (currentLeft + step + player.offsetWidth <= parentRect.width) {
                player.style.left = `${currentLeft + step}px`;
            }
            break;
    }
}

let player = document.getElementById("player");

function startDrag(event) {
    event.dataTransfer.setData("text/plain", null);
    player.style.opacity = "0.5";
}

function endDrag(event) {
    player.style.opacity = "1";
    const rect = event.target.parentElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    player.style.position = "absolute";
    player.style.left = `${x - player.offsetWidth / 2}px`;
    player.style.top = `${y - player.offsetHeight / 2}px`;
}