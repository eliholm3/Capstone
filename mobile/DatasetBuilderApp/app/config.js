// Local Docker dev: server runs at http://localhost:3000.
// On Android (USB device or emulator) this requires `adb reverse tcp:3000 tcp:3000`.
// Production: "https://aws.astrosim.ink"
export const API_BASE_URL = "http://localhost:3000";

// Wikimedia 403s requests with empty/generic User-Agents (e.g. Android's
// default `okhttp/X.X.X`). Send a real one when loading image URLs.
export const WIKIMEDIA_USER_AGENT =
  "Classi/1.0 (capstoneimagecollector@gmail.com)";
