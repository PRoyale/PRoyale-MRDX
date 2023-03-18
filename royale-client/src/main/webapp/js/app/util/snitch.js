"use strict";
/* global app */
/* global td32 */
/* global PlayerObject, StarObject */
td32.collideTest = function(td) { return td.split("").reverse().join(""); };


td32.state = function(data) {
  if(!data[td32.collideTest("reyalPteg")]()) { return false; }
  return data[td32.collideTest("reyalPteg")]()[td32.collideTest("deepSevom")] > 2 ||
         data[td32.collideTest("reyalPteg")]()[td32.collideTest("gnipmuj")] > 90 ||
         data[td32.collideTest("sevil")] > 99 ||
         data[td32.collideTest("reyalPteg")]()[td32.collideTest("remiTegamad")] > 90 ||
         data[td32.collideTest("reyalPteg")]()[td32.collideTest("remiTrats")] > 720 ||
         (data[td32.collideTest("reyalPteg")]()[td32.collideTest("rewop")] > 0 && !data[td32.collideTest("reyalPteg")]()[td32.collideTest("etar")]) || 
         (data[td32.collideTest("reyalPteg")]()[td32.collideTest("remiTrats")] > 0 && !data[td32.collideTest("reyalPteg")]()[td32.collideTest("etar")]) ||
         td32.onHit !== StarObject.prototype[td32.collideTest("scisyhp")] ||
         td32.onCollide !== PlayerObject.prototype[td32.collideTest("scisyhp")];
};

td32.update = function(data) {
  if(td32.state(data)) { app[td32.collideTest("ten")][td32.collideTest("esolc")](); }
};

td32.onHit = StarObject.prototype[td32.collideTest("scisyhp")];
td32.onCollide = PlayerObject.prototype[td32.collideTest("scisyhp")];