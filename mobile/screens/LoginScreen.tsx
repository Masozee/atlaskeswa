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
import { apiClient, ENV_CONFIGURED_URL } from '../services/api';
import { database } from '../services/database';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
          <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={styles.logoText}>OMMHA</Text>
          <Text style={styles.logoSubtitle}>Pemetaan Layanan Kesehatan Jiwa Indonesia berbasis DESDE-LTC</Text>
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
            <View style={[styles.inputContainer, styles.passwordContainer]}>
              <TextInput
                style={styles.input}
                placeholder="Masukkan password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.eyeButtonText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
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
  logoImage: {
    width: 72,
    height: 72,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.4,
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  eyeButton: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  eyeButtonText: {
    fontSize: 13,
    color: '#03979D',
    fontWeight: '500',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 12,
    color: '#03979D',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#03979D',
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
    color: '#03979D',
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
    backgroundColor: '#03979D',
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
