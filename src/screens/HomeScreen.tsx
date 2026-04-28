import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Relique</Text>
        <Text style={styles.tagline}>
          Découvrez l'histoire et la valeur de vos objets
        </Text>
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Scanner un objet</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.hint}>
        Pointez votre caméra vers n'importe quel objet
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.section * 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.section,
  },
  logo: {
    fontFamily: fonts.serif,
    fontSize: 56,
    color: colors.primary,
    letterSpacing: 3,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 56,
    paddingHorizontal: spacing.base,
  },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 52,
    borderRadius: 50,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
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
  },
});
