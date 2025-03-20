const slider = document.querySelector(".slider");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerName");

let currentIndex = 0;
const characterWidth = 250; // Width of one character
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

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!menuBtn.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove("show");
        }
    });

    // Optional: Close on ESC key press
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            dropdown.classList.remove("show");
        }
    });
});
