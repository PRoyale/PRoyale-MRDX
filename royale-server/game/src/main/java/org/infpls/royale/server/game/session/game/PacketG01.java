package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;

public class PacketG01 extends Packet {
  final String game, data, gameMode;
  public PacketG01(String game, String data, String gameMode) {
    super("g01");
    this.game = game;
    this.data = data;
    this.gameMode = gameMode;
  }
}
