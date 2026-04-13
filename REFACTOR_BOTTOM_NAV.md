# Classi — Bottom Navigation Refactor Handoff

This document contains everything needed to resume the bottom navigation bar refactor
on a new device with no prior context. Read this file fully before touching any code.

---

## What This Refactor Is

Replacing the current single-screen `SwipeScreen` architecture with a 3-tab bottom
navigation layout:

| Tab | Screen | Description |
|---|---|---|
| 1 | Datasets | List/create/delete datasets; tap to activate one |
| 2 | Swipe | The existing swipe interface, stripped of dataset modal |
| 3 | Settings | Logout + user info (moved from top bar) |

A persistent `AppHeader` component renders the Classi logo left-aligned **above** the
tab navigator on all authenticated screens.

---

## Repository Location

```
/Capstone
├── mobile/DatasetBuilderApp/     ← ALL CHANGES ARE IN HERE
│   ├── App.js
│   ├── package.json
│   ├── assets/
│   │   ├── Classi-Logo-Style1-Transparent.png   ← USE THIS for the header logo
│   │   └── CLASSI-LOGO.png
│   └── app/
│       ├── config.js
│       ├── theme.js
│       ├── context/
│       │   └── AuthContext.js
│       ├── screens/
│       │   ├── LoginScreen.js
│       │   ├── RegisterScreen.js
│       │   └── SwipeScreen.js              ← will be heavily refactored
│       └── components/
│           ├── SwipeCard.js
│           ├── StatsBar.js
│           └── BufferStrip.js
```

---

## Files to Read Before Starting

Read these files to understand the current state before writing any code:

1. `mobile/DatasetBuilderApp/App.js` — current navigation setup (NativeStack only)
2. `mobile/DatasetBuilderApp/app/screens/SwipeScreen.js` — all logic lives here currently
3. `mobile/DatasetBuilderApp/app/context/AuthContext.js` — JWT + session management
4. `mobile/DatasetBuilderApp/app/components/SwipeCard.js` — gesture card component
5. `mobile/DatasetBuilderApp/app/components/StatsBar.js` — kept/discarded/buffer pills
6. `mobile/DatasetBuilderApp/app/components/BufferStrip.js` — horizontal thumbnail strip
7. `mobile/DatasetBuilderApp/app/theme.js` — zinc palette + theme object
8. `mobile/DatasetBuilderApp/package.json` — installed dependencies

---

## Current State Summary

### `App.js` (current)
```
GestureHandlerRootView
  SafeAreaProvider
    AuthProvider
      NavigationContainer
        RootNavigator
          if !token → AuthStack (Login → Register, NativeStack)
          if token  → AppStack  (single screen: SwipeScreen, NativeStack)
```

### `SwipeScreen.js` (current — monolithic)
Contains ALL of these which must be split apart:
- `datasets` state + `loadDatasets()` + `GET /api/datasets`
- `activeDataset` state + `selectDataset()`
- `createDataset()` + `POST /api/datasets` — triggered from modal
- A Modal with TextInputs for dataset name + search term
- Top bar with logout button + dataset selector trigger
- Images buffer state: `images`, `keptImages`, `discardedImages`, `currentIndex`
- `fetchImages()`, `doFetch()`, cursor-based pagination via `cursorRef`
- Background refill trigger (fires when ≤5 images remain locally)
- Polling retry timer (fires when buffer is empty)
- `handleSwipe()` → PATCH `/api/datasets/:id/images/:imgId`
- `handleUndo()` — decrements currentIndex
- `handleReset()` — re-selects active dataset (TO BE DELETED per TODO)
- `StatsBar`, `BufferStrip`, `SwipeCard` rendered inline
- A Reset button (TO BE DELETED per TODO.md)

### Theme (zinc palette — `theme.js`)
```js
const t = themes.default;
// Key values:
// t.bg          = '#09090b'  (zinc-950, screen background)
// t.cardBg      = '#18181b'  (zinc-900)
// t.border      = '#27272a'  (zinc-800)
// t.text        = '#fafafa'  (zinc-50)
// t.mutedText   = '#71717a'  (zinc-500)
// t.accentBg    = '#fafafa'  (zinc-50, primary button bg)
// t.accentText  = '#18181b'  (zinc-900, primary button text)
// t.buttonBg    = '#27272a'  (zinc-800)
// t.buttonBorder= '#3f3f46'  (zinc-700)
// t.inputBg     = '#27272a'
// t.inputBorder = '#3f3f46'
// t.inputText   = '#fafafa'
// t.inputPlaceholder = '#71717a'
// t.keepColor   = '#22c55e'  (green-500)
// t.discardColor= '#ef4444'  (red-500)
```

