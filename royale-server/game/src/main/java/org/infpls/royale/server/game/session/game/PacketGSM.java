package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketGSM extends Packet {
  public final String data;
  public PacketGSM(String data) {
    super("gsm");
    this.data = data;
  }
}