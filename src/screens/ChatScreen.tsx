import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MarketStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase, Message } from '../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: StackNavigationProp<MarketStackParamList, 'Chat'>;
  route: RouteProp<MarketStackParamList, 'Chat'>;
};

export function ChatScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { listing_id, receiver_id, listing_name } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    markAsRead();

    // Souscription temps réel
    const channel = supabase
      .channel(`chat-${listing_id}-${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `listing_id=eq.${listing_id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          // N'ajouter que si le message concerne cet utilisateur
          if (msg.sender_id === user?.id || msg.receiver_id === user?.id) {
            setMessages((prev) => [...prev, msg]);
            if (msg.receiver_id === user?.id) markAsRead();
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listing_id]);

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
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('listing_id', listing_id)
      .eq('receiver_id', user.id)
      .eq('read', false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !user || sending) return;
    setInput('');
    setSending(true);
    await supabase.from('messages').insert({
      listing_id,
      sender_id: user.id,
      receiver_id,
      content: text,
    });
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
            {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
        <View style={{ width: 48 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
          />
        )}

        {/* Saisie */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 10 }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
