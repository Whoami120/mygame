// ============================================
// QUEUE - queue logic module
// Now with LIMITED PLACES (member list).
// Enter zone + free place = you get the place.
// Full = no new members.
// ============================================
const { getZone } = require("./world");

const QUEUE_TARGET = 1; // TEST MODE. Change to 20 later.

let members = []; // player ids that hold a place (max = QUEUE_TARGET)

function isInside(p, zone) {
  return (
    p.x >= zone.x &&
    p.x <= zone.x + zone.width &&
    p.y >= zone.y &&
    p.y <= zone.y + zone.height
  );
}

function update(players) {
  const zone = getZone("QueueZone");

  // 1. Members who left the zone (or the lobby) lose their place
  members = members.filter(id => {
    const p = players[id];
    return p && p.room === "LobbyRoom" && isInside(p, zone);
  });

  // 2. Players inside the zone take free places (if any)
  for (const id in players) {
    if (members.length >= QUEUE_TARGET) break; // full -> stop
    const p = players[id];
    if (p.room === "LobbyRoom" && isInside(p, zone) && !members.includes(id)) {
      members.push(id);
    }
  }
}

function isMember(id) {
  return members.includes(id);
}

function getQueueState() {
  return {
    count: members.length,
    target: QUEUE_TARGET,
    queuedIds: members.slice(),
    isFull: members.length >= QUEUE_TARGET
  };
}

module.exports = { update, isMember, getQueueState };