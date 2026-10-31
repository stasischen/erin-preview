// 純資料；✏️ Erin 可以在 Maker 調整數值、卡片、外框與怪物。
// schoolRules 的單位與範圍見 docs/survivor-school-redesign-validation.md。
globalThis.SURVIVOR_DEFAULTS = {
  "schemaVersion": 1,
  "playerDefaults": {
    "attackMode": "manual",
    "attackModeChosen": false,
    "joystickFollow": true,
    "joystickRadius": 35,
    "joystickDeadZone": 4,
    "hitFeedback": true,
    "feedbackIntensity": 1,
    "vibration": true,
    "sound": true,
    "music": true,
    "soundVolume": 1,
    "musicVolume": 1,
    "lowEffects": false
  },
  "attackMode": "manual",
  "attackModeChosen": false,
  "joystick": {
    "follow": true,
    "radius": 35,
    "deadZone": 4
  },
  "weapons": [
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
      "thrustWidth": 18
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
      "thrustWidth": 18
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
      "thrustWidth": 18
    }
  ],
  "visuals": {
    "spriteOutline": true
  },
  "elites": {
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
  },
  "chocobear": {
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
  },
  "tuning": {
    "maxUpgradeLevel": 5,
    "levelupRerolls": 2,
    "splashBaseRadius": 22,
    "splashPerLevel": 10,
    "invincibleSeconds": 1,
    "waterSizePerLevel": 0.2,
    "damagePerLevel": 0.25,
    "fireRateReduction": 0.15,
    "extraShotAngle": 0.18,
    "moveSpeedPerLevel": 0.12,
    "magnetPerLevel": 0.4,
    "playerSpeed": 190,
    "playerHealth": 90,
    "enemyLimit": 26,
    "enemySpeed": 75,
    "enemyRadius": 17,
    "enemyDamage": 15,
    "enemyHealth": 120,
    "secondEnemySpeed": 105,
    "secondEnemyDamage": 12,
    "enemyShootLevel": 8,
    "enemyShotInterval": 3,
    "secondEnemyShotInterval": 5,
    "enemyShotSpeed": 110,
    "enemyShotDamage": 6,
    "enemyShotGap": 0.65,
    "enemyShotLimit": 12,
    "enemySpeedGrowth": 0.05,
    "secondEnemyHealth": 70,
    "waveSeconds": 120,
    "teacherHealth": 2000,
    "teacherShotDamage": 12,
    "teacherShotCount": 3,
    "teacherShotSpread": 0.28,
    "teacherShotLimit": 36,
    "shotInterval": 0.72,
    "projectileDamage": 35,
    "projectileSpeed": 390,
    "projectileLimit": 24,
    "gemLimit": 24,
    "gemPullRadius": 105,
    "xpToLevel": 5,
    "xpGrowthPerLevel": 1,
    "dashCooldown": 1.2,
    "dashCharges": 2,
    "dashInvincible": 0.18,
    "perfectWindow": 0.18,
    "perfectHeal": 2,
    "perfectShield": 0.35,
    "perfectSlowSeconds": 0.3,
    "perfectSlowScale": 0.35,
    "dashAttackSeconds": 1,
    "dashAttackDamage": 1.8,
    "dashAttackSize": 1.5,
    "dashSeconds": 0.15,
    "dashMultiplier": 3,
    "bombCooldown": 8,
    "bombDelay": 0.6,
    "bombDamage": 100,
    "bombRadius": 110,
    "bombKnockback": 55,
    "actionButtonSize": 88,
    "autoHealSeconds": 10
  },
  "build": {
    "water": {
      "name": "水",
      "color": "#35b9ff"
    },
    "wind": {
      "name": "風",
      "color": "#70e7ba"
    },
    "thunder": {
      "name": "雷",
      "color": "#bf83ff"
    },
    "splashDamageBase": 0.2,
    "splashDamageGrowth": 0.1,
    "chainGrowth": 0.25,
    "fieldRadiusGrowth": 0.1,
    "supportSplashDamage": 0.35,
    "healIntervalMultiplier": 0.8,
    "shieldHealthDivisor": 5,
    "ultimateSeconds": 10,
    "cloudSeconds": 2,
    "ultimateDamage": 80,
    "ultimateGrowth": 0.3,
    "tornadoRadius": 80,
    "tornadoSpeed": 2.5,
    "tornadoTick": 0.4,
    "attackRadius": 720,
    "shotRange": 720,
    "windSpeed": 0.18,
    "movingRate": 0.12,
    "stunSeconds": 0.5,
    "counterRadius": 130,
    "counterDamage": 25,
    "supportChance": 0.25,
    "slowSeconds": 1.2,
    "slowMultiplier": 0.55,
    "pushDistance": 28,
    "pullDistance": 38,
    "chainRadius": 100,
    "chainDamage": 0.5,
    "fieldSeconds": 2,
    "fieldRadius": 36,
    "fieldInterval": 0.4,
    "fieldDamage": 12,
    "fieldLimit": 18,
    "trailSpacing": 24,
    "skillRadiusMultiplier": 1.25,
    "skillDamageMultiplier": 0.5
  },
  "bossZone": {
    "enabled": true,
    "steps": 3,
    "speed": 40,
    "damage": 4,
    "initialRadius": 600,
    "finalRadius": 180,
    "warning": 4
  },
  "bossTuning": {
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
  },
  "cards": [
    {
      "id": "big-water",
      "slot": "attack",
      "icon": "big-water",
      "name": "水球加大",
      "description": "水球更大、傷害更高",
      "descriptionMelee": "揮擊範圍變大、傷害更高。",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "projectile",
          "feature": "big-water",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "揮擊範圍變大、傷害更高。"
    },
    {
      "id": "rapid-water",
      "slot": "attack",
      "icon": "rapid-water",
      "name": "連發水球",
      "description": "發射速度提升",
      "descriptionMelee": "揮錘更快。",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "projectile",
          "feature": "rapid-water",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "揮劍更快。"
    },
    {
      "id": "multi-water",
      "slot": "attack",
      "icon": "multi-water",
      "name": "多重水球",
      "description": "每次多發一顆",
      "descriptionMelee": "揮擊角度變大。",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "projectile",
          "feature": "multi-water",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "揮擊角度變大。"
    },
    {
      "id": "onion-dash",
      "slot": "passive",
      "icon": "onion-dash",
      "name": "洋蔥衝刺",
      "description": "移動速度提升",
      "descriptionMelee": "移動速度提升",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "stat",
          "feature": "onion-dash",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "移動速度提升"
    },
    {
      "id": "bubble-shield",
      "slot": "passive",
      "icon": "bubble-shield",
      "name": "泡泡護盾",
      "description": "血條變長一點，並回一點血",
      "descriptionMelee": "血條變長一點，並回一點血",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "stat",
          "feature": "bubble-shield",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "血條變長一點，並回一點血"
    },
    {
      "id": "gem-magnet",
      "slot": "passive",
      "icon": "gem-magnet",
      "name": "寶石磁鐵",
      "description": "撿取範圍提升",
      "descriptionMelee": "撿取範圍提升",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "stat",
          "feature": "gem-magnet",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "撿取範圍提升"
    },
    {
      "id": "piercing-water",
      "slot": "attack",
      "icon": "piercing-water",
      "name": "穿透水球",
      "description": "水球多穿透一隻敵人",
      "descriptionMelee": "揮擊距離每級增加 10%。",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "projectile",
          "feature": "piercing-water",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "揮擊距離每級增加 10%。"
    },
    {
      "id": "splash-water",
      "slot": "attack",
      "icon": "splash-water",
      "name": "水花四濺",
      "description": "命中時造成小範圍傷害",
      "descriptionMelee": "命中時造成小範圍傷害",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "aoe",
          "feature": "splash-water",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "命中時造成小範圍傷害"
    },
    {
      "id": "auto-heal",
      "slot": "passive",
      "icon": "auto-heal",
      "name": "自動補血",
      "description": "慢慢恢復血條",
      "descriptionMelee": "慢慢恢復血條",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "heal",
          "feature": "auto-heal",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "慢慢恢復血條"
    },
    {
      "id": "water-attack",
      "school": "water",
      "slot": "attack",
      "tier": "entry",
      "icon": "water-attack",
      "name": "濺水花",
      "description": "水球命中濺水花，升級擴大水花",
      "descriptionMelee": "揮錘命中濺水花，升級擴大水花。",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "aoe",
          "feature": "water-attack",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "揮劍命中濺水花，升級擴大水花。"
    },
    {
      "id": "water-skill",
      "school": "water",
      "slot": "skill",
      "requires": [],
      "icon": "water-skill",
      "name": "水窪",
      "description": "水球落點與泡泡留下緩速水窪",
      "descriptionMelee": "揮錘命中和泡泡留下緩速水窪。",
      "maxLevel": 5,
      "effects": [
        {
          "type": "slow",
          "feature": "water-skill",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "揮劍命中和泡泡留下緩速水窪。"
    },
    {
      "id": "water-dash",
      "school": "water",
      "slot": "dash",
      "requires": [],
      "icon": "water-dash",
      "name": "水痕",
      "description": "衝刺沿路留下緩速水痕",
      "descriptionMelee": "衝刺沿路留下緩速水痕",
      "maxLevel": 5,
      "effects": [
        {
          "type": "dash-trail",
          "feature": "water-dash",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "衝刺沿路留下緩速水痕"
    },
    {
      "id": "water-ultimate",
      "school": "water",
      "slot": "passive",
      "tier": "ultimate",
      "requires": [],
      "icon": "water-ultimate",
      "name": "大海嘯",
      "description": "每 10 秒一道巨浪掃過全場",
      "descriptionMelee": "每 10 秒一道巨浪掃過全場",
      "maxLevel": 5,
      "effects": [
        {
          "type": "aoe",
          "feature": "water-ultimate",
          "power": 1
        }
      ],
      "rarity": "legendary",
      "descriptionSword": "每 10 秒一道巨浪掃過全場"
    },
    {
      "id": "wind-attack",
      "school": "wind",
      "slot": "attack",
      "tier": "entry",
      "icon": "wind-attack",
      "name": "疾風",
      "description": "水球飛得更快、更遠",
      "descriptionMelee": "揮擊距離增加。",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "projectile",
          "feature": "wind-attack",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "揮擊距離增加。"
    },
    {
      "id": "wind-dash",
      "school": "wind",
      "slot": "skill",
      "requires": [],
      "icon": "wind-dash",
      "name": "旋風",
      "description": "技能產生旋風，衝刺也會留下旋風",
      "descriptionMelee": "技能產生旋風，衝刺也會留下旋風",
      "maxLevel": 5,
      "effects": [
        {
          "type": "dash-trail",
          "feature": "wind-dash",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "技能產生旋風，衝刺也會留下旋風"
    },
    {
      "id": "wind-speed",
      "school": "wind",
      "slot": "dash",
      "requires": [],
      "icon": "wind-speed",
      "name": "疾行",
      "description": "衝刺與移動時加快水球發射",
      "descriptionMelee": "衝刺和移動時揮錘更快。",
      "maxLevel": 5,
      "effects": [
        {
          "type": "stat",
          "feature": "wind-speed",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "衝刺和移動時揮劍更快。"
    },
    {
      "id": "wind-ultimate",
      "school": "wind",
      "slot": "passive",
      "tier": "ultimate",
      "requires": [],
      "icon": "wind-ultimate",
      "name": "環繞龍捲風",
      "description": "龍捲風繞主角旋轉，碰到就傷害",
      "descriptionMelee": "龍捲風繞主角旋轉，碰到就傷害",
      "maxLevel": 5,
      "effects": [
        {
          "type": "aoe",
          "feature": "wind-ultimate",
          "power": 1
        }
      ],
      "rarity": "legendary",
      "descriptionSword": "龍捲風繞主角旋轉，碰到就傷害"
    },
    {
      "id": "thunder-attack",
      "school": "thunder",
      "slot": "attack",
      "tier": "entry",
      "icon": "thunder-attack",
      "name": "跳電",
      "description": "水球跳電到附近另一隻，升級更痛",
      "descriptionMelee": "揮錘命中會跳電到附近另一隻，升級更痛。",
      "maxLevel": 5,
      "requires": [],
      "effects": [
        {
          "type": "chain",
          "feature": "thunder-attack",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "揮劍命中會跳電到附近另一隻，升級更痛。"
    },
    {
      "id": "thunder-skill",
      "school": "thunder",
      "slot": "skill",
      "requires": [],
      "icon": "thunder-skill",
      "name": "電泡泡",
      "description": "泡泡帶電，炸中讓敵人暈眩",
      "descriptionMelee": "泡泡帶電，炸中讓敵人暈眩",
      "maxLevel": 5,
      "effects": [
        {
          "type": "stun",
          "feature": "thunder-skill",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "泡泡帶電，炸中讓敵人暈眩"
    },
    {
      "id": "thunder-counter",
      "school": "thunder",
      "slot": "passive",
      "requires": [],
      "icon": "thunder-counter",
      "name": "放電反擊",
      "description": "每次受傷放電反擊附近敵人",
      "descriptionMelee": "每次受傷放電反擊附近敵人",
      "maxLevel": 5,
      "effects": [
        {
          "type": "chain",
          "feature": "thunder-counter",
          "power": 1
        }
      ],
      "rarity": "common",
      "descriptionSword": "每次受傷放電反擊附近敵人"
    },
    {
      "id": "thunder-ultimate",
      "school": "thunder",
      "slot": "passive",
      "tier": "ultimate",
      "requires": [],
      "icon": "thunder-ultimate",
      "name": "雷雲",
      "description": "雷雲定期隨機劈中一隻敵人",
      "descriptionMelee": "雷雲定期隨機劈中一隻敵人",
      "maxLevel": 5,
      "effects": [
        {
          "type": "chain",
          "feature": "thunder-ultimate",
          "power": 1
        }
      ],
      "rarity": "legendary",
      "descriptionSword": "雷雲定期隨機劈中一隻敵人"
    },
    {
      "id": "fusion-puddle",
      "school": "water",
      "slot": "skill",
      "tier": "fusion",
      "requires": [],
      "icon": "fusion-puddle",
      "name": "導電水窪",
      "description": "水窪額外放電，升級增加電傷害",
      "descriptionMelee": "水窪額外放電，升級增加電傷害",
      "maxLevel": 5,
      "effects": [
        {
          "type": "chain",
          "feature": "fusion-puddle",
          "power": 1
        }
      ],
      "rarity": "rare",
      "schools": [
        "water",
        "thunder"
      ],
      "descriptionSword": "水窪額外放電，升級增加電傷害"
    },
    {
      "id": "fusion-storm",
      "school": "wind",
      "slot": "dash",
      "tier": "fusion",
      "requires": [],
      "icon": "fusion-storm",
      "name": "暴風雨",
      "description": "旋風衝刺同時灑下傷敵水窪",
      "descriptionMelee": "旋風衝刺同時灑下傷敵水窪",
      "maxLevel": 5,
      "effects": [
        {
          "type": "dash-trail",
          "feature": "fusion-storm",
          "power": 1
        }
      ],
      "rarity": "rare",
      "schools": [
        "water",
        "wind"
      ],
      "descriptionSword": "旋風衝刺同時灑下傷敵水窪"
    },
    {
      "id": "fusion-dash",
      "school": "thunder",
      "slot": "dash",
      "tier": "fusion",
      "requires": [],
      "icon": "fusion-dash",
      "name": "閃電衝刺",
      "description": "衝刺留下會跳電的電痕",
      "descriptionMelee": "衝刺留下會跳電的電痕",
      "maxLevel": 5,
      "effects": [
        {
          "type": "dash-trail",
          "feature": "fusion-dash",
          "power": 1
        }
      ],
      "rarity": "rare",
      "schools": [
        "wind",
        "thunder"
      ],
      "descriptionSword": "衝刺留下會跳電的電痕"
    },
    {
      "id": "water-drop",
      "school": "water",
      "slot": "attack",
      "rarity": "rare",
      "icon": "water-drop",
      "name": "大水滴",
      "description": "每第 5 發射出大水滴，附擊退",
      "descriptionMelee": "每第 5 下揮擊變大、變痛，還會推開怪物。",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "projectile",
          "feature": "water-drop",
          "power": 1
        }
      ],
      "descriptionSword": "每第 5 下揮擊變大、變痛，還會推開怪物。"
    },
    {
      "id": "water-fountain",
      "school": "water",
      "slot": "skill",
      "rarity": "rare",
      "icon": "water-fountain",
      "name": "噴泉",
      "description": "每 6 秒噴泉把附近怪物彈飛",
      "descriptionMelee": "每 6 秒噴泉把附近怪物彈飛",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "knockback",
          "feature": "water-fountain",
          "power": 1
        }
      ],
      "descriptionSword": "每 6 秒噴泉把附近怪物彈飛"
    },
    {
      "id": "water-bubble",
      "school": "water",
      "slot": "dash",
      "rarity": "rare",
      "icon": "water-bubble",
      "name": "泡泡盾",
      "description": "衝刺結束產生泡泡，擋下一次攻擊",
      "descriptionMelee": "衝刺結束產生泡泡，擋下一次攻擊",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "stat",
          "feature": "water-bubble",
          "power": 1
        }
      ],
      "descriptionSword": "衝刺結束產生泡泡，擋下一次攻擊"
    },
    {
      "id": "water-wet",
      "school": "water",
      "slot": "passive",
      "rarity": "common",
      "icon": "water-wet",
      "name": "濕答答",
      "description": "被弄濕的怪物多受 15% 傷害",
      "descriptionMelee": "被弄濕的怪物多受 15% 傷害",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "stat",
          "feature": "water-wet",
          "power": 1
        }
      ],
      "descriptionSword": "被弄濕的怪物多受 15% 傷害"
    },
    {
      "id": "water-rain",
      "school": "water",
      "slot": "passive",
      "rarity": "legendary",
      "icon": "water-rain",
      "name": "下雨天",
      "description": "定期下雨，讓所有怪物變慢",
      "descriptionMelee": "定期下雨，讓所有怪物變慢",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "slow",
          "feature": "water-rain",
          "power": 1
        }
      ],
      "descriptionSword": "定期下雨，讓所有怪物變慢"
    },
    {
      "id": "wind-blade",
      "school": "wind",
      "slot": "attack",
      "rarity": "rare",
      "icon": "wind-blade",
      "name": "風刃",
      "description": "水球多穿一隻，穿透後產生小風刃",
      "descriptionMelee": "揮擊後追加一次近距離追斬。",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "projectile",
          "feature": "wind-blade",
          "power": 1
        }
      ],
      "descriptionSword": "揮擊後追加一次近距離追斬。"
    },
    {
      "id": "wind-gust",
      "school": "wind",
      "slot": "skill",
      "rarity": "common",
      "icon": "wind-gust",
      "name": "吹飛",
      "description": "每 8 秒把附近所有怪物推開",
      "descriptionMelee": "每 8 秒把附近所有怪物推開",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "knockback",
          "feature": "wind-gust",
          "power": 1
        }
      ],
      "descriptionSword": "每 8 秒把附近所有怪物推開"
    },
    {
      "id": "wind-refund",
      "school": "wind",
      "slot": "dash",
      "rarity": "rare",
      "icon": "wind-refund",
      "name": "順風",
      "description": "衝刺後退回半格衝刺次數",
      "descriptionMelee": "衝刺後退回半格衝刺次數",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "stat",
          "feature": "wind-refund",
          "power": 1
        }
      ],
      "descriptionSword": "衝刺後退回半格衝刺次數"
    },
    {
      "id": "wind-light",
      "school": "wind",
      "slot": "passive",
      "rarity": "common",
      "icon": "wind-light",
      "name": "輕飄飄",
      "description": "移速 +10%，撿經驗範圍變大",
      "descriptionMelee": "移速 +10%，撿經驗範圍變大",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "stat",
          "feature": "wind-light",
          "power": 1
        }
      ],
      "descriptionSword": "移速 +10%，撿經驗範圍變大"
    },
    {
      "id": "wind-eye",
      "school": "wind",
      "slot": "passive",
      "rarity": "legendary",
      "icon": "wind-eye",
      "name": "風之眼",
      "description": "站著不動時產生保護風牆",
      "descriptionMelee": "站著不動時產生保護風牆",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "knockback",
          "feature": "wind-eye",
          "power": 1
        }
      ],
      "descriptionSword": "站著不動時產生保護風牆"
    },
    {
      "id": "thunder-charge",
      "school": "thunder",
      "slot": "attack",
      "rarity": "rare",
      "icon": "thunder-charge",
      "name": "蓄電",
      "description": "每打倒 10 隻，下一發變大閃電",
      "descriptionMelee": "每打倒 10 隻，下一次揮擊蓄電。",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "projectile",
          "feature": "thunder-charge",
          "power": 1
        }
      ],
      "descriptionSword": "每打倒 10 隻，下一次揮擊蓄電。"
    },
    {
      "id": "thunder-rod",
      "school": "thunder",
      "slot": "skill",
      "rarity": "rare",
      "icon": "thunder-rod",
      "name": "避雷針",
      "description": "插在地上的避雷針會電附近怪物",
      "descriptionMelee": "插在地上的避雷針會電附近怪物",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "chain",
          "feature": "thunder-rod",
          "power": 1
        }
      ],
      "descriptionSword": "插在地上的避雷針會電附近怪物"
    },
    {
      "id": "thunder-step",
      "school": "thunder",
      "slot": "dash",
      "rarity": "common",
      "icon": "thunder-step",
      "name": "雷步",
      "description": "衝刺穿過的怪物短暫暈眩",
      "descriptionMelee": "衝刺穿過的怪物短暫暈眩",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "stun",
          "feature": "thunder-step",
          "power": 1
        }
      ],
      "descriptionSword": "衝刺穿過的怪物短暫暈眩"
    },
    {
      "id": "thunder-static",
      "school": "thunder",
      "slot": "passive",
      "rarity": "common",
      "icon": "thunder-static",
      "name": "靜電",
      "description": "碰到主角的怪物會被電",
      "descriptionMelee": "碰到主角的怪物會被電",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "chain",
          "feature": "thunder-static",
          "power": 1
        }
      ],
      "descriptionSword": "碰到主角的怪物會被電"
    },
    {
      "id": "thunder-super",
      "school": "thunder",
      "slot": "passive",
      "rarity": "legendary",
      "icon": "thunder-super",
      "name": "超導體",
      "description": "每次連鎖多跳一隻，而且傷害不衰減",
      "descriptionMelee": "每次連鎖多跳一隻，而且傷害不衰減",
      "maxLevel": 1,
      "requires": [],
      "effects": [
        {
          "type": "chain",
          "feature": "thunder-super",
          "power": 1
        }
      ],
      "descriptionSword": "每次連鎖多跳一隻，而且傷害不衰減"
    },
    {
      "id": "item-wall",
      "name": "浪花水球",
      "description": "水球推開怪物，撞到別隻怪物時兩隻都受傷。",
      "descriptionMelee": "揮錘推得更遠，撞到別隻怪物時兩隻都受傷。",
      "icon": "item-wall",
      "maxLevel": 1,
      "slot": "attack",
      "rarity": "rare",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "projectile",
          "feature": "item-wall",
          "power": 1
        }
      ],
      "descriptionSword": "揮劍推得更遠，撞到別隻怪物時兩隻都受傷。"
    },
    {
      "id": "item-candy",
      "name": "爆爆糖",
      "description": "打倒怪物有 10% 機率掉小炸彈。",
      "descriptionMelee": "打倒怪物有 10% 機率掉小炸彈。",
      "icon": "item-candy",
      "maxLevel": 1,
      "slot": "passive",
      "rarity": "rare",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "aoe",
          "feature": "item-candy",
          "power": 1
        }
      ],
      "descriptionSword": "打倒怪物有 10% 機率掉小炸彈。"
    },
    {
      "id": "item-bird",
      "name": "小鳥跟班",
      "description": "小鳥繞著你飛，啄附近的怪物。",
      "descriptionMelee": "小鳥繞著你飛，啄附近的怪物。",
      "icon": "item-bird",
      "maxLevel": 1,
      "slot": "passive",
      "rarity": "rare",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "aoe",
          "feature": "item-bird",
          "power": 1
        }
      ],
      "descriptionSword": "小鳥繞著你飛，啄附近的怪物。"
    },
    {
      "id": "item-bank",
      "name": "小金庫",
      "description": "每撿 10 顆經驗球傷害 +1%，最多 +30%。",
      "descriptionMelee": "每撿 10 顆經驗球傷害 +1%，最多 +30%。",
      "icon": "item-bank",
      "maxLevel": 1,
      "slot": "passive",
      "rarity": "common",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "aoe",
          "feature": "item-bank",
          "power": 1
        }
      ],
      "descriptionSword": "每撿 10 顆經驗球傷害 +1%，最多 +30%。"
    },
    {
      "id": "item-split",
      "name": "分裂水球",
      "description": "水球打倒怪物時分裂成兩發；碎片不再分裂。",
      "descriptionMelee": "只改變飛行水球；棒棒糖錘本體不會分裂。",
      "icon": "item-split",
      "maxLevel": 1,
      "slot": "attack",
      "rarity": "rare",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "projectile",
          "feature": "item-split",
          "power": 1
        }
      ],
      "descriptionSword": "只改變飛行水球；糖果大劍本體不會分裂。"
    },
    {
      "id": "item-magnet",
      "name": "磁鐵",
      "description": "拾取範圍變成 2.5 倍。",
      "descriptionMelee": "拾取範圍變成 2.5 倍。",
      "icon": "item-magnet",
      "maxLevel": 1,
      "slot": "passive",
      "rarity": "common",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "aoe",
          "feature": "item-magnet",
          "power": 1
        }
      ],
      "descriptionSword": "拾取範圍變成 2.5 倍。"
    },
    {
      "id": "item-crown",
      "name": "王冠",
      "description": "詛咒：傷害 +30%，最大血量 -1。",
      "descriptionMelee": "詛咒：傷害 +30%，最大血量 -1。",
      "icon": "item-crown",
      "maxLevel": 1,
      "slot": "passive",
      "rarity": "rare",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "aoe",
          "feature": "item-crown",
          "power": 1
        }
      ],
      "descriptionSword": "詛咒：傷害 +30%，最大血量 -1。"
    },
    {
      "id": "item-clover",
      "name": "幸運草",
      "description": "立即多一次重抽，稀有卡更容易出現。",
      "descriptionMelee": "立即多一次重抽，稀有卡更容易出現。",
      "icon": "item-clover",
      "maxLevel": 1,
      "slot": "passive",
      "rarity": "rare",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "aoe",
          "feature": "item-clover",
          "power": 1
        }
      ],
      "descriptionSword": "立即多一次重抽，稀有卡更容易出現。"
    },
    {
      "id": "item-rear",
      "name": "後射",
      "description": "每次普攻同時向後方多射一發。",
      "descriptionMelee": "每次揮錘也向後揮擊。",
      "icon": "item-rear",
      "maxLevel": 1,
      "slot": "attack",
      "rarity": "common",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "projectile",
          "feature": "item-rear",
          "power": 1
        }
      ],
      "descriptionSword": "每次揮劍也向後揮擊。"
    },
    {
      "id": "item-cookie",
      "name": "回力餅乾",
      "description": "持有時每打倒 20 隻，回 1 點血。",
      "descriptionMelee": "持有時每打倒 20 隻，回 1 點血。",
      "icon": "item-cookie",
      "maxLevel": 1,
      "slot": "passive",
      "rarity": "common",
      "requires": [],
      "neutral": true,
      "effects": [
        {
          "type": "aoe",
          "feature": "item-cookie",
          "power": 1
        }
      ],
      "descriptionSword": "持有時每打倒 20 隻，回 1 點血。"
    }
  ],
  "enemies": [
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
      "mass": 1
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
      "mass": 1
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
      "mass": 8
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
      "mass": 1
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
      "mass": 1
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
      "mass": 1
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
      "mass": 1
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
      "mass": 1
    }
  ],
  "boss": {
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
    "posture": {"window":0.2,"maximum":100,"dodgeGain":30,"recoveryGain":12,"interruptGain":22,"decay":6,"stunSeconds":2.5,"chargeBonus":0.5,"damageMultiplier":3,"heal":4},
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
        "distance": 300
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
        "distance": 300
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
        "distance": 450
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
        "distance": 300
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
        "distance": 300
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
        "distance": 300
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
        "distance": 300
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
        "distance": 300
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
        "distance": 300
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
        "distance": 300
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
        "distance": 300
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
        "distance": 110
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
        "distance": 450
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
        "distance": 300
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
    }
  },
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
  ],
  "stages": [
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
  ],
  "schools": [
    {
      "id": "water",
      "spirit": "水滴果凍精靈",
      "form": "果凍水精靈",
      "attackCard": "water-attack"
    },
    {
      "id": "wind",
      "spirit": "薄荷風精靈",
      "form": "薄荷風精靈",
      "attackCard": "wind-attack"
    },
    {
      "id": "thunder",
      "spirit": "跳跳糖雷精靈",
      "form": "跳跳糖雷精靈",
      "attackCard": "thunder-attack"
    }
  ],
  "schoolRules": {
    "schoolsPerRun": 3,
    "cardsPerSchool": 5,
    "transformCards": 3,
    "ultimateCards": 5,
    "fusionCards": 2,
    "legendaryChance": 0.025,
    "rareWeight": 0.55,
    "ownedWeight": 0.65,
    "starterWeight": 1.5,
    "bigDropEvery": 5,
    "bigDropSize": 1.7,
    "bigDropDamage": 1.6,
    "bigDropPush": 45,
    "fountainSeconds": 6,
    "fountainRadius": 145,
    "fountainPush": 65,
    "wetSeconds": 3,
    "wetDamage": 0.15,
    "rainSeconds": 10,
    "rainDuration": 3,
    "windBladeDamage": 0.4,
    "windBladeRange": 140,
    "gustSeconds": 8,
    "gustRadius": 150,
    "gustPush": 65,
    "refundCharge": 0.5,
    "lightSpeed": 0.1,
    "lightMagnet": 0.25,
    "eyeWait": 1,
    "eyeRadius": 65,
    "eyePush": 35,
    "chargeKills": 10,
    "chargeDamage": 2.5,
    "rodSeconds": 6,
    "rodDuration": 4,
    "rodRadius": 120,
    "rodDamage": 25,
    "rodTick": 1,
    "thunderStepStun": 0.5,
    "staticSeconds": 1,
    "staticDamage": 20,
    "superconductorJumps": 1,
    "waterFormSize": 0.25,
    "windFormCharges": 1,
    "thunderFormRange": 0.4
  },
  "neutralRules": {
    "wavePush": 55,
    "waveDamage": 18,
    "waveCooldown": 0.6,
    "itemsPerRun": 5,
    "bombChance": 0.1,
    "bombDelay": 0.6,
    "bombRadius": 70,
    "bombDamage": 45,
    "birdRadius": 65,
    "birdReach": 90,
    "birdSeconds": 0.8,
    "birdDamage": 20,
    "bankEvery": 10,
    "bankStep": 0.01,
    "bankCap": 0.3,
    "splitDamage": 0.5,
    "splitAngle": 0.5,
    "magnetMultiplier": 2.5,
    "crownDamage": 0.3,
    "crownHealth": 1,
    "luckyRareMultiplier": 1.6,
    "cookieKills": 20
  },
  "pacing": {
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
  },
  "bodySeparation": {
    "enabled": true,
    "radiusScale": 1,
    "playerForce": 1,
    "enemyForce": 0.25
  },
  "hitJuice": {
    "enabled": true,
    "intensity": 1
  },
  "bodyContact": {
    "pushOnly": false,
    "damageScale": 0.25
  },
  "knockback": {
    "enabled": true,
    "strength": 1,
    "bossMass": 40,
    "minibossMass": 8,
    "bossMultiplier": 0,
    "slideSeconds": 0.2
  }
};

