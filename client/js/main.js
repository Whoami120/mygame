// ============================================
// CLIENT MAIN - network + input. No drawing here.
// ============================================
const socket = io();
const statusEl = document.getElementById("status");

let world = null;
let gameState = null;
let myId = null;

socket.on("connect", () => {
  myId = socket.id;
  statusEl.textContent = "Connected! Move with WASD or arrow keys.";
});

socket.on("worldData", (data) => { world = data; });
socket.on("gameState", (state) => { gameState = state; });
socket.on("disconnect", () => { statusEl.textContent = "Disconnected."; });

// ---- INPUT ----
const input = { up: false, down: false, left: false, right: false };

function setKey(key, pressed) {
  if (key === "w" || key === "ArrowUp")    input.up = pressed;
  if (key === "s" || key === "ArrowDown")  input.down = pressed;
  if (key === "a" || key === "ArrowLeft")  input.left = pressed;
  if (key === "d" || key === "ArrowRight") input.right = pressed;
  socket.emit("playerInput", input);
}

window.addEventListener("keydown", (e) => setKey(e.key, true));
window.addEventListener("keyup", (e) => setKey(e.key, false));

// ---- DRAW LOOP ----
function loop() {
  drawWorld(world, gameState, myId);
  requestAnimationFrame(loop);
}
loop();