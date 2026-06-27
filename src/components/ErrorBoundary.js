import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('SplitSaathi crash:', error, info);
    // Production mein yahan Sentry/Crashlytics log bhejo
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>😕</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  title:     { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  subtitle:  { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 20 },
  button:    { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingHorizontal: 28, paddingVertical: 14 },
  buttonText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
});