// ✏️ Erin 可以改：手動普攻的起手、生效、收招、冷卻（秒）；自動模式沿用原間隔。
SURVIVOR_DEFAULTS.weapons.forEach(w => { w.timing={windup:.1,active:.05,recovery:.12,cooldown:0,inputBuffer:.12}; });

// ✏️ Erin 可以改：特殊招的積木初值，全部沿用原本手感。
SURVIVOR_DEFAULTS.weapons.forEach(w => Object.assign(w, {
  specialKind:w.id==='candy-hammer'?'leap':w.id==='candy-sword'?'sword-wave':'water-fan',
  specialCooldown:6,specialCount:w.id==='water-ball'?5:1,specialSpread:w.id==='water-ball'?.18:0,
  specialRange:w.id==='candy-hammer'?110:420,specialDamage:2,specialLeapDistance:80,specialLeapSeconds:.25
}));

// ✏️ Erin 可以改：新作品使用三級回饋；舊作品由 schema 補欄位，保留原倍率。
SURVIVOR_DEFAULTS.weapons.forEach(w => {
  w.feedback=Object.fromEntries(['primary','combo','charge','special','dash'].map(id=>[id,{
    level:id==='charge'?'medium':'small',hitStop:1,shake:1
  }]));
});

SURVIVOR_DEFAULTS.enemies.forEach(e => {e.feedback={phase:{level:'small',hitStop:1,shake:1},legacy:{level:'small',hitStop:1,shake:1}};});
SURVIVOR_DEFAULTS.boss.moves.forEach(m => {m.feedback={move:{level:'small',hitStop:1,shake:1}};});

