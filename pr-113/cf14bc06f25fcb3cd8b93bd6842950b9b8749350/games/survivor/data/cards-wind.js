// wind school and fusion cards; original indices preserve offer order.
SURVIVOR_DEFAULTS.cards[13] = {
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
};

SURVIVOR_DEFAULTS.cards[14] = {
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
};

SURVIVOR_DEFAULTS.cards[15] = {
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
};

SURVIVOR_DEFAULTS.cards[16] = {
  "id": "wind-ultimate",
  "school": "wind",
  "slot": "passive",
  "tier": "ultimate",
  "requires": [],
  "icon": "wind-ultimate",
  "name": "環繞龍捲風",
  "description": "旋風環繞傷敵；Lv3兩個、Lv5三個，重疊不重複傷害。",
  "descriptionMelee": "旋風環繞傷敵；Lv3兩個、Lv5三個，重疊不重複傷害。",
  "maxLevel": 5,
  "effects": [
    {
      "type": "aoe",
      "feature": "wind-ultimate",
      "power": 1
    }
  ],
  "rarity": "legendary",
  "descriptionSword": "旋風環繞傷敵；Lv3兩個、Lv5三個，重疊不重複傷害。"
};

SURVIVOR_DEFAULTS.cards[22] = {
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
};

SURVIVOR_DEFAULTS.cards[29] = {
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
};

SURVIVOR_DEFAULTS.cards[30] = {
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
};

SURVIVOR_DEFAULTS.cards[31] = {
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
};

SURVIVOR_DEFAULTS.cards[32] = {
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
};

SURVIVOR_DEFAULTS.cards[33] = {
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
};
