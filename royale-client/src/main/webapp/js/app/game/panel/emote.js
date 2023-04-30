"use strict";
/* global app */
/* global vec2, util */
/* global Panel */
/* global Display */
/* global EmoteEffect */

/* Panel to select which emote we'd like to choose */
function EmotePanel() {
    this.active = false;
    this.cooldown = -1;

    this.pos = vec2.make(810,0); /* Panel position  (X DOESN'T MATTER BECAUSE THE PANEL IS CENTERED) */
    this.dim = vec2.make(600,200); /* Panel size */
    this.color = "gold"; /* Text color */
};

/* The emotes sprite indexes that are shown/available to the player */
EmotePanel.EMOTES = [0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x13, 0x10]

EmotePanel.prototype.step = function(panel) {
    if(this.cooldown > -1) { this.cooldown--; }
    if(this.active) {
        this.input(panel.game);
    };
};

/* Handle input for choosing emote. NOT for showing the panel. */
EmotePanel.prototype.input = function(game) {
    var hide = false;
    var keys = game.input.keyboard.keys;

    /*
        Keycodes from 0x31 (49) and onward are 1-9
        0x32 is 2, 0x33 is 3... 0x39 is 9
    */

    for(var i=0x31;i<0x38;i++) {
        if(keys[i]) {
            game.emote(i-0x31);
            hide = true;
        }
    }

    if(hide) { this.cooldown = EmoteEffect.LIFE_TIME; this.active = false; }
};

/* Draw the panel on the canvas */
EmotePanel.prototype.draw = function(display, resource) {
    var context = display.context; /* Sanity */
    var canvas = display.canvas;

    var emotes = resource.getTexture("emotes");
    var panel = resource.getTexture("emote-panel");
    var numbers = resource.getTexture("emote-numbers");

    context.fillStyle = this.color;
    context.drawImage(panel, (canvas.width-this.dim.x)/2, this.pos.y, this.dim.x, this.dim.y);

    context.font = "24px SmbWeb";
    context.textAlign = "center";
    context.fillText(TEXTS["#PANEL_EMOTE_TITLE"][app.lang].toUpperCase(), (canvas.width/2), this.pos.y+35);
    context.font = "12px SmbWeb";
    context.fillText(TEXTS["#PANEL_CANCEL_TITLE"][app.lang].replace("kek", K_MAP[app.game.input.assignK.emote]).toUpperCase(), (canvas.width/2), this.pos.y+60);
    
    for(var i=0;i<EmotePanel.EMOTES.length;i++) {
        var emote = util.sprite.getSprite(emotes, EmotePanel.EMOTES[i]);
        context.drawImage(emotes, emote[0], emote[1], Display.TEXRES, Display.TEXRES, ((canvas.width/2)-270)+(i*82), this.pos.y+this.dim.y-120, 48, 48);

        var number = util.sprite.getSprite(numbers, i+1);
        context.drawImage(numbers, number[0], number[1], Display.TEXRES, Display.TEXRES, ((canvas.width/2)-270)+(i*82), this.pos.y+this.dim.y-60, 48, 48);
    }
};

Panel.REGISTER_PANEL(EmotePanel);