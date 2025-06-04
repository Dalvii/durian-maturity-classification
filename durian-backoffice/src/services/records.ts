export interface AudioRecord {
  name: string
  date: string
  size: number
  link: string
  label: "mature" | "immature" | "overripe"
}

// Service mocké pour les enregistrements audio
export async function getRecords(): Promise<AudioRecord[]> {
  // Simuler un délai de réseau
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Données mockées avec les labels de maturité
  return [
    {
      name: "2025-06-04_04-15-38_mature.wav",
      date: "2025-06-04T04:15:38Z",
      size: 51754,
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      label: "mature",
    },
    {
      name: "2025-06-03_14-22-15_immature.wav",
      date: "2025-06-03T14:22:15Z",
      size: 48392,
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      label: "immature",
    },
    {
      name: "2025-06-02_09-45-12_overripe.wav",
      date: "2025-06-02T09:45:12Z",
      size: 53128,
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      label: "overripe",
    },
    {
      name: "2025-06-01_16-30-45_mature.wav",
      date: "2025-06-01T16:30:45Z",
      size: 49876,
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      label: "mature",
    },
    {
      name: "2025-05-31_11-20-33_immature.wav",
      date: "2025-05-31T11:20:33Z",
      size: 47234,
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      label: "immature",
    },
    {
      name: "2025-05-30_08-15-22_overripe.wav",
      date: "2025-05-30T08:15:22Z",
      size: 54567,
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      label: "overripe",
    },
    {
      name: "2025-05-29_13-45-18_mature.wav",
      date: "2025-05-29T13:45:18Z",
      size: 50123,
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      label: "mature",
    },
    {
      name: "2025-05-28_10-12-55_immature.wav",
      date: "2025-05-28T10:12:55Z",
      size: 46789,
      link: "https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3",
      label: "immature",
    },
  ]
}
