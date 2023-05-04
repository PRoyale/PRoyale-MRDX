# ==========================================
# PLAN OF THE MARIO ROYALE DELUXE REPOSITORY
# ==========================================


## .:
Root of the Mario Royale Deluxe repository.

###     bin:
        Nothing directly related to the contents of the game.

###     royale-client:
        Client-related scripts and files.

###         src/main:
            More relevant scripts and files, including maps.

###             java:
                Technical stuff to configure/initialise the web socket/app.

###             resources:
                Maps and server hosting properties file.
                
###                 game:
                    All maps (of format .game).

###                 noxio.properties:
                    Server hosting properties file.

###             webapp:
                FX (audio, textures, ...), HTML page files and misc.

###                 assets:
                    Tile animations for the maps.

###                 audio:
                    Musics and SFX for the maps.

###                 css:
                    Style sheets for the site and its subpages (e.g: editor).
                    
###                 font:
                    SMAS "component" fonts (inner and outline).

###                 img:
                    Textures for the game.
                    
###                     background:
                        Backgrounds selected by maps.
                        
###                     game:
                        Map and obj. spritesheets selected by maps, as well as
                        character spritesheets, emotes and other in-game UI/FX.
                        
###                     home:
                        Textures used for the main menu and a few other UI.

###                 js:
                    [ To complete ]

### 	    nb(configuration.xml)
            Additional configuration, mostly advanced.

### 	    pom.xml
            Informations to build the project, mostly advanced.

###     royale-server:
        [ To complete ]

###     .gitignore

###     deploy.sh:
        For Tomcat server handling.

###     LICENSE
        Policy and stuff, ain't reading allat 💀

###	    notes.txt
        Just a few notes, like bugs and tasks to do.

###	    patch.md
        Patchnotes for updates.

###	    pom.xml
        Informations to build the project, mostly advanced.

###	    README.md
        Instructions to self-host the game.q