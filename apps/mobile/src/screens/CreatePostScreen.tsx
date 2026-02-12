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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/lib/api';
import { uploadMultipleImages } from '@/lib/upload';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { parseRentalPost, POST_TYPE_CONFIG } from '@apnigully/shared';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreatePost'>;
type CreatePostRouteProp = RouteProp<RootStackParamList, 'CreatePost'>;

const POST_TYPES = Object.keys(POST_TYPE_CONFIG) as Array<keyof typeof POST_TYPE_CONFIG>;

export function CreatePostScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreatePostRouteProp>();
  const [type, setType] = useState<string>(route.params?.type || 'update');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleContentChange = (text: string) => {
    setContent(text);
    if (type === 'rental' && text.length > 20) {
      const parsed = parseRentalPost(text);
      if (parsed.bhk || parsed.rent) {
        setParsedData(parsed);
      }
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets) {
      setImages([...images, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter some content');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('');

    try {
      const postData: any = {
        type,
        content: content.trim(),
      };

      if (title.trim()) {
        postData.title = title.trim();
      }

      if (parsedData) {
        postData.parsedData = parsedData;
      }

      // Upload images first and attach URLs
      if (images.length > 0) {
        setUploadProgress(`Uploading images (0/${images.length})...`);
        const imageUrls = await uploadMultipleImages(
          images,
          'posts',
          (completed, total) => {
            setUploadProgress(`Uploading images (${completed}/${total})...`);
          }
        );
        postData.images = imageUrls;
      }

      setUploadProgress('Creating post...');
      await api.post('/posts', postData);
      Alert.alert('Success', 'Post created!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Post Type */}
      <Text style={styles.sectionTitle}>Post Type</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.typeList}
        contentContainerStyle={styles.typeListContent}
      >
        {POST_TYPES.map((t) => {
          const config = POST_TYPE_CONFIG[t];
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeChip,
                type === t && { backgroundColor: config.color },
              ]}
              onPress={() => setType(t)}
            >
              <Text
                style={[
                  styles.typeChipText,
                  type === t && { color: colors.white },
                ]}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Title (optional) */}
      <Text style={styles.sectionTitle}>Title (optional)</Text>
      <TextInput
        style={styles.titleInput}
        placeholder="Add a title..."
        placeholderTextColor={colors.neutral[400]}
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />

      {/* Content */}
      <Text style={styles.sectionTitle}>Content</Text>
      <TextInput
        style={styles.contentInput}
        placeholder={
          type === 'rental'
            ? 'Describe the property... (e.g., 2BHK available, 25k rent, semi-furnished, parking available)'
            : 'What would you like to share?'
        }
        placeholderTextColor={colors.neutral[400]}
        value={content}
        onChangeText={handleContentChange}
        multiline
        textAlignVertical="top"
        maxLength={2000}
      />

      {/* Auto-parsed Rental Data */}
      {type === 'rental' && parsedData && (parsedData.bhk || parsedData.rent) && (
        <View style={styles.parsedPreview}>
          <View style={styles.parsedHeader}>
            <Ionicons name="sparkles" size={16} color={colors.primary[600]} />
            <Text style={styles.parsedTitle}>Auto-detected Details</Text>
          </View>
          <View style={styles.parsedGrid}>
            {parsedData.bhk && (
              <View style={styles.parsedItem}>
                <Text style={styles.parsedLabel}>Type</Text>
                <Text style={styles.parsedValue}>{parsedData.bhk}</Text>
              </View>
            )}
            {parsedData.rent && (
              <View style={styles.parsedItem}>
                <Text style={styles.parsedLabel}>Rent</Text>
                <Text style={styles.parsedValue}>₹{parsedData.rent.toLocaleString()}/mo</Text>
              </View>
            )}
            {parsedData.deposit && (
              <View style={styles.parsedItem}>
                <Text style={styles.parsedLabel}>Deposit</Text>
                <Text style={styles.parsedValue}>₹{parsedData.deposit.toLocaleString()}</Text>
              </View>
            )}
            {parsedData.furnishing && (
              <View style={styles.parsedItem}>
                <Text style={styles.parsedLabel}>Furnishing</Text>
                <Text style={styles.parsedValue}>{parsedData.furnishing}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Images */}
      <View style={styles.imageSection}>
        <Text style={styles.sectionTitle}>Photos (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error[500]} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage}>
              <Ionicons name="camera" size={32} color={colors.neutral[400]} />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <View style={styles.submitButtonContent}>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.submitButtonText}>
              {uploadProgress || 'Posting...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>Post</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  typeList: {
    marginHorizontal: -spacing.lg,
  },
  typeListContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral[100],
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  typeChipText: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
    color: colors.neutral[600],
  },
  titleInput: {
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    fontSize: fontSizes.md,
    color: colors.neutral[900],
  },
  contentInput: {
    minHeight: 150,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    fontSize: fontSizes.md,
    color: colors.neutral[900],
    lineHeight: 24,
  },
  parsedPreview: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  parsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  parsedTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.primary[700],
  },
  parsedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  parsedItem: {
    width: '45%',
  },
  parsedLabel: {
    fontSize: fontSizes.xs,
    color: colors.primary[600],
  },
  parsedValue: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[800],
  },
  imageSection: {
    marginTop: spacing.lg,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral[200],
    marginRight: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: fontSizes.xs,
    color: colors.neutral[400],
    marginTop: spacing.xs,
  },
  submitButton: {
    height: 52,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
  bottomPadding: {
    height: spacing['3xl'],
  },
});
