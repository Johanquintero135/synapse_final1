import React, { useState } from 'react';
import { Clock, Leaf, CheckCircle, Star, Target, TrendingUp } from 'lucide-react';

export default function HomePage({ onAuthClick }) {
  // onAuthClick viene de App.jsx y abre el modal central de autenticación.
  // Proveer un fallback local por seguridad (solo hace console.log si no se pasa la prop).
  const handleAuth = (mode) => {
    if (typeof onAuthClick === 'function') return onAuthClick(mode);
    console.log(`Auth mode: ${mode}`);
  };

  const handleTecnicaClick = (ruta) => {
    window.location.href = ruta;
  };

  

  const features = [
    {
      Icon: Target,
      title: 'Entrenamiento de Concentración',
      desc: 'Trabaja simultáneamente profundo para técnicas y procedimientos profunda para producir tu capacidad de ejecución.',
      items: ['Solución sin distracciones', 'Ejercicios de meditación', 'Productividad mejorable']
    },
    {
      Icon: CheckCircle,
      title: 'Meditación',
      desc: 'Ejercicios Modernos los meditación técnicos con técnicas y concentración profunda',
      items: []
    },
    {
      Icon: Star,
      title: 'Recompensas',
      desc: '',
      items: []
    }
  ];

  const testimonials = [
    { name: 'Ana Martínez', role: 'Desarrolladora Frontend', avatar: 'A', rating: 5, text: 'Ya sea que te encantraban operar en tu productividad! Ahora puedo mantener mi concentración durante horas sin esfuerzo.' },
    { name: 'Carlos Rodríguez', role: 'Estudiante de Medicina', avatar: 'C', rating: 5, text: 'Las técnicas de meditación me han ayudado enormemente con el estrés de los estudios ¡Increíble!' },
    { name: 'María González', role: 'Diseñadora UX', avatar: 'M', rating: 5, text: 'Se ha vuelto mi única forma de poder hacer con concentración sin distracciones ¡me muy perfecto!' }
  ];

  const plans = [
    {
      name: 'Básico',
      price: 'Gratis',
      period: 'siempre',
      features: [
        'Técnicas Pomodoro básicas',
        'Ejercicios de relajación',
        'Estadísticas básicas',
        'Musica para estudiar'
      ],
      buttonText: 'Comenzar Gratis',
      highlighted: false
    },
    {
      name: 'Premium',
      price: '$9.99',
      period: '/mes',
      badge: 'Más Popular',
      features: [
        'Todas las técnicas de concentración',
        'Meditaciones ilimitadas',
        'Modo estudiado',
        'Soporte prioritario',
        'Sincronización en la nube'
      ],
      buttonText: 'Conseguir Premium',
      highlighted: true
    },
    {
      name: 'Pro',
      price: '$19.99',
      period: '/mes',
      features: [
        'Todo de Premium',
        'Acceso beta a nuevas funciones',
        'Reportes avanzados'
      ],
      buttonText: 'Contactar Ventas',
      highlighted: false
    }
  ];

  // Estado para control de selección de plan (se inicializa en el plan marcado como "highlighted")
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const idx = plans.findIndex(p => p.highlighted);
    return idx >= 0 ? idx : 0;
  });

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)',
      minHeight: '100vh'
    }}>
      {/* Hero Section (adapted from provided code, animations removed) */}
      <section style={{
        padding: '4rem 1.5rem',
        background: 'var(--hero-bg, var(--primary-gradient))',
        color: 'var(--text-on-primary)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '600px',
        display: 'flex',
        alignItems: 'center'
      }}>
        {/* Background decorative elements (static) */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)'
        }} />

        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          position: 'relative', 
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          alignItems: 'center',
          width: '100%'
        }}>
          {/* Left side - Text content */}
          <div>

              <h1 style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: '800',
                lineHeight: '1.1',
                marginBottom: '1.5rem',
                color: 'var(--text-primary)'
              }}>
                Potencia tu mente
              </h1>

              <p style={{
                fontSize: '1.125rem',
                opacity: 0.95,
                marginBottom: '2.5rem',
                lineHeight: '1.6',
                maxWidth: '700px',
                color: 'var(--text-secondary)'
              }}>
                Entrena tu atención, medita con propósito y transforma tu productividad.
              </p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => handleAuth('register')} style={{
                padding: '0.875rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                borderRadius: '50px',
                background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-pink))',
                color: 'var(--text-on-primary)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-primary)',
                transition: 'transform 0.2s'
              }}>
                Registrarse
              </button>
              <button onClick={() => handleAuth('login')} style={{
                padding: '0.875rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: '2px solid rgba(0,0,0,0.08)',
                borderRadius: '50px',
                background: 'transparent',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
                Iniciar sesión
              </button>
            </div>
          </div>

          {/* cuadro decorativo eliminado para mantener legibilidad en modo claro */}
        </div>

        {/* Responsive adjustments */}
        <style>{`...`}</style>
      </section>

  {/* Features Cards Section */}
  <section style={{ padding: '5rem 1.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {/* Left Card - Main Feature */}
            <div style={{
                flex: '1 1 400px',
                background: 'var(--bg-primary)',
                padding: '2.5rem',
                borderRadius: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid var(--border-default)'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem'
              }}>
                <Target size={28} color="white" />
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                  color: 'var(--text-primary)'
              }}>
                {features[0].title}
              </h3>
              <p style={{
                  color: 'var(--text-tertiary)',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>
                {features[0].desc}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {features[0].items.map((item, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                      color: 'var(--text-secondary)'
                  }}>
                    <span style={{ color: '#10b981', fontWeight: '700' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Column - Two smaller cards */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                  background: 'var(--bg-primary)',
                  padding: '2rem',
                  borderRadius: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid var(--border-default)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle size={24} color="white" />
                </div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                    color: 'var(--text-primary)'
                }}>
                  {features[1].title}
                </h4>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {features[1].desc}
                </p>
              </div>

              <div style={{
                  background: 'var(--bg-primary)',
                  padding: '2rem',
                  borderRadius: '24px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid var(--border-default)'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <Star size={24} color="white" />
                </div>
                <h4 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                    color: 'var(--text-primary)'
                }}>
                  {features[2].title}
                </h4>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {features[2].desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

  {/* Testimonials Section */}
  <section style={{ padding: '5rem 1.5rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #667eea22 0%, #764ba233 100%)',
              color: '#667eea',
              borderRadius: '50px',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              💪 Sostenible
            </div>
            <h2 style={{
              fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
              fontWeight: '800',
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              Lo que dicen nuestros <span style={{ color: 'var(--primary-purple-vibrant)' }}>Usuarios</span>
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Miles de personas ya han transformado su vida con Synapse
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginTop: '3rem'
          }}>
            {testimonials.map((testimonial, idx) => {
              return (
                <div key={idx} style={{
                  background: 'var(--bg-primary)',
                  padding: '2rem',
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  border: '1px solid var(--border-default)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe'][idx]} 0%, ${['#764ba2', '#f5576c', '#00f2fe'][idx]} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '1.25rem'
                    }}>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{testimonial.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{testimonial.role}</div>
                    </div>
                  </div>
                  <div style={{ color: 'var(--state-warning-primary)', marginBottom: '0.75rem' }}>
                    {'★'.repeat(testimonial.rating)}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    "{testimonial.text}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

  {/* Pricing Section */}
  <section style={{ padding: '5rem 1.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #667eea22 0%, #764ba233 100%)',
              color: '#667eea',
              borderRadius: '50px',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>
              💎 Planes y Precios
            </div>
            <h2 style={{
              fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
              fontWeight: '800',
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              Elige el plan <span style={{ color: 'var(--primary-purple-vibrant)' }}>Perfecto</span>
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#666',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Comienza gratis y actualiza cuando estés listo para desbloquear todo tu potencial
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            {plans.map((plan, idx) => {
              const isSelected = selectedPlan === idx;
              return (
                <div key={idx} onClick={() => setSelectedPlan(idx)} style={{
                  background: isSelected ? 'var(--primary-gradient)' : 'var(--bg-primary)',
                  color: isSelected ? 'var(--text-on-primary)' : 'var(--text-primary)',
                  padding: '2.5rem',
                  borderRadius: '24px',
                  border: isSelected ? 'none' : '1px solid var(--border-default)',
                  boxShadow: isSelected ? '0 20px 60px color-mix(in srgb, var(--text-primary) 10%, transparent)' : '0 4px 20px rgba(0,0,0,0.06)',
                  position: 'relative',
                  transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 0.18s, box-shadow 0.18s'
                }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '0.5rem 1rem',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: 'white',
                    borderRadius: '50px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    whiteSpace: 'nowrap'
                  }}>
                    {plan.badge}
                  </div>
                )}
                
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  {plan.name}
                </h3>
                
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    lineHeight: '1'
                  }}>
                    {plan.price}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    opacity: 0.8,
                    marginTop: '0.25rem'
                  }}>
                    {plan.period}
                  </div>
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 2rem 0'
                }}>
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                      fontSize: '0.95rem',
                        opacity: isSelected ? 0.95 : 0.8
                    }}>
                      <span style={{
                          color: isSelected ? '#10b981' : '#667eea',
                        flexShrink: 0,
                        fontWeight: '700'
                      }}>✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={() => handleAuth('register')} style={{
                  width: '100%',
                  padding: '1rem',
                  border: 'none',
                  borderRadius: '50px',
                  background: isSelected ? 'var(--text-on-primary)' : 'var(--primary-gradient)',
                  color: isSelected ? 'var(--primary-purple-dark)' : 'var(--text-on-primary)',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.12)'
                }}>
                  {plan.buttonText}
                </button>
              </div>
            );
          })}
          </div>
        
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '5rem 1.5rem',
        background: 'var(--bg-accent)',
        /* usar text-primary para que en modo claro sea negro y en oscuro sea blanco */
        color: 'var(--text-primary)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(1.875rem, 4vw, 2.75rem)',
            fontWeight: '800',
            marginBottom: '1.5rem'
          }}>
            ¿Listo para Transformar tu Mente?
          </h2>
          <p style={{ 
            fontSize: '1.125rem',
            opacity: 0.9,
            lineHeight: '1.6',
            marginBottom: '2.5rem'
          }}>
            Únete a miles de personas que están entrenando sus mentes para alcanzar su máximo potencial.
          </p>
          <button onClick={() => handleAuth('login')} style={{
            padding: '1.25rem 3rem',
            border: 'none',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-pink))',
            color: 'var(--text-on-primary)',
            fontWeight: '700',
            fontSize: '1.125rem',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-primary)',
            transition: 'transform 0.2s'
          }}>
            Comenzar Ahora →
          </button>
        </div>
      </section>
    </div>
  );
}