// ✏️ Erin 可以改：王的試煉初值；距離為世界單位，時間為秒。
SURVIVOR_DEFAULTS.gallery = {
  "schemaVersion": 2,
  "arenaRadius": 200,
  "entrySeconds": 2,
  "wallStun": 2,
  "hazardLimit": 16,
  "summonLimit": 8,
  "bosses": [
    {
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
            "trigger": "onSelect",
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
            "actions": [
              {
                "type": "damage",
                "amount": 12
              },
              {
                "type": "move",
                "speed": 0
              }
            ],
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "shield"
            }
          }
        },
        {
          "id": "axe",
          "name": "巨斧兩段橫掃",
          "minPhase": 1,
          "weight": 1,
          "blocks": {
            "trigger": "onSelect",
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
            "actions": [
              {
                "type": "damage",
                "amount": 15
              },
              {
                "type": "move",
                "speed": 0
              }
            ],
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "axe"
            }
          }
        },
        {
          "id": "leap",
          "name": "跳躍重壓",
          "minPhase": 1,
          "weight": 1,
          "blocks": {
            "trigger": "onSelect",
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
            "actions": [
              {
                "type": "damage",
                "amount": 18
              },
              {
                "type": "move",
                "speed": 0
              }
            ],
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "leap"
            }
          }
        },
        {
          "id": "spin",
          "name": "旋風斬",
          "minPhase": 2,
          "weight": 1,
          "blocks": {
            "trigger": "onSelect",
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
            "actions": [
              {
                "type": "damage",
                "amount": 10
              },
              {
                "type": "move",
                "speed": 65
              }
            ],
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "spin"
            }
          }
        },
        {
          "id": "charge",
          "name": "持盾衝鋒",
          "minPhase": 2,
          "weight": 1,
          "blocks": {
            "trigger": "onSelect",
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
            "actions": [
              {
                "type": "damage",
                "amount": 16
              },
              {
                "type": "move",
                "speed": 440
              }
            ],
            "feedback": {
              "level": "medium",
              "warning": "ground",
              "pose": "charge"
            }
          }
        }
      ]
    }
  ],
  "hazard": {
    "kind": "fire",
    "radius": 80,
    "duration": 3,
    "interval": 0.6,
    "damage": 8,
    "slow": 0.6
  }
};

