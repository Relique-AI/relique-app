import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing } from '../theme';

type Tab = 'login' | 'signup' | 'forgot';

export function AuthScreen() {
  const { signIn, signUp, enterGuestMode } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (tab === 'forgot') {
      if (!email.trim()) { setError('Veuillez saisir votre email.'); return; }
      setLoading(true);
      const { error: err } = await import('../services/supabase').then(m =>
        m.supabase.auth.resetPasswordForEmail(email.trim())
      );
      setLoading(false);
      if (err) setError(translateError(err.message));
      else setSuccess('Un lien de réinitialisation a été envoyé à votre email.');
      return;
    }

    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (tab === 'signup') {
      if (password !== confirm) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
        return;
      }
      const trimmedUsername = username.trim();
      if (trimmedUsername.length < 3) {
        setError('Le pseudo doit contenir au moins 3 caractères.');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
        setError('Pseudo : uniquement lettres, chiffres, _ . -');
        return;
      }
    }

    setLoading(true);
    const errMsg =
      tab === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, username.trim(), referralCode.trim() || undefined);
    setLoading(false);

    if (errMsg) {
      setError(translateError(errMsg));
    } else if (tab === 'signup') {
      setSuccess('Compte créé ! Vérifiez votre email pour confirmer votre inscription.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Text style={styles.logoGem}>✦</Text>
              <Text style={styles.brand}>Pépite</Text>
            </View>
            <Text style={styles.subtitle}>Vends ce que tu possèdes,{'\n'}en quelques minutes.</Text>
          </View>

          {/* Tabs */}
          {tab !== 'forgot' && (
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tabItem, tab === 'login' && styles.tabItemActive]}
                onPress={() => { setTab('login'); setUsername(''); setError(null); setSuccess(null); }}
              >
                <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>Connexion</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabItem, tab === 'signup' && styles.tabItemActive]}
                onPress={() => { setTab('signup'); setError(null); setSuccess(null); }}
              >
                <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>Créer un compte</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Titre mot de passe oublié */}
          {tab === 'forgot' && (
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.forgotTitle}>Mot de passe oublié</Text>
              <Text style={styles.forgotSub}>Saisissez votre email pour recevoir un lien de réinitialisation.</Text>
            </View>
          )}

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{tab === 'login' ? 'Email ou pseudo' : 'Email'}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={tab === 'login' ? 'email ou pseudo' : 'votre@email.com'}
                placeholderTextColor={colors.textSecondary}
                keyboardType={tab === 'login' ? 'default' : 'email-address'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Pseudo</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ex : chineuse_paris, vintage_paul"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={30}
                />
                <Text style={styles.fieldHint}>Lettres, chiffres, _ . - · 3 à 30 caractères</Text>
              </View>
            )}

            {tab !== 'forgot' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                />
                {tab === 'login' && (
                  <TouchableOpacity onPress={() => { setTab('forgot'); setError(null); setSuccess(null); }}>
                    <Text style={styles.forgotLink}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                />
              </View>
            )}

            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Code de parrainage (optionnel)</Text>
                <TextInput
                  style={styles.input}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="ex : ABC12345"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={8}
                />
              </View>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
            {success && <Text style={styles.successText}>{success}</Text>}

            <TouchableOpacity
              style={[styles.cta, loading && styles.ctaDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.ctaText}>
                  {tab === 'login' ? 'Se connecter' : tab === 'signup' ? 'Créer mon compte' : 'Envoyer le lien'}
                </Text>
              )}
            </TouchableOpacity>

            {tab === 'forgot' && (
              <TouchableOpacity onPress={() => { setTab('login'); setError(null); setSuccess(null); }} style={{ alignItems: 'center', marginTop: 8 }}>
                <Text style={styles.forgotLink}>← Retour à la connexion</Text>
              </TouchableOpacity>
            )}

          </View>
          {tab !== 'forgot' && (
            <TouchableOpacity style={styles.guestBtn} onPress={enterGuestMode} activeOpacity={0.7}>
              <Text style={styles.guestText}>Découvrir sans compte →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (msg.includes('Email not confirmed')) return 'Confirmez votre email avant de vous connecter.';
  if (msg.includes('User already registered')) return 'Un compte existe déjà avec cet email.';
  if (msg.includes('Password should be')) return 'Mot de passe trop court (6 caractères minimum).';
  return msg;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.section,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  logoGem: {
    fontSize: 28,
    color: colors.primary,
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 46,
    color: colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: fonts.serifRegular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.background,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
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
  guestBtn: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  guestText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
  fieldHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  successText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    lineHeight: 20,
  },
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
  ctaDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.background,
  },
  forgotTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.primary,
    marginBottom: 8,
  },
  forgotSub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  forgotLink: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
});
