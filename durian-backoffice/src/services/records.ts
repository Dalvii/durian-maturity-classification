export interface AudioRecord {
  name: string
  date: string
  size: number
  link: string
  label: "mature" | "immature" | "overripe"
}

export async function getRecords(): Promise<AudioRecord[]> {
  const response = await fetch('/submitted-training-data')
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des données : ${response.statusText}`)
  }
  const data: AudioRecord[] = await response.json()
  return data
}