// 與武器／老師相同的五種積木外殼；招式內容仍是可序列化資料。
SURVIVOR_DEFAULTS.gallery.bosses.forEach(b=>b.moves.forEach(m=>{
  const s=m.blocks;
  m.blocks={version:1,moves:[{id:'move',trigger:{event:s.trigger},shape:s.shape,timing:s.timing,effect:{damage:s.actions[0].amount,speed:s.actions[1].speed},feedback:s.feedback}]};
}));

// ✏️ Erin 可以改：第二批試煉使用相同的觸發／形狀／時機／效果／回饋積木。
(()=>{
 const move=(id,name,type,radius,angle,active,speed,phase=1)=>({id,name,minPhase:phase,weight:1,blocks:{version:1,moves:[{id:'move',trigger:{event:'onSelect'},shape:{type,radius,angle,thickness:12},timing:{windup:1.1,active,recovery:.9,cooldown:.6},effect:{damage:12,speed,duration:id==='tornado'?5:id==='frost-dash'?2.8:4,interval:id==='spiral'?.5:id==='frost-dash'?.14:.6,count:id==='spiral'?19:7,slow:.55,rotation:id==='cross'?Math.PI/2:1.1},feedback:{level:'medium',warning:'ground',pose:id}}]}});
 SURVIVOR_DEFAULTS.gallery.bosses.push(
 {id:'frostfire',name:'雙子霜火',artId:'character/frost-twin',hp:1250,radius:30,speed:65,phases:[{threshold:1,speed:1},{threshold:.5,speed:1.4}],moves:[
 move('frost-dash','霜之衝刺','line',40,0,.7,440),move('nova','火焰新星','ring',180,80,1.6,140),move('cross','十字光束','cross',180,0,1.4,0),move('icefall','天降冰錐','circle',65,0,.2,0,2),move('meteor','隕石','circle',80,0,.2,0,2)]},
 {id:'winged',name:'羽翼古神',artId:'character/winged',hp:2200,radius:35,speed:75,phases:[{threshold:1,speed:1},{threshold:.5,speed:1.2}],moves:[
 move('dive','俯衝轟炸','circle',110,0,.65,0),move('feathers','羽毛扇形噴射','sector',180,90,.3,200),move('tornado','追蹤龍捲風','circle',36,0,.3,65),move('spiral','螺旋羽毛彈幕','ring',180,65,3.2,160,2)]});
})();

