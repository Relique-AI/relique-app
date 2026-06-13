import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Settings'>;
};

function SettingsRow({
  icon,
  label,
  subtitle,
  onPress,
  destructive = false,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons name={icon as any} size={20} color={destructive ? colors.danger : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
        {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function SettingsScreen({ navigation }: Props) {
  const { user, signOut, isAdmin } = useAuth();

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Toutes vos données seront supprimées définitivement. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
              await supabase.auth.signOut();
              return;
            }
            const { error } = await supabase.functions.invoke('delete-account', {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });
            if (error) {
              let msg = 'Impossible de supprimer le compte.';
              try {
                const body = await (error as any).context?.json?.();
                if (body?.error) msg = body.error;
              } catch {}
              Alert.alert('Erreur', msg);
              return;
            }
            await supabase.auth.signOut();
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Se déconnecter', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Compte */}
        <Text style={styles.sectionLabel}>Compte</Text>
        <View style={styles.group}>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
          <View style={styles.separator} />
          <SettingsRow
            icon="log-out-outline"
            label="Se déconnecter"
            onPress={handleSignOut}
          />
        </View>

        {/* Admin */}
        {isAdmin && (
          <>
            <Text style={styles.sectionLabel}>Administration</Text>
            <View style={styles.group}>
              <SettingsRow
                icon="shield-checkmark-outline"
                label="Modération"
                subtitle="Traiter les signalements"
                onPress={() => navigation.navigate('Admin')}
              />
            </View>
          </>
        )}

        {/* Légal */}
        <Text style={styles.sectionLabel}>Informations</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="document-text-outline"
            label="Mentions légales & CGU"
            onPress={() => navigation.navigate('Legal')}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Politique de confidentialité"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
        </View>

        {/* Zone danger */}
        <Text style={styles.sectionLabel}>Zone de danger</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="trash-outline"
            label="Supprimer mon compte"
            subtitle="Suppression définitive de toutes vos données"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>

        {/* Version */}
        <Text style={styles.version}>Pépite v{Constants.expoConfig?.version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  scroll: { padding: spacing.section, paddingBottom: 40 },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 8,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  emailText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
  separator: { height: 1, backgroundColor: colors.background, marginHorizontal: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245,184,46,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: 'rgba(224,135,102,0.12)',
  },
  rowLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  rowLabelDestructive: { color: colors.danger },
  rowSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  version: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
});
