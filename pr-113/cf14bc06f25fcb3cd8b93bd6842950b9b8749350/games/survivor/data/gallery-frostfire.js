// Complete frostfire trial Boss definition.
SURVIVOR_DEFAULTS.gallery.bosses.push({
  "id": "frostfire",
  "name": "雙子霜火",
  "artId": "character/frost-twin",
  "hp": 1250,
  "radius": 30,
  "speed": 65,
  "phases": [
    {
      "threshold": 1,
      "speed": 1
    },
    {
      "threshold": 0.5,
      "speed": 1.4
    }
  ],
  "moves": [
    {
      "id": "frost-dash",
      "name": "霜之衝刺",
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
              "radius": 40,
              "angle": 0,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 0.7,
              "recovery": 0.9,
              "cooldown": 0.6
            },
            "effect": {
              "damage": 12,
              "speed": 440,
              "duration": 2.8,
              "interval": 0.14,
              "count": 7,
              "slow": 0.55,
              "rotation": 1.1
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "frost-dash"
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
      "id": "nova",
      "name": "火焰新星",
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
              "type": "ring",
              "radius": 180,
              "angle": 80,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 1.6,
              "recovery": 0.9,
              "cooldown": 0.6
            },
            "effect": {
              "damage": 12,
              "speed": 140,
              "duration": 4,
              "interval": 0.6,
              "count": 7,
              "slow": 0.55,
              "rotation": 1.1
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "nova"
            }
          }
        ]
      },
      "ai": {
        "minDistance": 0,
        "maxDistance": 198,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      }
    },
    {
      "id": "cross",
      "name": "十字光束",
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
              "type": "cross",
              "radius": 180,
              "angle": 0,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 1.4,
              "recovery": 0.9,
              "cooldown": 0.6
            },
            "effect": {
              "damage": 12,
              "speed": 0,
              "duration": 4,
              "interval": 0.6,
              "count": 7,
              "slow": 0.55,
              "rotation": 1.5707963267948966
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "cross"
            }
          }
        ]
      },
      "ai": {
        "minDistance": 0,
        "maxDistance": 198,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      }
    },
    {
      "id": "icefall",
      "name": "天降冰錐",
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
              "radius": 65,
              "angle": 0,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 0.2,
              "recovery": 0.9,
              "cooldown": 0.6
            },
            "effect": {
              "damage": 12,
              "speed": 0,
              "duration": 4,
              "interval": 0.6,
              "count": 7,
              "slow": 0.55,
              "rotation": 1.1
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "icefall"
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
      "id": "meteor",
      "name": "隕石",
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
              "radius": 80,
              "angle": 0,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 0.2,
              "recovery": 0.9,
              "cooldown": 0.6
            },
            "effect": {
              "damage": 12,
              "speed": 0,
              "duration": 4,
              "interval": 0.6,
              "count": 7,
              "slow": 0.55,
              "rotation": 1.1
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "meteor"
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
    }
  ]
});
