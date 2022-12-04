"use strict";
/* global util, td32 */
/* global Game, Lobby */
/* global TextObject */

function Display(game, container, canvas, resource) {
  this.game = game;
  this.container = container;
  this.canvas = canvas;
  this.context = this.canvas.getContext("2d");
  
  this.resource = new Resource(resource);
  this.camera = new Camera(this);
  this.drawGame = true;
  
  var context = this.context; // Sanity
}

Display.TEXRES = 16.;     // Texture resolution. The resolution of a single sprite in a sprite sheet.
Display.TEXRES_24 = 24;   // 24x24 texture resolution. We need this... sometimes.

/* Clears the canvas resizes it to fill the screen if nesscary. */
Display.prototype.clear = function() {
  var context = this.context; // Sanity
  
  // Resize if needed.
  if(this.container.clientWidth !== this.canvas.width || this.container.clientHeight !== this.canvas.height) {
    this.canvas.width = this.container.clientWidth; this.canvas.height = this.container.clientHeight;
  }
  
  // Clear
  context.clearRect(0,0,this.canvas.width,this.canvas.height);
  
  // Set Render Settings  ( these reset any time the canvas is resized, so I just set them every draw )
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;
  context.msImageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false;
};

Display.prototype.draw = function() {
  var context = this.context; // Sanity
  
  this.clear();
  
  /* Background color */
  context.fillStyle = this.game.getZone().color;
  context.fillRect(0,0,this.canvas.width,this.canvas.height);
  
  /* Loading Check */
  if(!this.resource.ready()) {
    this.drawLoad();
    return;
  }
  
  /* Camera Transform */
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  
  context.save();
  //context.translate(0.5, 0.5);
  context.translate(parseInt(this.canvas.width*.5), parseInt(this.canvas.height*.5));
  context.scale(this.camera.scale, this.camera.scale);
  context.translate(parseInt(-this.camera.pos.x*Display.TEXRES), parseInt(-this.camera.pos.y*Display.TEXRES));
  
  /* Draw Game */
  if (this.drawGame) {
    this.drawBackground();
    this.drawMap(false); // Render background
    this.drawObject();
    this.drawMap(true);  // Render foreground
    this.drawEffect();
  };
  
  /* Draw UI */
  context.restore();
  this.drawTouch();
  this.drawUI();
};

Display.prototype.drawBackground = function() {
  var context = this.context;
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  var tex = this.resource.getTexture("bg" + zone.level + zone.id);
  var texas = this.resource.getTexture("bgs" + zone.level + zone.id);

  if (zone.bgs && texas) {
    var bg = zone.bgs;
    var loopCount = bg.loop || parseInt(dim.x*16/texas.width)+1 //Maybe should be Math.round instead of parseInt
  
    if (loopCount <= 1) {
      /* Draw once */
      context.drawImage(texas, this.camera.pos.x * bg.speed + bg.offset.x, bg.offset.y, texas.width, texas.height);
    } else {
      for (var i=0; i<loopCount; i++) {
        var len = tex.width*i;
        context.drawImage(texas, this.camera.pos.x * bg.speed + bg.offset.x + len, bg.offset.y, texas.width, texas.height);
      }
    }
  };
  
  if (zone.bg && tex) {
    var bg = zone.bg;
    var loopCount = bg.loop || parseInt(dim.x*16/tex.width)+1 //Maybe should be Math.round instead of parseInt
  
    if (loopCount <= 1) {
      /* Draw once */
      context.drawImage(tex, this.camera.pos.x * bg.speed + bg.offset.x, bg.offset.y, tex.width, tex.height);
    } else {
      for (var i=0; i<loopCount; i++) {
        var len = tex.width*i;
        context.drawImage(tex, this.camera.pos.x * bg.speed + bg.offset.x + len, bg.offset.y, tex.width, tex.height);
      }
    }
  };
};

