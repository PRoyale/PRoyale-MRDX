"use strict";
/* Background menu renderer */

function MenuDisplay() {
    this.canvas = document.getElementById("menu-canvas");
    this.container = document.getElementById("background");
    this.context = this.canvas.getContext("2d");
    this.frame = 0;
    this.loadWorld("world-1").then(data => {
        this.resource = new Resource(data.resource);
        this.camera = new Camera(this);
        
        this.zone = data.world[0].zone[0];
        if (this.zone.background.length) { this.downloadBackgrounds(this.zone.background) }
        this.loadAnimations(data.assets || "assets.json", data.resource);
        this.position();
        
        var that = this;
        this.frameReq = setInterval(() => {that.draw();}, 1000 / 60) // 60FPS
    }).catch(err => {
        console.error(err);
    });
};

MenuDisplay.prototype.dimensions = function() {
    var zone = this.zone;
    return vec2.make(zone.layers[0].data[0].length, zone.layers[0].data.length);
};

MenuDisplay.prototype.position = function() {
    this.camera.positionX(14);
    this.camera.positionY(7);
};

MenuDisplay.prototype.loadAnimations = function(url, resource) {
    if (!url) { return; }

    var isLink = function(string) {
        let url;
        
        try { url = new URL(string); }
        catch { return false; }
    
        return url.protocol === "http:" || url.protocol === "https:"  
    };

    var filterByTileset = function(dict, tileset) {
        return Object.keys(dict).filter(x => dict[x].tilesets.length == 0 || dict[x].tilesets.includes(tileset))
            .reduce((res, key) => (res[key] = dict[key], res), {});
    };

    var link = isLink(url);
    $.getJSON(link ? url : '/royale/assets/' + url, function(dat) {
      if (dat.tileAnim) {
        TILE_ANIMATION = []
        TILE_ANIMATION_FILTERED = [];
  
        for (var anim of dat.tileAnim) {
            var obj = {};
            obj.tiles = anim.tiles;
            obj.delay = anim.delay;
            obj.tilesets = anim.tilesets || [];
            TILE_ANIMATION[anim.startTile] = obj;
        }
  
        TILE_ANIMATION_FILTERED = filterByTileset(TILE_ANIMATION, resource.filter(x => x.id == "map")[0].src);
      }
    });
};

MenuDisplay.prototype.downloadBackgrounds = function(list) {
    for (var k=0;k<list.length;k++) {
        var layer = list[k];
        var ext = layer.url.split(".").pop().toLowerCase();

        switch(ext) {
          case "png" : { this.resource.loadTexture({ 'id': 'bg' + layer.z + 0 + 0, 'src': layer.url }); break; }
          case "gif" : { this.resource.loadAnimatedTexture({ 'id': 'bg' + layer.z + 0 + 0, 'src': layer.url }); break; }
          default : { app.menu.warn.show("Failed to load resource with unknown extension: " + ext); break; }
        }
    }
};

MenuDisplay.prototype.loadWorld = function(world) {
    var address = window.location.host;
    return new Promise((resolve, reject) => {
        $.ajax({
            url: window.location.protocol + "//" + address + "/royale/game/" + world,
            type: 'GET',
            timeout: 5000,
            success: function(data) {
              resolve(data);
            },
            error: function(e) {
              reject(e);
            }
        });
    });
};

MenuDisplay.prototype.clear = function() {
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

MenuDisplay.TEXRES = 16;
MenuDisplay.CAMERA_SPEED = 0.03416;

MenuDisplay.prototype.draw = function() {
    var context = this.context; // Sanity
    
    this.clear();
    
    /* Background color */
    context.fillStyle = this.zone.color;
    context.fillRect(0,0,this.canvas.width,this.canvas.height);
    
    /* Loading Check */
    if(!this.resource.ready()) {
      this.drawLoad();
      return;
    }
    
    /* Camera Transform */
    var zone = this.zone;

    this.camera.pos.x += MenuDisplay.CAMERA_SPEED;
    if (this.camera.pos.x >= this.dimensions().x-15) {
        /* Reset position */
        this.position();
    }
    this.frame += 1;
    
    context.save();
    context.translate(parseInt(this.canvas.width*.5), parseInt(this.canvas.height*.5));
    context.scale(this.camera.scale, this.camera.scale);
    context.translate(parseInt(-this.camera.pos.x*MenuDisplay.TEXRES), parseInt(-this.camera.pos.y*MenuDisplay.TEXRES));
    
    /* Draw Game */
    if (zone.background.length) {
        for (var i=0; i<zone.background.length; i++) {
          var layer = zone.background[i];
          
          this.drawBackground(layer, false);
          for (var j = 0; j < zone.layers.length; j++) {
            this.drawMap(zone.layers[j].data, false); // Render depth 0
            if (zone.layers[j].z == 0) {
              //this.drawObject();
              this.drawMap(zone.layers[j].data, true); // Render depth 1
            }
          }
          this.drawBackground(layer, true);
        }
    } else {
        for (var j = 0; j < zone.layers.length; j++) {
          this.drawMap(zone.layers[j].data, false); // Render depth 0
          if (zone.layers[j].z == 0) {
            //this.drawObject();
            this.drawMap(zone.layers[j].data, true); // Render depth 1
          }
        }
    }

    context.restore();
};

/* Draw Background/Foreground */
MenuDisplay.prototype.drawBackground = function(layer, depth) {
  var context = this.context;
  var zone = this.zone;
  var dim = vec2.make(zone.layers[0].data[0].length, zone.layers[0].data.length);
  var texture = this.resource.getTexture("bg" + layer.z + 0 + zone.id);
  var tex;

  if (texture.animated !== undefined) {
    var frames = texture.frames;
    var delay = texture.delay;
    
    tex = frames[Math.floor(this.frame % (texture.length * delay) / delay)];
  } else {
    tex = texture;
  }

  if (layer.z < 1 && depth) { return; }

  if (tex) {
    var loopCount = layer.loop || parseInt(dim.x*16/tex.width)+1; //Maybe should be Math.round instead of parseInt

    if (loopCount <= 1) {
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

MenuDisplay.prototype.drawMap = function(data, depth) {
  var context = this.context; // Sanity
  
  var tex = this.resource.getTexture("map");
  var zone = this.zone;
  var dim = vec2.make(zone.layers[0].data[0].length, zone.layers[0].data.length);
  
  /* Culling */
  var w = ((this.canvas.width/MenuDisplay.TEXRES)*.55)/this.camera.scale;
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

      if (ind === 30) { continue; } // Do not render tile 30

      if (ind in TILE_ANIMATION_FILTERED) {
        var anim = TILE_ANIMATION_FILTERED[ind];
        var delay = anim.delay;
        var frame = Math.floor(this.frame % (anim.tiles.length * delay) / delay);
        st = util.sprite.getSprite(tex, anim.tiles[frame], true);
      } else {
        st = util.sprite.getSprite(tex, ind);
      }

      var bmp = 0;
      var adj = Math.max(0, td.bump-7);
      if(adj > 0) {
        bmp = Math.sin((1.-((adj-2)/8.))*Math.PI)*0.22;
      }
      context.drawImage(tex, st[0], st[1], MenuDisplay.TEXRES, MenuDisplay.TEXRES, MenuDisplay.TEXRES*j, MenuDisplay.TEXRES*(i-bmp), MenuDisplay.TEXRES, MenuDisplay.TEXRES);
    }
  }
};

MenuDisplay.prototype.drawLoad = function() {
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
  
MenuDisplay.prototype.destroy = function() {
  clearTimeout(this.frameReq);
};  