import { useState, useEffect, useRef } from 'react';
import SwipeCard from './SwipeCard';
import './themes.css';
import './App.css';

const BUFFER_SIZE = 10; // Number of images to fetch at once
const FETCH_TRIGGER_THRESHOLD = 5; // Fetch more when this many images remain

// Function to fetch new images
const fetchNewImages = async () => {
  try {
    const response = await fetch('http://localhost:5000/images');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching images from Python:", error);
    return [];
  }
};

function App() {
  const [images, setImages] = useState([]);
  const [keptImages, setKeptImages] = useState([]);
  const [discardedImages, setDiscardedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [triggerSwipe, setTriggerSwipe] = useState(null);
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to 'default'
    return localStorage.getItem('theme') || 'default';
  });
  const nextImageIdRef = useRef(1);
  const hasFetchedInitial = useRef(false);

  // Apply theme to body element
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'default' ? 'developer' : 'default');
  };

  // Load initial batch of images
  useEffect(() => {
    if (!hasFetchedInitial.current) {
      hasFetchedInitial.current = true;
      setIsLoading(true);
      fetchNewImages(nextImageIdRef.current).then(newImages => {
        setImages(newImages);
        nextImageIdRef.current += BUFFER_SIZE;
        setIsLoading(false);
      });
    }
  }, []);

  // Check if we need to fetch more images
  useEffect(() => {
    const remainingImages = images.length - currentIndex;

    // Fetch more images when we have FETCH_TRIGGER_THRESHOLD or fewer remaining
    if (remainingImages <= FETCH_TRIGGER_THRESHOLD && !isFetching && images.length > 0) {
      setIsFetching(true);
      fetchNewImages(nextImageIdRef.current).then(newImages => {
        setImages(prevImages => [...prevImages, ...newImages]);
        nextImageIdRef.current += BUFFER_SIZE;
        setIsFetching(false);
      });
    }
  }, [currentIndex, images.length, isFetching]);

  const handleSwipe = async (direction) => {
    const currentImage = images[currentIndex];

    // Send the swipe to the Python backend
    try {
      fetch('http://localhost:5000/swipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentImage.id, direction: direction })
      });
    } catch (error) {
      console.error("Error saving swipe:", error);
    }

    // Update frontend state
    if (direction === 'right') {
      setKeptImages([...keptImages, currentImage]);
    } else {
      setDiscardedImages([...discardedImages, currentImage]);
    }

    setCurrentIndex(currentIndex + 1);
    setIsAnimating(false);
  };
  
  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);

      // Remove from kept or discarded arrays
      const lastImage = images[currentIndex - 1];
      setKeptImages(keptImages.filter(img => img.id !== lastImage.id));
      setDiscardedImages(discardedImages.filter(img => img.id !== lastImage.id));
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setKeptImages([]);
    setDiscardedImages([]);
    // Reset the image buffer
    setImages([]);
    nextImageIdRef.current = 1;
    hasFetchedInitial.current = false;
    setIsFetching(false);
    // Trigger initial fetch
    setIsLoading(true);
    fetchNewImages(1).then(newImages => {
      setImages(newImages);
      nextImageIdRef.current = BUFFER_SIZE + 1;
      setIsLoading(false);
      hasFetchedInitial.current = true;
    });
  };

  const currentImage = images[currentIndex];

  // Keyboard controls for arrow keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only process if we have a current image and not loading or animating
      if (!currentImage || isLoading || isAnimating) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIsAnimating(true);
        setTriggerSwipe('left');
        // Reset trigger after a brief moment
        setTimeout(() => setTriggerSwipe(null), 50);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIsAnimating(true);
        setTriggerSwipe('right');
        // Reset trigger after a brief moment
        setTimeout(() => setTriggerSwipe(null), 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentImage, isLoading, isAnimating]);

  // Get images for buffer visualization (5 past, current, 5 future)
  const getBufferImages = () => {
    const bufferImages = [];
    const startIndex = Math.max(0, currentIndex - 5);
    const endIndex = Math.min(images.length, currentIndex + 6);

    for (let i = startIndex; i < endIndex; i++) {
      const img = images[i];
      const isPast = i < currentIndex;
      const isCurrent = i === currentIndex;

      // Determine classification status for past images
      let status = null;
      if (isPast) {
        if (keptImages.find(kept => kept.id === img.id)) {
          status = 'kept';
        } else if (discardedImages.find(disc => disc.id === img.id)) {
          status = 'discarded';
        }
      }

      bufferImages.push({
        ...img,
        index: i,
        isPast,
        isCurrent,
        status
      });
    }

    return bufferImages;
  };

  const bufferImages = getBufferImages();

  return (
    <div className="app">
      {/* Theme Switcher */}
      <button onClick={toggleTheme} className="theme-switcher">
        {theme === 'default' ? '👨‍💻' : '🎨'} {theme === 'default' ? 'Developer' : 'Default'}
      </button>

      <header className="header">
        <h1>Image Classifier</h1>
        <div className="stats">
          <span className="stat kept">Kept: {keptImages.length}</span>
          <span className="stat discarded">Discarded: {discardedImages.length}</span>
          <span className="stat remaining">
            In Buffer: {images.length - currentIndex}
            {isFetching && <span className="loading-indicator"> (Loading more...)</span>}
          </span>
        </div>
      </header>

      {/* Buffer Visualization */}
      {!isLoading && bufferImages.length > 0 && (
        <div className="buffer-visualization">
          <div className="buffer-track">
            {bufferImages.map((img) => (
              <div
                key={img.id}
                className={`buffer-item ${img.isCurrent ? 'current' : ''} ${img.isPast ? 'past' : 'future'} ${img.status || ''}`}
              >
                <img src={img.url} alt={img.name} />
                {img.status && (
                  <div className="buffer-overlay"></div>
                )}
                {img.isCurrent && (
                  <div className="current-indicator">▼</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-container">
        {isLoading && (
          <div className="loading-message">
            <h2>Loading images...</h2>
            <p>Please wait while we fetch your images</p>
          </div>
        )}

        {!isLoading && currentImage && (
          <SwipeCard
            key={currentImage.id}
            image={currentImage}
            onSwipe={handleSwipe}
            triggerSwipe={triggerSwipe}
            onAnimationStart={() => setIsAnimating(true)}
          />
        )}

        {!isLoading && !currentImage && (
          <div className="loading-message">
            <h2>Loading next batch...</h2>
            <p>Fetching more images</p>
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="instructions">
          <p>👈 Swipe left to discard • Swipe right to keep 👉</p>
          <p className="sub-text">Drag with mouse • Use arrow keys ← → • Images load infinitely</p>
        </div>
        <div className="controls">
          <button
            onClick={handleUndo}
            disabled={currentIndex === 0}
            className="undo-button"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleReset}
            className="reset-button-small"
          >
            Reset
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
