package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

public class PacketL01 extends Packet {
  public final String sid, name, room;
  public final int mode;
  public final boolean priv;
  public PacketL01(String sid, String name, String room, boolean priv, int gameMode) {
    super("l01");
    this.sid = sid;
    this.name = name;
    this.room = room;
    this.priv = priv;
    this.mode = gameMode;
  }
}
