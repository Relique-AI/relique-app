import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  Animated,
  Alert,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing } from '../theme';
import { supabase, Message, Offer, Listing } from '../services/supabase';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useStripe } from '@stripe/stripe-react-native';
import { AppTextInput } from '../components/AppTextInput';

type Props = {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<{ Chat: { listing_id: string; receiver_id: string; listing_name: string } }, 'Chat'>;
};

function formatTime(dateStr: string): string {
  const iso = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 4, paddingVertical: 2 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 3.5,
            backgroundColor: colors.textSecondary,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ImageViewerModal({ uri, onClose }: { uri: string; onClose: () => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      offsetX.value = savedX.value + e.translationX;
      offsetY.value = savedY.value + e.translationY;
    })
    .onEnd(() => {
      savedX.value = offsetX.value;
      savedY.value = offsetY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withSpring(1);
      savedScale.value = 1;
      offsetX.value = withSpring(0);
      offsetY.value = withSpring(0);
      savedX.value = 0;
      savedY.value = 0;
    });

  const gestures = Gesture.Simultaneous(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View style={ivStyles.overlay}>
        <GestureDetector gesture={gestures}>
          <Reanimated.Image
            source={{ uri }}
            style={[ivStyles.image, animStyle]}
            resizeMode="contain"
          />
        </GestureDetector>
        <TouchableOpacity style={ivStyles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const ivStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});

const SHIPPING_LABELS: Record<string, string> = {
  hand: 'Remise en main propre',
  relay: 'Mondial Relay',
  colissimo: 'Colissimo',
  chronopost: 'Chronopost',
};

export function ChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { listing_id, receiver_id, listing_name } = route.params;
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [listingImage, setListingImage] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [offerDetails, setOfferDetails] = useState<Record<string, Offer>>({});
  const [buying, setBuying] = useState(false);

  // Counter-offer modal state
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterTargetOfferId, setCounterTargetOfferId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');

  const [sendingImage, setSendingImage] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Shipping sheet for offer payment
  const [showShippingSheet, setShowShippingSheet] = useState(false);
  const [pendingPayOffer, setPendingPayOffer] = useState<Offer | null>(null);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isBuyer = listing !== null && listing.seller_id !== user?.id;

  // Load full listing data (needed for shipping options and seller_id)
  useEffect(() => {
    supabase
      .from('listings')
      .select('*')
      .eq('id', listing_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setListing(data as Listing);
          if (data.images?.[0]) setListingImage(data.images[0]);
        }
      });
  }, [listing_id]);

  // Messages + real-time subscriptions
  useEffect(() => {
    loadMessages();
    markAsRead();

    // Use a unique suffix per mount so Supabase never returns a cached
    // already-subscribed channel when navigating back to this screen.
    const ts = Date.now();

    const msgChannel = supabase
      .channel(`chat-${listing_id}-${ts}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `listing_id=eq.${listing_id}` },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
            setMessages((prev) => [...prev, msg]);
            if (msg.receiver_id === user?.id) markAsRead();
            if (msg.type === 'offer' && msg.offer_id) {
              supabase.from('offers').select('*').eq('id', msg.offer_id).single()
                .then(({ data }) => {
                  if (data) setOfferDetails((prev) => ({ ...prev, [data.id]: data as Offer }));
                });
            }
          }
        },
      )
      .subscribe();

    // Real-time offer status updates (accept/decline/counter)
    const offersChannel = supabase
      .channel(`offers-${listing_id}-${ts}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'offers', filter: `listing_id=eq.${listing_id}` },
        (payload) => {
          const offer = payload.new as Offer;
          setOfferDetails((prev) => ({ ...prev, [offer.id]: offer }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(offersChannel);
    };
  }, [listing_id]);

  // Typing indicator channel
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`typing-${listing_id}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.user_id !== user.id) {
          setIsOtherTyping(true);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();
    typingChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [listing_id, user?.id]);

  const loadMessages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('listing_id', listing_id)
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),` +
        `and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`,
      )
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as Message[]);
      const offerIds = (data as Message[])
        .filter((m) => m.type === 'offer' && m.offer_id)
        .map((m) => m.offer_id!);
      if (offerIds.length > 0) {
        const { data: offers } = await supabase.from('offers').select('*').in('id', offerIds);
        if (offers) {
          setOfferDetails(Object.fromEntries((offers as Offer[]).map((o) => [o.id, o])));
        }
      }
    }
    setLoading(false);
  };

  const markAsRead = async () => {
    if (!user) return;
    await supabase.from('messages').update({ read: true })
      .eq('listing_id', listing_id).eq('receiver_id', user.id).eq('read', false);
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    if (text && typingChannelRef.current) {
      typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: user?.id } });
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !user || sending) return;
    setInput('');
    setSending(true);

    await supabase.from('messages').insert({ listing_id, sender_id: user.id, receiver_id, content: text });

    const { data: senderProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    supabase.functions.invoke('send-push', {
      body: {
        receiver_id,
        sender_name: senderProfile?.username ?? 'Quelqu\'un',
        listing_name,
        message_preview: text.length > 60 ? text.slice(0, 60) + '…' : text,
        type: 'message',
        listing_id,
        sender_id: user.id,
      },
    }).catch(() => {});

    setSending(false);
  };

  const pickAndSendImage = async (source: 'camera' | 'library') => {
    if (!user || sendingImage) return;

    let result: ImagePicker.ImagePickerResult;
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la caméra est nécessaire.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès à la galerie est nécessaire.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    }

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const uri = result.assets[0].uri;
    setSendingImage(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error('Non authentifié');

      const fileName = `chat/${user.id}/${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', { uri, type: 'image/jpeg', name: `${Date.now()}.jpg` } as any);

      const uploadUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/listing-images/${fileName}`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload échoué : ${await res.text().catch(() => '')}`);

      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);

      await supabase.from('messages').insert({
        listing_id,
        sender_id: user.id,
        receiver_id,
        content: urlData.publicUrl,
        type: 'image',
      });

      const { data: senderProfile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      supabase.functions.invoke('send-push', {
        body: {
          receiver_id,
          sender_name: senderProfile?.username ?? 'Quelqu\'un',
          listing_name,
          message_preview: '📷 Photo',
          type: 'message',
          listing_id,
          sender_id: user.id,
        },
      }).catch(() => {});
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible d\'envoyer la photo');
    } finally {
      setSendingImage(false);
    }
  };

  const handlePhotoPress = () => {
    Alert.alert(
      'Envoyer une photo',
      undefined,
      [
        { text: 'Prendre une photo', onPress: () => pickAndSendImage('camera') },
        { text: 'Choisir depuis la galerie', onPress: () => pickAndSendImage('library') },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  // ── Offer actions ──────────────────────────────────────────────────────────

  const handleAcceptOffer = async (offer: Offer) => {
    setOfferDetails((prev) => ({ ...prev, [offer.id]: { ...offer, status: 'accepted' } }));
    await supabase.from('offers')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', offer.id);
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user!.id).single();
    supabase.functions.invoke('send-push', {
      body: {
        receiver_id: offer.buyer_id,
        sender_name: profile?.username ?? 'Vendeur',
        listing_name,
        message_preview: `Offre de ${offer.amount} € acceptée ✓`,
        type: 'offer_accepted',
        listing_id,
        sender_id: user!.id,
      },
    }).catch(() => {});
  };

  const handleDeclineOffer = async (offer: Offer) => {
    setOfferDetails((prev) => ({ ...prev, [offer.id]: { ...offer, status: 'declined' } }));
    await supabase.from('offers')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', offer.id);
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user!.id).single();
    supabase.functions.invoke('send-push', {
      body: {
        receiver_id: offer.buyer_id,
        sender_name: profile?.username ?? 'Vendeur',
        listing_name,
        message_preview: `Offre de ${offer.amount} € refusée`,
        type: 'offer_declined',
        listing_id,
        sender_id: user!.id,
      },
    }).catch(() => {});
  };

  const openCounterModal = (offerId: string) => {
    setCounterTargetOfferId(offerId);
    setCounterAmount('');
    setShowCounterModal(true);
  };

  const handleCounter = async () => {
    if (!user || !counterTargetOfferId || !counterAmount.trim()) return;
    const amount = parseFloat(counterAmount.trim().replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;
    const original = offerDetails[counterTargetOfferId];
    if (!original) return;

    setShowCounterModal(false);

    // Optimistic: disable actions on the original offer immediately
    setOfferDetails((prev) => ({ ...prev, [counterTargetOfferId]: { ...original, status: 'countered' } }));

    // Mark original as countered
    await supabase.from('offers')
      .update({ status: 'countered', updated_at: new Date().toISOString() })
      .eq('id', counterTargetOfferId);

    // Create counter offer (buyer/seller roles stay the same as on the listing)
    const { data: newOffer } = await supabase
      .from('offers')
      .insert({
        listing_id,
        buyer_id: original.buyer_id,
        seller_id: original.seller_id,
        amount,
        status: 'pending',
        parent_offer_id: counterTargetOfferId,
      })
      .select()
      .single();

    if (!newOffer) return;

    const otherParty = user.id === original.seller_id ? original.buyer_id : original.seller_id;

    await supabase.from('messages').insert({
      listing_id,
      sender_id: user.id,
      receiver_id: otherParty,
      content: `Contre-offre de ${amount} €`,
      type: 'offer',
      offer_id: newOffer.id,
    });

    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
    supabase.functions.invoke('send-push', {
      body: {
        receiver_id: otherParty,
        sender_name: profile?.username ?? 'Utilisateur',
        listing_name,
        message_preview: `Contre-offre de ${amount} €`,
        type: 'offer_counter',
        listing_id,
        sender_id: user.id,
      },
    }).catch(() => {});

    setCounterTargetOfferId(null);
  };

  // ── Payment ────────────────────────────────────────────────────────────────

  const handlePayOffer = (offer: Offer) => {
    const options = listing?.shipping_options ?? ['hand'];
    const hasPostal = options.some((o) => o !== 'hand');
    if (!hasPostal) {
      processOfferPurchase(offer, 'hand', undefined);
      return;
    }
    setPendingPayOffer(offer);
    setSelectedShipping(options[0]);
    setDeliveryAddress('');
    setShowShippingSheet(true);
  };

  const processOfferPurchase = async (offer: Offer, shippingMethod: string, deliveryAddr: string | undefined) => {
    setBuying(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          listing_id,
          offer_id: offer.id,
          shipping_method: shippingMethod,
          ...(deliveryAddr ? { delivery_address: deliveryAddr } : {}),
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });

      if (error) {
        let errMsg = 'Impossible de lancer le paiement.';
        try {
          const ctx = (error as any).context;
          const body = typeof ctx?.json === 'function' ? await ctx.json() : ctx;
          if (body?.error) errMsg = body.error;
        } catch {}
        Alert.alert('Erreur', errMsg);
        return;
      }
      if (!data?.clientSecret) throw new Error('Erreur paiement');

      const paymentIntentId = data.clientSecret.split('_secret_')[0];

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Pépite',
        paymentIntentClientSecret: data.clientSecret,
        defaultBillingDetails: { email: user?.email },
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

      supabase.functions.invoke('generate-label', {
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderOfferBubble = (message: Message) => {
    const isMine = message.sender_id === user?.id;
    const offer = message.offer_id ? offerDetails[message.offer_id] : null;

    if (!offer) {
      return (
        <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
          <View style={[styles.offerBubble, isMine ? styles.offerBubbleMine : styles.offerBubbleTheirs]}>
            <ActivityIndicator size="small" color={isMine ? colors.background : colors.primary} />
          </View>
        </View>
      );
    }

    const isPending = offer.status === 'pending';
    const isAccepted = offer.status === 'accepted';
    const isDeclined = offer.status === 'declined';
    const isCountered = offer.status === 'countered';
    const canAct = !isMine && isPending;
    const isCounter = !!offer.parent_offer_id;

    const labelText = isMine
      ? (isCounter ? 'Votre contre-offre' : 'Votre offre')
      : (isCounter ? 'Contre-offre reçue' : 'Offre reçue');

    return (
      <View style={styles.offerBubbleRow}>
        <View style={[styles.offerBubble, isMine ? styles.offerBubbleMine : styles.offerBubbleTheirs]}>

          <View style={styles.offerHeader}>
            <Ionicons name="pricetag" size={12} color={isMine ? 'rgba(11,9,7,0.5)' : colors.primary} />
            <Text style={[styles.offerLabel, isMine ? styles.offerLabelMine : styles.offerLabelTheirs]}>
              {labelText}
            </Text>
          </View>

          <Text style={[styles.offerAmount, isMine ? styles.offerAmountMine : styles.offerAmountTheirs]}>
            {offer.amount} €
          </Text>

          {isPending && isMine && (
            <View style={styles.offerStatusRow}>
              <Ionicons name="time-outline" size={13} color="rgba(11,9,7,0.5)" />
              <Text style={[styles.offerStatusText, styles.offerStatusOnPrimary]}>
                En attente de réponse
              </Text>
            </View>
          )}

          {isAccepted && (
            <View style={styles.offerStatusRow}>
              <Ionicons name="checkmark-circle" size={13} color={isMine ? 'rgba(11,9,7,0.5)' : colors.success} />
              <Text style={[styles.offerStatusText, isMine ? styles.offerStatusOnPrimary : { color: colors.success }]}>
                Acceptée
              </Text>
            </View>
          )}
          {isDeclined && (
            <View style={styles.offerStatusRow}>
              <Ionicons name="close-circle" size={13} color={isMine ? 'rgba(11,9,7,0.5)' : colors.danger} />
              <Text style={[styles.offerStatusText, isMine ? styles.offerStatusOnPrimary : { color: colors.danger }]}>
                Refusée
              </Text>
            </View>
          )}
          {isCountered && (
            <View style={styles.offerStatusRow}>
              <Ionicons name="arrow-redo" size={13} color={isMine ? 'rgba(11,9,7,0.5)' : colors.textSecondary} />
              <Text style={[styles.offerStatusText, isMine ? styles.offerStatusOnPrimary : { color: colors.textSecondary }]}>
                {isMine ? 'Contre-offre reçue' : 'Contre-offre envoyée'}
              </Text>
            </View>
          )}

          {/* Action buttons — only for receiver of a pending offer */}
          {canAct && (
            <View style={styles.offerActions}>
              <TouchableOpacity
                style={styles.offerAcceptBtn}
                onPress={() =>
                  Alert.alert(
                    'Accepter cette offre ?',
                    `Vous confirmez l'acceptation de l'offre à ${offer.amount} €.`,
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Accepter', onPress: () => handleAcceptOffer(offer) },
                    ],
                  )
                }
              >
                <Ionicons name="checkmark" size={14} color={colors.background} />
                <Text style={styles.offerAcceptText}>Accepter</Text>
              </TouchableOpacity>
              <View style={styles.offerSecondaryRow}>
                <TouchableOpacity
                  style={styles.offerSecondaryBtn}
                  onPress={() =>
                    Alert.alert(
                      'Refuser cette offre ?',
                      `L'acheteur sera informé du refus de son offre à ${offer.amount} €.`,
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { text: 'Refuser', style: 'destructive', onPress: () => handleDeclineOffer(offer) },
                      ],
                    )
                  }
                >
                  <Text style={styles.offerSecondaryText}>Refuser</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.offerSecondaryBtn} onPress={() => openCounterModal(offer.id)}>
                  <Text style={styles.offerSecondaryText}>Contre-offre</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Pay button — buyer only, when offer is accepted */}
          {isAccepted && isBuyer && (
            <TouchableOpacity
              style={[
                styles.offerPayBtn,
                isMine ? styles.offerPayBtnOnPrimary : styles.offerPayBtnOnSurface,
                buying && { opacity: 0.6 },
              ]}
              onPress={() => handlePayOffer(offer)}
              disabled={buying}
            >
              {buying
                ? <ActivityIndicator size="small" color={isMine ? colors.primary : colors.background} />
                : (
                  <>
                    <Ionicons name="card-outline" size={14} color={isMine ? colors.primary : colors.background} />
                    <Text style={[styles.offerPayText, isMine ? styles.offerPayTextOnPrimary : styles.offerPayTextOnSurface]}>
                      Payer {offer.amount} €
                    </Text>
                  </>
                )
              }
            </TouchableOpacity>
          )}

          <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
            {formatTime(message.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === 'offer') return renderOfferBubble(item);
    const isMine = item.sender_id === user?.id;
    if (item.type === 'image') {
      return (
        <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setViewingImage(item.content)}>
            <Image source={{ uri: item.content }} style={styles.imageBubble} resizeMode="cover" />
            <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs, { paddingHorizontal: 4 }]}>
              {formatTime(item.created_at)}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{listing_name}</Text>
          <Text style={styles.headerSub}>Conversation</Text>
        </View>
        <TouchableOpacity
          style={styles.headerThumb}
          onPress={() => navigation.navigate('Listing', { id: listing_id })}
          activeOpacity={0.75}
        >
          {listingImage ? (
            <Image source={{ uri: listingImage }} style={styles.headerThumbImg} />
          ) : (
            <View style={[styles.headerThumb, { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }]}>
              <Ionicons name="image-outline" size={18} color={colors.textSecondary} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={40} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Démarrez la conversation !</Text>
              </View>
            }
            ListFooterComponent={
              isOtherTyping ? (
                <View style={[styles.bubbleRow, styles.bubbleRowLeft, { marginBottom: 8 }]}>
                  <View style={[styles.bubble, styles.bubbleTheirs]}>
                    <TypingDots />
                  </View>
                </View>
              ) : null
            }
          />
        )}

        {/* Text input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={styles.photoBtn} onPress={handlePhotoPress} disabled={sendingImage}>
            {sendingImage
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
            }
          </TouchableOpacity>
          <AppTextInput
            style={styles.input}
            value={input}
            onChangeText={handleInputChange}
            placeholder="Votre message..."

            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color={colors.background} size="small" />
              : <Ionicons name="send" size={18} color={colors.background} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Counter-offer modal */}
      {showCounterModal && (
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowCounterModal(false)} />
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Contre-offre</Text>
            <Text style={styles.modalSub}>Prix affiché : {listing?.price_final} €</Text>
            <View style={styles.modalInputRow}>
              <AppTextInput
                style={styles.modalInput}
                value={counterAmount}
                onChangeText={setCounterAmount}
                placeholder="Votre montant"
    
                keyboardType="numeric"
                autoFocus
                maxLength={8}
              />
              <Text style={styles.modalCurrency}>€</Text>
            </View>
            <TouchableOpacity
              style={[styles.modalSendBtn, !counterAmount.trim() && { opacity: 0.4 }]}
              onPress={handleCounter}
              disabled={!counterAmount.trim()}
            >
              <Text style={styles.modalSendText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Shipping sheet for offer payment */}
      {showShippingSheet && pendingPayOffer && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowShippingSheet(false)} />
          <View style={styles.shippingSheet}>
            <Text style={styles.shippingSheetTitle}>Mode de livraison</Text>
            {(listing?.shipping_options ?? []).map((opt) => {
              const isSelected = selectedShipping === opt;
              const shippingCost = opt === 'hand' ? 0 : (listing?.shipping_price ?? 0);
              const total = pendingPayOffer.amount + shippingCost;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.shippingSheetRow, isSelected && styles.shippingSheetRowActive]}
                  onPress={() => setSelectedShipping(opt)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shippingRadio, isSelected && styles.shippingRadioActive]}>
                    {isSelected && <View style={styles.shippingRadioDot} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.shippingLabel, isSelected && { color: colors.textPrimary }]}>
                      {SHIPPING_LABELS[opt] ?? opt}
                    </Text>
                    <Text style={styles.shippingPriceText}>
                      {opt === 'hand' ? 'Gratuit' : `+ ${shippingCost} €`} · Total {total.toFixed(2)} €
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
                processOfferPurchase(
                  pendingPayOffer,
                  selectedShipping,
                  selectedShipping !== 'hand' ? deliveryAddress.trim() : undefined,
                );
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
      {viewingImage && (
        <ImageViewerModal uri={viewingImage} onClose={() => setViewingImage(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  headerSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  headerThumb: { width: 42, height: 42, borderRadius: 10, overflow: 'hidden' },
  headerThumbImg: { width: 42, height: 42, resizeMode: 'cover' },

  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: spacing.base, gap: 8, flexGrow: 1, justifyContent: 'flex-end' },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },

  // Regular chat bubbles
  bubbleRow: { flexDirection: 'row', marginVertical: 2 },
  bubbleRowRight: { justifyContent: 'flex-end' },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: fonts.body, fontSize: 15, lineHeight: 21 },
  bubbleTextMine: { color: colors.background },
  bubbleTextTheirs: { color: colors.textPrimary },
  bubbleTime: { fontFamily: fonts.body, fontSize: 10, marginTop: 4 },
  bubbleTimeMine: { color: 'rgba(11,9,7,0.45)', textAlign: 'right' },
  bubbleTimeTheirs: { color: colors.textSecondary },

  // Offer bubbles
  offerBubbleRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  offerBubble: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 2,
  },
  offerBubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  offerBubbleTheirs: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  offerHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  offerLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  offerLabelMine: { color: 'rgba(11,9,7,0.5)' },
  offerLabelTheirs: { color: colors.primary },
  offerAmount: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  offerAmountMine: { color: colors.background },
  offerAmountTheirs: { color: colors.textPrimary },
  offerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  offerStatusText: { fontFamily: fonts.body, fontSize: 12 },
  offerStatusOnPrimary: { color: 'rgba(11,9,7,0.5)' },

  // Offer action buttons (on surface bubble)
  offerActions: { marginTop: 12, gap: 8 },
  offerAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 11,
  },
  offerAcceptText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.background },
  offerSecondaryRow: { flexDirection: 'row', gap: 8 },
  offerSecondaryBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 50,
    backgroundColor: colors.chipBackground,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  offerSecondaryText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },

  // Pay button (adapts to bubble background)
  offerPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    borderRadius: 50,
    paddingVertical: 11,
  },
  offerPayBtnOnPrimary: { backgroundColor: colors.background },
  offerPayBtnOnSurface: { backgroundColor: colors.primary },
  offerPayText: { fontFamily: fonts.bodySemiBold, fontSize: 14 },
  offerPayTextOnPrimary: { color: colors.primary },
  offerPayTextOnSurface: { color: colors.background },

  // Text input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.chipBackground,
  },
  photoBtn: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  imageBubble: {
    width: 220, height: 180, borderRadius: 16,
  },

  // Counter-offer modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
    gap: 14,
  },
  modalTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
  modalSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalInput: {
    flex: 1,
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    paddingVertical: 14,
  },
  modalCurrency: { fontFamily: fonts.serif, fontSize: 24, color: colors.primary },
  modalSendBtn: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalSendText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },

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
  shippingRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.textSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  shippingRadioActive: { borderColor: colors.primary },
  shippingRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  shippingLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  shippingPriceText: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
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
});
