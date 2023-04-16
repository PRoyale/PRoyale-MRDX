"use strict";
/* global util, vec2, squar */
/* global GameObject, FireballProj, PlayerObject */
/* global NET011, NET020 */

function FirebroObject(game, level, zone, pos, oid, reverse) {
  GameObject.call(this, game, level, zone, pos);
  
  this.oid = oid; // Unique Object ID, is the shor2 of the spawn location
  
  this.setState(FirebroObject.STATE.IDLE);
  
  /* Animation */
  this.anim = 0;
  
  /* Dead */
  this.bonkTimer = 0;
  
  /* Physics */
  this.dim = vec2.make(1., 1.5);
  this.moveSpeed = 0;
  this.fallSpeed = 0;
  this.grounded = false;
  
  /* Var */
  this.disabled = false;
  this.disabledTimer = 0;
  this.proxHit = false;    // So we don't send an enable event every single frame while waiting for server response.
  
  this.fireball = undefined;  // last fireball obj we threw
  
  /* Control */
  this.loc = parseInt(reverse)===1?
    [this.pos.x + FirebroObject.MOVE_AREA, this.pos.x]:
    [this.pos.x, this.pos.x - FirebroObject.MOVE_AREA];
  this.attackTimer = 0;
  this.attackAnimTimer = 0;
  this.double = 0;
  this.groundTimer = 0;
  this.jumpTimer = -1;
  this.reverse = false; /* direction bro is moving */
  this.dir = true;
  
  this.disable();
}

/* === STATIC =============================================================== */
FirebroObject.ASYNC = false;
FirebroObject.ID = 0x32;
FirebroObject.NAME = "Fire Bro"; // Used by editor
FirebroObject.PARAMS = [{'name': 'Reverse', 'type': 'int', 'tooltip': "The direction of the Fire Bro. 0 is left and 1 is right"}];

FirebroObject.ANIMATION_RATE = 10;

FirebroObject.ENABLE_FADE_TIME = 15;
FirebroObject.ENABLE_DIST = 33;          // Distance to player needed for proximity to trigger and the enemy to be enabled

FirebroObject.BONK_TIME = 90;
FirebroObject.BONK_IMP = vec2.make(0.25, 0.4);
FirebroObject.BONK_DECEL = 0.925;
FirebroObject.BONK_FALL_SPEED = 0.25;

FirebroObject.MOVE_SPEED_MAX = 0.0475;
FirebroObject.JUMP_DELAY = 110;        // Time between jumps
FirebroObject.MOVE_AREA = 4;          // 4 Blocks horizontal area
FirebroObject.JUMP_LENGTH = 8;        // Length of jump
FirebroObject.JUMP_DECEL = 0.009;     // Jump deceleration
FirebroObject.ATTACK_DELAY = 150;      // Time between attacks
FirebroObject.DOUBLE_RATE = 5;        // How many attacks till a double attack
FirebroObject.DOUBLE_ANIM_LENGTH = 4;
FirebroObject.ATTACK_ANIM_LENGTH = 2;
FirebroObject.PROJ_OFFSET = vec2.make(0, 1.);
    
FirebroObject.FALL_SPEED_MAX = 0.3;
FirebroObject.FALL_SPEED_ACCEL = 0.085;

FirebroObject.SPRITE = {};
FirebroObject.SPRITE_LIST = [
  {NAME: "IDLE0", ID: 0x00, INDEX: [[0x004D],[0x003D]]},
  {NAME: "IDLE1", ID: 0x01, INDEX: [[0x004C],[0x003C]]},
  {NAME: "ATTACK", ID: 0x02, INDEX: [[0x004B],[0x003B]]}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<FirebroObject.SPRITE_LIST.length;i++) {
  FirebroObject.SPRITE[FirebroObject.SPRITE_LIST[i].NAME] = FirebroObject.SPRITE_LIST[i];
  FirebroObject.SPRITE[FirebroObject.SPRITE_LIST[i].ID] = FirebroObject.SPRITE_LIST[i];
}

FirebroObject.STATE = {};
FirebroObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [FirebroObject.SPRITE.IDLE0,FirebroObject.SPRITE.IDLE1]},
  {NAME: "FALL", ID: 0x01, SPRITE: [FirebroObject.SPRITE.IDLE1]},
  {NAME: "ATTACK", ID: 0x02, SPRITE: [FirebroObject.SPRITE.ATTACK]},
  {NAME: "BONK", ID: 0x51, SPRITE: []}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<FirebroObject.STATE_LIST.length;i++) {
  FirebroObject.STATE[FirebroObject.STATE_LIST[i].NAME] = FirebroObject.STATE_LIST[i];
  FirebroObject.STATE[FirebroObject.STATE_LIST[i].ID] = FirebroObject.STATE_LIST[i];
}

/* === INSTANCE ============================================================= */

FirebroObject.prototype.update = function(event) {
  /* Event trigger */
  switch(event) {
    case 0x01 : { this.bonk(); break; }
    case 0xA0 : { this.enable(); break; }
  }
};

