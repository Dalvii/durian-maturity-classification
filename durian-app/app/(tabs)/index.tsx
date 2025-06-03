// src/screens/ClassificationScreen.tsx
import AudioRecorder from '@/components/AudioRecorder';
import Loader from '@/components/Loader';
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Classification = {
  type: 'mature' | 'immature' | 'overripe';
  confidence: number;
};

export default function ClassificationScreen() {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Classification | null>(null);

  const onRecordingComplete = (uri: string) => {
    setAudioUri(uri);
    setAudioName(uri.split('/').pop() ?? 'recording.wav');
    setResult(null);
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true
      });
      if (!result.canceled) {
        const success = result as DocumentPicker.DocumentPickerSuccessResult;
        const first = success.assets[0];
        setAudioUri(first.uri);
        setAudioName(first.name);
        setResult(null);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to select audio file.');
    }
  };

  const sendToApi = async () => {
    if (!audioUri) return;
    setLoading(true);
    try {
      // Step 1: get upload URL
      const urlResponse = await fetch('https://n8n.vktnas.synology.me/webhook/durian-url');
      const { uploadUrl } = await urlResponse.json();
      console.log('Upload URL:', uploadUrl);

      // Step 2: upload file to obtained URL
      const form = new FormData();
      form.append('audio', {
        uri: audioUri,
        name: audioName ?? 'durian.wav',
        type: 'audio/wav'
      } as any);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: form
      });
      const json = await uploadResponse.json();
      console.log('API Response:', json);
      setResult({ type: json.type, confidence: json.confidence });
    } catch {
      Alert.alert('Error', 'Unable to contact the API.');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (type: Classification['type']) => {
    switch (type) {
      case 'mature': return 'Mature';
      case 'immature': return 'Immature';
      case 'overripe': return 'Overripe';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('@/assets/durian.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>Durian Classification</Text>

      <AudioRecorder onRecordingComplete={onRecordingComplete} />

      <TouchableOpacity style={styles.button} onPress={pickAudio}>
        <Text style={styles.buttonText}>📁 Choose Audio File</Text>
      </TouchableOpacity>

      {audioName && <Text style={styles.fileName}>{audioName}</Text>}

      {audioUri && !loading && (
        <TouchableOpacity
          style={[styles.button, styles.sendButton]}
          onPress={sendToApi}
        >
          <Text style={[styles.buttonText, styles.sendButtonText]}>Send to API</Text>
        </TouchableOpacity>
      )}

      {loading && <Loader />}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultText}>{getLabel(result.type)}</Text>
          <Text style={styles.confidenceText}>
            Confidence: {(result.confidence * 100).toFixed(1)}%
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const COLORS = {
  primary: '#4CAF50',
  accent: '#FFC107',
  textDark: '#333',
  secondary: '#FFF',
  cardBg: '#F5F5F5'
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  icon: {
    width: 80,
    height: 80,
    marginBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 24
  },
  button: {
    width: '80%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginTop: 16
  },
  sendButton: {
    backgroundColor: COLORS.accent
  },
  buttonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600'
  },
  sendButtonText: {
    color: COLORS.textDark
  },
  fileName: {
    marginTop: 8,
    fontStyle: 'italic',
    color: COLORS.textDark
  },
  resultCard: {
    marginTop: 24,
    width: '90%',
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  resultText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textDark
  },
  confidenceText: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.textDark
  }
});
