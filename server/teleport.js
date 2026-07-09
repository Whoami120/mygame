// ============================================
// TELEPORT - teleport logic module
// Job: move a group of players to a named point.
// Knows NOTHING about queue, timer, or visuals.
// ============================================
const playersModule = require("./players");

// Teleport many players to a named point + set their room tag
function teleportGroup(playerIds, pointName, roomName) {
  for (const id of playerIds) {
    playersModule.teleportPlayer(id, pointName, roomName);
  }
  console.log("Teleported", playerIds.length, "players to", pointName);
}

module.exports = { teleportGroup };