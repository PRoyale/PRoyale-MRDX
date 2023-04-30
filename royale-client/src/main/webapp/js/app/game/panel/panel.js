"use strict";
/* global app */

function Panel(game) {  
  this.game = game;

  this.panels = [];

  for(var i=0;i<Panel.REGISTERED_PANELS.length;i++) {
    this.panels.push(new Panel.REGISTERED_PANELS[i]);
  }
};

Panel.prototype.step = function() {
  var keys = this.game.input.keyboard.keys;

  for(var i=0;i<this.panels.length;i++) {
    var panel = this.panels[i];
    
    if(!this["inx" + panel.input] && keys[panel.input]) {
      if(!panel.active && panel.cooldown === -1) { panel.active = true; }
      else { panel.active = false; }
      this["inx" + panel.input] = true;
    };
    this["inx" + panel.input] = keys[panel.input];

    panel.step(this);
  }
};

/* ====== STATIC ====== */
Panel.REGISTERED_PANELS = [];
Panel.REGISTER_PANEL = function(panel) {
    Panel.REGISTERED_PANELS.push(panel);
};