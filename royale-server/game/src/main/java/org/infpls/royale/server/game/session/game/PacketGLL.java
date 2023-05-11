package org.infpls.royale.server.game.session.game;

import org.infpls.royale.server.game.session.Packet;
import org.infpls.royale.server.game.session.Level;
import java.util.List;

public class PacketGLL extends Packet {
  public final List<Level> levels;
  public PacketGLL(List<Level> levels) {
    super("gll");
    this.levels = levels;
  }
}