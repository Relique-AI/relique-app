import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
  Share,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing } from '../services/supabase';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/ConditionBadge';
import { ReviewModal } from '../components/ReviewModal';
import { AnalysisResult } from '../types';
import { AppTextInput } from '../components/AppTextInput';

type Props = {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<{ Listing: { id: string } }, 'Listing'>;
};

const { width } = Dimensions.get('window');

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Contenu inapproprié',
  scam: 'Arnaque / Fraude',
  prohibited: 'Objet interdit',
};

function InfoChip({ label, onPress }: { label: string; onPress?: () => void }) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.chip, styles.chipClickable]} onPress={onPress} activeOpacity={0.7}>
        <Text style={[styles.chipText, { color: colors.primary }]}>{label}</Text>
        <Ionicons name="chevron-forward" size={11} color={colors.primary} />
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function ZoomableImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = Math.max(1, savedScale.value * e.scale); })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        savedX.value = 0;
        savedY.value = 0;
      } else {
        scale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.Image
        source={{ uri }}
        style={[{ width, height: width * 1.3 }, animStyle]}
        resizeMode="contain"
      />
    </GestureDetector>
  );
}

export function ListingScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { id } = route.params;
  const { user } = useAuth();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAsSold, setMarkingAsSold] = useState(false);
  const [buying, setBuying] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sellerListings, setSellerListings] = useState<Listing[]>([]);
  const [sellerRating, setSellerRating] = useState<{ avg: number; count: number } | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [showShippingSheet, setShowShippingSheet] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  type Question = { id: string; asker_id: string; question: string; answer: string | null; created_at: string; profiles: { username: string } | null };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const isOwner = listing?.seller_id === user?.id;

  useEffect(() => {
    setLoading(true);
    setPhotoIndex(0);
    setSellerListings([]);
    setQuestions([]);
    loadListing();
    loadFavorite();
    loadQuestions();
  }, [id]);

  const loadListing = async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username, created_at)')
      .eq('id', id)
      .single();
    if (data) {
      setListing(data as Listing);
      loadSellerListings(data.seller_id);
      loadSellerRating(data.seller_id);
    }
    setLoading(false);
  };

  const loadSellerRating = async (sellerId: string) => {
    const { data } = await supabase
      .from('reviews')
      .select('rating')
      .eq('seller_id', sellerId);
    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setSellerRating({ avg: Math.round(avg * 10) / 10, count: data.length });
    }
    if (user) {
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('seller_id', sellerId)
        .eq('reviewer_id', user.id)
        .eq('listing_id', id)
        .maybeSingle();
      setAlreadyReviewed(!!existing);
    }
  };

  const loadSellerListings = async (sellerId: string) => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setSellerListings(data as Listing[]);
  };

  const loadQuestions = async () => {
    const { data } = await supabase
      .from('listing_questions')
      .select('id, asker_id, question, answer, created_at, profiles(username)')
      .eq('listing_id', id)
      .order('created_at', { ascending: true });
    if (data) setQuestions(data as unknown as Question[]);
  };

  const submitQuestion = async () => {
    if (!user || !newQuestion.trim()) return;
    setSubmittingQ(true);
    const { error } = await supabase.from('listing_questions').insert({
      listing_id: id,
      asker_id: user.id,
      question: newQuestion.trim(),
    });
    if (!error) {
      setNewQuestion('');
      loadQuestions();
      if (!isFavorited) {
        supabase.from('favorites').insert({ user_id: user.id, listing_id: id }).then(() => {
          setIsFavorited(true);
        });
      }
      if (listing) {
        supabase.functions.invoke('send-push', {
          body: {
            receiver_id: listing.seller_id,
            sender_name: 'Nouvelle question',
            listing_name: listing.name,
            message_preview: newQuestion.trim(),
            type: 'question',
            listing_id: listing.id,
          },
        }).catch(() => {});
      }
    }
    setSubmittingQ(false);
  };

  const submitAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;
    await supabase
      .from('listing_questions')
      .update({ answer: answerText.trim(), answered_at: new Date().toISOString() })
      .eq('id', questionId);
    // Notify the asker
    const q = questions.find((x) => x.id === questionId);
    if (q && listing) {
      supabase.functions.invoke('send-push', {
        body: {
          receiver_id: q.asker_id,
          sender_name: listing.profiles?.username ?? 'Vendeur',
          listing_name: listing.name,
          message_preview: answerText.trim(),
          type: 'question_answer',
          listing_id: listing.id,
        },
      }).catch(() => {});
    }
    setAnsweringId(null);
    setAnswerText('');
    loadQuestions();
  };

  const loadFavorite = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', id)
      .maybeSingle();
    setIsFavorited(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    setIsFavorited((prev) => !prev);
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: id });
    }
  };

  const markAsSold = async () => {
    Alert.alert(
      'Marquer comme vendu',
      'Cet objet sera retiré du marché. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            setMarkingAsSold(true);
            const { error } = await supabase
              .from('listings')
              .update({ status: 'sold' })
              .eq('id', id);
            setMarkingAsSold(false);
            if (!error) {
              Alert.alert('Vendu !', 'Votre annonce a été marquée comme vendue.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            }
          },
        },
      ],
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Signaler cette annonce',
      'Pourquoi signalez-vous cette annonce ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Contenu inapproprié',
          onPress: () => submitReport('inappropriate'),
        },
        {
          text: 'Arnaque / Fraude',
          onPress: () => submitReport('scam'),
        },
        {
          text: 'Objet interdit',
          onPress: () => submitReport('prohibited'),
        },
      ],
    );
  };

  const handleShare = async () => {
    if (!listing) return;
    const deepLink = `pepite://listing/${listing.id}`;
    await Share.share({
      title: listing.name,
      message:
        `${listing.name} — ${listing.price_final} €\n` +
        `${listing.category} · ${listing.era}\n\n` +
        `Voir cette annonce sur Pépite : ${deepLink}`,
    });
  };

  const SHIPPING_LABELS: Record<string, string> = {
    hand: 'Remise en main propre',
    relay: 'Mondial Relay',
    colissimo: 'Colissimo',
    chronopost: 'Chronopost',
  };

  const handleBuy = () => {
    if (!listing || !user) return;
    const options = listing.shipping_options ?? ['hand'];
    const hasPostal = options.some((o) => o !== 'hand');
    if (!hasPostal) {
      processPurchase('hand', undefined);
      return;
    }
    setSelectedShipping(options[0]);
    setDeliveryAddress('');
    setShowShippingSheet(true);
  };

  const processPurchase = async (shippingMethod: string, deliveryAddr: string | undefined) => {
    if (!listing || !user) return;
    setBuying(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { listing_id: listing.id, shipping_method: shippingMethod, delivery_address: deliveryAddr },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) {
        let errMsg = 'Impossible de lancer le paiement.';
        try {
          const ctx = (error as any).context;
          const body = typeof ctx?.json === 'function' ? await ctx.json() : ctx;
          if (body?.error) errMsg = body.error;
        } catch {}
        if (errMsg.includes('non configuré') || errMsg.includes('Vendeur') || errMsg.includes('configuré')) {
          Alert.alert('Paiement indisponible', 'Ce vendeur n\'a pas encore configuré son compte de paiement. Contactez-le directement.');
        } else {
          Alert.alert('Erreur', errMsg);
        }
        return;
      }
      if (!data?.clientSecret) throw new Error('Erreur paiement');

      const paymentIntentId = data.clientSecret.split('_secret_')[0];

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Pépite',
        paymentIntentClientSecret: data.clientSecret,
        defaultBillingDetails: { email: user.email },
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') Alert.alert('Erreur', presentError.message);
        return;
      }

      supabase.functions.invoke('confirm-purchase', {
        body: { payment_intent_id: paymentIntentId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }).catch(() => {});

      navigation.getParent()?.navigate('Profil', {
        screen: 'Profile',
        params: { initialTab: 'purchases' },
      });
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue');
    } finally {
      setBuying(false);
    }
  };

  const sendOffer = async () => {
    if (!user || !listing || !offerAmount.trim()) return;
    const amount = parseFloat(offerAmount.trim().replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    const { data: offer, error } = await supabase
      .from('offers')
      .insert({
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !offer) {
      Alert.alert('Erreur', "Impossible d'envoyer l'offre.");
      return;
    }

    await supabase.from('messages').insert({
      listing_id: listing.id,
      sender_id: user.id,
      receiver_id: listing.seller_id,
      content: `Offre de ${amount} €`,
      type: 'offer',
      offer_id: offer.id,
    });

    const { data: senderProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    supabase.functions.invoke('send-push', {
      body: {
        receiver_id: listing.seller_id,
        sender_name: senderProfile?.username ?? 'Acheteur',
        listing_name: listing.name,
        message_preview: `Offre de ${amount} €`,
        type: 'offer_received',
        listing_id: listing.id,
        sender_id: user.id,
      },
    }).catch(() => {});

    setShowOfferModal(false);
    setOfferAmount('');
    navigation.navigate('Chat', {
      listing_id: listing.id,
      receiver_id: listing.seller_id,
      listing_name: listing.name,
    });
  };

  const submitReport = async (reason: string) => {
    if (!user) return;
    await supabase.from('reports').insert({ reporter_id: user.id, listing_id: id, reason });
    // Notify all admins
    const { data: admins } = await supabase.from('profiles').select('id').eq('is_admin', true);
    if (admins && listing) {
      admins.forEach((admin) => {
        supabase.functions.invoke('send-push', {
          body: {
            receiver_id: admin.id,
            sender_name: 'Signalement',
            listing_name: listing.name,
            message_preview: `${REASON_LABELS[reason] ?? reason}`,
            type: 'report',
            listing_id: id,
          },
        }).catch(() => {});
      });
    }
    Alert.alert('Signalement envoyé', 'Merci, notre équipe va examiner cette annonce.');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.root}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.loader}>
          <Text style={styles.errorText}>Annonce introuvable.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const visibleQuestions = isOwner
    ? questions
    : questions.filter((q) => q.answer !== null || q.asker_id === user?.id);

  const images = listing.images ?? [];
  const sellerName = listing.profiles?.username ?? 'Vendeur';
  const publishedAt = new Date(listing.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const condition = listing.condition as AnalysisResult['condition'];
  const tips = listing.selling_tips ?? [];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Carrousel photos */}
        <View style={styles.photoSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
            }
          >
            {images.length > 0 ? images.map((uri, i) => (
              <TouchableOpacity key={i} activeOpacity={1} onPress={() => { setZoomIndex(i); setZoomVisible(true); }}>
                <Image source={{ uri }} style={styles.photo} />
              </TouchableOpacity>
            )) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
              </View>
            )}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
              ))}
            </View>
          )}

          <SafeAreaView style={styles.photoOverlay}>
            <TouchableOpacity style={styles.overlayBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.overlayRight}>
              <TouchableOpacity style={styles.overlayBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              {!isOwner && (
                <TouchableOpacity style={styles.overlayBtn} onPress={handleReport}>
                  <Ionicons name="flag-outline" size={20} color="#fff" />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.overlayBtn} onPress={toggleFavorite}>
                <Ionicons
                  name={isFavorited ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorited ? colors.danger : '#fff'}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Corps */}
        <View style={styles.body}>

          {/* Nom + prix */}
          <Text style={styles.name}>{listing.name}</Text>
          <Text style={styles.price}>{listing.price_final} €</Text>
          {(listing.shipping_price ?? 0) > 0 ? (
            <Text style={styles.shippingLine}>
              + {listing.shipping_price} € de livraison · Total {(listing.price_final + listing.shipping_price!).toFixed(2)} €
            </Text>
          ) : (
            <Text style={styles.shippingLine}>Livraison gratuite</Text>
          )}

          {/* Chips infos */}
          <View style={styles.chips}>
            {!!listing.category && (
              <InfoChip
                label={listing.category}
                onPress={() =>
                  (navigation as any).getParent()?.navigate('Parcourir', {
                    screen: 'BrowseListings',
                    params: { category: listing.category },
                  })
                }
              />
            )}
            {!!listing.era && <InfoChip label={listing.era} />}
            {!!listing.origin && <InfoChip label={listing.origin} />}
          </View>

          {/* État */}
          <View style={styles.row}>
            <ConditionBadge condition={condition} />
            {!!listing.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.locationText}>{listing.location}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Histoire */}
          {!!listing.story && (
            <>
              <Text style={styles.sectionLabel}>Histoire de l'objet</Text>
              <Text style={styles.storyText}>{listing.story}</Text>
              <View style={styles.divider} />
            </>
          )}

          {/* Vendeur */}
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={20} color={colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerName}>{sellerName}</Text>
              <Text style={styles.sellerDate}>Publié le {publishedAt}</Text>
              {sellerRating && (
                <View style={styles.ratingRow}>
                  {[1,2,3,4,5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= Math.round(sellerRating.avg) ? 'star' : 'star-outline'}
                      size={13}
                      color={colors.primary}
                    />
                  ))}
                  <Text style={styles.ratingText}>{sellerRating.avg} ({sellerRating.count} avis)</Text>
                </View>
              )}
            </View>
            {!isOwner && listing.status === 'sold' && !alreadyReviewed && (
              <TouchableOpacity style={styles.reviewBtn} onPress={() => setShowReviewModal(true)}>
                <Text style={styles.reviewBtnText}>Laisser un avis</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Questions / Réponses */}
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>Questions</Text>

          {visibleQuestions.length === 0 && (
            <Text style={styles.qEmpty}>Aucune question pour le moment.</Text>
          )}
          {visibleQuestions.map((q) => (
            <View key={q.id} style={styles.qItem}>
              <View style={styles.qRow}>
                <View style={styles.qAvatar}>
                  <Ionicons name="person" size={12} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qAsker}>{q.profiles?.username ?? 'Utilisateur'}</Text>
                  <Text style={styles.qText}>{q.question}</Text>
                </View>
              </View>
              {q.answer ? (
                <View style={styles.aRow}>
                  <Ionicons name="return-down-forward" size={14} color={colors.primary} />
                  <Text style={styles.aText}>{q.answer}</Text>
                </View>
              ) : isOwner ? (
                answeringId === q.id ? (
                  <View style={styles.aInputRow}>
                    <AppTextInput
                      style={styles.aInput}
                      value={answerText}
                      onChangeText={setAnswerText}
                      placeholder="Votre réponse..."
      
                      multiline
                      autoFocus
                    />
                    <TouchableOpacity style={styles.aSendBtn} onPress={() => submitAnswer(q.id)}>
                      <Ionicons name="send" size={16} color={colors.background} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.replyBtn} onPress={() => { setAnsweringId(q.id); setAnswerText(''); }}>
                    <Text style={styles.replyBtnText}>Répondre</Text>
                  </TouchableOpacity>
                )
              ) : null}
            </View>
          ))}

          {!isOwner && (
            <View style={styles.qInputRow}>
              <AppTextInput
                style={styles.qInput}
                value={newQuestion}
                onChangeText={setNewQuestion}
                placeholder="Poser une question..."

                multiline
                maxLength={300}
              />
              <TouchableOpacity
                style={[styles.qSendBtn, (!newQuestion.trim() || submittingQ) && { opacity: 0.4 }]}
                onPress={submitQuestion}
                disabled={!newQuestion.trim() || submittingQ}
              >
                {submittingQ
                  ? <ActivityIndicator size="small" color={colors.background} />
                  : <Ionicons name="send" size={16} color={colors.background} />
                }
              </TouchableOpacity>
            </View>
          )}

          {/* Autres annonces du vendeur */}
          {sellerListings.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Autres annonces de {sellerName}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sellerListingsScroll}>
                {sellerListings.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.sellerCard}
                    activeOpacity={0.75}
                    onPress={() => navigation.push('Listing', { id: item.id })}
                  >
                    {item.images?.[0] ? (
                      <Image source={{ uri: item.images[0] }} style={styles.sellerCardImg} />
                    ) : (
                      <View style={[styles.sellerCardImg, styles.sellerCardImgPlaceholder]}>
                        <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.sellerCardName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.sellerCardPrice}>{item.price_final} €</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

        </View>
      </ScrollView>

      {/* Modal offre */}
      {showOfferModal && (
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.offerOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowOfferModal(false)} />
          <View style={styles.offerSheet}>
            <Text style={styles.offerTitle}>Faire une offre</Text>
            <Text style={styles.offerSub}>Prix affiché : {listing?.price_final} €</Text>
            <View style={styles.offerInputRow}>
              <AppTextInput
                style={styles.offerInput}
                value={offerAmount}
                onChangeText={setOfferAmount}
                placeholder="Votre offre"

                keyboardType="numeric"
                autoFocus
                maxLength={8}
              />
              <Text style={styles.offerCurrency}>€</Text>
            </View>
            <TouchableOpacity
              style={[styles.offerSendBtn, !offerAmount.trim() && { opacity: 0.4 }]}
              onPress={sendOffer}
              disabled={!offerAmount.trim()}
            >
              <Text style={styles.offerSendText}>Envoyer l'offre</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Modal zoom photo */}
      <Modal visible={zoomVisible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setZoomVisible(false)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={styles.zoomClose} onPress={() => setZoomVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.zoomContent}>
            <ZoomableImage uri={images[zoomIndex]} />
          </View>
          {images.length > 1 && (
            <View style={styles.zoomDots}>
              {images.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setZoomIndex(i)}>
                  <View style={[styles.dot, i === zoomIndex && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Shipping method sheet */}
      {showShippingSheet && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.offerOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowShippingSheet(false)} />
          <View style={styles.shippingSheet}>
            <Text style={styles.shippingSheetTitle}>Mode de livraison</Text>
            {(listing?.shipping_options ?? []).map((opt) => {
              const isSelected = selectedShipping === opt;
              const shippingCost = opt === 'hand' ? 0 : (listing?.shipping_price ?? 0);
              const total = (listing?.price_final ?? 0) + shippingCost;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.shippingSheetRow, isSelected && styles.shippingSheetRowActive]}
                  onPress={() => setSelectedShipping(opt)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shippingSheetRadio, isSelected && styles.shippingSheetRadioActive]}>
                    {isSelected && <View style={styles.shippingSheetRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.shippingSheetLabel, isSelected && { color: colors.textPrimary }]}>
                      {SHIPPING_LABELS[opt] ?? opt}
                    </Text>
                    <Text style={styles.shippingSheetPriceText}>
                      {opt === 'hand' ? 'Gratuit' : `+ ${shippingCost} €`}  ·  Total {total.toFixed(2)} €
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {selectedShipping !== 'hand' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.shippingAddressLabel}>Adresse de livraison</Text>
                <AppTextInput
                  style={styles.shippingAddressInput}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder="Ex : 12 rue de la Paix, 75001 Paris"
  
                  multiline
                />
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.shippingConfirmBtn,
                (buying || (selectedShipping !== 'hand' && !deliveryAddress.trim())) && { opacity: 0.4 },
              ]}
              disabled={buying || (selectedShipping !== 'hand' && !deliveryAddress.trim())}
              onPress={() => {
                setShowShippingSheet(false);
                processPurchase(selectedShipping, selectedShipping !== 'hand' ? deliveryAddress.trim() : undefined);
              }}
            >
              {buying
                ? <ActivityIndicator color={colors.background} size="small" />
                : <Text style={styles.shippingConfirmText}>Confirmer et payer</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {listing && (
        <ReviewModal
          visible={showReviewModal}
          sellerId={listing.seller_id}
          sellerName={sellerName}
          listingId={listing.id}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={() => {
            setShowReviewModal(false);
            setAlreadyReviewed(true);
            loadSellerRating(listing.seller_id);
          }}
        />
      )}

      {/* Barre d'actions */}
      <SafeAreaView style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {isOwner && listing.status === 'sold' ? (
          <View style={[styles.btnSold, { opacity: 0.6 }]}>
            <Text style={styles.btnSoldText}>Article vendu</Text>
          </View>
        ) : isOwner ? (
          <TouchableOpacity
            style={[styles.btnSold, markingAsSold && { opacity: 0.6 }]}
            onPress={markAsSold}
            disabled={markingAsSold}
          >
            {markingAsSold
              ? <ActivityIndicator color={colors.background} />
              : <Text style={styles.btnSoldText}>Marquer comme vendu</Text>
            }
          </TouchableOpacity>
        ) : listing.status === 'sold' ? (
          <View style={[styles.btnSold, { opacity: 0.6 }]}>
            <Text style={styles.btnSoldText}>
              {listing.buyer_id === user?.id ? 'Votre achat' : 'Article vendu'}
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.btnContact}
              onPress={() =>
                navigation.navigate('Chat', {
                  listing_id: listing.id,
                  receiver_id: listing.seller_id,
                  listing_name: listing.name,
                })
              }
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnContact}
              onPress={() => { setOfferAmount(''); setShowOfferModal(true); }}
            >
              <Ionicons name="pricetag-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.btnContactText}>Offre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnBuy, buying && { opacity: 0.6 }]}
              onPress={handleBuy}
              disabled={buying}
            >
              {buying
                ? <ActivityIndicator color={colors.background} size="small" />
                : <Text style={styles.btnBuyText}>Acheter · {((listing.price_final) + (listing.shipping_price ?? 0)).toFixed(2)} €</Text>
              }
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary },
  backBtn: { padding: spacing.base },

  photoSection: { position: 'relative' },
  photo: { width, height: width * 1.05, resizeMode: 'cover' },
  photoPlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  overlayRight: { flexDirection: 'row', gap: 8 },
  overlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 18, backgroundColor: colors.primary },

  body: { paddingHorizontal: spacing.section, paddingTop: spacing.section },
  name: { fontFamily: fonts.serif, fontSize: 28, color: colors.textPrimary, lineHeight: 36, marginBottom: 6 },
  price: { fontFamily: fonts.serif, fontSize: 36, color: colors.primary, marginBottom: 16 },
  shippingLine: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginBottom: 12, marginTop: -10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: colors.chipBackground, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  chipClickable: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(245,184,46,0.3)' },
  chipText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  zoomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center' },
  zoomClose: { position: 'absolute', top: 52, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  zoomContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  zoomDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.surface, marginVertical: spacing.section },
  sectionLabel: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.primaryDim,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  storyText: { fontFamily: fonts.serifRegular, fontSize: 15, color: colors.textPrimary, lineHeight: 24 },
  tipsList: { gap: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 7, flexShrink: 0 },
  tipText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, flex: 1, lineHeight: 21 },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chipBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  sellerDate: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginLeft: 2 },
  reviewBtn: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reviewBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.primary },

  // Autres annonces du vendeur
  sellerListingsScroll: { marginHorizontal: -spacing.section, paddingHorizontal: spacing.section },
  sellerCard: {
    width: 140,
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 10,
  },
  sellerCardImg: { width: 140, height: 140, resizeMode: 'cover' },
  sellerCardImgPlaceholder: { backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' },
  sellerCardName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    padding: 8,
    paddingBottom: 2,
    lineHeight: 18,
  },
  sellerCardPrice: {
    fontFamily: fonts.serif,
    fontSize: 15,
    color: colors.primary,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.section,
    paddingTop: 12,
    paddingBottom: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  btnFav: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  btnContact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnContactText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
  btnBuy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  btnBuyText: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.background },
  btnSold: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 50,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSoldText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },

  // Offer modal
  offerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  offerSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    gap: 14,
  },
  offerTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
  offerSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  offerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  offerInput: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    paddingVertical: 14,
  },
  offerCurrency: { fontFamily: fonts.serif, fontSize: 24, color: colors.primary },
  offerSendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  offerSendText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },

  // Shipping sheet
  shippingSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 10,
  },
  shippingSheetTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, marginBottom: 4 },
  shippingSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  shippingSheetRowActive: { borderColor: colors.primary },
  shippingSheetRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.textSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  shippingSheetRadioActive: { borderColor: colors.primary },
  shippingSheetRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  shippingSheetLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  shippingSheetPriceText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  shippingAddressLabel: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.textDisabled,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
  },
  shippingAddressInput: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.chipBackground, minHeight: 64,
  },
  shippingConfirmBtn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center', marginTop: 6,
  },
  shippingConfirmText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },

  // Q&A
  qEmpty: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  qItem: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8, gap: 8 },
  qRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  qAvatar: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.chipBackground,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  qAsker: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.primary, marginBottom: 2 },
  qText: { fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  aRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingLeft: 34 },
  aText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 19 },
  aInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', paddingLeft: 34 },
  aInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textPrimary,
    maxHeight: 80,
  },
  aSendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  replyBtn: { alignSelf: 'flex-start', marginLeft: 34 },
  replyBtnText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.primary },
  qInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  qInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qSendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
