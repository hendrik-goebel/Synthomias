// Tremolo effect module for per-instrument amplitude modulation
// Parameters: rate (Hz), depth (0..1), waveform ('sine' | 'triangle' | 'square' | 'sawtooth'), enabled (bool)

export class TremoloEffect {

  constructor(audioContext, {
    rate = 5.0,
    depth = 0.5,
    waveform = 'sine',
    enabled = true
  } = {}) {
    this.audioContext = audioContext;
    this.rate = rate;
    this.depth = depth;
    this.waveform = waveform;
    this.enabled = enabled;

    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.input.connect(this.output);

    this.lfo = audioContext.createOscillator();
    this.lfo.type = this.waveform;
    this.lfo.frequency.value = this.rate;

    this.lfoGain = audioContext.createGain();
    this.lfoGain.gain.value = this.enabled ? this.depth / 2 : 0; // depth 0..1, modulates -0.5..+0.5

    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.output.gain);
    this.lfo.start();
    this._updateEnabled();
  }


  // Setters for individual parameters
  setRate(rate) {
    this.rate = rate;
    this.lfo.frequency.setValueAtTime(rate, this.audioContext.currentTime);
  }

  setDepth(depth) {
    this.depth = depth;
    this.lfoGain.gain.setValueAtTime(this.enabled ? depth / 2 : 0, this.audioContext.currentTime);
  }

  setWaveform(waveform) {
    // Accept 'sine', 'triangle', 'square', 'sawtooth'
    this.waveform = waveform;
    this.lfo.type = waveform;
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;
    this._updateEnabled();
  }

  // Generic parameter setter
  setParam(param, value) {
    switch (param) {
      case 'rate': this.setRate(value); break;
      case 'depth': this.setDepth(value); break;
      case 'waveform': this.setWaveform(value); break;
      case 'enabled': this.setEnabled(value); break;
    }
  }

  // Generic parameter getter
  getParam(param) {
    switch (param) {
      case 'rate': return this.rate;
      case 'depth': return this.depth;
      case 'waveform': return this.waveform;
      case 'enabled': return this.enabled;
      default: return undefined;
    }
  }

  // Update all parameters from an object
  updateAllParams(params) {
    for (const key of Object.keys(params)) {
      this.setParam(key, params[key]);
    }
  }

  // Internal: enable/disable LFO modulation
  _updateEnabled() {
    if (this.enabled) {
      // Only connect if not already connected
      try { this.lfoGain.connect(this.output.gain); } catch (e) {}
      this.lfoGain.gain.setValueAtTime(this.depth / 2, this.audioContext.currentTime);
    } else {
      try { this.lfoGain.disconnect(); } catch (e) {}
      this.lfoGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    }
  }


  connect(destination) {
    this.output.connect(destination);
  }


  disconnect() {
    this.output.disconnect();
  }


  dispose() {
    try { this.lfo.stop(); } catch (e) {}
    this.lfo.disconnect();
    try { this.lfoGain.disconnect(); } catch (e) {}
    try { this.input.disconnect(); } catch (e) {}
    try { this.output.disconnect(); } catch (e) {}
  }
}

// Apply tremolo effect in the per-voice chain
// params: { ctx, voiceOutput, voiceNodes, time, noteDurationSeconds, voiceParams }
export function applyTremoloEffect({
  ctx,
  voiceOutput,
  voiceNodes,
  time,
  noteDurationSeconds,
  voiceParams,
}) {
  if (!voiceParams.tremoloEnabled) return voiceOutput;

  const tremolo = new TremoloEffect(ctx, {
    rate: Number(voiceParams.tremoloRate) || 5.0,
    depth: Number(voiceParams.tremoloDepth) ?? 0.5,
    waveform: voiceParams.tremoloWaveform || 'sine',
    enabled: Boolean(voiceParams.tremoloEnabled),
  });
  voiceOutput.connect(tremolo.input);
  voiceNodes.push(tremolo);
  return tremolo.output;
}
