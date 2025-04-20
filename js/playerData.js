const characterData = [
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

const player = {
    x: null,
    y: null,
    width: 32,
    height: 42,
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
    sprites: { idle: [], walk: [], run: [], sit: [] },
    currentFrameImage: null,
    animFrameIndex: 0,
    animTimer: 0,
    framesPerAnimFrame: 24,
    framesPerRunAnimFrame: 12,
    lastMovementTime: 0,
    IDLE_TO_SIT_TIME: 10000,

    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    hunger: 100,
    maxHunger: 100,
    gold: 0,
    damage: 0,
    speed: 0,
    armor: 0,
    relicsFound: new Set(),
    name: "Player",
    characterClass: 0,
    upgrades: []
};

const PASSIVE_HUNGER_DRAIN_RATE = 0.002;
const HP_DRAIN_RATE_STARVATION = 0.02;
const STAMINA_DRAIN_RATE_RUN = 0.4;
const STAMINA_REGEN_RATE = 0.05;

function loadPlayerDataFromMainMenu() {
    const playerName = localStorage.getItem("playerName");
    const characterClass = localStorage.getItem("characterClass");
    
    if (playerName) {
        player.name = playerName;
        console.log(`Loaded player name: ${player.name}`);
    }
    
    if (characterClass !== null) {
        player.characterClass = parseInt(characterClass);
        console.log(`Loaded character class: ${player.characterClass}`);
        
        const selectedCharacter = characterData[player.characterClass];
        if (selectedCharacter) {
            player.maxHp = selectedCharacter.stats.hp;
            player.hp = player.maxHp;
            
            player.maxHunger = selectedCharacter.stats.hunger;
            player.hunger = player.maxHunger;
            
            player.maxStamina = selectedCharacter.stats.stamina;
            player.stamina = player.maxStamina;
            
            player.damage = selectedCharacter.stats.damage;
            player.speed = selectedCharacter.stats.speed;
            player.armor = selectedCharacter.stats.armor;
            
            if (selectedCharacter.bonus.stat === "Intelligence") {
                player.maxHp += 25;
                player.hp = player.maxHp;
            } else if (selectedCharacter.bonus.stat === "Agility") {
                player.speed = Math.round(player.speed * 1.1);
            }
            
            console.log(`Applied character stats and bonuses for ${selectedCharacter.name}`);
            console.log(`HP: ${player.hp}/${player.maxHp}, Hunger: ${player.hunger}/${player.maxHunger}, Stamina: ${player.stamina}/${player.maxStamina}`);
            console.log(`Damage: ${player.damage}, Speed: ${player.speed}, Armor: ${player.armor}`);
        }

        let className = "";
        switch (player.characterClass) {
            case 0: className = "Mage"; break;
            case 1: className = "Mercenary"; break;
            case 2: className = "Ranger"; break;
            case 3: className = "Soldier"; break;
            default: className = "Mage";
        }

        console.log(`Setting loadSpriteFunction for ${className} class`);
        window.loadSpriteFunction = createSpriteLoader(className);
        return window.loadSpriteFunction;
    }
}

function createSpriteLoader(className) {
    return () => {
        console.log(`Loading sprites for ${className} class...`);

        if (className === "Soldier") {
            ['idle', 'walk', 'run', 'sit'].forEach(state => {
                const frameCount = {
                    'idle': 8,
                    'walk': 36,
                    'run': 32,
                    'sit': 4
                };
                
                console.log(`Loading ${frameCount[state]} frames for state: ${state}`);
                player.sprites[state] = [];
                
                for (let i = 1; i <= frameCount[state]; i++) {
                    const img = new Image();
                    const path = `assets/soldier/${state}/${state}${i}.png`;
                    img.src = path;
                    player.sprites[state].push(img);
                    img.onload = window.imageLoaded;
                    img.onerror = () => console.error(`Failed to load sprite: ${path}`);
                }
            });
        } else {
            ['idle', 'walk', 'run', 'sit'].forEach(state => {
                const frameCount = {
                    'idle': 8,
                    'walk': 36,
                    'run': 32,
                    'sit': 4
                };
                
                console.log(`Loading ${frameCount[state]} frames for state: ${state}`);
                player.sprites[state] = [];
                for (let i = 1; i <= frameCount[state]; i++) {
                    const img = new Image();
                    const path = `assets/${className}PC/${className}${state.charAt(0).toUpperCase() + state.slice(1)}/${state}${i}.png`;
                    img.src = path;
                    player.sprites[state].push(img);
                    img.onload = window.imageLoaded;
                    img.onerror = () => console.error(`Failed to load sprite: ${path}`);
                }
            });
        }
    };
}

window.player = player;
window.loadPlayerDataFromMainMenu = loadPlayerDataFromMainMenu;
window.PASSIVE_HUNGER_DRAIN_RATE = PASSIVE_HUNGER_DRAIN_RATE;
window.HP_DRAIN_RATE_STARVATION = HP_DRAIN_RATE_STARVATION;
window.STAMINA_DRAIN_RATE_RUN = STAMINA_DRAIN_RATE_RUN;
window.STAMINA_REGEN_RATE = STAMINA_REGEN_RATE;