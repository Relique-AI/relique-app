import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { NotificationPromptContext } from '../hooks/useNotificationPermission';

const COPY: Record<NotificationPromptContext, { title: string; body: string }> = {
  message: {
    title: 'Ne ratez pas la réponse',
    body: 'Activez les notifications pour être alerté dès que votre interlocuteur vous répond.',
  },
  offer: {
    title: 'Suivez votre offre en temps réel',
    body: 'Soyez notifié instantanément quand votre offre est acceptée, refusée ou négociée.',
  },
  question: {
    title: 'Recevez la réponse du vendeur',
    body: 'Activez les notifications pour être alerté dès que le vendeur répond à votre question.',
  },
  purchase: {
    title: 'Suivez votre commande',
    body: 'Restez informé de l\'expédition et de la livraison de votre achat.',
  },
  listing: {
    title: 'Votre annonce est en ligne !',
    body: 'Activez les notifications pour recevoir les messages, offres et questions des acheteurs.',
  },
};

type Props = {
  context: NotificationPromptContext | null;
  isDenied?: boolean;
  onAccept: () => void;
  onDismiss: () => void;
};

export default function NotificationPromptModal({ context, isDenied = false, onAccept, onDismiss }: Props) {
  if (!context) return null;
  const { title, body } = COPY[context];

  const deniedTitle = 'Activez les notifications dans vos réglages';
  const deniedBody = 'Vous avez désactivé les notifications. Rendez-vous dans vos réglages iPhone pour les réactiver et ne plus rater de réponses.';

  return (
    <Modal transparent animationType="slide" visible={true} onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{isDenied ? deniedTitle : title}</Text>
        <Text style={styles.body}>{isDenied ? deniedBody : body}</Text>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.85}>
          <Text style={styles.acceptText}>
            {isDenied ? 'Ouvrir les réglages' : 'Activer les notifications'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.dismissText}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  acceptBtn: {
    backgroundColor: '#F5B82E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dismissBtn: {
    paddingVertical: 8,
  },
  dismissText: {
    fontSize: 14,
    color: '#999',
  },
});
