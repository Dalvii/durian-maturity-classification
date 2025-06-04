// src/screens/TrainingScreen.tsx
import AudioInputSelector from '@/components/AudioInputSelector';
import Loader from '@/components/Loader';
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

const LABELS = ['mature', 'overripe'];

export default function TrainingScreen() {
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendToApi = async () => {
    if (!audioUri || !selectedLabel) {
      Alert.alert('Missing data', 'Please select a label and an audio file.');
      return;
    }

    setLoading(true);
    try {
      const urlResponse = await fetch('https://n8n.vktnas.synology.me/webhook/durian-train-url');
      const { uploadUrl } = await urlResponse.json();

      const form = new FormData();
      form.append('audio', {
        uri: audioUri,
        name: audioName ?? 'durian.wav',
        type: 'audio/wav'
      } as any);
      form.append('label', selectedLabel);

      await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: form
      });

      Alert.alert('Success', 'Training data uploaded!');
      setAudioUri(null);
      setAudioName(null);
      setSelectedLabel(null);
    } catch (err) {
      Alert.alert('Error', 'Unable to upload training data.');
    } finally {
      setLoading(false);
    }
  };

  const getLabelName = (label: string) => {
    switch (label) {
      case 'mature': return 'Mature';
      // case 'immature': return 'Immature';
      case 'overripe': return 'Overripe';
      default: return label;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('@/assets/durian.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>Durian Training Upload</Text>

      <AudioInputSelector onAudioSelected={(uri, name) => {
        setAudioUri(uri);
        setAudioName(name);
      }} />


      <View style={styles.labelContainer}>
        {LABELS.map((label) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.labelButton,
              selectedLabel === label && styles.labelButtonSelected
            ]}
            onPress={() => setSelectedLabel(label)}
          >
            <Text
              style={[
                styles.labelButtonText,
                selectedLabel === label && styles.labelButtonTextSelected
              ]}
            >
              {getLabelName(label)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {audioUri && selectedLabel && !loading && (
        <TouchableOpacity
          style={[styles.button, styles.sendButton]}
          onPress={sendToApi}
        >
          <Text style={[styles.buttonText, styles.sendButtonText]}>Send to API</Text>
        </TouchableOpacity>
      )}

      {loading && <Loader />}
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
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16
  },
  labelButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 6
  },
  labelButtonSelected: {
    backgroundColor: COLORS.primary
  },
  labelButtonText: {
    color: COLORS.textDark,
    fontWeight: '600'
  },
  labelButtonTextSelected: {
    color: COLORS.secondary
  }
});
