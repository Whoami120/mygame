// ============================================
// SERVER - entry point. Only connects modules.
// Now with MULTIPLE match instances in parallel.
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

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../client")));

const QUEUE_COUNTDOWN_SECONDS = 10;
const MATCH_SECONDS = 30;

function startMatch(playerIds) {
  const match = matchesModule.createMatch(playerIds);

  teleportModule.teleportGroup(match.playerIds, "MatchSpawn", "MatchRoom");
  for (const pid of match.playerIds) {
    playersModule.setMatch(pid, match.id);
  }

  // Each match has its own named timer
  timerModule.start("MatchTimer_" + match.id, MATCH_SECONDS, () => endMatch(match.id));
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

    // If their match became empty, clean it up
    const emptyMatchId = matchesModule.removePlayerFromMatch(socket.id);
    if (emptyMatchId !== null) {
      timerModule.cancel("MatchTimer_" + emptyMatchId);
      matchesModule.endMatch(emptyMatchId);
      console.log("Match #" + emptyMatchId + " removed (empty).");
    }
  });
});

// GAME TICK
const TICK_MS = 50;
setInterval(() => {
  // RULE: QueueZone is a wall for you if it is full and you are not inside it
  playersModule.update((p) => {
    const q = queueModule.getQueueState();
    if (p.room === "LobbyRoom" && q.isFull && !queueModule.isMember(p.id)) {
      return getZone("QueueZone");
    }
    return null;
  });
  queueModule.update(playersModule.getAllPlayers());
  timerModule.update(TICK_MS);

  const queueState = queueModule.getQueueState();
  const countdownRunning = timerModule.isRunning("QueueCountdown");

  // Queue full + no countdown -> start countdown
  // (other matches running is OK now!)
  if (queueState.isFull && !countdownRunning) {
    timerModule.start("QueueCountdown", QUEUE_COUNTDOWN_SECONDS, () => {
      const q = queueModule.getQueueState();
      if (q.isFull) startMatch(q.queuedIds);
    });
    console.log("Queue countdown started");
  }

  // Countdown running but queue not full -> cancel
  if (countdownRunning && !queueState.isFull) {
    timerModule.cancel("QueueCountdown");
    console.log("Queue countdown cancelled");
  }

  // Collect each match's remaining time: { matchId: seconds }
  const matchTimers = {};
  const allMatches = matchesModule.getAllMatches();
  for (const id in allMatches) {
    matchTimers[id] = timerModule.getSeconds("MatchTimer_" + id);
  }

  io.emit("gameState", {
    players: playersModule.getAllPlayers(),
    queue: queueState,
    queueCountdown: timerModule.getSeconds("QueueCountdown"),
    matchTimers: matchTimers
  });
}, TICK_MS);

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});