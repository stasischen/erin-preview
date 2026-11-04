// Original card indices keep offer ordering and existing works unchanged.
SURVIVOR_DEFAULTS.cards[0] = {
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
};

SURVIVOR_DEFAULTS.cards[1] = {
  "id": "rapid-water",
  "slot": "attack",
  "icon": "rapid-water",
  "name": "連發水球",
  "description": "每級縮短原發射間隔 10%，五級約為原本兩倍射速",
  "descriptionMelee": "每級縮短原揮錘間隔 10%",
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
  "descriptionSword": "每級縮短原揮劍間隔 10%"
};

SURVIVOR_DEFAULTS.cards[2] = {
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
  "descriptionSword": "橫斬角度與突刺寬度增加。"
};

SURVIVOR_DEFAULTS.cards[3] = {
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
};

SURVIVOR_DEFAULTS.cards[4] = {
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
};

SURVIVOR_DEFAULTS.cards[5] = {
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
};

SURVIVOR_DEFAULTS.cards[6] = {
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
};

SURVIVOR_DEFAULTS.cards[7] = {
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
};

SURVIVOR_DEFAULTS.cards[8] = {
  "id": "auto-heal",
  "slot": "passive",
  "icon": "auto-heal",
  "name": "自動補血",
  "description": "每次恢復基礎血量的 5%（向上取整），升級縮短間隔",
  "descriptionMelee": "每次恢復基礎血量的 5%（向上取整），升級縮短間隔",
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
  "descriptionSword": "每次恢復基礎血量的 5%（向上取整），升級縮短間隔"
};

SURVIVOR_DEFAULTS.cards[39] = {
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
};

SURVIVOR_DEFAULTS.cards[40] = {
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
};

SURVIVOR_DEFAULTS.cards[41] = {
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
};

SURVIVOR_DEFAULTS.cards[42] = {
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
};

SURVIVOR_DEFAULTS.cards[43] = {
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
};

SURVIVOR_DEFAULTS.cards[44] = {
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
};

SURVIVOR_DEFAULTS.cards[45] = {
  "id": "item-crown",
  "name": "王冠",
  "description": "詛咒：傷害 +30%，最大血量 -18。",
  "descriptionMelee": "詛咒：傷害 +30%，最大血量 -18。",
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
  "descriptionSword": "詛咒：傷害 +30%，最大血量 -18。"
};

SURVIVOR_DEFAULTS.cards[46] = {
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
};

SURVIVOR_DEFAULTS.cards[47] = {
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
};

SURVIVOR_DEFAULTS.cards[48] = {
  "id": "item-cookie",
  "name": "回力餅乾",
  "description": "每打倒 20 隻，恢復基礎血量的 5%（向上取整）。",
  "descriptionMelee": "每打倒 20 隻，恢復基礎血量的 5%（向上取整）。",
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
  "descriptionSword": "每打倒 20 隻，恢復基礎血量的 5%（向上取整）。"
};
