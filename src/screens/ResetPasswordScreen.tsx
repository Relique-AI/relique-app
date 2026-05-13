import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing } from '../theme';
import { AppTextInput } from '../components/AppTextInput';

export function ResetPasswordScreen() {
  const { clearRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      setTimeout(clearRecovery, 1500);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logoGem}>✦</Text>
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.sub}>Choisissez un nouveau mot de passe pour votre compte Pépite.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <AppTextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <AppTextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
            {success && <Text style={styles.successText}>Mot de passe mis à jour ! Connexion en cours…</Text>}

            <TouchableOpacity
              style={[styles.cta, (loading || success) && styles.ctaDisabled]}
              onPress={handleSubmit}
              disabled={loading || success}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.ctaText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.section,
    paddingVertical: 40,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logoGem: { fontSize: 32, color: colors.primary, marginBottom: 12 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.primary, marginBottom: 10 },
  sub: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary, letterSpacing: 0.3 },
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
  errorText: { fontFamily: fonts.body, fontSize: 14, color: colors.danger, textAlign: 'center' },
  successText: { fontFamily: fonts.body, fontSize: 14, color: colors.success, textAlign: 'center', lineHeight: 20 },
  cta: {
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
  ctaDisabled: { opacity: 0.6 },
  ctaText: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.background },
});
