package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

public class PacketL00 extends Packet {
  public final String name, room;
  public final int mode;
  public final boolean priv;
  public PacketL00(String name, String room, boolean priv, int mode) {
    super("l00");
    this.name = name;
    this.room = room;
    this.priv = priv;
    this.mode = mode;
  }
}
