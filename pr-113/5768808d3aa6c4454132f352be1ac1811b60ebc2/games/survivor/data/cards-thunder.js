// thunder school and fusion cards; original indices preserve offer order.
SURVIVOR_DEFAULTS.cards[17] = {
  "id": "thunder-attack",
  "school": "thunder",
  "slot": "attack",
  "tier": "entry",
  "icon": "thunder-attack",
  "name": "跳電",
  "description": "命中追加跳電；Lv3連鎖2隻，Lv5連鎖3隻。",
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
};

SURVIVOR_DEFAULTS.cards[18] = {
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
};

SURVIVOR_DEFAULTS.cards[19] = {
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
};

SURVIVOR_DEFAULTS.cards[20] = {
  "id": "thunder-ultimate",
  "school": "thunder",
  "slot": "passive",
  "tier": "ultimate",
  "requires": [],
  "icon": "thunder-ultimate",
  "name": "雷雲",
  "description": "雷雲定期劈敵人；Lv3每輪2隻，Lv5每輪3隻，不重複選中。",
  "descriptionMelee": "雷雲定期劈敵人；Lv3每輪2隻，Lv5每輪3隻，不重複選中。",
  "maxLevel": 5,
  "effects": [
    {
      "type": "chain",
      "feature": "thunder-ultimate",
      "power": 1
    }
  ],
  "rarity": "legendary",
  "descriptionSword": "雷雲定期劈敵人；Lv3每輪2隻，Lv5每輪3隻，不重複選中。"
};

SURVIVOR_DEFAULTS.cards[23] = {
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
};

SURVIVOR_DEFAULTS.cards[34] = {
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
};

SURVIVOR_DEFAULTS.cards[35] = {
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
};

SURVIVOR_DEFAULTS.cards[36] = {
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
};

SURVIVOR_DEFAULTS.cards[37] = {
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
};

SURVIVOR_DEFAULTS.cards[38] = {
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
};
