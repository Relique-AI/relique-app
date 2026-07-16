import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts } from '../theme';
import { AnalysisResult } from '../types';

const COLORS: Record<AnalysisResult['condition'], string> = {
  Excellent: '#B5D479',
  Bon:       '#C9A9DB',
  Correct:   '#F5B82E',
  'À restaurer': '#E08766',
};

const LABEL_KEYS: Record<AnalysisResult['condition'], string> = {
  Excellent: 'condition.excellent',
  Bon: 'condition.good',
  Correct: 'condition.fair',
  'À restaurer': 'condition.needsRestoration',
};

interface Props {
  condition: AnalysisResult['condition'];
  size?: 'sm' | 'md';
}

export function ConditionBadge({ condition, size = 'md' }: Props) {
  const { t } = useTranslation();
  const color = COLORS[condition] ?? '#888';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>
        {LABEL_KEYS[condition] ? t(LABEL_KEYS[condition]) : condition}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  sm: {
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
  },
  textSm: {
    fontSize: 12,
  },
});
