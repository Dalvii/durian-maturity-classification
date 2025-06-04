export interface AudioRecord {
  name: string
  date: string
  size: number
  link: string
}

// Service mocké pour les enregistrements audio
export async function getRecords(): Promise<AudioRecord[]> {
  // Simuler un délai de réseau
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Données mockées
  return [
    {
      name: "enregistrement_001.mp3",
      date: "2024-01-15T10:30:00Z",
      size: 2048576, // 2MB
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    },
    {
      name: "interview_client.wav",
      date: "2024-01-14T14:22:00Z",
      size: 5242880, // 5MB
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    },
    {
      name: "reunion_equipe.mp3",
      date: "2024-01-13T09:15:00Z",
      size: 3145728, // 3MB
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    },
    {
      name: "presentation_demo.wav",
      date: "2024-01-12T16:45:00Z",
      size: 7340032, // 7MB
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    },
    {
      name: "formation_audio.mp3",
      date: "2024-01-11T11:20:00Z",
      size: 4194304, // 4MB
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
    },
  ]
}
