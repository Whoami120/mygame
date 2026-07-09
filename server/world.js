// ============================================
// WORLD - named objects and zones (DATA ONLY)
// Logic only uses NAMES (tags), never visuals.
// ============================================

const world = {
  rooms: [
    {
      id: "LobbyRoom",
      x: 50, y: 50, width: 700, height: 500,
      color: "#777777"
    },
    {
      id: "MatchRoom",
      x: 100, y: 620, width: 600, height: 300,
      color: "#3a3a3a"
    }
  ],

  zones: [
    {
      id: "QueueZone",
      x: 550, y: 200, width: 150, height: 200,
      color: "#cc3333"
    },
    {
      id: "TrialGate",
      x: 700, y: 250, width: 20, height: 100,
      color: "#000000"
    }
  ],

  screens: [
    {
      id: "TrialGateScreen",
      x: 625, y: 180
    },
    {
      id: "MatchTimerScreen",
      x: 400, y: 660 // top-center of the match room
    }
  ],

  points: {
    LobbySpawn: { x: 400, y: 300 },
    MatchSpawn: { x: 400, y: 770 }
  }
};

function getPoint(name) {
  return world.points[name];
}

function getZone(name) {
  return world.zones.find(z => z.id === name);
}

function getRoom(name) {
  return world.rooms.find(r => r.id === name);
}

function getWorldData() {
  return world;
}

module.exports = { getPoint, getZone, getRoom, getWorldData };