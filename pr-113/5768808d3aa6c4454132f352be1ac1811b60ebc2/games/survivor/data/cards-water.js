// water school and fusion cards; original indices preserve offer order.
SURVIVOR_DEFAULTS.cards[9] = {
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
};

SURVIVOR_DEFAULTS.cards[10] = {
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
};

SURVIVOR_DEFAULTS.cards[11] = {
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
};

SURVIVOR_DEFAULTS.cards[12] = {
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
};

SURVIVOR_DEFAULTS.cards[21] = {
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
};

SURVIVOR_DEFAULTS.cards[24] = {
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
};

SURVIVOR_DEFAULTS.cards[25] = {
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
};

SURVIVOR_DEFAULTS.cards[26] = {
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
};

SURVIVOR_DEFAULTS.cards[27] = {
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
};

SURVIVOR_DEFAULTS.cards[28] = {
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
};