Display.prototype.drawMap = function(depth) {
  var context = this.context; // Sanity
  
  var tex = this.resource.getTexture("map");
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  
  /* Culling */
  var w = ((this.canvas.width/Display.TEXRES)*.55)/this.camera.scale;
  var cx0 = Math.max(0, Math.min(dim.x, parseInt(this.camera.pos.x - w)));
  var cx1 = Math.max(0, Math.min(dim.x, parseInt(this.camera.pos.x + w)));
  
  for(var i=0;i<zone.data.length;i++) {
    var row = zone.data[i];
    for(var j=cx0;j<cx1;j++) {
      var t = row[j];
      var td = td32.decode16(t);
      if(Boolean(td.depth) !== depth) { continue; }
      var st;
      var ind = td.index;

      if (ind in TILE_ANIMATION_FILTERED) {
        var anim = TILE_ANIMATION_FILTERED[ind];
        var delay = anim.delay;
        var frame = Math.floor(this.game.frame % (anim.tiles.length * delay) / delay);
        st = util.sprite.getSprite(tex, anim.tiles[frame], true);
      } else {
        st = util.sprite.getSprite(tex, ind);
      }

      var bmp = 0;
      var adj = Math.max(0, td.bump-7);
      if(adj > 0) {
        bmp = Math.sin((1.-((adj-2)/8.))*Math.PI)*0.22;
      }
      context.drawImage(tex, st[0], st[1], Display.TEXRES, Display.TEXRES, Display.TEXRES*j, Display.TEXRES*(i-bmp), Display.TEXRES, Display.TEXRES);
    }
  }
};

Display.prototype.drawObject = function() {
  var context = this.context; // Sanity
  
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  
  /* Culling Bounds */
  var w = ((this.canvas.width/Display.TEXRES)*.75)/this.camera.scale;
  var cx0 = Math.max(0, Math.min(dim.x, parseInt(this.camera.pos.x - w)));
  var cx1 = Math.max(0, Math.min(dim.x, parseInt(this.camera.pos.x + w)));
  
  var sprites = [];
  var texts = [];
  var names = [];
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj.level === zone.level && obj.zone === zone.id && obj.pid !== this.game.pid) {
      if((obj.pos.x >= cx0 && obj.pos.x <= cx1) || obj instanceof TextObject) {
        if(obj.write) { if (obj instanceof PlayerObject) {
          if (!this.game.disableText) { obj.write(names) }
        } else { obj.write(texts); } }
        if(obj.draw) { obj.draw(sprites); }
      }
    }
  }
  
  var ply = this.game.getPlayer();
  if(ply && ply.level === zone.level && ply.zone === zone.id) { ply.draw(sprites); ply.write(names); } // Draw our character last.
  
  var tex = this.resource.getTexture("obj");
  var player = this.resource.getTexture("player");
  
  for(var i=0;i<sprites.length;i++) {
    var sprite = sprites[i];
    
    var st = util.sprite.getSprite(tex, sprite.index);
    var rx = !!sprite.reverse, ry = false;
    var x, y;
    
    var rest = false;
    switch(sprite.mode) {
      case 0x00 : { break; }  // Standard
      case 0x01 : { context.save(); rest = true; context.globalAlpha = .5; break; }  // 50% Transparent
      case 0x02 : { if(parseInt(this.game.frame*.5) % 2 === 0) { context.save(); rest = true; context.globalCompositeOperation = "lighter"; } break; }  // Flashing Composite
      case 0x03 : { ry = true; break; } // Vertical mirror
      default : { if(sprite.mode >= 0xA0 && sprite.mode < 0xC0) { context.save(); rest = true; context.globalAlpha = parseFloat(sprite.mode-0xA0)/32.; break; } } // Transparency settings
    }
    
    if(rx || ry) { context.save(); context.scale(rx?-1.:1., ry?-1.:1.); }
    x = rx?((-1.*(Display.TEXRES*sprite.pos.x))-Display.TEXRES):(Display.TEXRES*sprite.pos.x);
    y = ry?((-1.*(Display.TEXRES*(dim.y-sprite.pos.y-1.)))-Display.TEXRES):(Display.TEXRES*(dim.y-sprite.pos.y-1.));

    context.drawImage(sprite.player ? player : tex, st[0], st[1], Display.TEXRES, Display.TEXRES, x, y, Display.TEXRES, Display.TEXRES);
    
    if(rx || ry) { context.restore(); }
    if(rest) { context.restore(); }
  }
  
  for(var i=0;i<texts.length;i++) {
    var txt = texts[i];
    var x = (Display.TEXRES*txt.pos.x)+(Display.TEXRES*.5);
    var y = (Display.TEXRES*(dim.y-txt.pos.y-1.))+(Display.TEXRES*.5);
    
    context.fillStyle = txt.color;
    context.strokeStyle = "blue";
    context.font = (txt.size*Display.TEXRES) + "px SmbWeb";
    context.textAlign = "center";
    context.strokeText(txt.text, x, y);
    context.fillText(txt.text, x, y);
  }

  for(var i=0;i<names.length;i++) {
    var txt = names[i];
    var x = (Display.TEXRES*txt.pos.x)+(Display.TEXRES*.5);
    var y = (Display.TEXRES*(dim.y-txt.pos.y-1.))+(Display.TEXRES*.5);
    
    context.fillStyle = txt.color;
    context.strokeStyle = "blue";
    context.font = (txt.size*Display.TEXRES) + "px SmbWeb";
    context.textAlign = "center";
    context.strokeText(txt.text, x, y);
    context.fillText(txt.text, x, y);
  }
};

