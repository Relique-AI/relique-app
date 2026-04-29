import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  visible: boolean;
  sellerId: string;
  sellerName: string;
  listingId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({ visible, sellerId, sellerName, listingId, onClose, onSubmitted }: Props) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !user) return;
    setSubmitting(true);
    await supabase.from('reviews').insert({
      reviewer_id: user.id,
      seller_id: sellerId,
      listing_id: listingId,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    setRating(0);
    setComment('');
    onSubmitted();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Évaluer {sellerName}</Text>
          <Text style={styles.subtitle}>Comment s'est passée cette transaction ?</Text>

          {/* Étoiles */}
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? colors.primary : colors.chipBackground}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {['', 'Très déçu', 'Déçu', 'Correct', 'Bien', 'Excellent !'][rating]}
            </Text>
          )}

          {/* Commentaire */}
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Un commentaire ? (optionnel)"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={300}
          />

          <TouchableOpacity
            style={[styles.btn, (rating === 0 || submitting) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting
              ? <ActivityIndicator color={colors.background} />
              : <Text style={styles.btnText}>Publier l'avis</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.section,
    paddingBottom: 40,
    gap: 16,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.chipBackground,
    marginBottom: 4,
  },
  title: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  ratingLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary, marginTop: -8 },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.chipBackground,
    minHeight: 88,
  },
  btn: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },
  cancel: { paddingVertical: 8 },
  cancelText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
});
