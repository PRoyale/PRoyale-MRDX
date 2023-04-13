"use strict";
/* global app */
/* global Panel */

function EmotePanel(game) {
    Panel.call(this, game);
};

EmotePanel.NAME = "emote";

Panel.REGISTER_PANEL(EmotePanel);