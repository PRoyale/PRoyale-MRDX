package org.infpls.royale.server.game.game;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.*;
import org.infpls.royale.server.game.session.*;
import org.infpls.royale.server.game.session.game.PacketGGM;
import org.infpls.royale.server.game.util.VirginSlayer;
import org.infpls.royale.server.util.Oak;

public class Controller {
  private final RoyaleCore game;           // Parent
  
  public final RoyaleSession session;      // Session. So we can send game data packets to players.
  public final short pid;                  // Player identifier. Used to id players with a small bit of data.
  
  public final Queue<List<ByteMe.NETX>> updates = new LinkedList();

  /* Player State Info */
  protected boolean dead;
  protected byte level, zone;
  protected Vec2 position;
  protected short sprite;
  protected byte character;
  public int kills;
  public int coins;
  
  protected byte result;
  
  public boolean garbage;  // If flagged, we will delete this controler on next update.
  
  /* Anti Cheat Vars*/
  private static final int AC_STAR_MIN_TIME = 600;   // Minimum time from start of game before you could feasibly get a star. /* False bans have happened so i lowered it to 10 seconds */
  private static final int AC_STAR_MAX_COUNT = 3;    // If a player gets more than this number of stars they are cheating.
  private static final int AC_MIN_WIN_TIME = 5400;   // Minimum time for a player to win a game. 90 seconds atm
  private static final int AC_MAX_INVALID_MOVES = 60; // If a client moves invalidly for this many frames we ban them.
  private static final int AC_MAX_MOVE_DISTANCE = 100; // If a client moves farther than this in 1 frame we ban them.
  
  public boolean strikelock; // If flagged, we stop sending player updates out for this player. Used at end of level for cheaters.
  public boolean strike; // If flagged, this user will remain in the game but be essentially shadowstrikened
  private int starCount;
  private int acSequence; // If a player skips a level they are cheating
  private int acInvalidMoves;
  private boolean acLag;
  
  public Controller(RoyaleCore game, RoyaleSession session, short pid) {
    this.game = game;
    this.session = session; this.pid = pid;
    
    dead = true;
    level = 0x00;
    zone = 0x00;
    position = null;
    sprite = 0x00;
    
    result = 0x00;
    coins = 0x00;
    kills = 0x00;
    
    garbage = false;
    
    starCount = 0;
    acSequence = 0;
    acInvalidMoves = 0;
    acLag = false;
    strike = false;
  }
  
  /* Handle data from client about their current playstate */
  public void input(final ByteBuffer data) {
    try {
      final List<ByteMe.NETX> de = ByteMe.decode(data, pid);
      updates.add(de);
    }
    catch(IOException ioex) {
      Oak.log(Oak.Level.ERR, "Error during byte decode.", ioex);
      try { session.close("Stop! You violated the law!"); }
      catch(IOException ex) { Oak.log(Oak.Level.ERR, "Error during session ejection.", ex); }
    }
    catch(Exception ex) {
      Oak.log(Oak.Level.ERR, "Error during byte decode.", ex);
      try { session.close("Stop! You violated the law!"); }
      catch(IOException ex2) { Oak.log(Oak.Level.ERR, "Error during session ejection.", ex2); }
    }
  }
  
