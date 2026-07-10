// ============================================
// GRIM LOBBY - map data file (DATA ONLY)
// Everything about THIS lobby design lives here:
// layout, zones, points, and colors.
// A new lobby later = a new file like this one.
// ============================================

const map = {
  id: "GrimLobby",

  // Colors of this lobby (renderer reads these)
  palette: {
    background: "#211e38",
    floorBase:  "#4a4570",
    floorAlt:   "#504b78",
    wallBase:   "#3a365a",
    wallLine:   "#332f52",
    zoneBase:   "#56517f",
    zoneAlt:    "#5c5788",
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

  // Height of the decorative back wall above the lobby floor
  wallHeight: 180,

  rooms: [
    { id: "LobbyRoom", x: 0, y: 0,    width: 1300, height: 900 },
    { id: "MatchRoom", x: 0, y: 1400, width: 800,  height: 500 }
  ],

  zones: [
    // Big queue zone in front of the gate
    { id: "QueueZone", x: 460, y: 130, width: 380, height: 420 },
    // The gate opening at the top wall
    { id: "TrialGate", x: 590, y: 0,   width: 120, height: 30 }
  ],

  screens: [
    { id: "TrialGateScreen",  x: 950, y: -80 },   // on the wall, right of the gate
    { id: "MatchTimerScreen", x: 400, y: 1440 }
  ],

  points: {
    LobbySpawn: { x: 170, y: 560 },   // grave door position (door art comes later)
    MatchSpawn: { x: 400, y: 1650 }
  }
};

module.exports = map;