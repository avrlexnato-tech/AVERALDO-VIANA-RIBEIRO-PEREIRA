import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, 
  Calendar, 
  Play, 
  History, 
  MoreHorizontal,
  ChevronRight,
  CheckCircle2,
  Clock,
  MapPin,
  Zap,
  TrendingUp,
  Info,
  Dumbbell,
  Flame,
  AlertTriangle,
  Pause,
  Square,
  ChevronLeft,
  Settings,
  Target,
  User,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Card, 
  ProgressCircle, 
  TrainingCard, 
  HistoryCard, 
  BottomNav 
} from './components/UI';
import { useStorage } from './hooks/useStorage';
import { useGPS } from './hooks/useGPS';
import { TRAINING_PLAN } from './data/plan';
import { Workout, WorkoutType, RunRecord } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const { progress, profile, completeWorkout, saveRun } = useStorage();
  const { positions, distance, isActive, error, startTracking, stopTracking, setDistance, setPositions } = useGPS();
  
  const [runStartTime, setRunStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showSummary, setShowSummary] = useState<RunRecord | null>(null);

  // --- LOGIC ---

  const currentWorkout = useMemo(() => {
    // Find the first non-completed workout for the current week or next
    return TRAINING_PLAN.find(w => !progress.completedWorkouts.includes(w.id));
  }, [progress.completedWorkouts]);

  const planProgress = useMemo(() => {
    return (progress.completedWorkouts.length / TRAINING_PLAN.length) * 100;
  }, [progress.completedWorkouts]);

  const weekWorkouts = useMemo(() => {
    const week = currentWorkout?.week || 1;
    return TRAINING_PLAN.filter(w => w.week === week);
  }, [currentWorkout]);

  const weekProgress = useMemo(() => {
    const week = currentWorkout?.week || 1;
    const weekIds = TRAINING_PLAN.filter(w => w.week === week).map(w => w.id);
    const completedInWeek = progress.completedWorkouts.filter(id => weekIds.includes(id)).length;
    return (completedInWeek / weekIds.length) * 100;
  }, [currentWorkout, progress.completedWorkouts]);

  const lastRun = progress.runs[0] || null;

  const motivationalMessages = [
    "Hoje é dia de construir base",
    "Treino leve também gera resultado",
    "Consistência vence intensidade",
    "Cada km conta na sua jornada",
    "Respeite seu corpo, siga o plano",
    "O pace de hoje é o fôlego de amanhã"
  ];
  const randomMessage = useMemo(() => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)], []);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculatePace = (dist: number, time: number) => {
    if (dist === 0) return "0:00";
    const paceInSeconds = time / dist;
    const m = Math.floor(paceInSeconds / 60);
    const s = Math.floor(paceInSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentPace = useMemo(() => calculatePace(distance, elapsedTime), [distance, elapsedTime]);

  const handleStartRun = () => {
    setElapsedTime(0);
    setDistance(0);
    setPositions([]);
    setIsPaused(false);
    startTracking();
    setRunStartTime(Date.now());
  };

  const handleFinishRun = () => {
    stopTracking();
    const finalRun: RunRecord = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      distance: distance,
      duration: elapsedTime,
      averagePace: currentPace,
    };
    saveRun(finalRun);
    setShowSummary(finalRun);
    setActiveTab('history');
  };

  // --- SCREENS ---

  const renderHome = () => (
    <div className="pb-24 px-4 pt-6">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-black text-blue-900 tracking-tight uppercase">Plano 5K em 30 Min</h1>
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <User size={20} />
          </div>
        </div>
        <p className="text-slate-500 text-sm font-medium">Plano de 8 semanas para correr 5 km em 30 minutos</p>
      </header>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-blue-600 text-white border-none">
          <div className="flex items-center gap-2 mb-2 opacity-80">
            <Target size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Objetivo</span>
          </div>
          <p className="text-lg font-black leading-tight">5 KM EM 30 MIN</p>
          <p className="text-xs opacity-70 mt-1">Pace alvo: 6:00/km</p>
        </Card>
        <Card className="bg-white">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <TrendingUp size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Progresso Geral</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-slate-800">{Math.round(planProgress)}%</span>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
              <motion.div 
                className="h-full bg-blue-500" 
                initial={{ width: 0 }}
                animate={{ width: `${planProgress}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            Treino de Hoje
          </h2>
          <span className="text-xs font-bold text-blue-600 px-2 py-0.5 bg-blue-50 rounded-full">
            Semana {currentWorkout?.week || 1}
          </span>
        </div>
        {currentWorkout ? (
          <TrainingCard 
            workout={currentWorkout} 
            onComplete={completeWorkout}
            isCompleted={progress.completedWorkouts.includes(currentWorkout.id)}
          />
        ) : (
          <Card className="bg-emerald-50 border-emerald-100 text-center py-8">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2" />
            <p className="font-bold text-emerald-800">Plano Concluído!</p>
            <p className="text-xs text-emerald-600">Você está pronto para os 5km.</p>
          </Card>
        )}
      </section>

      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-slate-800">Status da Semana</h2>
          <span className="text-xs text-slate-400">Semana {currentWorkout?.week || 1} de 8</span>
        </div>
        <Card className="flex items-center gap-4">
          <ProgressCircle percent={weekProgress} size={70} strokeWidth={8} />
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-700">Meta Semanal</p>
            <p className="text-xs text-slate-500 mb-2">Complete os 4 treinos para evoluir.</p>
            <div className="flex gap-1">
              {weekWorkouts.map((w, i) => (
                <div 
                  key={w.id} 
                  className={`h-1.5 flex-1 rounded-full ${progress.completedWorkouts.includes(w.id) ? 'bg-emerald-500' : 'bg-slate-100'}`}
                />
              ))}
            </div>
          </div>
        </Card>
      </section>

      {lastRun && (
        <section className="mb-6">
          <h2 className="font-bold text-slate-800 mb-3">Última Corrida</h2>
          <HistoryCard run={lastRun} />
        </section>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex gap-3 items-center">
        <div className="bg-amber-100 p-2 rounded-full text-amber-600">
          <Flame size={20} />
        </div>
        <p className="text-sm text-amber-900 font-medium italic">"{randomMessage}"</p>
      </div>

      <button 
        onClick={() => setActiveTab('run')}
        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
      >
        <Play fill="currentColor" size={24} />
        INICIAR CORRIDA
      </button>
    </div>
  );

  const renderPlan = () => {
    const weeks = [1, 2, 3, 4, 5, 6, 7, 8];
    const blocos = [
      { range: [1, 2], label: 'Adaptação' },
      { range: [3, 4], label: 'Base Forte' },
      { range: [5, 6], label: 'Ganho de Velocidade' },
      { range: [7, 8], label: 'Ajuste Final' },
    ];

    return (
      <div className="pb-24 px-4 pt-6">
        <header className="mb-6">
          <h1 className="text-2xl font-black text-slate-800">Planilha de Treinos</h1>
          <p className="text-slate-500 text-sm">8 semanas focadas no seu objetivo</p>
        </header>

        {blocos.map((bloco, bi) => (
          <div key={bi} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {bloco.label}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {bloco.range.map(week => (
              <div key={week} className="mb-6">
                <h3 className="text-lg font-black text-slate-700 mb-3">Semana {week}</h3>
                <div className="space-y-3">
                  {TRAINING_PLAN.filter(w => w.week === week).map(workout => (
                    <TrainingCard 
                      key={workout.id} 
                      workout={workout} 
                      onComplete={completeWorkout}
                      isCompleted={progress.completedWorkouts.includes(workout.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderRunTracker = () => {
    if (!isActive && !showSummary) {
      return (
        <div className="h-screen flex flex-col bg-blue-900 text-white p-6">
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 bg-blue-800 rounded-full flex items-center justify-center mb-6 shadow-2xl">
              <MapPin size={48} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-black mb-2">PRONTO PARA CORRER?</h1>
            <p className="text-blue-200 mb-12 max-w-xs">O GPS será usado para rastrear sua distância e pace em tempo real.</p>
            
            <div className="w-full space-y-4">
              <button 
                onClick={handleStartRun}
                className="w-full bg-white text-blue-900 py-5 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform"
              >
                COMEÇAR AGORA
              </button>
              <button 
                onClick={() => setActiveTab('home')}
                className="w-full bg-blue-800 text-blue-200 py-4 rounded-2xl font-bold"
              >
                VOLTAR
              </button>
            </div>
          </div>

          <div className="bg-blue-800/50 p-4 rounded-2xl border border-blue-700/50 flex gap-3">
            <AlertTriangle className="text-amber-400 shrink-0" size={20} />
            <p className="text-xs text-blue-100 leading-relaxed">
              Certifique-se de estar em um local aberto para melhor sinal de GPS. Mantenha o app aberto durante a atividade.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen flex flex-col bg-slate-900 text-white">
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              <span className="text-xs font-bold tracking-widest uppercase opacity-70">
                {isPaused ? 'Pausado' : 'Rastreando...'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Tempo Total</p>
              <p className="text-2xl font-black font-mono">{formatTime(elapsedTime)}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-2">Distância Percorrida</p>
            <div className="flex items-baseline gap-2 mb-12">
              <h2 className="text-8xl font-black font-mono tracking-tighter">{distance.toFixed(2)}</h2>
              <span className="text-2xl font-bold opacity-50">KM</span>
            </div>

            <div className="grid grid-cols-2 w-full gap-8">
              <div className="text-center">
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Pace Atual</p>
                <p className="text-4xl font-black font-mono">{currentPace}</p>
                <p className="text-[10px] opacity-40 mt-1">min/km</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest mb-1">Velocidade</p>
                <p className="text-4xl font-black font-mono">{(distance / (elapsedTime / 3600) || 0).toFixed(1)}</p>
                <p className="text-[10px] opacity-40 mt-1">km/h</p>
              </div>
            </div>
          </div>

          <div className="pb-12 flex justify-center gap-6">
            {!isPaused ? (
              <button 
                onClick={() => setIsPaused(true)}
                className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-900/20 active:scale-90 transition-transform"
              >
                <Pause size={32} fill="white" />
              </button>
            ) : (
              <button 
                onClick={() => setIsPaused(false)}
                className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-900/20 active:scale-90 transition-transform"
              >
                <Play size={32} fill="white" />
              </button>
            )}
            
            <button 
              onClick={handleFinishRun}
              className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-900/20 active:scale-90 transition-transform"
            >
              <Square size={32} fill="white" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="pb-24 px-4 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Histórico de Corridas</h1>
        <p className="text-slate-500 text-sm">Suas atividades registradas</p>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total</p>
          <p className="text-xl font-black text-blue-600">{progress.runs.length}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center col-span-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Distância Total</p>
          <p className="text-xl font-black text-blue-600">
            {progress.runs.reduce((acc, r) => acc + r.distance, 0).toFixed(1)} km
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {progress.runs.length > 0 ? (
          progress.runs.map(run => (
            <HistoryCard key={run.id} run={run} />
          ))
        ) : (
          <div className="text-center py-12 opacity-30">
            <History size={48} className="mx-auto mb-2" />
            <p className="text-sm font-bold">Nenhuma corrida registrada ainda</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMore = () => (
    <div className="pb-24 px-4 pt-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Mais Recursos</h1>
        <p className="text-slate-500 text-sm">Dicas e estratégias para evoluir</p>
      </header>

      <section className="mb-8">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Zap size={18} className="text-amber-500" />
          Ritmos de Treino
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Leve', pace: '7:00–7:30/km', desc: 'Conversa fácil, sem ofegar.' },
            { label: 'Moderado', pace: '6:20–6:30/km', desc: 'Esforço controlado, respiração rítmica.' },
            { label: 'Ritmo de Prova', pace: '6:00/km', desc: 'Seu objetivo final para os 5km.' },
            { label: 'Intervalado', pace: '5:20–5:40/km', desc: 'Esforço intenso para ganhar velocidade.' },
          ].map((r, i) => (
            <Card key={i} className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">{r.label}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-blue-600">{r.pace}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Target size={18} className="text-emerald-500" />
          Estratégia da Prova
        </h2>
        <Card className="p-0 overflow-hidden">
          {[
            { km: 'KM 1', pace: '6:15', desc: 'Saída controlada' },
            { km: 'KM 2', pace: '6:05', desc: 'Entrar na prova' },
            { km: 'KM 3', pace: '6:00', desc: 'Estabilizar' },
            { km: 'KM 4', pace: '5:55', desc: 'Começar a acelerar' },
            { km: 'KM 5', pace: 'Máximo', desc: 'Fechamento forte' },
          ].map((s, i) => (
            <div key={i} className={`flex items-center justify-between p-4 ${i !== 4 ? 'border-b border-slate-50' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{s.km}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{s.desc}</p>
                </div>
              </div>
              <p className="font-black text-blue-600">{s.pace}</p>
            </div>
          ))}
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Dumbbell size={18} className="text-indigo-500" />
          Força e Prevenção
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {['Agachamento', 'Avanço', 'Panturrilha', 'Prancha'].map((ex, i) => (
            <Card key={i} className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                <Dumbbell size={20} />
              </div>
              <p className="font-bold text-slate-800 text-sm">{ex}</p>
              <p className="text-[10px] text-slate-400 mt-1">3x 15 repetições</p>
            </Card>
          ))}
        </div>
        <div className="mt-4 bg-blue-50 p-4 rounded-2xl flex gap-3">
          <Info className="text-blue-500 shrink-0" size={20} />
          <p className="text-xs text-blue-800 leading-relaxed">
            Dedicar 15 a 20 minutos para estes exercícios ajuda drasticamente a reduzir o risco de lesões.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-500" />
          Regras de Segurança
        </h2>
        <div className="space-y-2">
          {[
            "Não fazer dois treinos fortes seguidos",
            "Treinos leves são essenciais para evolução",
            "Dor articular pede redução imediata de carga",
            "Constância vale mais que intensidade isolada"
          ].map((rule, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <p className="text-xs text-slate-600 font-medium">{rule}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.main
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'home' && renderHome()}
          {activeTab === 'plan' && renderPlan()}
          {activeTab === 'run' && renderRunTracker()}
          {activeTab === 'history' && renderHistory()}
          {activeTab === 'more' && renderMore()}
        </motion.main>
      </AnimatePresence>

      {activeTab !== 'run' && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="bg-blue-600 p-8 text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-black mb-1">CORRIDA CONCLUÍDA!</h2>
                <p className="text-blue-100 text-sm">Excelente trabalho hoje.</p>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Distância</p>
                    <p className="text-3xl font-black text-slate-800">{showSummary.distance.toFixed(2)}<span className="text-sm ml-1 opacity-50">km</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pace Médio</p>
                    <p className="text-3xl font-black text-slate-800">{showSummary.averagePace}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tempo</p>
                    <p className="text-xl font-black text-slate-800">{formatTime(showSummary.duration)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data</p>
                    <p className="text-xl font-black text-slate-800">{new Date(showSummary.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setShowSummary(null)}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-transform"
                >
                  FECHAR RESUMO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
