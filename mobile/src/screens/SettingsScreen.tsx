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
import { useAuth, useSettings } from '../hooks';
import { signOut } from '../services/firebase';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

export function SettingsScreen() {
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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Settings</Text>

            {/* Profile Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <View style={styles.card}>
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

            {/* Preferences Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                <View style={styles.card}>
                    {/* Start of Week */}
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Start of week</Text>
                        <View style={styles.segmentControl}>
                            <TouchableOpacity
                                style={[
                                    styles.segment,
                                    settings.startOfWeek === 'sunday' && styles.segmentActive,
                                ]}
                                onPress={() => updateSettings({ startOfWeek: 'sunday' })}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        settings.startOfWeek === 'sunday' && styles.segmentTextActive,
                                    ]}
                                >
                                    Sun
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.segment,
                                    settings.startOfWeek === 'monday' && styles.segmentActive,
                                ]}
                                onPress={() => updateSettings({ startOfWeek: 'monday' })}
                            >
                                <Text
                                    style={[
                                        styles.segmentText,
                                        settings.startOfWeek === 'monday' && styles.segmentTextActive,
                                    ]}
                                >
                                    Mon
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Default Mode */}
                    <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>Default mode</Text>
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
                                    Personal
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
                        <Text style={styles.settingLabel}>Push notifications</Text>
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
                        <Text style={styles.settingLabel}>Task completion</Text>
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
                        <Text style={styles.settingLabel}>Notification sound</Text>
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
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.lg },
    section: { marginBottom: spacing.lg },
    sectionTitle: {
        ...typography.bodySmall,
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
        ...shadows.sm,
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
    avatarText: { ...typography.h2, color: colors.textInverse },
    profileInfo: { flex: 1 },
    profileName: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
    profileEmail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    settingLabel: { ...typography.body, color: colors.textPrimary },
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
    segmentActive: { backgroundColor: colors.surface },
    segmentText: { ...typography.bodySmall, color: colors.textSecondary },
    segmentTextActive: { color: colors.textPrimary, fontWeight: '600' },
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
        ...shadows.sm,
    },
    signOutText: { ...typography.body, color: colors.error, fontWeight: '600' },
    version: {
        ...typography.caption,
        color: colors.textTertiary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
});
