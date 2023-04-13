"use strict";
/* global app */
/* global util, vec2 */

/* Abstract parent class */
function Panel(game) {  
  this.game = game;

  for(var i=0;i<Panel.REGISTERED_PANELS.length;i++) {
    this[Panel.REGISTERED_PANELS[i].NAME] = Panel.REGISTERED_PANELS[i];
  }
};

Panel.prototype.step = function() {};

Panel.prototype.destroy = function() {};

Panel.prototype.draw = function(fxs) { /* Abstract */ };

/* ====== STATIC ====== */
Panel.REGISTERED_PANELS = [];
Panel.REGISTER_PANEL = function(panel) {
    Panel.REGISTERED_PANELS.push(panel);
};