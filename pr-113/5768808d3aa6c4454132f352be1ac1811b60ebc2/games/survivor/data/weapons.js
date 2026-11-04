// Authoritative default weapons data; Maker edits copies through SurvivorData.
SURVIVOR_DEFAULTS.weapons = [
  {
    "id": "water-ball",
    "baseShape": "projectile",
    "comboShape": "projectile",
    "chargeShape": "projectile",
    "direction": "nearest",
    "chargeStun": 0,
    "name": "水球",
    "icon": "big-water",
    "description": "自動發射水球；每第三發大泡泡破成小水花，站定聚氣發射穿透水球。",
    "kind": "projectile",
    "comboEnabled": true,
    "chargeEnabled": true,
    "comboEvery": 3,
    "comboReset": 1.1,
    "comboMultiplier": 1.6,
    "chargeSeconds": 1,
    "chargeMultiplier": 2.5,
    "moveRetention": 0.35,
    "chargeSize": 1.7,
    "comboSize": 1.5,
    "comboPush": 30,
    "finisherRecovery": 0,
    "stepDistance": 0,
    "dashThrust": false,
    "splashSize": 2.5,
    "splashDamage": 0.3,
    "thrustWidth": 18,
    "timing": {
      "windup": 0.1,
      "active": 0.05,
      "recovery": 0.12,
      "cooldown": 0,
      "inputBuffer": 0.12
    },
    "specialKind": "water-fan",
    "specialCooldown": 6,
    "specialCount": 5,
    "specialSpread": 0.18,
    "specialRange": 420,
    "specialDamage": 2,
    "specialLeapDistance": 80,
    "specialLeapSeconds": 0.25,
    "feedback": {
      "primary": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "combo": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "charge": {
        "level": "medium",
        "hitStop": 1,
        "shake": 1
      },
      "special": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "dash": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "candy-hammer",
    "baseShape": "sector",
    "comboShape": "spin",
    "chargeShape": "sector",
    "direction": "nearest",
    "chargeStun": 0.8,
    "name": "棒棒糖錘",
    "icon": "candy-hammer",
    "description": "自動揮錘，第四下轉一圈；站定聚氣後朝前方重擊並暈眩。受到傷害減少 15%。",
    "kind": "melee",
    "interval": 0.7,
    "arcDegrees": 120,
    "radius": 70,
    "damageMultiplier": 1.6,
    "push": 15,
    "spinEvery": 4,
    "damageReduction": 0.15,
    "comboEnabled": true,
    "chargeEnabled": true,
    "comboEvery": 4,
    "comboReset": 1.1,
    "comboMultiplier": 1.6,
    "chargeSeconds": 1,
    "chargeMultiplier": 2.5,
    "moveRetention": 0.35,
    "chargeSize": 1.7,
    "comboSize": 1.5,
    "comboPush": 30,
    "finisherRecovery": 0,
    "stepDistance": 0,
    "dashThrust": false,
    "splashSize": 2.5,
    "splashDamage": 0.3,
    "thrustWidth": 18,
    "timing": {
      "windup": 0.1,
      "active": 0.05,
      "recovery": 0.12,
      "cooldown": 0,
      "inputBuffer": 0.12
    },
    "specialKind": "leap",
    "specialCooldown": 6,
    "specialCount": 1,
    "specialSpread": 0,
    "specialRange": 110,
    "specialDamage": 2,
    "specialLeapDistance": 80,
    "specialLeapSeconds": 0.25,
    "feedback": {
      "primary": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "combo": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "charge": {
        "level": "medium",
        "hitStop": 1,
        "shake": 1
      },
      "special": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "dash": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  },
  {
    "id": "candy-sword",
    "baseShape": "sector",
    "comboShape": "line",
    "chargeShape": "line",
    "direction": "nearest",
    "chargeStun": 0,
    "name": "糖果大劍",
    "icon": "candy-sword",
    "description": "自動橫斬、反手斬、重刺三連擊；衝刺後突刺。站定聚氣後使出長直線穿透突刺。",
    "kind": "melee",
    "interval": 0.45,
    "arcDegrees": 100,
    "radius": 80,
    "damageMultiplier": 1,
    "push": 15,
    "spinEvery": 3,
    "damageReduction": 0,
    "comboEnabled": true,
    "chargeEnabled": true,
    "comboEvery": 3,
    "comboReset": 1.1,
    "comboMultiplier": 2.5,
    "chargeSeconds": 1,
    "chargeMultiplier": 2.5,
    "moveRetention": 0.35,
    "chargeSize": 1.7,
    "comboSize": 1.5,
    "comboPush": 30,
    "finisherRecovery": 0.35,
    "stepDistance": 12,
    "dashThrust": true,
    "splashSize": 2.5,
    "splashDamage": 0.3,
    "thrustWidth": 18,
    "timing": {
      "windup": 0.1,
      "active": 0.05,
      "recovery": 0.12,
      "cooldown": 0,
      "inputBuffer": 0.12
    },
    "specialKind": "sword-wave",
    "specialCooldown": 6,
    "specialCount": 1,
    "specialSpread": 0,
    "specialRange": 420,
    "specialDamage": 2,
    "specialLeapDistance": 80,
    "specialLeapSeconds": 0.25,
    "feedback": {
      "primary": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "combo": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "charge": {
        "level": "medium",
        "hitStop": 1,
        "shake": 1
      },
      "special": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      },
      "dash": {
        "level": "small",
        "hitStop": 1,
        "shake": 1
      }
    }
  }
];
