import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTasks, useAuth } from '../hooks';
import { LoadingState } from '../components/EmptyState';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';
import { Task } from '../types';

export function AnalyticsScreen() {
    const { user } = useAuth();
    const { tasks, loading } = useTasks(user?.uid, { includeCompleted: true, realtime: true });

    if (loading) {
        return <LoadingState message="Loading analytics..." />;
    }

    // Calculate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Tasks by priority
    const highPriority = tasks.filter((t) => t.priority === 'high' && !t.completed).length;
    const mediumPriority = tasks.filter((t) => t.priority === 'medium' && !t.completed).length;
    const lowPriority = tasks.filter((t) => t.priority === 'low' && !t.completed).length;

    // Tasks by mode
    const personalTasks = tasks.filter((t) => t.mode === 'personal').length;
    const professionalTasks = tasks.filter((t) => t.mode === 'professional').length;

    // Weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCompleted = tasks.filter((t) => {
        if (!t.completed) return false;
        const taskDate = new Date(t.updatedAt || t.createdAt);
        return taskDate >= weekAgo;
    }).length;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Analytics</Text>

            {/* Overview Stats */}
            <View style={styles.statsGrid}>
                <StatCard
                    label="Total"
                    value={totalTasks}
                    color={colors.primary}
                />
                <StatCard
                    label="Completed"
                    value={completedTasks}
                    color={colors.success}
                />
                <StatCard
                    label="Pending"
                    value={pendingTasks}
                    color={colors.warning}
                />
                <StatCard
                    label="Rate"
                    value={`${completionRate}%`}
                    color={colors.primary}
                />
            </View>

            {/* This Week */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>This Week</Text>
                <View style={styles.weekCard}>
                    <Text style={styles.weekValue}>{recentCompleted}</Text>
                    <Text style={styles.weekLabel}>tasks completed</Text>
                </View>
            </View>

            {/* Priority Breakdown */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>By Priority</Text>
                <View style={styles.breakdownRow}>
                    <BreakdownItem label="High" value={highPriority} color={colors.priorityHigh} />
                    <BreakdownItem label="Medium" value={mediumPriority} color={colors.priorityMedium} />
                    <BreakdownItem label="Low" value={lowPriority} color={colors.priorityLow} />
                </View>
            </View>

            {/* Mode Breakdown */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>By Mode</Text>
                <View style={styles.breakdownRow}>
                    <BreakdownItem label="Personal" value={personalTasks} color={colors.modePersonal} />
                    <BreakdownItem label="Professional" value={professionalTasks} color={colors.modeProfessional} />
                </View>
            </View>
        </ScrollView>
    );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
        <View style={statStyles.card}>
            <Text style={[statStyles.value, { color }]}>{value}</Text>
            <Text style={statStyles.label}>{label}</Text>
        </View>
    );
}

function BreakdownItem({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={breakdownStyles.item}>
            <View style={[breakdownStyles.dot, { backgroundColor: color }]} />
            <View>
                <Text style={breakdownStyles.value}>{value}</Text>
                <Text style={breakdownStyles.label}>{label}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg },
    title: { ...typography.h1, color: colors.textPrimary, marginBottom: spacing.lg },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    section: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
    weekCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.lg,
        alignItems: 'center',
        ...shadows.sm,
    },
    weekValue: { ...typography.h1, color: colors.success },
    weekLabel: { ...typography.body, color: colors.textSecondary },
    breakdownRow: { flexDirection: 'row', gap: spacing.md },
});

const statStyles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.sm,
    },
    value: { ...typography.h2, marginBottom: spacing.xs },
    label: { ...typography.bodySmall, color: colors.textSecondary },
});

const breakdownStyles = StyleSheet.create({
    item: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        gap: spacing.sm,
        ...shadows.sm,
    },
    dot: { width: 12, height: 12, borderRadius: 6 },
    value: { ...typography.h3, color: colors.textPrimary },
    label: { ...typography.caption, color: colors.textSecondary },
});