FirebroObject.prototype.step = function() {
  /* Disabled */
  if(this.disabled) { this.proximity(); return; }
  else if(this.disabledTimer > 0) { this.disabledTimer--; }
  
  /* Bonked */
  if(this.state === FirebroObject.STATE.BONK) {
    if(this.bonkTimer++ > FirebroObject.BONK_TIME || this.pos.y+this.dim.y < 0) { this.destroy(); return; }
    
    this.pos = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
    this.moveSpeed *= FirebroObject.BONK_DECEL;
    this.fallSpeed = Math.max(this.fallSpeed - FirebroObject.FALL_SPEED_ACCEL, -FirebroObject.BONK_FALL_SPEED);
    return;
  }

  /* Anim */
  this.anim++;
  this.sprite = this.state.SPRITE[parseInt(this.anim/FirebroObject.ANIMATION_RATE) % this.state.SPRITE.length];
  
  /* Normal Gameplay */
  this.face();
  this.control();
  this.physics();
  this.sound();
  
  if(this.attackAnimTimer > 0) { this.setState(FirebroObject.STATE.ATTACK); this.attach(); this.attackAnimTimer--; }
  else if(this.attackTimer++ > FirebroObject.ATTACK_DELAY) { this.attack(); this.play("fireball.mp3", 1., .04); }
  else { this.fireball = undefined; }
  
  if(this.pos.y < -2.) { this.destroy(); }
};

FirebroObject.prototype.control = function() {
  if(this.grounded) {
    if(FirebroObject.JUMP_DELAY < this.groundTimer++) { this.jumpTimer = 0; this.groundTimer = 0; }
    if(this.pos.x > this.loc[0]) { this.reverse = true; }
    else if(this.pos.x < this.loc[1]) { this.reverse = false; }
  }
  else if(this.jumpTimer > FirebroObject.JUMP_LENGTH) {
    this.jumpTimer = -1;
  }
  
  if(!this.grounded) { this.setState(FirebroObject.STATE.FALL); }
  else { this.setState(FirebroObject.STATE.IDLE); }

  this.moveSpeed = (this.moveSpeed * .75) + ((this.reverse ? -FirebroObject.MOVE_SPEED_MAX : FirebroObject.MOVE_SPEED_MAX) * .25);  // Rirp
};

FirebroObject.prototype.physics = function() {
  if(this.jumpTimer !== -1) {
    this.fallSpeed = FirebroObject.FALL_SPEED_MAX - (this.jumpTimer*FirebroObject.JUMP_DECEL);
    this.jumpTimer++;
    this.grounded = false;
  }
  else {
    if(this.grounded) { this.fallSpeed = 0; }
    this.fallSpeed = Math.max(this.fallSpeed - FirebroObject.FALL_SPEED_ACCEL, -FirebroObject.FALL_SPEED_MAX);
  }
  
  var movx = vec2.add(this.pos, vec2.make(this.moveSpeed, 0.));
  var movy = vec2.add(this.pos, vec2.make(this.moveSpeed, this.fallSpeed));
  
  var ext1 = vec2.make(this.moveSpeed>=0?this.pos.x:this.pos.x+this.moveSpeed, this.fallSpeed<=0?this.pos.y:this.pos.y+this.fallSpeed);
  var ext2 = vec2.make(this.dim.y+Math.abs(this.moveSpeed), this.dim.y+Math.abs(this.fallSpeed));
  var tiles = this.game.world.getZone(this.level, this.zone).getTiles(ext1, ext2);
  var tdim = vec2.make(1., 1.);
  
  this.grounded = false;
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    if(!tile.definition.COLLIDE || tile.definition.HIDDEN) { continue; }
    
    var hitx = squar.intersection(tile.pos, tdim, movx, this.dim);
    
    if(hitx) {
      if(this.pos.x + this.dim.x <= tile.pos.x && movx.x + this.dim.x > tile.pos.x) {
        movx.x = tile.pos.x - this.dim.x;
        movy.x = movx.x;
        this.moveSpeed = 0;
      }
      else if(this.pos.x >= tile.pos.x + tdim.x && movx.x < tile.pos.x + tdim.x) {
        movx.x = tile.pos.x + tdim.x;
        movy.x = movx.x;
        this.moveSpeed = 0;
      }
    }
  }
    
  for(var i=0;i<tiles.length;i++) {
    var tile = tiles[i];
    if(!tile.definition.COLLIDE || tile.definition.HIDDEN) { continue; }
    
    var hity = squar.intersection(tile.pos, tdim, movy, this.dim);
    
    if(hity) {
      if(this.pos.y >= tile.pos.y + tdim.y && movy.y < tile.pos.y + tdim.y) {
        movy.y = tile.pos.y + tdim.y;
        this.fallSpeed = 0;
        this.grounded = true;
      }
      else if(this.pos.y + this.dim.y <= tile.pos.y && movy.y + this.dim.y > tile.pos.y) {
        movy.y = tile.pos.y - this.dim.y;
        this.jumpTimer = -1;
        this.fallSpeed = 0;
      }
    }
  }
  this.pos = vec2.make(movx.x, movy.y);
};

