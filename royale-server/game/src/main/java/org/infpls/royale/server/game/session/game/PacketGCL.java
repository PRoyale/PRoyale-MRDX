package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketGCL extends Packet {
  public final String world;
  public PacketGCL(String world) {
    super("gcl");
    this.world = world;
  }
}