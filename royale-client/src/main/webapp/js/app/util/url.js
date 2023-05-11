"use strict";

let TILE_ANIMATION = [];
let TILE_ANIMATION_FILTERED = [];

let TILE_ANIM_BG = [];
let TILE_ANIM_BG_FILTERED = [];

/* This function gets the assets file for animations. */

(function() {
    $.getJSON(/royale/ + "assets/assets.json", function(data) {
        if(data.tileAnim) {
            for (var anim of data.tileAnim) {
                var obj = {};
                obj.tiles = anim.tiles;
                obj.delay = anim.delay;
                obj.tilesets = anim.tilesets || [];
                TILE_ANIMATION[anim.startTile] = obj;
            }
        }
    });
})();

/* Editor */

const mapsheets = [
    {name: "Super Mario Bros. 1", url: "img/game/smb_map.png"},
    {name: "Super Mario Bros. 2", url: "img/game/smb2_map.png"},
    {name: "Tricorn Kingdom", url: "img/game/tricorn_map.png"},
    {name: "Mario Kart (PVP)", url: "img/game/mariokart_map.png"},
    {name: "Rainbow Road (PVP)", url: "img/game/rainbowroad_map.png"},
    {name: "Maker 2014 (PVP)", url: "img/game/maker_map.png"},
    {name: "Super Paper Mario (PVP)", url: "img/game/spm_map.png"},
    {name: "New Super Mario Bros. (PVP)", url: "img/game/nsmb_map.png"},
    {name: "Blackout (PVP)", url: "img/game/blackout_map.png"},
    {name: "Unfair Hockey (PVP)", url: "img/game/hockey_map.png"},
    {name: "Lobby", url: "https://raw.githubusercontent.com/RayTheMaymay/hostingthings/main/lobby.png"},
    {name: "Custom", url: "custom"}
];

const objsheets = [
    {name: "Super Mario Bros. 1", url: "img/game/smb_obj.png"},
    {name: "Super Mario Maker 2014", url: "img/game/maker_obj.png"},
    {name: "Tricorn Kingdom", url: "img/game/tricorn_obj.png"},
    {name: "New Super Mario Bros. (PVP)", url: "img/game/nsmb_obj.png"},
    {name: "Unfair Hockey (PVP)", url: "img/game/hockey_obj.png"},
    {name: "Custom", url: "custom"},
];

const assetsurl = [
    {name: "Super Mario Bros. 1", url: "assets.json"},
    {name: "Super Mario Bros. 2", url: "assets-smb2.json"},
    {name: "Tricorn Kingdom", url: "assets-tricorn.json"},
    {name: "Maker 2014 (PVP)", url: "assets-maker.json"},
    {name: "Super Paper Mario (PVP)", url: "assets-spm.json"},
    {name: "New Super Mario Bros. (PVP)", url: "assets-nsmb.json"},
    {name: "Blackout (PVP)", url: "assets-blackout.json"},
    {name: "Unfair Hockey (PVP)", url: "assets-hockey.json"},
    {name: "No Animations", url: "assets-noanim.json"},
    {name: "Custom", url: "custom"},
];

const musicPaths = [
    {name: "Normal", url: "music"},
    {name: "Mario Kart", url: "mariokart/music"},
    {name: "Mario Bros.", url: "mariobros/music"},
    {name: "Super Mario Bros. 2", url: "smb2/music"},
    {name: "Super Mario World", url: "smw/music"},
    {name: "Maker 2014", url: "maker/music"},
    {name: "Super Paper Mario", url: "spm/music"},
    {name: "New Super Mario Bros.", url: "nsmb/music"},
    {name: "Unfair Hockey", url: "hockey/music"},
];

const soundPaths = [
    {name: "Normal", url: "sfx"},
    {name: "Mario Kart", url: "mariokart/sfx"},
    {name: "Mario Bros.", url: "mariobros/sfx"},
    {name: "Super Mario Bros. 2", url: "smb2/sfx"},
    {name: "Maker 2014", url: "maker/sfx"},
    {name: "Super Paper Mario", url: "spm/sfx"},
    {name: "New Super Mario Bros.", url: "nsmb/sfx"},
    {name: "Blackout", url: "blackoutring/sfx"},
]

/* Functions */

function uploadFile(binary, event, callback) {
    var files = event.target.files;
    if(files.length == 0) return;
    var reader = new FileReader();
    reader.onload = function(event) {
        callback(event.target.result);
    }
    var file = files[0];
    if(binary)
        reader.readAsBinaryString(file);
    else
        reader.readAsText(file);
};

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
}

function gzipToText(input) {
    try {
        var stringValue = atob(input.trim());
        var charArray = stringValue.split("").map(function(x){return x.charCodeAt(0);});
        return pako.inflate(charArray, { to: "string" });
    } catch (error) {
        throw new Error("Value is not a valid GZIP compressed text.");
    }
}
