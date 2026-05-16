import { AudioStateController } from "./audio-state-controller.js";
import "./note-probabilities.js";
import {
  bindControllerEvents,
  bindControls,
  bindDeadNoteToggle,
  bindArpeggioPauseNoteToggle,
  bindRhythmButtons,
  bindDelayToggleButtons,
  bindGlobalKeyActions,
  bindStateSeedControls,
  bindGlobalTransportControls,
  bindMidiControls,
  bindNoteSelector,
  bindMixerChannels,
  bindKeyboardShortcuts,
  bindPitchShiftModeToggle,
  bindPostFilterTypeToggle,
  bindSettingsDialog,
  bindGlobalEffectMixSliders,
} from "./ui.js";
import { getStateSeedFromLocation } from "./state-seed.js";
import * as audioEngine from "./audio-engine.js";
import { state } from "./state.js";

const audioStateController = new AudioStateController();

bindControllerEvents(audioStateController);
bindControls();
bindDelayToggleButtons(audioStateController);
bindPitchShiftModeToggle(audioStateController);
bindGlobalKeyActions(audioStateController);
bindStateSeedControls(audioStateController);
bindGlobalTransportControls(audioStateController);
bindMidiControls(audioStateController);
bindNoteSelector(audioStateController);
bindDeadNoteToggle(audioStateController);
bindArpeggioPauseNoteToggle(audioStateController);
bindRhythmButtons(audioStateController);
bindSettingsDialog(audioStateController);
bindMixerChannels(audioStateController);
bindKeyboardShortcuts(audioStateController);
bindPostFilterTypeToggle(audioStateController);
bindGlobalEffectMixSliders(audioEngine, state.synthParams);

audioStateController.initialize({ seed: getStateSeedFromLocation() });
audioStateController.initializeMidi();

window.audioStateController = audioStateController;

// Bind global effect mix sliders after DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    bindGlobalEffectMixSliders(audioEngine, state.synthParams);
  });
} else {
  bindGlobalEffectMixSliders(audioEngine, state.synthParams);
}
