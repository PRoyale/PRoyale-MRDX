const TEXTS = {
    "#GAME_PLAYERS_REMAIN": {
        "en": "Players Remain",
        "es": "Jugadores Restantes",
        "pt-br": "Jogadores Restantes"
    },

    "#GAME_LOBBY_PLAYERS": {
        "en": "Players",
        "es": "Jugadores",
        "pt-br": "Jogadoras"
    },

    "#MENU_ONLINE": {
        "en": "Players Online",
        "es": "Jugadores en linea",
        "pt-br": "Jogadores Online"
    },

    "#PLAY_PRIVATE_TOOLTIP": {
        "en": "Solo game for testing",
        "es": "Juego solitario para testeo"
    },

    "#PLAY_TITLE": {
        "en": "Choose Game",
        "es": "Modo de Juego",
        "pt-br": "Escolha um modo"
    },

    "#SETTINGS_TITLE": {
        "en": "Settings",
        "es": "Configuraciones",
        "pt-br": "Configurações"
    },

    "#SETTINGS_MUSIC": {
        "en": "Music",
        "es": "Musica",
        "pt-br": "Música"
    },

    "#SETTINGS_SOUND": {
        "en": "Sound",
        "es": "Sonida",
        "pt-br": "Som"
    },

    "#SETTINGS_TIMER": {
        "en": "Hide In-Game Timer",
        "es": "Ocultar cronómetro",
        "pt-br": "Ocultar cronômetro"
    },

    "#SETTINGS_BG": {
        "en": "Disable Backgrounds",
        "es": "Desactivar backgrounds",
        "pt-br": "Desativar fundos de fase"
    },
    
    "#STATS_WINS": {
        "en": "Wins",
        "es": "Wins"
    },

    "#STATS_DEATHS": {
        "en": "Deaths",
        "es": "Muertes"
    },
    
    "#STATS_KILLS": {
        "en": "Kills",
        "es": "Kills"
    },

    "#STATS_COINS": {
        "en": "Coins",
        "es": "Monedas"
    },
    
    "#DISCLAIMER_TITLE": {
        "en": "Welcome to Mario Royale Deluxe",
        "es": "Bienvenido a Mario Royale Deluxe"
    },
    
    "#DISCLAIMER_INFO1": {
        "en": "Mario and all related assets are property of Nintendo Co. Ltd",
        "es": "Mario y todo los assets relacionados son propiedad de Nintendo Co. LTD"
    },
    
    "#DISCLAIMER_INFO2": {
        "en": "Mario Royale Deluxe is a remaster of InfernoPlus' original Mario Royale created in 2019",
        "es": "Mario Royale Deluxe es una version remasterizada del juego original de InfernoPlus creado en 2019"
    },

    "#DISCLAIMER_INFO3": {
        "en": "All game assets are properties of their respective owners.",
        "es": "Todos los assets son propiedad de sus respectivos creadores."
    },

    "#DISCLAIMER_CONTINUE": {
        "en": "Continue",
        "es": "Continuar",
        "pt-br": "Continuar"
    },

    "#CONNECTION_INTERRUPTED": {
        "en": "Connection Interrupted",
        "es": "Conexión Interrumpida",
        "pt-br": "Conexão Interrompida"
    },

    "#UNKNOWN_ERROR": {
        "en": "An unknown error occurred while connecting to the game server...",
        "es": "Un error desconocido ocurrió cuando intentaste conectarte al servidor...",
        "pt-br": "Um erro desconhecido ocorreu ao conectar ao servidor..."
    },

    "#LOADING_RESOURCES": {
        "en": "Loading resources...",
        "es": "Cargando recursos...",
        "pt-br": "Carregando recursos..."
    },

    "#USERNAME": {
        "en": "Username",
        "es": "Usuario",
        "pt-br": "Nome de Usuário"
    },

    "#NICKNAME": {
        "en": "Nickname",
        "es": "Apodo"
    },

    "#PASSWORD": {
        "en": "Password",
        "es": "Contraseña",
        "pt-br": "Senha"
    },

    "#CHANGELOG_TITLE": {
        "en": "Changelog",
        "es": "Actualizaciones"
    },

    "#PROFILE_TITLE": {
        "en": "Manage Profile",
        "es": "Editar Perfil"
    },

    "#CHANGE_CHARACTER": {
        "en": "Choose Character",
        "es": "Elije un Personaje"
    },

    "#CONTROLS_TITLE": {
        "en": "Controls",
        "es": "Controles",
        "pt-br": "Controles"
    },

    "#CHANGEPASSWORD_TITLE": {
        "en": "Change Password",
        "es": "Cambiar Contraseña",
        "pt-br": "Mudar Senha"
    },

    "#NEWPASSWORD_TITLE": {
        "en": "New Password",
        "es": "Nueva Contraseña",
        "pt-br": "Nova Senha"
    },

    "#VERIFYPASSWORD_TITLE": {
        "en": "Verify Password",
        "es": "Verificar Nueva Contraseña",
        "pt-br": "Verificar Nova Senha"
    },

    "#VERIFYPASSWORD": {
        "en": "Verify Password",
        "es": "Verificar Contraseña",
        "pt-br": "Verificar Senha"
    },

    "#REGISTER": {
        "en": "Register",
        "es": "Registrar"
    },

    "#REGISTER_PERMANENT": {
        "en": "Permanent",
        "es": "Permanente"
    },

    "#PASSWORD_SHORT": {
        "en": "Password is too short",
        "es": "La contraseña es muy corta.",
        "pt-br": "A senha é muito curta."
    },

    "#PASSWORD_MISMATCH": {
        "en": "Passwords don't match",
        "es": "blarg."
    },

    "#LEADERBOARD_TITLE": {
        "en": "Leaderboards",
        "es": "Clasificaciones"
    },

    "#LEADERBOARD_SELECT": {
        "en": "Select",
        "es": "Selecciona"
    }
}

