import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, CapturedPhoto } from '../types';
import { colors, fonts, spacing } from '../theme';

const { width } = Dimensions.get('window');
const MAX_PHOTOS = 5;

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Review'>;
  route: RouteProp<RootStackParamList, 'Review'>;
};

export function ReviewScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<CapturedPhoto[]>(route.params.photos);
  const [activeIndex, setActiveIndex] = useState(0);

  const addPhotoFromCamera = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.3,
    });
    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      setPhotos((prev) => [...prev, { uri: asset.uri, base64: asset.base64! }]);
    }
  };

  const addPhotoFromLibrary = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.3,
    });
    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      setPhotos((prev) => [...prev, { uri: asset.uri, base64: asset.base64! }]);
    }
  };

  const addPhoto = () => {
    if (photos.length >= MAX_PHOTOS) return;
    Alert.alert(
      'Ajouter une photo',
      '',
      [
        { text: 'Prendre une photo', onPress: addPhotoFromCamera },
        { text: 'Choisir dans la galerie', onPress: addPhotoFromLibrary },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  const handleAnalyse = () => {
    navigation.navigate('Loading', { photos });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Barre supérieure */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Vérifier les photos</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Carrousel de photos */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveIndex(index);
          }}
        >
          {photos.map((photo, i) => (
            <Image key={i} source={{ uri: photo.uri }} style={styles.photo} />
          ))}
        </ScrollView>

        {/* Indicateurs de page */}
        <View style={styles.dots}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        {/* Ajouter une photo */}
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity style={styles.addButton} onPress={addPhoto}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>
              Ajouter une photo ({photos.length}/{MAX_PHOTOS})
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.photoHint}>
          Plus il y a de photos (angles, détails, signatures), plus l'estimation sera précise.
        </Text>

        {/* Espace pour le bouton fixe */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bouton d'action fixe */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={styles.cta} onPress={handleAnalyse} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Estimer la valeur</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.textPrimary,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 16,
  },
  photo: {
    width,
    height: width,
    resizeMode: 'cover',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.chipBackground,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
    borderRadius: 3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 50,
    marginHorizontal: spacing.section,
    marginBottom: spacing.section,
  },
  addButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.primary,
  },
  photoHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginHorizontal: spacing.section,
    marginBottom: spacing.section,
    lineHeight: 18,
  },
  memorySection: {
    paddingHorizontal: spacing.section,
  },
  memoryLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  memoryInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.section,
    paddingVertical: 16,
    paddingBottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  cta: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    color: colors.background,
  },
});
