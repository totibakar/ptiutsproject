const slider = document.querySelector(".slider");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const startBtn = document.getElementById("startBtn");
const playerNameInput = document.getElementById("playerName");
const hoverSound = new Audio("assets/sound/HoverMouse.wav");

let currentIndex = 0;
const characterWidth = 200;
const totalCharacters = document.querySelectorAll(".character").length;

const characters = [
    {
        name: "Mage",
        description: "A powerful spellcaster from the Academy of Arcane Arts in Elendor. Specializes in elemental magic and can summon devastating area attacks. Weaker in physical combat but excels in solving ancient puzzles.",
        stats: {
            hp: 70,
            hunger: 80, 
            stamina: 80,
            damage: 18,
            speed: 1,
            armor: 10
        },
        bonus: {
            stat: "Intelligence",
            description: "Magic studies grant +25 HP points"
        },
        sprite: {
            base: "assets/MagePC/MageIdle/idle",
            frames: 8
        }
    },
    {
        name: "Mercenary",
        description: "A battle-hardened warrior who has served in countless conflicts across the Archipelago. Excellent in melee combat with tremendous physical strength. Can withstand heavy damage and excels in close-quarter fights.",
        stats: {
            hp: 100,
            hunger: 75,
            stamina: 85,
            damage: 22,
            speed: 1,
            armor: 25
        },
        bonus: {
            stat: "Strength",
            description: "Combat training grants +15% damage resistance"
        },
        sprite: {
            base: "assets/MercenaryPC/MercenaryIdle/idle",
            frames: 8
        }
    },
    {
        name: "Ranger",
        description: "A skilled hunter from the forests of Eastern Elendor. Masters of stealth and ranged combat. Exceptional mobility allows them to traverse difficult terrain with ease. Keen survival instincts help track hidden treasures.",
        stats: {
            hp: 80,
            hunger: 90,
            stamina: 100,
            damage: 16,
            speed: 1,
            armor: 15
        },
        bonus: {
            stat: "Agility",
            description: "Wilderness skills grant +10% movement speed"
        },
        sprite: {
            base: "assets/RangerPC/RangerIdle/idle",
            frames: 8
        }
    },
    {
        name: "Soldier",
        description: "A disciplined warrior trained in the Royal Army of Elendor. Well-balanced in combat with strong defensive capabilities. Excellent endurance and tactical knowledge make them reliable in extended missions.",
        stats: {
            hp: 90,
            hunger: 100,
            stamina: 90,
            damage: 25,
            speed: 1,
            armor: 20
        },
        bonus: {
            stat: "Endurance",
            description: "Military training grants +20% stamina regeneration"
        },
        sprite: {
            base: "assets/soldier/idle/idle",
            frames: 8
        }
    }
];

function addHoverSoundToButtons() {
    const buttons = document.querySelectorAll('button');
    const menuLinks = document.querySelectorAll('.dropdown a');
    const characterSlots = document.querySelectorAll('.character');
    const relicRows = document.querySelectorAll('.relic-row');
    
    const playHoverSound = () => {
        hoverSound.currentTime = 0;
        hoverSound.play();
    };
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', playHoverSound);
    });
    
    menuLinks.forEach(link => {
        link.addEventListener('mouseenter', playHoverSound);
    });
    
    characterSlots.forEach(slot => {
        slot.addEventListener('mouseenter', playHoverSound);
    });
    
    relicRows.forEach(row => {
        row.addEventListener('mouseenter', playHoverSound);
    });
}

function createCharacterInfoDisplay() {
    const characterWrapper = document.querySelector('.character-wrapper');
    const characterInfo = document.createElement('div');
    characterInfo.className = 'character-info';
    characterInfo.innerHTML = `
        <h2 id="char-name">${characters[0].name}</h2>
        <p id="char-description">${characters[0].description}</p>
        <div class="char-stats">
            <div class="stat">
                <span class="stat-label">HP</span>
                <div class="stat-bar">
                    <div id="hp-fill" class="stat-fill" style="width: ${characters[0].stats.hp}%"></div>
                </div>
                <span class="stat-value">${characters[0].stats.hp}/100</span>
            </div>
            <div class="stat">
                <span class="stat-label">Hunger</span>
                <div class="stat-bar">
                    <div id="hunger-fill" class="stat-fill" style="width: ${characters[0].stats.hunger}%"></div>
                </div>
                <span class="stat-value">${characters[0].stats.hunger}/100</span>
            </div>
            <div class="stat">
                <span class="stat-label">Stamina</span>
                <div class="stat-bar">
                    <div id="stamina-fill" class="stat-fill" style="width: ${characters[0].stats.stamina}%"></div>
                </div>
                <span class="stat-value">${characters[0].stats.stamina}/100</span>
            </div>
            <div class="stat no-bar">
                <span class="stat-label">Attack</span>
                <span class="stat-value-large">${characters[0].stats.damage}</span>
            </div>
            <div class="stat no-bar">
                <span class="stat-label">Speed</span>
                <span class="stat-value-large">Normal</span>
            </div>
            <div class="stat no-bar">
                <span class="stat-label">Armor</span>
                <span class="stat-value-large">${characters[0].stats.armor}</span>
            </div>
        </div>
        <div class="char-bonus">
            <span class="bonus-label">Special Trait: ${characters[0].bonus.stat}</span>
            <p class="bonus-description">${characters[0].bonus.description}</p>
        </div>
    `;
    
    const inputContainer = document.querySelector('.input-container');
    characterWrapper.insertBefore(characterInfo, inputContainer);
}

