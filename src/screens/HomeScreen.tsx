import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

const { width } = Dimensions.get('window');

const STEPS = [
  { icon: 'camera-outline', label: 'Scanne' },
  { icon: 'sparkles-outline', label: 'Estime' },
  { icon: 'bag-handle-outline', label: 'Vends' },
];

export function HomeScreen({ navigation }: Props) {
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

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>

        {/* Logo animé */}
        <Animated.View style={[styles.logoWrap, { transform: [{ translateY: floatAnim }] }]}>
          <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
          <View style={styles.logoGem}>
            <Text style={styles.logoGemText}>✦</Text>
          </View>
        </Animated.View>

        {/* Marque */}
        <Text style={styles.brand}>Pépite</Text>
        <Text style={styles.tagline}>
          Tes objets valent plus{'\n'}que tu ne crois.
        </Text>

        {/* Étapes */}
        <View style={styles.steps}>
          {STEPS.map((step, i) => (
            <View key={step.label} style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.stepLabel}>{step.label}</Text>
              {i < STEPS.length - 1 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.88}
        >
          <Ionicons name="camera" size={22} color={colors.background} style={{ marginRight: 10 }} />
          <Text style={styles.ctaText}>Scanner un objet</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Pointez votre caméra vers n'importe quel objet</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.section,
    gap: 0,
  },

  // Logo animé
  logoWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
  },
  logoGem: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGemText: {
    fontSize: 30,
    color: colors.primary,
  },

  // Texte
  brand: {
    fontFamily: fonts.serif,
    fontSize: 64,
    color: colors.primary,
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: fonts.serifItalic,
    fontSize: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 29,
    marginBottom: 44,
  },

  // Étapes
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 52,
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDisabled,
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  stepLine: {
    width: 24,
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },

  // CTA
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.background,
    letterSpacing: 0.3,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    opacity: 0.5,
    textAlign: 'center',
  },
});
