import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Switch,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useSettings } from '../hooks';
import { signOut } from '../services/firebase';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { DEFAULT_LABELS } from '../types';

export function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { settings, updateSettings } = useSettings();

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]
        );
    };

    return (
        <ScrollView
            style={[styles.container, { paddingTop: insets.top }]}
            contentContainerStyle={styles.content}
        >
            <Text style={styles.title}>Settings</Text>

            {/* Profile Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <View style={styles.card}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user?.displayName || 'User'}</Text>
                            <Text style={styles.profileEmail}>{user?.email}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Labels Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Labels</Text>
                <View style={[styles.card, styles.labelsCard]}>
                    <ScrollView style={styles.labelsList} nestedScrollEnabled>
                        {DEFAULT_LABELS.filter(l => l.id !== 'none').map((label) => (
                            <View key={label.id} style={styles.labelRow}>
                                <View style={[styles.labelDot, { backgroundColor: label.color }]} />
                                <Text style={styles.labelName}>{label.name}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.addLabelButton}>
                        <Text style={styles.addLabelText}>+ Add Custom Label</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Preferences Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    {/* Start of Week */}
                    <View style={styles.settingRow}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.settingLabel}>Start of week</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroller}>
                            {(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const).map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayChip,
                                        settings.startOfWeek === day && styles.dayChipActive,
                                    ]}
                                    onPress={() => updateSettings({ startOfWeek: day })}
                                >
                                    <Text
                                        style={[
                                            styles.dayText,
                                            settings.startOfWeek === day && styles.dayTextActive,
                                        ]}
                                    >
                                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.divider} />

                    {/* Default Mode */}
                    <View style={styles.settingRow}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.settingLabel}>Default mode</Text>
                        </View>
                        <View style={styles.segmentControl}>
                            <TouchableOpacity
                                style={[
                                    styles.segment,
                                    settings.defaultMode === 'personal' && styles.segmentActive,
                                ]}
                                onPress={() => updateSettings({ defaultMode: 'personal' })}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        settings.defaultMode === 'personal' && styles.segmentTextActive,
                                    ]}
                                >
                                    Home
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.segment,
                                    settings.defaultMode === 'professional' && styles.segmentActive,
                                ]}
                                onPress={() => updateSettings({ defaultMode: 'professional' })}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        settings.defaultMode === 'professional' && styles.segmentTextActive,
                                    ]}
                                >
                                    Work
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notifications</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.settingLabel}>Push notifications</Text>
                        </View>
                        <Switch
                            value={settings.notifications.enabled}
                            onValueChange={(enabled) =>
                                updateSettings({ notifications: { ...settings.notifications, enabled } })
                            }
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={settings.notifications.enabled ? colors.primary : colors.textTertiary}
                        />
                    </View>
                </View>
            </View>

            {/* Sound Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sound</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.settingLabel}>Task completion</Text>
                        </View>
                        <Switch
                            value={settings.sound.taskComplete}
                            onValueChange={(taskComplete) =>
                                updateSettings({ sound: { ...settings.sound, taskComplete } })
                            }
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={settings.sound.taskComplete ? colors.primary : colors.textTertiary}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.settingLabel}>Notification sound</Text>
                        </View>
                        <Switch
                            value={settings.sound.notifications}
                            onValueChange={(notifications) =>
                                updateSettings({ sound: { ...settings.sound, notifications } })
                            }
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={settings.sound.notifications ? colors.primary : colors.textTertiary}
                        />
                    </View>
                </View>
            </View>

            {/* Sign Out */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            {/* Version */}
            <Text style={styles.version}>TaskPlanner v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    title: {
        fontSize: fontSizes.h1,
        fontWeight: '700' as const,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarText: {
        fontSize: fontSizes.h2,
        fontWeight: '600' as const,
        color: colors.textInverse,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: fontSizes.body,
        color: colors.textPrimary,
        fontWeight: '600' as const,
    },
    profileEmail: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
        marginTop: 2,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    labelDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: spacing.md,
    },
    labelName: {
        fontSize: fontSizes.body,
        color: colors.textPrimary,
    },
    addLabelButton: {
        paddingVertical: spacing.sm,
        marginTop: spacing.xs,
    },
    addLabelText: {
        fontSize: fontSizes.body,
        color: colors.primary,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    labelContainer: {
        width: 140,
        marginRight: spacing.md,
    },
    settingLabel: {
        fontSize: fontSizes.body,
        color: colors.textPrimary,
    },
    segmentControl: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.sm,
        padding: 2,
    },
    segment: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    segmentActive: {
        backgroundColor: colors.surface,
    },
    segmentText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    segmentTextActive: {
        color: colors.textPrimary,
        fontWeight: '600' as const,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    signOutButton: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    signOutText: {
        fontSize: fontSizes.body,
        color: colors.error,
        fontWeight: '600' as const,
    },
    version: {
        fontSize: fontSizes.caption,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    settingRowVertical: {
        paddingVertical: spacing.xs,
    },
    dayScroller: {
        marginTop: spacing.sm,
    },
    dayChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceSecondary,
        marginRight: spacing.sm,
    },
    dayChipActive: {
        backgroundColor: colors.primary,
    },
    dayText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    dayTextActive: {
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    labelsCard: {
        maxHeight: 250,
    },
    labelsList: {
        marginBottom: spacing.xs,
    },
});