// ✏️ Erin 可以改：每招的 AI 距離帶（世界單位），不依賴競技場大小。
SURVIVOR_DEFAULTS.gallery.bosses.forEach(b=>b.moves.forEach(m=>{
  const ranged=['charge','leap','frost-dash','dive','feathers','spiral','tornado','icefall','meteor'].includes(m.id);
  if(b.id==='gatekeeper'&&m.id==='charge')m.minPhase=1;
  const shape=m.blocks.moves[0].shape;
  m.ai={minDistance:m.id==='charge'?70:0,maxDistance:ranged?600:shape.radius+18,angleWeight:0,phaseWeight:0,offscreen:true};
}));

// ✏️ Erin 可以改：共用弱點積木。角度為朝向的相對度數；時間單位為秒。
SURVIVOR_DEFAULTS.boss.weakpoint = {
 version:1, armorMultiplier:.2, criticalMultiplier:3, warning:.15, closing:.25,
 parts:[{id:'core',anchor:'weakpoint',radiusScale:1,angleDegrees:0,arcDegrees:360,mode:'any',duration:1.5,
 conditions:[{type:'recovery'},{type:'posture-break'}]}]
};
SURVIVOR_DEFAULTS.gallery.bosses.find(b=>b.id==='gatekeeper').weakpoint = {
 version:1, armorMultiplier:.2, criticalMultiplier:3, warning:.15, closing:.25,
 parts:[{id:'back',anchor:'weakpoint',radiusScale:1,angleDegrees:180,arcDegrees:120,mode:'any',duration:2,
 conditions:[{type:'behind'}]},
 {id:'core',anchor:'weakpoint',radiusScale:1,angleDegrees:0,arcDegrees:360,mode:'any',duration:2,
 conditions:[{type:'wall-stun'},{type:'posture-break'}]}]
};

