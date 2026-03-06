import { useState, useEffect } from 'react';
import { UserProgress, RunRecord, UserProfile, UserSettings } from '../types';

const STORAGE_KEY = 'plano_5k_progress_v2';

const DEFAULT_PROFILE: UserProfile = {
  age: 50,
  weight: 71,
  goal: "5 km em 30 min",
  targetPace: "6:00/km"
};

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  voiceEnabled: true,
  alertFrequency: 'distance',
  alertInterval: 1 // every 1 km
};

const INITIAL_PROGRESS: UserProgress = {
  currentWeek: 1,
  completedWorkouts: [],
  runs: [],
  evolutionLevel: 'iniciante',
  planAdjustments: [],
  settings: DEFAULT_SETTINGS
};

export function useStorage() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
  });

  const [profile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const completeWorkout = (workoutId: string) => {
    setProgress(prev => {
      if (prev.completedWorkouts.includes(workoutId)) return prev;
      return {
        ...prev,
        completedWorkouts: [...prev.completedWorkouts, workoutId]
      };
    });
  };

  const saveRun = (run: RunRecord) => {
    setProgress(prev => {
      const newRuns = [run, ...prev.runs];
      
      // AI Adjustment Logic
      let adjustmentMessage = "";
      let evolutionLevel = prev.evolutionLevel;
      let factor = 1.0;

      // Simple rule-based AI
      const paceSeconds = (pace: string) => {
        const [m, s] = pace.split(':').map(Number);
        return m * 60 + s;
      };

      const targetPaceSec = paceSeconds("6:00");
      const currentPaceSec = paceSeconds(run.averagePace);

      if (currentPaceSec < targetPaceSec - 15) {
        adjustmentMessage = "Seu desempenho está melhorando. Ajustamos o próximo treino para ser um pouco mais desafiador.";
        evolutionLevel = 'avançando bem';
        factor = 1.05;
      } else if (currentPaceSec > targetPaceSec + 60) {
        adjustmentMessage = "Percebemos maior esforço nos últimos dias. Reduzimos a carga para melhorar sua recuperação.";
        evolutionLevel = 'em evolução';
        factor = 0.95;
      } else {
        evolutionLevel = 'consistente';
      }

      const newAdjustments = adjustmentMessage 
        ? [{ date: new Date().toISOString(), message: adjustmentMessage, factor }, ...prev.planAdjustments]
        : prev.planAdjustments;

      return {
        ...prev,
        runs: newRuns,
        evolutionLevel,
        planAdjustments: newAdjustments
      };
    });
  };

  const updateSettings = (settings: Partial<UserSettings>) => {
    setProgress(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  };

  const resetProgress = () => {
    if (confirm("Tem certeza que deseja resetar todo o seu progresso?")) {
      setProgress(INITIAL_PROGRESS);
    }
  };

  return {
    progress,
    profile,
    completeWorkout,
    saveRun,
    updateSettings,
    resetProgress
  };
}
