import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks';
import {
    DashboardScreen,
    TasksScreen,
    ProjectsScreen,
    AnalyticsScreen,
    SettingsScreen,
    LoginScreen,
    RegisterScreen,
} from '../screens';
import { colors, spacing } from '../styles/theme';

const Tab = createBottomTabNavigator();

// Tab icons using Ionicons: outline when inactive, filled when active
const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
    Dashboard: { active: 'home', inactive: 'home-outline' },
    Tasks: { active: 'list', inactive: 'list-outline' },
    Projects: { active: 'folder', inactive: 'folder-outline' },
    Analytics: { active: 'stats-chart', inactive: 'stats-chart-outline' },
    Settings: { active: 'settings', inactive: 'settings-outline' },
};

function TabIcon({ routeName, focused, color }: { routeName: string; focused: boolean; color: string }) {
    const icons = TAB_ICONS[routeName] || { active: 'ellipse', inactive: 'ellipse-outline' };
    const iconName = focused ? icons.active : icons.inactive;
    return <Ionicons name={iconName} size={24} color={color} />;
}

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color }) => (
                    <TabIcon routeName={route.name} focused={focused} color={color} />
                ),
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textTertiary,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabLabel,
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{ tabBarLabel: 'Today' }}
            />
            <Tab.Screen name="Tasks" component={TasksScreen} />
            <Tab.Screen name="Projects" component={ProjectsScreen} />
            <Tab.Screen name="Analytics" component={AnalyticsScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

function AuthScreens() {
    const [screen, setScreen] = useState<'login' | 'register'>('login');

    if (screen === 'login') {
        return <LoginScreen onNavigateToRegister={() => setScreen('register')} />;
    }
    return <RegisterScreen onNavigateToLogin={() => setScreen('login')} />;
}

export function AppNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaProvider>
            <NavigationContainer>
                {user ? <MainTabs /> : <AuthScreens />}
            </NavigationContainer>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    tabBar: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: spacing.xs,
        paddingBottom: spacing.sm,
        height: 70,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '500' as const,
    },
});
