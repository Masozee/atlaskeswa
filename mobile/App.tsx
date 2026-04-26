import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, BackHandler } from 'react-native';
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
import { apiClient, ENV_CONFIGURED_URL, normalizeApiBaseUrl } from './services/api';
import { database } from './services/database';
import { syncQueue } from './services/syncQueue';
import NetInfo from '@react-native-community/netinfo';

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

  // Trigger sync whenever the device comes back online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        syncQueue.processQueue().catch((err) =>
          console.warn('[SyncQueue] processQueue error:', err)
        );
      }
    });
    return () => unsubscribe();
  }, []);

  const checkAuth = async () => {
    // Determine API URL: SQLite-saved URL takes priority over .env
    // .env is only used as fallback when no URL has been saved yet
    try {
      const savedUrl = await database.getApiBaseUrl();
      if (savedUrl) {
        // Saved URL exists — always use it (user explicitly set it)
        const normalizedSavedUrl = normalizeApiBaseUrl(savedUrl);
        apiClient.setBaseURL(normalizedSavedUrl);
        if (normalizedSavedUrl !== savedUrl) {
          await database.saveApiBaseUrl(normalizedSavedUrl);
        }
        console.log('[API URL] Using SQLite-saved URL:', normalizedSavedUrl);
      } else if (ENV_CONFIGURED_URL) {
        // No saved URL — use .env as initial default
        apiClient.setBaseURL(ENV_CONFIGURED_URL);
        await database.saveApiBaseUrl(ENV_CONFIGURED_URL);
        console.log('[API URL] Using .env URL (initial default):', ENV_CONFIGURED_URL);
      } else {
        console.log('[API URL] Using default URL:', apiClient.getBaseURL());
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

  const navigateToSurveyDetail = (surveyId: number) => {
    setSelectedSurveyId(surveyId);
    setCurrentScreen('survey-detail');
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

  // Set default font family globally
  if (Text.defaultProps == null) Text.defaultProps = {};
  Text.defaultProps.style = { fontFamily: 'System' };

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
