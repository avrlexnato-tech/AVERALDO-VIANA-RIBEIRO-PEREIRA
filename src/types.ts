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
  intensityFactor?: number; // 1.0 is standard, can be adjusted by AI
}

export interface Segment {
  km: number;
  time: number; // seconds
  pace: string;
  diffFromPrevious?: number; // seconds
}

export interface RunRecord {
  id: string;
  date: string;
  distance: number; // in km
  duration: number; // in seconds
  averagePace: string; // "min:sec/km"
  maxPace?: string;
  minPace?: string;
  calories: number;
  path: { lat: number; lng: number; speed: number }[];
  segments: Segment[];
  effortLevel: 'leve' | 'moderado' | 'forte' | 'muito forte';
  isInterval?: boolean;
}

export interface IntervalStage {
  type: 'AQUECIMENTO' | 'FORTE' | 'RECUPERAÇÃO' | 'VOLTA À CALMA';
  duration?: number; // seconds
  distance?: number; // km
  targetPace?: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  alertFrequency: 'time' | 'distance';
  alertInterval: number; // every 5 mins or every 1 km
}

export interface UserProgress {
  currentWeek: number;
  completedWorkouts: string[]; // IDs
  runs: RunRecord[];
  evolutionLevel: 'iniciante' | 'em evolução' | 'consistente' | 'avançando bem';
  planAdjustments: { date: string; message: string; factor: number }[];
  settings: UserSettings;
}

export interface UserProfile {
  age: number;
  weight: number;
  goal: string;
  targetPace: string;
}
