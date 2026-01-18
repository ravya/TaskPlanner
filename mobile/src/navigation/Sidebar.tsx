import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius } from '../styles/theme';
import { useProjects, useAuth } from '../hooks';
import { AddProjectModal } from '../screens/ProjectsScreen';

const LIST_ITEMS = [
    { id: 'today', label: "Today's Tasks", icon: 'today-outline' as const },
    { id: 'stickies', label: "Sticky Notes", icon: 'copy-outline' as const, screen: 'Stickies' },
    { id: 'upcoming', label: "Upcoming", icon: 'notifications-outline' as const },
    { id: 'recurring', label: "Recurring", icon: 'repeat-outline' as const },
];

const ARCHIVE_ITEMS = [
    { id: 'completed', label: "Completed", icon: 'checkmark-circle-outline' as const },
    { id: 'trash', label: "Trash", icon: 'trash-outline' as const },
];

const OTHER_ITEMS = [
    { id: 'help', label: "Help & Support", icon: 'help-circle-outline' as const, screen: 'HelpSupport' },
    { id: 'settings', label: "Settings", icon: 'settings-outline' as const, screen: 'Settings' },
];

export function Sidebar(props: DrawerContentComponentProps) {
    const { user } = useAuth();
    const { projects } = useProjects(user?.uid);
    const [showAddProject, setShowAddProject] = React.useState(false);

    const navigateToFilter = (filterType: string, projectId?: string, title?: string) => {
        // We will pass these as params to the Tasks screen
        props.navigation.navigate('Tasks', { filterType, projectId, title });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Task Planner</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Predefined Lists */}
                <View style={styles.section}>
                    {LIST_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.item}
                            onPress={() => {
                                if ((item as any).screen) {
                                    props.navigation.navigate((item as any).screen);
                                } else {
                                    navigateToFilter(item.id, undefined, item.label);
                                }
                            }}
                        >
                            <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                            <Text style={styles.itemLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.divider} />

                {/* Archive Section */}
                <View style={styles.section}>
                    {ARCHIVE_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.item}
                            onPress={() => navigateToFilter(item.id, undefined, item.label)}
                        >
                            <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                            <Text style={styles.itemLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.divider} />

                {/* Projects Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Projects</Text>
                        <TouchableOpacity onPress={() => setShowAddProject(true)}>
                            <Ionicons name="add" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    {projects.map((project) => (
                        <TouchableOpacity
                            key={project.id}
                            style={styles.item}
                            onPress={() => navigateToFilter('project', project.id, project.name)}
                        >
                            <Text style={styles.projectIcon}>{project.icon || '📁'}</Text>
                            <Text style={styles.itemLabel} numberOfLines={1}>{project.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.divider} />

                {/* Other Section */}
                <View style={styles.section}>
                    {OTHER_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.item}
                            onPress={() => {
                                if (item.screen === 'HelpSupport') {
                                    props.navigation.navigate('HelpSupport');
                                } else if (item.screen === 'Settings') {
                                    props.navigation.navigate('MainTabs', { screen: 'Settings' });
                                }
                            }}
                        >
                            <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                            <Text style={styles.itemLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <AddProjectModal
                visible={showAddProject}
                onClose={() => setShowAddProject(false)}
                userId={user?.uid}
                projects={projects}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.surface,
    },
    header: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    headerTitle: {
        fontSize: fontSizes.h3,
        fontWeight: '700' as const,
        color: colors.primary,
    },
    scrollContent: {
        paddingVertical: spacing.md,
    },
    section: {
        paddingHorizontal: spacing.md,
        marginVertical: spacing.xs,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    sectionTitle: {
        fontSize: fontSizes.caption,
        fontWeight: '700' as const,
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: borderRadius.md,
    },
    itemLabel: {
        fontSize: fontSizes.bodySmall,
        color: colors.textPrimary,
        marginLeft: spacing.md,
        fontWeight: '500' as const,
    },
    projectIcon: {
        fontSize: 18,
    },
    divider: {
        height: 1,
        backgroundColor: colors.borderLight,
        marginHorizontal: spacing.lg,
        marginVertical: spacing.sm,
    },
});
