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
  context.translate(0.5, 0.5);
  context.translate(parseInt(this.canvas.width*.5), parseInt(this.canvas.height*.5));
  context.scale(this.camera.scale, this.camera.scale);
  context.translate(parseInt(-this.camera.pos.x*Display.TEXRES), parseInt(-this.camera.pos.y*Display.TEXRES));
  
  /* Draw Game */
  if(this.drawGame) {
    if(zone.background.length && !app.settings.disableBg) {
      for (var i=0; i<zone.background.length; i++) {
        var layer = zone.background[i];
        
        this.drawBackground(layer, false);
        for (var j = 0; j < zone.layers.length; j++) {
          this.drawMap(zone.layers[j].data, false); // Render depth 0
          if(zone.layers[j].z == 0) {
            this.drawObject();
            this.drawMap(zone.layers[j].data, true); // Render depth 1
          }
        }
        this.drawBackground(layer, true);
      }
    } else {
      for (var j = 0; j < zone.layers.length; j++) {
        this.drawMap(zone.layers[j].data, false); // Render depth 0
        if(zone.layers[j].z == 0) {
          this.drawObject();
          this.drawMap(zone.layers[j].data, true); // Render depth 1
        }
      }
    }

    this.drawEffect();
  };
  
  /* Draw UI */
  context.restore();
  this.drawTouch();
  this.drawUI();

  for(var i=0;i<this.game.panel.panels.length;i++) {
    var panel = this.game.panel.panels[i];
    if(panel.active) { panel.draw(this, this.resource); }
  }
};

/* Draw Background/Foreground */
Display.prototype.drawBackground = function(layer, depth) {
  var context = this.context;
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  var texture = this.resource.getTexture("bg" + layer.z + zone.level + zone.id);
  var tex;

  if(texture.animated !== undefined) {
    var frames = texture.frames;
    var delay = texture.delay;
    
    tex = frames[Math.floor(this.game.frame % (texture.length * delay) / delay)];
  } else {
    tex = texture;
  }

  if(layer.z < 1 && depth) { return; }

  if(tex) {
    var loopCount = layer.loop || parseInt(dim.x*16/tex.width)+1; //Maybe should be Math.round instead of parseInt

    if(loopCount <= 1) {
      /* Draw once */
      context.drawImage(tex, this.camera.pos.x * layer.speed + layer.offset.x, layer.offset.y, tex.width, tex.height);
    } else {
      for (var i=0; i<loopCount; i++) {
        var len = tex.width*i;
        context.drawImage(tex, this.camera.pos.x * layer.speed + layer.offset.x + len, layer.offset.y, tex.width, tex.height);
      }
    }
  }
}

