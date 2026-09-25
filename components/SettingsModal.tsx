import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerSelection } from '../utils/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  is24Hour: boolean;
  setIs24Hour: (val: boolean) => void;
  isFahrenheit: boolean;
  setIsFahrenheit: (val: boolean) => void;
  isMph: boolean;
  setIsMph: (val: boolean) => void;
  cityName: string;
  theme: any;
}

const SETTINGS_PREFS_KEY = '@weather_preferences_v2';

export const SettingsModal: React.FC<Props> = ({
  visible,
  onClose,
  isDarkMode,
  setIsDarkMode,
  is24Hour,
  setIs24Hour,
  isFahrenheit,
  setIsFahrenheit,
  isMph,
  setIsMph,
  cityName,
  theme: t,
}) => {
  const [morningDigest, setMorningDigest] = useState(true);
  const [rainAlerts, setRainAlerts] = useState(true);
  const [uvAlerts, setUvAlerts] = useState(true);
  const [preferredTime, setPreferredTime] = useState('07:30');

  const MORNING_TIMES = ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_PREFS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.morningDigest !== undefined) setMorningDigest(parsed.morningDigest);
          if (parsed.rainAlerts !== undefined) setRainAlerts(parsed.rainAlerts);
          if (parsed.uvAlerts !== undefined) setUvAlerts(parsed.uvAlerts);
          if (parsed.preferredTime) setPreferredTime(parsed.preferredTime);
        }
      } catch (e) {
        console.log('Error loading settings prefs', e);
      }
    })();
  }, []);

  const savePref = async (key: string, val: any) => {
    triggerSelection();
    try {
      const updated = {
        morningDigest: key === 'morningDigest' ? val : morningDigest,
        rainAlerts: key === 'rainAlerts' ? val : rainAlerts,
        uvAlerts: key === 'uvAlerts' ? val : uvAlerts,
        preferredTime: key === 'preferredTime' ? val : preferredTime,
      };
      await AsyncStorage.setItem(SETTINGS_PREFS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving setting pref', e);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: t.modalBg, borderColor: t.modalBorder }]}>
          
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: t.modalBorder }]}>
            <View style={styles.titleRow}>
              <View style={[styles.titleIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="settings" size={18} color="#38bdf8" />
              </View>
              <Text style={[styles.modalTitle, { color: t.text }]}>Settings & Preferences</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={t.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            
            {/* SECTION 1: SMART WEATHER INSIGHTS & BRIEFINGS */}
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={16} color="#38bdf8" />
              <Text style={[styles.sectionHeaderText, { color: '#38bdf8' }]}>DAILY BRIEFINGS & ALERTS</Text>
            </View>

            {/* Morning Digest */}
            <View style={[styles.settingCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <View style={styles.labelRow}>
                    <Ionicons name="sunny-outline" size={18} color="#f59e0b" style={{ marginRight: 6 }} />
                    <Text style={[styles.settingText, { color: t.text }]}>Morning Weather Narrative</Text>
                  </View>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    Displays AI contextual morning briefings with attire & temperature advice.
                  </Text>
                </View>
                <Switch
                  value={morningDigest}
                  onValueChange={(val) => {
                    setMorningDigest(val);
                    savePref('morningDigest', val);
                  }}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>

              {/* Preferred Time Selector */}
              {morningDigest && (
                <View style={[styles.timeSelectorContainer, { borderTopColor: t.borderColor }]}>
                  <Text style={[styles.timeLabel, { color: t.subtext }]}>Preferred Digest Time:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {MORNING_TIMES.map((time) => {
                      const isSelected = preferredTime === time;
                      return (
                        <TouchableOpacity
                          key={time}
                          onPress={() => {
                            setPreferredTime(time);
                            savePref('preferredTime', time);
                          }}
                          style={[
                            styles.timeChip,
                            { backgroundColor: isSelected ? '#38bdf8' : t.searchBg, borderColor: isSelected ? '#38bdf8' : t.borderColor },
                          ]}
                        >
                          <Text style={[styles.timeChipText, { color: isSelected ? '#0f172a' : t.text }]}>
                            {time}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Rain Warning */}
            <View style={[styles.settingCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <View style={styles.labelRow}>
                    <Ionicons name="rainy-outline" size={18} color="#60a5fa" style={{ marginRight: 6 }} />
                    <Text style={[styles.settingText, { color: t.text }]}>Rain & Commute Warning</Text>
                  </View>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    Highlights severe roadway caution and slickness alerts before heavy downpours.
                  </Text>
                </View>
                <Switch
                  value={rainAlerts}
                  onValueChange={(val) => {
                    setRainAlerts(val);
                    savePref('rainAlerts', val);
                  }}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>
            </View>

            {/* UV Alert */}
            <View style={[styles.settingCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <View style={styles.labelRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#ec4899" style={{ marginRight: 6 }} />
                    <Text style={[styles.settingText, { color: t.text }]}>Extreme UV Sun Protection</Text>
                  </View>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    Highlights peak UV Index warnings (8+) with safe exposure time guidance.
                  </Text>
                </View>
                <Switch
                  value={uvAlerts}
                  onValueChange={(val) => {
                    setUvAlerts(val);
                    savePref('uvAlerts', val);
                  }}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>
            </View>


            {/* SECTION 2: APPEARANCE & THEME */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Ionicons name="color-palette-outline" size={16} color="#a855f7" />
              <Text style={[styles.sectionHeaderText, { color: '#a855f7' }]}>APPEARANCE & DISPLAY</Text>
            </View>

            <View style={[styles.settingCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingText, { color: t.text }]}>App Theme</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    {isDarkMode ? 'Dark Glassmorphism' : 'Light Sky Clean'}
                  </Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={(val) => { triggerSelection(); setIsDarkMode(val); }}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>

              <View style={[styles.settingRow, { borderTopColor: t.borderColor, borderTopWidth: 1 }]}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingText, { color: t.text }]}>Time Format</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    {is24Hour ? '24-Hour (14:30)' : '12-Hour (2:30 PM)'}
                  </Text>
                </View>
                <Switch
                  value={is24Hour}
                  onValueChange={(val) => { triggerSelection(); setIs24Hour(val); }}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>
            </View>


            {/* SECTION 3: MEASUREMENT UNITS */}
            <View style={[styles.sectionHeader, { marginTop: 20 }]}>
              <Ionicons name="speedometer-outline" size={16} color="#10b981" />
              <Text style={[styles.sectionHeaderText, { color: '#10b981' }]}>UNITS OF MEASUREMENT</Text>
            </View>

            <View style={[styles.settingCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingText, { color: t.text }]}>Temperature Unit</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    {isFahrenheit ? 'Fahrenheit (°F)' : 'Celsius (°C)'}
                  </Text>
                </View>
                <Switch
                  value={isFahrenheit}
                  onValueChange={(val) => { triggerSelection(); setIsFahrenheit(val); }}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>

              <View style={[styles.settingRow, { borderTopColor: t.borderColor, borderTopWidth: 1 }]}>
                <View style={styles.settingTextCol}>
                  <Text style={[styles.settingText, { color: t.text }]}>Wind Speed Unit</Text>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    {isMph ? 'Miles per hour (mph)' : 'Kilometers per hour (km/h)'}
                  </Text>
                </View>
                <Switch
                  value={isMph}
                  onValueChange={(val) => { triggerSelection(); setIsMph(val); }}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>
            </View>


            {/* SECTION 4: APP STATUS & TELEMETRY */}
            <View style={[styles.statusCard, { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: t.borderColor }]}>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: t.subtext }]}>App Version</Text>
                <Text style={[styles.statusValue, { color: t.text }]}>v1.0.0 (Production)</Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: t.subtext }]}>OTA Delivery</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.liveDot} />
                  <Text style={[styles.statusValue, { color: '#38bdf8' }]}>Active (GitHub Actions)</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: t.subtext }]}>Active Location</Text>
                <Text style={[styles.statusValue, { color: t.text }]} numberOfLines={1}>{cityName || 'Detecting...'}</Text>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '88%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeButton: {
    padding: 4,
  },
  scrollArea: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  settingCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingTextCol: {
    flex: 1,
    marginRight: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  timeSelectorContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeScroll: {
    flexDirection: 'row',
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusCard: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#38bdf8',
  },
});
