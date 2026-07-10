// ============================================
// RENDER - pixel renderer. Drawing only.
// Reads all colors from world.palette, so a new
// map file automatically changes the whole look.
// ============================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false; // crisp pixels

const TILE = 64; // floor tile size

function getCamera(gameState, myId) {
  if (gameState && gameState.players && gameState.players[myId]) {
    const me = gameState.players[myId];
    // Round camera position -> pixels stay sharp
    return {
      x: Math.round(me.x - canvas.width / 2),
      y: Math.round(me.y - canvas.height / 2)
    };
  }
  return { x: 0, y: 0 };
}

function getMyTrial(gameState, me) {
  if (me && me.matchId !== null && gameState.trials && gameState.trials[me.matchId]) {
    return gameState.trials[me.matchId];
  }
  return null;
}

// ---- helpers ----

// Checker floor tiles inside a rectangle
function drawCheckerFloor(rect, baseColor, altColor) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.width, rect.height);
  ctx.clip();
  const cols = Math.ceil(rect.width / TILE);
  const rows = Math.ceil(rect.height / TILE);
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      ctx.fillStyle = ((tx + ty) % 2 === 0) ? altColor : baseColor;
      ctx.fillRect(rect.x + tx * TILE, rect.y + ty * TILE, TILE, TILE);
    }
  }
  ctx.restore();
}

// Glitch text: magenta + cyan ghosts behind cream text
function glitchText(text, x, y, size, pal) {
  ctx.font = "bold " + size + "px monospace";
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = pal.magenta;
  ctx.fillText(text, x - 2, y);
  ctx.fillStyle = pal.cyan;
  ctx.fillText(text, x + 2, y);
  ctx.globalAlpha = 1;
  ctx.fillStyle = pal.cream;
  ctx.fillText(text, x, y);
}

// Back wall band above the lobby, with the gate opening
function drawWall(world, room) {
  const pal = world.palette;
  const wallY = room.y - world.wallHeight;

  ctx.fillStyle = pal.wallBase;
  ctx.fillRect(room.x, wallY, room.width, world.wallHeight);

  // stone lines
  ctx.fillStyle = pal.wallLine;
  for (let i = 1; i <= 3; i++) {
    ctx.fillRect(room.x, wallY + i * (world.wallHeight / 4), room.width, 3);
  }

  // Gate placeholder (stone frame + dark opening)
  const gate = world.zones.find(z => z.id === "TrialGate");
  if (gate) {
    ctx.fillStyle = pal.stone;
    ctx.fillRect(gate.x - 40, wallY, gate.width + 80, world.wallHeight);
    ctx.fillStyle = pal.voidEdge;
    ctx.fillRect(gate.x - 10, wallY + 20, gate.width + 20, world.wallHeight - 20);
    ctx.fillStyle = pal.voidDark;
    ctx.fillRect(gate.x, wallY + 32, gate.width, world.wallHeight - 32);
  }
}

// Placeholder pixel character (real skins come later)
function drawPlayer(p, isMe, pal) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  // body
  ctx.fillStyle = isMe ? "#a84f6e" : "#3a365a";
  ctx.fillRect(x - 10, y - 8, 20, 22);
  // head
  ctx.fillStyle = pal.cream;
  ctx.fillRect(x - 8, y - 24, 16, 15);
  // eyes
  ctx.fillStyle = pal.voidEdge;
  ctx.fillRect(x - 5, y - 19, 3, 3);
  ctx.fillRect(x + 2, y - 19, 3, 3);
}

// ---- main draw ----
function drawWorld(world, gameState, myId) {
  if (!world) return;
  const pal = world.palette;

  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const me = gameState && gameState.players ? gameState.players[myId] : null;
  const myTrial = getMyTrial(gameState, me);
  const cam = getCamera(gameState, myId);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  for (const room of world.rooms) {
    if (room.id === "LobbyRoom") {
      drawWall(world, room);
      drawCheckerFloor(room, pal.floorBase, pal.floorAlt);
    } else {
      drawCheckerFloor(room, pal.matchFloor, pal.matchAlt);
    }
  }

  // Queue zone (lighter checker area)
  const qz = world.zones.find(z => z.id === "QueueZone");
  if (qz) {
    drawCheckerFloor(qz, pal.zoneBase, pal.zoneAlt);
    // Locked = magenta tint
    if (gameState && gameState.queue && gameState.queue.isFull) {
      ctx.fillStyle = "rgba(224, 96, 200, 0.18)";
      ctx.fillRect(qz.x, qz.y, qz.width, qz.height);
    }
  }

  // Trial tiles
  if (myTrial && myTrial.tiles) {
    for (const tile of myTrial.tiles) {
      ctx.fillStyle = tile.danger ? pal.magenta : pal.stone;
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
      ctx.strokeStyle = pal.voidEdge;
      ctx.lineWidth = 4;
      ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
    }
  }

  // Screens
  if (world.screens && gameState) {
    for (const screen of world.screens) {

      if (screen.id === "TrialGateScreen" && gameState.queue) {
        const q = gameState.queue;
        // panel
        ctx.fillStyle = pal.voidEdge;
        ctx.fillRect(screen.x - 80, screen.y - 34, 160, 58);
        ctx.fillStyle = pal.cyan;
        ctx.fillRect(screen.x - 80, screen.y - 34, 160, 3);
        ctx.fillStyle = pal.magenta;
        ctx.fillRect(screen.x - 80, screen.y + 21, 160, 3);
        // text
        if (gameState.queueCountdown !== null && gameState.queueCountdown !== undefined) {
          glitchText(q.count + "/" + q.target, screen.x, screen.y - 6, 22, pal);
          ctx.font = "bold 12px monospace";
          ctx.fillStyle = pal.textDim;
          ctx.fillText("STARTING IN " + gameState.queueCountdown, screen.x, screen.y + 14);
        } else {
          glitchText(q.count + "/" + q.target, screen.x, screen.y, 24, pal);
          ctx.font = "bold 10px monospace";
          ctx.fillStyle = pal.textDim;
          ctx.fillText("PLAYERS IN QUEUE", screen.x, screen.y + 16);
        }
      }

      if (screen.id === "MatchTimerScreen" && myTrial) {
        let text;
        if (myTrial.phase === "choose") {
          text = "CHOOSE A TILE - " + myTrial.seconds;
        } else {
          text = "DANGER REVEALED";
        }
        glitchText("ROUND " + myTrial.round + "/" + myTrial.totalRounds + "  " + text,
          screen.x, screen.y, 20, pal);
      }
    }
  }

  // Players (same room + same match)
  if (gameState && gameState.players && me) {
    for (const id in gameState.players) {
      const p = gameState.players[id];
      const visible = (p.room === me.room) && (p.matchId === me.matchId);
      if (!visible) continue;
      drawPlayer(p, id === myId, pal);
    }
  }

  // Eliminated message
  if (myTrial && myTrial.phase === "reveal" &&
      myTrial.eliminatedIds && myTrial.eliminatedIds.includes(myId) && me) {
    ctx.fillStyle = "rgba(22, 19, 40, 0.75)";
    ctx.fillRect(me.x - 220, me.y - 130, 440, 84);
    glitchText("ELIMINATED", me.x, me.y - 96, 28, pal);
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = pal.cream;
    ctx.fillText("Returning in " + myTrial.seconds + "...", me.x, me.y - 66);
  }

  ctx.restore();
}