// Authoritative default enemies data; Maker edits copies through SurvivorData.
SURVIVOR_DEFAULTS.enemies = [
  {
    "id": "jaben",
    "name": "小熊軟糖",
    "spriteId": "gummy-bear",
    "color": "#d58b55",
    "speed": 75,
    "shadowSize": 0.9,
    "radius": 17,
    "damage": 15,
    "hp": 120,
    "behavior": "chase",
    "attack": {
      "type": "projectile",
      "interval": 3,
      "speed": 110,
      "damage": 6,
      "radius": 12,
      "count": 1,
      "spread": 0.2,
      "level": 8
    },
    "phaseAttack": {
      "enabled": false,
      "shape": "projectiles",
      "radius": 10,
      "innerRadius": 35,
      "length": 280,
      "angle": 110,
      "windup": 0.9,
      "active": 2,
      "recovery": 0.65,
      "cooldown": 3,
      "damage": 6,
      "triggerDistance": 340,
      "speed": 140,
      "count": 1,
      "radial": false,
      "gapDegrees": 70
    },
    "mass": 1,
    "feedback": {
      "phase": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "legacy": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "otsubon",
    "name": "蒲公英",
    "spriteId": "dandelion",
    "color": "#a879d8",
    "speed": 105,
    "shadowSize": 0.9,
    "radius": 15,
    "damage": 12,
    "hp": 70,
    "behavior": "fast",
    "attack": {
      "type": "projectile",
      "interval": 5,
      "speed": 110,
      "damage": 6,
      "radius": 12,
      "count": 1,
      "spread": 0.2,
      "level": 8
    },
    "phaseAttack": {
      "enabled": false,
      "shape": "projectiles",
      "radius": 10,
      "innerRadius": 35,
      "length": 280,
      "angle": 110,
      "windup": 0.9,
      "active": 2,
      "recovery": 0.65,
      "cooldown": 3,
      "damage": 6,
      "triggerDistance": 340,
      "speed": 140,
      "count": 1,
      "radial": false,
      "gapDegrees": 70
    },
    "mass": 1,
    "feedback": {
      "phase": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "legacy": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "pudding",
    "name": "布丁",
    "spriteId": "pudding",
    "color": "#c99abc",
    "speed": 38,
    "shadowSize": 0.9,
    "radius": 23,
    "damage": 10,
    "hp": 260,
    "behavior": "tank",
    "attack": {
      "type": "none",
      "interval": 3,
      "speed": 110,
      "damage": 6,
      "radius": 12,
      "count": 1,
      "spread": 0.2,
      "level": 2
    },
    "phaseAttack": {
      "enabled": true,
      "shape": "sector",
      "radius": 95,
      "innerRadius": 35,
      "length": 280,
      "angle": 110,
      "windup": 0.9,
      "active": 0.25,
      "recovery": 0.65,
      "cooldown": 3,
      "damage": 12,
      "triggerDistance": 125,
      "speed": 140,
      "count": 1,
      "radial": false,
      "gapDegrees": 70
    },
    "mass": 8,
    "feedback": {
      "phase": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "legacy": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "mushroom",
    "name": "蘑菇",
    "spriteId": "mushroom-hopper",
    "color": "#c99abc",
    "speed": 62,
    "shadowSize": 0.9,
    "radius": 17,
    "damage": 10,
    "hp": 85,
    "behavior": "shooter",
    "attack": {
      "type": "projectile",
      "interval": 3,
      "speed": 110,
      "damage": 6,
      "radius": 12,
      "count": 1,
      "spread": 0.2,
      "level": 2
    },
    "phaseAttack": {
      "enabled": true,
      "shape": "projectiles",
      "radius": 10,
      "innerRadius": 35,
      "length": 280,
      "angle": 110,
      "windup": 0.9,
      "active": 2,
      "recovery": 0.65,
      "cooldown": 3,
      "damage": 6,
      "triggerDistance": 340,
      "speed": 140,
      "count": 1,
      "radial": false,
      "gapDegrees": 70
    },
    "mass": 1,
    "feedback": {
      "phase": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "legacy": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "donut",
    "name": "甜甜圈",
    "spriteId": "donut-spinner",
    "color": "#c99abc",
    "speed": 60,
    "shadowSize": 0.9,
    "radius": 19,
    "damage": 10,
    "hp": 110,
    "behavior": "charger",
    "attack": {
      "type": "none",
      "interval": 3,
      "speed": 110,
      "damage": 6,
      "radius": 12,
      "count": 1,
      "spread": 0.2,
      "level": 2
    },
    "phaseAttack": {
      "enabled": false,
      "shape": "projectiles",
      "radius": 10,
      "innerRadius": 35,
      "length": 280,
      "angle": 110,
      "windup": 0.9,
      "active": 2,
      "recovery": 0.65,
      "cooldown": 3,
      "damage": 6,
      "triggerDistance": 340,
      "speed": 140,
      "count": 1,
      "radial": false,
      "gapDegrees": 70
    },
    "mass": 1,
    "feedback": {
      "phase": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "legacy": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "pop-candy",
    "name": "跳跳糖",
    "spriteId": "pop-candy",
    "color": "#c99abc",
    "speed": 82,
    "shadowSize": 0.9,
    "radius": 15,
    "damage": 10,
    "hp": 55,
    "behavior": "bomber",
    "attack": {
      "type": "none",
      "interval": 3,
      "speed": 110,
      "damage": 6,
      "radius": 12,
      "count": 1,
      "spread": 0.2,
      "level": 2
    },
    "phaseAttack": {
      "enabled": false,
      "shape": "projectiles",
      "radius": 10,
      "innerRadius": 35,
      "length": 280,
      "angle": 110,
      "windup": 0.9,
      "active": 2,
      "recovery": 0.65,
      "cooldown": 3,
      "damage": 6,
      "triggerDistance": 340,
      "speed": 140,
      "count": 1,
      "radial": false,
      "gapDegrees": 70
    },
    "mass": 1,
    "feedback": {
      "phase": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "legacy": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "jelly",
    "name": "果凍",
    "spriteId": "jelly-slime",
    "color": "#c99abc",
    "speed": 66,
    "shadowSize": 0.9,
    "radius": 20,
    "damage": 10,
    "hp": 95,
    "behavior": "splitter",
    "attack": {
      "type": "none",
      "interval": 3,
      "speed": 110,
      "damage": 6,
      "radius": 12,
      "count": 1,
      "spread": 0.2,
      "level": 2
    },
    "phaseAttack": {
      "enabled": false,
      "shape": "projectiles",
      "radius": 10,
      "innerRadius": 35,
      "length": 280,
      "angle": 110,
      "windup": 0.9,
      "active": 2,
      "recovery": 0.65,
      "cooldown": 3,
      "damage": 6,
      "triggerDistance": 340,
      "speed": 140,
      "count": 1,
      "radial": false,
      "gapDegrees": 70
    },
    "mass": 1,
    "feedback": {
      "phase": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "legacy": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "fairy",
    "name": "棉花糖仙子",
    "spriteId": "marshmallow-fairy",
    "color": "#c99abc",
    "speed": 58,
    "shadowSize": 0.9,
    "radius": 16,
    "damage": 10,
    "hp": 70,
    "behavior": "support",
    "attack": {
      "type": "none",
      "interval": 3,
      "speed": 110,
      "damage": 6,
      "radius": 12,
      "count": 1,
      "spread": 0.2,
      "level": 2
    },
    "phaseAttack": {
      "enabled": true,
      "shape": "projectiles",
      "radius": 10,
      "innerRadius": 35,
      "length": 280,
      "angle": 110,
      "windup": 0.9,
      "active": 2,
      "recovery": 0.65,
      "cooldown": 3,
      "damage": 6,
      "triggerDistance": 340,
      "speed": 140,
      "count": 8,
      "radial": true,
      "gapDegrees": 70
    },
    "mass": 1,
    "feedback": {
      "phase": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "legacy": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  }
];
