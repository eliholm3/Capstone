import React, { useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';

const THUMB_W = 52;
const THUMB_H = 70;
const CURRENT_W = 70;
const CURRENT_H = 92;

export default function BufferStrip({ bufferImages, theme }) {
  const scrollRef = useRef(null);

  // Auto-scroll to center the current item
  useEffect(() => {
    const currentIdx = bufferImages.findIndex(img => img.isCurrent);
    if (currentIdx !== -1 && scrollRef.current) {
      const offset = currentIdx * (THUMB_W + 6) - 100;
      scrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }
  }, [bufferImages]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {bufferImages.map((img) => {
          const isCurrent = img.isCurrent;
          const w = isCurrent ? CURRENT_W : THUMB_W;
          const h = isCurrent ? CURRENT_H : THUMB_H;

          let overlayColor = null;
          if (img.status === 'kept') overlayColor = theme.overlayKept;
          if (img.status === 'discarded') overlayColor = theme.overlayDiscarded;

          return (
            <View
              key={img.id ?? img.index}
              style={[
                styles.item,
                { width: w, height: h, borderRadius: theme.borderRadius / 2 },
                isCurrent && {
                  borderWidth: 2,
                  borderColor: theme.currentBorder,
                },
                !isCurrent && img.isPast && { opacity: 0.7 },
              ]}
            >
              <Image
                source={{ uri: img.url }}
                style={[styles.thumb, { borderRadius: theme.borderRadius / 2 }]}
                contentFit="cover"
              />
              {overlayColor && (
                <View
                  style={[
                    styles.overlay,
                    { backgroundColor: overlayColor, borderRadius: theme.borderRadius / 2 },
                  ]}
                />
              )}
              {isCurrent && (
                <Text style={[styles.indicator, { color: theme.currentBorder }]}>▼</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: CURRENT_H + 20,
    justifyContent: 'center',
  },
  track: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
    flexGrow: 1,
    justifyContent: 'center',
  },
  item: {
    overflow: 'visible',
    position: 'relative',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  indicator: {
    position: 'absolute',
    bottom: -16,
    alignSelf: 'center',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
