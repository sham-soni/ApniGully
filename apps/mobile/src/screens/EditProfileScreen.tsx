import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/lib/api';
import { uploadImage } from '@/lib/upload';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploadingAvatar(true);
      try {
        // Upload image to S3
        const uploadedUrl = await uploadImage(result.assets[0].uri, 'avatars');

        // Update user profile with new avatar URL
        await api.patch('/users/me', { avatar: uploadedUrl });

        // Update local state and auth context
        setAvatarUrl(uploadedUrl);
        updateUser({ avatar: uploadedUrl });

        Alert.alert('Success', 'Profile photo updated!');
      } catch (error) {
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsSaving(true);
    try {
      await api.patch('/users/me', {
        name: name.trim(),
        bio: bio.trim() || undefined,
      });
      updateUser({ name: name.trim() });
      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handlePickImage}
          disabled={isUploadingAvatar}
        >
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
            {isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="large" color={colors.white} />
              </View>
            )}
          </View>
          <View style={styles.avatarBadge}>
            <Ionicons name="camera" size={16} color={colors.white} />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>
          {isUploadingAvatar ? 'Uploading...' : 'Tap to change photo'}
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor={colors.neutral[400]}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <View style={styles.readOnlyField}>
            <Text style={styles.readOnlyText}>{user?.phone}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success[500]} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell your neighbors about yourself..."
            placeholderTextColor={colors.neutral[400]}
            value={bio}
            onChangeText={setBio}
            multiline
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={colors.primary[600]} />
          <Text style={styles.infoText}>
            Your name and bio are visible to neighbors in your community.
            Use your real name for trust and verification.
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes['4xl'],
    fontWeight: '600',
    color: colors.primary[700],
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarHint: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.sm,
  },
  form: {
    padding: spacing.lg,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
  },
  input: {
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    fontSize: fontSizes.md,
    color: colors.neutral[900],
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },
  charCount: {
    fontSize: fontSizes.xs,
    color: colors.neutral[400],
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.lg,
  },
  readOnlyText: {
    fontSize: fontSizes.md,
    color: colors.neutral[600],
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verifiedText: {
    fontSize: fontSizes.sm,
    color: colors.success[600],
    fontWeight: '500',
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
  saveButton: {
    height: 52,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  saveButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
  bottomPadding: {
    height: spacing['3xl'],
  },
});
