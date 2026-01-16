import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useState, useEffect } from 'react';
import { useFonts, NotoSans_400Regular, NotoSans_500Medium, NotoSans_600SemiBold, NotoSans_700Bold } from '@expo-google-fonts/noto-sans';
import LoginScreen from './screens/LoginScreen';
import HomePage from './screens/HomePage';
import SurveyListScreen from './screens/SurveyListScreen';
import SurveyDetailScreen from './screens/SurveyDetailScreen';
import SurveyFormScreen from './screens/SurveyFormScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import BaseLayout from './components/BaseLayout';
import { apiClient } from './services/api';
import { database } from './services/database';

type Screen = 'home' | 'survey-list' | 'survey-detail' | 'survey-form' | 'profile' | 'settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | undefined>();

  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });

  useEffect(() => {
    // Initialize database
    database.init().catch(err => {
      console.error('Failed to initialize database:', err);
    });

    // Set up session expired callback
    apiClient.setSessionExpiredCallback(() => {
      setIsAuthenticated(false);
      setCurrentScreen('home');
      setSelectedSurveyId(undefined);
    });

    checkAuth();
  }, []);

  const checkAuth = async () => {
    await apiClient.reloadTokens();
    setIsAuthenticated(apiClient.isAuthenticated());
    setIsLoading(false);
  };

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
    return null; // Or a splash screen
  }

  // Set default font family globally
  if (Text.defaultProps == null) Text.defaultProps = {};
  Text.defaultProps.style = { fontFamily: 'NotoSans_400Regular' };

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
          <SurveyFormScreen
            surveyId={selectedSurveyId}
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
        return <HomePage onNavigateToSurveys={navigateToSurveyList} />;
    }
  };

  return (
    <GestureHandlerRootView style={styles.gestureHandler}>
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureHandler: {
    flex: 1,
  },
});
