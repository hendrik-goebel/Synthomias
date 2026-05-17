// Gate effect DSP — rhythmic amplitude gate with envelope shaping per cycle.
// Each gate cycle has: attack (open), hold (sustain open), decay (close), rest (stay closed).
//
// params: { gateEnabled, gateRate, gateThreshold, gateAttack, gateHold, gateDecay }

import {
  GATE_ATTACK_MAX_S,
  GATE_ATTACK_MIN_S,
  GATE_DECAY_MAX_S,
  GATE_DECAY_MIN_S,
  GATE_HOLD_MAX_S,
  GATE_HOLD_MIN_S,
  GATE_RATE_MAX_HZ,
  GATE_RATE_MIN_HZ,
  GATE_THRESHOLD_MAX,
  GATE_THRESHOLD_MIN,
} from "../value-limits.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Schedule gate envelope automations on gainNode.gain starting at startTime
// for a total of durationSeconds.
function scheduleGateEnvelope(gainNode, startTime, durationSeconds, {
  rate, threshold, attack, hold, decay,
}) {
  const period = 1 / rate;
  const endTime = startTime + durationSeconds;

  gainNode.gain.setValueAtTime(threshold, startTime);

  let t = startTime;
  while (t < endTime + period) {
    const cycleEnd = t + period;

    // Attack: ramp threshold → 1.0
    const attackEnd = Math.min(t + attack, cycleEnd);
    gainNode.gain.linearRampToValueAtTime(1.0, attackEnd);

    // Hold: stay at 1.0
    const holdEnd = Math.min(attackEnd + hold, cycleEnd);
    if (holdEnd > attackEnd) {
      gainNode.gain.setValueAtTime(1.0, holdEnd);
    }

    // Decay: ramp 1.0 → threshold
    const decayEnd = Math.min(holdEnd + decay, cycleEnd);
    if (decayEnd > holdEnd) {
      gainNode.gain.linearRampToValueAtTime(threshold, decayEnd);
    }

    // Rest of period: hold at threshold
    gainNode.gain.setValueAtTime(threshold, cycleEnd);

    t += period;
    if (t > endTime + period * 2) break;
  }

  // Close gate at note end
  gainNode.gain.setValueAtTime(0, endTime);
}

// params: { ctx, voiceOutput, voiceNodes, time, noteDurationSeconds, voiceParams }
export function applyGateEffect({
  ctx, voiceOutput, voiceNodes, time, noteDurationSeconds, voiceParams,
}) {
  if (!voiceParams.gateEnabled) return voiceOutput;

  const rate      = clamp(Number(voiceParams.gateRate)      || 4,     GATE_RATE_MIN_HZ,      GATE_RATE_MAX_HZ);
  const threshold = clamp(Number(voiceParams.gateThreshold) || 0,     GATE_THRESHOLD_MIN,    GATE_THRESHOLD_MAX);
  const attack    = clamp(Number(voiceParams.gateAttack)    || 0.005, GATE_ATTACK_MIN_S,     GATE_ATTACK_MAX_S);
  const hold      = clamp(Number(voiceParams.gateHold)      || 0.08,  GATE_HOLD_MIN_S,       GATE_HOLD_MAX_S);
  const decay     = clamp(Number(voiceParams.gateDecay)     || 0.04,  GATE_DECAY_MIN_S,      GATE_DECAY_MAX_S);

  const gateGain = ctx.createGain();
  voiceOutput.connect(gateGain);
  voiceNodes.push(gateGain);

  scheduleGateEnvelope(gateGain, time, noteDurationSeconds, { rate, threshold, attack, hold, decay });

  return gateGain;
}
