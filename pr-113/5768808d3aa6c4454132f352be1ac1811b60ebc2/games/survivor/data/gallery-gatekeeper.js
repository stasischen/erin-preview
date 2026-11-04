// Complete gatekeeper trial Boss definition.
SURVIVOR_DEFAULTS.gallery.bosses.push({
  "id": "gatekeeper",
  "name": "巨斧守門人",
  "artId": "character/gatekeeper",
  "hp": 1800,
  "radius": 34,
  "speed": 85,
  "phases": [
    {
      "threshold": 1,
      "speed": 1
    },
    {
      "threshold": 0.5,
      "speed": 1.25
    }
  ],
  "moves": [
    {
      "id": "shield",
      "name": "盾牌重擊",
      "minPhase": 1,
      "weight": 1,
      "blocks": {
        "version": 1,
        "moves": [
          {
            "id": "move",
            "trigger": {
              "event": "onSelect"
            },
            "shape": {
              "type": "sector",
              "radius": 105,
              "angle": 100
            },
            "timing": {
              "windup": 0.95,
              "active": 0.18,
              "recovery": 0.8,
              "cooldown": 0.5
            },
            "effect": {
              "damage": 12,
              "speed": 0
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "shield"
            }
          }
        ]
      },
      "ai": {
        "minDistance": 0,
        "maxDistance": 123,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      }
    },
    {
      "id": "axe",
      "name": "巨斧兩段橫掃",
      "minPhase": 1,
      "weight": 1,
      "blocks": {
        "version": 1,
        "moves": [
          {
            "id": "move",
            "trigger": {
              "event": "onSelect"
            },
            "shape": {
              "type": "sector",
              "radius": 165,
              "angle": 150
            },
            "timing": {
              "windup": 1,
              "active": 0.2,
              "recovery": 0.55,
              "cooldown": 0.7
            },
            "effect": {
              "damage": 15,
              "speed": 0
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "axe"
            }
          }
        ]
      },
      "ai": {
        "minDistance": 0,
        "maxDistance": 183,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      }
    },
    {
      "id": "leap",
      "name": "跳躍重壓",
      "minPhase": 1,
      "weight": 1,
      "blocks": {
        "version": 1,
        "moves": [
          {
            "id": "move",
            "trigger": {
              "event": "onSelect"
            },
            "shape": {
              "type": "circle",
              "radius": 100,
              "angle": 360
            },
            "timing": {
              "windup": 1.2,
              "active": 0.45,
              "recovery": 1,
              "cooldown": 0.7
            },
            "effect": {
              "damage": 18,
              "speed": 0
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "leap"
            }
          }
        ]
      },
      "ai": {
        "minDistance": 0,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      }
    },
    {
      "id": "spin",
      "name": "旋風斬",
      "minPhase": 2,
      "weight": 1,
      "blocks": {
        "version": 1,
        "moves": [
          {
            "id": "move",
            "trigger": {
              "event": "onSelect"
            },
            "shape": {
              "type": "circle",
              "radius": 110,
              "angle": 360
            },
            "timing": {
              "windup": 1.1,
              "active": 3,
              "recovery": 1,
              "cooldown": 0.8
            },
            "effect": {
              "damage": 10,
              "speed": 65
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "spin"
            }
          }
        ]
      },
      "ai": {
        "minDistance": 0,
        "maxDistance": 128,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      }
    },
    {
      "id": "charge",
      "name": "持盾衝鋒",
      "minPhase": 1,
      "weight": 1,
      "blocks": {
        "version": 1,
        "moves": [
          {
            "id": "move",
            "trigger": {
              "event": "onSelect"
            },
            "shape": {
              "type": "line",
              "radius": 45,
              "angle": 0
            },
            "timing": {
              "windup": 1.25,
              "active": 2,
              "recovery": 1,
              "cooldown": 0.8
            },
            "effect": {
              "damage": 16,
              "speed": 440
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "charge"
            }
          }
        ]
      },
      "ai": {
        "minDistance": 70,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      }
    }
  ],
  "weakpoint": {
    "version": 1,
    "armorMultiplier": 0.2,
    "criticalMultiplier": 3,
    "warning": 0.15,
    "closing": 0.25,
    "parts": [
      {
        "id": "back",
        "anchor": "weakpoint",
        "radiusScale": 1,
        "angleDegrees": 180,
        "arcDegrees": 120,
        "mode": "any",
        "duration": 2,
        "conditions": [
          {
            "type": "behind"
          }
        ]
      },
      {
        "id": "core",
        "anchor": "weakpoint",
        "radiusScale": 1,
        "angleDegrees": 0,
        "arcDegrees": 360,
        "mode": "any",
        "duration": 2,
        "conditions": [
          {
            "type": "wall-stun"
          },
          {
            "type": "posture-break"
          }
        ]
      }
    ]
  }
});
