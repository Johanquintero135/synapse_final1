import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Coffee, Flame, Settings } from 'lucide-react';
import api from '../services/api';
import cfg from '../services/config';

export default function Pomodoro() {

    // Configuración inicial
    const [config, setConfig] = useState({
        duracion_trabajo: 25,
        duracion_descanso: 5,
        ciclos_objetivo: 4,
        modo_no_distraccion: false
    });

    // Estado de la sesión
    const [estado, setEstado] = useState(null); // null | 'activo' | 'pausado' | 'finalizado'
    const [faseActual, setFaseActual] = useState('trabajo'); // 'trabajo', 'descanso'
    const [tiempoRestante, setTiempoRestante] = useState(config.duracion_trabajo * 60);
    const [ciclosCompletados, setCiclosCompletados] = useState(0);
    const [sessionId, setSessionId] = useState(null);

    // Contador en segundo plano
    useEffect(() => {
        let interval = null;
        if (estado === 'activo' && tiempoRestante > 0) {
            interval = setInterval(() => {
                setTiempoRestante(t => t - 1);
            }, 1000);
        } else if (tiempoRestante === 0 && estado === 'activo') {
            manejarFinFase();
        }
        return () => clearInterval(interval);
    }, [estado, tiempoRestante]);

    const manejarFinFase = async () => {
        if (faseActual === 'trabajo') {
            const nuevosCiclos = ciclosCompletados + 1;
            setCiclosCompletados(nuevosCiclos);
            setFaseActual('descanso');
            setTiempoRestante(config.duracion_descanso * 60);
        } else if (faseActual === 'descanso') {
            if (ciclosCompletados + 1 >= config.ciclos_objetivo) {
                await finalizarSesion(true);
            } else {
                setFaseActual('trabajo');
                setTiempoRestante(config.duracion_trabajo * 60);
            }
        }
    };

    const iniciarSesion = async () => {
        try {
            const payload = {
                duracion_trabajo: config.duracion_trabajo,
                duracion_descanso: config.duracion_descanso,
                ciclos_objetivo: config.ciclos_objetivo,
                modo_no_distraccion: config.modo_no_distraccion
            };
            const res = await api.post(cfg.paths.pomodoroIniciar, payload);
            const data = res.data.pomodoro || res.data;
            const sesionId = data.sesion_id;
            if (!sesionId) throw new Error('No se recibió ID de sesión');
            setSessionId(sesionId);
            setEstado('activo');
            setFaseActual('trabajo');
            setTiempoRestante(config.duracion_trabajo * 60);
            setCiclosCompletados(0);
        } catch (error) {
            console.error('Error al iniciar Pomodoro:', error);
            alert('No se pudo iniciar la sesión. ¿Ya tienes una activa?');
        }
    };

    const finalizarSesion = async (completada = false) => {
        if (!sessionId) return;
        try {
            await api.post(cfg.paths.pomodoroFinalizar, {
                completado_totalmente: completada
            });
            setEstado('finalizado');
            setSessionId(null);
        } catch (error) {
            console.error('Error al finalizar Pomodoro:', error);
            alert(error.response?.data?.error || 'Error al finalizar la sesión');
        }
    };

    const reiniciar = () => {
        setEstado(null);
        setFaseActual('trabajo');
        setTiempoRestante(config.duracion_trabajo * 60);
        setCiclosCompletados(0);
        setSessionId(null);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const isTrabajo = faseActual === 'trabajo';
    const porcentajeProgreso = ((config.ciclos_objetivo - ciclosCompletados) / config.ciclos_objetivo) * 100;

    return (
        <div className="pomodoro-app">
            <div className="container">
                <div className="header">
                    <h1 className="header-title">Pomodoro</h1>
                    <p className="header-subtitle">Técnica Pomodoro: alterna períodos de trabajo y descanso para mejorar la concentración.</p>
                </div>

                <div className="stats-row">
                    <div className="stat-item">
                        <Flame size={18} />
                        <span>Ciclos: {ciclosCompletados} / {config.ciclos_objetivo}</span>
                    </div>
                    <div className="stat-item">
                        <Settings size={18} />
                        <span>{config.modo_no_distraccion ? 'Modo sin distracciones ON' : 'Modo normal'}</span>
                    </div>
                </div>

                <div className="timer-display">
                    <div className={`timer-circle ${isTrabajo ? 'work' : 'break'}`}>
                        <div className="timer-time">{formatTime(tiempoRestante)}</div>
                        <div className="timer-label">
                            {isTrabajo ? 'Fase de trabajo' : 'Fase de descanso'}
                        </div>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${100 - ((ciclosCompletados / config.ciclos_objetivo) * 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="controls">
                    {estado === null && (
                        <div className="config-form">
                                <div className="form-row">
                                <label>Duración trabajo (min)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={config.duracion_trabajo}
                                    onChange={e => setConfig(c => ({ ...c, duracion_trabajo: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="form-row">
                                <label>Duración descanso (min)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={config.duracion_descanso}
                                    onChange={e => setConfig(c => ({ ...c, duracion_descanso: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="form-row">
                                <label>Ciclos (1–12)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={config.ciclos_objetivo}
                                    onChange={e => setConfig(c => ({ ...c, ciclos_objetivo: Number(e.target.value) }))}
                                />
                            </div>
                            <div className="form-row checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={config.modo_no_distraccion}
                                        onChange={e => setConfig(c => ({ ...c, modo_no_distraccion: e.target.checked }))}
                                    />
                                    {'Modo sin distracciones'}
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="button-group">
                        {estado === null ? (
                            <button className="button button-primary" onClick={iniciarSesion}>
                                <Play /> {'Iniciar'}
                            </button>
                        ) : estado === 'activo' || estado === 'pausado' ? (
                            <>
                                <button className="button button-secondary" onClick={() => finalizarSesion(false)}>
                                    {'Finalizar anticipadamente'}
                                </button>
                                <button className="button button-primary" onClick={reiniciar}>
                                    <RotateCcw /> {'Reiniciar'}
                                </button>
                            </>
                        ) : estado === 'finalizado' ? (
                            <button className="button button-secondary" onClick={reiniciar}>
                                {'Nueva sesión'}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <style jsx>{`
        .pomodoro-app { padding: 24px; }
        .header-title { font-size: 28px; margin-bottom: 8px; }
        .header-subtitle { color: #666; }
        .stats-row {
          display: flex;
          gap: 24px;
          margin: 20px 0;
          font-size: 14px;
          color: #555;
        }
        .stat-item { display: flex; align-items: center; gap: 6px; }
        .timer-display { text-align: center; margin: 32px 0; }
        .timer-circle {
          width: 280px;
          height: 280px;
          margin: 0 auto;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          margin-bottom: 24px;
          transition: all 0.3s;
        }
        .timer-circle.work { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .timer-circle.break { border-color: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
        .timer-time { font-size: 56px; font-weight: 700; color: #111; }
        .timer-label { font-size: 18px; margin-top: 8px; color: #555; }
        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          max-width: 300px;
          margin: 0 auto;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        .controls { margin-top: 32px; }
        .config-form {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          display: grid;
          gap: 16px;
        }
        .form-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-row.checkbox {
          flex-direction: row;
          align-items: center;
        }
        .form-row input[type="number"] {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          width: 100%;
          max-width: 120px;
        }
        .button-group {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .button {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          cursor: pointer;
        }
        .button-primary {
          background: linear-gradient(135deg, #7c3aed, #667eea);
          color: white;
        }
        .button-secondary {
          background: #f3f4f6;
          color: #333;
        }
        @media (max-width: 600px) {
          .timer-circle { width: 220px; height: 220px; }
          .timer-time { font-size: 44px; }
          .stats-row { flex-direction: column; gap: 10px; }
        }
      `}</style>
        </div>
    );
}