// ============================================
// TIMER - generic countdown module
// Job: count down named timers and call a function
// when they finish. Knows NOTHING about matches,
// queues, teleports, or visuals.
// ============================================

const timers = {}; // name -> { remainingMs, onEnd }

function start(name, seconds, onEnd) {
  timers[name] = {
    remainingMs: seconds * 1000,
    onEnd: onEnd
  };
}

function isRunning(name) {
  return timers[name] !== undefined;
}

// Seconds left (rounded up), or null if not running
function getSeconds(name) {
  const t = timers[name];
  if (!t) return null;
  return Math.ceil(t.remainingMs / 1000);
}

// Called every tick with the tick length in ms
function update(deltaMs) {
  for (const name in timers) {
    timers[name].remainingMs -= deltaMs;
    if (timers[name].remainingMs <= 0) {
      const onEnd = timers[name].onEnd;
      delete timers[name];   // remove first
      if (onEnd) onEnd();    // then call the end function
    }
  }
}

function cancel(name) {
  delete timers[name];
}

module.exports = { start, cancel, isRunning, getSeconds, update };