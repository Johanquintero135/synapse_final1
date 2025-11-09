export default {
  apiBase: '/api',
  paths: {
    // Autenticación
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    me: '/auth/me',
    changePassword: '/auth/change-password',
    
    // Usuarios
    usuarios: '/usuarios',
    usuarioById: (id) => `/usuarios/${id}`,
    
    // Tareas
    tareas: '/tareas',
    tareaById: (id) => `/tareas/${id}`,
    
    // Salas y sesiones grupales
    salas: '/salas',
    salasPublicas: '/salas/publicas',
    misSalas: '/salas/mis-salas',
    unirseSala: '/salas/unirse',
    sesiones: '/sesiones',
    
    // Recompensas
    recompensas: '/recompensa',
    recompensasDisponibles: '/recompensa/disponibles',
    misRecompensas: '/recompensa/mis-recompensas',
    otorgarRecompensa: '/recompensa/otorgar',
    
    // Meditación y Pomodoro
    meditacionIniciar: '/bienestar/meditacion/iniciar',
    meditacionFinalizar: '/bienestar/meditacion/finalizar',
    meditacionHistorial: '/bienestar/meditacion/historial',
    
    pomodoroIniciar: '/productividad/pomodoro/iniciar',
    pomodoroFinalizar: '/productividad/pomodoro/finalizar',
    pomodoroEstado: '/productividad/pomodoro/estado',
    
    // Estadísticas
    // Las estadísticas de tareas viven bajo /api/tareas/estadisticas en el backend
    estadisticas: '/tareas/estadisticas'
    ,
    // Estado de ánimo: post y history
    estadoAnimo: '/estado_animo',
    estadoAnimoHistory: '/estado_animo/history'
  },
  tokenField: 'access_token',
  usuarioField: 'usuario'
};