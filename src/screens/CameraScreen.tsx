import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, CapturedPhoto } from '../types';
import { colors, fonts, spacing } from '../theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Camera'>;
};

const MAX_PHOTOS = 5;

export function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [permissionRequested, setPermissionRequested] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Demande automatique au montage — affiche le dialogue natif directement
  useEffect(() => {
    if (permission && !permission.granted && !permissionRequested) {
      setPermissionRequested(true);
      requestPermission();
    }
  }, [permission, permissionRequested]);

  // Écran vide pendant le chargement ou la demande initiale
  if (!permission || (!permission.granted && !permissionRequested)) {
    return <View style={styles.bg} />;
  }

  // Après la demande, si toujours refusé → uniquement là on propose les réglages
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Accès à la caméra</Text>
        <Text style={styles.permissionText}>
          L'accès à la caméra est nécessaire pour scanner vos objets. Activez-le dans les réglages de votre téléphone.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.permissionButtonText}>Ouvrir les réglages</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current || photos.length >= MAX_PHOTOS) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await cameraRef.current.takePictureAsync({
      base64: true,
      quality: 0.3,
      shutterSound: false,
    });

    if (result?.uri && result?.base64) {
      setPhotos((prev) => [
        ...prev,
        { uri: result.uri, base64: result.base64! },
      ]);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const remaining = MAX_PHOTOS - photos.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      base64: true,
      quality: 0.3,
    });

    if (!result.canceled) {
      const newPhotos: CapturedPhoto[] = result.assets
        .filter((a) => a.base64)
        .map((a) => ({ uri: a.uri, base64: a.base64! }));
      setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    }
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <View style={styles.bg}>
      {/* Viseur plein écran */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        flash={flash}
      />

      {/* Barre supérieure */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.counter}>
          {photos.length}/{MAX_PHOTOS}
        </Text>
      </SafeAreaView>

      {/* Zone inférieure */}
      <View style={styles.bottomArea}>
        {/* Bandeau de miniatures + bouton Analyser */}
        {photos.length > 0 && (
          <View style={styles.thumbnailSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailStrip}
            >
              {photos.map((photo, index) => (
                <View key={index} style={styles.thumbnailWrapper}>
                  <Image source={{ uri: photo.uri }} style={styles.thumbnail} />
                  <TouchableOpacity
                    style={styles.thumbnailDelete}
                    onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.analyserButton}
              onPress={() => navigation.navigate('Review', { photos })}
            >
              <Text style={styles.analyserText}>Analyser →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hint multi-photos */}
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            {photos.length === 0
              ? 'Plusieurs angles = meilleure estimation'
              : canAddMore
                ? `Ajoutez d'autres angles · ${photos.length}/${MAX_PHOTOS}`
                : 'Maximum atteint · Prêt à analyser'}
          </Text>
        </View>

        {/* Barre de contrôles */}
        <View style={styles.controlsBar}>
          <TouchableOpacity style={styles.iconButton} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shutter, !canAddMore && styles.shutterDisabled]}
            onPress={takePhoto}
            disabled={!canAddMore}
            activeOpacity={0.8}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
          >
            <Ionicons
              name={flash === 'on' ? 'flash' : 'flash-off'}
              size={28}
              color={flash === 'on' ? colors.primary : '#fff'}
            />
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' && <View style={{ height: 20 }} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: 8,
  },
  counter: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  thumbnailSection: {
    paddingHorizontal: spacing.base,
    paddingBottom: 8,
  },
  thumbnailStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  thumbnailDelete: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
  },
  analyserButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  analyserText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.background,
  },
  hintBar: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 8,
    paddingHorizontal: spacing.section,
    alignItems: 'center',
  },
  hintText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.section,
    paddingVertical: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: {
    opacity: 0.35,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.section,
  },
  permissionTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  permissionText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.background,
  },
  backLink: {
    paddingVertical: 8,
  },
  backLinkText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
  },
});
