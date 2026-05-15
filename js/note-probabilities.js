// Note Probabilities UI
// Handles rendering and interaction for the Note Probabilities section
import { PITCH_CLASS_OPTIONS } from "./constants.js";
import { state } from "./state.js";

const NOTE_NAMES = PITCH_CLASS_OPTIONS.map(({ label }) => label);

let noteOrder = [...NOTE_NAMES];


// Probability values per instrument: { [instrumentId]: { C: 0.5, ... } }
const noteProbabilitiesByInstrument = {};

function getCurrentInstrumentId() {
  return state.activeInstrumentPresetId;
}

function getNoteProbabilitiesForInstrument(instrumentId) {
  if (!noteProbabilitiesByInstrument[instrumentId]) {
    noteProbabilitiesByInstrument[instrumentId] = {};
    NOTE_NAMES.forEach((note) => {
      noteProbabilitiesByInstrument[instrumentId][note] = 1.0;
    });
  }
  return noteProbabilitiesByInstrument[instrumentId];
}

const CONTAINER_HEIGHT = 220; // px, must match CSS
const NOTE_WIDTH = 48; // px, must match CSS

function renderNoteProbabilities() {
  const list = document.getElementById('note-probabilities-list');
  if (!list) return;
  list.innerHTML = '';

  // Add axis labels
  const axis = document.createElement('div');
  axis.className = 'note-probabilities-axis';
  const topLabel = document.createElement('div');
  topLabel.className = 'note-probabilities-axis-label top';
  topLabel.textContent = '1.0';
  axis.appendChild(topLabel);
  const bottomLabel = document.createElement('div');
  bottomLabel.className = 'note-probabilities-axis-label bottom';
  bottomLabel.textContent = '0.0';
  axis.appendChild(bottomLabel);
  list.appendChild(axis);

  const instrumentId = getCurrentInstrumentId();
  const noteProbabilities = getNoteProbabilitiesForInstrument(instrumentId);

  NOTE_NAMES.forEach((note, idx) => {
    const prob = noteProbabilities[note];
    const row = document.createElement('div');
    row.className = 'note-probability-row';
    row.style.left = `${idx * NOTE_WIDTH + 8}px`;
    row.style.top = `${(1 - prob) * (CONTAINER_HEIGHT - 48)}px`;
    row.setAttribute('data-note', note);
    row.setAttribute('draggable', 'false');

    // Drag logic
    let isDragging = false;
    let dragStartY = 0;
    let origProb = prob;

    row.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragStartY = e.clientY;
      origProb = noteProbabilities[note];
      row.classList.add('dragging');
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    function onMouseMove(e) {
      if (!isDragging) return;
      const deltaY = e.clientY - dragStartY;
      const px = (1 - origProb) * (CONTAINER_HEIGHT - 48) + deltaY;
      let newProb = 1 - px / (CONTAINER_HEIGHT - 48);
      newProb = Math.max(0, Math.min(1, newProb));
      noteProbabilities[note] = newProb;
      renderNoteProbabilities();
    }
    function onMouseUp() {
      if (isDragging) {
        isDragging = false;
        row.classList.remove('dragging');
        document.body.style.userSelect = '';
      }
    }

    const label = document.createElement('span');
    label.className = 'note-probability-label';
    label.textContent = note;
    row.appendChild(label);

    const value = document.createElement('span');
    value.className = 'note-probability-value';
    value.textContent = noteProbabilities[note].toFixed(2);
    row.appendChild(value);

    list.appendChild(row);
  });
}

function moveNoteDrag(fromIdx, toIdx) {
  if (fromIdx === toIdx) return;
  const moved = noteOrder.splice(fromIdx, 1)[0];
  noteOrder.splice(toIdx, 0, moved);
  renderNoteProbabilities();
}

// Listen for instrument changes and initialize
function setupNoteProbabilitiesUI() {
  renderNoteProbabilities();
  // Listen for instrument changes on the controller, not window
  function attachControllerListener() {
    if (window.audioStateController && window.audioStateController.addEventListener) {
      window.audioStateController.addEventListener('statechange', (e) => {
        if (e.detail && (e.detail.type === 'instrument-selected' || e.detail.type === 'notes-updated')) {
          renderNoteProbabilities();
        }
      });
    } else {
      // Retry until controller is available
      setTimeout(attachControllerListener, 100);
    }
  }
  attachControllerListener();
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNoteProbabilitiesUI);
  } else {
    setupNoteProbabilitiesUI();
  }
}


// Export for use in audio-engine.js
export { getNoteProbabilitiesForInstrument };

// Optionally export for testing
if (typeof window !== 'undefined') {
  window.noteProbabilities = {
    getOrder: () => [...noteOrder],
    setOrder: (order) => { noteOrder = [...order]; renderNoteProbabilities(); },
  };

  window.refreshNoteProbabilitiesUI = renderNoteProbabilities;
}


function getNoteProbabilitiesSnapshot() {
  // Returns a deep copy of all instrument note probabilities
  const snapshot = {};
  Object.keys(state.channelAssignedPresetIdById).forEach((instrumentId) => {
    const probs = getNoteProbabilitiesForInstrument(instrumentId);
    snapshot[instrumentId] = { ...probs };
  });
  return snapshot;
}

function restoreNoteProbabilitiesFromSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return;
  Object.entries(snapshot).forEach(([instrumentId, probs]) => {
    const target = getNoteProbabilitiesForInstrument(instrumentId);
    Object.keys(target).forEach((note) => {
      if (probs[note] !== undefined) target[note] = probs[note];
    });
  });
}

export { getNoteProbabilitiesSnapshot, restoreNoteProbabilitiesFromSnapshot };
