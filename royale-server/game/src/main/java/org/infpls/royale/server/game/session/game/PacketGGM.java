package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketGGM extends Packet {
  public final String name, data;
  public final String color, textColor;
  public PacketGGM(String name, String data, String color, String textColor) {
    super("ggm");
    this.name = name;
    this.data = data;
    this.color = color;
    this.textColor = textColor;
  }
}