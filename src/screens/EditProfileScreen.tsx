import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { ProfileStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase, Profile } from '../services/supabase';
import { AppTextInput } from '../components/AppTextInput';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'EditProfile'>;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [referrerUsername, setReferrerUsername] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCredits, setReferralCredits] = useState(0);
  const [totalFilleuls, setTotalFilleuls] = useState(0);
  const [activeFilleuls, setActiveFilleuls] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) {
      setProfile(data as Profile);
      setUsername(data.username ?? '');
      setAvatarUri(data.avatar_url ?? null);
      setReferralCode((data as any).referral_code ?? null);
      setReferralCredits((data as any).referral_credits ?? 0);
      if ((data as any).referred_by) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', (data as any).referred_by)
          .single();
        setReferrerUsername(referrer?.username ?? null);
      }
      const [{ count: total }, { count: active }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', (data as any).id),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', (data as any).id)
          .eq('referral_first_purchase_done', true),
      ]);
      setTotalFilleuls(total ?? 0);
      setActiveFilleuls(active ?? 0);
    }
    setLoading(false);
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès à la galerie nécessaire pour changer la photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string): Promise<string> => {
    const fileName = `${user!.id}/avatar.jpg`;
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as any);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? '';

    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/avatars/${fileName}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'x-upsert': 'true' },
        body: formData,
      },
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload avatar: ${err}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!username.trim()) {
      Alert.alert('Nom requis', 'Veuillez saisir un nom d\'utilisateur.');
      return;
    }
    setSaving(true);
    try {
      let finalAvatarUrl = profile?.avatar_url ?? null;

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== profile?.avatar_url) {
        setUploading(true);
        finalAvatarUrl = await uploadAvatar(avatarUri);
        setUploading(false);
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim(), avatar_url: finalAvatarUrl })
        .eq('id', user.id);

      if (error) throw error;
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message ?? 'Impossible de sauvegarder le profil.');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le profil</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={44} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="camera" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Appuyez pour changer la photo</Text>
        </View>

        {/* Username */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Nom d'utilisateur</Text>
          <AppTextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Votre nom affiché"

            autoCapitalize="words"
            autoCorrect={false}
            maxLength={40}
          />
          <Text style={styles.fieldHint}>Visible par les acheteurs sur vos annonces.</Text>
        </View>

        {/* Email (non modifiable) */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputDisabled}>
            <Text style={styles.inputDisabledText}>{user?.email}</Text>
          </View>
          <Text style={styles.fieldHint}>L'email ne peut pas être modifié.</Text>
        </View>

        {/* Parrain (si applicable) */}
        {referrerUsername && (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Parrainé par</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{referrerUsername}</Text>
            </View>
          </View>
        )}

        {/* Parrainage */}
        {referralCode && (
          <View style={styles.referralCard}>
            <Text style={styles.referralTitle}>Parrainage</Text>

            {/* Code de parrainage */}
            <View style={styles.referralRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.referralLabel}>Votre code</Text>
                <Text style={styles.referralCode}>{referralCode}</Text>
              </View>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() =>
                  Share.share({
                    message: `Rejoins Pépite avec mon code de parrainage : ${referralCode} — Tu bénéficieras de 3 achats à −50% de frais de service !`,
                  })
                }
              >
                <Ionicons name="share-outline" size={18} color={colors.primary} />
                <Text style={styles.shareBtnText}>Partager</Text>
              </TouchableOpacity>
            </View>

            {/* Filleuls */}
            <View style={styles.referralStat}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.referralStatText}>
                {totalFilleuls === 0
                  ? 'Aucun filleul pour le moment'
                  : `${totalFilleuls} filleul${totalFilleuls > 1 ? 's' : ''} inscrit${totalFilleuls > 1 ? 's' : ''}${activeFilleuls > 0 ? ` · ${activeFilleuls} premier${activeFilleuls > 1 ? 's' : ''} achat${activeFilleuls > 1 ? 's' : ''} effectué${activeFilleuls > 1 ? 's' : ''}` : ''}`}
              </Text>
            </View>

            {/* Crédits restants */}
            <View style={[styles.referralStat, referralCredits > 0 && styles.referralStatHighlight]}>
              <Ionicons
                name="gift-outline"
                size={16}
                color={referralCredits > 0 ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.referralStatText, referralCredits > 0 && { color: colors.primary, fontFamily: fonts.bodySemiBold }]}>
                {referralCredits > 0
                  ? `${referralCredits} achat${referralCredits > 1 ? 's' : ''} à −50% de frais restant${referralCredits > 1 ? 's' : ''}`
                  : 'Aucun crédit parrainage actif'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.textPrimary },
  saveBtn: { paddingHorizontal: 4, height: 48, justifyContent: 'center' },
  saveBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },

  scroll: { padding: spacing.section, gap: 24 },

  avatarSection: { alignItems: 'center', paddingVertical: 8 },
  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatar: { width: 96, height: 96, borderRadius: 48, resizeMode: 'cover' },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.chipBackground,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },

  fieldGroup: { gap: 6 },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  inputDisabled: {
    backgroundColor: colors.chipBackground,
    borderRadius: 12,
    padding: 14,
  },
  inputDisabledText: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary },
  fieldHint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },

  referralCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  referralTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referralLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  referralCode: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: 3,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  shareBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.primary,
  },
  referralStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.chipBackground,
    borderRadius: 10,
  },
  referralStatHighlight: {
    backgroundColor: `${colors.primary}15`,
  },
  referralStatText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
});
