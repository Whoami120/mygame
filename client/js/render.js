// ============================================
// RENDER - pixel renderer. Drawing only.
// Reads all colors from world.palette, so a new
// map file automatically changes the whole look.
// ============================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Fullscreen canvas that follows the window size
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false; // must be reset after resize
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const TILE = 32;   // floor tile size

// Background image cache
const bgImages = {};
function getBgImage(file) {
  if (!bgImages[file]) {
    const img = new Image();
    img.src = file;
    bgImages[file] = img;
  }
  return bgImages[file];
}
// (zoom is now automatic: the camera fits the whole room on screen)

// Camera FIT mode: show the WHOLE current room on screen
function getView(world, me) {
  const roomId = me ? me.room : "LobbyRoom";
  const room = world.rooms.find(r => r.id === roomId) || world.rooms[0];

  // The lobby also shows its decorative wall above
  let x = room.x, y = room.y, w = room.width, h = room.height;
  if (room.id === "LobbyRoom") {
    if (world.background) {
      x = 0; y = 0;
      w = world.background.width;
      h = world.background.height;
    } else {
      y -= world.wallHeight;
      h += world.wallHeight;
    }
  }

  const pad = 20; // small margin around the room
  const scale = Math.min(
    (canvas.width - pad * 2) / w,
    (canvas.height - pad * 2) / h
  );

  // Center the room on screen
  return {
    scale: scale,
    offsetX: (canvas.width - w * scale) / 2 - x * scale,
    offsetY: (canvas.height - h * scale) / 2 - y * scale
  };
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

// Back wall band above the lobby, with the detailed gate
function drawWall(world, room) {
  const pal = world.palette;
  const wallY = room.y - world.wallHeight;
  const wallH = world.wallHeight;

  ctx.fillStyle = pal.wallBase;
  ctx.fillRect(room.x, wallY, room.width, wallH);

  // stone lines
  ctx.fillStyle = pal.wallLine;
  for (let i = 1; i <= 3; i++) {
    ctx.fillRect(room.x, wallY + i * (wallH / 4), room.width, 3);
  }

  const gate = world.zones.find(z => z.id === "TrialGate");
  if (!gate) return;

  const gx = gate.x, gw = gate.width;
  const cx = gx + gw / 2; // gate center

  // glitch edges (cyan left, magenta right)
  ctx.fillStyle = pal.cyan;
  ctx.fillRect(gx - 46, wallY, 5, wallH);
  ctx.fillStyle = pal.magenta;
  ctx.fillRect(gx + gw + 41, wallY, 5, wallH);

  // stone frame + void opening
  ctx.fillStyle = pal.stone;
  ctx.fillRect(gx - 40, wallY, gw + 80, wallH);
  ctx.fillStyle = pal.voidEdge;
  ctx.fillRect(gx - 12, wallY + 16, gw + 24, wallH - 16);
  ctx.fillStyle = pal.voidDark;
  ctx.fillRect(gx - 4, wallY + 26, gw + 8, wallH - 26);

  // door split line
  ctx.fillStyle = pal.background;
  ctx.fillRect(cx - 2, wallY + 26, 4, wallH - 26);

  // ---- magenta sigil ----
  const sy = wallY + wallH * 0.45; // sigil center
  const b = 8; // sigil block size
  ctx.fillStyle = "rgba(224, 96, 200, 0.12)";
  ctx.fillRect(cx - 40, sy - 36, 80, 72);
  ctx.fillStyle = pal.magenta;
  // ring blocks
  ctx.fillRect(cx - b/2, sy - 30, b, b);
  ctx.fillRect(cx - 26, sy - 18, b, b);
  ctx.fillRect(cx + 18, sy - 18, b, b);
  ctx.fillRect(cx - 34, sy - b/2, b, b);
  ctx.fillRect(cx + 26, sy - b/2, b, b);
  ctx.fillRect(cx - 26, sy + 10, b, b);
  ctx.fillRect(cx + 18, sy + 10, b, b);
  ctx.fillRect(cx - b/2, sy + 22, b, b);
  // cross
  ctx.fillRect(cx - b/2, sy - 20, b, 40);
  ctx.fillRect(cx - 22, sy - b/2, 44, b);
  // glitch center blocks
  ctx.fillStyle = "rgba(92, 224, 230, 0.7)";
  ctx.fillRect(cx + b/2 + 2, sy - b/2, b, b);
  ctx.fillStyle = pal.cream;
  ctx.fillRect(cx - b/2 - b - 2, sy - b/2, b, b);

  // mist at the gate floor
  ctx.fillStyle = "rgba(92, 224, 230, 0.12)";
  ctx.fillRect(gx - 4, wallY + wallH - 16, gw + 8, 16);

  // glitch sign above the sigil
  glitchText("TRIAL GATE", cx, wallY + 22, 16, pal);
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

// Rope barriers around the queue zone (auto-built from the zone rectangle)
// Locked queue -> ropes turn magenta
function drawQueueRopes(zone, pal, locked) {
  const ropeColor = locked ? pal.magenta : pal.gold;
  const GAP = 70;        // entrance opening size (bottom center)
  const STEP = 95;       // distance between posts

  // collect post positions
  const posts = [];
  // left + right sides
  for (let y = zone.y; y <= zone.y + zone.height; y += STEP) {
    posts.push({ x: zone.x - 10, y: y });
    posts.push({ x: zone.x + zone.width + 10, y: y });
  }
  // bottom side, leaving the entrance gap in the middle
  const midX = zone.x + zone.width / 2;
  for (let x = zone.x; x <= zone.x + zone.width; x += STEP) {
    if (Math.abs(x - midX) > GAP) {
      posts.push({ x: x, y: zone.y + zone.height + 12 });
    }
  }

  // ropes (lines between posts on the same side)
  ctx.strokeStyle = ropeColor;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.85;
  function ropeLine(a, bPt) {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 14);
    ctx.lineTo(bPt.x, bPt.y - 14);
    ctx.stroke();
  }
  const left = posts.filter(p => p.x < zone.x).sort((a,b) => a.y - b.y);
  const right = posts.filter(p => p.x > zone.x + zone.width).sort((a,b) => a.y - b.y);
  const bottom = posts.filter(p => p.y > zone.y + zone.height).sort((a,b) => a.x - b.x);
  for (let i = 0; i < left.length - 1; i++) ropeLine(left[i], left[i+1]);
  for (let i = 0; i < right.length - 1; i++) ropeLine(right[i], right[i+1]);
  for (let i = 0; i < bottom.length - 1; i++) {
    // don't draw a rope across the entrance gap
    if (Math.abs(bottom[i+1].x - bottom[i].x) < STEP + 10) ropeLine(bottom[i], bottom[i+1]);
  }
  ctx.globalAlpha = 1;

  // posts (drawn after ropes so they sit on top)
  for (const p of posts) {
    ctx.fillStyle = pal.textDim;
    ctx.fillRect(p.x - 5, p.y - 22, 10, 22);
    ctx.fillStyle = ropeColor;
    ctx.fillRect(p.x - 7, p.y - 28, 14, 6);
  }
}

// Grave door decoration: stone arch + void + mist + candles
function drawGraveDoor(d, pal) {
  const x = d.x;            // center of the door
  const bottom = d.y;       // bottom of the stone (steps start here)
  const w = 96, h = 140;
  const left = x - w / 2;
  const top = bottom - h;

  // stone body with stepped top
  ctx.fillStyle = pal.stone;
  ctx.fillRect(x - 16, top - 24, 32, 12);
  ctx.fillRect(x - 32, top - 12, 64, 12);
  ctx.fillRect(left, top, w, h);

  // cracks
  ctx.fillStyle = pal.stoneDark;
  ctx.fillRect(left + 8, top + 34, 6, 24);
  ctx.fillRect(left + w - 16, top + 74, 6, 28);

  // eye carving
  ctx.fillStyle = pal.stoneDark;
  ctx.fillRect(x - 18, top + 4, 36, 16);
  ctx.fillStyle = pal.cream;
  ctx.fillRect(x - 12, top + 7, 24, 10);
  ctx.fillStyle = pal.cyan;
  ctx.fillRect(x - 5, top + 9, 10, 6);
  ctx.fillStyle = pal.voidEdge;
  ctx.fillRect(x - 2, top + 10, 4, 4);

  // void opening
  ctx.fillStyle = pal.voidEdge;
  ctx.fillRect(left + 16, top + 28, w - 32, h - 38);
  ctx.fillStyle = pal.voidDark;
  ctx.fillRect(left + 20, top + 34, w - 40, h - 48);

  // cyan mist (stronger near the bottom)
  ctx.fillStyle = "rgba(92, 224, 230, 0.12)";
  ctx.fillRect(left + 20, top + 62, w - 40, 6);
  ctx.fillStyle = "rgba(92, 224, 230, 0.18)";
  ctx.fillRect(left + 20, top + 90, w - 40, 8);
  ctx.fillStyle = "rgba(92, 224, 230, 0.26)";
  ctx.fillRect(left + 20, top + 114, w - 40, 12);

  // stone steps
  ctx.fillStyle = "#5b5490";
  ctx.fillRect(x - 28, bottom, 56, 10);
  ctx.fillStyle = "#524d82";
  ctx.fillRect(x - 36, bottom + 10, 72, 10);

  // candles + flames + glow
  ctx.fillStyle = "rgba(216, 184, 106, 0.14)";
  ctx.fillRect(left - 22, bottom - 46, 26, 26);
  ctx.fillRect(left + w - 4, bottom - 46, 26, 26);
  ctx.fillStyle = pal.cream;
  ctx.fillRect(left - 14, bottom - 28, 10, 18);
  ctx.fillRect(left + w + 4, bottom - 28, 10, 18);
  ctx.fillStyle = pal.gold;
  ctx.fillRect(left - 12, bottom - 37, 6, 9);
  ctx.fillRect(left + w + 6, bottom - 37, 6, 9);
}

// ---- main draw ----

function drawWorld(world, gameState, myId) {
  if (!world) return;
  const pal = world.palette;

  ctx.fillStyle = pal.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const me = gameState && gameState.players ? gameState.players[myId] : null;
  const myTrial = getMyTrial(gameState, me);
  const view = getView(world, me);

  ctx.save();
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);

  for (const room of world.rooms) {
    if (room.id === "LobbyRoom") {
      if (world.background) {
        const img = getBgImage(world.background.file);
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, 0, 0, world.background.width, world.background.height);
        }
      } else {
        drawWall(world, room);
        drawCheckerFloor(room, pal.floorBase, pal.floorAlt);
      }
    } else {
      drawCheckerFloor(room, pal.matchFloor, pal.matchAlt);
    }
  }

  // Queue zone: procedural art only if the map has no background image
  const qz = world.zones.find(z => z.id === "QueueZone");
  if (qz) {
    const locked = gameState && gameState.queue && gameState.queue.isFull;
    if (!world.background) {
      drawCheckerFloor(qz, pal.zoneBase, pal.zoneAlt);
      drawQueueRopes(qz, pal, locked);
    }
    if (locked) {
      ctx.fillStyle = "rgba(224, 96, 200, 0.14)";
      ctx.fillRect(qz.x, qz.y, qz.width, qz.height);
    }
  }

  // Decorations (only for maps without a background image)
  if (world.decorations && !world.background) {
    for (const d of world.decorations) {
      if (d.type === "graveDoor") drawGraveDoor(d, pal);
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