### Installed Dependencies (relevant)
```json
"@react-navigation/native": "^7.1.31",
"@react-navigation/native-stack": "^7.14.2",
"react-native-gesture-handler": "~2.28.0",
"react-native-reanimated": "~4.1.1",
"react-native-safe-area-context": "~5.6.2",
"react-native-screens": "~4.16.0",
"expo": "~54.0.0",
"expo-image": "~3.0.11"
```

**NOT yet installed — must add:**
```
@react-navigation/bottom-tabs
```

Install with: `npx expo install @react-navigation/bottom-tabs`
(Run from inside `mobile/DatasetBuilderApp/`)

---

## API Reference (Backend — read-only, do not change)

Base URL defined in `app/config.js` as `API_BASE_URL`.
All routes below require `Authorization: Bearer <token>` except login/register.

| Method | Path | Response fields of note |
|---|---|---|
| GET | `/api/datasets` | `dataset_id`, `name`, `search_term`, `total_count`, `pending_count`, `approved_count`, `rejected_count`, `created_at` |
| POST | `/api/datasets` | body: `{name, search_term, total_images}` — returns new dataset |
| DELETE | `/api/datasets/:id` | returns `{message: 'Dataset deleted.'}` |
| GET | `/api/datasets/:id/images?after=0` | returns array of `{image_id, url, title, id}` |
| PATCH | `/api/datasets/:id/images/:imgId` | body: `{status: 'approved'|'rejected'}` |

---

## New File Structure (target state)

```
mobile/DatasetBuilderApp/
├── App.js                              (MODIFIED)
├── app/
│   ├── context/
│   │   ├── AuthContext.js              (UNCHANGED)
│   │   └── DatasetContext.js           (NEW)
│   ├── screens/
│   │   ├── LoginScreen.js              (UNCHANGED)
│   │   ├── RegisterScreen.js           (UNCHANGED)
│   │   ├── DatasetsScreen.js           (NEW)
│   │   ├── SwipeScreen.js              (REFACTORED)
│   │   └── SettingsScreen.js           (NEW)
│   └── components/
│       ├── SwipeCard.js                (UNCHANGED)
│       ├── StatsBar.js                 (UNCHANGED)
│       ├── BufferStrip.js              (UNCHANGED)
│       └── AppHeader.js               (NEW)
```

---

## Implementation Steps

### STEP 1 — Install dependency

```bash
cd mobile/DatasetBuilderApp
npx expo install @react-navigation/bottom-tabs
```

---

### STEP 2 — Create `app/context/DatasetContext.js`

This context holds dataset list and active dataset state, shared between
`DatasetsScreen` and `SwipeScreen` without prop drilling.

**State it must own:**
- `datasets` — array from GET /api/datasets
- `activeDataset` — the currently selected dataset object (or null)
- `setActiveDataset` — direct setter
- `loadDatasets()` — fetches GET /api/datasets, updates `datasets`
- `createDataset(name, searchTerm)` — POSTs, appends to list, sets as active, returns new dataset
- `deleteDataset(id)` — DELETEs, removes from list, clears active if it was the deleted one

**It must use `token` from `useAuth()`.**

**Skeleton:**
```js
import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const { token } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [activeDataset, setActiveDataset] = useState(null);

  const loadDatasets = async () => { /* GET /api/datasets */ };
  const createDataset = async (name, searchTerm) => { /* POST /api/datasets */ };
  const deleteDataset = async (id) => { /* DELETE /api/datasets/:id */ };

  return (
    <DatasetContext.Provider value={{ datasets, activeDataset, setActiveDataset, loadDatasets, createDataset, deleteDataset }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDatasets() {
  return useContext(DatasetContext);
}
```

**createDataset must:**
- POST with `{ name, search_term: searchTerm, total_images: 20 }`
- On success: prepend to `datasets`, call `setActiveDataset(newDataset)`
- Return the new dataset object so the caller can navigate to Swipe tab

**deleteDataset must:**
- DELETE the dataset
- Remove from `datasets` array
- If `activeDataset.dataset_id === id`, set `activeDataset` to `null`

---

### STEP 3 — Create `app/components/AppHeader.js`

A persistent header that shows above all tabs. Left-aligned logo image.

```js
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { themes } from '../theme';

const t = themes.default;

export default function AppHeader() {
  return (
    <View style={styles.header}>
      <Image
        source={require('../../assets/Classi-Logo-Style1-Transparent.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 52,
    backgroundColor: t.bg,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logo: {
    height: 32,
    width: 120,
  },
});
```

---

### STEP 4 — Create `app/screens/DatasetsScreen.js`

**Purpose:** Browse, select, create, and delete datasets.

