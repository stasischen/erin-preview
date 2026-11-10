// Boss4 additions from the gallery task; each encounter remains data-driven.
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
