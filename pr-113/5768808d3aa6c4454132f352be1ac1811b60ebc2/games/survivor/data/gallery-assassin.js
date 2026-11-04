// Complete assassin trial Boss definition.
SURVIVOR_DEFAULTS.gallery.bosses.push({
  "id": "assassin",
  "name": "雙刃刺客",
  "artId": "character/assassin",
  "hp": 1600,
  "radius": 28,
  "speed": 100,
  "phases": [
    {
      "threshold": 1,
      "speed": 1
    },
    {
      "threshold": 0.5,
      "speed": 1.15
    }
  ],
  "weakpoint": {
    "version": 1,
    "armorMultiplier": 0.2,
    "criticalMultiplier": 3,
    "warning": 0.15,
    "closing": 0.25,
    "artId": "effect/weakpoint-red",
    "postureChargeMultiplier": 1.5,
    "parts": [
      {
        "id": "core",
        "anchor": "weakpoint",
        "radiusScale": 1,
        "angleDegrees": 0,
        "arcDegrees": 360,
        "mode": "any",
        "duration": 2.2,
        "conditions": [
          {
            "type": "posture-break"
          }
        ]
      }
    ]
  },
  "moves": [
    {
      "id": "blade-combo",
      "name": "四拍雙刃連斬",
      "minPhase": 1,
      "weight": 1,
      "ai": {
        "minDistance": 0,
        "maxDistance": 148,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      },
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
              "radius": 130,
              "angle": 100
            },
            "timing": {
              "windup": 0.85,
              "active": 0.1,
              "recovery": 0.9,
              "cooldown": 0.5
            },
            "effect": {
              "damage": 12,
              "speed": 0,
              "sequence": {
                "count": 4,
                "phaseCount": 5
              }
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "blade-combo"
            }
          }
        ]
      }
    },
    {
      "id": "shadowstep",
      "name": "影步背刺",
      "minPhase": 1,
      "weight": 1,
      "ai": {
        "minDistance": 0,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 2,
        "offscreen": true
      },
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
              "radius": 110,
              "angle": 32
            },
            "timing": {
              "windup": 1.1,
              "active": 0.12,
              "recovery": 1,
              "cooldown": 0.5
            },
            "effect": {
              "damage": 18,
              "speed": 0,
              "relocate": {
                "mode": "behind",
                "distance": 72,
                "vanish": 0.35,
                "flash": 0.25
              }
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "shadowstep"
            }
          }
        ]
      }
    },
    {
      "id": "kunai-slide",
      "name": "苦無與橫向滑步",
      "minPhase": 1,
      "weight": 1,
      "ai": {
        "minDistance": 0,
        "maxDistance": 600,
        "angleWeight": 0,
        "phaseWeight": 0,
        "offscreen": true
      },
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
              "radius": 200,
              "angle": 70
            },
            "timing": {
              "windup": 0.9,
              "active": 0.5,
              "recovery": 0.7,
              "cooldown": 0.5
            },
            "effect": {
              "damage": 10,
              "speed": 0,
              "projectiles": {
                "count": 5,
                "speed": 230,
                "life": 2,
                "radius": 6,
                "artId": "move/kunai"
              },
              "slide": {
                "speed": 130
              }
            },
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "kunai-slide"
            }
          }
        ]
      }
    }
  ]
});
