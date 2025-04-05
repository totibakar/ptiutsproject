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

document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector(".menu-btn");
    const dropdown = document.querySelector(".dropdown");

    // Toggle dropdown when clicking the button
    menuBtn.addEventListener("click", function (event) {
        event.stopPropagation(); // Prevents immediate closing
        dropdown.classList.toggle("show");
    });

    // Prevent dropdown from closing when clicking inside
    dropdown.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    // Optional: Close on ESC key press
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            dropdown.classList.remove("show");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const readMeBtn = document.getElementById("readMeBtn");
    const rulesBox = document.getElementById("rulesBox");
    const loreBox = document.getElementById("loreBox");
    const chrLoreBtn = document.getElementById("chrLoreBtn");
    const closeRulesBtn = document.querySelector(".close-btn");
    const closeLoreBtn = document.querySelector(".closed-btn");

    readMeBtn.addEventListener("click", function (event) {
        event.preventDefault();
    
        if (loreBox.classList.contains("show")) {
            loreBox.classList.add("hide");
            setTimeout(() => {
                loreBox.classList.remove("show", "hide");
                rulesBox.classList.add("show");
            }, 100);
        } else {
            rulesBox.classList.add("show");
        }
    });
    
    chrLoreBtn.addEventListener("click", function (event) {
        event.preventDefault();
    
        if (rulesBox.classList.contains("show")) {
            rulesBox.classList.add("hide");
            setTimeout(() => {
                rulesBox.classList.remove("show", "hide");
                loreBox.classList.add("show");
            }, 100);
        } else {
            loreBox.classList.add("show");
        }
    });

    closeRulesBtn.addEventListener("click", function () {
        // Add 'hide' class to start animation, then remove 'show' after animation
        rulesBox.classList.add("hide");
        setTimeout(() => {
            rulesBox.classList.remove("show", "hide");
        }, 300); // Matches CSS transition time
    });

    closeLoreBtn.addEventListener("click", function () {
            // Add 'hide' class to start animation, then remove 'show' after animation
            loreBox.classList.add("hide");
            setTimeout(() => {
                loreBox.classList.remove("show", "hide");
            }, 300); // Matches CSS transition time
        });
});



window.addEventListener('load', () => {
    setTimeout(() => {
        document.querySelector('.loading-screen').style.opacity = '0';
        document.querySelector('.loading-screen').style.transition = 'opacity 1s ease';

        setTimeout(() => {
            document.querySelector('.loading-screen').style.display = 'none';
        }, 1000);
    }, 7500); // 5s moveLine + 0.5s delay + 2s growLineCenter
});

function toggleLore(rowNumber) {
    const loreContents = document.querySelectorAll('.lore-content');
    const selectedLore = document.getElementById(`loreContent${rowNumber}`);

    loreContents.forEach(content => {
        if (content.classList.contains('show')) {
            content.classList.remove('show');
            setTimeout(() => {
                content.style.display = 'none';
            }, 300);
        }
    });

    setTimeout(() => {
        selectedLore.style.display = 'block';
        setTimeout(() => {
            selectedLore.classList.add('show');
        }, 10); // Biar transisi fade jalan
    }, 300); // Tunggu fade out selesai
}