**Behavior:**
- On mount: call `loadDatasets()` from `DatasetContext`
- Renders a `FlatList` of dataset cards
- Active dataset card has a highlighted left border (use `t.accentBg` / zinc-50)
- Each card shows: name, search_term, approved_count, rejected_count, pending_count
- Tapping a card: calls `setActiveDataset(ds)`, then `navigation.navigate('Swipe')`
- Delete icon on each card: calls `deleteDataset(id)` (with a confirmation Alert)
- Creation form at the bottom of the screen (NOT a modal — inline expandable section):
  - A "New Dataset" button that expands a form
  - Inputs: Dataset Name, Search Term
  - "Create" button → calls `createDataset(name, searchTerm)` → on success navigate to Swipe tab
  - "Cancel" button collapses the form

**Card layout (each dataset):**
```
┌─────────────────────────────────────────┐
│ ▌ Dataset Name                    [🗑]  │  ← active gets left accent border
│   Search: golden retriever              │
│   ✓ 12  ✗ 4  ○ 38                      │  ← approved / rejected / pending counts
└─────────────────────────────────────────┘
```

**Empty state:** "No datasets yet. Create your first one below."

---

### STEP 5 — Refactor `app/screens/SwipeScreen.js`

**Remove entirely from SwipeScreen:**
- `datasets` state and `loadDatasets()`
- `activeDataset` state and `selectDataset()` (replace with context read)
- `createDataset()` function
- `isModalVisible`, `newDatasetName`, `searchTerm` state
- The entire `<Modal>` JSX block
- The logout `TouchableOpacity` from the top bar
- The dataset selector `TouchableOpacity` from the top bar (and the whole `topBar` View)
- The `handleReset` function and its Reset button
- The `isLoading` state related to dataset creation (keep any loading for image fetch)

**Add to SwipeScreen:**
- `const { activeDataset } = useDatasets();` — read active dataset from context
- Replace the top bar entirely with a small subtitle showing active dataset name:
  ```jsx
  {activeDataset && (
    <Text style={{ color: t.mutedText, fontSize: 13, textAlign: 'center', paddingVertical: 6 }}>
      {activeDataset.name}
    </Text>
  )}
  ```
- Empty state when `!activeDataset`:
  ```jsx
  <View style={styles.centered}>
    <Text style={{ color: t.mutedText, fontSize: 14, textAlign: 'center' }}>
      Select a dataset from the Datasets tab to begin.
    </Text>
  </View>
  ```
- The `useEffect` that called `loadDatasets()` on mount — remove it
- Keep all image buffer logic, `fetchImages`, `doFetch`, `handleSwipe`, `handleUndo`
- Keep `StatsBar`, `BufferStrip`, `SwipeCard`
- Keep the `Undo` button in the footer
- Keep `cursorRef`, `retryTimerRef`, `isFetchingRef`

**IMPORTANT — reset buffer when activeDataset changes:**
The current `selectDataset()` resets `images`, `keptImages`, `discardedImages`, and `cursorRef`.
This logic must be preserved as a `useEffect` watching `activeDataset`:
```js
useEffect(() => {
  setImages([]);
  setKeptImages([]);
  setDiscardedImages([]);
  cursorRef.current = 0;
  if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  if (activeDataset) {
    fetchImages(activeDataset.dataset_id).then(data => setImages(data));
  }
}, [activeDataset?.dataset_id]);
```

---

### STEP 6 — Create `app/screens/SettingsScreen.js`

Simple screen. Contains:
- Username display: `const { username, logout } = useAuth();`
- A "Sign Out" button that calls `logout()`
- App name / version label (can hardcode "Classi v1.0" for now)
- Optionally: a note about the web export panel

**Layout:**
```
[ Classi logo header — from AppHeader ]
─────────────────────────────────────
  Account

  Signed in as: username

  [ Sign Out ]

  App
  Version 1.0
```

---

### STEP 7 — Update `App.js`

Replace `AppStack` (single NativeStack screen) with a bottom tab navigator.
Wrap `DatasetProvider` around the authenticated tree.

**New structure:**
```js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DatasetProvider } from './app/context/DatasetContext';
import DatasetsScreen from './app/screens/DatasetsScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import AppHeader from './app/components/AppHeader';

const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <AppHeader />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#18181b',  // zinc-900
            borderTopColor: '#27272a',   // zinc-800
          },
          tabBarActiveTintColor: '#fafafa',   // zinc-50
          tabBarInactiveTintColor: '#71717a', // zinc-500
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Datasets: focused ? 'layers' : 'layers-outline',
              Swipe: focused ? 'swap-horizontal' : 'swap-horizontal-outline',
              Settings: focused ? 'settings' : 'settings-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Datasets" component={DatasetsScreen} />
        <Tab.Screen name="Swipe" component={SwipeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </View>
  );
}

function AppStack() {
  return (
    <DatasetProvider>
      <AppTabs />
    </DatasetProvider>
  );
}
```

