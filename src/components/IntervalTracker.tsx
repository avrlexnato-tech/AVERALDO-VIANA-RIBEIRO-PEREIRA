import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  ChevronLeft, 
  Zap, 
  Clock, 
  MapPin, 
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Flame,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IntervalStage } from '../types';
import { AudioService } from '../services/audioService';
import { useGPS } from '../hooks/useGPS';
import { Map } from './Map';
import { cn } from './UI';

interface IntervalTrackerProps {
  stages: IntervalStage[];
  onFinish: (data: any) => void;
  onCancel: () => void;
  isSoundEnabled: boolean;
  isVoiceEnabled: boolean;
  weight: number;
}

export const IntervalTracker: React.FC<IntervalTrackerProps> = ({ 
  stages, 
  onFinish, 
  onCancel,
  isSoundEnabled,
  isVoiceEnabled,
  weight
}) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(stages[0].duration || 0);
  const [isPaused, setIsPaused] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  
  const { 
    positions, 
    currentPosition,
    distance, 
    isActive, 
    speedSegments,
    calories,
    accuracyLevel,
    precisionMessage,
    startTracking, 
    stopTracking,
    error
  } = useGPS(weight);

  const currentStage = stages[currentStageIndex];
  const timerRef = useRef<number | null>(null);
  const lastPaceAlertTime = useRef(0);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []);

  useEffect(() => {
    if (!isPaused && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleNextStage();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, timeLeft]);

  // Pace comparison logic
  useEffect(() => {
    if (!isPaused && currentStage.type === 'FORTE' && currentStage.targetPace && isVoiceEnabled) {
      const now = Date.now();
      if (now - lastPaceAlertTime.current > 15000) { // Alert every 15s
        const currentPace = calculateCurrentPace();
        if (currentPace) {
          const targetSec = paceToSeconds(currentStage.targetPace);
          const currentSec = paceToSeconds(currentPace);
          
          if (currentSec > targetSec + 15) {
            AudioService.speak("Você está acima do pace alvo. Acelere um pouco.");
          } else if (currentSec < targetSec - 15) {
            AudioService.speak("Você está abaixo do pace alvo. Reduza um pouco.");
          } else {
            AudioService.speak("Bom ritmo, mantenha assim.");
          }
          lastPaceAlertTime.current = now;
        }
      }
    }
  }, [totalTime, isPaused, currentStage, isVoiceEnabled]);

  const paceToSeconds = (pace: string) => {
    const [m, s] = pace.split(':').map(Number);
    return m * 60 + s;
  };

  const calculateCurrentPace = () => {
    if (distance <= 0 || totalTime <= 0) return null;
    const paceInSeconds = totalTime / distance;
    const m = Math.floor(paceInSeconds / 60);
    const s = Math.floor(paceInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      const nextIndex = currentStageIndex + 1;
      setCurrentStageIndex(nextIndex);
      setTimeLeft(stages[nextIndex].duration || 0);
      
      if (isSoundEnabled) AudioService.playSound('interval');
      if (isVoiceEnabled) {
        const nextStage = stages[nextIndex];
        let message = `Iniciando fase de ${nextStage.type.toLowerCase()}.`;
        
        if (nextStage.type === 'FORTE') {
          const isLastRep = nextIndex >= stages.length - 3; // FORTE -> RECUPERAÇÃO -> VOLTA À CALMA
          if (isLastRep) message = "Última repetição! Força total. " + message;
          if (nextStage.targetPace) message += ` Ritmo alvo: ${nextStage.targetPace}.`;
        }
        
        AudioService.speak(message);
      }
    } else {
      onFinish({ 
        totalTime, 
        totalDistance: distance, 
        calories, 
        positions: positions.map(p => ({ lat: p.latitude, lng: p.longitude, speed: p.speed, timestamp: p.timestamp })),
        speedSegments
      });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getStageColor = (type: string) => {
    switch (type) {
      case 'AQUECIMENTO': return 'bg-blue-500';
      case 'FORTE': return 'bg-red-500';
      case 'RECUPERAÇÃO': return 'bg-emerald-500';
      case 'VOLTA À CALMA': return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900 text-white flex flex-col">
      <div className="h-1/3 relative">
        <Map 
          positions={positions} 
          currentPosition={currentPosition}
          speedSegments={speedSegments} 
          isTracking={!isPaused} 
          className="w-full h-full" 
        />
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
          <button onClick={onCancel} className="p-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-white/10 text-white">
            <ChevronLeft size={24} />
          </button>
          <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-right">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Tempo Total</p>
            <p className="text-xl font-black font-mono">{formatTime(totalTime)}</p>
          </div>
        </div>
        {error && (
          <div className="absolute top-20 left-6 right-6 bg-red-500/90 backdrop-blur-md p-3 rounded-xl text-xs font-bold text-center z-20">
            {error}
          </div>
        )}
        {!error && accuracyLevel && accuracyLevel !== 'good' && (
          <div className={cn(
            "absolute top-20 left-6 right-6 backdrop-blur-md p-2 rounded-xl text-[10px] font-bold text-center z-20",
            accuracyLevel === 'acceptable' ? "bg-amber-500/80 text-white" : "bg-orange-500/80 text-white"
          )}>
            {precisionMessage}
          </div>
        )}
      </div>

      <div className="flex-1 bg-slate-900 rounded-t-[40px] -mt-10 relative z-10 p-6 flex flex-col justify-between border-t border-white/5">
        <div className="flex flex-col items-center text-center">
          <motion.div 
            key={currentStageIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-40 h-40 rounded-full ${getStageColor(currentStage.type)} flex flex-col items-center justify-center shadow-2xl mb-6 border-8 border-white/20`}
          >
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{currentStage.type}</p>
            <h2 className="text-5xl font-black font-mono mt-1">{formatTime(timeLeft)}</h2>
          </motion.div>

          <div className="w-full grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Distância</p>
              <p className="text-2xl font-black font-mono">{distance.toFixed(2)}<span className="text-xs ml-1 opacity-30">KM</span></p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Pace Atual</p>
              <p className="text-2xl font-black font-mono text-blue-400">{calculateCurrentPace() || '--:--'}</p>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Ritmo Alvo</p>
              <p className="text-2xl font-black font-mono text-amber-400">{currentStage.targetPace || '--:--'}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Repetição</p>
              <p className="text-2xl font-black font-mono">{Math.floor(currentStageIndex / 2) + 1} / {Math.floor(stages.length / 2)}</p>
            </div>
          </div>
        </div>

        <div className="pb-safe-extra flex justify-center gap-6">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform ${isPaused ? 'bg-emerald-500' : 'bg-amber-500'}`}
          >
            {isPaused ? <Play size={32} fill="white" /> : <Pause size={32} fill="white" />}
          </button>
          
          <button 
            onClick={() => onFinish({ 
              totalTime, 
              totalDistance: distance, 
              calories, 
              positions: positions.map(p => ({ lat: p.latitude, lng: p.longitude, speed: p.speed, timestamp: p.timestamp })),
              speedSegments
            })}
            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Square size={32} fill="white" />
          </button>
        </div>
      </div>
    </div>
  );
};
