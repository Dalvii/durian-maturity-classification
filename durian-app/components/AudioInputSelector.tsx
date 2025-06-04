// src/components/AudioInputSelector.tsx
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AudioRecorder from './AudioRecorder';

type Props = {
  onAudioSelected: (uri: string, name: string) => void;
};

export default function AudioInputSelector({ onAudioSelected }: Props) {
  const [audioName, setAudioName] = useState<string | null>(null);

  const onRecordingComplete = (uri: string) => {
    const name = uri.split('/').pop() ?? 'recording.wav';
    setAudioName(name);
    onAudioSelected(uri, name);
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: true
      });
      if (!result.canceled) {
        const file = result.assets[0];
        setAudioName(file.name);
        onAudioSelected(file.uri, file.name);
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to select audio file.');
    }
  };

  return (
    <View style={styles.container}>
      <AudioRecorder onRecordingComplete={onRecordingComplete} />

      <TouchableOpacity style={styles.button} onPress={pickAudio}>
        <Text style={styles.buttonText}>📁 Choose Audio File</Text>
      </TouchableOpacity>

      {audioName && <Text style={styles.fileName}>{audioName}</Text>}
    </View>
  );
}

const COLORS = {
  primary: '#4CAF50',
  secondary: '#FFF',
  textDark: '#333'
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%'
  },
  button: {
    width: '80%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginTop: 16
  },
  buttonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontWeight: '600'
  },
  fileName: {
    marginTop: 8,
    fontStyle: 'italic',
    color: COLORS.textDark
  }
});
