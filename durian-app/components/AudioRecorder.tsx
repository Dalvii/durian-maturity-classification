// src/components/AudioRecorder.tsx
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder
} from 'expo-audio';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

type Props = {
  onRecordingComplete: (uri: string) => void;
};

const COLORS = {
  primary: '#4CAF50',
  accent: '#FFC107',
  textLight: '#FFF'
};

export default function AudioRecorder({ onRecordingComplete }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert(
          'Permission Required',
          'This app needs access to your microphone.'
        );
      }
    })();
  }, []);

  const start = async () => {
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Unable to start recording.');
    }
  };

  const stop = async () => {
    try {
      await recorder.stop();
      setIsRecording(false);
      if (recorder.uri) onRecordingComplete(recorder.uri);
    } catch (err) {
      Alert.alert('Error', 'Unable to stop recording.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isRecording ? COLORS.accent : COLORS.primary }
        ]}
        onPress={isRecording ? stop : start}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
    alignItems: 'center'
  },
  button: {
    width: '80%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: '600'
  }
});
