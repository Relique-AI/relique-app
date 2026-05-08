import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ProfileStackParamList } from '../types';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TRsheEn6Dd2QHHQW1sqfqTxa98pDEqHsRHagLbBFyLq0PGEAUfqfsVQMfTZiRxNWDhYwD2AhPhQdsnS7STO6CnD00wXoG5NWJ';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'StripeOnboarding'>;
};

const STEPS = ['Identité', 'Adresse', 'Coordonnées bancaires'];

export function StripeOnboardingScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [iban, setIban] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);

  const canProceedStep0 = firstName.trim() && lastName.trim() &&
    dobDay.trim() && dobMonth.trim() && dobYear.trim().length === 4;
  const canProceedStep1 = addressLine1.trim() && city.trim() && postalCode.trim().length >= 5;
  const canProceedStep2 = iban.trim().length >= 14 && tosAccepted;

  const handleNext = () => {
    if (step < 2) { setStep(step + 1); return; }
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // Étape 1 : créer le token côté app avec la clé publique Stripe
      const params = new URLSearchParams();
      params.append('account[individual][first_name]', firstName.trim());
      params.append('account[individual][last_name]', lastName.trim());
      params.append('account[individual][dob][day]', dobDay.trim());
      params.append('account[individual][dob][month]', dobMonth.trim());
      params.append('account[individual][dob][year]', dobYear.trim());
      params.append('account[individual][address][line1]', addressLine1.trim());
      params.append('account[individual][address][city]', city.trim());
      params.append('account[individual][address][postal_code]', postalCode.trim());
      params.append('account[individual][address][country]', 'FR');
      params.append('account[individual][email]', session.user.email ?? '');
      params.append('account[tos_shown_and_accepted]', 'true');

      const tokenRes = await fetch('https://api.stripe.com/v1/tokens', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        Alert.alert('Erreur Stripe', tokenData.error.message ?? 'Impossible de créer le token.');
        return;
      }
      if (!tokenData.id) {
        Alert.alert('Erreur', `Réponse Stripe inattendue : ${JSON.stringify(tokenData)}`);
        return;
      }

      // Étape 2 : envoyer le token + IBAN à l'Edge Function
      const { error } = await supabase.functions.invoke('create-connect-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          account_token: tokenData.id,
          iban: iban.replace(/\s/g, ''),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      });

      if (error) {
        let msg = 'Une erreur est survenue.';
        try { const b = await (error as any).context?.json?.(); if (b?.error) msg = b.error; } catch {}
        Alert.alert('Erreur', msg);
        return;
      }

      navigation.goBack();
      Alert.alert('Compte configuré', 'Vous pouvez désormais recevoir des paiements sur votre IBAN.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = step === 0 ? canProceedStep0 : step === 1 ? canProceedStep1 : canProceedStep2;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recevoir des paiements</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress */}
        <View style={styles.progressRow}>
          {STEPS.map((label, i) => (
            <View key={i} style={styles.progressItem}>
              <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
                {i < step
                  ? <Ionicons name="checkmark" size={12} color={colors.background} />
                  : <Text style={[styles.progressNum, i === step && styles.progressNumActive]}>{i + 1}</Text>
                }
              </View>
              <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vos informations personnelles</Text>
              <Text style={styles.sectionSub}>Requises par Stripe pour vérifier votre identité.</Text>

              <Field label="Prénom" value={firstName} onChange={setFirstName} placeholder="Marie" />
              <Field label="Nom" value={lastName} onChange={setLastName} placeholder="Dupont" />

              <Text style={styles.fieldLabel}>Date de naissance</Text>
              <View style={styles.dobRow}>
                <TextInput style={[styles.input, styles.dobInput]} placeholder="JJ" keyboardType="numeric"
                  maxLength={2} value={dobDay} onChangeText={setDobDay} placeholderTextColor={colors.textDisabled} />
                <TextInput style={[styles.input, styles.dobInput]} placeholder="MM" keyboardType="numeric"
                  maxLength={2} value={dobMonth} onChangeText={setDobMonth} placeholderTextColor={colors.textDisabled} />
                <TextInput style={[styles.input, styles.dobInputYear]} placeholder="AAAA" keyboardType="numeric"
                  maxLength={4} value={dobYear} onChangeText={setDobYear} placeholderTextColor={colors.textDisabled} />
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Votre adresse</Text>
              <Text style={styles.sectionSub}>Votre adresse de résidence en France.</Text>

              <Field label="Rue et numéro" value={addressLine1} onChange={setAddressLine1} placeholder="12 rue des Lilas" />
              <Field label="Ville" value={city} onChange={setCity} placeholder="Paris" />
              <Field label="Code postal" value={postalCode} onChange={setPostalCode} placeholder="75001" keyboardType="numeric" maxLength={5} />
            </View>
          )}

          {step === 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Votre IBAN</Text>
              <Text style={styles.sectionSub}>Vos paiements seront virés sur ce compte bancaire.</Text>

              <Field
                label="IBAN"
                value={iban}
                onChange={(v) => setIban(v.toUpperCase())}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                autoCapitalize="characters"
              />

              <TouchableOpacity style={styles.tosRow} onPress={() => setTosAccepted(!tosAccepted)} activeOpacity={0.8}>
                <View style={[styles.checkbox, tosAccepted && styles.checkboxChecked]}>
                  {tosAccepted && <Ionicons name="checkmark" size={13} color={colors.background} />}
                </View>
                <Text style={styles.tosText}>
                  J'accepte les{' '}
                  <Text style={styles.tosLink}>conditions générales de Stripe</Text>
                  {' '}pour recevoir des paiements sur la plateforme Pépite.
                </Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.infoText}>
                  Vos données sont transmises directement à Stripe et ne sont pas stockées sur nos serveurs.
                </Text>
              </View>
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btn, (!canProceed || loading) && styles.btnDisabled]}
            onPress={handleNext}
            disabled={!canProceed || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.background} />
              : <Text style={styles.btnText}>{step < 2 ? 'Continuer' : 'Confirmer'}</Text>
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType, maxLength, autoCapitalize }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  keyboardType?: any; maxLength?: number; autoCapitalize?: any;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textDisabled}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.section, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.surface,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary },

  progressRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 32,
    paddingVertical: 20, paddingHorizontal: spacing.section,
  },
  progressItem: { alignItems: 'center', gap: 6 },
  progressDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.surface,
  },
  progressDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressNum: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.textSecondary },
  progressNumActive: { color: colors.background },
  progressLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  progressLabelActive: { color: colors.primary, fontFamily: fonts.bodySemiBold },

  scroll: { padding: spacing.section },
  section: { gap: 4 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, marginBottom: 4 },
  sectionSub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },

  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
  },
  dobRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dobInput: { flex: 1 },
  dobInputYear: { flex: 1.5 },

  tosRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 8, marginBottom: 16 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: colors.textSecondary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  tosText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 19 },
  tosLink: { color: colors.primary },

  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(245,184,46,0.08)',
    borderRadius: 12, padding: 14,
  },
  infoText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, flex: 1, lineHeight: 18 },

  footer: { padding: spacing.section, paddingBottom: 8 },
  btn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },
});
