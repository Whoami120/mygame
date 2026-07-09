// ============================================
// TRIAL MANAGER - generic trial runner
// Runs "a trial" for each match instance.
// Does NOT know which trial it is. Any module
// with create()/update()/getState()/finished works.
// ============================================

const trials = {}; // matchId -> trial instance

function startTrial(matchId, trialModule) {
  trials[matchId] = trialModule.create(matchId);
}

function cancelTrial(matchId) {
  delete trials[matchId];
}

// Called every tick. When a trial finishes,
// calls onTrialFinished(matchId, trialInstance).
function update(deltaMs, players, onTrialFinished) {
  for (const matchId in trials) {
    const trial = trials[matchId];
    trial.update(deltaMs, players);

    if (trial.finished) {
      delete trials[matchId];
      onTrialFinished(Number(matchId), trial);
    }
  }
}

// States for all running trials: { matchId: state }
function getTrialStates() {
  const states = {};
  for (const matchId in trials) {
    states[matchId] = trials[matchId].getState();
  }
  return states;
}

module.exports = { startTrial, cancelTrial, update, getTrialStates };