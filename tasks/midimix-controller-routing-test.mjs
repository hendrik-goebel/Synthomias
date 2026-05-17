import assert from "node:assert/strict";

import {
  DEFAULT_GLOBAL_ARPEGGIO_KEY_INDEX,
  DEFAULT_MIDI_CHANNEL_SETTINGS_BY_PRESET_ID,
  DEFAULT_PRESET_ID,
  INITIAL_SYNTH_PARAMS,
  MIDIMIX_PROFILE_ID,
  MIXER_CHANNEL_IDS,
} from "../js/constants.js";
import { ensureAudioContext } from "../js/audio-engine.js";
import { AudioStateController } from "../js/audio-state-controller.js";
import { getInstrumentParams } from "../js/presets.js";
import { decodeStateSeedString } from "../js/state-seed.js";
import { state } from "../js/state.js";
import {
  flushMicrotasks,
  installFakeAudioAndMidiEnvironment,
  resetSharedAppState,
} from "./test-helpers/fake-audio-midi.mjs";

const environment = installFakeAudioAndMidiEnvironment({
  inputName: "MIDI Mix",
  inputManufacturer: "AKAI Professional",
});

try {
  resetSharedAppState(state, {
    DEFAULT_GLOBAL_ARPEGGIO_KEY_INDEX,
    DEFAULT_MIDI_CHANNEL_SETTINGS_BY_PRESET_ID,
    DEFAULT_PRESET_ID,
    INITIAL_SYNTH_PARAMS,
    MIXER_CHANNEL_IDS,
  });

  const controller = new AudioStateController();
  controller.initialize();
  assert.equal(await controller.initializeMidi(), true, "MIDI initialization should succeed in the fake MIDImix environment");
  assert.equal(state.midi.inputPortId, "input-1", "the MIDImix input should be auto-selected");
  assert.equal(state.midi.inputControllerProfileId, MIDIMIX_PROFILE_ID, "the selected input should be recognized as an AKAI MIDImix");

  environment.fakeInput.emit([0xb0, 0, 64], 1000);
  await flushMicrotasks();
  assert.ok(
    Math.abs(getInstrumentParams("warm").channelVolume - (64 / 127)) < 1e-9,
    "MIDImix fader 1 should control channel 1 volume",
  );

  environment.fakeInput.emit([0xb0, 7, 127], 1001);
  await flushMicrotasks();
  assert.equal(getInstrumentParams("deep").channelVolume, 1, "MIDImix fader 8 should control channel 8 volume");

  environment.fakeInput.emit([0xb0, 62, 96], 1002);
  await flushMicrotasks();
  assert.ok(
    Math.abs(state.synthParams.masterVolume - (96 / 127)) < 1e-9,
    "the MIDImix master fader should control master volume",
  );

  controller.selectInstrument("bass");
  assert.equal(controller.setMidiControllerAssignment("midimix-knob-a-1", "filter-cutoff"), true, "MIDImix knob assignments should be configurable");
  assert.equal(controller.setMidiControllerAssignment("midimix-knob-a-2", "tempo-bpm"), true, "multiple MIDImix knobs should be assignable");

  environment.fakeInput.emit([0xb0, 16, 127], 1003);
  await flushMicrotasks();
  assert.equal(getInstrumentParams("bass").filterCutoff, 5000, "an assigned MIDImix knob should drive the selected channel parameter");

  environment.fakeInput.emit([0xb0, 17, 0], 1004);
  await flushMicrotasks();
  assert.equal(state.synthParams.tempoBpm, 60, "an assigned MIDImix knob should also drive global parameters");

  await ensureAudioContext();
  const oscillatorCountBeforeMidimixNote = state.audioContext.createdOscillators.length;
  environment.fakeInput.emit([0x90, 72, 100], 1005);
  await flushMicrotasks();
  assert.equal(
    state.audioContext.createdOscillators.length,
    oscillatorCountBeforeMidimixNote,
    "MIDImix note/button messages should not trigger synth note playback",
  );

  const seed = controller.getStateSeed();
  const decodedSeed = decodeStateSeedString(seed);
  assert.equal(
    decodedSeed.midi.controllerAssignmentsByControlId["midimix-knob-a-1"],
    "filter-cutoff",
    "MIDImix controller assignments should be persisted in the exported seed",
  );

  resetSharedAppState(state, {
    DEFAULT_GLOBAL_ARPEGGIO_KEY_INDEX,
    DEFAULT_MIDI_CHANNEL_SETTINGS_BY_PRESET_ID,
    DEFAULT_PRESET_ID,
    INITIAL_SYNTH_PARAMS,
    MIXER_CHANNEL_IDS,
  });

  const restoredController = new AudioStateController();
  restoredController.initialize();
  assert.equal(restoredController.loadStateSeed(seed), true, "a saved seed should restore successfully");
  assert.equal(
    state.midi.controllerAssignmentsByControlId["midimix-knob-a-1"],
    "filter-cutoff",
    "MIDImix controller assignments should restore from a loaded seed",
  );
  assert.equal(
    state.midi.controllerAssignmentsByControlId["midimix-knob-a-2"],
    "tempo-bpm",
    "multiple MIDImix assignments should restore from a loaded seed",
  );

  console.log("midimix controller routing checks passed");
} finally {
  environment.restore();
}

