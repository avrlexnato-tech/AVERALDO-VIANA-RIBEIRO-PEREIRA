export enum WorkoutType {
  LEVE = "Leve",
  MODERADO = "Moderado",
  INTERVALADO = "Intervalado",
  PROVA = "Ritmo de Prova",
  LONGO = "Longo",
  CAMINHADA = "Caminhada"
}

export interface Workout {
  id: string;
  week: number;
  day: string;
  type: WorkoutType;
  title: string;
  description: string;
  pace: string;
  rest: string;
  objective: string;
  completed: boolean;
}

export interface RunRecord {
  id: string;
  date: string;
  distance: number; // in km
  duration: number; // in seconds
  averagePace: string; // "min:sec/km"
  path?: { lat: number; lng: number }[];
}

export interface UserProgress {
  currentWeek: number;
  completedWorkouts: string[]; // IDs
  runs: RunRecord[];
}

export interface UserProfile {
  age: number;
  weight: number;
  goal: string;
  targetPace: string;
}
