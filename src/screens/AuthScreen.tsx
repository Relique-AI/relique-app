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
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, fonts, spacing } from '../theme';

type Tab = 'login' | 'signup';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

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
    }

    setLoading(true);
    const errMsg =
      tab === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.header}>
            <Text style={styles.brand}>Relique</Text>
            <Text style={styles.subtitle}>Donnez une seconde vie à vos objets</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'login' && styles.tabItemActive]}
              onPress={() => { setTab('login'); setError(null); setSuccess(null); }}
            >
              <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'signup' && styles.tabItemActive]}
              onPress={() => { setTab('signup'); setError(null); setSuccess(null); }}
            >
              <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

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
            </View>

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
                  {tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  brand: {
    fontFamily: fonts.serif,
    fontSize: 42,
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#E57373',
    textAlign: 'center',
  },
  successText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#81C784',
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
});
