package org.infpls.royale.server.game.session.login;

import org.infpls.royale.server.game.session.Packet;

public class PacketL00 extends Packet {
  public final String name, team;
  public final boolean priv;
  public PacketL00(String name, String team, boolean priv) {
    super("l00");
    this.name = name;
    this.team = team;
    this.priv = priv;
  }
}
