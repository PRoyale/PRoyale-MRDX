package org.infpls.royale.server.game.session;
import java.util.List;

public final class RoyaleWorlds {
    private String title;
    private List<Level> levels;

    public RoyaleWorlds(String title, List<Level> levels) {
        this.title = title;
        this.levels = levels;
    }
}