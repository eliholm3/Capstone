import { useState, useRef, useEffect } from 'react';
import './SwipeCard.css';

const SwipeCard = ({ image, onSwipe, triggerSwipe, onAnimationStart }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState(null);
  const cardRef = useRef(null);

  const SWIPE_THRESHOLD = 100; // pixels to trigger swipe

  // Listen for external swipe triggers (from arrow keys)
  useEffect(() => {
    if (triggerSwipe) {
      // For arrow key triggers, start from center position
      triggerSwipeAnimation(triggerSwipe, { x: 0, y: 0 });
    }
  }, [triggerSwipe]);

  const triggerSwipeAnimation = (direction, startPosition = { x: 0, y: 0 }) => {
    setIsAnimating(true);
    setAnimationDirection(direction);

    // Notify parent that animation has started
    if (onAnimationStart) {
      onAnimationStart();
    }

    // Calculate distance remaining and duration for consistent speed
    const targetX = direction === 'right' ? window.innerWidth : -window.innerWidth;
    const distanceRemaining = Math.abs(targetX - startPosition.x);
    const totalDistance = window.innerWidth;

    // Base duration is 300ms for full swipe, scale proportionally
    const duration = (distanceRemaining / totalDistance) * 300;

    // After animation completes, call onSwipe
    setTimeout(() => {
      onSwipe(direction);
      setIsAnimating(false);
      setAnimationDirection(null);
      setPosition({ x: 0, y: 0 }); // Reset after callback
    }, duration);
  };

  const handleStart = (clientX, clientY) => {
    if (isAnimating) return; // Don't allow interaction during animation
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging || isAnimating) return;

    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    setIsDragging(false);

    // Check if swipe threshold was met
    if (Math.abs(position.x) > SWIPE_THRESHOLD) {
      const direction = position.x > 0 ? 'right' : 'left';
      // Trigger animation from current position
      triggerSwipeAnimation(direction, position);
      // DON'T reset position - let animation continue from here
      return;
    }

    // Reset position if threshold not met
    setPosition({ x: 0, y: 0 });
  };

  // Mouse events
  const handleMouseDown = (e) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const rotation = position.x * 0.1; // Slight rotation based on swipe

  // Build class name
  let className = 'swipe-card';
  if (isDragging) className += ' dragging';
  if (isAnimating) className += ' animating';

  // Calculate target position for animation
  const targetX = animationDirection === 'right' ? window.innerWidth : -window.innerWidth;
  const targetRotation = animationDirection === 'right' ? 30 : -30;

  // Calculate animation duration based on remaining distance
  const distanceRemaining = isAnimating ? Math.abs(targetX - position.x) : 0;
  const totalDistance = window.innerWidth;
  const duration = isAnimating ? (distanceRemaining / totalDistance) * 300 : 300;

  // Apply styles
  const cardStyle = isAnimating ? {
    transform: `translate(${targetX}px, ${position.y}px) rotate(${targetRotation}deg)`,
    opacity: 0,
    transition: `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`
  } : {
    transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
    opacity: (1 - Math.abs(position.x) / 400),
  };

  return (
    <div
      ref={cardRef}
      className={className}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={isDragging ? handleMouseUp : undefined}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <img src={image.url} alt={image.name} draggable="false" />
      
      {/* Swipe indicators */}
      <div 
        className="swipe-indicator keep" 
        style={{ opacity: position.x > 50 ? (position.x - 50) / 100 : 0 }}
      >
        KEEP
      </div>
      <div 
        className="swipe-indicator discard" 
        style={{ opacity: position.x < -50 ? (Math.abs(position.x) - 50) / 100 : 0 }}
      >
        DISCARD
      </div>
    </div>
  );
};

export default SwipeCard;