/* Localizes HTML elements. In-game translation is searching for the translation in the variable instead of a function to localize. */
function localize(lang) {
    if(lang == null) { lang = "en"; }
    app.lang = lang;

    /* Disclaimer */
    document.getElementById("dis-title").innerText = TEXTS["#DISCLAIMER_TITLE"][lang];
    document.getElementById("dis-info1").innerText = TEXTS["#DISCLAIMER_INFO1"][lang];
    document.getElementById("dis-info2").innerText = TEXTS["#DISCLAIMER_INFO2"][lang];
    document.getElementById("dis-info3").innerText = TEXTS["#DISCLAIMER_INFO3"][lang];
    document.getElementById("next").innerText = TEXTS["#DISCLAIMER_CONTINUE"][lang];

    /* Players Online */
    document.getElementById("play-online-royale").innerText = TEXTS["#MENU_ONLINE"][lang];
    document.getElementById("play-online-pvp").innerText = TEXTS["#MENU_ONLINE"][lang];
    document.getElementById("playMember-online-royale").innerText = TEXTS["#MENU_ONLINE"][lang];
    document.getElementById("playMember-online-pvp").innerText = TEXTS["#MENU_ONLINE"][lang];

    /* Choose Game */
    document.getElementById("play-title").innerText = TEXTS["#PLAY_TITLE"][lang];
    document.getElementById("playMember-title").innerText = TEXTS["#PLAY_TITLE"][lang];

    /* Profile Sections */
    document.getElementById("profile-title").innerText = TEXTS["#PROFILE_TITLE"][lang];

    document.getElementById("loginUnTitle").innerText = TEXTS["#USERNAME"][lang];
    document.getElementById("regUnTitle").innerText = TEXTS["#USERNAME"][lang];
    document.getElementById("profile-username-title").innerText = TEXTS["#USERNAME"][lang];

    document.getElementById("loginPwTitle").innerText = TEXTS["#PASSWORD"][lang];
    document.getElementById("regPwTitle").innerText = TEXTS["#PASSWORD"][lang];
    document.getElementById("regVerTitle").innerText = TEXTS["#VERIFYPASSWORD"][lang];

    document.getElementById("profile-nickname-title").innerText = TEXTS["#NICKNAME"][lang];
    document.getElementById("profile-charTitle").innerText = TEXTS["#CHANGE_CHARACTER"][lang];

    /* Change Password */
    document.getElementById("changePwTitle").innerText = TEXTS["#CHANGEPASSWORD_TITLE"][lang];
    document.getElementById("newPwTitle").innerText = TEXTS["#NEWPASSWORD_TITLE"][lang];
    document.getElementById("verifyPwTitle").innerText = TEXTS["#VERIFYPASSWORD_TITLE"][lang];
    
    /* Register */
    document.getElementById("registerTitle").innerText = TEXTS["#REGISTER"][lang];
    document.getElementById("register-permanent").innerText = "(" + TEXTS["#REGISTER_PERMANENT"][lang] + ")";

    /* Controls */
    document.getElementById("controlsTitle").innerText = TEXTS["#CONTROLS_TITLE"][lang];

    /* Changelog */
    document.getElementById("changelogTitle").innerText = TEXTS["#CHANGELOG_TITLE"][lang];

    /* Private Game */
    document.getElementById("play-privtext").innerText = TEXTS["#PLAY_PRIVATE_TOOLTIP"][lang];
    document.getElementById("playMember-privtext").innerText = TEXTS["#PLAY_PRIVATE_TOOLTIP"][lang];

    /* Leaderboards */
    document.getElementById("leaderboard-title").innerText = TEXTS["#LEADERBOARD_TITLE"][lang];
    document.getElementById("leaderboard-select").innerText = TEXTS["#LEADERBOARD_SELECT"][lang] + ":";

    document.getElementById("leaderboard-winsBtn").innerText = TEXTS["#STATS_WINS"][lang];
    document.getElementById("leaderboard-coinsBtn").innerText = TEXTS["#STATS_COINS"][lang];
    document.getElementById("leaderboard-killsBtn").innerText = TEXTS["#STATS_KILLS"][lang];

    /* Settings */
    document.getElementById("settingsTitle").innerText = TEXTS["#SETTINGS_TITLE"][lang];
    document.getElementById("musicTitle").innerText = TEXTS["#SETTINGS_MUSIC"][lang];
    document.getElementById("soundTitle").innerText = TEXTS["#SETTINGS_SOUND"][lang];
    document.getElementById("hideTimer").innerText = (app.settings.hideTimer ? "[*]" : "[ ]") + " " + TEXTS["#SETTINGS_TIMER"][lang];
    document.getElementById("disableBackground").innerText = (app.settings.disableBg ? "[*]" : "[ ]") + " " + TEXTS["#SETTINGS_BG"][lang];
};