"use strict";
/* global app */
/* global Effect */
/* global util, vec2 */
/* global EmotePanel */

function EmoteEffect(pos, pid, emote) {
  Effect.call(this, pos);
  
  this.life = EmoteEffect.LIFE_TIME;
  this.sprite = 0;
  this.anim = 0;

  /* Player info */
  this.pid = pid;
  this.emote = EmotePanel.EMOTES[emote];
  
  this.bits = [
    {
      pos: vec2.add(this.pos, vec2.make(0.,0.)),
      
      sp: vec2.make(0.,0.),   // Sprite Position
      ss: vec2.make(1.,1.),   // Sprite Size
      so: vec2.make(0.,0.)    // Sprite Offset [ NOTE: This is actually unused ]
    }
  ];
};

EmoteEffect.SPRITE = [0x012];

EmoteEffect.ANIMATION_RATE = 1;
EmoteEffect.LIFE_TIME = 100;

EmoteEffect.prototype.step = function() {
  Effect.prototype.step.call(this);

  var ghost = app.game.getGhost(this.pid);
  if(ghost) { this.bits[0].pos = vec2.make(ghost.pos.x, ghost.sprite.ID >= 0x20 ? ghost.pos.y+2.5 : ghost.pos.y+1.5) }
  else {
    this.destroy();
  }
  
  this.sprite = EmoteEffect.SPRITE[parseInt(this.anim++/EmoteEffect.ANIMATION_RATE) % EmoteEffect.SPRITE.length];
};

EmoteEffect.prototype.destroy = Effect.prototype.destroy;

EmoteEffect.prototype.draw = function(fxs) {
  for(var i=0;i<this.bits.length;i++) {
    var bit = this.bits[i];
    
    /* Pop-up */
    fxs.push({
      tex: "emotes",
      ind: this.sprite,
      
      pos: bit.pos,
      off: bit.so,
      rot: 0,
      
      sp: bit.sp,
      ss: bit.ss
    });

    /* Emote */
    fxs.push({
        tex: "emotes",
        ind: this.emote,

        pos: bit.pos,
        off: bit.so,
        rot: 0,

        sp: bit.sp,
        ss: bit.ss
    })
  } 
};