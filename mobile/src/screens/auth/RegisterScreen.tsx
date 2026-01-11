import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { signUp, useGoogleAuth } from '../../services/firebase';

interface RegisterScreenProps {
    onNavigateToLogin: () => void;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen({ onNavigateToLogin }: RegisterScreenProps) {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const maxWidth = isWeb ? Math.min(400, width - 48) : undefined;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // Google auth hook
    const {
        signInWithGoogle,
        loading: googleLoading,
        error: googleError,
        disabled: googleDisabled
    } = useGoogleAuth();

    const validateEmail = (value: string) => {
        if (!value.trim()) {
            setEmailError('Email is required');
            return false;
        }
        if (!emailRegex.test(value.trim())) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError(null);
        return true;
    };

    const validatePassword = () => {
        if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return false;
        }
        setPasswordError(null);
        return true;
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (emailError) {
            validateEmail(value);
        }
    };

    const handleEmailBlur = () => {
        if (email.trim()) {
            validateEmail(email);
        }
    };

    const handleRegister = async () => {
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword();

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await signUp(email.trim(), password, name.trim() || undefined);
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        await signInWithGoogle();
    };

    const isLoading = loading || googleLoading;
    const displayError = error || googleError;

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={[styles.scrollContent, isWeb && styles.webContent]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.formWrapper, maxWidth ? { maxWidth, width: '100%' } : null]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>TaskPlanner</Text>
                        <Text style={styles.subtitle}>Create your account</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {displayError && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{displayError}</Text>
                            </View>
                        )}

                        {/* Google Sign Up First */}
                        <TouchableOpacity
                            style={[styles.googleButton, (isLoading || googleDisabled) && styles.buttonDisabled]}
                            onPress={handleGoogleSignIn}
                            disabled={isLoading || googleDisabled}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color={colors.textPrimary} />
                            ) : (
                                <>
                                    <Text style={styles.googleIcon}>G</Text>
                                    <Text style={styles.googleButtonText}>Sign up with Google</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or sign up with email</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Name (optional)"
                            placeholderTextColor={colors.textTertiary}
                            value={name}
                            onChangeText={setName}
                            autoCapitalize="words"
                            editable={!isLoading}
                        />

                        {/* Email Input */}
                        <View>
                            <TextInput
                                style={[styles.input, emailError ? styles.inputError : null]}
                                placeholder="Email"
                                placeholderTextColor={colors.textTertiary}
                                value={email}
                                onChangeText={handleEmailChange}
                                onBlur={handleEmailBlur}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!isLoading}
                            />
                            {emailError && (
                                <Text style={styles.fieldError}>{emailError}</Text>
                            )}
                        </View>

                        {/* Password Input with Toggle */}
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Password (min 6 characters)"
                                placeholderTextColor={colors.textTertiary}
                                value={password}
                                onChangeText={(v) => {
                                    setPassword(v);
                                    if (passwordError) setPasswordError(null);
                                }}
                                secureTextEntry={!showPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={22}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password Input with Toggle */}
                        <View>
                            <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Confirm Password"
                                    placeholderTextColor={colors.textTertiary}
                                    value={confirmPassword}
                                    onChangeText={(v) => {
                                        setConfirmPassword(v);
                                        if (passwordError) setPasswordError(null);
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                    editable={!isLoading}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={22}
                                        color={colors.textSecondary}
                                    />
                                </TouchableOpacity>
                            </View>
                            {passwordError && (
                                <Text style={styles.fieldError}>{passwordError}</Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.textInverse} />
                            ) : (
                                <Text style={styles.buttonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={onNavigateToLogin} disabled={isLoading}>
                            <Text style={styles.linkText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 40,
    },
    webContent: {
        alignItems: 'center',
    },
    formWrapper: {
        width: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    form: {
        gap: spacing.md,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textPrimary,
    },
    inputError: {
        borderColor: colors.error,
    },
    fieldError: {
        fontSize: 12,
        color: colors.error,
        marginTop: 4,
        marginLeft: spacing.xs,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.textPrimary,
    },
    eyeButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
    },
    eyeIcon: {
        fontSize: 18,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontSize: 16,
        color: colors.textInverse,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        fontSize: 13,
        color: colors.textTertiary,
        marginHorizontal: spacing.md,
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    googleIcon: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4285F4',
    },
    googleButtonText: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
    },
    errorText: {
        fontSize: 14,
        color: colors.error,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    linkText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
});