function updateCharacterInfo() {
    const charData = characters[currentIndex];
    document.getElementById('char-name').textContent = charData.name;
    document.getElementById('char-description').textContent = charData.description;
    
    document.getElementById('hp-fill').style.width = `${charData.stats.hp}%`;
    document.querySelector('.stat:nth-child(1) .stat-value').textContent = `${charData.stats.hp}/100`;
    
    document.getElementById('hunger-fill').style.width = `${charData.stats.hunger}%`;
    document.querySelector('.stat:nth-child(2) .stat-value').textContent = `${charData.stats.hunger}/100`;
    
    document.getElementById('stamina-fill').style.width = `${charData.stats.stamina}%`;
    document.querySelector('.stat:nth-child(3) .stat-value').textContent = `${charData.stats.stamina}/100`;
    
    document.querySelector('.stat:nth-child(4) .stat-value-large').textContent = `${charData.stats.damage}`;
    document.querySelector('.stat:nth-child(5) .stat-value-large').textContent = `Normal`;
    document.querySelector('.stat:nth-child(6) .stat-value-large').textContent = `${charData.stats.armor}`;
    
    document.querySelector('.bonus-label').textContent = `Special Trait: ${charData.bonus.stat}`;
    document.querySelector('.bonus-description').textContent = charData.bonus.description;
}

let currentFrame = 1;
let animInterval;

function startCharacterAnimation() {
    if (animInterval) clearInterval(animInterval);
    
    const character = characters[currentIndex];
    const characterImg = document.querySelectorAll('.character')[currentIndex];
    currentFrame = 1;
    
    animInterval = setInterval(() => {
        currentFrame = currentFrame % character.sprite.frames + 1;
        characterImg.src = `${character.sprite.base}${currentFrame}.png`;
    }, 150);
}

function updateSlider() {
    if (currentIndex < 0) {
        currentIndex = totalCharacters - 1;
    } else if (currentIndex >= totalCharacters) {
        currentIndex = 0;
    }
    
    const characterSlots = document.querySelectorAll('.character-slot');
    characterSlots.forEach((slot, index) => {
        if (index === currentIndex) {
            slot.style.display = 'block';
        } else {
            slot.style.display = 'none';
        }
    });
    
    updateCharacterInfo();
    startCharacterAnimation();
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
        localStorage.setItem("playerName", playerName);
        localStorage.setItem("characterClass", currentIndex);
        
        window.location.href = "arena.html";
    }
});

document.addEventListener("DOMContentLoaded", function () {
    createCharacterInfoDisplay();
    
    startCharacterAnimation();
    
    addHoverSoundToButtons();
    
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

window.addEventListener('load', () => {
    const audio = document.getElementById("introAudio");
    if (audio) {
        audio.volume = 1;
        audio.play().catch(e => console.log("Autoplay blocked:", e));
    }
    
    setTimeout(() => {
        document.querySelector('.loading-screen').style.opacity = '0';
        document.querySelector('.loading-screen').style.transition = 'opacity 1s ease';

        if (audio) {
            fadeOutAudio(audio, 550);
        }

        setTimeout(() => {
            document.querySelector('.loading-screen').style.display = 'none';
        }, 1000);
    }, 3000); 
});

function fadeOutAudio(audioElement, duration = 1000) {
    let fadeInterval = 50;
    let fadeStep = audioElement.volume / (duration / fadeInterval);

    const fade = setInterval(() => {
        if (audioElement.volume > fadeStep) {
            audioElement.volume = Math.max(0, audioElement.volume - fadeStep);
        } else {
            audioElement.volume = 0;
            audioElement.pause();
            clearInterval(fade);
        }
    }, fadeInterval);
}

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