Display.prototype.drawEffect = function() {
  var context = this.context; // Sanity
  
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  
  var texMap = this.resource.getTexture("map");
  var texObj = this.resource.getTexture("obj");
  var texEffects = this.resource.getTexture("effects");
  
  var fxs = [];
  zone.getEffects(fxs);
  
  for(var i=0;i<fxs.length;i++) {
    var fx = fxs[i];
    
    var tex;
    switch(fx.tex) {
      case "map" : { tex = texMap; break; }
      case "obj" : { tex = texObj; break; }
      case "effects": { tex = texEffects; break; }
    }
    
    var st = util.sprite.getSprite(tex, fx.ind);
    st[0] = parseInt(st[0] + (fx.sp.x * Display.TEXRES));
    st[1] = parseInt(st[1] + (fx.sp.y * Display.TEXRES));
    
    context.save();
    context.translate(parseInt(Display.TEXRES*fx.ss.x*.5), parseInt(Display.TEXRES*fx.ss.y*.5));
    context.translate(Display.TEXRES*fx.pos.x, Display.TEXRES*(dim.y-fx.pos.y-1.));
    context.rotate(fx.rot);
    context.translate(-parseInt(Display.TEXRES*fx.ss.x*.5), -parseInt(Display.TEXRES*fx.ss.y*.5));
    context.drawImage(tex, st[0], st[1], parseInt(Display.TEXRES*fx.ss.x), parseInt(Display.TEXRES*fx.ss.y), 0, 0, parseInt(Display.TEXRES*fx.ss.x), parseInt(Display.TEXRES*fx.ss.y));
    context.restore();
  }
  
};