The `RootNavigator`, `AuthStack`, and auth-gating logic remain unchanged.

**Note on `@expo/vector-icons`:** This is bundled with Expo SDK 54 — no additional
install needed. Import as `import { Ionicons } from '@expo/vector-icons';`

---

## Key Decisions & Constraints

### Tab mount behavior
Do NOT set `unmountOnBlur: true` on the Swipe tab. React Navigation keeps tabs
mounted by default when switching, which preserves the swipe buffer state. This is
the correct behavior — users can switch to Datasets and back without losing progress.

### No modal for dataset creation
The current modal pattern is being replaced with an inline expandable form directly
in `DatasetsScreen`. This avoids the overlay/dismiss awkwardness and keeps the flow
within the tab.

### Reset button — delete it
`TODO.md` explicitly says to remove the reset button. Do not port it to the refactored
`SwipeScreen`.

### Logout moves to Settings tab
Remove the logout button from the top bar entirely. It now lives in `SettingsScreen`.
The top bar (`topBar` View) in `SwipeScreen` is removed entirely.

### activeDataset as shared context
`activeDataset` must live in `DatasetContext`, not local state in either screen.
Both `DatasetsScreen` (to highlight the selected card) and `SwipeScreen` (to know
what to fetch) need to read it.

### SafeAreaView
`SwipeScreen` currently wraps content in `SafeAreaView`. With the persistent
`AppHeader` above the tabs, the top safe area inset is handled by `AppHeader`.
The Swipe tab content should use `edges={['bottom']}` on its `SafeAreaView` or
just remove the top inset handling from that screen.

---

## What NOT to Change

- `mobile/DatasetBuilderApp/app/context/AuthContext.js` — unchanged
- `mobile/DatasetBuilderApp/app/screens/LoginScreen.js` — unchanged
- `mobile/DatasetBuilderApp/app/screens/RegisterScreen.js` — unchanged
- `mobile/DatasetBuilderApp/app/components/SwipeCard.js` — unchanged
- `mobile/DatasetBuilderApp/app/components/StatsBar.js` — unchanged
- `mobile/DatasetBuilderApp/app/components/BufferStrip.js` — unchanged
- `mobile/DatasetBuilderApp/app/theme.js` — unchanged
- `mobile/DatasetBuilderApp/app/config.js` — unchanged
- Everything in `server/` — no backend changes
- Everything in `web/` — no web panel changes

---

## Open TODOs That This Refactor Resolves

From `TODO.md`:
- "refactor the ui. perchance we use bottom bar layout/design." — **this is that refactor**
- "why is there a reset button? let's get rid of that." — **deleted in SwipeScreen refactor**
- "add delete button for datasets in app" — **added in DatasetsScreen**

---

## Open TODOs That This Refactor Does NOT Address

These remain in scope for future work after this refactor is done:
- Session persistence (kept/discarded counts reset on reload)
- Image flash during swipe transitions
- Submit form on enter press when logging in
- Pagination improvements
- Review screen for swiped images
- "change current dataset in top bar to the currently loading one as it is loading after creation" — becomes "navigate to Swipe tab as dataset is loading" in new flow

---

## Verification Checklist

After implementation, verify:
- [ ] App loads to Login screen when no token stored
- [ ] After login, lands on Datasets tab (or Swipe tab — either is fine)
- [ ] Datasets tab shows list of existing datasets fetched from API
- [ ] Tapping a dataset card navigates to Swipe tab and begins loading images
- [ ] Creating a new dataset from Datasets tab navigates to Swipe tab automatically
- [ ] Delete button on dataset card removes it (with confirmation); clears swipe screen if it was active
- [ ] Swipe tab shows "Select a dataset" placeholder when none is active
- [ ] Swipe tab shows active dataset name as subtitle
- [ ] Swiping right/left sends PATCH to backend
- [ ] Undo button decrements currentIndex
- [ ] StatsBar shows correct kept/discarded/buffer counts
- [ ] BufferStrip scrolls with current card highlighted
- [ ] Auto-fetch triggers when ≤5 images remain
- [ ] Settings tab shows username and Sign Out button
- [ ] Sign Out clears token and returns to Login screen
- [ ] Logo appears left-aligned in header on all 3 tabs
- [ ] Switching between tabs does NOT reset swipe buffer state
- [ ] No Reset button exists anywhere
- [ ] No Logout button in top bar of Swipe screen
