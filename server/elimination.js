// ============================================
// ELIMINATION - reusable module
// Job: remove players from a match and return
// them to the lobby. Any trial can use this.
// Knows NOTHING about tiles, rounds, or visuals.
// ============================================
const teleportModule = require("./teleport");
const playersModule = require("./players");
const matchesModule = require("./matches");

// Eliminate a group of players from a match.
// Returns the list of remaining player ids.
function eliminate(matchId, playerIds) {
  const match = matchesModule.getMatch(matchId);
  if (!match || playerIds.length === 0) {
    return match ? match.playerIds.slice() : [];
  }

  // Send eliminated players back to the lobby
  teleportModule.teleportGroup(playerIds, "LobbySpawn", "LobbyRoom");
  for (const pid of playerIds) {
    playersModule.setMatch(pid, null);
  }

  // Remove them from the match player list
  match.playerIds = match.playerIds.filter(id => !playerIds.includes(id));

  console.log("Match #" + matchId + ": eliminated", playerIds.length,
    "player(s).", match.playerIds.length, "remain.");

  return match.playerIds.slice();
}

module.exports = { eliminate };