import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import LoadingSpinner from '../../common/LoadingSpinner';

export interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  showSignInLink?: boolean;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const passwordRequirements = [
  { regex: /.{8,}/, message: 'At least 8 characters' },
  { regex: /[A-Z]/, message: 'One uppercase letter' },
  { regex: /[a-z]/, message: 'One lowercase letter' },
  { regex: /\d/, message: 'One number' },
  { regex: /[!@#$%^&*(),.?":{}|<>]/, message: 'One special character' },
];

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  className,
  showSignInLink = true,
}) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData & { general?: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  const { register } = useAuth();

  const validatePassword = (password: string): string[] => {
    return passwordRequirements
      .filter(req => !req.regex.test(password))
      .map(req => req.message);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData & { general?: string }> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      newErrors.password = `Password must have: ${passwordErrors.join(', ')}`;
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email,
        password: formData.password,
      });
      
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getPasswordStrength = (): { score: number; label: string; color: string } => {
    const validRequirements = passwordRequirements.filter(req => req.regex.test(formData.password));
    const score = (validRequirements.length / passwordRequirements.length) * 100;
    
    if (score < 40) return { score, label: 'Weak', color: 'bg-danger-500' };
    if (score < 70) return { score, label: 'Fair', color: 'bg-warning-500' };
    if (score < 90) return { score, label: 'Good', color: 'bg-success-400' };
    return { score, label: 'Strong', color: 'bg-success-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Error */}
        {errors.general && (
          <div className="p-3 text-sm text-danger-700 bg-danger-50 border border-danger-200 rounded-md">
            {errors.general}
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            type="text"
            label="First name"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            error={errors.firstName}
            disabled={isLoading}
            required
            autoComplete="given-name"
          />
          
          <Input
            type="text"
            label="Last name"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            error={errors.lastName}
            disabled={isLoading}
            required
            autoComplete="family-name"
          />
        </div>

        {/* Email Field */}
        <Input
          type="email"
          label="Email address"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          disabled={isLoading}
          required
          autoComplete="email"
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          }
        />

        {/* Password Field */}
        <div>
          <Input
            type="password"
            label="Password"
            placeholder="Create a password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onFocus={() => setShowPasswordRequirements(true)}
            error={errors.password}
            disabled={isLoading}
            required
            autoComplete="new-password"
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Password strength</span>
                <span className={
                  passwordStrength.score < 40 ? 'text-danger-600' :
                  passwordStrength.score < 70 ? 'text-warning-600' :
                  'text-success-600'
                }>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.score}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Password Requirements */}
          {showPasswordRequirements && formData.password && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-xs font-medium text-gray-700 mb-2">Password requirements:</p>
              <ul className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <li key={index} className="flex items-center text-xs">
                    <svg
                      className={`w-3 h-3 mr-2 ${
                        req.regex.test(formData.password) ? 'text-success-500' : 'text-gray-400'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={
                      req.regex.test(formData.password) ? 'text-success-700' : 'text-gray-600'
                    }>
                      {req.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <Input
          type="password"
          label="Confirm password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          disabled={isLoading}
          required
          autoComplete="new-password"
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Terms and Conditions */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="accept-terms"
              name="accept-terms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="accept-terms" className="text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-500">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-danger-600">{errors.acceptTerms}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading}
          loading={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>

        {/* Sign In Link */}
        {showSignInLink && (
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/auth/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </span>
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default RegisterForm;