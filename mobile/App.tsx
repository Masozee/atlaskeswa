import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, BackHandler, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect } from 'react';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { MaterialSymbolsRounded_400Regular } from '@expo-google-fonts/material-symbols-rounded';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SettingsProvider } from './contexts/SettingsContext';
import LoginScreen from './screens/LoginScreen';
import HomePage from './screens/HomePage';
import SurveyListScreen from './screens/SurveyListScreen';
import SurveyDetailScreen from './screens/SurveyDetailScreen';
import SurveyFormScreen from './screens/SurveyFormScreen';
import DynamicSurveyFormScreen from './screens/DynamicSurveyFormScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import BaseLayout from './components/BaseLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { setupGlobalErrorHandler } from './lib/global-error-handler';
import { apiClient, ENV_CONFIGURED_URL, normalizeApiBaseUrl } from './services/api';
import { database } from './services/database';

setupGlobalErrorHandler();

type Screen = 'home' | 'survey-list' | 'survey-detail' | 'survey-form' | 'profile' | 'settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | undefined>();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    MaterialSymbolsRounded_400Regular,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    const bootstrap = async () => {
      // Initialize database first, then check auth
      try {
        await database.init();
      } catch (err) {
        console.error('Failed to initialize database:', err);
      }

      // Set up session expired callback
      apiClient.setSessionExpiredCallback(() => {
        setIsAuthenticated(false);
        setCurrentScreen('home');
        setSelectedSurveyId(undefined);
      });

      await checkAuth();
    };

    bootstrap();
  }, []);

  const checkAuth = async () => {
    const isLegacyLocalApiUrl = (url: string) => /^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(url);

    // Determine API URL: a saved explicit URL wins, but legacy local-dev URLs
    // are migrated to the production default.
    try {
      const savedUrl = await database.getApiBaseUrl();
      if (savedUrl && !isLegacyLocalApiUrl(savedUrl)) {
        // Saved URL exists — use it when it is not a legacy local-dev endpoint
        const normalizedSavedUrl = normalizeApiBaseUrl(savedUrl);
        apiClient.setBaseURL(normalizedSavedUrl);
        if (normalizedSavedUrl !== savedUrl) {
          await database.saveApiBaseUrl(normalizedSavedUrl);
        }
        console.log('[API URL] Using SQLite-saved URL:', normalizedSavedUrl);
      } else {
        const defaultUrl = ENV_CONFIGURED_URL || apiClient.getBaseURL();
        apiClient.setBaseURL(defaultUrl);
        await database.saveApiBaseUrl(defaultUrl);
        console.log('[API URL] Using default URL:', defaultUrl);
      }
    } catch {
      // Use default URL if loading fails
    }

    await apiClient.reloadTokens();

    // Validate token by calling the API, not just checking if it exists
    if (apiClient.isAuthenticated()) {
      try {
        await apiClient.get('/accounts/users/me/');
        setIsAuthenticated(true);
      } catch {
        // Token is expired or invalid - clear and go to login
        await apiClient.clearTokensFromStorage();
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }

    setIsLoading(false);
  };

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!isAuthenticated) return false; // let system handle it on login

      switch (currentScreen) {
        case 'survey-form':
          navigateToSurveyList();
          return true;
        case 'survey-detail':
          navigateToSurveyList();
          return true;
        case 'survey-list':
          setCurrentScreen('home');
          setSelectedSurveyId(undefined);
          return true;
        case 'profile':
        case 'settings':
          setCurrentScreen('home');
          setSelectedSurveyId(undefined);
          return true;
        case 'home':
          return false; // let system handle (exit app)
        default:
          return false;
      }
    });

    return () => backHandler.remove();
  }, [isAuthenticated, currentScreen]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
  };

  const handleBottomNavigation = (screen: string) => {
    if (screen === 'home') {
      setCurrentScreen('home');
      setSelectedSurveyId(undefined);
    } else if (screen === 'survey') {
      setCurrentScreen('survey-list');
      setSelectedSurveyId(undefined);
    } else if (screen === 'survey-form') {
      navigateToSurveyForm();
    } else if (screen === 'profile') {
      setCurrentScreen('profile');
      setSelectedSurveyId(undefined);
    } else if (screen === 'settings') {
      setCurrentScreen('settings');
      setSelectedSurveyId(undefined);
    }
  };

  const navigateToSurveyList = () => {
    setCurrentScreen('survey-list');
    setSelectedSurveyId(undefined);
  };

  const navigateToSurveyDetail = async (surveyId: number) => {
    if (surveyId < 0) {
      setSelectedSurveyId(surveyId);
      setCurrentScreen('survey-detail');
      return;
    }

    try {
      const localByServerId = await database.getSurveyByServerId(surveyId);
      if (localByServerId) {
        if (Number((localByServerId as any).synced) === 0) {
          setSelectedSurveyId(-Number((localByServerId as any).id));
          setCurrentScreen('survey-detail');
          return;
        }

        Alert.alert(
          'Detail Tidak Tersedia',
          'Survei yang sudah tersinkron hanya bisa dilihat di daftar pada aplikasi mobile.'
        );
        setCurrentScreen('survey-list');
        setSelectedSurveyId(undefined);
        return;
      }
    } catch (err) {
      console.warn('Failed to resolve local survey detail access:', err);
    }

    Alert.alert(
      'Detail Tidak Tersedia',
      'Hanya survei lokal yang belum tersinkron yang bisa dibuka di aplikasi mobile.'
    );
    setCurrentScreen('survey-list');
    setSelectedSurveyId(undefined);
  };

  const navigateToSurveyForm = (surveyId?: number) => {
    setSelectedSurveyId(surveyId);
    setCurrentScreen('survey-form');
  };

  const handleSurveySaved = () => {
    navigateToSurveyList();
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image source={require('./assets/logo.png')} style={styles.splashLogo} resizeMode="contain" />
        <Text style={styles.splashText}>OMMHA</Text>
        <Text style={styles.splashSubtitle}>One Map for Mental Health Atlas</Text>
      </View>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'survey-list':
        return (
          <SurveyListScreen
            onSelectSurvey={navigateToSurveyDetail}
            onAddNew={() => navigateToSurveyForm()}
          />
        );
      case 'survey-detail':
        return (
          <SurveyDetailScreen
            surveyId={selectedSurveyId!}
            onBack={navigateToSurveyList}
            onEdit={navigateToSurveyForm}
          />
        );
      case 'survey-form':
        return (
          <DynamicSurveyFormScreen
            responseId={selectedSurveyId}
            onBack={navigateToSurveyList}
            onSave={handleSurveySaved}
          />
        );
      case 'profile':
        return <ProfileScreen />;
      case 'settings':
        return <SettingsScreen onLogout={handleLogout} />;
      case 'home':
      default:
        return <HomePage onNavigateToSurveys={navigateToSurveyList} onSelectSurvey={navigateToSurveyDetail} />;
    }
  };

  return (
    <GestureHandlerRootView style={styles.gestureHandler}>
      <ErrorBoundary onReset={() => {
        setCurrentScreen('home');
        setSelectedSurveyId(undefined);
      }}>
        <SettingsProvider>
          <SafeAreaProvider>
            {isAuthenticated ? (
              <BaseLayout onNavigate={handleBottomNavigation}>
                {renderScreen()}
              </BaseLayout>
            ) : (
              <LoginScreen onLoginSuccess={handleLoginSuccess} />
            )}
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#f5f6f7',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  splashLogo: {
    width: 96,
    height: 96,
  },
  splashText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.4,
  },
  splashSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 32,
  },
});
