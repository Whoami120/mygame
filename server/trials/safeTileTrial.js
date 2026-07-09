// ============================================
// SAFE TILE TRIAL - one trial module (test trial)
// choose (10s) -> reveal danger + mark losers (3s)
// -> eliminate losers -> next round. 3 rounds.
// Losers SEE the red tiles + countdown before teleport.
// ============================================
const { getRoom } = require("../world");
const elimination = require("../elimination");
const matchesModule = require("../matches");

const CHOOSE_SECONDS = 10;
const REVEAL_SECONDS = 3;
const TOTAL_ROUNDS = 3;
const TILE_COLS = 4;
const TILE_ROWS = 2;

function createTiles() {
  const room = getRoom("MatchRoom");
  const pad = 25;
  const topSpace = 70;

  const areaX = room.x + pad;
  const areaY = room.y + topSpace;
  const areaW = room.width - pad * 2;
  const areaH = room.height - topSpace - pad;

  const tileW = (areaW - pad * (TILE_COLS - 1)) / TILE_COLS;
  const tileH = (areaH - pad * (TILE_ROWS - 1)) / TILE_ROWS;

  const tiles = [];
  let id = 0;
  for (let r = 0; r < TILE_ROWS; r++) {
    for (let c = 0; c < TILE_COLS; c++) {
      tiles.push({
        id: id++,
        x: areaX + c * (tileW + pad),
        y: areaY + r * (tileH + pad),
        width: tileW,
        height: tileH,
        danger: false
      });
    }
  }
  return tiles;
}

function pickDangerTiles(tiles) {
  const dangerCount = Math.random() < 0.5 ? 2 : 3;
  const ids = tiles.map(t => t.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const dangerIds = ids.slice(0, dangerCount);
  for (const tile of tiles) {
    tile.danger = dangerIds.includes(tile.id);
  }
}

function getTileUnderPlayer(p, tiles) {
  for (const tile of tiles) {
    if (p.x >= tile.x && p.x <= tile.x + tile.width &&
        p.y >= tile.y && p.y <= tile.y + tile.height) {
      return tile;
    }
  }
  return null;
}

function create(matchId) {
  return {
    matchId: matchId,
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    phase: "choose",
    remainingMs: CHOOSE_SECONDS * 1000,
    tiles: createTiles(),
    pendingElimination: [], // losers waiting for teleport (they see the countdown)
    finished: false,

    update(deltaMs, players) {
      if (this.finished) return;
      this.remainingMs -= deltaMs;
      if (this.remainingMs > 0) return;

      if (this.phase === "choose") {
        // Time up -> show danger + decide losers (but do NOT teleport yet)
        pickDangerTiles(this.tiles);

        const match = matchesModule.getMatch(this.matchId);
        if (!match) { this.finished = true; return; }

        this.pendingElimination = [];
        for (const pid of match.playerIds) {
          const p = players[pid];
          if (!p) continue;
          const tile = getTileUnderPlayer(p, this.tiles);
          if (!tile || tile.danger) {
            this.pendingElimination.push(pid);
          }
        }

        this.phase = "reveal"; // losers watch the red tiles + countdown
        this.remainingMs = REVEAL_SECONDS * 1000;

      } else if (this.phase === "reveal") {
        // Reveal over -> NOW eliminate the losers
        const remaining = elimination.eliminate(this.matchId, this.pendingElimination);
        this.pendingElimination = [];

        if (remaining.length === 0) {
          this.finished = true; // nobody left
          return;
        }

        if (this.round < this.totalRounds) {
          this.round++;
          for (const tile of this.tiles) tile.danger = false;
          this.phase = "choose";
          this.remainingMs = CHOOSE_SECONDS * 1000;
        } else {
          this.finished = true; // survivors are winners
        }
      }
    },

    getState() {
      return {
        trialName: "SafeTile",
        round: this.round,
        totalRounds: this.totalRounds,
        phase: this.phase,
        seconds: Math.max(0, Math.ceil(this.remainingMs / 1000)),
        eliminatedIds: this.pendingElimination, // client shows message to these players
        tiles: this.tiles.map(t => ({
          x: t.x, y: t.y, width: t.width, height: t.height,
          danger: this.phase === "reveal" && t.danger
        }))
      };
    }
  };
}

module.exports = { create };