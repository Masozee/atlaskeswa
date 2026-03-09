import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { apiClient, ENV_CONFIGURED_URL } from '../services/api';
import { database } from '../services/database';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

// App Logo Icon
const AppLogoIcon = () => (
  <View style={{ width: 72, height: 72, borderRadius: 18, backgroundColor: '#00979D', alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
      <Path d="M9 12L11 14L15 10" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={12} r={9} stroke="white" strokeWidth={2} />
    </Svg>
  </View>
);

// Google Logo Component
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [isSavedInDb, setIsSavedInDb] = useState(false);

  useEffect(() => {
    loadServerUrl();
  }, []);

  const loadServerUrl = async () => {
    try {
      await database.init();
      // Always show the currently active URL (which App.tsx already resolved)
      const currentUrl = apiClient.getBaseURL();
      console.log('[ServerURL] Active URL:', currentUrl);
      setServerUrl(currentUrl);
      setIsSavedInDb(true);
    } catch (err) {
      console.error('[ServerURL] loadServerUrl error:', err);
      setServerUrl(apiClient.getBaseURL());
      setIsSavedInDb(false);
    }
  };

  const handleSaveServerUrl = async () => {
    const trimmed = serverUrl.trim().replace(/\/+$/, '');
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a valid server URL');
      return;
    }

    try {
      await database.init();
      console.log('[ServerURL] Saving:', trimmed);
      await database.saveApiBaseUrl(trimmed);
      console.log('[ServerURL] Saved to DB successfully');
      apiClient.setBaseURL(trimmed);
      console.log('[ServerURL] apiClient baseURL set to:', apiClient.getBaseURL());
      setIsSavedInDb(true);
      setServerUrl(trimmed);
      Alert.alert('Saved', `Server URL updated to:\n${trimmed}`);
    } catch (err) {
      console.error('[ServerURL] Save error:', err);
      Alert.alert('Error', `Failed to save: ${err}`);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Login with backend API
      const response = await apiClient.login(email, password);

      // Fetch user data
      const userData = await apiClient.get<any>('/accounts/users/me/');

      console.log('Login successful!', userData);

      // Navigate to home screen
      onLoginSuccess();
    } catch (err: any) {
      const errorMessage = err?.message || 'Invalid email or password';
      setError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Coming Soon', 'Google OAuth will be implemented soon');
  };

  const canSaveServerUrl = !isSavedInDb || serverUrl.trim().replace(/\/+$/, '') !== apiClient.getBaseURL();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <AppLogoIcon />
          <Text style={styles.logoText}>YAKKUM Survey</Text>
        </View>

        {/* Welcome Text */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Selamat Datang</Text>
          <Text style={styles.subtitle}>Masuk ke akun Anda untuk melanjutkan</Text>
        </View>

        {/* Server Configuration */}
        <TouchableOpacity
          style={styles.serverToggle}
          onPress={() => setShowServerConfig(!showServerConfig)}
        >
          <Text style={styles.serverToggleText}>
            {showServerConfig ? 'Hide Server Settings' : 'Server Settings'}
          </Text>
        </TouchableOpacity>

        {showServerConfig && (
          <View style={styles.serverConfigContainer}>
            <Text style={styles.serverConfigLabel}>API Server URL</Text>
            <View style={styles.serverInputRow}>
              <View style={styles.serverInputContainer}>
                <TextInput
                  style={styles.serverInput}
                  placeholder="https://api.example.com/v1"
                  placeholderTextColor="#9ca3af"
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!isLoading}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.serverSaveButton,
                  !canSaveServerUrl && styles.serverSaveButtonDisabled,
                ]}
                onPress={handleSaveServerUrl}
                disabled={!canSaveServerUrl || isLoading}
              >
                <Text style={styles.serverSaveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.serverHint}>
              e.g. http://localhost:8000/v1 or https://api.atlaskeswa.id/v1
            </Text>
          </View>
        )}

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Masukkan password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} disabled={isLoading}>
            <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Masuk</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ATAU</Text>
            <View style={styles.divider} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
          >
            <GoogleLogo size={20} />
            <Text style={styles.googleButtonText}>Masuk dengan Google</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Belum punya akun? </Text>
            <TouchableOpacity>
              <Text style={styles.signupLink}>Daftar</Text>
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
    backgroundColor: '#f5f6f7',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.4,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#00979D',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#07579e',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  googleButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 13,
    color: '#6b7280',
  },
  signupLink: {
    fontSize: 13,
    color: '#00979D',
    fontWeight: '600',
  },
  // Server config styles
  serverToggle: {
    alignItems: 'center',
    marginBottom: 14,
  },
  serverToggleText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  serverConfigContainer: {
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
  },
  serverConfigLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 6,
  },
  serverInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serverInputContainer: {
    flex: 1,
    backgroundColor: '#f5f6f7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  serverInput: {
    fontSize: 12,
    color: '#374151',
    padding: 0,
  },
  serverSaveButton: {
    backgroundColor: '#07579e',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  serverSaveButtonDisabled: {
    opacity: 0.4,
  },
  serverSaveButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  serverHint: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 6,
  },
});
