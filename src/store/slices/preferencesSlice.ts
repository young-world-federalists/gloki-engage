import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PreferencesState {
  starred: string[];
  hidden: string[];
}

const STORAGE_KEY = 'communityPreferences';

function loadFromStorage(): PreferencesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        starred: Array.isArray(parsed.starred) ? parsed.starred : [],
        hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      };
    }
  } catch {
    // corrupted data
  }
  return { starred: [], hidden: [] };
}

function saveToStorage(state: PreferencesState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ starred: state.starred, hidden: state.hidden }));
}

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: loadFromStorage(),
  reducers: {
    toggleStar(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.starred.indexOf(id);
      if (idx >= 0) {
        state.starred.splice(idx, 1);
      } else {
        state.starred.push(id);
      }
      saveToStorage(state);
    },
    toggleHide(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.hidden.indexOf(id);
      if (idx >= 0) {
        state.hidden.splice(idx, 1);
      } else {
        state.hidden.push(id);
      }
      saveToStorage(state);
    },
    unhide(state, action: PayloadAction<string>) {
      const id = action.payload;
      const idx = state.hidden.indexOf(id);
      if (idx >= 0) {
        state.hidden.splice(idx, 1);
        saveToStorage(state);
      }
    },
  },
});

export const { toggleStar, toggleHide, unhide } = preferencesSlice.actions;
export default preferencesSlice.reducer;
