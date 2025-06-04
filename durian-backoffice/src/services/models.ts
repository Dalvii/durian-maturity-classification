export interface ModelFile {
  name: string
  date: string
  size: number
  link: string
}

// Service mocké pour les modèles entraînés
export async function getModels(): Promise<ModelFile[]> {
  // Simuler un délai de réseau
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Données mockées
  return [
    {
      name: "model_speech_recognition_v1.pkl",
      date: "2024-01-15T08:30:00Z",
      size: 52428800, // 50MB
      link: "/models/model_speech_recognition_v1.pkl",
    },
    {
      name: "neural_network_audio_v2.h5",
      date: "2024-01-14T12:15:00Z",
      size: 104857600, // 100MB
      link: "/models/neural_network_audio_v2.h5",
    },
    {
      name: "transformer_model_fr.bin",
      date: "2024-01-13T15:45:00Z",
      size: 209715200, // 200MB
      link: "/models/transformer_model_fr.bin",
    },
    {
      name: "classification_model.joblib",
      date: "2024-01-12T10:20:00Z",
      size: 26214400, // 25MB
      link: "/models/classification_model.joblib",
    },
    {
      name: "deep_learning_audio_v3.pth",
      date: "2024-01-11T14:30:00Z",
      size: 157286400, // 150MB
      link: "/models/deep_learning_audio_v3.pth",
    },
  ]
}