Display.prototype.drawMap = function(data, depth) {
  var context = this.context; // Sanity
  
  var tex = this.resource.getTexture("map");
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  
  /* Culling */
  var w = ((this.canvas.width/Display.TEXRES)*.55)/this.camera.scale;
  var cx0 = Math.max(0, Math.min(dim.x, parseInt(this.camera.pos.x - w)));
  var cx1 = Math.max(0, Math.min(dim.x, parseInt(this.camera.pos.x + w)));
  
  for(var i=0;i<data.length;i++) {
    var row = data[i];
    for(var j=cx0;j<cx1;j++) {
      var t = row[j];
      var td = td32.decode16(t);
      if(Boolean(td.depth) !== depth) { continue; }
      var st;
      var ind = td.index;

      if(ind === 30) { continue; } // Do not render tile 30

      if(ind in TILE_ANIMATION_FILTERED) {
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
  var regens = [];
  for(var i=0;i<this.game.objects.length;i++) {
    var obj = this.game.objects[i];
    if(obj.level === zone.level && obj.zone === zone.id && obj.pid !== this.game.pid) {
      if((obj.pos.x >= cx0 && obj.pos.x <= cx1) || obj instanceof TextObject) {
        if(obj.write) { if(obj instanceof PlayerObject) {
          if(!this.game.disableText) { obj.write(names) }
        } else { obj.write(texts); } }
        if(obj.draw) { obj.draw(sprites); }
      }
    }
  }

  for(var i=0;i<zone.regens.length;i++) {
    regens.push(zone.regens[i]);
  }
  
  var ply = this.game.getPlayer();
  if(ply && ply.level === zone.level && ply.zone === zone.id) { ply.draw(sprites); ply.write(names); } // Draw our character last.
  
  var tex = this.resource.getTexture("obj");
  var mario = this.resource.getTexture("mario");
  var luigi = this.resource.getTexture("luigi");
  var infringio = this.resource.getTexture("infringio");
  var wario = this.resource.getTexture("wario");
  
  for(var i=0;i<sprites.length;i++) {
    var sprite = sprites[i];
    
    var st = util.sprite.getSprite(sprite.player ? mario : tex, sprite.index);
    var rx = !!sprite.reverse, ry = false;
    var x, y;
    
    var rest = false;
    switch(sprite.mode) {
      case 0x00 : { break; }  // Standard
      case 0x01 : { context.save(); rest = true; this.game.gameMode === 1 ? context.globalAlpha = 1 : context.globalAlpha = .5; break; }  // 50% Transparent
      case 0x02 : { if(parseInt(this.game.frame*.5) % 2 === 0) { context.save(); rest = true; context.globalCompositeOperation = "lighter"; } break; }  // Flashing Composite
      case 0x03 : { ry = true; break; } // Vertical mirror
      default : { if(sprite.mode >= 0xA0 && sprite.mode < 0xC0) { context.save(); rest = true; context.globalAlpha = parseFloat(sprite.mode-0xA0)/32.; break; } } // Transparency settings
    }
    
    if(rx || ry) { context.save(); context.scale(rx?-1.:1., ry?-1.:1.); }
    x = rx?((-1.*(Display.TEXRES*sprite.pos.x))-Display.TEXRES):(Display.TEXRES*sprite.pos.x);
    y = ry?((-1.*(Display.TEXRES*(dim.y-sprite.pos.y-1.)))-Display.TEXRES):(Display.TEXRES*(dim.y-sprite.pos.y-1.));

    context.drawImage(sprite.player ? (sprite.character ? (sprite.character === 3 ? wario : sprite.character === 2 ? infringio : luigi) : mario) : tex, st[0], st[1], Display.TEXRES, Display.TEXRES, x, y, Display.TEXRES, Display.TEXRES);
    
    if(rx || ry) { context.restore(); }
    if(rest) { context.restore(); }
  }
  
  for(var i=0;i<texts.length;i++) {
    var txt = texts[i];
    var x = (Display.TEXRES*txt.pos.x)+(Display.TEXRES*.5);
    var y = (Display.TEXRES*(dim.y-txt.pos.y-1.))+(Display.TEXRES*.5);
    
    context.fillStyle = txt.color;
    context.font = (txt.size*Display.TEXRES)+1 + "px SmbWeb";
    context.textAlign = "center";
    if(this.game instanceof Lobby) {
      var hitblock = this.game.objects.filter(obj=>obj instanceof TextObject).filter(obj=> obj.text.startsWith("Hit this"));
      var voteperc = this.game.objects.filter(obj=>obj instanceof TextObject).filter(obj=> obj.text.startsWith("If 70%"));
      if(hitblock.length > 0) {
        hitblock[0].text = TEXTS['#LOBBY_HIT_BLOCK'][app.lang];
      }

      if(voteperc.length > 0) {
        voteperc[0].text = TEXTS['#LOBBY_VOTE_PERCENT'][app.lang];
      }
    }
    context.fillText(txt.text, x, y+1);
    if(!txt.noOutline) {
      context.font = (txt.size*Display.TEXRES)+1 + "px SmbOutline";
      context.fillStyle = txt.outline ? txt.outline : "#000073";
      context.fillText(txt.text, x, y+1);
    }
  }

  for(var i=0;i<names.length;i++) {
    var txt = names[i];
    var x = (Display.TEXRES*txt.pos.x)+(Display.TEXRES*.5);
    var y = (Display.TEXRES*(dim.y-txt.pos.y-1.))+(Display.TEXRES*.5);
    
    context.fillStyle = txt.color;
    context.font = (txt.size*Display.TEXRES) + "px SmbWeb";
    context.textAlign = "center";
    context.fillText(txt.text, x, y);
    if(!txt.noOutline) {
      context.font = (txt.size*Display.TEXRES) + "px SmbOutline";
      context.fillStyle = txt.outline ? txt.outline : "#000073";
      context.fillText(txt.text, x, y);
    }
  }
};

Display.prototype.drawEffect = function() {
  var context = this.context; // Sanity
  
  var zone = this.game.getZone();
  var dim = zone.dimensions();
  
  var texMap = this.resource.getTexture("map");
  var texObj = this.resource.getTexture("obj");
  var texEffects = this.resource.getTexture("effects");
  var texEmotes = this.resource.getTexture("emotes");
  
  var fxs = [];
  zone.getEffects(fxs);
  
  for(var i=0;i<fxs.length;i++) {
    var fx = fxs[i];
    
    var tex;
    switch(fx.tex) {
      case "map" : { tex = texMap; break; }
      case "obj" : { tex = texObj; break; }
      case "effects": { tex = texEffects; break; }
      case "emotes": { tex = texEmotes; break; }
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
  var COIN = [0x00F0, 0x00F1, 0x00F2, 0x00F3];
  var PLAY = 0x00;
  var SFX = [0x01, 0x04];
  var MUSIC = [0x00, 0x03];
  var TEXT = [0x02, 0x05];
  var OPT = 0x06;
  var PAD = 0x07;
  var KILL = 0x09;
  var c = COIN[parseInt(this.game.frame/6) % COIN.length];

  var tex = this.resource.getTexture("obj");
  var martex = this.resource.getTexture("mario");
  var luitex = this.resource.getTexture("luigi");
  var inftex = this.resource.getTexture("infringio");
  var wartex = this.resource.getTexture("wario");
  var uitex = this.resource.getTexture("ui");
  var ply = this.game.getPlayerInfo(this.game.pid);

  this.drawGame = true;

  var level;
  if(this.game.levelWarpId !== undefined) { level = this.game.world.getLevel(this.game.levelWarpId); }
  else if(this.game.startDelta === undefined) { level = this.game.world.getLevel(this.game.getDebug("level")) || this.game.world.getInitialLevel(); }
  
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
    context.fillText(level.name.toUpperCase(), W*.5, H*.5);
    
    if(this.game.startTimer >= 0) {
      context.fillStyle = "white";
      context.font = "24px SmbWeb";
      context.textAlign = "center";
      context.fillText(TEXTS["#GAME_STARTS_IN"][app.lang].toUpperCase() + ": " + parseInt(this.game.startTimer/60), W*.5, (H*.5)+40);
    }

    this.drawGame = false;
  }

  if(this.game.getDebug("level") || this.game.getDebug("zone") || this.game.getDebug("god") || this.game.getDebug("lives") || this.game.getDebug("powerup") || this.game.getDebug("star")) {
    context.textAlign = "left";
    context.fillStyle = "whitesmoke";
    context.globalAlpha = 1;
    context.font = "18px SmbWeb";
    context.fillText("Debug",0,this.canvas.height);

    context.font = "18px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText("Debug",0,this.canvas.height);
  }
  
  if(this.game.victory > 0) {
    context.fillStyle = "white";

    context.font = "32px SmbWeb";
    context.textAlign = "center";
    context.fillText((this.game.victory<=3?"VICTORY ROYALE #":TEXTS["#GAME_TOO_BAD"][app.lang]+" #") + this.game.victory, W*.5, 40);
    
    context.font = "32px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText((this.game.victory<=3?"VICTORY ROYALE #":TEXTS["#GAME_TOO_BAD"][app.lang]+" #") + this.game.victory, W*.5, 40);

    context.fillStyle = "white";
    context.font = "24px SmbWeb";
    context.textAlign = "center";
    context.fillText(TEXTS["#GAME_MATCH_STATS"][app.lang] + ":", 0.8 * W, 0.3 * H);
    
    context.fillStyle = "white";
    context.font = "24px SmbWeb";
    context.textAlign = "center";
    context.fillText(TEXTS["#GAME_MATCH_STATS"][app.lang] + ":", 0.8 * W, 0.3 * H);
    
    context.font = "24px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText(TEXTS["#GAME_MATCH_STATS"][app.lang] + ":", 0.8 * W, 0.3 * H);
    
    context.font = "24px SmbWeb";
    context.fillStyle = "white";
    context.fillText(this.game.getGameTimer() + " " + TEXTS["#GAME_TIME_ELAPSED"][app.lang], 0.8 * W, 0.3 * H + 24);
    
    context.font = "24px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText(this.game.getGameTimer() + " " + TEXTS["#GAME_TIME_ELAPSED"][app.lang], 0.8 * W, 0.3 * H + 24);

    context.fillStyle = "white";
    context.font = "24px SmbWeb";
    context.fillText(this.game.kills + " " + TEXTS["#GAME_PLAYERS_KILLED"][app.lang], 0.8 * W, 0.3 * H + 28 + 20);

    context.font = "24px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText(this.game.kills + " " + TEXTS["#GAME_PLAYERS_KILLED"][app.lang], 0.8 * W, 0.3 * H + 28 + 20);

    context.fillStyle = "white";
    context.font = "24px SmbWeb";
    context.fillText(this.game.coins + " " + TEXTS["#GAME_COINS_COLLECTED"][app.lang], 0.8 * W, 0.3 * H + 32 + 16 + 20);
    
    context.font = "24px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText(this.game.coins + " " + TEXTS["#GAME_COINS_COLLECTED"][app.lang], 0.8 * W, 0.3 * H + 32 + 16 + 20);
  }
  else {
    context.fillStyle = "white";
    context.font = "24px SmbWeb";
    context.textAlign = "left";
    context.fillText(ply?ply.name:"MARIO", 56, 32);
    
    context.font = "24px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText(ply?ply.name:"MARIO", 56, 32);

    var st = util.sprite.getSprite(tex, c);
    var ctxt = "×"+(this.game.coins<=9?"0"+this.game.coins:this.game.coins);
    var l = context.measureText(ctxt).width + 30;
    context.drawImage(tex, st[0], st[1], Display.TEXRES, Display.TEXRES, 8, 64, 48, 48);
    context.font = "24px SmbWeb";
    context.fillStyle = "white";
    context.fillText(ctxt, 60, 100);
    
    context.font = "24px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText(ctxt, 60, 100);
    
    var st = util.sprite.getSprite(app.net.character ? (app.net.character === 3 ? wartex : app.net.character === 2 ? inftex : luitex) : martex, PLAY);
    context.drawImage(app.net.character ? (app.net.character === 3 ? wartex : app.net.character === 2 ? inftex : luitex) : martex, st[0], st[1], Display.TEXRES, Display.TEXRES, 8, 6, 48, 48);

    var st = util.sprite.getSprite(uitex, KILL);
    var ctxt = "×"+(this.game.kills<=9?"0"+this.game.kills:this.game.kills);
    var l = context.measureText(ctxt).width + 30;
    
    context.fillStyle = "white";
    context.font = "24px SmbWeb";
    context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, 8, 116, 48, 48);
    context.fillText(ctxt, 60, 150);

    context.font = "24px SmbOutline";
    context.fillStyle = "#000073";
    context.fillText(ctxt, 60, 150);

    if(this.game.getDebug("lives")) {
      context.font = "24px SmbWeb";
      context.fillStyle = "white";
      context.fillText("×INF", l-42, 60);
      
      context.font = "24px SmbOutline";
      context.fillStyle = "#000073";
      context.fillText("×INF", l-42, 60);
    } else {
      context.font = "24px SmbWeb";
      context.fillStyle = "white";
      context.fillText("×"+(this.game.lives<=9?"0"+this.game.lives:this.game.lives), l-42, 60);
      
      context.font = "24px SmbOutline";
      context.fillStyle = "#000073";
      context.fillText("×"+(this.game.lives<=9?"0"+this.game.lives:this.game.lives), l-42, 60);
    }

    var w;
    if(this.game instanceof Game) {
      context.font = "24px SmbWeb";
      if(!app.settings.hideTimer) {
        var time = this.game.getGameTimer(this.game.touchMode);
        var w =  context.measureText(time).width;
        context.fillStyle = "white";
        context.fillText(time, (W/2)-(w/2), 32);
        
        context.font = "24px SmbOutline";
        context.fillStyle = "#000073";
        context.fillText(time, (W/2)-(w/2), 32);
      }

      var txt = this.game.touchMode ? this.game.remain : this.game.remain + " " + TEXTS["#GAME_PLAYERS_REMAIN"][app.lang].toUpperCase();
      w = context.measureText(txt).width;
      context.fillStyle = "white";
      context.font = "24px SmbWeb";
      context.fillText(txt, W-w-8, 32);
      
      context.font = "24px SmbOutline";
      context.fillStyle = "#000073";
      context.fillText(txt, W-w-8, 32);
    }
    else if(this.game instanceof Lobby) {
      var txt = this.game.players.length + (this.game.touchMode?"":" / 75 " + TEXTS["#GAME_LOBBY_PLAYERS"][app.lang]).toUpperCase();
      w = context.measureText(txt).width;
      context.font = "24px SmbWeb";
      context.fillStyle = "white";
      context.fillText(txt, W-w-8, 32);
      
      context.font = "24px SmbOutline";
      context.fillStyle = "#000073";
      context.fillText(txt, W-w-8, 32);

      if(app.private && app.roomCode) {
        var txt = "ROOM CODE";
        context.font = "24px SmbWeb";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(txt, W*.5, H-120);
        context.fillText(app.roomCode.toUpperCase(), W*.5, H-90);
      
        context.font = "24px SmbOutline";
        context.fillStyle = "#000073";
        context.fillText(txt, W*.5, H-120);
        context.fillStyle = "#000020"
        context.fillText(app.roomCode.toUpperCase(), W*.5, H-90);
      }
    }

    var st = util.sprite.getSprite(uitex, MUSIC[app.settings.musicVolume===0?1:this.game.audio.muteMusic?1:0]);
    context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-48, 40, 36, 36);

    var st = util.sprite.getSprite(uitex, SFX[app.settings.soundVolume===0?1:this.game.audio.muteSound?1:0]);
    context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-92, 40, 36, 36);

    var st = util.sprite.getSprite(uitex, TEXT[this.game.disableText?1:0]);
    context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-136, 40, 36, 36);

    var st = util.sprite.getSprite(uitex, OPT);
    context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-180, 40, 36, 36);

    if(!this.game.touchMode) {
      var st = util.sprite.getSprite(uitex, PAD);
      context.drawImage(uitex, st[0], st[1], Display.TEXRES, Display.TEXRES, W-224, 40, 36, 36);
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
  context.fillRect(0,0,this.canvas.width,this.canvas.height)
  
  context.font = "32px SmbWeb";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.fillText(TEXTS["#LOADING_RESOURCES"][app.lang].toUpperCase(), W*.5, H*.5);
};

Display.prototype.destroy = function() {
  
};