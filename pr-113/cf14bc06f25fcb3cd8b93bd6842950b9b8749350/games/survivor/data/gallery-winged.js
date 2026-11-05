// Complete winged trial Boss definition.
SURVIVOR_DEFAULTS.gallery.bosses.push({
  "id": "winged",
  "name": "羽翼古神",
  "artId": "character/winged",
  "hp": 2200,
  "radius": 35,
  "speed": 75,
  "phases": [
    {
      "threshold": 1,
      "speed": 1
    },
    {
      "threshold": 0.5,
      "speed": 1.2
    }
  ],
  "moves": [
    {
      "id": "dive",
      "name": "俯衝轟炸",
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
              "radius": 110,
              "angle": 0,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 0.65,
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
              "pose": "dive"
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
      "id": "feathers",
      "name": "羽毛扇形噴射",
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
              "radius": 180,
              "angle": 90,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 0.3,
              "recovery": 0.9,
              "cooldown": 0.6
            },
            "effect": {
              "damage": 12,
              "speed": 200,
              "duration": 4,
              "interval": 0.6,
              "count": 7,
              "slow": 0.55,
              "rotation": 1.1
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "feathers"
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
      "id": "tornado",
      "name": "追蹤龍捲風",
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
              "radius": 36,
              "angle": 0,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 0.3,
              "recovery": 0.9,
              "cooldown": 0.6
            },
            "effect": {
              "damage": 12,
              "speed": 65,
              "duration": 5,
              "interval": 0.6,
              "count": 7,
              "slow": 0.55,
              "rotation": 1.1
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "tornado"
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
      "id": "spiral",
      "name": "螺旋羽毛彈幕",
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
              "type": "ring",
              "radius": 180,
              "angle": 65,
              "thickness": 12
            },
            "timing": {
              "windup": 1.1,
              "active": 3.2,
              "recovery": 0.9,
              "cooldown": 0.6
            },
            "effect": {
              "damage": 12,
              "speed": 160,
              "duration": 4,
              "interval": 0.5,
              "count": 19,
              "slow": 0.55,
              "rotation": 1.1
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "spiral"
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
