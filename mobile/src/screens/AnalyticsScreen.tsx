import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, useTasks } from '../hooks';
import { LoadingState } from '../components/EmptyState';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { TaskMode } from '../types';

export function AnalyticsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { tasks, loading } = useTasks(user?.uid, { includeCompleted: true, realtime: true });
    const [modeFilter, setModeFilter] = useState<TaskMode | 'all'>('all');

    // Filter by mode
    const filteredTasks = useMemo(() => {
        if (modeFilter === 'all') return tasks;
        return tasks.filter((t) => t.mode === modeFilter);
    }, [tasks, modeFilter]);

    // Stats
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get last 7 days data
    const dailyData = useMemo(() => {
        const days: { date: string; label: string; completed: number; total: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);

            const dayTasks = filteredTasks.filter((t) => {
                const taskDate = (t as any).dueDate || (t as any).startDate;
                return taskDate === dateStr;
            });

            days.push({
                date: dateStr,
                label: dayLabel,
                completed: dayTasks.filter((t) => t.completed).length,
                total: dayTasks.length,
            });
        }

        return days;
    }, [filteredTasks]);

    // Find max for scaling
    const maxDayTasks = Math.max(...dailyData.map((d) => d.total), 1);

    if (loading && tasks.length === 0) {
        return <LoadingState message="Loading analytics..." />;
    }

    return (
        <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>Analytics</Text>

            {/* Mode Filter - Home/Work */}
            <View style={styles.filterRow}>
                {(['all', 'home', 'work'] as const).map((mode) => (
                    <TouchableOpacity
                        key={mode}
                        style={[styles.filterChip, modeFilter === mode && styles.filterChipActive]}
                        onPress={() => setModeFilter(mode)}
                    >
                        <Text style={[styles.filterText, modeFilter === mode && styles.filterTextActive]}>
                            {mode === 'all' ? 'All' : mode === 'home' ? 'Home' : 'Work'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Overview Stats */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{totalTasks}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.success }]}>{completedTasks}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.warning }]}>{pendingTasks}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statNumber, { color: colors.primary }]}>{completionRate}%</Text>
                    <Text style={styles.statLabel}>Rate</Text>
                </View>
            </View>

            {/* 7-Day Bar Chart */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>This Week</Text>
                <View style={styles.chartContainer}>
                    <View style={styles.barChart}>
                        {dailyData.map((day, index) => {
                            const isToday = index === 6;
                            const barHeight = day.total > 0
                                ? Math.max((day.total / maxDayTasks) * 120, 8)
                                : 4;
                            const completedHeight = day.total > 0
                                ? (day.completed / day.total) * barHeight
                                : 0;

                            return (
                                <View key={day.date} style={styles.barColumn}>
                                    <Text style={styles.barValue}>
                                        {day.completed > 0 ? day.completed : ''}
                                    </Text>
                                    <View style={styles.barWrapper}>
                                        <View style={[
                                            styles.barBackground,
                                            { height: barHeight },
                                        ]}>
                                            <View style={[
                                                styles.barFill,
                                                { height: completedHeight },
                                                isToday && styles.barFillToday,
                                            ]} />
                                        </View>
                                    </View>
                                    <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>
                                        {day.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                    <View style={styles.chartLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                            <Text style={styles.legendText}>Completed</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.surfaceSecondary }]} />
                            <Text style={styles.legendText}>Total</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Weekly Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Weekly Summary</Text>
                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tasks Created</Text>
                        <Text style={styles.summaryValue}>
                            {dailyData.reduce((sum, d) => sum + d.total, 0)}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tasks Completed</Text>
                        <Text style={styles.summaryValue}>
                            {dailyData.reduce((sum, d) => sum + d.completed, 0)}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Best Day</Text>
                        <Text style={styles.summaryValue}>
                            {dailyData.reduce((best, d) => d.completed > best.completed ? d : best, dailyData[0]).label}
                        </Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: spacing.lg,
    },
    title: {
        fontSize: fontSizes.h1,
        fontWeight: '700' as const,
        color: colors.textPrimary,
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    filterRow: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: colors.surfaceSecondary,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
    },
    filterText: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: colors.textInverse,
        fontWeight: '600' as const,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: fontSizes.h1,
        fontWeight: '700' as const,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontSize: fontSizes.bodySmall,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSizes.h3,
        fontWeight: '600' as const,
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    chartContainer: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    barChart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 160,
        paddingBottom: spacing.sm,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
    },
    barValue: {
        fontSize: fontSizes.caption,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
        height: 16,
    },
    barWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
        width: '100%',
        paddingHorizontal: spacing.xs,
    },
    barBackground: {
        width: '100%',
        backgroundColor: colors.surfaceSecondary,
        borderRadius: borderRadius.sm,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '100%',
        backgroundColor: colors.success,
        borderRadius: borderRadius.sm,
    },
    barFillToday: {
        backgroundColor: colors.primary,
    },
    barLabel: {
        marginTop: spacing.xs,
        fontSize: fontSizes.caption,
        color: colors.textTertiary,
    },
    barLabelToday: {
        color: colors.primary,
        fontWeight: '600' as const,
    },
    chartLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.lg,
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: fontSizes.caption,
        color: colors.textSecondary,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    summaryLabel: {
        fontSize: fontSizes.body,
        color: colors.textSecondary,
    },
    summaryValue: {
        fontSize: fontSizes.body,
        fontWeight: '600' as const,
        color: colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
});
