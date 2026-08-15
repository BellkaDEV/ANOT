import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import api from '../services/api';

export default function CreateAnnouncementScreen({ route, navigation }: any) {
  const { classId } = route.params;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('media'); // baixa, media, alta

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title || !content) {
      setErrorMsg('Os campos de Título e Conteúdo são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post(`/classes/${classId}/announcements`, {
        title,
        content,
        priority,
      });
      navigation.goBack();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao criar aviso. Tente novamente.';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* Header Area */}
          <View style={styles.headerBackground}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Criar Aviso</Text>
          </View>

          {/* Form Card Overlay */}
          <View style={styles.cardOverlay}>
            {errorMsg && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠ {errorMsg}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Título do Aviso *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="ex: Alteração na data da prova"
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Prioridade</Text>
              <View style={styles.priorityRow}>
                {['baixa', 'media', 'alta'].map((p) => {
                  const getBtnColorMeta = () => {
                    if (priority !== p) {
                      return { border: theme.colors.border, bg: theme.colors.inputBg, text: theme.colors.textSecondary };
                    }
                    if (p === 'alta') return { border: theme.colors.error, bg: '#fef2f2', text: theme.colors.error };
                    if (p === 'media') return { border: '#b45309', bg: '#fffbeb', text: '#b45309' };
                    return { border: '#065f46', bg: '#ecfdf5', text: '#065f46' };
                  };

                  const meta = getBtnColorMeta();

                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityBtn,
                        { borderColor: meta.border, backgroundColor: meta.bg },
                      ]}
                      onPress={() => setPriority(p)}
                    >
                      <Text style={[styles.priorityBtnText, { color: meta.text }]}>
                        {p === 'alta' ? 'Alta' : p === 'media' ? 'Média' : 'Baixa'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Conteúdo do Comunicado *</Text>
              <TextInput
                style={[styles.inputField, styles.multilineInputField]}
                placeholder="Escreva os detalhes importantes aqui..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={6}
                value={content}
                onChangeText={setContent}
              />
            </View>

            <Text style={styles.helpText}>
              Nota: Este aviso expirará automaticamente em 21 dias.
            </Text>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Publicar Aviso</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBackground: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardOverlay: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: 22,
    marginHorizontal: theme.spacing.lg,
    marginTop: -20,
    shadowColor: '#0e2f5a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
    gap: 14,
    marginBottom: 30,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.textSecondary,
  },
  inputField: {
    backgroundColor: theme.colors.inputBg,
    color: theme.colors.text,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  multilineInputField: {
    height: 110,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  submitBtn: {
    height: 50,
    backgroundColor: theme.colors.secondary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e4822e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
    marginTop: theme.spacing.xs,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