  /* Sends information to the client about the current gamestate */
  public void update(List<ByteMe.NETX> loc, List<ByteMe.NETX> glo) {
    try {
      if(updates.size() < 1) { return; }
      if(updates.size() > 120) { Oak.log(Oak.Level.INFO, "Buffer Oversize: " + updates.size()); updates.clear(); acLag = true; }
      /* Process client input, if there is more than 3 updates in the queue we 'catch up' by processing 2 updates per tick instead of 1 */
      int lm = Math.max(1, Math.min(2, updates.size()-1));
      for(int j=0;j<updates.size()&&j<lm;j++) {
        final List<ByteMe.NETX> proc = updates.remove();
        for(int i=0;i<proc.size();i++) {
          final ByteMe.NETX n = proc.get(i);
          switch(n.designation) {
            case 0x10 : { process010((ByteMe.NET010)n); glo.add(n); break; }
            case 0x11 : { process011((ByteMe.NET011)n); glo.add(n); break; }
            case 0x12 : { if(process012((ByteMe.NET012)n)) { break; } if(!strikelock) { loc.add(n); } break; }
            case 0x13 : { process013((ByteMe.NET013)n); if(!strike) { glo.add(n); } break; }
            case 0x14 : { process014((ByteMe.NET014)n); if(!strike) { glo.add(n); } break; }
            case 0x15 : { process015((ByteMe.NET015)n); break; }
            case 0x17 : { process017((ByteMe.NET017)n); break; }
            case 0x18 : {
              final ByteMe.NET018 wr = process018((ByteMe.NET018)n);
              if(wr == null) { break; }
              else if(!strike) {
                RoyaleAccount acc = session.getAccount();
                if(acc != null && session.getPrivate() != true) {
                  acc.updateWins(1);
                }
                glo.add(wr);
              }
              else { send(wr.encode().array()); }
              break;
            }
            case 0x19 : { process019((ByteMe.NET019)n); break; }
            case 0x20 : { process020((ByteMe.NET020)n); if(!strike) { glo.add(n); } break; }
            case 0x21 : { process021((ByteMe.NET021)n); break; }
            case 0x30 : { process030((ByteMe.NET030)n); if(!strike) { glo.add(n); } break; }
          }
        }
      }
    }
    catch(Exception ex) {
      Oak.log(Oak.Level.CRIT, "Packet contains invalid data. Potential cheating. User: " + getName() + " IP: " + session.getIP());
      try { session.close(); } catch(IOException ioex) { Oak.log(Oak.Level.CRIT, "Failed to close connection!", ioex); }
    }
  }
  
  /* CREATE_PLAYER_OBJECT */
  public void process010(ByteMe.NET010 n) {
    dead = false;
    level = n.level;
    zone = n.zone;
    position = Shor2.decode(n.pos);
    character = n.character;
  }
  
  /* KILL_PLAYER_OBJECT */
  public void process011(ByteMe.NET011 n) {
    RoyaleAccount acc = session.getAccount();
    if(acc != null && session.getPrivate() != true) {
      acc.updateDeaths(1);
    }

    dead = true;
  }
  
  /* UPDATE_PLAYER_OBJECT */
  /* Returns true if something cheat related is detected. */
  public boolean process012(ByteMe.NET012 n) {
    //if(position.distance(n.pos) > AC_MAX_MOVE_DISTANCE && level == n.level && zone == n.zone && !acLag) { strike("Teleported Excessive Distance"); }
    
    level = n.level;
    zone = n.zone;
    position = n.pos;
    sprite = n.sprite;
    character = n.character;
    
    /* Anti Cheat */
    /*if(level - acSequence > 1) { strike("Level Sequence Skip"); }
    if(level > 65535 || level < 0) { strike("Invalid Level"); return true; }
    if(zone > 65535 || zone < 0) { strike("Invalid Zone"); return true; }
    */
    
    acSequence = n.level;
    return false;
  }
  
  /* PLAYER_OBJECT_EVENT */
  public void process013(ByteMe.NET013 n) {
    /* Anti Cheat */
    if(n.type == 0x02) {
      if(game instanceof RoyaleLobby) { strike("Star In Lobby"); }
    }
  }

  /* PLAYER_TAUNT_EVENT */
  public void process014(ByteMe.NET014 n) {

  }
  
  /* PLAYER_INVALID_MOVE */
  public void process015(ByteMe.NET015 n) {
    /* Anti Cheat */
    if(++acInvalidMoves >= AC_MAX_INVALID_MOVES) { strike("Excessive Invalid Moves"); }
  }
  
  /* PLAYER_KILL_EVENT */
  public void process017(ByteMe.NET017 n) {
    final Controller kler = game.getController(n.killer);
    if(kler != null) {
      kler.send(n.encode().array());
      session.killMessage(kler.session.getUser());
      RoyaleAccount klerAcc = kler.session.getAccount();
      if(klerAcc != null && kler.session.getPrivate() != true) {
        klerAcc.updateKills(1);
      }
    }
  }
  
