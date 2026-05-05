import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { WIKIMEDIA_USER_AGENT } from "../config";

const SWIPE_THRESHOLD = 100;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Browser refuses to let JS set User-Agent (forbidden header), and passing
// `headers` at all on web kicks expo-image off the <img> path into a CORS-gated
// fetch — which Wikimedia's preflight doesn't allow. Only set on native.
const IMAGE_HEADERS =
  Platform.OS === "web" ? undefined : { "User-Agent": WIKIMEDIA_USER_AGENT };

export default function SwipeCard({ image, onSwipe, theme }) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [loadState, setLoadState] = useState("loading"); // 'loading' | 'loaded' | 'error'
  const [errorMsg, setErrorMsg] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Tracks finger movement
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      // When user lets go
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) {
          const direction = gesture.dx > 0 ? "right" : "left";
          const toX =
            direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
          // Animation for swipe out
          Animated.timing(pan, {
            toValue: { x: toX, y: gesture.dy },
            duration: 300,
            useNativeDriver: false,
          }).start(() => {
            onSwipe(image.image_id, direction);
          });
        } else {
          // Return card to origin
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 5,
          }).start();
        }
      },
    }),
  ).current;

  // Tilting effect when moving left/right
  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ["-20deg", "0deg", "20deg"],
  });

  const keepOpacity = pan.x.interpolate({
    inputRange: [50, 150],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const discardOpacity = pan.x.interpolate({
    inputRange: [-150, -50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const cardOpacity = pan.x.interpolate({
    inputRange: [-400, 0, 400],
    outputRange: [0.6, 1, 0.6],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.card,
        { borderColor: theme.border, cursor: "grab", userSelect: "none" },
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
          opacity: cardOpacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Image
        key={retryNonce}
        source={{
          uri: image.url,
          headers: IMAGE_HEADERS,
        }}
        style={styles.image}
        contentFit="cover"
        transition={100}
        pointerEvents="none"
        onLoadStart={() => {
          console.log('[SwipeCard] loadStart', image.image_id, image.url);
          setLoadState('loading');
          setErrorMsg(null);
        }}
        onLoad={() => {
          console.log('[SwipeCard] loaded', image.image_id);
          setLoadState('loaded');
        }}
        onError={(e) => {
          const msg = e?.error || e?.nativeEvent?.error || 'unknown';
          console.warn('[SwipeCard] ERROR', image.image_id, msg, image.url);
          setErrorMsg(String(msg));
          setLoadState('error');
        }}
      />

      {loadState === 'loading' && (
        <View style={styles.statusOverlay} pointerEvents="none">
          <ActivityIndicator color={theme.loadingColor} />
        </View>
      )}

      {loadState === 'error' && (
        <View style={styles.statusOverlay}>
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            Failed to load
          </Text>
          <Text
            style={[styles.errorDetail, { color: theme.mutedText }]}
            numberOfLines={3}
          >
            {errorMsg}
          </Text>
          <TouchableOpacity
            onPress={() => setRetryNonce((n) => n + 1)}
            style={[
              styles.retryBtn,
              { backgroundColor: theme.buttonBg, borderColor: theme.buttonBorder },
            ]}
          >
            <Text style={[styles.retryText, { color: theme.buttonText }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View
        style={[styles.overlay, styles.keepOverlay, { opacity: keepOpacity }]}
      >
        <Text
          style={[
            styles.overlayText,
            { color: theme.keepColor, borderColor: theme.keepColor },
          ]}
        >
          KEEP
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.overlay,
          styles.discardOverlay,
          { opacity: discardOpacity },
        ]}
      >
        <Text
          style={[
            styles.overlayText,
            { color: theme.discardColor, borderColor: theme.discardColor },
          ]}
        >
          DISCARD
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flex: 1,
    backgroundColor: "#18181b",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  errorDetail: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  retryText: { fontSize: 13, fontWeight: "500" },
  overlay: {
    position: "absolute",
    top: 40,
    padding: 8,
  },
  keepOverlay: {
    left: 20,
    transform: [{ rotate: "-15deg" }],
  },
  discardOverlay: {
    right: 20,
    transform: [{ rotate: "15deg" }],
  },
  overlayText: {
    fontSize: 32,
    fontWeight: "900",
    borderWidth: 3,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    letterSpacing: 2,
  },
});
