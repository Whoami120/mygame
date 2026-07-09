// ============================================
// SERVER - entry point. Only connects modules.
// Match flow is now driven by TRIALS, not a fixed timer.
// ============================================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const { getWorldData, getZone } = require("./world");
const playersModule = require("./players");
const queueModule = require("./queue");
const teleportModule = require("./teleport");
const timerModule = require("./timer");
const matchesModule = require("./matches");
const trialManager = require("./trials/trialManager");
const safeTileTrial = require("./trials/safeTileTrial");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../client")));

const QUEUE_COUNTDOWN_SECONDS = 10;

function startMatch(playerIds) {
  const match = matchesModule.createMatch(playerIds);
  teleportModule.teleportGroup(match.playerIds, "MatchSpawn", "MatchRoom");
  for (const pid of match.playerIds) {
    playersModule.setMatch(pid, match.id);
  }
  // The trial controls the match now
  trialManager.startTrial(match.id, safeTileTrial);
  console.log("Match #" + match.id + " started with", match.playerIds.length, "players");
}

function endMatch(matchId) {
  const match = matchesModule.getMatch(matchId);
  if (!match) return;
  teleportModule.teleportGroup(match.playerIds, "LobbySpawn", "LobbyRoom");
  for (const pid of match.playerIds) {
    playersModule.setMatch(pid, null);
  }
  matchesModule.endMatch(matchId);
  console.log("Match #" + matchId + " ended.");
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);
  playersModule.addPlayer(socket.id);
  socket.emit("worldData", getWorldData());

  socket.on("playerInput", (input) => {
    playersModule.setInput(socket.id, input);
  });

  socket.on("disconnect", () => {
    console.log("Player left:", socket.id);
    playersModule.removePlayer(socket.id);

    const emptyMatchId = matchesModule.removePlayerFromMatch(socket.id);
    if (emptyMatchId !== null) {
      trialManager.cancelTrial(emptyMatchId);
      matchesModule.endMatch(emptyMatchId);
      console.log("Match #" + emptyMatchId + " removed (empty).");
    }
  });
});

// GAME TICK
const TICK_MS = 50;
setInterval(() => {
  // Movement (QueueZone is a wall when full, for non-members)
  playersModule.update((p) => {
    const q = queueModule.getQueueState();
    if (p.room === "LobbyRoom" && q.isFull && !queueModule.isMember(p.id)) {
      return getZone("QueueZone");
    }
    return null;
  });

  queueModule.update(playersModule.getAllPlayers());
  timerModule.update(TICK_MS);

  // Trials tick. Trial finished -> survivors are winners -> match ends.
  trialManager.update(TICK_MS, playersModule.getAllPlayers(), (matchId, trial) => {
    console.log("Match #" + matchId + " trial finished. Returning winners.");
    endMatch(matchId);
  });

  // Queue countdown rules
  const queueState = queueModule.getQueueState();
  const countdownRunning = timerModule.isRunning("QueueCountdown");

  if (queueState.isFull && !countdownRunning) {
    timerModule.start("QueueCountdown", QUEUE_COUNTDOWN_SECONDS, () => {
      const q = queueModule.getQueueState();
      if (q.isFull) {
        const group = q.queuedIds.slice(0, q.target);
        startMatch(group);
      }
    });
    console.log("Queue countdown started");
  }

  if (countdownRunning && !queueState.isFull) {
    timerModule.cancel("QueueCountdown");
    console.log("Queue countdown cancelled");
  }

  io.emit("gameState", {
    players: playersModule.getAllPlayers(),
    queue: queueState,
    queueCountdown: timerModule.getSeconds("QueueCountdown"),
    trials: trialManager.getTrialStates() // { matchId: trialState }
  });
}, TICK_MS);

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});