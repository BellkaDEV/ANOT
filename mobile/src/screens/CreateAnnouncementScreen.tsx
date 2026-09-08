import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LIGHT } from '../constants';
import api from '../services/api';
import KeyboardAwareScreen from '../components/KeyboardAwareScreen';
import { FInput, FTextarea, Btn } from '../components/ui';

export default function CreateAnnouncementScreen({ route, navigation }: any) {
  const { classId } = route.params || {};

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('media');

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

      setIsSubmitting(false);
      navigation.goBack();
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Erro de conexão ao criar aviso.');
      }
    }
  };

  const appTh = LIGHT;

  const header = (
    <View style={[styles.header, { backgroundColor: appTh.headerBg }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Novo Aviso</Text>
      <View style={{ width: 60 }} />
    </View>
  );

  return (
    <KeyboardAwareScreen header={header} th={appTh} contentContainerStyle={styles.formContainer}>
      {errorMsg && (
        <View style={[styles.errorBanner, { borderColor: appTh.error }]}>
          <Text style={[styles.errorText, { color: appTh.error }]}>{errorMsg}</Text>
        </View>
      )}

      <FInput
        th={appTh}
        label="Título do Aviso *"
        value={title}
        onChange={setTitle}
        placeholder="Ex: Aula cancelada nesta Sexta"
        maxLen={80}
      />

      <FTextarea
        th={appTh}
        label="Conteúdo do Aviso *"
        value={content}
        onChange={setContent}
        placeholder="Escreva a mensagem completa..."
        rows={6}
        maxLen={1000}
      />

      <Btn th={appTh} onPress={handleCreate} loading={isSubmitting} full iconName="notifications">
        Publicar Aviso
      </Btn>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  formContainer: {
    padding: 16,
    gap: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
  },
});
