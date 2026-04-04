# Android Development Setup

## Prerequisites

- Docker + Docker Compose
- ADB (Android Debug Bridge)
- One of:
  - Android phone with **Expo Go** (SDK 54) installed from the Play Store
  - Android emulator with Expo Go (SDK 54) installed

Install ADB if not already installed:

**Arch Linux:**
```bash
sudo pacman -S android-tools
```

**Ubuntu/Debian:**
```bash
sudo apt install android-tools-adb
```

**macOS:**
```bash
brew install android-platform-tools
```

**Windows:**
Download the [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools) ZIP, extract it, and add the folder to your PATH.

---

## Option A: Physical Device via USB

### Phone Setup

1. Go to **Settings > About phone**
2. Tap **Build number** 7 times to unlock Developer Options
3. Go to **Settings > Developer options**
4. Enable **USB debugging**
5. Plug in your phone via USB and tap **Allow** on the USB debugging prompt

Verify your phone is detected:
```bash
adb devices
# Should show your device (not "unauthorized")
```

### USB Reverse Tunneling

Run these so the phone can reach the Docker container through USB:
```bash
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
```

> Re-run these each time you reconnect the USB cable.

### API URL

`app/config.js` must use:
```js
export const API_BASE_URL = "http://localhost:3000";
```

### Connect

Open **Expo Go** on your phone and enter:
```
exp://localhost:8081
```

---

## Option B: Android Emulator

### Emulator Setup

1. Install Android Studio from the [Android developer site](https://developer.android.com/studio)
2. Open **Device Manager** (Tools > Device Manager)
3. Create a virtual device — Pixel series with a recent API level (API 33+) works well
4. Start the emulator

Verify it's detected:
```bash
adb devices
# Should show "emulator-5554" or similar
```

### USB Reverse Tunneling

Same as physical device — the emulator also uses ADB:
```bash
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
```

### API URL

The emulator can alternatively reach the host machine directly via its special IP:
```js
export const API_BASE_URL = "http://10.0.2.2:3000";
```

Or use `localhost:3000` with ADB reverse (same as physical device).

### Connect

Open **Expo Go** inside the emulator and enter:
```
exp://localhost:8081
```

---

## Starting the Dev Environment

```bash
docker compose build && docker compose up
```

The container starts both:
- Express server on port 3000
- Expo Metro bundler on port 8081

---

## Notes

- The project targets **Expo SDK 54** — Expo Go must be version 54.x (not 55+)
- ADB reverse tunnels: device `localhost` → host machine → Docker container
- Tunnels must be set up **after** the device/emulator is running and **before** opening Expo Go
