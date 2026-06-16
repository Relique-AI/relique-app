import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import { colors, fonts, spacing } from '../theme';
import { supabase } from '../services/supabase';

type Props = {
  navigation: StackNavigationProp<ProfileStackParamList, 'Admin'>;
};

type Report = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  listing_id: string;
  reporter_id: string;
  listing_name: string;
  listing_image: string | null;
  reporter_username: string | null;
};

type Dispute = {
  id: string;
  transaction_id: string;
  listing_id: string;
  reason: string;
  description: string;
  status: string;
  amount: number;
  created_at: string;
  listing_name: string;
  listing_image: string | null;
  buyer_username: string | null;
  seller_username: string | null;
};

const REASON_LABELS: Record<string, string> = {
  inappropriate: 'Contenu inapproprié',
  scam: 'Arnaque / Fraude',
  prohibited: 'Objet interdit',
};

const DISPUTE_REASON_LABELS: Record<string, string> = {
  not_received: 'Objet non reçu',
  not_as_described: 'Non conforme',
  damaged: 'Endommagé',
  other: 'Autre',
};

const DISPUTE_STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  under_review: 'En cours d\'analyse',
  resolved_buyer: 'Résolu — acheteur',
  resolved_seller: 'Résolu — vendeur',
  closed: 'Clôturé',
};

