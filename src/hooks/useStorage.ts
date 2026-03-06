import { useState, useEffect } from 'react';
import { UserProgress, RunRecord, UserProfile } from '../types';

const STORAGE_KEY = 'plano_5k_progress';

const DEFAULT_PROFILE: UserProfile = {
  age: 50,
  weight: 71,
  goal: "5 km em 30 min",
  targetPace: "6:00/km"
};

const INITIAL_PROGRESS: UserProgress = {
  currentWeek: 1,
  completedWorkouts: [],
  runs: []
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
    setProgress(prev => ({
      ...prev,
      runs: [run, ...prev.runs]
    }));
  };

  const updateWeek = (week: number) => {
    setProgress(prev => ({ ...prev, currentWeek: week }));
  };

  return {
    progress,
    profile,
    completeWorkout,
    saveRun,
    updateWeek
  };
}
