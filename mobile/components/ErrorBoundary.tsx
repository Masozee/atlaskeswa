import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] caught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo } = this.state;
    const stack = error?.stack || '';
    const componentStack = errorInfo?.componentStack || '';

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Aplikasi Mengalami Masalah</Text>
          <Text style={styles.subtitle}>
            Terjadi error tak terduga. Silakan coba lagi. Jika berulang, laporkan pesan di bawah ke tim teknis.
          </Text>

          <Text style={styles.sectionLabel}>Pesan Error</Text>
          <Text style={styles.errorMessage}>{error?.message || String(error)}</Text>

          {!!stack && (
            <>
              <Text style={styles.sectionLabel}>Stack Trace</Text>
              <Text style={styles.stack}>{stack}</Text>
            </>
          )}

          {!!componentStack && (
            <>
              <Text style={styles.sectionLabel}>Component Stack</Text>
              <Text style={styles.stack}>{componentStack}</Text>
            </>
          )}

          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Muat Ulang</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#b91c1c',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 12,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  stack: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 6,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#07579E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
