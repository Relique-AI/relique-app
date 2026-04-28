import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../theme';
import { AnalysisResult } from '../types';

const COLORS: Record<AnalysisResult['condition'], string> = {
  Excellent: '#4CAF50',
  Bon: '#2196F3',
  Correct: '#FF9800',
  'À restaurer': '#F44336',
};

interface Props {
  condition: AnalysisResult['condition'];
  size?: 'sm' | 'md';
}

export function ConditionBadge({ condition, size = 'md' }: Props) {
  const color = COLORS[condition] ?? '#888';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }, size === 'sm' && styles.sm]}>
      <Text style={[styles.text, { color }, size === 'sm' && styles.textSm]}>
        {condition}
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
