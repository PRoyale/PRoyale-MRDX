package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketGSL extends Packet {
  public final String name;
  public final String data;
  public PacketGSL(String name, String data) {
    super("gsl");
    this.name = name;
    this.data = data;
  }
}