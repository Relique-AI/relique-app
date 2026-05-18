import { useState, useEffect, useCallback, useRef, Component } from 'react';
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
  Linking,
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
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'; // nécessite un rebuild du dev client
import { colors, fonts, spacing } from '../theme';
import { supabase, Listing } from '../services/supabase';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ConditionBadge } from '../components/ConditionBadge';
import { ReviewModal } from '../components/ReviewModal';
import { AnalysisResult } from '../types';
import { AppTextInput } from '../components/AppTextInput';
import { PaymentFlowSheet } from '../components/PaymentFlowSheet';
import { getShippingCost } from '../utils/shippingRates';
import NotificationPromptModal from '../components/NotificationPromptModal';
import { useNotificationPermission } from '../hooks/useNotificationPermission';

const COMMISSION_RATE = 0.08;

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

class MapErrorBoundary extends Component<{ children: any; fallback?: any }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

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
  const { promptContext, isDenied, promptIfNeeded, onAccept, onDismiss } = useNotificationPermission();
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
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [transaction, setTransaction] = useState<{
    id: string;
    buyer_id: string;
    shipping_status: string | null;
    shipping_method: string | null;
    delivery_address: string | null;
    tracking_number: string | null;
  } | null>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipTrackingInput, setShipTrackingInput] = useState('');
  const [shipping, setShipping] = useState(false);
  const [confirmingReception, setConfirmingReception] = useState(false);
  const [referralCredits, setReferralCredits] = useState(0);
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  type Question = { id: string; asker_id: string; question: string; answer: string | null; created_at: string; profiles: { username: string } | null };
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const isOwner = listing?.seller_id === user?.id;
  const lastLoadedId = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      if (lastLoadedId.current !== id) {
        lastLoadedId.current = id;
        setLoading(true);
        setPhotoIndex(0);
        setSellerListings([]);
        setSimilarListings([]);
        setLocationCoords(null);
        setMapModalVisible(false);
        setQuestions([]);
      }
      loadListing();
      loadFavorite();
      loadQuestions();
    }, [id]),
  );

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
      loadSimilarListings(data.category, data.seller_id);
      if (data.location) geocodeLocation(data.location);
      if (data.status === 'sold') loadTransaction(data.id);
      if (user && data.seller_id !== user.id) loadReferralCredits();
    }
    setLoading(false);
  };

  const loadReferralCredits = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('referral_credits')
      .eq('id', user.id)
      .single();
    setReferralCredits(data?.referral_credits ?? 0);
  };

  const loadTransaction = async (listingId: string) => {
    const { data } = await supabase
      .from('transactions')
      .select('id, buyer_id, shipping_status, shipping_method, delivery_address, tracking_number')
      .eq('listing_id', listingId)
      .maybeSingle();
    setTransaction(data ?? null);
  };

  const confirmReceptionFromListing = () => {
    if (!transaction) return;
    Alert.alert(
      'Confirmer la réception',
      'Confirmez-vous avoir reçu votre commande ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            setConfirmingReception(true);
            try {
              const session = (await supabase.auth.getSession()).data.session;
              const { error } = await supabase.functions.invoke('confirm-reception', {
                body: { transaction_id: transaction.id },
                headers: { Authorization: `Bearer ${session?.access_token}` },
              });
              if (error) throw new Error('Erreur lors de la confirmation');
              setTransaction((prev) => prev ? { ...prev, shipping_status: 'delivered' } : prev);
            } catch (e: any) {
              Alert.alert('Erreur', e.message ?? 'Une erreur est survenue');
            } finally {
              setConfirmingReception(false);
            }
          },
        },
      ],
    );
  };

  const markShippedFromListing = async () => {
    if (!transaction) return;
    setShipping(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { error } = await supabase.functions.invoke('mark-shipped', {
        body: { transaction_id: transaction.id, tracking_number: shipTrackingInput.trim() || null },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw new Error('Erreur lors de la confirmation');
      setShowShipModal(false);
      setTransaction((prev) => prev ? { ...prev, shipping_status: 'shipped', tracking_number: shipTrackingInput.trim() || null } : prev);
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue');
    } finally {
      setShipping(false);
    }
  };

  const geocodeLocation = async (location: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'Pepite-App/1.0' } },
      );
      const json = await res.json();
      if (json?.[0]?.lat) {
        setLocationCoords({ lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) });
      }
    } catch {}
  };

  const loadSimilarListings = async (category: string, sellerId: string) => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('category', category)
      .eq('status', 'active')
      .neq('id', id)
      .neq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setSimilarListings(data as Listing[]);
  };

  const openMaps = () => {
    if (!listing?.location) return;
    const q = encodeURIComponent(listing.location);
    const url = Platform.OS === 'ios' ? `maps://?q=${q}` : `geo:0,0?q=${q}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://maps.google.com/?q=${q}`));
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
      promptIfNeeded('question');
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
    const webLink = `https://pepite-redirect.vercel.app/listing/${listing.id}`;
    await Share.share({
      title: listing.name,
      message:
        `${listing.name} — ${listing.price_final} €\n` +
        `${listing.category} · ${listing.era}\n\n` +
        `Voir cette annonce sur Pépite : ${webLink}`,
    });
  };

  const SHIPPING_LABELS: Record<string, string> = {
    hand: 'Remise en main propre',
    colissimo: 'Colissimo',
    chronopost: 'Chronopost',
  };

  const handleBuy = () => {
    if (!listing || !user) return;
    setShowPaymentFlow(true);
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
          Alert.alert(
            'Achat temporairement indisponible',
            'Ce vendeur n\'a pas encore activé les paiements sur Pépite. Tu peux lui envoyer un message pour l\'en informer ou convenir d\'un arrangement.',
            [
              {
                text: 'Envoyer un message',
                onPress: () => navigation.navigate('Chat', {
                  listing_id: listing.id,
                  receiver_id: listing.seller_id,
                  listing_name: listing.title,
                }),
              },
              { text: 'Fermer', style: 'cancel' },
            ]
          );
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
        // Restore referral credit if it was consumed and payment didn't go through
        if (data.referralCreditUsed) {
          supabase.functions.invoke('restore-referral-credit', {
            body: { payment_intent_id: paymentIntentId },
            headers: { Authorization: `Bearer ${session?.access_token}` },
          }).then(() => setReferralCredits((c) => c + 1)).catch(() => {});
        }
        return;
      }

      supabase.functions.invoke('confirm-purchase', {
        body: { payment_intent_id: paymentIntentId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }).catch(() => {});

      supabase.functions.invoke('generate-label', {
        body: { payment_intent_id: paymentIntentId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      }).catch(() => {});

      promptIfNeeded('purchase');

      if (shippingMethod === 'hand') {
        try {
          await supabase.from('messages').insert({
            listing_id: listing.id,
            sender_id: user.id,
            receiver_id: listing.seller_id,
            type: 'message',
            content: JSON.stringify({ __pepite_type: 'purchase', listing_name: listing.name }),
          });
        } catch {}

        navigation.navigate('Chat', {
          listing_id: listing.id,
          receiver_id: listing.seller_id,
          listing_name: listing.name,
        });
      } else {
        navigation.getParent()?.navigate('Profil', {
          screen: 'Profile',
          params: { initialTab: 'purchases' },
        });
      }
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
    promptIfNeeded('offer');
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

  const listingShippingOpts = (listing.shipping_options ?? []).length > 0
    ? listing.shipping_options!
    : ['hand'];
  const hasPostal = listingShippingOpts.some(o => o !== 'hand');
  const isOversized = listing.parcel_size === 'xl';
  const cheapestPostalCost = hasPostal && !isOversized
    ? Math.min(...listingShippingOpts.filter(o => o !== 'hand').map(o => getShippingCost(o, listing.parcel_size)))
    : 0;
  const baseDisplayPrice = listing.price_final + cheapestPostalCost;
  const grandTotal = Math.round(listing.price_final * (1 + COMMISSION_RATE) * 100) / 100;
  const grandTotalWithShipping = Math.round(baseDisplayPrice * (1 + COMMISSION_RATE) * 100) / 100;

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">

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

        {/* Bannière statut acheteur */}
        {listing.status === 'sold' && transaction != null && transaction.buyer_id === user?.id && (() => {
          const ss = transaction.shipping_status;
          if (ss === 'delivered') return null;
          const isHand = transaction.shipping_method === 'hand';
          const isShipped = ss === 'shipped';
          const bannerStyle = isShipped ? styles.statusBannerShipped : styles.statusBannerPending;
          const bannerColor = isShipped ? '#1a6b3a' : '#7a5200';
          const icon = isShipped ? 'checkmark-circle-outline' : 'time-outline';
          const title = isHand
            ? 'Remise en main propre à convenir'
            : isShipped ? 'Expédié' : 'En attente d\'expédition';
          const sub = isHand
            ? 'Contactez le vendeur pour organiser la remise'
            : isShipped && transaction.tracking_number
              ? `Suivi : ${transaction.tracking_number}`
              : !isShipped ? 'Le vendeur prépare votre colis' : null;
          return (
            <View style={[styles.statusBanner, bannerStyle]}>
              <Ionicons name={icon} size={18} color={bannerColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusBannerTitle, { color: bannerColor }]}>{title}</Text>
                {sub ? <Text style={[styles.statusBannerSub, { color: bannerColor }]}>{sub}</Text> : null}
              </View>
            </View>
          );
        })()}

        {/* Corps */}
        <View style={styles.body}>

          {/* Nom + prix */}
          <Text style={styles.name}>{listing.name}</Text>
          <Text style={styles.price}>{listing.price_final} €</Text>
          {hasPostal && isOversized ? (
            <Text style={styles.shippingLine}>
              Expédition hors gabarit · frais à convenir avec l'acheteur
            </Text>
          ) : hasPostal && cheapestPostalCost > 0 ? (
            <Text style={styles.shippingLine}>
              À partir de {cheapestPostalCost.toFixed(2)} € de livraison · Total dès {grandTotalWithShipping.toFixed(2)} € (frais inclus)
            </Text>
          ) : hasPostal ? (
            <Text style={styles.shippingLine}>
              Livraison offerte · Total {grandTotalWithShipping.toFixed(2)} € (frais Pépite inclus)
            </Text>
          ) : (
            <Text style={styles.shippingLine}>
              Livraison en main propre · Total {grandTotal.toFixed(2)} € (frais Pépite inclus)
            </Text>
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

          {/* Localisation */}
          {!!listing.location && (
            <>
              <Text style={styles.sectionLabel}>Localisation</Text>
              <TouchableOpacity
                style={styles.mapCard}
                onPress={() => locationCoords ? setMapModalVisible(true) : openMaps()}
                activeOpacity={0.85}
              >
                {locationCoords ? (
                  <MapErrorBoundary fallback={<View style={styles.mapPlaceholder}><Ionicons name="map-outline" size={32} color={colors.textSecondary} /></View>}>
                    <MapView
                      style={styles.mapPreview}
                      provider={PROVIDER_DEFAULT}
                      initialRegion={{
                        latitude: locationCoords.lat,
                        longitude: locationCoords.lon,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      pointerEvents="none"
                    >
                      <Marker coordinate={{ latitude: locationCoords.lat, longitude: locationCoords.lon }} />
                    </MapView>
                  </MapErrorBoundary>
                ) : (
                  <View style={styles.mapPlaceholder}>
                    <Ionicons name="map-outline" size={32} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.mapFooter}>
                  <Ionicons name="location" size={14} color={colors.primary} />
                  <Text style={styles.mapLocationText} numberOfLines={1}>{listing.location}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.mapOpenText}>Voir sur la carte</Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
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
                      onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
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
                onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
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

          {/* Objets similaires */}
          {similarListings.length > 0 && (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>Objets similaires</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sellerListingsScroll}>
                {similarListings.map((item) => (
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
      </KeyboardAvoidingView>

      {/* Modal offre */}
      {showOfferModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

      {/* Modal carte plein écran */}
      <Modal visible={mapModalVisible} animationType="slide" onRequestClose={() => setMapModalVisible(false)}>
        <SafeAreaView style={styles.mapModalRoot}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity style={styles.mapModalCloseBtn} onPress={() => setMapModalVisible(false)}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.mapModalTitle} numberOfLines={1}>{listing?.location}</Text>
            <TouchableOpacity style={styles.mapModalOpenBtn} onPress={openMaps}>
              <Ionicons name="open-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          {locationCoords && (
            <MapErrorBoundary fallback={null}>
              <MapView
                style={{ flex: 1 }}
                provider={PROVIDER_DEFAULT}
                initialRegion={{ latitude: locationCoords.lat, longitude: locationCoords.lon, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
              >
                <Marker coordinate={{ latitude: locationCoords.lat, longitude: locationCoords.lon }} />
              </MapView>
            </MapErrorBoundary>
          )}
        </SafeAreaView>
      </Modal>

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

      {/* Parcours de paiement (sélection livraison + récap) */}
      <PaymentFlowSheet
        visible={showPaymentFlow}
        shippingOptions={listingShippingOpts}
        parcelSize={listing.parcel_size}
        basePrice={listing.price_final}
        listingName={listing.name}
        listingCategory={listing.category}
        thumbnail={images[0] ?? null}
        sellerName={sellerName}
        referralCredits={referralCredits}
        buying={buying}
        onConfirm={(shippingMethod, deliveryAddr) => {
          setShowPaymentFlow(false);
          processPurchase(shippingMethod, deliveryAddr);
        }}
        onClose={() => setShowPaymentFlow(false)}
      />


      {/* Modal expédition vendeur */}
      {showShipModal && listing && (() => {
        const carrier = transaction?.shipping_method ?? null;
        const carrierLabel = carrier ? (SHIPPING_LABELS[carrier] ?? carrier) : null;
        const carrierUrl = carrier === 'colissimo' ? 'https://www.colissimo.fr'
          : carrier === 'chronopost' ? 'https://www.chronopost.fr'
          : null;
        const addr = transaction?.delivery_address;
        return (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.offerOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowShipModal(false)} />
            <View style={styles.recapSheet}>
              <Text style={styles.recapTitle}>Expédier l'article</Text>

              {/* Adresse de livraison */}
              {addr ? (
                <View style={styles.shipAddressBox}>
                  <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recapAddressLabel}>Adresse de l'acheteur</Text>
                    <Text style={styles.recapAddressText}>{addr}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.recapDivider} />

              {/* Étapes */}
              <View style={styles.shipSteps}>
                <View style={styles.shipStep}>
                  <View style={styles.shipStepNum}><Text style={styles.shipStepNumText}>1</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shipStepTitle}>Préparer le colis</Text>
                    <Text style={styles.shipStepDesc}>Emballez soigneusement l'article (papier bulle, boîte adaptée). Protégez les éléments fragiles.</Text>
                  </View>
                </View>

                <View style={styles.shipStep}>
                  <View style={styles.shipStepNum}><Text style={styles.shipStepNumText}>2</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shipStepTitle}>
                      Créer l'étiquette{carrierLabel ? ` ${carrierLabel}` : ''}
                    </Text>
                    <Text style={styles.shipStepDesc}>
                      {carrierUrl
                        ? `Rendez-vous sur le site du transporteur pour générer votre étiquette.`
                        : 'Utilisez le site de votre transporteur pour créer l\'étiquette d\'expédition.'}
                    </Text>
                    {carrierUrl ? (
                      <TouchableOpacity onPress={() => Linking.openURL(carrierUrl)} style={styles.shipLinkBtn}>
                        <Ionicons name="open-outline" size={14} color={colors.primary} />
                        <Text style={styles.shipLinkText}>Ouvrir {carrierLabel}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <View style={styles.shipStep}>
                  <View style={styles.shipStepNum}><Text style={styles.shipStepNumText}>3</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shipStepTitle}>Déposer le colis</Text>
                    <Text style={styles.shipStepDesc}>Apportez le colis étiqueté dans un bureau de poste ou point de dépôt agréé.</Text>
                  </View>
                </View>

                <View style={styles.shipStep}>
                  <View style={styles.shipStepNum}><Text style={styles.shipStepNumText}>4</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shipStepTitle}>Confirmer l'expédition</Text>
                    <Text style={styles.shipStepDesc}>Entrez le numéro de suivi (optionnel) pour notifier l'acheteur.</Text>
                    <AppTextInput
                      style={styles.shipTrackingInput}
                      value={shipTrackingInput}
                      onChangeText={setShipTrackingInput}
                      placeholder="Ex : 6X123456789FR"
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.recapPayBtn, shipping && { opacity: 0.5 }]}
                disabled={shipping}
                onPress={markShippedFromListing}
              >
                {shipping
                  ? <ActivityIndicator color={colors.background} size="small" />
                  : <>
                      <Ionicons name="send-outline" size={16} color={colors.background} style={{ marginRight: 8 }} />
                      <Text style={styles.recapPayText}>Confirmer l'expédition</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        );
      })()}

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
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {isOwner && listing.status === 'sold' ? (
          transaction?.shipping_status === 'delivered' ? (
            <View style={[styles.btnSold, { opacity: 0.6 }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.btnSoldText}>Livré · Réception confirmée</Text>
            </View>
          ) : transaction?.shipping_status === 'shipped' ? (
            <View style={[styles.btnSold, { opacity: 0.6 }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.btnSoldText}>Expédié · En attente de réception</Text>
            </View>
          ) : transaction?.shipping_status === 'to_hand' ? (
            <View style={[styles.btnSold, { opacity: 0.6 }]}>
              <Ionicons name="people-outline" size={18} color={colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.btnSoldText}>Remise en main propre à convenir</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.btnBuy}
              onPress={() => { setShipTrackingInput(''); setShowShipModal(true); }}
            >
              <Ionicons name="send-outline" size={18} color={colors.background} style={{ marginRight: 6 }} />
              <Text style={styles.btnBuyText}>Expédier l'article</Text>
            </TouchableOpacity>
          )
        ) : isOwner ? (
          <>
            <TouchableOpacity
              style={styles.btnEdit}
              onPress={() => (navigation as any).push('EditListing', { id })}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              <Text style={styles.btnEditText}>Modifier</Text>
            </TouchableOpacity>
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
          </>
        ) : listing.status === 'sold' ? (
          transaction != null && transaction.buyer_id === user?.id ? (
            transaction.shipping_status === 'delivered' ? (
              <View style={[styles.btnSold, { opacity: 0.6 }]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.background} style={{ marginRight: 6 }} />
                <Text style={styles.btnSoldText}>Réception confirmée</Text>
              </View>
            ) : transaction.shipping_status === 'shipped' || transaction.shipping_status === 'to_hand' ? (
              <TouchableOpacity
                style={[styles.btnBuy, confirmingReception && { opacity: 0.6 }]}
                disabled={confirmingReception}
                onPress={confirmReceptionFromListing}
              >
                {confirmingReception
                  ? <ActivityIndicator color={colors.background} size="small" />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={18} color={colors.background} style={{ marginRight: 6 }} />
                      <Text style={styles.btnBuyText}>
                        {transaction.shipping_status === 'to_hand' ? 'Confirmer la remise' : 'Confirmer la réception'}
                      </Text>
                    </>
                }
              </TouchableOpacity>
            ) : (
              <View style={[styles.btnSold, { opacity: 0.6 }]}>
                <Text style={styles.btnSoldText}>En attente d'expédition</Text>
              </View>
            )
          ) : (
            <View style={[styles.btnSold, { opacity: 0.6 }]}>
              <Text style={styles.btnSoldText}>Article vendu</Text>
            </View>
          )
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
                : <Text style={styles.btnBuyText}>Acheter · {grandTotal.toFixed(2)} €</Text>
              }
            </TouchableOpacity>
          </>
        )}
      <NotificationPromptModal context={promptContext} isDenied={isDenied} onAccept={onAccept} onDismiss={onDismiss} />
      </View>
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

  // Localisation
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  mapPreview: { width: '100%', height: 160 },
  mapPlaceholder: {
    height: 120,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.surface,
  },
  mapLocationText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  mapOpenText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  mapModalRoot: { flex: 1, backgroundColor: colors.background },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    gap: 12,
  },
  mapModalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  mapModalTitle: {
    flex: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  mapModalOpenBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },

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
  btnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnEditText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.primary },
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

  // Ship modal (shared sheet styles — used by the seller expedition modal)
  recapSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 8,
  },
  recapTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, marginBottom: 20 },
  recapDivider: { height: 1, backgroundColor: colors.chipBackground, marginVertical: 14 },
  recapAddressLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.textDisabled, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  recapAddressText: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
  recapPayBtn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    marginTop: 20, marginBottom: 8,
  },
  recapPayText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },

  // Bannière statut acheteur
  statusBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 20, paddingVertical: 14,
  },
  statusBannerPending: { backgroundColor: '#fff8e6' },
  statusBannerShipped: { backgroundColor: '#eaf7ef' },
  statusBannerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  statusBannerSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Modal expédition
  shipAddressBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 4,
  },
  shipSteps: { gap: 16, marginBottom: 4 },
  shipStep: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  shipStepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
  },
  shipStepNumText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.background },
  shipStepTitle: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, marginBottom: 2 },
  shipStepDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  shipLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 6, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.primary, borderRadius: 20,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  shipLinkText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.primary },
  shipTrackingInput: {
    marginTop: 8, backgroundColor: colors.surface, borderRadius: 10,
    padding: 10, fontFamily: fonts.mono, fontSize: 14, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.chipBackground,
  },

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
