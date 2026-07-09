// ============================================
// RENDER - drawing only. No game logic here.
// Camera + visibility: I only see players in my
// room AND my match instance.
// ============================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function getCamera(gameState, myId) {
  if (gameState && gameState.players && gameState.players[myId]) {
    const me = gameState.players[myId];
    return { x: me.x - canvas.width / 2, y: me.y - canvas.height / 2 };
  }
  return { x: 0, y: 0 };
}

function drawWorld(world, gameState, myId) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!world) return;

  const me = gameState && gameState.players ? gameState.players[myId] : null;
  const cam = getCamera(gameState, myId);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Rooms
  for (const room of world.rooms) {
    ctx.fillStyle = room.color;
    ctx.fillRect(room.x, room.y, room.width, room.height);
  }

  // Zones
  if (world.zones) {
    for (const zone of world.zones) {
      let color = zone.color;
      // QueueZone turns dark red when full (locked)
      if (zone.id === "QueueZone" && gameState && gameState.queue && gameState.queue.isFull) {
        color = "#5a1010";
      }
      ctx.fillStyle = color;
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
    }
  }

  // Screens
  if (world.screens && gameState) {
    for (const screen of world.screens) {

      if (screen.id === "TrialGateScreen" && gameState.queue) {
        const q = gameState.queue;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        if (gameState.queueCountdown !== null && gameState.queueCountdown !== undefined) {
          ctx.fillText(q.count + "/" + q.target + " — Starting in " + gameState.queueCountdown + "s",
            screen.x, screen.y);
        } else {
          ctx.fillText(q.count + "/" + q.target, screen.x, screen.y);
        }
      }

      // Show MY match timer only
      if (screen.id === "MatchTimerScreen" && me && me.matchId !== null &&
          gameState.matchTimers && gameState.matchTimers[me.matchId] !== undefined) {
        ctx.fillStyle = "#ffff00";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";
        ctx.fillText(gameState.matchTimers[me.matchId] + "s", screen.x, screen.y);
      }
    }
  }

  // Players — visibility rule: same room + same match instance
  if (gameState && gameState.players && me) {
    for (const id in gameState.players) {
      const p = gameState.players[id];
      const visible = (p.room === me.room) && (p.matchId === me.matchId);
      if (!visible) continue;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = (id === myId) ? "#00ff00" : "#00aaff";
      ctx.fill();
    }
  }

  ctx.restore();
}