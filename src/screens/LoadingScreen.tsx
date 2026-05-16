import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { analyzeObject } from '../services/claude';
import { colors, fonts, spacing } from '../theme';

const { width } = Dimensions.get('window');
const TIMEOUT_MS = 30_000;
const RATE_LIMIT_WAIT = 60;
const MESSAGES = [
  'Pépite analyse votre objet...',
  "Identification de l'époque et de l'origine...",
  'Estimation de la valeur marchande...',
  "Rédaction de l'histoire de l'objet...",
];

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Loading'>;
  route: RouteProp<RootStackParamList, 'Loading'>;
};

export function LoadingScreen({ navigation, route }: Props) {
  const { photos, memory, previousAnalysis } = route.params;
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(1)).current;

  // Guard anti-double exécution (StrictMode dev)
  const hasStarted = useRef(false);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation de pulsation de l'orbe
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    glow.start();
    return () => { pulse.stop(); glow.stop(); };
  }, []);

  // Barre de progression sur 30 secondes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: TIMEOUT_MS,
      useNativeDriver: false,
    }).start();
  }, []);

  // Rotation des messages avec fondu
  useEffect(() => {
    const interval = setInterval(() => {
      if (retryCountdown !== null) return;
      Animated.timing(messageOpacity, { toValue: 0, duration: 300, useNativeDriver: true })
        .start(() => {
          setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
          Animated.timing(messageOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        });
    }, 2000);
    return () => clearInterval(interval);
  }, [retryCountdown]);

  // Appel API — un seul appel garanti grâce au guard
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let cancelled = false;

    const doAnalyze = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        if (!cancelled) setError("L'analyse a pris trop de temps. Veuillez réessayer.");
      }, TIMEOUT_MS);

      try {
        const analysis = await analyzeObject(photos, controller.signal, memory, previousAnalysis);
        clearTimeout(timeout);
        if (!cancelled) navigation.replace('Result', { analysis, photos, memory });
      } catch (err: unknown) {
        clearTimeout(timeout);
        if (cancelled || controller.signal.aborted) return;

        const message = err instanceof Error ? err.message : '';

        if (message === 'RATE_LIMIT') {
          // Countdown automatique puis retry transparent
          let seconds = RATE_LIMIT_WAIT;
          setRetryCountdown(seconds);
          countdownInterval.current = setInterval(() => {
            seconds -= 1;
            if (seconds <= 0) {
              if (countdownInterval.current) clearInterval(countdownInterval.current);
              setRetryCountdown(null);
              if (!cancelled) {
                hasStarted.current = false;
                doAnalyze();
              }
            } else {
              setRetryCountdown(seconds);
            }
          }, 1000);
        } else {
          setError(message || "Une erreur est survenue lors de l'analyse.");
        }
      }
    };

    doAnalyze();

    return () => {
      cancelled = true;
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Écran d'erreur (hors rate limit)
  if (error) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photos[0].uri }} style={StyleSheet.absoluteFillObject} blurRadius={20} />
        <View style={styles.overlay} />
        <SafeAreaView style={styles.errorContainer}>
          <View style={styles.card}>
            <Text style={styles.errorIcon}>✦</Text>
            <Text style={styles.errorTitle}>Oups...</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: photos[0].uri }} style={StyleSheet.absoluteFillObject} blurRadius={20} />
      <View style={styles.overlay} />

      <View style={styles.card}>
        <View style={styles.orbWrapper}>
          <Animated.View style={[styles.orbGlow, { opacity: glowAnim }]} />
          <Animated.View style={[styles.orb, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.orbCore} />
          </Animated.View>
        </View>

        <Text style={styles.brand}>✦ Pépite</Text>

        {/* Message rotatif ou countdown rate limit */}
        <Animated.Text style={[styles.message, { opacity: retryCountdown !== null ? 1 : messageOpacity }]}>
          {retryCountdown !== null
            ? `Quota atteint — nouvelle tentative dans ${retryCountdown}s`
            : MESSAGES[messageIndex]}
        </Animated.Text>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,14,11,0.82)' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.section },
  card: {
    backgroundColor: 'rgba(28,26,18,0.95)',
    borderRadius: 28,
    padding: 40,
    width: width - 64,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,184,46,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  orbWrapper: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  orbGlow: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245,184,46,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(245,184,46,0.5)',
  },
  orbCore: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary },
  brand: { fontFamily: fonts.serif, fontSize: 30, color: colors.primary, marginBottom: 12, letterSpacing: 2 },
  message: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
    minHeight: 44,
    lineHeight: 22,
  },
  progressTrack: { width: '100%', height: 3, backgroundColor: 'rgba(245,184,46,0.15)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 2 },
  errorIcon: { fontSize: 40, marginBottom: 12, color: colors.primary },
  errorTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.textPrimary, marginBottom: 12 },
  errorMessage: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  retryButton: { backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 36, borderRadius: 50 },
  retryText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },
});
