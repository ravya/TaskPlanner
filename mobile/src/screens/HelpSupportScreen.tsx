import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';

export function HelpSupportScreen() {
    const insets = useSafeAreaInsets();

    const sections = [
        {
            title: 'Common Questions',
            items: [
                {
                    question: 'How do I create a task?',
                    answer: 'Tap the "+ Add" button on the Today screen or any task list.',
                },
                {
                    question: 'How do I manage projects?',
                    answer: 'Open the sidebar menu and select "Projects" or tap the "+" icon next to Projects in the sidebar.',
                },
                {
                    question: 'What is Home/Work mode?',
                    answer: 'You can separate your personal and professional tasks by switching between Home and Work modes in the top filter.',
                },
            ],
        },
        {
            title: 'Contact Us',
            items: [
                {
                    label: 'Email Support',
                    value: 'support@taskplanner.com',
                    action: () => Linking.openURL('mailto:support@taskplanner.com'),
                    icon: 'mail-outline',
                },
                {
                    label: 'Visit Website',
                    value: 'www.taskplanner.com',
                    action: () => Linking.openURL('https://www.taskplanner.com'),
                    icon: 'globe-outline',
                },
            ],
        },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Help & Support</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {sections.map((section, idx) => (
                    <View key={idx} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.card}>
                            {section.items.map((item, iIdx) => (
                                <View key={iIdx}>
                                    {iIdx > 0 && <View style={styles.divider} />}
                                    {'question' in item ? (
                                        <View style={styles.faqItem}>
                                            <Text style={styles.question}>{item.question}</Text>
                                            <Text style={styles.answer}>{item.answer}</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.contactItem}
                                            onPress={item.action}
                                        >
                                            <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                                            <View style={styles.contactInfo}>
                                                <Text style={styles.contactLabel}>{item.label}</Text>
                                                <Text style={styles.contactValue}>{item.value}</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                <View style={styles.footer}>
                    <Text style={styles.version}>TaskPlanner v1.0.0</Text>
                    <Text style={styles.copyright}>© 2026 TaskPlanner Team</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.md,
    },
    title: {
        fontSize: fontSizes.h1,
        fontWeight: '700' as const,
        color: colors.textPrimary,
    },
    content: {
        padding: spacing.lg,
    },
    section: {
        marginBottom: spacing.xl,
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
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderLight,
    },
    faqItem: {
        padding: spacing.md,
    },
    question: {
        fontSize: fontSizes.body,
        fontWeight: '600' as const,
        color: colors.textPrimary,
        marginBottom: spacing.xs,
    },
    answer: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    contactInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    contactLabel: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    contactValue: {
        fontSize: fontSizes.body,
        fontWeight: '500' as const,
        color: colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderLight,
    },
    footer: {
        marginTop: spacing.xl,
        alignItems: 'center',
        paddingBottom: spacing.xxl,
    },
    version: {
        fontSize: fontSizes.caption,
        color: colors.textTertiary,
    },
    copyright: {
        fontSize: 10,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
});
