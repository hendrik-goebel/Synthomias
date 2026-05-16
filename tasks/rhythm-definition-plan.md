# Rhythm Definition Feature - Implementation Plan

## Overview
Add a new UI section with 16 buttons below the arpeggio section to define rhythms. Each button represents whether there's a pause after note position 1-16 in the pattern.

## Implementation Steps

### 1. State Management
- Add `rhythmPattern` array to instrument params (array of 16 booleans)
- Add to constants.js: RHYTHM_PATTERN_LENGTH = 16
- Initialize rhythm pattern in presets

### 2. HTML UI
- Add new section `.rhythm-section` after `.note-selector`
- Create 16 buttons in a grid layout
- Each button shows position number and is toggleable
- Label: "Rhythm Definition" or similar

### 3. JavaScript UI Handlers
- Add rhythm button event listeners
- Create UI sync function to update button states from state
- Update state when buttons clicked

### 4. Pattern Building Logic
- Modify `buildArpeggioPattern` or create new variant that uses rhythmPattern
- Apply pauses at positions defined by rhythmPattern
- Need to ensure pattern positions map correctly to rhythm positions

### 5. Audio Engine Integration
- Update `rebuildInstrumentPattern` to use rhythmPattern instead of pauseInsertionIndex
- Ensure pattern generation respects the rhythm configuration

### 6. State Serialization
- Add rhythmPattern to seed serialization/deserialization
- Ensure rhythm patterns persist and load correctly

## Files to Modify
1. `constants.js` - Add RHYTHM_PATTERN_LENGTH and update INITIAL_SYNTH_PARAMS
2. `index.html` - Add rhythm section UI
3. `css/style.css` - Add styles for rhythm section
4. `js/ui.js` - Add rhythm button handlers and sync functions
5. `js/patterns.js` - Modify pattern building to use rhythmPattern
6. `js/presets.js` - Add rhythmPattern to instrument params
7. `js/audio-state-controller.js` - Handle rhythm pattern updates

## Notes
- Rhythm positions map to the arpeggio pattern (up + down)
- Pauses represented as `null` in pattern array
- Need to handle variable pattern lengths

