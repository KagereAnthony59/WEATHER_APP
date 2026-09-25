import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { triggerSelection, triggerSuccess, triggerImpactMedium } from '../utils/haptics';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  sendTestWeatherNotification,
  requestNotificationPermissions,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../utils/notifications';

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
  weatherData: any;
  theme: any;
}

const MORNING_TIMES = ['06:30', '07:00', '07:30', '08:00', '08:30', '09:00'];

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
  weatherData,
  theme: t,
}) => {
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [testSending, setTestSending] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotificationSettings().then(setNotifSettings);
    }
  }, [visible]);

  const updateNotifSetting = async (key: keyof NotificationSettings, value: any) => {
    triggerSelection();
    
    // Check permission if turning on
    if (value === true && typeof value === 'boolean') {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive weather alerts.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);
    await saveNotificationSettings(updated, cityName, weatherData);
  };

  const handleSendTestNotification = async () => {
    triggerImpactMedium();
    setTestSending(true);
    const success = await sendTestWeatherNotification(
      cityName || 'Current Location',
      weatherData?.temperature ?? 24
    );
    setTestSending(false);

    if (success) {
      triggerSuccess();
      Alert.alert('Notification Sent! 🔔', 'Check your notification bar to see the weather alert.');
    } else {
      Alert.alert('Permission Denied', 'Please allow notifications for K & A Weather in device settings.');
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
            
            {/* SECTION 1: SMART NOTIFICATIONS & WEATHER ALERTS */}
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={16} color="#38bdf8" />
              <Text style={[styles.sectionHeaderText, { color: '#38bdf8' }]}>SMART NOTIFICATIONS & ALERTS</Text>
            </View>

            {/* Morning Briefing */}
            <View style={[styles.settingCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <View style={styles.labelRow}>
                    <Ionicons name="sunny-outline" size={18} color="#f59e0b" style={{ marginRight: 6 }} />
                    <Text style={[styles.settingText, { color: t.text }]}>Morning Weather Briefing</Text>
                  </View>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    Receive a daily digest with predicted high/lows and outfit tips.
                  </Text>
                </View>
                <Switch
                  value={notifSettings.morningBriefing}
                  onValueChange={(val) => updateNotifSetting('morningBriefing', val)}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>

              {/* Delivery Time Selector */}
              {notifSettings.morningBriefing && (
                <View style={[styles.timeSelectorContainer, { borderTopColor: t.borderColor }]}>
                  <Text style={[styles.timeLabel, { color: t.subtext }]}>Delivery Time:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                    {MORNING_TIMES.map((time) => {
                      const isSelected = notifSettings.morningTime === time;
                      return (
                        <TouchableOpacity
                          key={time}
                          onPress={() => updateNotifSetting('morningTime', time)}
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

            {/* Rain & Severe Weather Alert */}
            <View style={[styles.settingCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <View style={styles.labelRow}>
                    <Ionicons name="rainy-outline" size={18} color="#60a5fa" style={{ marginRight: 6 }} />
                    <Text style={[styles.settingText, { color: t.text }]}>Rain & Commute Warning</Text>
                  </View>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    Alerts you when rain probability exceeds 60% in upcoming hours.
                  </Text>
                </View>
                <Switch
                  value={notifSettings.rainAlert}
                  onValueChange={(val) => updateNotifSetting('rainAlert', val)}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>
            </View>

            {/* Extreme UV Protection Alert */}
            <View style={[styles.settingCard, { backgroundColor: t.cardBg, borderColor: t.borderColor }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingTextCol}>
                  <View style={styles.labelRow}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#ec4899" style={{ marginRight: 6 }} />
                    <Text style={[styles.settingText, { color: t.text }]}>Extreme UV Alert</Text>
                  </View>
                  <Text style={[styles.settingSubtext, { color: t.subtext }]}>
                    Warns when UV Index reaches 8+ to protect skin during midday.
                  </Text>
                </View>
                <Switch
                  value={notifSettings.uvAlert}
                  onValueChange={(val) => updateNotifSetting('uvAlert', val)}
                  trackColor={{ true: '#38bdf8', false: '#64748b' }}
                />
              </View>
            </View>

            {/* Test Notification Button */}
            <TouchableOpacity
              onPress={handleSendTestNotification}
              disabled={testSending}
              style={[styles.testButton, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.4)' }]}
            >
              <Ionicons name="paper-plane-outline" size={16} color="#38bdf8" />
              <Text style={styles.testButtonText}>
                {testSending ? 'Sending Sample Alert...' : 'Send Test Weather Notification'}
              </Text>
            </TouchableOpacity>


            {/* SECTION 2: APPEARANCE & THEME */}
            <View style={[styles.sectionHeader, { marginTop: 22 }]}>
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
            <View style={[styles.sectionHeader, { marginTop: 22 }]}>
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
                <Text style={[styles.statusLabel, { color: t.subtext }]}>OTA Channel</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.liveDot} />
                  <Text style={[styles.statusValue, { color: '#38bdf8' }]}>production</Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: t.subtext }]}>PostHog Telemetry</Text>
                <Text style={[styles.statusValue, { color: '#4ade80' }]}>Connected (EU Cloud)</Text>
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 4,
  },
  testButtonText: {
    color: '#38bdf8',
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
