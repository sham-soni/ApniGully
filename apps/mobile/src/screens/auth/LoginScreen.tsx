import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    const result = await login(`+91${phone}`);
    setIsLoading(false);

    if (result.success) {
      navigation.navigate('Otp', { phone: `+91${phone}` });
    } else {
      Alert.alert('Error', result.message || 'Failed to send OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="home" size={48} color={colors.primary[500]} />
          </View>
          <Text style={styles.title}>Welcome to ApniGully</Text>
          <Text style={styles.subtitle}>
            Connect with your neighborhood community
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phoneInput}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, phone.length !== 10 && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={phone.length !== 10 || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Sending...' : 'Get OTP'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary[500]} />
              <Text style={styles.featureText}>Verified Neighbors</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="lock-closed" size={20} color={colors.primary[500]} />
              <Text style={styles.featureText}>Private & Secure</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={20} color={colors.primary[500]} />
              <Text style={styles.featureText}>Local Community</Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: spacing['2xl'],
  },
  header: {
    alignItems: 'center',
    marginTop: spacing['4xl'],
    marginBottom: spacing['4xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  phoneInput: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  countryCode: {
    height: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.xl,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRightWidth: 0,
  },
  countryCodeText: {
    fontSize: fontSizes.md,
    color: colors.neutral[700],
  },
  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    fontSize: fontSizes.md,
    color: colors.neutral[900],
  },
  button: {
    height: 52,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  buttonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
  terms: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: colors.primary[600],
    fontWeight: '500',
  },
  footer: {
    paddingTop: spacing.xl,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  featureItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: fontSizes.xs,
    color: colors.neutral[600],
    fontWeight: '500',
  },
});
