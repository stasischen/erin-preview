// Authoritative default boss data; Maker edits copies through SurvivorData.
SURVIVOR_DEFAULTS.boss = {
  "ai": {
    "rules": [
      {
        "moveId": "words",
        "weight": 1,
        "minDistance": 200,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "chalk",
        "weight": 1,
        "minDistance": 200,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "dash",
        "weight": 1,
        "minDistance": 200,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "rain",
        "weight": 1,
        "minDistance": 0,
        "maxDistance": 200,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "call",
        "weight": 1,
        "minDistance": 0,
        "maxDistance": 200,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "summon",
        "weight": 1,
        "minDistance": 200,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "ring",
        "weight": 1,
        "minDistance": 0,
        "maxDistance": 200,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "chalk-wall",
        "weight": 1,
        "minDistance": 200,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "shrinking-ring",
        "weight": 1,
        "minDistance": 0,
        "maxDistance": 200,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "podium-leap",
        "weight": 1,
        "minDistance": 0,
        "maxDistance": 10000,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      },
      {
        "moveId": "chalk-snipe",
        "weight": 1,
        "minDistance": 0,
        "maxDistance": 10000,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      },
      {
        "moveId": "board-barriers",
        "weight": 1,
        "minDistance": 200,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "eraser-combo",
        "weight": 1,
        "minDistance": 200,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      },
      {
        "moveId": "tracking-call",
        "weight": 1,
        "minDistance": 0,
        "maxDistance": 200,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": false
      }
    ]
  },
  "posture": {
    "window": 0.2,
    "maximum": 100,
    "dodgeGain": 30,
    "recoveryGain": 12,
    "interruptGain": 22,
    "decay": 6,
    "stunSeconds": 2.5,
    "chargeBonus": 0.5,
    "damageMultiplier": 3,
    "heal": 4
  },
  "name": "老師",
  "hp": 2000,
  "speed": 70,
  "radius": 32,
  "phases": [
    {
      "threshold": 1,
      "rest": 1.7,
      "combo": null,
      "speed": 70
    },
    {
      "threshold": 0.66,
      "rest": 1.2,
      "combo": "words",
      "speed": 90
    },
    {
      "threshold": 0.33,
      "rest": 0.6,
      "combo": "chalk",
      "speed": 110
    }
  ],
  "moves": [
    {
      "id": "words",
      "name": "發射國字",
      "kind": "words",
      "warning": 0.9,
      "minPhase": 1,
      "damage": 12,
      "speed": 135,
      "count": 3,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 145,
      "duration": 0.3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "chalk",
      "name": "粉筆連射",
      "kind": "chalk",
      "warning": 0.9,
      "minPhase": 1,
      "damage": 12,
      "speed": 170,
      "count": 4,
      "phaseCount": 1,
      "spread": 0.24,
      "radius": 145,
      "duration": 0.7,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "dash",
      "name": "黑板擦衝撞",
      "kind": "dash",
      "warning": 0.9,
      "minPhase": 1,
      "damage": 12,
      "speed": 420,
      "count": 1,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 145,
      "duration": 0.3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 450,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "rain",
      "name": "考卷雨",
      "kind": "rain",
      "warning": 0.9,
      "minPhase": 1,
      "damage": 12,
      "speed": 135,
      "count": 2,
      "phaseCount": 1,
      "spread": 0.28,
      "radius": 34,
      "duration": 0.3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "call",
      "name": "點名",
      "kind": "call",
      "warning": 0.9,
      "minPhase": 1,
      "damage": 12,
      "speed": 135,
      "count": 1,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 48,
      "duration": 0.3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "summon",
      "name": "叫小怪",
      "kind": "summon",
      "warning": 0.9,
      "minPhase": 1,
      "damage": 12,
      "speed": 135,
      "count": 1,
      "phaseCount": 1,
      "spread": 0.28,
      "radius": 145,
      "duration": 0.3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "ring",
      "name": "寫黑板罰站",
      "kind": "ring",
      "warning": 0.9,
      "minPhase": 1,
      "damage": 12,
      "speed": 135,
      "count": 1,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 145,
      "duration": 1.6,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "chalk-wall",
      "name": "粉筆牆",
      "kind": "wall",
      "warning": 1.2,
      "minPhase": 1,
      "damage": 12,
      "speed": 240,
      "count": 1,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 10,
      "duration": 3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "shrinking-ring",
      "name": "衝刺縮圈",
      "kind": "cage",
      "warning": 1.2,
      "minPhase": 2,
      "damage": 12,
      "speed": 135,
      "count": 1,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 145,
      "duration": 1.6,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "podium-leap",
      "name": "跳上講台",
      "kind": "leap",
      "warning": 1,
      "minPhase": 1,
      "damage": 12,
      "speed": 135,
      "count": 1,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 90,
      "duration": 0.7,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "chalk-snipe",
      "name": "粉筆狙擊",
      "kind": "sniper",
      "warning": 0.8,
      "minPhase": 1,
      "damage": 12,
      "speed": 420,
      "count": 1,
      "phaseCount": 0,
      "spread": 0,
      "radius": 145,
      "duration": 0.1,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "board-barriers",
      "name": "黑板封路",
      "kind": "barriers",
      "warning": 1,
      "minPhase": 1,
      "damage": 12,
      "speed": 135,
      "count": 1,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 100,
      "duration": 3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 110,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "eraser-combo",
      "name": "黑板擦連衝",
      "kind": "combo",
      "warning": 0.6,
      "minPhase": 2,
      "damage": 12,
      "speed": 420,
      "count": 2,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 145,
      "duration": 0.3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 450,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    },
    {
      "id": "tracking-call",
      "name": "點名追蹤",
      "kind": "tracking",
      "warning": 1.5,
      "minPhase": 3,
      "damage": 12,
      "speed": 135,
      "count": 1,
      "phaseCount": 0,
      "spread": 0.28,
      "radius": 48,
      "duration": 0.3,
      "pulse": 0.24,
      "gap": 1.8,
      "distance": 300,
      "feedback": {
        "move": {
          "level": "small",
          "hitStop": 1,
          "shake": 1
        }
      }
    }
  ],
  "combat": {
    "nearDistance": 200,
    "farDistance": 600,
    "pursuitDistance": 800,
    "pursuitMultiplier": 2,
    "healthPerUpgrade": 350,
    "leapRecovery": 0.8,
    "leapPush": 60,
    "trackingSeconds": 1,
    "lockSeconds": 0.5,
    "phaseWordsSpeed": 200,
    "phaseChalkSpeed": 240
  },
  "weakpoint": {
    "version": 1,
    "armorMultiplier": 0.2,
    "criticalMultiplier": 3,
    "warning": 0.15,
    "closing": 0.25,
    "parts": [
      {
        "id": "core",
        "anchor": "weakpoint",
        "radiusScale": 1,
        "angleDegrees": 0,
        "arcDegrees": 360,
        "mode": "any",
        "duration": 1.5,
        "conditions": [
          {
            "type": "recovery"
          },
          {
            "type": "posture-break"
          }
        ]
      }
    ]
  }
};

SURVIVOR_DEFAULTS.bossZone = {
  "enabled": true,
  "steps": 3,
  "speed": 40,
  "damage": 4,
  "initialRadius": 600,
  "finalRadius": 180,
  "warning": 4
};

SURVIVOR_DEFAULTS.bossTuning = {
  "warningSeconds": 0.9,
  "rests": [
    1.7,
    1.2,
    0.8
  ],
  "phasePause": 1,
  "damage": 12,
  "chalkSpeed": 170,
  "dashSpeed": 420,
  "dashDistance": 300,
  "rainRadius": 34,
  "callRadius": 48,
  "ringRadius": 145,
  "ringGap": 1.8,
  "ringSeconds": 1.6,
  "hazardLimit": 8,
  "shakeSeconds": 0.18,
  "shakePixels": 3
};