/* Tests against client player to see if they are near enough that we should enable this enemy. */
/* On a successful test we send a object event 0xA0 to the server to trigger this enemy being enabled for all players */
FirebroObject.prototype.proximity = function() {
  var ply = this.game.getPlayer();
  if(ply && !ply.dead && ply.level === this.level && ply.zone === this.zone && !this.proxHit && vec2.distance(ply.pos, this.pos) < FirebroObject.ENABLE_DIST) {
    this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0xA0));
    this.proxHit = true;
  }
};

/* Face nearest player */
FirebroObject.prototype.face = function() {
  var nearest;
  for(var i=0;i<this.game.objects.length;i++) {
     var obj = this.game.objects[i];
     if(obj instanceof PlayerObject && obj.level === this.level && obj.zone === this.zone && obj.isTangible()) {
       if(!nearest || Math.abs(nearest) > vec2.distance(obj.pos, this.pos)) { nearest = obj.pos.x - this.pos.x; }
     }
  }
  if(!nearest) { this.dir = true; }
  else { this.dir = nearest<0; }
};

FirebroObject.prototype.sound = GameObject.prototype.sound;

FirebroObject.prototype.enable = function() {
  if(!this.disabled) { return; }
  this.disabled = false;
  this.disabledTimer = FirebroObject.ENABLE_FADE_TIME;
};

FirebroObject.prototype.disable = function() {
  this.disabled = true;
};

FirebroObject.prototype.attack = function() {
  this.attackAnimTimer = FirebroObject.ATTACK_ANIM_LENGTH;
  this.attackTimer = 0;
  this.fireball = this.game.createObject(FireballProj.ID, this.level, this.zone, vec2.add(this.pos, FirebroObject.PROJ_OFFSET), [this]);
  this.fireball.owner = this;
  if(++this.double > FirebroObject.DOUBLE_RATE) { this.double = 0; this.attackTimer = FirebroObject.ATTACK_DELAY; }
};

/* Keeps the fireball we are throwing attached to us until it's time to actually throw it */
FirebroObject.prototype.attach = function() {
  if(this.fireball) { this.fireball.pos = vec2.add(this.pos, FirebroObject.PROJ_OFFSET); this.fireball.dir = this.dir; }
};

FirebroObject.prototype.playerCollide = function(p) {
  if(this.dead || this.garbage) { return; }
  p.damage(this);
};

FirebroObject.prototype.playerStomp = function(p) {
  if(this.dead || this.garbage) { return; }
  this.bonk();
  p.bounce();
  this.game.out.push(NET020.encode(this.level, this.zone, this.oid, 0x01));
};

FirebroObject.prototype.playerBump = FirebroObject.prototype.playerCollide;

FirebroObject.prototype.damage = function(p) { if(!this.dead) { this.bonk(); NET020.encode(this.level, this.zone, this.oid, 0x01); } };

/* 'Bonked' is the type of death where an enemy flips upside down and falls off screen */
/* Generally triggred by shells, fireballs, etc */
FirebroObject.prototype.bonk = function() {
  if(this.dead) { return; }
  this.setState(FirebroObject.STATE.BONK);
  this.moveSpeed = FirebroObject.BONK_IMP.x;
  this.fallSpeed = FirebroObject.BONK_IMP.y;
  this.dead = true;
  this.play("kick.mp3", 1., .04);
};

FirebroObject.prototype.kill = function() { /* No standard killstate */ };
FirebroObject.prototype.isTangible = GameObject.prototype.isTangible;
FirebroObject.prototype.destroy = GameObject.prototype.destroy;

FirebroObject.prototype.setState = function(STATE) {
  if(STATE === this.state) { return; }
  this.state = STATE;
  if(STATE.SPRITE.length > 0) { this.sprite = STATE.SPRITE[0]; }
  this.anim = 0;
};

FirebroObject.prototype.draw = function(sprites) {
  /* Disabled */
  if(this.disabled) { return; }
  
  var mod;
  if(this.state === FirebroObject.STATE.BONK) { mod = 0x03; }
  else if(this.disabledTimer > 0) { mod = 0xA0 + parseInt((1.-(this.disabledTimer/FirebroObject.ENABLE_FADE_TIME))*32.); }
  else { mod = 0x00; }
  
  if(this.sprite.INDEX instanceof Array) {
    var s = this.sprite.INDEX;
    for(var i=0;i<s.length;i++) {
      for(var j=0;j<s[i].length;j++) {
        sprites.push({pos: vec2.add(this.pos, vec2.make(j,i)), reverse: !this.dir, index: s[mod!==0x03?i:(s.length-1-i)][j], mode: mod});
      }
    }
  }
  else { sprites.push({pos: this.pos, reverse: !this.dir, index: this.sprite.INDEX, mode: mod}); }
};

FirebroObject.prototype.play = GameObject.prototype.play;

/* Register object class */
GameObject.REGISTER_OBJECT(FirebroObject);