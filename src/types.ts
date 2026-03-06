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

export interface PathPoint {
  lat: number;
  lng: number;
  speed: number;
  timestamp: number;
}

export interface SpeedSegment {
  path: { lat: number; lng: number }[];
  color: string;
  speed: number;
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
  path: PathPoint[];
  speedSegments: SpeedSegment[];
  segments: Segment[];
  effortLevel: 'leve' | 'moderado' | 'forte' | 'muito forte';
  isInterval?: boolean;
}

export interface IntervalStage {
  type: 'AQUECIMENTO' | 'FORTE' | 'RECUPERAÇÃO' | 'VOLTA À CALMA';
  duration?: number; // seconds
  distance?: number; // km
  targetPace?: string;
  recoveryType?: 'parado' | 'caminhada' | 'trote';
}

export interface CustomWorkout {
  id: string;
  name: string;
  reps: number;
  distancePerRep: number; // meters
  targetPace: string;
  recoveryTime: number; // seconds
  recoveryType: 'parado' | 'caminhada' | 'trote';
  warmupTime: number; // minutes
  cooldownTime: number; // minutes
  createdAt: string;
}

export interface UserSettings {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  alertFrequency: 'distance' | 'time';
  alertInterval: number; // e.g., 1 for 1km or 60 for 60s
}

export interface UserProgress {
  currentWeek: number;
  completedWorkouts: string[]; // IDs
  runs: RunRecord[];
  customWorkouts: CustomWorkout[];
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
