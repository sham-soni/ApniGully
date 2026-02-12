import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, fontSizes, borderRadius } from '@/theme';

interface Membership {
  id: string;
  role: string;
  status: string;
  neighborhood: {
    id: string;
    name: string;
    city: string;
    state: string;
    memberCount: number;
  };
}

export function EditNeighborhoodsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const response = await api.get('/users/me/memberships');
      setMemberships(response.data.data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load neighborhoods');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim() || inviteCode.length < 8) {
      Alert.alert('Error', 'Please enter a valid 8-digit invite code');
      return;
    }

    setIsJoining(true);
    try {
      await api.post('/neighborhoods/join', { inviteCode: inviteCode.trim() });
      await fetchMemberships();
      setShowJoinModal(false);
      setInviteCode('');
      Alert.alert('Success', 'Joined neighborhood successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid invite code');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async (neighborhoodId: string, neighborhoodName: string) => {
    Alert.alert(
      'Leave Neighborhood',
      `Are you sure you want to leave ${neighborhoodName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeavingId(neighborhoodId);
            try {
              await api.post(`/neighborhoods/${neighborhoodId}/leave`);
              await fetchMemberships();
              Alert.alert('Success', 'Left neighborhood');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to leave');
            } finally {
              setLeavingId(null);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Actions */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => setShowJoinModal(true)}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary[600]} />
          <Text style={styles.joinButtonText}>Join a Neighborhood</Text>
        </TouchableOpacity>

        {/* Memberships List */}
        {memberships.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color={colors.neutral[300]} />
            <Text style={styles.emptyTitle}>No neighborhoods yet</Text>
            <Text style={styles.emptySubtitle}>
              Join a neighborhood to connect with your community
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {memberships.map((membership) => (
              <View key={membership.id} style={styles.membershipCard}>
                <View style={styles.neighborhoodIcon}>
                  <Ionicons name="location" size={24} color={colors.primary[600]} />
                </View>
                <View style={styles.membershipInfo}>
                  <Text style={styles.neighborhoodName}>
                    {membership.neighborhood.name}
                  </Text>
                  <Text style={styles.neighborhoodLocation}>
                    {membership.neighborhood.city}, {membership.neighborhood.state}
                  </Text>
                  <View style={styles.membershipMeta}>
                    <View style={styles.memberCount}>
                      <Ionicons name="people" size={14} color={colors.neutral[500]} />
                      <Text style={styles.memberCountText}>
                        {membership.neighborhood.memberCount} members
                      </Text>
                    </View>
                    {membership.role !== 'member' && (
                      <View style={[
                        styles.roleBadge,
                        membership.role === 'admin' && styles.adminBadge,
                        membership.role === 'moderator' && styles.modBadge,
                      ]}>
                        <Text style={styles.roleBadgeText}>
                          {membership.role.charAt(0).toUpperCase() + membership.role.slice(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.leaveButton}
                  onPress={() => handleLeave(
                    membership.neighborhood.id,
                    membership.neighborhood.name
                  )}
                  disabled={leavingId === membership.neighborhood.id}
                >
                  {leavingId === membership.neighborhood.id ? (
                    <ActivityIndicator size="small" color={colors.error[500]} />
                  ) : (
                    <Ionicons name="exit-outline" size={20} color={colors.error[500]} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Join Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join a Neighborhood</Text>
            <Text style={styles.modalSubtitle}>
              Enter the invite code shared by your neighbor or community admin.
            </Text>
            <TextInput
              style={styles.codeInput}
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              placeholder="Enter 8-digit code"
              placeholderTextColor={colors.neutral[400]}
              maxLength={8}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteCode('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (isJoining || inviteCode.length < 8) && styles.confirmButtonDisabled,
                ]}
                onPress={handleJoin}
                disabled={isJoining || inviteCode.length < 8}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: 'dashed',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[50],
  },
  joinButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.primary[600],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.neutral[900],
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    gap: spacing.md,
  },
  neighborhoodIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  membershipInfo: {
    flex: 1,
  },
  neighborhoodName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  neighborhoodLocation: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    marginTop: spacing.xs,
  },
  membershipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memberCountText: {
    fontSize: fontSizes.xs,
    color: colors.neutral[500],
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral[200],
  },
  adminBadge: {
    backgroundColor: colors.primary[100],
  },
  modBadge: {
    backgroundColor: colors.warning[100],
  },
  roleBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  leaveButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  codeInput: {
    height: 56,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    textAlign: 'center',
    fontSize: fontSizes.xl,
    fontWeight: '600',
    letterSpacing: 4,
    color: colors.neutral[900],
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: borderRadius.xl,
  },
  cancelButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  confirmButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  confirmButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.white,
  },
});