  /* PLAYER_RESULT_REQUEST */
  public ByteMe.NET018 process018(ByteMe.NET018 n) {
    /* Anti Cheat */
    //if(game.frame < AC_MIN_WIN_TIME) { strike("Completion too Early"); }
    if(result != 0) { return null; }
    result = game.winRequest(!strike);
    if(strike) { strikelock = true; }
    
    return new ByteMe.NET018(n.pid, result, strike);
  }
  
  /* PLAYER_SNITCH */
  public void process019(ByteMe.NET019 n) {
    /* Anti Cheat */
    strike("Snitched");
  }
  
  /* OBJECT_EVENT_TRIGGER */
  public void process020(ByteMe.NET020 n) {
    
  }

  /* PLAYER_COLLECT_COIN */
  public void process021(ByteMe.NET021 n) {
    coins += 1;
    RoyaleAccount acc = session.getAccount();
    if(acc != null && session.getPrivate() != true) {
      acc.updateCoins(1);
    }
  }
  
  /* TILE_EVENT_TRIGGER */
  public void process030(ByteMe.NET030 n) {
    
  }
  
  /* Essentially a shadow ban. The player is able to keep playing but their actions no longer affect the game. They are also barred from winning. */
  /* The user is also given a strike in virginslayer. if you get to many virginslayer strikes... you get slain. */
  public void strike(String rsn) {
    if(strike) { return; }
    strike = true;
    Oak.log(Oak.Level.WARN, "Player strikened for '" + rsn + "' : '" + getName() +"', F: " + game.frame + ", IP: " + session.getIP());
    VirginSlayer.strike(session.getIP());
  }
  
  public void send(Packet p) {
    session.sendPacket(p);
  }
  
  public void send(byte[] bb) {
    session.sendBinary(bb);
  }
  
  public boolean isDead() { return dead; }
  public int getKills() { return kills; }
  
  public String getName() {
    RoyaleAccount acc = session.getAccount();

    /* Guest */
    if(acc == null) { return "[G]" + session.getUser(); }

    /* Developer */
    if(isDev()) {
      return "[DEV]" + session.getUser();
    }

    if(isAdmin()) {
      return "[ADMIN]" + session.getUser();
    }

    if(isMod()) {
      return "[MOD]" + session.getUser();
    }

    return session.getUser();
  }
  public String getRoom() { return session.getRoom(); }
  public boolean getPriv() { return session.getPrivate(); }
  public boolean isDev() {
    RoyaleAccount acc = session.getAccount();
    if(acc == null) { return false; }

    String[] DEVELOPERS = new String[] {
      "TERMINALARCH",
      "CASINILOOGI",
      "RAYTHEMAYMAY",
      "WACOPYRIGHTINFRINGIO",
      "DIMENSION",
      "INVADER",
      "NIGHTCAT"
    };
    for(int i=0;i<DEVELOPERS.length;i++) {
      if(DEVELOPERS[i].equals(acc.getUsername())) { return true; }
    }

    return false;
  }

  public boolean isMod() {
    RoyaleAccount acc = session.getAccount();
    if(acc == null) { return false; }

    String[] MODERATORS = new String[] {
      "PYRIEL",
      "FUNGICAPTAIN3",
      "SYEMBOL",
      "SIR SINS",
      "DAORANGEBOI"
    };
    for(int i=0;i<MODERATORS.length;i++) {
      if(MODERATORS[i].equals(acc.getUsername())) { return true; }
    }

    return false;
  }

  public boolean isAdmin() {
    RoyaleAccount acc = session.getAccount();
    if(acc == null) { return false; }

    String[] ADMINS = new String[] {
      "LINKYTAY"
    };
    for(int i=0;i<ADMINS.length;i++) {
      if(ADMINS[i].equals(acc.getUsername())) { return true; }
    }

    return false;
  }
  
  /* Called when the player using this controller disconnects */
  public void destroy() {
    garbage = true;
  }
}