// ✏️ Erin 可以改：連擊、背後換位、彈幕與側滑都是共用效果積木，秒／世界距離。
SURVIVOR_DEFAULTS.gallery.bosses.push({
 id:'assassin',name:'雙刃刺客',artId:'character/assassin',hp:1600,radius:28,speed:100,
 phases:[{threshold:1,speed:1},{threshold:.5,speed:1.15}],
 weakpoint:{version:1,armorMultiplier:.2,criticalMultiplier:3,warning:.15,closing:.25,
  artId:'effect/weakpoint-red',postureChargeMultiplier:1.5,
  parts:[{id:'core',anchor:'weakpoint',radiusScale:1,angleDegrees:0,arcDegrees:360,mode:'any',duration:2.2,conditions:[{type:'posture-break'}]}]},
 moves:[
  {id:'blade-combo',name:'四拍雙刃連斬',minPhase:1,weight:1,ai:{minDistance:0,maxDistance:148,angleWeight:0,phaseWeight:0,offscreen:true},
   blocks:{version:1,moves:[{id:'move',trigger:{event:'onSelect'},shape:{type:'sector',radius:130,angle:100},timing:{windup:.85,active:.1,recovery:.9,cooldown:.5},effect:{damage:12,speed:0,sequence:{count:4,phaseCount:5}},feedback:{level:'medium',warning:'ground',pose:'blade-combo'}}]}},
  {id:'shadowstep',name:'影步背刺',minPhase:1,weight:1,ai:{minDistance:0,maxDistance:600,angleWeight:0,phaseWeight:2,offscreen:true},
   blocks:{version:1,moves:[{id:'move',trigger:{event:'onSelect'},shape:{type:'sector',radius:110,angle:32},timing:{windup:1.1,active:.12,recovery:1,cooldown:.5},effect:{damage:18,speed:0,relocate:{mode:'behind',distance:72,vanish:.35,flash:.25}},feedback:{level:'medium',warning:'ground',pose:'shadowstep'}}]}},
  {id:'kunai-slide',name:'苦無與橫向滑步',minPhase:1,weight:1,ai:{minDistance:0,maxDistance:600,angleWeight:0,phaseWeight:0,offscreen:true},
   blocks:{version:1,moves:[{id:'move',trigger:{event:'onSelect'},shape:{type:'sector',radius:200,angle:70},timing:{windup:.9,active:.5,recovery:.7,cooldown:.5},effect:{damage:10,speed:0,projectiles:{count:5,speed:230,life:2,radius:6,artId:'move/kunai'},slide:{speed:130}},feedback:{level:'medium',warning:'ground',pose:'kunai-slide'}}]}}
 ]
});

