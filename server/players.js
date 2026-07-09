// ============================================
// PLAYERS - player state module
// Movement + room walls + generic blocked zones.
// A "blocked zone" is solid like a wall for that player.
// This module does NOT know WHY a zone is blocked.
// ============================================
const { getPoint, getRoom } = require("./world");

const players = {};
const SPEED = 4;
const PLAYER_RADIUS = 12;

function addPlayer(id) {
  const spawn = getPoint("LobbySpawn");
  players[id] = {
    id: id,
    x: spawn.x,
    y: spawn.y,
    room: "LobbyRoom",
    matchId: null,
    input: { up: false, down: false, left: false, right: false }
  };
  return players[id];
}

function removePlayer(id) {
  delete players[id];
}

function setInput(id, input) {
  if (players[id]) players[id].input = input;
}

function clampToRoom(p) {
  const room = getRoom(p.room);
  if (!room) return;
  const minX = room.x + PLAYER_RADIUS;
  const maxX = room.x + room.width - PLAYER_RADIUS;
  const minY = room.y + PLAYER_RADIUS;
  const maxY = room.y + room.height - PLAYER_RADIUS;
  if (p.x < minX) p.x = minX;
  if (p.x > maxX) p.x = maxX;
  if (p.y < minY) p.y = minY;
  if (p.y > maxY) p.y = maxY;
}

// If the player is inside a blocked zone, push them out
// through the nearest edge (feels like a solid wall).
function pushOutOfZone(p, zone) {
  const left   = zone.x - PLAYER_RADIUS;
  const right  = zone.x + zone.width + PLAYER_RADIUS;
  const top    = zone.y - PLAYER_RADIUS;
  const bottom = zone.y + zone.height + PLAYER_RADIUS;

  const inside = p.x > left && p.x < right && p.y > top && p.y < bottom;
  if (!inside) return;

  const dLeft = p.x - left;
  const dRight = right - p.x;
  const dTop = p.y - top;
  const dBottom = bottom - p.y;
  const min = Math.min(dLeft, dRight, dTop, dBottom);

  if (min === dLeft)        p.x = left;
  else if (min === dRight)  p.x = right;
  else if (min === dTop)    p.y = top;
  else                      p.y = bottom;
}

// getBlockedZone = function given by server.js:
// (player) => zone object OR null
function update(getBlockedZone) {
  for (const id in players) {
    const p = players[id];
    if (p.input.up)    p.y -= SPEED;
    if (p.input.down)  p.y += SPEED;
    if (p.input.left)  p.x -= SPEED;
    if (p.input.right) p.x += SPEED;

    clampToRoom(p);

    if (getBlockedZone) {
      const blocked = getBlockedZone(p);
      if (blocked) pushOutOfZone(p, blocked);
    }
  }
}

function teleportPlayer(id, pointName, roomName) {
  const p = players[id];
  const point = getPoint(pointName);
  if (p && point) {
    p.x = point.x;
    p.y = point.y;
    p.room = roomName;
  }
}

function setMatch(id, matchId) {
  if (players[id]) players[id].matchId = matchId;
}

function getAllPlayers() {
  return players;
}

module.exports = { addPlayer, removePlayer, setInput, update, teleportPlayer, setMatch, getAllPlayers };