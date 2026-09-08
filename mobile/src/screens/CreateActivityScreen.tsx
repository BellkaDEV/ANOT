import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LIGHT } from '../constants';
import api from '../services/api';
import KeyboardAwareScreen from '../components/KeyboardAwareScreen';
import DateField from '../components/DateField';
import TimeField from '../components/TimeField';
import { FInput, FTextarea, Btn } from '../components/ui';

export default function CreateActivityScreen({ route, navigation }: any) {
  const { classId } = route.params || {};

  const [title, setTitle] = useState('');
  const [type, setType] = useState('trabalho');
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

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.post(`/classes/${classId}/activities`, {
        title,
        type,
        subject,
        due_date: dueDate,
        due_time: dueTime || null,
        description,
      });

      setIsSubmitting(false);
      navigation.goBack();
    } catch (err: any) {
      setIsSubmitting(false);
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Erro de conexão ao criar atividade.');
      }
    }
  };

  const appTh = LIGHT;

  const header = (
    <View style={[styles.header, { backgroundColor: appTh.headerBg }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Nova Atividade</Text>
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
        label="Título da Atividade *"
        value={title}
        onChange={setTitle}
        placeholder="Ex: Trabalho de Física II"
        maxLen={80}
      />

      <FInput
        th={appTh}
        label="Matéria / Disciplina *"
        value={subject}
        onChange={setSubject}
        placeholder="Ex: Física II"
      />

      <DateField
        label="Data de Entrega *"
        value={dueDate}
        onChange={setDueDate}
        th={appTh}
      />

      <TimeField
        label="Horário (opcional)"
        value={dueTime}
        onChange={setDueTime}
        th={appTh}
      />

      <FTextarea
        th={appTh}
        label="Descrição e Instruções (opcional)"
        value={description}
        onChange={setDescription}
        placeholder="Adicione detalhes sobre a entrega..."
        rows={4}
        maxLen={500}
      />

      <Btn th={appTh} onPress={handleCreate} loading={isSubmitting} full iconName="checkmark-circle">
        Criar Atividade
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
