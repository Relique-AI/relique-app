import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing } from '../theme';
import { AppTextInput } from '../components/AppTextInput';

type Tab = 'login' | 'signup' | 'forgot';

export function AuthScreen() {
  const { signIn, signUp, enterGuestMode } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
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
        m.supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: 'pepite://auth/callback' })
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
    let referrerUsername: string | null = null;
    if (tab === 'signup' && referralCode.trim()) {
      const { supabase: sb } = await import('../services/supabase');
      const { data: referrer } = await sb
        .from('profiles')
        .select('username')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .single();
      referrerUsername = referrer?.username ?? null;
    }
    const errMsg =
      tab === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, username.trim(), referralCode.trim() || undefined);
    setLoading(false);

    if (errMsg) {
      setError(translateError(errMsg));
    } else if (tab === 'signup') {
      const referralMsg = referrerUsername
        ? ` Vous avez été parrainé par ${referrerUsername} — votre parrain en a été informé. Vous bénéficiez de 3 achats à −50% de frais !`
        : '';
      setSuccess(`Compte créé ! Vérifiez votre email pour confirmer votre inscription.${referralMsg}`);
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
            <Animated.View style={[styles.logoWrap, { transform: [{ translateY: floatAnim }] }]}>
              <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
              <View style={styles.logoGem}>
                <Text style={styles.logoGemText}>✦</Text>
              </View>
            </Animated.View>
            <Text style={styles.brand}>Pépite</Text>
            <Text style={styles.subtitle}>Tes objets valent plus{'\n'}que tu ne crois.</Text>
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
              <AppTextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={tab === 'login' ? 'email ou pseudo' : 'votre@email.com'}

                keyboardType={tab === 'login' ? 'default' : 'email-address'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Pseudo</Text>
                <AppTextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="ex : chineuse_paris, vintage_paul"
  
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
                <AppTextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
  
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
                <AppTextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="••••••••"
  
                  secureTextEntry
                />
              </View>
            )}

            {tab === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Code de parrainage (optionnel)</Text>
                <AppTextInput
                  style={styles.input}
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="ex : ABC12345"
  
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
    marginBottom: 36,
  },
  logoWrap: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logoGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primary,
  },
  logoGem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGemText: {
    fontSize: 26,
    color: colors.primary,
  },
  brand: {
    fontFamily: fonts.serif,
    fontSize: 52,
    color: colors.primary,
    letterSpacing: -1,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.serifItalic,
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
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
