import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SwipeScreen from '../app/screens/SwipeScreen';

// ─── Context mocks ────────────────────────────────────────────────────────────

const mockActiveDataset = {
  dataset_id: 1,
  name: 'Test Dataset',
  approved_count: 0,
  rejected_count: 0,
};

jest.mock('../app/context/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token' }),
}));

jest.mock('../app/context/DatasetContext', () => ({
  useDatasets: () => ({ activeDataset: mockActiveDataset }),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../app/config', () => ({
  API_BASE_URL: 'http://test-server',
}));

jest.mock('../app/theme', () => ({
  themes: {
    default: {
      bg: '#fff',
      mutedText: '#888',
      border: '#ccc',
      buttonBg: '#eee',
      buttonBorder: '#ccc',
      buttonText: '#333',
    },
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: ({ children, ...props }) => <View {...props}>{children}</View> };
});

// SwipeCard exposes two buttons so tests can trigger handleSwipe without gestures.
jest.mock('../app/components/SwipeCard', () => {
  const { View, TouchableOpacity, Text } = require('react-native');
  return function MockSwipeCard({ image, onSwipe }) {
    return (
      <View>
        <TouchableOpacity testID="swipe-right" onPress={() => onSwipe(image.image_id, 'right')}>
          <Text>Swipe Right</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="swipe-left" onPress={() => onSwipe(image.image_id, 'left')}>
          <Text>Swipe Left</Text>
        </TouchableOpacity>
      </View>
    );
  };
});

jest.mock('../app/components/BufferStrip', () => () => null);

// StatsBar renders inBuffer so the deduplication test can read the final buffer count.
jest.mock('../app/components/StatsBar', () => {
  const { Text } = require('react-native');
  return function MockStatsBar({ inBuffer }) {
    return <Text testID="in-buffer">{String(inBuffer)}</Text>;
  };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Build N sequential mock images with image_id 1..n
const makeImages = (n) =>
  Array.from({ length: n }, (_, i) => ({
    image_id: i + 1,
    url: `https://example.com/${i + 1}.jpg`,
    title: `Image ${i + 1}`,
  }));

// 7 images: remaining (7) > FETCH_TRIGGER_THRESHOLD (5) even after one swipe (remaining 6).
// This prevents doFetch from firing during handleSwipe / handleUndo tests.
const SEVEN_IMAGES = makeImages(7);

// 6 images: one swipe drops remaining to exactly 5, triggering doFetch.
const SIX_IMAGES = makeImages(6);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SwipeScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.clearAllMocks();
  });

  // ── handleSwipe() ────────────────────────────────────────────────────────────

  describe('handleSwipe()', () => {
    it('right swipe sends PATCH with status approved', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => SEVEN_IMAGES })
        .mockResolvedValueOnce({ ok: true });

      const { getByTestId } = render(<SwipeScreen />);

      await waitFor(() => getByTestId('swipe-right'));

      await act(async () => {
        fireEvent.press(getByTestId('swipe-right'));
      });

      const patchCall = global.fetch.mock.calls.find(
        ([, opts]) => opts?.method === 'PATCH',
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall[1].body)).toEqual({ status: 'approved' });
    });

    it('left swipe sends PATCH with status rejected', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => SEVEN_IMAGES })
        .mockResolvedValueOnce({ ok: true });

      const { getByTestId } = render(<SwipeScreen />);

      await waitFor(() => getByTestId('swipe-left'));

      await act(async () => {
        fireEvent.press(getByTestId('swipe-left'));
      });

      const patchCall = global.fetch.mock.calls.find(
        ([, opts]) => opts?.method === 'PATCH',
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall[1].body)).toEqual({ status: 'rejected' });
    });
  });

  // ── fetchImages() ─────────────────────────────────────────────────────────────

  describe('fetchImages()', () => {
    it('fetches pending images with cursor starting at 0', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => SEVEN_IMAGES });

      render(<SwipeScreen />);

      await waitFor(() => {
        const urls = global.fetch.mock.calls.map(([url]) => url);
        expect(urls.some((url) => url.includes('after=0'))).toBe(true);
      });
    });

    it('sends Authorization header with the Bearer token', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => SEVEN_IMAGES });

      render(<SwipeScreen />);

      await waitFor(() => expect(global.fetch).toHaveBeenCalled());

      const [, opts] = global.fetch.mock.calls[0];
      expect(opts.headers.Authorization).toBe('Bearer test-token');
    });
  });

  // ── doFetch() ────────────────────────────────────────────────────────────────

  describe('doFetch()', () => {
    it('deduplicates images by image_id before appending', async () => {
      // img6 is a duplicate; img7 is new — only img7 should be appended.
      const dupAndNew = [
        { image_id: 6, url: 'https://example.com/6.jpg', title: 'Image 6' },
        { image_id: 7, url: 'https://example.com/7.jpg', title: 'Image 7' },
      ];

      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => SIX_IMAGES })
        .mockResolvedValueOnce({ ok: true })                                  // PATCH
        .mockResolvedValueOnce({ ok: true, json: async () => dupAndNew });    // doFetch

      const { getByTestId } = render(<SwipeScreen />);

      // Wait for images to load, then swipe (drops remaining to 5, triggers doFetch).
      await waitFor(() => getByTestId('swipe-right'));
      await act(async () => {
        fireEvent.press(getByTestId('swipe-right'));
      });

      // After dedup: images = 6 original + 1 unique new = 7.  currentIndex = 1.
      // inBuffer = 7 - 1 = 6.  Without dedup it would be 8 - 1 = 7.
      await waitFor(() => {
        expect(getByTestId('in-buffer').props.children).toBe('6');
      });
    });
  });

  // ── handleUndo() ─────────────────────────────────────────────────────────────

  describe('handleUndo()', () => {
    it('decrements currentIndex after a swipe', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: true, json: async () => SEVEN_IMAGES })
        .mockResolvedValueOnce({ ok: true });

      const { getByText } = render(<SwipeScreen />);

      // Undo starts disabled (currentIndex === 0).
      await waitFor(() => expect(getByText('Undo')).toBeDisabled());

      // Swipe to increment currentIndex to 1.
      await act(async () => {
        fireEvent.press(getByText('Swipe Right'));
      });

      // PATCH resolved → currentIndex is now 1 → Undo enabled.
      await waitFor(() => expect(getByText('Undo')).not.toBeDisabled());

      // Undo should decrement back to 0 → button disabled again.
      await act(async () => {
        fireEvent.press(getByText('Undo'));
      });

      expect(getByText('Undo')).toBeDisabled();
    });

    it('returns early without changing state when currentIndex is 0', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => SEVEN_IMAGES });

      const { getByText } = render(<SwipeScreen />);

      await waitFor(() => expect(getByText('Undo')).toBeDisabled());

      // Pressing the disabled Undo button at index 0 should be a no-op.
      fireEvent.press(getByText('Undo'));

      // State unchanged — button is still disabled.
      expect(getByText('Undo')).toBeDisabled();
    });
  });
});
