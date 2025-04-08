const slider = document.querySelector(".slider");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerName");

let currentIndex = 0;
const characterWidth = 128; // Width of one character
const totalCharacters = document.querySelectorAll(".character").length;

function updateSlider() {
    if (currentIndex < 0) {
        currentIndex = totalCharacters - 1;
    } else if (currentIndex >= totalCharacters) {
        currentIndex = 0;
    }
    const offset = -currentIndex * characterWidth;
    slider.style.transform = `translateX(${offset}px)`;
}

prevBtn.addEventListener("click", function () {
    currentIndex--;
    updateSlider();
});

nextBtn.addEventListener("click", function () {
    currentIndex++;
    updateSlider();
});

startBtn.addEventListener("click", function () {
    const playerName = playerNameInput.value.trim();
    if (playerName === "") {
        alert("Please enter your name before starting.");
    } else {
        alert(`Welcome, ${playerName}! You selected character ${currentIndex + 1}`);
    }
});

// Dropdown stuff
document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector(".menu-btn");
    const dropdown = document.querySelector(".dropdown");

    menuBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        dropdown.classList.toggle("show");
    });

    dropdown.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    const readMeBtn = document.getElementById("readMeBtn");
    const rulesBox = document.getElementById("rulesBox");
    const relicBox = document.getElementById("relicBox");
    const chrRelicBtn = document.getElementById("RelicBtn");
    const closeRulesBtn = document.querySelector(".close-btn");
    const closeRelicBtn = document.querySelector(".closed-btn");

    readMeBtn.addEventListener("click", function (event) {
        event.preventDefault();

        if (rulesBox.classList.contains("show")) {
            rulesBox.classList.add("hide");
            setTimeout(() => {
                rulesBox.classList.remove("show", "hide");
            }, 300);
        } else {
            if (relicBox.classList.contains("show")) {
                relicBox.classList.add("hide");
                setTimeout(() => {
                    relicBox.classList.remove("show", "hide");
                    rulesBox.classList.add("show");
                }, 100);
            } else {
                rulesBox.classList.add("show");
            }
        }
    });

    chrRelicBtn.addEventListener("click", function (event) {
        event.preventDefault();

        if (relicBox.classList.contains("show")) {
            relicBox.classList.add("hide");
            setTimeout(() => {
                relicBox.classList.remove("show", "hide");
            }, 300);
        } else {
            if (rulesBox.classList.contains("show")) {
                rulesBox.classList.add("hide");
                setTimeout(() => {
                    rulesBox.classList.remove("show", "hide");
                    relicBox.classList.add("show");
                }, 100);
            } else {
                relicBox.classList.add("show");
            }
        }
    });

    closeRulesBtn.addEventListener("click", function () {
        rulesBox.classList.add("hide");
        setTimeout(() => {
            rulesBox.classList.remove("show", "hide");
        }, 300);
    });

    closeRelicBtn.addEventListener("click", function () {
        relicBox.classList.add("hide");
        setTimeout(() => {
            relicBox.classList.remove("show", "hide");
        }, 300);
    });
});

// Intro Loading Screen
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.loading-screen').style.opacity = '0';
        document.querySelector('.loading-screen').style.transition = 'opacity 1s ease';

        if (audioEnabled) {
            fadeOutAudio(audio, 550);
        }

        setTimeout(() => {
            document.querySelector('.loading-screen').style.display = 'none';
        }, 1000);
    }, 10500); 
});

const audio = document.getElementById("introAudio");
const audioBtn = document.getElementById("audioToggleBtn");

let audioEnabled = false;

audioBtn.addEventListener("click", () => {
    if (!audioEnabled) {
        audio.volume = 1;
        audio.play().catch(e => console.log("Autoplay blocked:", e));
        audioEnabled = true;
        audioBtn.textContent = "🔇 Mute Audio";
    } else {
        audio.pause();
        audioEnabled = false;
        audioBtn.textContent = "🔊 Enable Audio";
    }
});

// Fade out function
function fadeOutAudio(audioElement, duration = 1000) {
    let fadeInterval = 50;
    let fadeStep = audio.volume / (duration / fadeInterval);

    const fade = setInterval(() => {
        if (audio.volume > fadeStep) {
            audio.volume = Math.max(0, audio.volume - fadeStep);
        } else {
            audio.volume = 0;
            audio.pause();
            clearInterval(fade);
        }
    }, fadeInterval);
}

// Clock
function updateClock() {
    const now = new Date();
  
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetHours = offsetMinutes / 60;
    const gmtOffset = `GMT${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  
    const timeZoneAbbr = gmtOffsetAbbreviationMap[gmtOffset] || gmtOffset;
  
    const clock = document.getElementById('clock');
    clock.textContent = `${time} ${timeZoneAbbr}`;
  }
  
  const gmtOffsetAbbreviationMap = {
    'GMT+7': 'WIB',
    'GMT+8': 'WITA',
    'GMT+9': 'WIT',
  };
  
  setInterval(updateClock, 1000);
  updateClock();
  
  function toggleRelic(rowNumber) {
    const relicContents = document.querySelectorAll('.relic-content');
    const selectedrelic = document.getElementById(`relicContent${rowNumber}`);

    relicContents.forEach(content => {
        if (content.classList.contains('show')) {
            content.classList.remove('show');
            setTimeout(() => {
                content.style.display = 'none';
            }, 300);
        }
    });

    setTimeout(() => {
        selectedrelic.style.display = 'block';
        setTimeout(() => {
            selectedrelic.classList.add('show');
        }, 10);
    }, 300);
}