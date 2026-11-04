// Authoritative default stages data; Maker edits copies through SurvivorData.
SURVIVOR_DEFAULTS.waves = [
  {
    "start": 0,
    "jaben": 1,
    "otsubon": 0,
    "every": 1.84
  },
  {
    "start": 20,
    "jaben": 0.8,
    "otsubon": 0.2,
    "every": 1.495
  },
  {
    "start": 35,
    "jaben": 0.58,
    "otsubon": 0.42,
    "every": 1.15
  },
  {
    "start": 60,
    "jaben": 0.45,
    "otsubon": 0.55,
    "every": 0.8625
  },
  {
    "start": 90,
    "jaben": 0.35,
    "otsubon": 0.65,
    "every": 0.6325
  },
  {
    "start": 105,
    "jaben": 0.35,
    "otsubon": 0.65,
    "every": 0.5175
  }
];

SURVIVOR_DEFAULTS.stages = [
  {
    "id": "classroom",
    "name": "糖果森林",
    "background": "candy-forest",
    "decorationDensity": 0.25,
    "enemyHealthScale": 1,
    "enemySpeedScale": 1,
    "bossHealthScale": 1,
    "waves": [
      {
        "start": 0,
        "jaben": 1,
        "otsubon": 0,
        "every": 1.84
      },
      {
        "start": 20,
        "jaben": 0.8,
        "otsubon": 0.2,
        "every": 1.495
      },
      {
        "start": 35,
        "jaben": 0.58,
        "otsubon": 0.42,
        "every": 1.15
      },
      {
        "start": 60,
        "jaben": 0.45,
        "otsubon": 0.55,
        "every": 0.8625
      },
      {
        "start": 90,
        "jaben": 0.35,
        "otsubon": 0.65,
        "every": 0.6325
      },
      {
        "start": 105,
        "jaben": 0.35,
        "otsubon": 0.65,
        "every": 0.5175
      }
    ]
  },
  {
    "id": "playground",
    "name": "餅乾森林",
    "background": "cookie-forest",
    "decorationDensity": 0.25,
    "enemyHealthScale": 1.12,
    "enemySpeedScale": 1.06,
    "bossHealthScale": 1.12,
    "waves": [
      {
        "start": 0,
        "jaben": 1,
        "otsubon": 0,
        "every": 1.6928
      },
      {
        "start": 20,
        "jaben": 0.8,
        "otsubon": 0.2,
        "every": 1.3754
      },
      {
        "start": 35,
        "jaben": 0.58,
        "otsubon": 0.42,
        "every": 1.058
      },
      {
        "start": 60,
        "jaben": 0.45,
        "otsubon": 0.55,
        "every": 0.7935
      },
      {
        "start": 90,
        "jaben": 0.35,
        "otsubon": 0.65,
        "every": 0.5819
      },
      {
        "start": 105,
        "jaben": 0.35,
        "otsubon": 0.65,
        "every": 0.4761
      }
    ]
  }
];

SURVIVOR_DEFAULTS.elites = {
  "enabled": true,
  "interval": 18,
  "chance": 0.35,
  "limit": 3,
  "sizeScale": 1.25,
  "healthScale": 5,
  "rewardXp": 5,
  "shieldHits": 3,
  "auraRadius": 150,
  "auraSpeed": 1.35,
  "syrupInterval": 0.7,
  "syrupSeconds": 4,
  "syrupRadius": 28,
  "syrupSlow": 0.65,
  "teleportInterval": 7,
  "teleportWarning": 1.2,
  "teleportDistance": 150,
  "abilities": [
    "shield",
    "split",
    "haste",
    "syrup",
    "teleport"
  ]
};

SURVIVOR_DEFAULTS.chocobear = {
  "enabled": true,
  "name": "巧克力大熊",
  "stageFraction": 0.5,
  "hp": 450,
  "armor": 180,
  "radius": 34,
  "speed": 48,
  "damage": 12,
  "slamInterval": 4,
  "slamWarning": 1.2,
  "slamRadius": 82,
  "slamDamage": 18
};

SURVIVOR_DEFAULTS.pacing = {
  "pattern": "alternating",
  "density": 1,
  "strongScale": 1.15,
  "weakScale": 0.7,
  "cycleSeconds": 10,
  "eventCount": 6,
  "eventSeconds": 10,
  "warning": 0.9,
  "chargeSpeed": 330,
  "chargeSeconds": 0.65,
  "fuseSeconds": 2,
  "blastRadius": 85,
  "blastDamage": 18,
  "blastEnemyDamage": 90,
  "shieldRadius": 150,
  "shieldSeconds": 5,
  "shieldHits": 1,
  "themes": {
    "classroom": [
      "jelly",
      "pop-candy"
    ],
    "playground": [
      "pudding",
      "donut"
    ]
  },
  "eventPool": [
    "ring",
    "tide",
    "elite-squad",
    "candy-rain"
  ]
};
