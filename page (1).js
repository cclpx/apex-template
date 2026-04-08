'use client'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY)

export default function ProposalPage({ prospecto: p }) {
  const [plan, setPlan] = useState('estandar')
  const [loading, setLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const planes = {
    basico:   { nombre: 'Plan Básico',    precio: 297,  desc: 'Sitio + subdominio gratis' },
    estandar: { nombre: 'Plan Estándar',  precio: 497,  desc: 'Sitio + dominio propio' },
    premium:  { nombre: 'Plan Premium',   precio: 797,  desc: 'Sitio + dominio + SEO activo' },
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handlePago() {
    setLoading(true)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospecto_id: p.id,
        slug: p.slug,
        plan,
        precio: planes[plan].precio,
        negocio: p.nombre,
        email: p.email,
      })
    })
    const { sessionId } = await res.json()
    const stripe = await stripePromise
    await stripe.redirectToCheckout({ sessionId })
    setLoading(false)
  }

  const contenido = p.contenido_web || {}
  const colores = p.colores || { primario: '#0f172a', acento: '#f0c060' }

  return (
    <>
      <style>{`
        :root {
          --p: ${colores.primario};
          --a: ${colores.acento};
          --a2: ${colores.acento}22;
        }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        body { font-family: 'Inter', sans-serif; background: #fff; color: #1e293b; overflow-x: hidden }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
      `}</style>

      {/* NAV */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        padding: scrolled ? '0.8rem 2rem' : '1.2rem 2rem',
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.4s',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <span style={{ fontFamily:'Playfair Display', fontSize:'1.1rem', color: scrolled ? '#0f172a' : '#fff' }}>
          Apex Digital Growth
        </span>
        <button onClick={handlePago} style={{
          background: 'var(--a)', color: '#111',
          border: 'none', padding: '0.5rem 1.4rem',
          borderRadius: 6, fontWeight: 600, fontSize: '0.82rem',
          cursor: 'pointer', letterSpacing: '0.03em',
        }}>
          Comprar sitio →
        </button>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, var(--p) 0%, #1e293b 100%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '6rem 2rem 4rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Orb decorativo */}
        <div style={{
          position:'absolute', width:600, height:600,
          background:`radial-gradient(circle, ${colores.acento}18 0%, transparent 70%)`,
          borderRadius:'50%', top:-100, right:-100,
          animation: 'float 8s ease-in-out infinite',
        }}/>
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-30px)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
        `}</style>

        <div style={{ position:'relative', zIndex:1, maxWidth:800 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'0.75rem',
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)',
            borderRadius:100, padding:'0.4rem 1rem', marginBottom:'2rem',
            color: 'var(--a)', fontSize:'0.75rem', letterSpacing:'0.15em', textTransform:'uppercase',
            animation:'fadeUp 0.8s 0.2s both',
          }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--a)'}}/>
            Sitio web listo para {p.nombre}
          </div>

          <h1 style={{
            fontFamily:'Playfair Display', fontSize:'clamp(2.5rem, 6vw, 5rem)',
            fontWeight:700, color:'#fff', lineHeight:1.1, marginBottom:'1.5rem',
            animation:'fadeUp 0.8s 0.4s both',
          }}>
            {contenido.hero_titulo || `Tu nuevo sitio web está listo`}
          </h1>

          <p style={{
            fontSize:'clamp(1rem, 2vw, 1.25rem)', color:'rgba(255,255,255,0.65)',
            maxWidth:560, margin:'0 auto 2.5rem', lineHeight:1.7,
            animation:'fadeUp 0.8s 0.6s both',
          }}>
            {contenido.hero_subtitulo || `Diseñado específicamente para ${p.nombre} en ${p.ciudad}. Moderno, rápido y optimizado para aparecer en Google.`}
          </p>

          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap', animation:'fadeUp 0.8s 0.8s both' }}>
            <button onClick={() => document.getElementById('planes').scrollIntoView({behavior:'smooth'})} style={{
              padding:'1rem 2.5rem', background:'var(--a)', color:'#111',
              border:'none', borderRadius:8, fontWeight:700, fontSize:'0.9rem',
              cursor:'pointer', transition:'transform 0.2s',
            }}
            onMouseOver={e=>e.target.style.transform='translateY(-2px)'}
            onMouseOut={e=>e.target.style.transform='none'}>
              Ver mi sitio web
            </button>
            <button onClick={() => document.getElementById('preview').scrollIntoView({behavior:'smooth'})} style={{
              padding:'1rem 2.5rem', background:'transparent', color:'#fff',
              border:'1px solid rgba(255,255,255,0.3)', borderRadius:8,
              fontWeight:400, fontSize:'0.9rem', cursor:'pointer',
            }}>
              ¿Cómo luce?
            </button>
          </div>

          {/* Trust bar */}
          <div style={{
            display:'flex', gap:'3rem', justifyContent:'center', flexWrap:'wrap',
            marginTop:'4rem', animation:'fadeUp 0.8s 1s both',
          }}>
            {[
              { n: '48h', l: 'Entrega' },
              { n: '100%', l: 'Personalizado' },
              { n: '30d', l: 'Garantía' },
            ].map(({ n, l }) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Playfair Display', fontSize:'2rem', color:'var(--a)', lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:'0.7rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREVIEW DEL SITIO */}
      <section id="preview" style={{ padding:'6rem 2rem', background:'#f8fafc' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--a)', marginBottom:'1rem', fontWeight:600 }}>
            Vista previa
          </div>
          <h2 style={{ fontFamily:'Playfair Display', fontSize:'clamp(2rem,4vw,3rem)', marginBottom:'3rem' }}>
            Así luce el sitio de <em style={{fontStyle:'italic'}}>{p.nombre}</em>
          </h2>

          {/* Mockup de navegador */}
          <div style={{
            background:'#1e293b', borderRadius:16, overflow:'hidden',
            boxShadow:'0 32px 64px rgba(0,0,0,0.25)',
          }}>
            {/* Barra del browser */}
            <div style={{ padding:'12px 16px', background:'#334155', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', gap:6 }}>
                {['#ef4444','#f59e0b','#22c55e'].map(c => (
                  <div key={c} style={{ width:12, height:12, borderRadius:'50%', background:c }}/>
                ))}
              </div>
              <div style={{
                flex:1, background:'#475569', borderRadius:6, padding:'4px 12px',
                fontSize:'0.72rem', color:'#94a3b8', textAlign:'center',
              }}>
                {p.slug}.apexdigitalgrowth.com
              </div>
            </div>
            {/* Contenido del preview */}
            <div style={{
              background: `linear-gradient(135deg, var(--p) 0%, #1e293b 100%)`,
              padding: '3rem 2rem', minHeight: 320,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              textAlign:'center',
            }}>
              <h3 style={{ fontFamily:'Playfair Display', fontSize:'clamp(1.5rem,3vw,2.5rem)', color:'#fff', marginBottom:'1rem' }}>
                {contenido.hero_titulo || p.nombre}
              </h3>
              <p style={{ color:'rgba(255,255,255,0.6)', maxWidth:400, lineHeight:1.6, marginBottom:'2rem' }}>
                {contenido.hero_subtitulo || `Bienvenidos a ${p.nombre}`}
              </p>
              <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
                <div style={{ padding:'0.65rem 1.5rem', background:'var(--a)', color:'#111', borderRadius:6, fontWeight:600, fontSize:'0.82rem' }}>
                  {contenido.cta_principal || 'Contáctenos'}
                </div>
                <div style={{ padding:'0.65rem 1.5rem', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', borderRadius:6, fontSize:'0.82rem' }}>
                  Ver servicios
                </div>
              </div>
            </div>

            {/* Servicios preview */}
            <div style={{ background:'#fff', padding:'2rem', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1.5rem' }}>
              {(contenido.servicios || ['Servicio 1','Servicio 2','Servicio 3']).slice(0,3).map((s, i) => (
                <div key={i} style={{ textAlign:'center', padding:'1.5rem' }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:'var(--a2)', margin:'0 auto 1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:20, height:20, background:'var(--a)', borderRadius:4 }}/>
                  </div>
                  <div style={{ fontWeight:600, fontSize:'0.88rem', marginBottom:'0.4rem' }}>
                    {typeof s === 'string' ? s : s.nombre}
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'#64748b' }}>
                    {typeof s === 'object' ? s.descripcion : 'Descripción del servicio'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section style={{ padding:'6rem 2rem' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'3rem' }}>
            <div style={{ fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--a)', marginBottom:'1rem', fontWeight:600 }}>Incluido en tu sitio</div>
            <h2 style={{ fontFamily:'Playfair Display', fontSize:'clamp(2rem,4vw,3rem)' }}>Lo que viene en el paquete</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:'1.5rem' }}>
            {[
              { icon:'⚡', t:'Carga ultrarrápida', d:'Optimizado para abrir en menos de 1 segundo en cualquier celular' },
              { icon:'📱', t:'100% móvil', d:'Se ve perfecto en celular, tablet y computadora' },
              { icon:'🔍', t:'Preparado para Google', d:'SEO básico configurado para que los clientes te encuentren' },
              { icon:'📩', t:'Formulario de contacto', d:'Los clientes te escriben directamente desde el sitio' },
              { icon:'💬', t:'WhatsApp flotante', d:'Botón de WhatsApp siempre visible para contacto inmediato' },
              { icon:'🔒', t:'Certificado SSL', d:'Candado de seguridad incluido — protege a tus visitantes' },
            ].map(({ icon, t, d }) => (
              <div key={t} style={{
                padding:'1.5rem', border:'1px solid #e2e8f0', borderRadius:12,
                transition:'all 0.2s',
              }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor='var(--a)'; e.currentTarget.style.transform='translateY(-2px)' }}
              onMouseOut={e=>{ e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform='none' }}>
                <div style={{ fontSize:'1.5rem', marginBottom:'0.75rem' }}>{icon}</div>
                <div style={{ fontWeight:600, marginBottom:'0.4rem', fontSize:'0.9rem' }}>{t}</div>
                <div style={{ color:'#64748b', fontSize:'0.8rem', lineHeight:1.6 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES Y PRECIOS */}
      <section id="planes" style={{ padding:'6rem 2rem', background:'#f8fafc' }}>
        <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontSize:'0.7rem', letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--a)', marginBottom:'1rem', fontWeight:600 }}>Sin sorpresas</div>
          <h2 style={{ fontFamily:'Playfair Display', fontSize:'clamp(2rem,4vw,3rem)', marginBottom:'0.75rem' }}>Elige tu plan</h2>
          <p style={{ color:'#64748b', marginBottom:'3rem' }}>Pago único. Sin mensualidades ocultas.</p>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:'1.5rem', marginBottom:'2rem' }}>
            {Object.entries(planes).map(([key, pl]) => (
              <div key={key} onClick={() => setPlan(key)} style={{
                padding:'2rem 1.5rem', borderRadius:16, cursor:'pointer',
                border: plan===key ? `2px solid var(--a)` : '1px solid #e2e8f0',
                background: plan===key ? 'var(--a2)' : '#fff',
                transform: plan===key ? 'translateY(-4px)' : 'none',
                transition:'all 0.2s', position:'relative',
              }}>
                {key==='estandar' && (
                  <div style={{
                    position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                    background:'var(--a)', color:'#111', padding:'0.2rem 0.8rem',
                    borderRadius:100, fontSize:'0.68rem', fontWeight:700, whiteSpace:'nowrap',
                  }}>Más popular</div>
                )}
                <div style={{ fontWeight:600, marginBottom:'0.5rem' }}>{pl.nombre}</div>
                <div style={{ fontFamily:'Playfair Display', fontSize:'2.5rem', fontWeight:700, marginBottom:'0.5rem' }}>
                  ${pl.precio}<span style={{ fontSize:'1rem', fontWeight:400, color:'#64748b' }}> USD</span>
                </div>
                <div style={{ fontSize:'0.8rem', color:'#64748b', marginBottom:'1rem' }}>{pl.desc}</div>
                <div style={{
                  width:20, height:20, borderRadius:'50%', border:'2px solid var(--a)',
                  background: plan===key ? 'var(--a)' : 'transparent',
                  margin:'0 auto', transition:'all 0.2s',
                }}/>
              </div>
            ))}
          </div>

          <button onClick={handlePago} disabled={loading} style={{
            background: loading ? '#94a3b8' : 'var(--a)',
            color: '#111', border:'none',
            padding:'1.1rem 3rem', borderRadius:8,
            fontWeight:700, fontSize:'1rem', cursor: loading ? 'not-allowed' : 'pointer',
            transition:'all 0.2s', width:'100%', maxWidth:400,
            boxShadow: loading ? 'none' : '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            {loading ? 'Redirigiendo...' : `Comprar ${planes[plan].nombre} — $${planes[plan].precio} USD`}
          </button>
          <p style={{ marginTop:'1rem', fontSize:'0.75rem', color:'#94a3b8' }}>
            Pago seguro con Stripe · Garantía de 30 días
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background:'var(--p)', padding:'2.5rem 2rem', textAlign:'center' }}>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem' }}>
          © {new Date().getFullYear()} Apex Digital Growth · Bogotá, Colombia ·{' '}
          <span style={{ color:'var(--a)' }}>apexdigitalgrowth.com</span>
        </div>
      </footer>
    </>
  )
}
