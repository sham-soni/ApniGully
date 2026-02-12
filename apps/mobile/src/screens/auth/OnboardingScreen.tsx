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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { updateUser } = useAuth();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter your full name');
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/users/me', { name: name.trim() });
      updateUser({ name: name.trim() });
      navigation.navigate('NeighborhoodSelect');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle" size={64} color={colors.primary[500]} />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Let your neighbors know who you are
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor={colors.neutral[400]}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
              <Text style={styles.infoText}>
                Your name will be visible to neighbors in your community. Use your real name for trust.
              </Text>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, name.trim().length < 2 && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={name.trim().length < 2 || isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Saving...' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>
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
    marginTop: spacing['3xl'],
    marginBottom: spacing['3xl'],
  },
  iconContainer: {
    marginBottom: spacing.lg,
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
  input: {
    height: 52,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    fontSize: fontSizes.md,
    color: colors.neutral[900],
    marginBottom: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.primary[700],
    lineHeight: 20,
  },
  button: {
    height: 52,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  buttonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
});
