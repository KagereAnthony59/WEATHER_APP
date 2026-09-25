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

const PRESET_TIMES = [
  { label: '6:30 AM', value: '06:30' },
  { label: '7:00 AM', value: '07:00' },
  { label: '7:30 AM', value: '07:30' },
  { label: '8:00 AM', value: '08:00' },
  { label: '8:30 AM', value: '08:30' },
  { label: '9:00 AM', value: '09:00' },
];

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

  // Convert "07:30" (24h) to { hour: 7, minute: 30, period: 'AM' }
  const parseTimeTo12h = (time24: string) => {
    const [hStr, mStr] = (time24 || '07:30').split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 7;
    let m = parseInt(mStr, 10);
    if (isNaN(m)) m = 30;
    
    const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour: hour12, minute: m, period };
  };

  // Convert { hour: 7, minute: 30, period: 'AM' } back to "07:30" string
  const format12hTo24 = (hour12: number, minute: number, period: 'AM' | 'PM') => {
    let h24 = hour12;
    if (period === 'AM') {
      if (h24 === 12) h24 = 0;
    } else {
      if (h24 < 12) h24 += 12;
    }
    const hStr = h24.toString().padStart(2, '0');
    const mStr = minute.toString().padStart(2, '0');
    return `${hStr}:${mStr}`;
  };

  const { hour, minute, period } = parseTimeTo12h(preferredTime);

  const changeHour = (delta: number) => {
    triggerSelection();
    let newHour = hour + delta;
    if (newHour > 12) newHour = 1;
    if (newHour < 1) newHour = 12;
    const newTime24 = format12hTo24(newHour, minute, period);
    setPreferredTime(newTime24);
    savePref('preferredTime', newTime24);
  };

  const changeMinute = (delta: number) => {
    triggerSelection();
    let newMin = minute + delta;
    if (newMin >= 60) newMin = 0;
    if (newMin < 0) newMin = 55;
    const newTime24 = format12hTo24(hour, newMin, period);
    setPreferredTime(newTime24);
    savePref('preferredTime', newTime24);
  };

  const togglePeriod = (newPeriod: 'AM' | 'PM') => {
    triggerSelection();
    if (newPeriod === period) return;
    const newTime24 = format12hTo24(hour, minute, newPeriod);
    setPreferredTime(newTime24);
    savePref('preferredTime', newTime24);
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
                    triggerSelection();
                    setMorningDigest(val);
                    savePref('morningDigest', val);
                  }}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>

              {/* Interactive Custom Time Adjuster */}
              {morningDigest && (
                <View style={[styles.timeSelectorContainer, { borderTopColor: t.borderColor }]}>
                  <View style={styles.timeHeaderRow}>
                    <Text style={[styles.timeLabel, { color: t.subtext }]}>Set Digest Delivery Time:</Text>
                    <View style={[styles.activeTimeBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                      <Ionicons name="alarm-outline" size={13} color="#38bdf8" style={{ marginRight: 4 }} />
                      <Text style={styles.activeTimeBadgeText}>
                        {hour}:{minute.toString().padStart(2, '0')} {period}
                      </Text>
                    </View>
                  </View>

                  {/* Fully Responsive Stepper & Segmented AM/PM Card */}
                  <View style={[styles.timePickerCard, { backgroundColor: t.searchBg, borderColor: t.borderColor }]}>
                    
                    {/* Top Row: Hour and Minute Steppers */}
                    <View style={styles.stepperMainRow}>
                      <View style={styles.stepperUnit}>
                        <Text style={[styles.unitSublabel, { color: t.subtext }]}>HOUR</Text>
                        <View style={styles.stepperRow}>
                          <TouchableOpacity
                            onPress={() => changeHour(-1)}
                            style={[styles.stepCircleBtn, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="remove" size={16} color={t.text} />
                          </TouchableOpacity>
                          <Text style={[styles.stepperNumber, { color: t.text }]}>
                            {hour.toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            onPress={() => changeHour(1)}
                            style={[styles.stepCircleBtn, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add" size={16} color={t.text} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <Text style={[styles.timeSeparatorColon, { color: t.text }]}>:</Text>

                      <View style={styles.stepperUnit}>
                        <Text style={[styles.unitSublabel, { color: t.subtext }]}>MINUTE</Text>
                        <View style={styles.stepperRow}>
                          <TouchableOpacity
                            onPress={() => changeMinute(-5)}
                            style={[styles.stepCircleBtn, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="remove" size={16} color={t.text} />
                          </TouchableOpacity>
                          <Text style={[styles.stepperNumber, { color: t.text }]}>
                            {minute.toString().padStart(2, '0')}
                          </Text>
                          <TouchableOpacity
                            onPress={() => changeMinute(5)}
                            style={[styles.stepCircleBtn, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="add" size={16} color={t.text} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Bottom Row: Full-Width AM / PM Segmented Control */}
                    <View style={[styles.periodSegmentedBar, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
                      <TouchableOpacity
                        onPress={() => togglePeriod('AM')}
                        style={[
                          styles.periodSegmentBtn,
                          period === 'AM' && { backgroundColor: '#38bdf8' },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="sunny-outline"
                          size={14}
                          color={period === 'AM' ? '#0f172a' : '#f59e0b'}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.periodSegmentText, { color: period === 'AM' ? '#0f172a' : t.text }]}>
                          AM (Morning)
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => togglePeriod('PM')}
                        style={[
                          styles.periodSegmentBtn,
                          period === 'PM' && { backgroundColor: '#38bdf8' },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="moon-outline"
                          size={14}
                          color={period === 'PM' ? '#0f172a' : '#818cf8'}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.periodSegmentText, { color: period === 'PM' ? '#0f172a' : t.text }]}>
                          PM (Evening)
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Quick Preset Chips */}
                  <Text style={[styles.presetsTitle, { color: t.subtext }]}>QUICK PRESETS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {PRESET_TIMES.map((preset) => {
                      const isSelected = preferredTime === preset.value;
                      return (
                        <TouchableOpacity
                          key={preset.value}
                          onPress={() => {
                            triggerSelection();
                            setPreferredTime(preset.value);
                            savePref('preferredTime', preset.value);
                          }}
                          style={[
                            styles.timeChip,
                            {
                              backgroundColor: isSelected ? '#38bdf8' : t.searchBg,
                              borderColor: isSelected ? '#38bdf8' : t.borderColor,
                            },
                          ]}
                        >
                          <Text style={[styles.timeChipText, { color: isSelected ? '#0f172a' : t.text }]}>
                            {preset.label}
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
                    triggerSelection();
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
                    triggerSelection();
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
    paddingVertical: 12,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeTimeBadgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  timePickerCard: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  stepperMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  stepperUnit: {
    alignItems: 'center',
  },
  unitSublabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperNumber: {
    fontSize: 22,
    fontWeight: '800',
    minWidth: 30,
    textAlign: 'center',
  },
  timeSeparatorColon: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
  },
  periodSegmentedBar: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  periodSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  periodSegmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  presetsTitle: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
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
    fontSize: 12,
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