/* @TODO: this class is a fucking mess here. this needs heavy refactoring */
Display.prototype.drawUI = function() {
  var context = this.context; // Sanity
  var W = this.canvas.width;
  var H = this.canvas.height;
  var COIN = [0x00F0, 0x00F1, 0x00F2, 0x00F1];
  var PLAY = 0x000F;
  var SFX = [0x01, 0x04];
  var MUSIC = [0x00, 0x03];
  var TEXT = [0x02, 0x05];
  var PAD = 0x06;
  var c = COIN[parseInt(this.game.frame/6) % COIN.length];
  var tex = this.resource.getTexture("obj");
  var plytex = this.resource.getTexture("player");
  var uitex = this.resource.getTexture("ui");
  var ply = this.game.getPlayerInfo(this.game.pid);

  this.drawGame = true;

  var level;
  if(this.game.levelWarpId !== undefined) { level = this.game.world.getLevel(this.game.levelWarpId); }
  else if(this.game.startDelta === undefined) { level = this.game.world.getInitialLevel(); }
  
  if(this.game.gameOver) {
    context.fillStyle = "black";
    context.fillRect(0,0,W,H);
    
    context.fillStyle = "white";
    context.font = "32px SmbWeb";
    context.textAlign = "center";
    context.fillText("GAME OVER", W*.5, H*.5);

    this.drawGame = false;
  }
  else if(level) {
    context.fillStyle = "#101010";
    context.fillRect(0,0,W,H);
    
    context.fillStyle = "white";
    context.font = "32px SmbWeb";
    context.textAlign = "center";
    context.fillText(level.name, W*.5, H*.5);
    
    if(this.game.startTimer >= 0) {
      context.font = "24px SmbWeb";
      context.textAlign = "center";
      context.fillText("GAME STARTS IN: " + parseInt(this.game.startTimer/60), W*.5, (H*.5)+40);
    }

    this.drawGame = false;
  }
  
  if(this.game.victory > 0) {
    context.fillStyle = "white";
    context.font = "32px SmbWeb";
    context.textAlign = "center";
    context.fillText((this.game.victory<=3?"VICTORY ROYALE #":"TOO BAD #") + this.game.victory, W*.5, 40);
  }
  else {
    context.fillStyle = "white";
    context.strokeStyle = "blue";
    context.font = "24px SmbWeb";
    context.textAlign = "left";
    context.fillText((ply?ply.name:"INFRINGIO"), 56, 32);
    context.strokeText((ply?ply.name:"INFRINGIO"), 56, 32);

    var st = util.sprite.getSprite(tex, c);
    var ctxt = "×"+(this.game.coins<=9?"0"+this.game.coins:this.game.coins);
    var l = context.measureText(ctxt).width + 30;
    context.drawImage(tex, st[0], st[1], Display.TEXRES, Display.TEXRES, 8, 64, 48, 48);
    context.fillText(ctxt, l-48, 100);
    context.strokeText(ctxt, l-48, 100);
    var st = util.sprite.getSprite(plytex, PLAY);
    context.drawImage(plytex, st[0], st[1], Display.TEXRES, Display.TEXRES, 8, 6, 48, 48);
    context.fillText("×"+(this.game.lives<=9?"0"+this.game.lives:this.game.lives), l-48, 60);
    context.strokeText("×"+(this.game.lives<=9?"0"+this.game.lives:this.game.lives), l-48, 60);
    var w;
    if(this.game instanceof Game) {
      var txt = this.game.remain + " PLAYERS REMAIN";
      w = context.measureText(txt).width;
      context.fillText(txt, W-w-8, 32);
      context.strokeText(txt, W-w-8, 32);
    }
    else if(this.game instanceof Lobby) {
      var txt = this.game.players.length + (this.game.touchMode?"":" / 75 PLAYERS");
      w = context.measureText(txt).width;
      context.fillText(txt, W-w-8, 32);
      context.strokeText(txt, W-w-8, 32);
    }
    var st = util.sprite.getSprite(uitex, MUSIC[this.game.audio.muteMusic?1:0]);
    context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-24-8, 40, 24, 24);
    var st = util.sprite.getSprite(uitex, SFX[this.game.audio.muteSound?1:0]);
    context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-24-8-24-8, 40, 24, 24);
    var st = util.sprite.getSprite(uitex, TEXT[this.game.disableText?1:0]);
    context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-24-8-24-8-24-8, 40, 24, 24);
    if(this.game.input.pad.connected()) {
      var st = util.sprite.getSprite(uitex, PAD);
      context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-24-8-24-8-24-8-24-8, 40, 24, 24);
    }
  }
};

Display.prototype.drawTouch = function() {
  if(!this.game.touchMode) { return; }
  
  var context = this.context; // Sanity
  var W = this.canvas.width;
  var H = this.canvas.height;
  var S = 85;
  var s = 65;
  var hs = (S-s)*.5;
  
  if(this.game.thumbOrigin) {
    context.fillStyle = "rgba(0,0,0,0.5)";
    context.fillRect(this.game.thumbOrigin.x-(S*.5),this.game.thumbOrigin.y-(S*.5),S,S);
    
    context.fillStyle = "rgba(255,255,255,1.0)";
    context.fillRect(this.game.thumbPos.x-(s*.5),this.game.thumbPos.y-(s*.5),s,s);
  }
  
  context.fillStyle = "rgba(0,0,0,0.5)";
  context.fillRect(W-S,H-S,S,S);
  context.fillRect(W-S,H-(S*2),S,S);
  context.fillStyle = this.game.touchRun?"rgba(255,255,255,0.75)":"rgba(0,0,0,0.5)";
  context.fillRect(W-S,H-(S*3),S,S);
  
  context.fillStyle = "white";
  context.font = s + "px SmbWeb";
  context.textAlign = "left";
  
  var txt = "A";
  var w = context.measureText(txt).width;
  context.fillText(txt, W-w-hs, H-hs);
  
  var txt = "B";
  var w = context.measureText(txt).width;
  context.fillText(txt, W-w-(hs*.75), H-S-hs);
  
  context.fillStyle = this.game.touchRun?"black":"white";
  var txt = "R";
  var w = context.measureText(txt).width;
  context.fillText(txt, W-w-(hs*.75), H-(S*2)-hs);
};

Display.prototype.drawLoad = function() {
  var context = this.context;
  var W = this.canvas.width;
  var H = this.canvas.height;
  
  context.fillStyle = "black";
  context.strokeStyle = "blue";
  context.fillRect(0,0,this.canvas.width,this.canvas.height)
  
  context.font = "32px SmbWeb";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText("Loading Resources...", W*.5, H*.5);
};

Display.prototype.destroy = function() {
  
};