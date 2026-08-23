import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { triggerImpactLight, triggerSelection } from '../utils/haptics';

interface Props {
  weatherCode?: number;
  isDay?: number;
  theme: any;
}

interface SoundscapeTrack {
  id: string;
  name: string;
  icon: string;
  uri: string;
}

const SOUNDSCAPES: SoundscapeTrack[] = [
  {
    id: 'rain',
    name: 'Gentle Rain & Drops',
    icon: 'rainy',
    uri: 'https://assets.mixkit.co/active_storage/sfx/2520/2520-preview.mp3', // gentle rain
  },
  {
    id: 'thunder',
    name: 'Distant Thunder & Storm',
    icon: 'thunderstorm',
    uri: 'https://assets.mixkit.co/active_storage/sfx/1273/1273-preview.mp3', // storm ambience
  },
  {
    id: 'nature',
    name: 'Sunny Forest & Birds',
    icon: 'sunny',
    uri: 'https://assets.mixkit.co/active_storage/sfx/2437/2437-preview.mp3', // summer forest birds
  },
  {
    id: 'night',
    name: 'Night Crickets & Breeze',
    icon: 'moon',
    uri: 'https://assets.mixkit.co/active_storage/sfx/2439/2439-preview.mp3', // night crickets
  },
  {
    id: 'wind',
    name: 'Alpine Winter Breeze',
    icon: 'snow',
    uri: 'https://assets.mixkit.co/active_storage/sfx/2438/2438-preview.mp3', // wind breeze
  },
];

export const SoundscapePlayer: React.FC<Props> = ({ weatherCode = 0, isDay = 1, theme }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackId, setActiveTrackId] = useState<string>('nature');
  const [modalVisible, setModalVisible] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  // Determine ideal track based on weather
  const getIdealTrackId = (code: number, day: number) => {
    if (code >= 95) return 'thunder';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'wind';
    if (!day) return 'night';
    return 'nature';
  };

  useEffect(() => {
    const recommended = getIdealTrackId(weatherCode, isDay);
    setActiveTrackId(recommended);
  }, [weatherCode, isDay]);

  const stopAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        // Ignore
      }
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudioTrack = async (trackId: string, customVol = volume) => {
    try {
      await stopAudio();
      const track = SOUNDSCAPES.find(t => t.id === trackId) || SOUNDSCAPES[0];
      
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: true, isLooping: true, volume: customVol }
      );
      
      soundRef.current = sound;
      setActiveTrackId(trackId);
      setIsPlaying(true);
    } catch (e) {
      console.warn('Audio playback error', e);
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    triggerImpactLight();
    if (isPlaying) {
      await stopAudio();
    } else {
      await playAudioTrack(activeTrackId);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const activeTrack = SOUNDSCAPES.find(t => t.id === activeTrackId) || SOUNDSCAPES[0];

  return (
    <>
      <TouchableOpacity 
        style={[styles.floatingPill, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }, theme.shadow]}
        onPress={togglePlay}
        onLongPress={() => {
          triggerSelection();
          setModalVisible(true);
        }}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Ionicons 
            name={isPlaying ? "volume-high" : "volume-mute-outline"} 
            size={18} 
            color={isPlaying ? "#38bdf8" : theme.subtext} 
          />
        </Animated.View>
        <Text style={[styles.pillText, { color: isPlaying ? theme.text : theme.subtext }]}>
          {isPlaying ? activeTrack.name.split(' ')[0] : 'Sound'}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBg, borderColor: theme.modalBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="musical-notes" size={24} color="#38bdf8" />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Ambient Weather Sounds</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
              Immerse yourself in relaxing natural audio tailored to real-time atmospheric conditions.
            </Text>

            <View style={styles.tracksList}>
              {SOUNDSCAPES.map(track => {
                const isSelected = activeTrackId === track.id;
                return (
                  <TouchableOpacity
                    key={track.id}
                    style={[
                      styles.trackItem,
                      { backgroundColor: theme.cardBg, borderColor: isSelected && isPlaying ? '#38bdf8' : theme.borderColor },
                      isSelected && isPlaying && { borderWidth: 1.5 }
                    ]}
                    onPress={() => {
                      triggerSelection();
                      playAudioTrack(track.id);
                    }}
                  >
                    <View style={styles.trackInfo}>
                      <View style={[styles.trackIconWrap, { backgroundColor: isSelected && isPlaying ? 'rgba(56, 189, 248, 0.2)' : theme.pillBg }]}>
                        <Ionicons name={track.icon as any} size={22} color={isSelected && isPlaying ? '#38bdf8' : theme.text} />
                      </View>
                      <Text style={[styles.trackName, { color: theme.text, fontWeight: isSelected ? '700' : '500' }]}>
                        {track.name}
                      </Text>
                    </View>
                    <Ionicons 
                      name={isSelected && isPlaying ? "pause-circle" : "play-circle-outline"} 
                      size={28} 
                      color={isSelected && isPlaying ? "#38bdf8" : theme.subtext} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {isPlaying && (
              <TouchableOpacity 
                style={[styles.stopBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                onPress={() => {
                  triggerImpactLight();
                  stopAudio();
                }}
              >
                <Ionicons name="stop" size={18} color="#ef4444" />
                <Text style={styles.stopBtnText}>Mute Soundscape</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  closeBtn: {
    padding: 4,
  },
  tracksList: {
    gap: 12,
    marginBottom: 20,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  trackInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trackIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackName: {
    fontSize: 15,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  stopBtnText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
