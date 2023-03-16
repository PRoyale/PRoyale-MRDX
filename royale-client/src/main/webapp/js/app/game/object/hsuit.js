"use strict";
/* global util, vec2, squar */
/* global GameObject, ItemObject */
/* global NET011, NET020 */

function HammerSuitObject(game, level, zone, pos, oid) {
  ItemObject.call(this, game, level, zone, pos, oid);
  
  this.state = HammerSuitObject.STATE.IDLE;
  this.sprite = this.state.SPRITE[0];
  
  this.groundTimer = 0;
}

/* === STATIC =============================================================== */
HammerSuitObject.ASYNC = false;
HammerSuitObject.ID = 0x58;
HammerSuitObject.NAME = "Hammer Suit"; // Used by editor

HammerSuitObject.JUMP_LENGTH = 36;
HammerSuitObject.MOVE_SPEED_MAX = 0.08;
HammerSuitObject.JUMP_DELAY = 2;
HammerSuitObject.FALL_SPEED_MAX = 0.225;

HammerSuitObject.SPRITE = {};
HammerSuitObject.SPRITE_LIST = [
  {NAME: "IDLE", ID: 0x00, INDEX: 0x00DE}
];

/* Makes sprites easily referenceable by NAME. For sanity. */
for(var i=0;i<HammerSuitObject.SPRITE_LIST.length;i++) {
  HammerSuitObject.SPRITE[HammerSuitObject.SPRITE_LIST[i].NAME] = HammerSuitObject.SPRITE_LIST[i];
  HammerSuitObject.SPRITE[HammerSuitObject.SPRITE_LIST[i].ID] = HammerSuitObject.SPRITE_LIST[i];
}

HammerSuitObject.STATE = {};
HammerSuitObject.STATE_LIST = [
  {NAME: "IDLE", ID: 0x00, SPRITE: [HammerSuitObject.SPRITE.IDLE]}
];

/* Makes states easily referenceable by either ID or NAME. For sanity. */
for(var i=0;i<HammerSuitObject.STATE_LIST.length;i++) {
  HammerSuitObject.STATE[HammerSuitObject.STATE_LIST[i].NAME] = HammerSuitObject.STATE_LIST[i];
  HammerSuitObject.STATE[HammerSuitObject.STATE_LIST[i].ID] = HammerSuitObject.STATE_LIST[i];
}

/* === INSTANCE ============================================================= */

HammerSuitObject.prototype.update = ItemObject.prototype.update;
HammerSuitObject.prototype.step = ItemObject.prototype.step;

HammerSuitObject.prototype.control = function() {
  this.moveSpeed = this.dir ? -HammerSuitObject.MOVE_SPEED_MAX : HammerSuitObject.MOVE_SPEED_MAX;
  if(this.grounded && ++this.groundTimer >= HammerSuitObject.JUMP_DELAY) { this.jump = 0; }
  else if(this.jump > HammerSuitObject.JUMP_LENGTH) { this.jump = -1; this.groundTimer = 0; }
};

HammerSuitObject.prototype.physics = ItemObject.prototype.physics;

HammerSuitObject.prototype.bounce = ItemObject.prototype.bounce;

HammerSuitObject.prototype.playerCollide = ItemObject.prototype.playerCollide;
HammerSuitObject.prototype.playerStomp = ItemObject.prototype.playerStomp;
HammerSuitObject.prototype.playerBump = ItemObject.prototype.playerBump;

HammerSuitObject.prototype.kill = ItemObject.prototype.kill;
HammerSuitObject.prototype.destroy = GameObject.prototype.destroy;
HammerSuitObject.prototype.isTangible = GameObject.prototype.isTangible;

HammerSuitObject.prototype.setState = ItemObject.prototype.setState;
HammerSuitObject.prototype.draw = ItemObject.prototype.draw;

/* Register object class */
GameObject.REGISTER_OBJECT(HammerSuitObject);