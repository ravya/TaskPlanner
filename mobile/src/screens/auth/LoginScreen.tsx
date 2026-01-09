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
    useWindowDimensions,
} from 'react-native';
import { colors, spacing, borderRadius } from '../../styles/theme';
import { signIn, useGoogleAuth } from '../../services/firebase';

interface LoginScreenProps {
    onNavigateToRegister: () => void;
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ onNavigateToRegister }: LoginScreenProps) {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const maxWidth = isWeb ? Math.min(400, width - 48) : undefined;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);

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

    const handleLogin = async () => {
        if (!validateEmail(email)) {
            return;
        }

        if (!password) {
            setError('Please enter your password');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await signIn(email.trim(), password);
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
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
            <View style={[styles.content, isWeb && styles.webContent]}>
                <View style={[styles.formWrapper, maxWidth ? { maxWidth, width: '100%' } : null]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>TaskPlanner</Text>
                        <Text style={styles.subtitle}>Sign in to continue</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {displayError && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{displayError}</Text>
                            </View>
                        )}

                        {/* Google Sign In First */}
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
                                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or sign in with email</Text>
                            <View style={styles.dividerLine} />
                        </View>

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
                                placeholder="Password"
                                placeholderTextColor={colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.textInverse} />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={onNavigateToRegister} disabled={isLoading}>
                            <Text style={styles.linkText}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
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
