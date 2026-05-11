import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { AppTextInput } from '../components/AppTextInput';
import { useAuth } from '../context/AuthContext';
import { ProfileStackParamList } from '../types';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'StripeOnboarding'>;
};

type BusinessType = 'individual' | 'company';

const INDIVIDUAL_STEPS = ['Identité', 'Adresse', 'Coordonnées bancaires'];
const COMPANY_STEPS = ['Entreprise', 'Représentant légal', 'Coordonnées bancaires'];

export function StripeOnboardingScreen({ navigation }: Props) {
  const { session } = useAuth();
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Individual / representative fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Company-specific fields
  const [companyName, setCompanyName] = useState('');
  const [siret, setSiret] = useState('');

  // Common
  const [iban, setIban] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);

  const steps = businessType === 'company' ? COMPANY_STEPS : INDIVIDUAL_STEPS;
  const totalSteps = steps.length;

  const canProceed = (() => {
    if (businessType === 'individual') {
      if (step === 0) return !!(firstName.trim() && lastName.trim() && dobDay && dobMonth && dobYear.trim().length === 4);
      if (step === 1) return !!(addressLine1.trim() && city.trim() && postalCode.trim().length >= 5);
      if (step === 2) return iban.trim().length >= 14 && tosAccepted;
    }
    if (businessType === 'company') {
      if (step === 0) return !!(companyName.trim() && siret.replace(/\s/g, '').length >= 9);
      if (step === 1) return !!(
        firstName.trim() && lastName.trim() &&
        dobDay && dobMonth && dobYear.trim().length === 4 &&
        addressLine1.trim() && city.trim() && postalCode.trim().length >= 5
      );
      if (step === 2) return iban.trim().length >= 14 && tosAccepted;
    }
    return false;
  })();

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else if (businessType !== null) {
      setBusinessType(null);
      setStep(0);
    } else {
      navigation.goBack();
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('account[business_type]', businessType!);
      params.append('account[tos_shown_and_accepted]', 'true');

      if (businessType === 'individual') {
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
      } else {
        params.append('account[company][name]', companyName.trim());
        params.append('account[company][tax_id]', siret.replace(/\s/g, ''));
        params.append('account[company][address][line1]', addressLine1.trim());
        params.append('account[company][address][city]', city.trim());
        params.append('account[company][address][postal_code]', postalCode.trim());
        params.append('account[company][address][country]', 'FR');
      }

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

      const accountHolderName = businessType === 'company'
        ? companyName.trim()
        : `${firstName.trim()} ${lastName.trim()}`;

      const { error } = await supabase.functions.invoke('create-connect-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          account_token: tokenData.id,
          iban: iban.replace(/\s/g, ''),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          business_type: businessType,
          account_holder_name: accountHolderName,
          dob_day: dobDay.trim(),
          dob_month: dobMonth.trim(),
          dob_year: dobYear.trim(),
          address_line1: addressLine1.trim(),
          address_city: city.trim(),
          address_postal_code: postalCode.trim(),
        },
      });

      if (error) {
        let msg = 'Une erreur est survenue.';
        try {
          const ctx = (error as any).context;
          const body = typeof ctx?.json === 'function' ? await ctx.json() : ctx;
          if (body?.error) msg = body.error;
        } catch {}
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

  // ─── Type selection ───────────────────────────────────────────────────────────

  if (businessType === null) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recevoir des paiements</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.typeContainer}>
          <Text style={styles.typeTitle}>Vous êtes…</Text>
          <Text style={styles.typeSub}>
            Ce choix détermine les informations requises par Stripe pour votre compte de paiement.
          </Text>

          <TouchableOpacity style={styles.typeCard} onPress={() => setBusinessType('individual')} activeOpacity={0.8}>
            <View style={styles.typeIconWrap}>
              <Ionicons name="person-outline" size={26} color={colors.primary} />
            </View>
            <View style={styles.typeCardContent}>
              <Text style={styles.typeCardTitle}>Particulier</Text>
              <Text style={styles.typeCardDesc}>Vous vendez à titre personnel, sans structure juridique.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.typeCard} onPress={() => setBusinessType('company')} activeOpacity={0.8}>
            <View style={styles.typeIconWrap}>
              <Ionicons name="business-outline" size={26} color={colors.primary} />
            </View>
            <View style={styles.typeCardContent}>
              <Text style={styles.typeCardTitle}>Entreprise</Text>
              <Text style={styles.typeCardDesc}>Vous vendez via une structure juridique (SASU, SARL, auto-entrepreneur…)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Step flow ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recevoir des paiements</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.progressRow}>
          {steps.map((label, i) => (
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

          {/* ── Particulier – Étape 1 : Identité ── */}
          {businessType === 'individual' && step === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vos informations personnelles</Text>
              <Text style={styles.sectionSub}>Requises par Stripe pour vérifier votre identité.</Text>
              <Field label="Prénom" value={firstName} onChange={setFirstName} placeholder="Marie" />
              <Field label="Nom" value={lastName} onChange={setLastName} placeholder="Dupont" />
              <Text style={styles.fieldLabel}>Date de naissance</Text>
              <View style={styles.dobRow}>
                <AppTextInput style={[styles.input, styles.dobInput]} placeholder="JJ" keyboardType="numeric"
                  maxLength={2} value={dobDay} onChangeText={setDobDay} placeholderTextColor={colors.textDisabled} />
                <AppTextInput style={[styles.input, styles.dobInput]} placeholder="MM" keyboardType="numeric"
                  maxLength={2} value={dobMonth} onChangeText={setDobMonth} placeholderTextColor={colors.textDisabled} />
                <AppTextInput style={[styles.input, styles.dobInputYear]} placeholder="AAAA" keyboardType="numeric"
                  maxLength={4} value={dobYear} onChangeText={setDobYear} placeholderTextColor={colors.textDisabled} />
              </View>
            </View>
          )}

          {/* ── Particulier – Étape 2 : Adresse ── */}
          {businessType === 'individual' && step === 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Votre adresse</Text>
              <Text style={styles.sectionSub}>Votre adresse de résidence en France.</Text>
              <Field label="Rue et numéro" value={addressLine1} onChange={setAddressLine1} placeholder="12 rue des Lilas" />
              <Field label="Ville" value={city} onChange={setCity} placeholder="Paris" />
              <Field label="Code postal" value={postalCode} onChange={setPostalCode} placeholder="75001" keyboardType="numeric" maxLength={5} />
            </View>
          )}

          {/* ── Entreprise – Étape 1 : Infos légales ── */}
          {businessType === 'company' && step === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Votre entreprise</Text>
              <Text style={styles.sectionSub}>Informations légales de votre structure.</Text>
              <Field label="Raison sociale" value={companyName} onChange={setCompanyName} placeholder="Ma Société SAS" />
              <Field label="SIRET" value={siret} onChange={setSiret} placeholder="123 456 789 00012" keyboardType="numeric" maxLength={17} />
            </View>
          )}

          {/* ── Entreprise – Étape 2 : Représentant légal ── */}
          {businessType === 'company' && step === 1 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Représentant légal</Text>
              <Text style={styles.sectionSub}>Identité et adresse personnelle du dirigeant ou gérant.</Text>
              <Field label="Prénom" value={firstName} onChange={setFirstName} placeholder="Marie" />
              <Field label="Nom" value={lastName} onChange={setLastName} placeholder="Dupont" />
              <Text style={styles.fieldLabel}>Date de naissance</Text>
              <View style={styles.dobRow}>
                <AppTextInput style={[styles.input, styles.dobInput]} placeholder="JJ" keyboardType="numeric"
                  maxLength={2} value={dobDay} onChangeText={setDobDay} placeholderTextColor={colors.textDisabled} />
                <AppTextInput style={[styles.input, styles.dobInput]} placeholder="MM" keyboardType="numeric"
                  maxLength={2} value={dobMonth} onChangeText={setDobMonth} placeholderTextColor={colors.textDisabled} />
                <AppTextInput style={[styles.input, styles.dobInputYear]} placeholder="AAAA" keyboardType="numeric"
                  maxLength={4} value={dobYear} onChangeText={setDobYear} placeholderTextColor={colors.textDisabled} />
              </View>
              <Field label="Rue et numéro" value={addressLine1} onChange={setAddressLine1} placeholder="12 rue des Lilas" />
              <Field label="Ville" value={city} onChange={setCity} placeholder="Paris" />
              <Field label="Code postal" value={postalCode} onChange={setPostalCode} placeholder="75001" keyboardType="numeric" maxLength={5} />
            </View>
          )}

          {/* ── Étape commune : IBAN ── */}
          {step === totalSteps - 1 && (
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
              : <Text style={styles.btnText}>{step < totalSteps - 1 ? 'Continuer' : 'Confirmer'}</Text>
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
      <AppTextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}

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

  // Type selection
  typeContainer: {
    flex: 1,
    paddingHorizontal: spacing.section,
    paddingTop: 40,
    gap: 16,
  },
  typeTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.textPrimary },
  typeSub: {
    fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary,
    lineHeight: 20, marginBottom: 8,
  },
  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.chipBackground,
  },
  typeIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(245,184,46,0.12)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  typeCardContent: { flex: 1, gap: 4 },
  typeCardTitle: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.textPrimary },
  typeCardDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  // Stepper
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
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary,
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
