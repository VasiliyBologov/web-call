import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Room } from '../Room';
import React from 'react';

// Mock config
vi.mock('../../config', () => ({
  ICE_SERVERS: [],
  wsUrl: 'ws://localhost',
  ICE_TRANSPORT_POLICY: 'all',
  api: (path: string) => path,
}));

// Mock MUI icons to avoid rendering issues in jsdom
vi.mock('@mui/icons-material/ContentCopy', () => ({ default: () => <div data-testid="ContentCopyIcon" /> }));
vi.mock('@mui/icons-material/CallEnd', () => ({ default: () => <div data-testid="CallEndIcon" /> }));
vi.mock('@mui/icons-material/Mic', () => ({ default: () => <div data-testid="MicIcon" /> }));
vi.mock('@mui/icons-material/MicOff', () => ({ default: () => <div data-testid="MicOffIcon" /> }));
vi.mock('@mui/icons-material/Videocam', () => ({ default: () => <div data-testid="VideocamIcon" /> }));
vi.mock('@mui/icons-material/VideocamOff', () => ({ default: () => <div data-testid="VideocamOffIcon" /> }));
vi.mock('@mui/icons-material/Cameraswitch', () => ({ default: () => <div data-testid="CameraswitchIcon" /> }));
vi.mock('@mui/icons-material/Settings', () => ({ default: () => <div data-testid="SettingsIcon" /> }));

describe('Room Media Logic', () => {
  let mockStream: any;
  let mockTrack: any;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockTrack = {
      enabled: true,
      kind: 'video',
      stop: vi.fn(),
      getSettings: () => ({ deviceId: 'test-device' }),
    };

    const mockAudioTrack = {
      enabled: true,
      kind: 'audio',
      stop: vi.fn(),
      getSettings: () => ({ deviceId: 'audio-device' }),
    };

    mockStream = {
      getTracks: () => [mockTrack, mockAudioTrack],
      getAudioTracks: () => [mockAudioTrack],
      getVideoTracks: () => [mockTrack],
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    };

    // Mock navigator.mediaDevices
    Object.defineProperty(window.navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'videoinput', deviceId: 'v1', label: 'Cam 1' },
          { kind: 'audioinput', deviceId: 'a1', label: 'Mic 1' }
        ]),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }
    });

    // Mock RTCPeerConnection
    vi.stubGlobal('RTCPeerConnection', vi.fn().mockImplementation(function() {
      return {
        addTrack: vi.fn(),
        getSenders: vi.fn(() => []),
        getReceivers: vi.fn(() => []),
        close: vi.fn(),
        createOffer: vi.fn().mockResolvedValue({}),
        setLocalDescription: vi.fn().mockResolvedValue({}),
        setRemoteDescription: vi.fn().mockResolvedValue({}),
        addIceCandidate: vi.fn().mockResolvedValue({}),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        createDataChannel: vi.fn(() => ({
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      };
    }));

    // Mock WebSocket
    vi.stubGlobal('WebSocket', vi.fn().mockImplementation(function() {
      return {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: 1, // OPEN
      };
    }));
  });

  it('should not disable tracks on blur by default', async () => {
    await act(async () => {
      render(<Room token="test-token" />);
    });

    // Mock focus/blur
    Object.defineProperty(document, 'hasFocus', { value: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

    // Trigger events
    fireEvent(window, new Event('blur'));
    fireEvent(document, new Event('visibilitychange'));

    // Track should still be enabled because autoMuteOnBlur is false by default
    expect(mockTrack.enabled).toBe(true);
  });

  it('should disable tracks on blur when autoMuteOnBlur is enabled', async () => {
    // Enable autoMuteOnBlur via localStorage before render
    localStorage.setItem('autoMuteOnBlur', 'true');

    await act(async () => {
      render(<Room token="test-token" />);
    });

    // Mock focus/blur
    Object.defineProperty(document, 'hasFocus', { value: () => false, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });

    // Trigger events
    await act(async () => {
      fireEvent(window, new Event('blur'));
      fireEvent(document, new Event('visibilitychange'));
    });

    // Track should be disabled
    expect(mockTrack.enabled).toBe(false);
  });
});