export function AdminScreen({ navigation }: Props) {
  const [tab, setTab] = useState<'reports' | 'disputes'>('reports');
  const [partialRefundModal, setPartialRefundModal] = useState<{ dispute: Dispute } | null>(null);
  const [partialRefundInput, setPartialRefundInput] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    const { data } = await supabase
      .from('reports')
      .select(`
        id, reason, status, created_at, listing_id, reporter_id,
        listings(name, images),
        profiles(username)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) {
      setReports(data.map((r: any) => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        created_at: r.created_at,
        listing_id: r.listing_id,
        reporter_id: r.reporter_id,
        listing_name: r.listings?.name ?? 'Annonce supprimée',
        listing_image: r.listings?.images?.[0] ?? null,
        reporter_username: r.profiles?.username ?? 'Anonyme',
      })));
    }
  };

  const loadDisputes = async () => {
    const { data } = await supabase
      .from('disputes')
      .select(`
        id, transaction_id, listing_id, reason, description, status, created_at,
        listings(name, images),
        transactions(amount),
        buyer:profiles!disputes_buyer_id_fkey(username),
        seller:profiles!disputes_seller_id_fkey(username)
      `)
      .in('status', ['open', 'under_review'])
      .order('created_at', { ascending: false });

    if (data) {
      setDisputes(data.map((d: any) => ({
        id: d.id,
        transaction_id: d.transaction_id,
        listing_id: d.listing_id,
        reason: d.reason,
        description: d.description,
        status: d.status,
        amount: d.transactions?.amount ?? 0,
        created_at: d.created_at,
        listing_name: d.listings?.name ?? 'Annonce supprimée',
        listing_image: d.listings?.images?.[0] ?? null,
        buyer_username: d.buyer?.username ?? 'Inconnu',
        seller_username: d.seller?.username ?? 'Inconnu',
      })));
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadReports(), loadDisputes()]);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  const dismissReport = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke('admin-moderate', {
      body: { action: 'dismiss', reportId: id },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (error) { Alert.alert('Erreur', 'Impossible d\'ignorer ce signalement.'); return; }
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const removeListing = async (reportId: string, listingId: string) => {
    Alert.alert(
      'Supprimer l\'annonce',
      'L\'annonce sera retirée du marché. Confirmer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const report = reports.find((r) => r.id === reportId);
            const { data: { session } } = await supabase.auth.getSession();
            const { error } = await supabase.functions.invoke('admin-moderate', {
              body: { action: 'remove', reportId, listingId },
              headers: { Authorization: `Bearer ${session?.access_token}` },
            });
            if (error) { Alert.alert('Erreur', 'Impossible de supprimer cette annonce.'); return; }

            if (report) {
              const reason = REASON_LABELS[report.reason] ?? report.reason;
              const { data: listing } = await supabase.from('listings').select('seller_id, name').eq('id', listingId).single();
              if (listing) {
                supabase.functions.invoke('send-push', {
                  body: {
                    receiver_id: listing.seller_id,
                    sender_name: 'Pépite',
                    listing_name: listing.name,
                    message_preview: `Votre annonce a été retirée suite à un signalement : ${reason}.`,
                    type: 'moderation',
                  },
                }).catch(() => {});
              }
              supabase.functions.invoke('send-push', {
                body: {
                  receiver_id: report.reporter_id,
                  sender_name: 'Pépite',
                  listing_name: report.listing_name,
                  message_preview: `L'annonce que vous avez signalée a bien été retirée. Merci.`,
                  type: 'moderation',
                },
              }).catch(() => {});
            }

            setReports((prev) => prev.filter((r) => r.listing_id !== listingId));
          },
        },
      ],
    );
  };

  const markUnderReview = async (dispute: Dispute) => {
    const { error } = await supabase
      .from('disputes')
      .update({ status: 'under_review' })
      .eq('id', dispute.id);
    if (error) { Alert.alert('Erreur', 'Impossible de mettre en examen.'); return; }
    setDisputes((prev) => prev.map((d) => d.id === dispute.id ? { ...d, status: 'under_review' } : d));
  };

  const resolveDispute = async (dispute: Dispute, action: 'full_refund' | 'partial_refund' | 'close_seller', prefilledAmount?: number) => {
    const execute = async (refundAmount?: number, adminNote?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('resolve-dispute', {
        body: {
          dispute_id: dispute.id,
          action,
          refund_amount: refundAmount,
          admin_note: adminNote,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error || data?.error) {
        Alert.alert('Erreur', data?.error ?? error?.message ?? 'Une erreur est survenue.');
        return;
      }
      setDisputes((prev) => prev.filter((d) => d.id !== dispute.id));
      Alert.alert('Succès', 'Le litige a été résolu.');
    };

    if (action === 'full_refund') {
      Alert.alert(
        'Remboursement total',
        `Rembourser ${(dispute.amount / 100).toFixed(2)} € à l'acheteur pour « ${dispute.listing_name} » ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Confirmer', onPress: () => execute(undefined, undefined) },
        ],
      );
    } else if (action === 'partial_refund') {
      if (prefilledAmount !== undefined) {
        execute(prefilledAmount, undefined);
      } else {
        setPartialRefundInput('');
        setPartialRefundModal({ dispute });
      }
    } else {
      Alert.alert(
        'Clore en faveur du vendeur',
        `Le litige pour « ${dispute.listing_name} » sera clôturé en faveur du vendeur. Aucun remboursement.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Confirmer', style: 'destructive', onPress: () => execute() },
        ],
      );
    }
  };

  const renderReport = ({ item }: { item: Report }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.listing_image ? (
          <Image source={{ uri: item.listing_image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.listingName} numberOfLines={1}>{item.listing_name}</Text>
          <Text style={styles.meta}>
            Signalé par <Text style={{ color: colors.textPrimary }}>{item.reporter_username}</Text>
          </Text>
          <Text style={styles.meta}>
            {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
        </View>
      </View>

      <View style={styles.reasonBadge}>
        <Ionicons name="flag" size={13} color={colors.danger} />
        <Text style={styles.reasonText}>{REASON_LABELS[item.reason] ?? item.reason}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnDismiss} onPress={() => dismissReport(item.id)} activeOpacity={0.75}>
          <Text style={styles.btnDismissText}>Ignorer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnRemove}
          onPress={() => removeListing(item.id, item.listing_id)}
          activeOpacity={0.75}
        >
          <Ionicons name="trash-outline" size={15} color="#fff" />
          <Text style={styles.btnRemoveText}>Supprimer l'annonce</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDispute = ({ item }: { item: Dispute }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.listing_image ? (
          <Image source={{ uri: item.listing_image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.listingName} numberOfLines={1}>{item.listing_name}</Text>
          <Text style={styles.meta}>
            {(item.amount / 100).toFixed(2)} € · {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </Text>
          <Text style={styles.meta}>
            Acheteur : <Text style={{ color: colors.textPrimary }}>{item.buyer_username}</Text>
            {'  '}Vendeur : <Text style={{ color: colors.textPrimary }}>{item.seller_username}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.disputeReasonRow}>
        <View style={styles.reasonBadge}>
          <Ionicons name="alert-circle" size={13} color={colors.primary} />
          <Text style={[styles.reasonText, { color: colors.primary }]}>
            {DISPUTE_REASON_LABELS[item.reason] ?? item.reason}
          </Text>
        </View>
        <Text style={styles.statusBadge}>{DISPUTE_STATUS_LABELS[item.status] ?? item.status}</Text>
      </View>

      <Text style={styles.disputeDesc} numberOfLines={4}>{item.description}</Text>

      {item.status === 'open' && (
        <TouchableOpacity
          style={styles.btnUnderReview}
          onPress={() => markUnderReview(item)}
          activeOpacity={0.75}
        >
          <Ionicons name="search-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.btnUnderReviewText}>Mettre en analyse</Text>
        </TouchableOpacity>
      )}
      <View style={styles.disputeActions}>
        <TouchableOpacity
          style={styles.btnRefundFull}
          onPress={() => resolveDispute(item, 'full_refund')}
          activeOpacity={0.75}
        >
          <Text style={styles.btnRefundText}>Remb. total</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnRefundPartial}
          onPress={() => resolveDispute(item, 'partial_refund')}
          activeOpacity={0.75}
        >
          <Text style={styles.btnRefundText}>Remb. partiel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnCloseSeller}
          onPress={() => resolveDispute(item, 'close_seller')}
          activeOpacity={0.75}
        >
          <Text style={styles.btnCloseSellerText}>Vendeur</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const currentData = tab === 'reports' ? reports : disputes;
  const isEmpty = currentData.length === 0;
  const emptyMsg = tab === 'reports' ? 'Aucun signalement en attente' : 'Aucun litige en cours';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Modération</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'reports' && styles.tabBtnActive]}
          onPress={() => setTab('reports')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabLabel, tab === 'reports' && styles.tabLabelActive]}>
            Signalements {reports.length > 0 ? `(${reports.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'disputes' && styles.tabBtnActive]}
          onPress={() => setTab('disputes')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabLabel, tab === 'disputes' && styles.tabLabelActive]}>
            Litiges {disputes.length > 0 ? `(${disputes.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : isEmpty ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✦</Text>
          <Text style={styles.emptyText}>{emptyMsg}</Text>
        </View>
      ) : tab === 'reports' ? (
        <FlatList
          data={reports}
          keyExtractor={(r) => r.id}
          renderItem={renderReport}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(d) => d.id}
          renderItem={renderDispute}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal remboursement partiel */}
      <Modal visible={!!partialRefundModal} transparent animationType="fade" onRequestClose={() => setPartialRefundModal(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Remboursement partiel</Text>
            <Text style={styles.modalSub}>
              Max : {partialRefundModal ? (partialRefundModal.dispute.amount / 100).toFixed(2) : '0'} €
            </Text>
            <TextInput
              style={styles.modalInput}
              value={partialRefundInput}
              onChangeText={setPartialRefundInput}
              placeholder="Montant en euros (ex: 12.50)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setPartialRefundModal(null)} activeOpacity={0.75}>
                <Text style={styles.modalBtnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnConfirm}
                activeOpacity={0.75}
                onPress={() => {
                  const euros = parseFloat(partialRefundInput.replace(',', '.'));
                  if (!partialRefundModal || isNaN(euros) || euros <= 0) { Alert.alert('Montant invalide'); return; }
                  const max = partialRefundModal.dispute.amount / 100;
                  if (euros > max) { Alert.alert('Montant trop élevé', `Maximum : ${max.toFixed(2)} €`); return; }
                  const dispute = partialRefundModal.dispute;
                  setPartialRefundModal(null);
                  resolveDispute(dispute, 'partial_refund', Math.round(euros * 100));
                }}
              >
                <Text style={styles.modalBtnConfirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.textPrimary },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
  tabLabelActive: { fontFamily: fonts.bodySemiBold, color: colors.primary },

  list: { padding: spacing.section, gap: 16, paddingBottom: 40 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 10, resizeMode: 'cover' },
  thumbPlaceholder: { backgroundColor: colors.chipBackground, alignItems: 'center', justifyContent: 'center' },
  listingName: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 2 },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(224,135,102,0.12)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  reasonText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.danger },

  actions: { flexDirection: 'row', gap: 10 },
  btnDismiss: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.chipBackground,
    alignItems: 'center',
  },
  btnDismissText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  btnRemove: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: colors.danger,
  },
  btnRemoveText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.background },

  disputeReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.chipBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  disputeDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
  },
  btnUnderReview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: colors.border,
  },
  btnUnderReviewText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary },
  disputeActions: { flexDirection: 'row', gap: 8 },
  btnRefundFull: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  btnRefundPartial: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: `${colors.primary}55`,
    alignItems: 'center',
  },
  btnCloseSeller: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.chipBackground,
    alignItems: 'center',
  },
  btnRefundText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.background },
  btnCloseSellerText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.textSecondary },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 40, color: colors.primary },
  emptyText: { fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, gap: 12 },
  modalTitle: { fontFamily: fonts.bodySemiBold, fontSize: 17, color: colors.textPrimary },
  modalSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  modalInput: {
    backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.border,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBtnCancel: {
    flex: 1, paddingVertical: 12, borderRadius: 50, borderWidth: 1, borderColor: colors.chipBackground, alignItems: 'center',
  },
  modalBtnCancelText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  modalBtnConfirm: {
    flex: 1, paddingVertical: 12, borderRadius: 50, backgroundColor: colors.primary, alignItems: 'center',
  },
  modalBtnConfirmText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.background },
});
