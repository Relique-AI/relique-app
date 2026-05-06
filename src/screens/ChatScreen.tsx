import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { colors, fonts, spacing } from '../theme';
import { supabase, Message } from '../services/supabase';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: StackNavigationProp<any, any>;
  route: RouteProp<{ Chat: { listing_id: string; receiver_id: string; listing_name: string } }, 'Chat'>;
};

function formatTime(dateStr: string): string {
  // Ensure timestamp is parsed as UTC
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

export function ChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { listing_id, receiver_id, listing_name } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [listingImage, setListingImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Charger l'image de l'annonce
  useEffect(() => {
    supabase.from('listings').select('images').eq('id', listing_id).single()
      .then(({ data }) => { if (data?.images?.[0]) setListingImage(data.images[0]); });
  }, [listing_id]);

  // Messages + temps réel
  useEffect(() => {
    loadMessages();
    markAsRead();

    const channel = supabase
      .channel(`chat-${listing_id}-${user?.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `listing_id=eq.${listing_id}` },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
            setMessages((prev) => [...prev, msg]);
            if (msg.receiver_id === user?.id) markAsRead();
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listing_id]);

  // Canal indicateur de saisie
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
    if (data) setMessages(data as Message[]);
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender_id === user?.id;
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

        {/* Saisie */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={handleInputChange}
            placeholder="Votre message..."
            placeholderTextColor={colors.textSecondary}
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
  bubbleTimeMine: { color: 'rgba(26,10,11,0.6)', textAlign: 'right' },
  bubbleTimeTheirs: { color: colors.textSecondary },
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
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
