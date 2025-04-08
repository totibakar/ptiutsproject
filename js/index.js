const slider = document.querySelector(".slider");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerName");

let currentIndex = 0;
const characterWidth = 114 + 20; // Width of one character
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

// Dropdown menu
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
});

// Readme popup
document.addEventListener("DOMContentLoaded", function () {
    const readMeBtn = document.getElementById("readMeBtn");
    const rulesBox = document.getElementById("rulesBox");
    const closeRulesBtn = document.querySelector(".close-btn");

    function closeRulesBox() {
        rulesBox.classList.add("hide");
        setTimeout(() => {
            rulesBox.classList.remove("show", "hide");
        }, 300);
    }

    readMeBtn.addEventListener("click", function (event) {
        event.preventDefault();

        if (rulesBox.classList.contains("show")) {
            closeRulesBox();
        } else {
            rulesBox.classList.add("show");
        }
    });

    closeRulesBtn.addEventListener("click", closeRulesBox);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && rulesBox.classList.contains("show")) {
            closeRulesBox();
        }
    });
});

// Intro
window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.loading-screen').style.opacity = '0';
        document.querySelector('.loading-screen').style.transition = 'opacity 1s ease';

        setTimeout(() => {
            document.querySelector('.loading-screen').style.display = 'none';
        }, 1000);
    }, 7500); // 5s moveLine + 0.5s delay + 2s growLineCenter
});

// Clock
function updateClock() {
    const now = new Date();
  
    // Format time
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  
    // Get timezone offset in minutes
    const offsetMinutes = -now.getTimezoneOffset();
    const offsetHours = offsetMinutes / 60;
    const gmtOffset = `GMT${offsetHours >= 0 ? '+' : ''}${offsetHours}`;
  
    // Map GMT offset to abbreviation
    const timeZoneAbbr = gmtOffsetAbbreviationMap[gmtOffset] || gmtOffset;
  
    // Update DOM
    const clock = document.getElementById('clock');
    clock.textContent = `${time} ${timeZoneAbbr}`;
  }
  
  const gmtOffsetAbbreviationMap = {
    'GMT+9': 'JST',
    'GMT+7': 'WIB',
    'GMT+8': 'WITA',
    'GMT+0': 'GMT',
  };
  
  setInterval(updateClock, 1000);
  updateClock();
  