import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import api from '../services/api';

export default function CreateActivityScreen({ route, navigation }: any) {
  const { classId } = route.params;

  const [title, setTitle] = useState('');
  const [type, setType] = useState('trabalho'); // dever, trabalho, teste, outros
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title || !dueDate) {
      setErrorMsg('Os campos de Título e Data de Entrega são obrigatórios.');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dueDate)) {
      setErrorMsg('A data deve estar no formato AAAA-MM-DD (ex: 2026-08-15).');
      return;
    }

    if (dueTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(dueTime)) {
        setErrorMsg('O horário deve estar no formato HH:MM (ex: 23:59).');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post(`/classes/${classId}/activities`, {
        title,
        type,
        subject: subject || null,
        due_date: dueDate,
        due_time: dueTime || null,
        description: description || null,
      });
      navigation.goBack();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao criar atividade. Tente novamente.';
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
            <Text style={styles.headerTitle}>Criar Atividade</Text>
          </View>

          {/* Form Card Overlay */}
          <View style={styles.cardOverlay}>
            {errorMsg && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠ {errorMsg}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Título da Atividade *</Text>
              <TextInput
                style={styles.inputField}
                placeholder="ex: Prova de Redes"
                placeholderTextColor={theme.colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Tipo de Atividade</Text>
              <View style={styles.typeRow}>
                {['dever', 'trabalho', 'teste', 'outros'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeBtn,
                      type === t && styles.typeBtnActive,
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        type === t && styles.typeBtnTextActive,
                      ]}
                    >
                      {t === 'teste' ? 'Prova' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Matéria / Disciplina</Text>
              <TextInput
                style={styles.inputField}
                placeholder="ex: Redes de Computadores"
                placeholderTextColor={theme.colors.textSecondary}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <Text style={styles.fieldLabel}>Data Limite *</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              <View style={[styles.flexHalf, { marginLeft: theme.spacing.md }]}>
                <Text style={styles.fieldLabel}>Horário Limite</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="HH:MM"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={dueTime}
                  onChangeText={setDueTime}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Descrição / Detalhes</Text>
              <TextInput
                style={[styles.inputField, styles.multilineInputField]}
                placeholder="Estudar capítulos 1 e 2 do livro..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleCreate}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Salvar Atividade</Text>
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
    height: 90,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    minWidth: 70,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: theme.colors.orangeLight,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  typeBtnTextActive: {
    color: theme.colors.secondary,
  },
  row: {
    flexDirection: 'row',
  },
  flexHalf: {
    flex: 1,
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
