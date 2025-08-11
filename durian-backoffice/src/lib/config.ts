// Configuration de l'API
export const API_BASE_URL = "http://localhost:5001" // Changez cette URL selon votre environnement

// Helper pour construire les URLs
export const buildApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`
