// ============================================
// RENDER - drawing only. No game logic here.
// Camera + match visibility + trial tiles.
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

// My trial state, or null
function getMyTrial(gameState, me) {
  if (me && me.matchId !== null && gameState.trials && gameState.trials[me.matchId]) {
    return gameState.trials[me.matchId];
  }
  return null;
}

function drawWorld(world, gameState, myId) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!world) return;

  const me = gameState && gameState.players ? gameState.players[myId] : null;
  const myTrial = getMyTrial(gameState, me);
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
      if (zone.id === "QueueZone" && gameState && gameState.queue && gameState.queue.isFull) {
        color = "#5a1010";
      }
      ctx.fillStyle = color;
      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
    }
  }

  // Trial tiles (only my match's trial)
  if (myTrial && myTrial.tiles) {
    for (const tile of myTrial.tiles) {
      ctx.fillStyle = tile.danger ? "#cc2222" : "#556677";
      ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
      ctx.strokeStyle = "#222222";
      ctx.lineWidth = 3;
      ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
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

      // Trial text on the match screen
      if (screen.id === "MatchTimerScreen" && myTrial) {
        ctx.fillStyle = "#ffff00";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        let text;
        if (myTrial.phase === "choose") {
          text = "Choose a tile — " + myTrial.seconds + "s";
        } else {
          text = "Danger revealed!";
        }
        ctx.fillText("Round " + myTrial.round + "/" + myTrial.totalRounds + "  |  " + text,
          screen.x, screen.y);
      }
    }
  }

  // Players (same room + same match instance)
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

  // Big center message for eliminated players (during reveal)
  if (myTrial && myTrial.phase === "reveal" &&
      myTrial.eliminatedIds && myTrial.eliminatedIds.includes(myId) && me) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(me.x - 220, me.y - 120, 440, 80);
    ctx.fillStyle = "#ff4444";
    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ELIMINATED!", me.x, me.y - 88);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Returning to lobby in " + myTrial.seconds + "...", me.x, me.y - 58);
  }

  ctx.restore();
}