// Two alternating limbs use the same warned slam block; side is identity, not a third actor.
SURVIVOR_DEFAULTS.gallery.bosses.push({
 id:'stone-hands',name:'石像雙手',artId:'character/stone-hands',hp:2000,radius:34,speed:45,
 phases:[{threshold:1,speed:1},{threshold:.5,speed:1.15}],
 weakpoint:{version:1,armorMultiplier:.2,criticalMultiplier:3,warning:.15,closing:.25,
  parts:[{id:'core',anchor:'weakpoint',radiusScale:.6,angleDegrees:0,arcDegrees:360,mode:'any',duration:3,requiresMatch:true,conditions:[{type:'windup'}]}]},
 moves:[-1,1].map(side=>({id:side<0?'left-slam':'right-slam',name:side<0?'左手砸地':'右手砸地',minPhase:1,weight:1,
  ai:{minDistance:0,maxDistance:600,angleWeight:0,phaseWeight:0,offscreen:true},
  blocks:{version:1,moves:[{id:'move',trigger:{event:'onSelect'},shape:{type:'circle',radius:55,angle:0},
   timing:{windup:1.2,active:.2,recovery:.8,cooldown:.4},effect:{damage:16,speed:0,limb:{side,reach:170,lift:70}},
   feedback:{level:'medium',warning:'ground',pose:side<0?'left-slam':'right-slam'}}]}}))
});

