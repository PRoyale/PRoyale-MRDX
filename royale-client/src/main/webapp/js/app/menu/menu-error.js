"use strict";
/* global app */

function MenuError() {
  this.element = document.getElementById("error");
  this.error = document.getElementById("error-message");
};

MenuError.prototype.show = function(disp, msg, ex) {
  app.net.close();
  
  app.menu.hideAll();
  app.menu.mainMember.hidePrivateMenu(false);
  app.menu.mainMember.hidePlayMenu();
  app.menu.mainMember.hideProfileMenu();
  app.menu.mainMember.hidePasswordMenu();
  app.menu.mainMember.hidePrivateMenu();
  app.menu.mainMember.hideLeaderboards();
  app.menu.main.hideRegisterMenu();
  app.menu.main.hideLoginMenu();

  document.getElementById("hiddenChat").style.display = "none";
  document.getElementById("devConsole").style.display = "none";
  document.getElementById("gameChat").style.display = "none";
  document.getElementById("worlds").style.display = "none";
  document.getElementById("settings").style.display = "none";
  document.getElementById("controls").style.display = "none";
  document.getElementById("changelog").style.display = "none";
  document.getElementById("language").style.display = "none";
  
  app.menu.navigation("error", "error");
  app.menu.background("b");
  this.error.innerHTML = disp;
  if(msg) { console.warn("##ERROR## " + msg); }
  if(ex) { console.warn("##TRACE## " + ex); }
  this.element.style.display = "block";
};

MenuError.prototype.hide = function() {
  this.element.style.display = "none";
};