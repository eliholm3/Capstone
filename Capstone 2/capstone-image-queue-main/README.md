# Image Classifier Prototype

A React-based prototype for classifying images with swipe gestures. Swipe right to keep images, left to discard them. Features infinite loading with a smart buffer system.

## Features

- 📱 Swipe gestures (works with mouse drag and touch)
- ⌨️ **Keyboard controls** - Use arrow keys (← →) for quick classification
- ✅ Keep/Discard queues
- ↶ Undo functionality
- 📊 Real-time statistics
- 🎨 Mobile-friendly UI
- 🔄 Reset capability
- ♾️ **Infinite loading** - Images load continuously as you classify
- 🔋 **Smart buffering** - Fetches 10 images at a time, pre-loading when you reach the 5th remaining image
- 🎨 **Theme Switcher** - Toggle between Default (vibrant gradient) and Developer (minimalist dark mode with JetBrains Mono font)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the backend:
```bash
python app.py
```
This will run on port 5000

3. Run the development server:
```bash
npm run dev
```

4. Open your browser to the URL shown in the terminal (usually http://localhost:5173)

## Usage

- **Swipe Right** or **Drag Right** or **→ Arrow Key**: Keep the image
- **Swipe Left** or **Drag Left** or **← Arrow Key**: Discard the image
- **Undo Button**: Go back to the previous image
- **Reset Button**: Start over from the beginning
- **Theme Switcher** (top-right): Toggle between Default and Developer themes

### Controls
- **Touch/Mouse**: Swipe or drag the image left or right
- **Keyboard**: Use the left (←) and right (→) arrow keys to quickly classify images
- **Mobile-friendly**: Works with touch gestures on mobile devices

## Themes

### Default Theme
- Vibrant purple gradient background
- Rounded, friendly UI elements
- System fonts for broad compatibility
- Perfect for casual use and presentations

### Developer Theme
- Minimalist dark mode (GitHub-inspired)
- JetBrains Mono monospace font
- Sharp corners and clean lines
- Reduced visual noise for extended use
- Professional, code-editor aesthetic

Your theme preference is saved in localStorage and persists across sessions.

## How the Infinite Loading Works

The app uses a buffer system to efficiently load images:

1. **Initial Load**: Fetches 10 images when the app starts
2. **Smart Pre-fetching**: When you classify an image and only 5 images remain in the buffer, it automatically fetches the next 10 images
3. **Continuous Flow**: This pattern continues infinitely, ensuring you always have images to classify

## Customizing Images

Replace the `fetchNewImages` function in `src/App.jsx` with your own data source:

```javascript
const fetchNewImages = async (startId) => {
  // Replace this with your API call
  const response = await fetch(`/api/images?start=${startId}&limit=10`);
  const data = await response.json();

  return data.map(item => ({
    id: item.id,
    name: item.name,
    url: item.imageUrl
  }));
};
```

You can adjust the buffer settings at the top of `src/App.jsx`:
- `BUFFER_SIZE`: Number of images to fetch per batch (default: 10)
- `FETCH_TRIGGER_THRESHOLD`: Fetch more when this many images remain (default: 5)

## Next Steps for React Native

The component structure and logic are designed to transfer easily to React Native:
- Replace mouse/touch event handlers with React Native's `PanResponder`
- Replace `<img>` with `<Image>` component
- Use React Native StyleSheet instead of CSS
- The state management logic remains the same

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.
