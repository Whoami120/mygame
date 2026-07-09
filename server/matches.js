// ============================================
// MATCHES - match instances module
// Job: create/end matches and remember who is in which match.
// Knows NOTHING about timers, teleport, or visuals.
// ============================================

const matches = {}; // matchId -> { id, playerIds }
let nextMatchId = 1;

function createMatch(playerIds) {
  const match = {
    id: nextMatchId++,
    playerIds: playerIds.slice()
  };
  matches[match.id] = match;
  return match;
}

function endMatch(matchId) {
  delete matches[matchId];
}

function getMatch(matchId) {
  return matches[matchId];
}

// Remove a player (example: disconnected).
// Returns the match id if the match became empty, else null.
function removePlayerFromMatch(playerId) {
  for (const id in matches) {
    const m = matches[id];
    if (m.playerIds.includes(playerId)) {
      m.playerIds = m.playerIds.filter(pid => pid !== playerId);
      if (m.playerIds.length === 0) {
        return m.id; // match is now empty
      }
      return null;
    }
  }
  return null;
}

function getAllMatches() {
  return matches;
}

module.exports = { createMatch, endMatch, getMatch, removePlayerFromMatch, getAllMatches };