// Sixth actual encounter: discrete warned cells, outward-facing eye, then warned beam.
(()=>{
 const move=(id,name,type,timing,effect)=>({id,name,minPhase:1,weight:1,ai:{minDistance:0,maxDistance:10000,angleWeight:0,phaseWeight:0,offscreen:true},blocks:{version:1,moves:[{id:'move',trigger:{event:'onSelect'},shape:{type,radius:40,angle:0},timing,effect:{damage:14,speed:0,...effect},feedback:{level:'medium',warning:'ground',pose:id}}]}});
 SURVIVOR_DEFAULTS.gallery.bosses.push({id:'rolling-eye',name:'翻滾巨眼',artId:'character/rolling-eye',hp:1900,radius:32,speed:0,phases:[{threshold:1,speed:1},{threshold:.5,speed:1}],
 weakpoint:{version:1,armorMultiplier:.2,criticalMultiplier:3,warning:.15,closing:.25,parts:[{id:'eye',anchor:'weakpoint',radiusScale:.65,angleDegrees:0,arcDegrees:360,mode:'any',duration:2,requiresMatch:true,conditions:[{type:'beam-active'}]}]},
 moves:[move('grid-roll','格步翻滾','line',{windup:.8,active:.4,recovery:.25,cooldown:.2},{gridRoll:{cell:80}}),move('eye-beam','巨眼光束','line',{windup:1.1,active:.45,recovery:.6,cooldown:.4},{beam:{width:10,range:600}})]});
})();

// 面具石像沿用共用 charge／wall-stun 與 behind 弱點積木。
(()=>{
 const statue=JSON.parse(JSON.stringify(SURVIVOR_DEFAULTS.gallery.bosses.find(b=>b.id==='gatekeeper')));
 statue.id='mask-statue';statue.name='面具石像';statue.artId='character/mask-statue';statue.hp=2100;statue.radius=38;statue.speed=55;
 statue.moves=statue.moves.filter(m=>m.id==='charge');
 const charge=statue.moves[0];charge.id='charge';charge.name='面具直線衝撞';charge.minPhase=1;charge.weight=1;
 charge.ai={minDistance:70,maxDistance:600,angleWeight:0,phaseWeight:0,offscreen:true};
 charge.blocks.moves[0].feedback.pose=charge.id;
 charge.blocks.moves[0].timing={windup:1.25,active:2,recovery:1,cooldown:.8};
 charge.blocks.moves[0].effect={damage:16,speed:440,charge:{wallStun:true}};
 statue.weakpoint={version:1,armorMultiplier:.2,criticalMultiplier:3,warning:.2,closing:.25,
  parts:[{id:'back',anchor:'weakpoint',radiusScale:.8,angleDegrees:180,arcDegrees:120,mode:'all',duration:2,requiresMatch:true,conditions:[{type:'behind'},{type:'wall-stun'}]}]};
 SURVIVOR_DEFAULTS.gallery.bosses.push(statue);
})();
