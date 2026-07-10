// ============================================
// WORLD - loads the active map.
// Change the lobby design = change ONE line here.
// All game logic only uses the functions below,
// so it never cares which map is loaded.
// ============================================

const activeMap = require("./maps/grimLobby"); // <- swap map here later

function getPoint(name) {
  return activeMap.points[name];
}

function getZone(name) {
  return activeMap.zones.find(z => z.id === name);
}

function getRoom(name) {
  return activeMap.rooms.find(r => r.id === name);
}

function getWorldData() {
  return activeMap;
}

module.exports = { getPoint, getZone, getRoom, getWorldData };