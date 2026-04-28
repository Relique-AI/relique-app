import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import { Listing } from '../services/supabase';
import { ConditionBadge } from './ConditionBadge';
import { AnalysisResult } from '../types';

interface Props {
  listing: Listing;
  width: number;
  isFavorited: boolean;
  onPress: () => void;
  onFavoriteToggle: () => void;
}

export function ListingCard({ listing, width, isFavorited, onPress, onFavoriteToggle }: Props) {
  const imageUri = listing.images?.[0];
  const condition = listing.condition as AnalysisResult['condition'];

  return (
    <TouchableOpacity style={[styles.card, { width }]} onPress={onPress} activeOpacity={0.88}>
      {/* Photo */}
      <View style={[styles.imageBox, { height: width * 1.1 }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
          </View>
        )}
        {/* Cœur */}
        <TouchableOpacity style={styles.heartBtn} onPress={onFavoriteToggle} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons
            name={isFavorited ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorited ? '#E57373' : '#fff'}
          />
        </TouchableOpacity>
      </View>

      {/* Infos */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{listing.name}</Text>
        <Text style={styles.price}>{listing.price_final} €</Text>
        <View style={styles.footer}>
          <ConditionBadge condition={condition} size="sm" />
          {!!listing.location && (
            <Text style={styles.location} numberOfLines={1}>
              <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
              {' '}{listing.location}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.1)',
  },
  imageBox: {
    width: '100%',
    backgroundColor: colors.chipBackground,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  price: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  location: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
