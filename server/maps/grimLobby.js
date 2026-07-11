// ============================================
// GRIM LOBBY - map data file (DATA ONLY)
// This lobby uses a background image. All zones
// and points are aligned to image coordinates.
// ============================================

const map = {
  id: "GrimLobby",

  // Background art of this lobby (image pixels = world units)
  background: { file: "assets/grimLobby.png", width: 1466, height: 1058 },

  palette: {
    background: "#211e38",
    floorBase:  "#4a4570",
    floorAlt:   "#4e4974",
    wallBase:   "#3a365a",
    wallLine:   "#332f52",
    zoneBase:   "#56517f",
    zoneAlt:    "#5a5586",
    stone:      "#565180",
    stoneDark:  "#4f4a78",
    voidDark:   "#161328",
    voidEdge:   "#1e1b33",
    matchFloor: "#3d3960",
    matchAlt:   "#433f68",
    cream:      "#efe9db",
    cyan:       "#5ce0e6",
    magenta:    "#e060c8",
    gold:       "#d8b86a",
    textDim:    "#8f88b8"
  },

  wallHeight: 180, // used only by maps without a background image

  rooms: [
    { id: "LobbyRoom", x: 90, y: 340, width: 1290, height: 610 },
    { id: "MatchRoom", x: 0, y: 1400, width: 800, height: 500 }
  ],

  zones: [
    { id: "QueueZone", x: 430, y: 430, width: 620, height: 400 },
    { id: "TrialGate", x: 665, y: 340, width: 150, height: 30 }
  ],

  screens: [
    // The ornate frame at the top-right of the image
    { id: "TrialGateScreen",  x: 1195, y: 185 },
    { id: "MatchTimerScreen", x: 400, y: 1440 }
  ],

  points: {
    LobbySpawn: { x: 215, y: 760 },  // at the grave door steps
    MatchSpawn: { x: 400, y: 1650 }
  },

  decorations: [] // baked into the background image now
};

module.exports = map;