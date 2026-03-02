import React, { useRef } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';

const SWIPE_THRESHOLD = 100;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SwipeCard({ image, onSwipe, theme }) {
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) {
          const direction = gesture.dx > 0 ? 'right' : 'left';
          const toX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
          Animated.timing(pan, {
            toValue: { x: toX, y: gesture.dy },
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            onSwipe(direction);
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start();
        }
      },
    })
  ).current;

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  const keepOpacity = pan.x.interpolate({
    inputRange: [50, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const discardOpacity = pan.x.interpolate({
    inputRange: [-150, -50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const cardOpacity = pan.x.interpolate({
    inputRange: [-400, 0, 400],
    outputRange: [0.6, 1, 0.6],
    extrapolate: 'clamp',
  });

  const keepColor = theme?.keepColor || '#4ade80';
  const discardColor = theme?.discardColor || '#f87171';
  const borderRadius = theme?.borderRadius ?? 16;

  return (
    <Animated.View
      style={[
        styles.card,
        { borderRadius },
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate },
          ],
          opacity: cardOpacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Image
        source={{ uri: image.url }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />

      {/* KEEP overlay */}
      <Animated.View style={[styles.overlay, styles.keepOverlay, { opacity: keepOpacity }]}>
        <Text style={[styles.overlayText, { color: keepColor, borderColor: keepColor }]}>
          KEEP
        </Text>
      </Animated.View>

      {/* DISCARD overlay */}
      <Animated.View style={[styles.overlay, styles.discardOverlay, { opacity: discardOpacity }]}>
        <Text style={[styles.overlayText, { color: discardColor, borderColor: discardColor }]}>
          DISCARD
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 40,
    padding: 8,
  },
  keepOverlay: {
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  discardOverlay: {
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  overlayText: {
    fontSize: 32,
    fontWeight: '900',
    borderWidth: 4,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    letterSpacing: 2,
  },
});
