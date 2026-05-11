import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme';
import { AppTextInput } from '../components/AppTextInput';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

export function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 3) {
      setError('Le pseudo doit contenir au moins 3 caractères.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      setError('Uniquement lettres, chiffres, _ . -');
      return;
    }
    setLoading(true);
    setError('');

    const code = referralCode.trim().toUpperCase();
    let referrerId: string | null = null;

    if (code) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', code)
        .neq('id', user!.id)
        .single();
      if (!referrer) {
        setError('Code de parrainage invalide.');
        setLoading(false);
        return;
      }
      referrerId = referrer.id;
    }

    const { error: err } = await supabase
      .from('profiles')
      .update({ username: trimmed, referred_by: referrerId })
      .eq('id', user!.id);

    if (err) {
      setError(err.message.includes('unique') ? 'Ce pseudo est déjà pris.' : err.message);
      setLoading(false);
      return;
    }

    if (referrerId) {
      await supabase.from('referrals').insert({ referrer_id: referrerId, referred_id: user!.id });
      supabase.functions.invoke('send-push', {
        body: {
          receiver_id: referrerId,
          sender_name: '✦ Nouveau filleul !',
          message_preview: `${trimmed} vient de rejoindre Pépite avec ton code de parrainage.`,
          type: 'referral',
        },
      });
    }

    await refreshProfile();
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.gem}>✦</Text>
        <Text style={styles.title}>Choisis ton pseudo</Text>
        <Text style={styles.subtitle}>
          C'est le nom que verront les acheteurs sur tes annonces.{'\n'}Tu pourras le modifier plus tard.
        </Text>

        <AppTextInput
          style={styles.input}
          value={username}
          onChangeText={(t) => { setUsername(t); setError(''); }}
          placeholder="ex : chineuse_paris, vintage_paul..."

          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.hint}>Lettres, chiffres, _ . - · 3 à 30 caractères</Text>

        <AppTextInput
          style={[styles.input, { marginTop: 8 }]}
          value={referralCode}
          onChangeText={(t) => { setReferralCode(t); setError(''); }}
          placeholder="Code de parrainage (optionnel)"

          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
        />

        <TouchableOpacity
          style={[styles.btn, (loading || username.trim().length < 3) && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={loading || username.trim().length < 3}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.background} />
            : <Text style={styles.btnText}>Continuer</Text>
          }
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  inner: {
    flex: 1,
    paddingHorizontal: spacing.section,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  gem: { fontSize: 48, color: colors.primary, marginBottom: 8 },
  title: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 23,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.danger,
    alignSelf: 'flex-start',
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    alignSelf: 'flex-start',
  },
  btn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.background },
});
