import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppTextInput } from './AppTextInput';
import { colors, fonts } from '../theme';
import { getShippingCost } from '../utils/shippingRates';

const COMMISSION_RATE = 0.08;

type Props = {
  visible: boolean;
  shippingOptions: string[];
  parcelSize: string | null | undefined;
  basePrice: number;
  listingName: string;
  listingCategory?: string | null;
  thumbnail: string | null;
  sellerName?: string;
  priceLabelItem?: string;
  referralCredits: number;
  buying: boolean;
  onConfirm: (shippingMethod: string, deliveryAddress: string | undefined) => void;
  onClose: () => void;
};

export function PaymentFlowSheet({
  visible,
  shippingOptions,
  parcelSize,
  basePrice,
  listingName,
  listingCategory,
  thumbnail,
  sellerName,
  priceLabelItem,
  referralCredits,
  buying,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const SHIPPING_LABELS: Record<string, string> = {
    hand: t('payment.shipping.hand'),
    relay: 'Mondial Relay',
    colissimo: 'Colissimo',
    chronopost: 'Chronopost',
  };
  const priceLabel = priceLabelItem ?? t('payment.priceLabelItem');
  const hasPostal = shippingOptions.some((o) => o !== 'hand');
  const [step, setStep] = useState<'shipping' | 'recap'>(hasPostal ? 'shipping' : 'recap');
  const [selectedShipping, setSelectedShipping] = useState(hasPostal ? shippingOptions[0] : 'hand');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [pendingShipping, setPendingShipping] = useState(hasPostal ? '' : 'hand');
  const [pendingRecipient, setPendingRecipient] = useState<string | undefined>(undefined);
  const [pendingAddress, setPendingAddress] = useState<string | undefined>(undefined);

  if (!visible) return null;

  const overlayStyle = {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end' as const,
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.55)',
  };

  // ── Shipping selector ─────────────────────────────────────────────────────

  if (step === 'shipping') {
    const xlSelected = selectedShipping !== 'hand' && parcelSize === 'xl';
    const confirmCost = getShippingCost(selectedShipping, parcelSize);
    const confirmBase = basePrice + confirmCost;
    const confirmTotal = Math.round(confirmBase * (1 + COMMISSION_RATE) * 100) / 100;
    const canConfirm = selectedShipping === 'hand' || (firstName.trim() !== '' && lastName.trim() !== '' && address.trim() !== '');

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={overlayStyle}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={{ paddingBottom: 40, gap: 10 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Text style={styles.sheetTitle}>{t('payment.shippingTitle')}</Text>

          <View style={styles.productRecap}>
            <View style={styles.productRecapRow}>
              <Text style={styles.productRecapName} numberOfLines={1}>{listingName}</Text>
              <Text style={styles.productRecapPrice}>{basePrice.toFixed(2)} €</Text>
            </View>
            {sellerName ? (
              <View style={styles.productRecapRow}>
                <Text style={styles.productRecapMeta}>{t('payment.soldBy', { seller: sellerName })}</Text>
              </View>
            ) : null}
            <View style={styles.productRecapDivider} />
          </View>

          {shippingOptions.map((opt) => {
            const isSelected = selectedShipping === opt;
            const shippingCost = getShippingCost(opt, parcelSize);
            const base = basePrice + shippingCost;
            const total = Math.round(base * (1 + COMMISSION_RATE) * 100) / 100;
            const xlCarrier = opt !== 'hand' && parcelSize === 'xl';
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.optionRow, isSelected && styles.optionRowActive]}
                onPress={() => setSelectedShipping(opt)}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, isSelected && { color: colors.textPrimary }]}>
                    {SHIPPING_LABELS[opt] ?? opt}
                  </Text>
                  <Text style={styles.optionPrice}>
                    {opt === 'hand'
                      ? t('payment.freeTotal', { total: total.toFixed(2) })
                      : xlCarrier
                        ? t('payment.feesToArrange')
                        : t('payment.plusCostTotal', { cost: shippingCost.toFixed(2), total: total.toFixed(2) })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {selectedShipping !== 'hand' && (
            <View style={{ marginTop: 8, gap: 10 }}>
              <Text style={styles.addressLabel}>{t('payment.recipient')}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AppTextInput
                  style={[styles.addressInput, { flex: 1 }]}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={t('payment.firstName')}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <AppTextInput
                  style={[styles.addressInput, { flex: 1 }]}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={t('payment.lastName')}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <AppTextInput
                style={styles.addressInput}
                value={company}
                onChangeText={setCompany}
                placeholder={t('payment.company')}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Text style={styles.addressLabel}>{t('payment.deliveryAddress')}</Text>
              <AppTextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholder={t('payment.addressPlaceholder')}
                multiline
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.confirmBtn, (!canConfirm || buying) && { opacity: 0.4 }]}
            disabled={!canConfirm || buying}
            onPress={() => {
              const addr = selectedShipping !== 'hand' ? address.trim() : undefined;
              const recipient = selectedShipping !== 'hand'
                ? [firstName.trim() + ' ' + lastName.trim(), company.trim()].filter(Boolean).join('\n')
                : undefined;
              setPendingShipping(selectedShipping);
              setPendingRecipient(recipient);
              setPendingAddress(addr);
              setStep('recap');
            }}
          >
            {buying
              ? <ActivityIndicator color={colors.background} size="small" />
              : <Text style={styles.confirmText}>
                  {xlSelected
                    ? t('payment.confirmWithShippingTbd', { total: confirmTotal.toFixed(2) })
                    : t('payment.confirmAndPay', { total: confirmTotal.toFixed(2) })}
                </Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Recap modal ───────────────────────────────────────────────────────────

  const shippingCost = getShippingCost(pendingShipping, parcelSize);
  const recapBase = basePrice + shippingCost;
  const hasReferralDiscount = referralCredits > 0;
  const effectiveRate = hasReferralDiscount ? COMMISSION_RATE * 0.5 : COMMISSION_RATE;
  const recapFee = Math.round(recapBase * effectiveRate * 100) / 100;
  const recapTotal = Math.round(recapBase * (1 + effectiveRate) * 100) / 100;
  const xlShipping = pendingShipping !== 'hand' && parcelSize === 'xl';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={overlayStyle}>
      <TouchableOpacity
        style={StyleSheet.absoluteFillObject}
        onPress={() => {
          if (hasPostal) setStep('shipping');
          else onClose();
        }}
      />
      <View style={styles.recapSheet}>
        <Text style={styles.recapTitle}>{t('payment.recapTitle')}</Text>

        <View style={styles.recapProduct}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.recapThumb} />
          ) : (
            <View style={[styles.recapThumb, styles.recapThumbPlaceholder]}>
              <Ionicons name="image-outline" size={24} color={colors.textDisabled} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.recapProductName} numberOfLines={2}>{listingName}</Text>
            {listingCategory ? <Text style={styles.recapProductMeta}>{listingCategory}</Text> : null}
            {sellerName ? <Text style={styles.recapProductMeta}>{t('payment.soldBy', { seller: sellerName })}</Text> : null}
          </View>
        </View>

        <View style={styles.recapDivider} />

        <View style={styles.recapPriceRows}>
          <View style={styles.recapPriceRow}>
            <Text style={styles.recapPriceLabel}>{priceLabel}</Text>
            <Text style={styles.recapPriceValue}>{basePrice.toFixed(2)} €</Text>
          </View>
          {pendingShipping === 'hand' ? (
            <View style={styles.recapPriceRow}>
              <Text style={styles.recapPriceLabel}>{t('payment.shipping.hand')}</Text>
            </View>
          ) : (
            <View style={styles.recapPriceRow}>
              <Text style={styles.recapPriceLabel}>{t('payment.deliveryMethod', { method: SHIPPING_LABELS[pendingShipping] ?? pendingShipping })}</Text>
              <Text style={styles.recapPriceValue}>
                {xlShipping ? t('payment.tbd') : `${shippingCost.toFixed(2)} €`}
              </Text>
            </View>
          )}
          {hasReferralDiscount ? (
            <>
              <View style={styles.recapPriceRow}>
                <Text style={styles.recapPriceLabel}>{t('payment.serviceFee')}</Text>
                <Text style={styles.recapPriceValue}>
                  {Math.round(recapBase * COMMISSION_RATE * 100) / 100} €
                </Text>
              </View>
              <View style={styles.recapPriceRow}>
                <Text style={[styles.recapPriceLabel, { color: colors.success }]}>
                  {t('payment.referralDiscount', { count: referralCredits })}
                </Text>
                <Text style={[styles.recapPriceValue, { color: colors.success }]}>
                  −{(Math.round(recapBase * COMMISSION_RATE * 100) / 100 - recapFee).toFixed(2)} €
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.recapPriceRow}>
              <Text style={styles.recapPriceLabel}>{t('payment.serviceFee')}</Text>
              <Text style={styles.recapPriceValue}>{recapFee.toFixed(2)} €</Text>
            </View>
          )}
          <View style={[styles.recapPriceRow, styles.recapPriceTotal]}>
            <Text style={styles.recapTotalLabel}>{t('payment.total')}</Text>
            <Text style={styles.recapTotalValue}>
              {xlShipping
                ? t('payment.totalPlusShipping', { total: Math.round(basePrice * (1 + COMMISSION_RATE) * 100) / 100 })
                : `${recapTotal.toFixed(2)} €`}
            </Text>
          </View>
        </View>

        {(pendingRecipient || pendingAddress) ? (
          <>
            <View style={styles.recapDivider} />
            {pendingRecipient && (
              <View style={styles.recapAddressRow}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recapAddressLabel}>{t('payment.recipient')}</Text>
                  <Text style={styles.recapAddressText}>{pendingRecipient}</Text>
                </View>
              </View>
            )}
            {pendingAddress && (
              <View style={[styles.recapAddressRow, pendingRecipient ? { marginTop: 8 } : {}]}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recapAddressLabel}>{t('payment.deliveryAddress')}</Text>
                  <Text style={styles.recapAddressText}>{pendingAddress}</Text>
                </View>
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.payBtn, buying && { opacity: 0.5 }]}
          disabled={buying}
          onPress={() => {
            const fullAddress = pendingRecipient && pendingAddress
              ? `${pendingRecipient}\n${pendingAddress}`
              : pendingAddress;
            onConfirm(pendingShipping, fullAddress);
          }}
        >
          {buying
            ? <ActivityIndicator color={colors.background} size="small" />
            : <Text style={styles.payText}>
                {xlShipping
                  ? t('payment.pay', { total: (Math.round(basePrice * (1 + COMMISSION_RATE) * 100) / 100).toFixed(2) })
                  : t('payment.pay', { total: recapTotal.toFixed(2) })}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Shipping selector sheet
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, marginBottom: 4 },

  // Product recap header (inside shipping selector)
  productRecap: { marginBottom: 12 },
  productRecapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  productRecapName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary, flex: 1, marginRight: 8 },
  productRecapPrice: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textPrimary },
  productRecapMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  productRecapDivider: { height: 1, backgroundColor: colors.chipBackground, marginTop: 8 },

  // Shipping options
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  optionRowActive: { borderColor: colors.primary },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.textSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  optionLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textSecondary },
  optionPrice: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  // Address fields
  addressLabel: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.textDisabled,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8,
  },
  addressInput: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    fontFamily: fonts.body, fontSize: 14, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.chipBackground, minHeight: 64,
  },

  // Confirm button (shipping step)
  confirmBtn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center', marginTop: 6,
  },
  confirmText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },

  // Recap modal sheet
  recapSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 8,
  },
  recapTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, marginBottom: 20 },
  recapProduct: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 16 },
  recapThumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: colors.surface },
  recapThumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  recapProductName: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary, marginBottom: 4 },
  recapProductMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  recapDivider: { height: 1, backgroundColor: colors.chipBackground, marginVertical: 14 },
  recapPriceRows: { gap: 10 },
  recapPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recapPriceLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  recapPriceValue: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },
  recapPriceTotal: { marginTop: 4 },
  recapTotalLabel: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.textPrimary },
  recapTotalValue: { fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.primary },
  recapAddressRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  recapAddressLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.textDisabled, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  recapAddressText: { fontFamily: fonts.body, fontSize: 13, color: colors.textPrimary },

  // Pay button (recap step)
  payBtn: {
    backgroundColor: colors.primary, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    marginTop: 20, marginBottom: 8,
  },
  payText: { fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.background },
});
