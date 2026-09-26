/* ============================================================
   EcoBelleza — script principal
   ============================================================ */
(function(){
"use strict";

/* ---------------------------------------------------------------
   0. UTILIDADES
--------------------------------------------------------------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const store = {
  get(key, fallback){ try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } },
  set(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
};
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._tm);
  toast._tm = setTimeout(()=> t.classList.remove('show'), 2600);
}
function fmtDate(iso, lang){
  try{
    return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-AR', { day:'2-digit', month:'short', year:'numeric' });
  }catch(e){ return ''; }
}
function escapeHTML(str){
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------------------------------------------------------------
   0b. ANIMACIONES: reveal al hacer scroll + ráfaga de emojis
--------------------------------------------------------------- */
const revealObserver = new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('in-view');
      revealObserver.unobserve(e.target);
    }
  });
}, {threshold:.14, rootMargin:'0px 0px -40px 0px'});
function observeReveal(root=document){
  (root === document ? $$('.reveal') : root.matches('.reveal') ? [root] : $$('.reveal', root))
    .forEach(el=>{ if(!el.classList.contains('in-view')) revealObserver.observe(el); });
}

const EMOJI_BURST_SET = ['💧','✨','🩷','💙','🫧','🌟'];
function emojiBurst(x, y, emojis){
  const list = emojis && emojis.length ? emojis : EMOJI_BURST_SET;
  const n = 6 + Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){
    const span = document.createElement('span');
    span.className = 'emoji-particle';
    span.textContent = list[Math.floor(Math.random()*list.length)];
    const angle = (Math.PI*2*i/n) + Math.random()*0.6;
    const dist = 46 + Math.random()*54;
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    span.style.setProperty('--dx', Math.cos(angle)*dist + 'px');
    span.style.setProperty('--dy', (Math.sin(angle)*dist - 30) + 'px');
    span.style.setProperty('--rot', (Math.random()*140-70) + 'deg');
    document.body.appendChild(span);
    span.addEventListener('animationend', ()=> span.remove());
  }
}
document.addEventListener('click', e=>{
  const trigger = e.target.closest('.btn-primary, .flip-card, .gota-option, .vf-true, .vf-false, .chat-toggle, .star-input button');
  if(!trigger) return;
  emojiBurst(e.clientX, e.clientY);
}, {passive:true});

$$('.flip-card').forEach(card=>{
  card.addEventListener('click', ()=> card.classList.toggle('flipped'));
});
observeReveal();

/* ---------------------------------------------------------------
   1. TEMA (claro / oscuro)
--------------------------------------------------------------- */
const root = document.documentElement;
function setTheme(theme){
  root.setAttribute('data-theme', theme);
  store.set('eb-theme', theme);
  $('#theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
}
setTheme(store.get('eb-theme', 'dark'));
$('#theme-toggle').addEventListener('click', ()=>{
  setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

/* ---------------------------------------------------------------
   2. NAV MÓVIL
--------------------------------------------------------------- */
const navToggle = $('#nav-toggle');
const mainNav = $('#main-nav');
navToggle.addEventListener('click', ()=>{
  const open = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
$$('.main-nav a').forEach(a => a.addEventListener('click', ()=>{
  mainNav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

/* ---------------------------------------------------------------
   3. FONDO ANIMADO DE MICROPLÁSTICOS (canvas)
--------------------------------------------------------------- */
(function particles(){
  const canvas = $('#bg-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, particlesArr = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduceMotion) return;

  const COLORS = ['#ff6fa8','#2bd9c9','#7dd3fc','#8ecbff','#ffe3f0'];
  const SHAPES = ['circle','fragment','fiber','bubble','bubble'];

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = document.documentElement.scrollHeight;
  }
  function makeParticle(){
    const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
    return {
      x: Math.random()*w,
      y: Math.random()*h,
      r: shape === 'bubble' ? 3 + Math.random()*7 : 1.5 + Math.random()*3.2,
      speedY: (shape === 'bubble' ? 0.1 : 0.15) + Math.random()*0.35,
      speedX: (Math.random()-0.5)*0.25,
      drift: Math.random()*Math.PI*2,
      color: COLORS[Math.floor(Math.random()*COLORS.length)],
      shape,
      rot: Math.random()*Math.PI,
      rotSpeed: (Math.random()-0.5)*0.01,
      alpha: shape === 'bubble' ? 0.22 + Math.random()*0.26 : 0.4 + Math.random()*0.45
    };
  }
  function init(){
    resize();
    const count = Math.min(120, Math.floor((w*h)/24000));
    particlesArr = Array.from({length: Math.max(46,count)}, makeParticle);
  }
  function drawParticle(p){
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    if(p.shape === 'circle'){
      ctx.beginPath();
      ctx.arc(0,0,p.r,0,Math.PI*2);
      ctx.fill();
    } else if(p.shape === 'fragment'){
      ctx.beginPath();
      ctx.moveTo(-p.r, -p.r*0.6);
      ctx.lineTo(p.r*0.8, -p.r);
      ctx.lineTo(p.r, p.r*0.7);
      ctx.lineTo(-p.r*0.6, p.r);
      ctx.closePath();
      ctx.fill();
    } else if(p.shape === 'bubble'){
      const grad = ctx.createRadialGradient(-p.r*0.3,-p.r*0.35,0,0,0,p.r);
      grad.addColorStop(0,'rgba(255,255,255,.9)');
      grad.addColorStop(.35,p.color);
      grad.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0,0,p.r,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.r*0.5);
      ctx.beginPath();
      ctx.moveTo(-p.r*1.8, 0);
      ctx.lineTo(p.r*1.8, 0);
      ctx.stroke();
    }
    ctx.restore();
  }
  function tick(){
    ctx.clearRect(0,0,w,h);
    for(const p of particlesArr){
      p.drift += 0.01;
      p.y -= p.speedY;
      p.x += p.speedX + Math.sin(p.drift)*0.15;
      p.rot += p.rotSpeed;
      if(p.y < -10){ p.y = h + 10; p.x = Math.random()*w; }
      if(p.x < -10) p.x = w+10;
      if(p.x > w+10) p.x = -10;
      drawParticle(p);
    }
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', ()=>{ resize(); });
  init();
  requestAnimationFrame(tick);
})();

/* ---------------------------------------------------------------
   3b. PRESENTACIÓN INICIAL (intro cinemática)
   Una secuencia animada en canvas: un producto de maquillaje se
   disuelve en microplásticos que caen al agua. No es un video de
   archivo (evita problemas de licencia y de red): es una animación
   propia, generada con canvas, pensada para verse como una apertura
   de documental corta.
--------------------------------------------------------------- */
(function intro(){
  const splash = $('#intro-splash');
  if(!splash) return;

  if(sessionStorage.getItem('eb-intro-done')){ splash.remove(); return; }

  const canvas = $('#intro-canvas');
  const ctx = canvas.getContext('2d');
  const eyebrow = $('#intro-eyebrow');
  const title = $('#intro-title');
  const enterBtn = $('#intro-enter');
  const skipBtn = $('#intro-skip');
  const bar = $('#intro-progress-bar');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.body.classList.add('intro-lock');

  let w, h;
  function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const lang = store.get('eb-lang', 'es');
  const LINES = lang === 'en' ? {
    eyebrow:'HackaPUM · Girls in Tech',
    l:['What you put on your skin…','…hides thousands of invisible microplastics.','Discover them. Choose better. Change the tide.'],
    skip:'Skip intro', enter:'Get started'
  } : {
    eyebrow:'HackaPUM · Chicas en Tecnología',
    l:['Lo que te ponés en la piel…','…esconde miles de microplásticos invisibles.','Descubrilos. Elegí mejor. Cambiá la marea.'],
    skip:'Saltar intro', enter:'Comenzar'
  };
  eyebrow.textContent = LINES.eyebrow;
  skipBtn.textContent = LINES.skip;
  enterBtn.textContent = LINES.enter;

  const COLORS = ['#ff6fa8','#7dd3fc','#2bd9c9','#f2f7ff'];
  let dots = [];
  function seedDots(){
    dots = Array.from({length: 100}, ()=>{
      const angle = Math.random()*Math.PI*2;
      const dist = 30 + Math.random()*Math.min(w,h)*0.2;
      return {
        tx: w/2 + Math.cos(angle)*dist,
        ty: h*0.4 + Math.sin(angle)*dist*0.55,
        x: Math.random()*w, y: Math.random()*h,
        r: 2 + Math.random()*3.4,
        color: COLORS[Math.floor(Math.random()*COLORS.length)],
        vx:(Math.random()-0.5)*2.2,
        vy: 0.6 + Math.random()*1.6
      };
    });
  }
  seedDots();

  let waterLevel = 0, waveT = 0;
  function drawWater(){
    if(waterLevel<=0) return;
    const lvl = h - (h*waterLevel);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, lvl);
    for(let x=0;x<=w;x+=24) ctx.lineTo(x, lvl + Math.sin((x*0.018)+waveT)*6);
    ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath();
    const grad = ctx.createLinearGradient(0,lvl,0,h);
    grad.addColorStop(0,'rgba(27,81,112,.92)');
    grad.addColorStop(1,'rgba(8,26,34,.98)');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  let start = null, phase = 0, finished = false;
  const T1=900, T2=2500, T3=4700, T4=6200;

  function setLine(i){
    title.classList.remove('show');
    setTimeout(()=>{ title.textContent = LINES.l[i]; title.classList.add('show'); }, 240);
  }

  function frame(ts){
    if(start === null) start = ts;
    const t = ts - start;
    bar.style.width = Math.min(100, (t/T4)*100) + '%';
    ctx.clearRect(0,0,w,h);
    eyebrow.classList.add('show');

    if(t < T2){
      if(t>200 && phase<1){ phase=1; setLine(0); }
      dots.forEach(d=>{
        d.x += (d.tx-d.x)*0.06;
        d.y += (d.ty-d.y)*0.06;
        ctx.globalAlpha = 0.85; ctx.fillStyle = d.color;
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,Math.PI*2); ctx.fill();
      });
    } else if(t < T3){
      if(phase<2){ phase=2; setLine(1); }
      const p = Math.min(1,(t-T2)/(T3-T2));
      dots.forEach(d=>{
        d.x += d.vx*(1+p*2);
        d.y += d.vy*(1+p*3);
        d.vy += 0.02;
        ctx.globalAlpha = Math.max(0,0.9-p*0.5); ctx.fillStyle = d.color;
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r*(1-p*0.3),0,Math.PI*2); ctx.fill();
      });
      waterLevel = Math.min(0.16, p*0.16);
      waveT += 0.05;
      drawWater();
    } else {
      if(phase<3){ phase=3; setLine(2); }
      const p = Math.min(1,(t-T3)/(T4-T3));
      waterLevel = 0.16 + p*0.22;
      waveT += 0.05;
      dots.forEach(d=>{
        d.y += d.vy*0.4; d.x += d.vx*0.2;
        ctx.globalAlpha = 0.4; ctx.fillStyle = d.color;
        ctx.beginPath(); ctx.arc(d.x,d.y,d.r*0.7,0,Math.PI*2); ctx.fill();
      });
      drawWater();
      if(t>=T4) enterBtn.classList.add('show');
    }
    if(!finished) requestAnimationFrame(frame);
  }

  function finish(){
    if(finished) return;
    finished = true;
    sessionStorage.setItem('eb-intro-done','1');
    document.body.classList.remove('intro-lock');
    splash.classList.add('leaving');
    setTimeout(()=> splash.remove(), 760);
  }

  skipBtn.addEventListener('click', finish);
  enterBtn.addEventListener('click', finish);

  if(reduceMotion){
    eyebrow.classList.add('show');
    title.textContent = LINES.l[2];
    title.classList.add('show');
    enterBtn.classList.add('show');
    waterLevel = 0.3; drawWater();
  } else {
    requestAnimationFrame(frame);
  }
})();

/* ---------------------------------------------------------------
   4. I18N — Español / Inglés
--------------------------------------------------------------- */
const I18N = {
  es: {
    'nav.informe':'Informe','nav.videos':'Videos','nav.escanear':'Escanear','nav.base':'Base de datos',
    'nav.mapa':'Mapa','nav.propuesta':'Propuestas','nav.actividades':'Jugá y aprendé','nav.opiniones':'Opiniones',
    'hero.eyebrow':'Proyecto educativo · Chicas en Tecnología',
    'hero.title':'Lo que te ponés en la piel, <span>termina en el agua.</span>',
    'hero.lead':'Cada día, miles de partículas de plástico invisibles salen de tu neceser directo al desagüe. Entendé el problema, escaneá tus productos y encontrá alternativas reales en Argentina.',
    'hero.cta1':'📷 Escanear un producto','hero.cta2':'Leer el informe',
    'hero.stat1':'tamaño máximo de un microplástico','hero.stat2':'de algunos cosméticos puede ser plástico','hero.stat3':'filtros que los retienen del todo',
    'reflex.title':'🤔 Reflexionemos','reflex.lead':'Tres escenas, un mismo destino: del espejo de tu baño al fondo del mar.',
    'reflex.s1.title':'Invisibles, pero ahí están',
    'reflex.s1.text':'Un microplástico mide menos de 5mm. No lo ves a simple vista, pero cada lavado de cara puede liberar miles.',
    'reflex.s2.title':'Tu neceser, bajo la lupa',
    'reflex.s2.text':'Exfoliantes, brillos, bases "smooth finish": muchos productos de belleza cotidianos llevan plástico agregado a propósito.',
    'reflex.s3.title':'El destino final: el agua',
    'reflex.s3.text':'Las plantas de tratamiento no filtran todas las partículas. Terminan en ríos, en el mar y, eventualmente, en la cadena alimentaria.',
    'afecta.title':'🌍 ¿Cómo nos afecta como consumidores?',
    'afecta.c1.title':'A través de los alimentos','afecta.c1.text':'Los microplásticos ingeridos por peces y mariscos llegan a nuestra mesa. Se detectaron en agua de canilla, sal marina y mariscos de consumo masivo.',
    'afecta.c2.title':'A través de la piel','afecta.c2.text':'Partículas de cosméticos con microplásticos pueden penetrar la piel o ser inhaladas. Se investiga su vínculo con disrupciones hormonales.',
    'afecta.c3.title':'A través del agua','afecta.c3.text':'El agua potable puede contener microplásticos que los sistemas de tratamiento convencionales no logran retener del todo.',
    'afecta.c4.title':'Impacto en el turismo costero','afecta.c4.text':'Playas con basura plástica generan pérdidas millonarias en turismo y afectan a comunidades costeras cada año.',
    'afecta.flipHint':'💡 Tocá cada tarjeta para darla vuelta',
    'informe.title':'📖 El informe, en criollo',
    'informe.lead':'Todo lo que necesitás entender, explicado simple — para presentar en 3 minutos o leer con calma.',
    'informe.q1':'¿Qué es un microplástico?',
    'informe.a1':'Es cualquier fragmento de plástico de menos de 5 milímetros. Puede fabricarse así a propósito (microesferas en exfoliantes, glitter, agentes de "efecto sedoso" en bases) o formarse cuando un plástico más grande se rompe con el tiempo, el sol o el roce.',
    'informe.q2':'¿Cómo llega al maquillaje?',
    'informe.a2':'Se agrega intencionalmente porque es barato, da textura suave, brillo o efecto "aterciopelado". Aparece bajo nombres como Polyethylene, Nylon-12, PMMA o Polystyrene en la lista de ingredientes (INCI).',
    'informe.q3':'¿Por qué es un problema si es tan chiquito?',
    'informe.a3':'Porque no se biodegrada. Cada vez que te desmaquillás, esas partículas bajan por el desagüe. Las plantas de tratamiento no están diseñadas para atraparlas todas, así que terminan en ríos y en el mar, donde son ingeridas por peces y otros animales — y eventualmente vuelven a nosotros.',
    'informe.q4':'¿Todos los cosméticos tienen microplásticos?',
    'informe.a4':'No. Depende del tipo de producto y de la marca. Por eso esta página incluye una base de datos orientativa: hay categorías de alto riesgo (exfoliantes con microesferas, glitter), de riesgo variable (rímel, sombras en crema) y generalmente más seguras (polvo mineral, labiales con ceras naturales).',
    'informe.q5':'¿Qué puedo hacer hoy?',
    'informe.a5':'Revisar el INCI antes de comprar, elegir exfoliantes con sal o azúcar en vez de microesferas, priorizar marcas con sellos ecológicos, y llevar tus envases vacíos a puntos de recolección o refill en vez de tirarlos.',
    'informe.docsTitle':'Documentos para leer más',
    'videos.title':'🎬 Para seguir viendo',
    'videos.lead':'Documentales y videos cortos sobre microplásticos y belleza, para compartir en tu presentación o ver por tu cuenta.',
    'scan.title':'📷 Escaneá tu producto',
    'scan.lead':'Activá la cámara para enfocar el envase y despues buscalo por nombre en nuestra base para ver el resultado. También podés buscar directo, sin cámara.',
    'scan.placeholder':'La cámara aparecerá acá','scan.analyzing':'Analizando envase…',
    'scan.start':'📷 Activar cámara','scan.stop':'Apagar cámara',
    'scan.searchLabel':'Buscá el producto que fotografiaste',
    'scan.searchPlaceholder':'Ej: Rímel Maybelline Colossal','scan.searchBtn':'Analizar',
    'db.title':'🗂️ Base de datos de maquillaje',
    'db.lead':'Guía orientativa de más de 40 productos y marcas disponibles en Argentina, según el riesgo típico de contener microplásticos. Siempre verificá el INCI del envase: las fórmulas cambian.',
    'db.searchPlaceholder':'Buscar marca o producto…',
    'db.filterAll':'Todos','db.filterHigh':'Contiene','db.filterMed':'Depende','db.filterLow':'Generalmente seguro',
    'map.title':'🗺️ Puntos de reciclaje y refill en Argentina',
    'map.lead':'Ubicaciones de referencia por ciudad de programas de recolección y refill de envases. La disponibilidad puede variar: confirmá siempre en el sitio oficial de cada iniciativa antes de ir.',
    'map.legendTitle':'Referencias',
    'map.note':'¿Conocés un punto que no está? Contalo en <a href="#opiniones">Opiniones</a>.',
    'prop.title':'🌱 Propuesta: hacia una rutina sin microplásticos',
    'prop.lead':'No se trata de dejar de usar maquillaje, sino de elegir mejor. Estas son acciones concretas, de menor a mayor esfuerzo.',
    'prop.brandsTitle':'Marcas con formulación más limpia (Argentina)',
    'prop.commentsTitle':'Comentá sobre marcas o productos',
    'prop.commentsLead':'Dejá tu experiencia con una marca puntual — se suma a los comentarios de cada producto en la base de datos.',
    'prop.commentProduct':'Marca o producto','prop.commentText':'Tu comentario…','prop.commentSend':'Publicar',
    'quiz.title':'🎮 Jugá y aprendé','quiz.lead':'Elegí con un toque la respuesta correcta junto a Gota, o probá el desafío de verdadero o falso. ¡Son juegos cortos, coloridos y pensados para jugar en familia!',
    'quiz.tabQuiz':'🫧 Preguntále a Gota','quiz.tabVF':'Verdadero o falso',
    'gota.name':'Gota',
    'op.title':'💬 ¿Qué te pareció la página?','op.lead':'Tu opinión nos ayuda a mejorar esta propuesta para HackaPUM y más allá.',
    'op.name':'Tu nombre (opcional)','op.namePlaceholder':'Anónimo','op.rating':'Puntuación',
    'op.comment':'Comentario','op.commentPlaceholder':'Contanos qué te gustó o qué mejorarías…',
    'op.send':'Enviar opinión','op.noReviews':'Todavía no hay opiniones',
    'footer.credit':'Proyecto educativo creado para el evento <strong>HackaPUM — Chicas en Tecnología</strong>, 2026.',
    'footer.disclaimer':'La información de esta página es orientativa. Verificá siempre los ingredientes en el envase y consultá <a href="https://www.anmat.gob.ar" target="_blank" rel="noopener">ANMAT</a>.'
  },
  en: {
    'nav.informe':'Report','nav.videos':'Videos','nav.escanear':'Scan','nav.base':'Database',
    'nav.mapa':'Map','nav.propuesta':'Proposals','nav.actividades':'Play & learn','nav.opiniones':'Reviews',
    'hero.eyebrow':'Educational project · Girls in Tech',
    'hero.title':'What you put on your skin <span>ends up in the water.</span>',
    'hero.lead':'Every day, thousands of invisible plastic particles leave your makeup bag straight down the drain. HackaPUM gives us the chance to tell this story: understand the problem, scan your products, and find real alternatives in Argentina.',
    'hero.cta1':'📷 Scan a product','hero.cta2':'Read the report',
    'hero.stat1':'maximum size of a microplastic','hero.stat2':'of some cosmetics can be plastic','hero.stat3':'filters fully remove them',
    'hero.scroll':'Discover more',
    'reflex.title':'🤔 Let\'s reflect','reflex.lead':'Three scenes, one destination: from your bathroom mirror to the bottom of the sea.',
    'reflex.s1.title':'Invisible, but there',
    'reflex.s1.text':'A microplastic is under 5mm. You can\'t see it with the naked eye, but every face wash can release thousands.',
    'reflex.s2.title':'Your makeup bag, under the microscope',
    'reflex.s2.text':'Exfoliants, glitter, "smooth finish" foundations: many everyday beauty products carry plastic added on purpose.',
    'reflex.s3.title':'The final destination: water',
    'reflex.s3.text':'Treatment plants don\'t filter out every particle. They end up in rivers, in the sea, and eventually in the food chain.',
    'afecta.title':'🌍 How does it affect us as consumers?',
    'afecta.c1.title':'Through food','afecta.c1.text':'Microplastics eaten by fish and shellfish reach our table. They\'ve been found in tap water, sea salt and widely-consumed seafood.',
    'afecta.c2.title':'Through the skin','afecta.c2.text':'Cosmetic particles containing microplastics can penetrate skin or be inhaled. Research is looking into links with hormonal disruption.',
    'afecta.c3.title':'Through water','afecta.c3.text':'Drinking water can contain microplastics that conventional treatment systems fail to fully remove.',
    'afecta.c4.title':'Impact on coastal tourism','afecta.c4.text':'Beaches with plastic waste cause millions in tourism losses and affect coastal communities every year.',
    'afecta.flipHint':'💡 Tap each card to flip it',
    'informe.title':'📖 The report, made simple',
    'informe.lead':'Everything you need to understand, explained simply — to present in 3 minutes or read at your own pace.',
    'informe.q1':'What is a microplastic?',
    'informe.a1':'Any plastic fragment under 5 millimeters. It can be manufactured that way on purpose (microbeads in exfoliants, glitter, "smooth finish" agents in foundations) or form when a larger plastic breaks down over time, sun or friction.',
    'informe.q2':'How does it end up in makeup?',
    'informe.a2':'It\'s added intentionally because it\'s cheap and gives a soft texture, shine, or "velvety" effect. It appears under names like Polyethylene, Nylon-12, PMMA or Polystyrene on the ingredient list (INCI).',
    'informe.q3':'Why is it a problem if it\'s so small?',
    'informe.a3':'Because it doesn\'t biodegrade. Every time you remove your makeup, those particles go down the drain. Treatment plants aren\'t designed to catch them all, so they end up in rivers and the sea, get eaten by fish and other animals — and eventually come back to us.',
    'informe.q4':'Do all cosmetics contain microplastics?',
    'informe.a4':'No. It depends on the type of product and the brand. That\'s why this page includes a guiding database: there are high-risk categories (exfoliants with microbeads, glitter), variable-risk ones (mascara, cream eyeshadow), and generally safer ones (mineral powder, lipsticks with natural waxes).',
    'informe.q5':'What can I do today?',
    'informe.a5':'Check the INCI before buying, choose salt or sugar scrubs instead of microbead ones, prioritize brands with eco-labels, and bring your empty containers to collection or refill points instead of throwing them away.',
    'informe.docsTitle':'Documents worth reading',
    'videos.title':'🎬 Keep watching',
    'videos.lead':'Documentaries and short videos about microplastics and beauty, to share in your presentation or watch on your own.',
    'scan.title':'📷 Scan your product',
    'scan.lead':'Turn on the camera to frame the package, then search it by name in our database to see the result. You can also search directly, without the camera.',
    'scan.placeholder':'The camera will appear here','scan.analyzing':'Analyzing package…',
    'scan.start':'📷 Turn on camera','scan.stop':'Turn off camera',
    'scan.searchLabel':'Search for the product you photographed',
    'scan.searchPlaceholder':'e.g. Maybelline Colossal Mascara','scan.searchBtn':'Analyze',
    'db.title':'🗂️ Makeup database',
    'db.lead':'A guiding overview of 40+ products and brands available in Argentina, by typical risk of containing microplastics. Always check the INCI on the package: formulas change.',
    'db.searchPlaceholder':'Search brand or product…',
    'db.filterAll':'All','db.filterHigh':'Contains','db.filterMed':'Depends','db.filterLow':'Generally safe',
    'map.title':'🗺️ Recycling & refill points in Argentina',
    'map.lead':'Reference locations by city for container collection and refill programs. Availability may vary — always confirm on each initiative\'s official site before going.',
    'map.legendTitle':'Legend',
    'map.note':'Know a spot that\'s missing? Tell us in <a href="#opiniones">Reviews</a>.',
    'prop.title':'🌱 Proposal: toward a microplastic-free routine',
    'prop.lead':'It\'s not about giving up makeup, but choosing better. These are concrete actions, from easiest to most involved.',
    'prop.brandsTitle':'Cleaner-formula brands (Argentina)',
    'prop.commentsTitle':'Comment on brands or products',
    'prop.commentsLead':'Share your experience with a specific brand — it\'s added to that product\'s comments in the database.',
    'prop.commentProduct':'Brand or product','prop.commentText':'Your comment…','prop.commentSend':'Post',
    'quiz.title':'🎮 Play & learn','quiz.lead':'Tap the correct answer together with Drop, or try the true-or-false challenge. Short, colorful games made to play as a family!',
    'quiz.tabQuiz':'🫧 Ask Drop','quiz.tabVF':'True or false',
    'gota.name':'Drop',
    'op.title':'💬 What did you think of the page?','op.lead':'Your feedback helps us improve this project for HackaPUM and beyond.',
    'op.name':'Your name (optional)','op.namePlaceholder':'Anonymous','op.rating':'Rating',
    'op.comment':'Comment','op.commentPlaceholder':'Tell us what you liked or what to improve…',
    'op.send':'Send review','op.noReviews':'No reviews yet',
    'footer.credit':'Educational project created for the <strong>HackaPUM — Chicas en Tecnología</strong> event, 2026.',
    'footer.disclaimer':'The information on this page is for guidance only. Always check the ingredients on the package and consult <a href="https://www.anmat.gob.ar" target="_blank" rel="noopener">ANMAT</a>.'
  }
};

let currentLang = store.get('eb-lang', 'es');

function applyI18n(){
  document.documentElement.lang = currentLang;
  const dict = I18N[currentLang];
  $$('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(dict[key] !== undefined) el.innerHTML = dict[key];
  });
  $$('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder');
    if(dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
  });
  $('[data-lang-label]').textContent = currentLang === 'es' ? 'EN' : 'ES';
  renderVideos();
  renderDocs();
  renderDBFilters();
  renderDB();
  renderMapLegend();
  renderSteps();
  renderBrands();
  renderGotaQuestion();
  renderVF();
  renderOpinions();
  renderComments();
  chatApplyLang();
}
$('#lang-toggle').addEventListener('click', ()=>{
  currentLang = currentLang === 'es' ? 'en' : 'es';
  store.set('eb-lang', currentLang);
  applyI18n();
});

/* ---------------------------------------------------------------
   5. CARRUSEL "REFLEXIONEMOS"
--------------------------------------------------------------- */
(function carousel(){
  const track = $('#carousel-track');
  const slides = $$('.slide', track);
  const dotsWrap = $('#carousel-dots');
  let idx = 0, timer;

  slides.forEach((_, i)=>{
    const b = document.createElement('button');
    if(i===0) b.classList.add('active');
    b.addEventListener('click', ()=> go(i));
    dotsWrap.appendChild(b);
  });

  function go(i){
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx*100}%)`;
    $$('button', dotsWrap).forEach((d,k)=> d.classList.toggle('active', k===idx));
    slides.forEach((s,k)=> s.setAttribute('aria-hidden', k!==idx));
    restart();
  }
  function restart(){
    clearTimeout(timer);
    timer = setTimeout(()=> go(idx+1), 6000);
  }
  $('#carousel-prev').addEventListener('click', ()=> go(idx-1));
  $('#carousel-next').addEventListener('click', ()=> go(idx+1));
  restart();
})();

/* ---------------------------------------------------------------
   6. VIDEOS Y DOCUMENTALES
--------------------------------------------------------------- */
const VIDEOS = [
  {
    icon:'🎬', badge:{es:'DOCUMENTAL · NETFLIX', en:'DOCUMENTARY · NETFLIX'},
    title:{es:'Détox de Plásticos (The Plastic Detox)', en:'The Plastic Detox'},
    text:{es:'Explora la relación entre microplásticos, cosmética y salud reproductiva. Estreno 2026.', en:'Explores the link between microplastics, cosmetics and reproductive health. Released 2026.'},
    url:'https://www.netflix.com/'
  },
  {
    icon:'📺', badge:{es:'SERIE · BBC', en:'SERIES · BBC'},
    title:{es:'Belleza al desnudo (Skin Deep)', en:'Skin Deep (BBC)'},
    text:{es:'Cuatro personas investigan por qué los envases de maquillaje son tan difíciles de reciclar.', en:'Four people investigate why makeup packaging is so hard to recycle.'},
    url:'https://www.bbc.com/'
  },
  {
    icon:'🌊', badge:{es:'DOCUMENTAL · LATAM', en:'DOCUMENTARY · LATAM'},
    title:{es:'Plasticósfera: No hay planeta B', en:'Plasticosphere: There is no planet B'},
    text:{es:'Científicos y ambientalistas latinoamericanos exploran el impacto de los microplásticos en el segundo arrecife más grande del mundo.', en:'Latin American scientists explore microplastic impact on the world\'s second-largest reef.'},
    url:'https://www.preserveplanet.org/'
  },
  {
    icon:'🩺', badge:{es:'DOCUMENTAL · ESPAÑA', en:'DOCUMENTARY · SPAIN'},
    title:{es:'Homo Plastic', en:'Homo Plastic'},
    text:{es:'Un director ganador del Goya investiga la relación entre microplásticos y salud a largo plazo.', en:'A Goya-winning director investigates the link between microplastics and long-term health.'},
    url:'https://www.elespanol.com/'
  },
  {
    icon:'🎞️', badge:{es:'CORTO ANIMADO · 8 MIN', en:'ANIMATED SHORT · 8 MIN'},
    title:{es:'The Story of Plastic (corto animado)', en:'The Story of Plastic (animated short)'},
    text:{es:'Un repaso animado y breve al origen del problema del plástico, ideal para abrir una charla.', en:'A brief animated overview of where the plastic problem comes from — great for opening a talk.'},
    url:'https://www.youtube.com/watch?v=iO3SA4YyEYU',
    thumb:'https://img.youtube.com/vi/iO3SA4YyEYU/hqdefault.jpg'
  },
  {
    icon:'🔬', badge:{es:'INFORME · ONG EUROPEAS', en:'REPORT · EU NGOs'},
    title:{es:'Microplásticos en cosméticos (ECHA/UE)', en:'Microplastics in cosmetics (ECHA/EU)'},
    text:{es:'Resumen del reglamento europeo que restringe microplásticos intencionales en cosmética desde 2023.', en:'Overview of the EU regulation restricting intentional microplastics in cosmetics since 2023.'},
    url:'https://echa.europa.eu/'
  }
];
function renderVideos(){
  const grid = $('#video-grid');
  grid.innerHTML = VIDEOS.map((v,i) => `
    <article class="video-card reveal" style="transition-delay:${i*60}ms">
      <div class="video-thumb thumb-grad-${(i%4)+1}">
        ${v.thumb ? `<img src="${v.thumb}" alt="${escapeHTML(v.title[currentLang])}" loading="lazy">` : `<span class="thumb-emoji">${v.icon}</span>`}
        <span class="badge">${escapeHTML(v.badge[currentLang])}</span>
        <span class="play-btn" aria-hidden="true">▶</span>
      </div>
      <div class="video-body">
        <h3>${escapeHTML(v.title[currentLang])}</h3>
        <p>${escapeHTML(v.text[currentLang])}</p>
        <a class="video-link" href="${v.url}" target="_blank" rel="noopener">${currentLang==='es' ? 'Ver más →' : 'Learn more →'}</a>
      </div>
    </article>`).join('');
  observeReveal();
}

/* ---------------------------------------------------------------
   6b. DOCUMENTOS RECOMENDADOS (con miniatura)
--------------------------------------------------------------- */
const DOCS = [
  {
    icon:'📋', color:1,
    title:{es:'Beat the Microbead — Red List (ECHA)', en:'Beat the Microbead — Red List (ECHA)'},
    text:{es:'Lista completa y verificada de microplásticos restringidos en cosmética.', en:'Full, verified list of restricted microplastics in cosmetics.'},
    url:'https://www.beatthemicrobead.org/wp-content/uploads/2019/07/Red-List_new_ECHA.pdf'
  },
  {
    icon:'🏛️', color:2,
    title:{es:'ANMAT — Cosmética en Argentina', en:'ANMAT — Cosmetics in Argentina'},
    text:{es:'Organismo oficial para verificar ingredientes y normativa de cosméticos en el país.', en:'Official body to check cosmetic ingredients and regulations in Argentina.'},
    url:'https://www.anmat.gob.ar'
  }
];
function renderDocs(){
  const grid = $('#doc-grid');
  if(!grid) return;
  grid.innerHTML = DOCS.map((d,i)=>`
    <a class="doc-card reveal" style="transition-delay:${i*70}ms" href="${d.url}" target="_blank" rel="noopener">
      <div class="doc-thumb thumb-grad-${d.color}"><span class="thumb-emoji">${d.icon}</span></div>
      <div class="doc-body">
        <h4>${escapeHTML(d.title[currentLang])}</h4>
        <p>${escapeHTML(d.text[currentLang])}</p>
        <span class="doc-link">${currentLang==='es' ? 'Abrir documento →' : 'Open document →'}</span>
      </div>
    </a>`).join('');
  observeReveal();
}

/* ---------------------------------------------------------------
   7. BASE DE DATOS DE PRODUCTOS (Argentina)
   risk: alto | medio | bajo
--------------------------------------------------------------- */
const CATEGORIES = {
  es: {todas:'Todas las categorías', base:'Base / Corrector', polvo:'Polvo / Rubor', rimel:'Rímel / Pestañas', sombra:'Sombras', delineador:'Delineador', labial:'Labios', exfoliante:'Exfoliantes', glitter:'Glitter / Purpurina', solar:'Protector solar', skincare:'Skincare'},
  en: {todas:'All categories', base:'Foundation / Concealer', polvo:'Powder / Blush', rimel:'Mascara', sombra:'Eyeshadow', delineador:'Eyeliner', labial:'Lips', exfoliante:'Exfoliants', glitter:'Glitter', solar:'Sunscreen', skincare:'Skincare'}
};

const PRODUCTS = [
  {id:1, brand:'Maybelline', name:'Fit Me Base Líquida', cat:'base', risk:'medio', ing:{es:'Puede incluir Nylon-12 o Polymethyl Methacrylate para el "efecto mate/smooth".', en:'May include Nylon-12 or Polymethyl Methacrylate for the "matte/smooth" effect.'}, tip:{es:'Buscá versiones "clean" o mineral de la misma línea.', en:'Look for "clean" or mineral versions of the same line.'}},
  {id:2, brand:'Maybelline', name:'Colossal Rímel', cat:'rimel', risk:'medio', ing:{es:'Formulaciones a base de ceras y polímeros filmógenos; algunas incluyen microplástico para dar volumen.', en:'Wax and film-forming polymer based; some include microplastic for volume.'}, tip:{es:'Revisá el INCI: si aparece "Nylon" o "PMMA", es señal de alerta.', en:'Check the INCI: "Nylon" or "PMMA" listed is a warning sign.'}},
  {id:3, brand:'Maybelline', name:'Superstay Labial Líquido', cat:'labial', risk:'bajo', ing:{es:'Suele basarse en ceras y siliconas, con menor uso de microplástico sólido.', en:'Usually wax and silicone based, with less solid microplastic use.'}, tip:{es:'Aun así, revisá si contiene "Polyethylene" en la lista.', en:'Still, check for "Polyethylene" on the list.'}},
  {id:4, brand:"L'Oréal Paris", name:'Infallible Base', cat:'base', risk:'medio', ing:{es:'Las bases "long wear" suelen usar polímeros filmógenos sintéticos.', en:'"Long wear" foundations often use synthetic film-forming polymers.'}, tip:{es:'Preguntá por líneas "True Match Mineral".', en:'Ask for the "True Match Mineral" line.'}},
  {id:5, brand:"L'Oréal Paris", name:'Le Shadow Stick', cat:'sombra', risk:'bajo', ing:{es:'Formato en barra con ceras; una de las opciones más seguras en sombras.', en:'Stick format with waxes; one of the safer eyeshadow options.'}, tip:{es:'Recomendado como alternativa dentro de sombras.', en:'Recommended as an alternative within eyeshadows.'}},
  {id:6, brand:"L'Oréal Paris", name:'Exfoliante facial clásico', cat:'exfoliante', risk:'alto', ing:{es:'Los exfoliantes de farmacia tradicionales suelen usar microesferas de polietileno.', en:'Traditional drugstore scrubs often use polyethylene microbeads.'}, tip:{es:'Cambialo por uno con azúcar, sal o carozo de fruta molido.', en:'Swap it for one with sugar, salt or ground fruit pits.'}},
  {id:7, brand:'Rimmel London', name:'Kind & Free Base', cat:'base', risk:'bajo', ing:{es:'Línea formulada con ingredientes de origen natural y sin aditivos innecesarios.', en:'Line formulated with natural-origin ingredients and no unnecessary additives.'}, tip:{es:'Envase con % de material reciclado. Apta para piel sensible.', en:'Packaging with recycled content. Suitable for sensitive skin.'}},
  {id:8, brand:'Rimmel London', name:'Kind & Free Rímel', cat:'rimel', risk:'bajo', ing:{es:'Parte de la línea vegana Kind & Free, con fórmula más limpia.', en:'Part of the vegan Kind & Free line, cleaner formula.'}, tip:{es:'Buena opción para reemplazar rímeles convencionales.', en:'Good option to replace conventional mascaras.'}},
  {id:9, brand:'Rimmel London', name:"Wonder'Cloud Sombra Líquida", cat:'sombra', risk:'bajo', ing:{es:'Fórmula líquida de baja concentración de polímeros plásticos sólidos.', en:'Liquid formula with low solid plastic polymer content.'}, tip:{es:'Una de las sombras recomendadas dentro de la línea.', en:'One of the recommended eyeshadows in the line.'}},
  {id:10, brand:'Rimmel London', name:'Mini Power Palette', cat:'sombra', risk:'bajo', ing:{es:'Paleta compacta con base mineral.', en:'Compact palette with mineral base.'}, tip:{es:'Alternativa segura frente a paletas con glitter suelto.', en:'Safe alternative to loose-glitter palettes.'}},
  {id:11, brand:'Max Factor', name:'Miracle Base', cat:'base', risk:'bajo', ing:{es:'Ingredientes mayormente naturales, énfasis hidratante.', en:'Mostly natural ingredients, hydration-focused.'}, tip:{es:'Apta para piel sensible según la marca.', en:'Suitable for sensitive skin per the brand.'}},
  {id:12, brand:'Max Factor', name:'Miracle Corrector', cat:'base', risk:'bajo', ing:{es:'Misma línea Miracle, formulación más limpia.', en:'Same Miracle line, cleaner formulation.'}, tip:{es:'Buena opción para piel sensible.', en:'Good option for sensitive skin.'}},
  {id:13, brand:'Max Factor', name:'Masterpiece Rímel', cat:'rimel', risk:'medio', ing:{es:'Fórmulas "volumen extremo" suelen incorporar polímeros filmógenos.', en:'"Extreme volume" formulas often include film-forming polymers.'}, tip:{es:'Buscá versiones sin "waterproof" extremo: suelen llevar más plástico.', en:'Look for non-extreme-waterproof versions: they tend to carry more plastic.'}},
  {id:14, brand:'Revlon', name:'ColorStay Base', cat:'base', risk:'medio', ing:{es:'Formulación de larga duración con polímeros sintéticos filmógenos.', en:'Long-wear formula with synthetic film-forming polymers.'}, tip:{es:'Cuanto más "16 horas" o "transfer-proof", más probable el plástico.', en:'The more "16-hour" or "transfer-proof", the more likely the plastic content.'}},
  {id:15, brand:'Revlon', name:'Super Lustrous Labial', cat:'labial', risk:'bajo', ing:{es:'Base de ceras y aceites; formato clásico en barra.', en:'Wax and oil base; classic stick format.'}, tip:{es:'Una de las categorías generalmente más seguras.', en:'One of the generally safer categories.'}},
  {id:16, brand:'Avon', name:'True Color Base', cat:'base', risk:'medio', ing:{es:'Línea de venta directa muy difundida en Argentina; fórmulas variables según edición.', en:'Widely sold direct-sales line in Argentina; formulas vary by edition.'}, tip:{es:'Consultá a tu revendedora por versiones "clean" recientes.', en:'Ask your rep about recent "clean" editions.'}},
  {id:17, brand:'Avon', name:'Glimmerstick Delineador', cat:'delineador', risk:'medio', ing:{es:'Formato en lápiz graso, puede incluir ceras sintéticas y siliconas.', en:'Grease-pencil format, may include synthetic waxes and silicones.'}, tip:{es:'Preferí delineadores en polvo prensado.', en:'Prefer pressed-powder eyeliners.'}},
  {id:18, brand:'Natura', name:'Una Base Líquida', cat:'base', risk:'medio', ing:{es:'Marca brasileña con fuerte presencia en Argentina; foco en bioingredientes pero con polímeros en algunas bases.', en:'Brazilian brand with strong presence in Argentina; focus on bio-ingredients but some foundations use polymers.'}, tip:{es:'Natura tiene el programa "Natura Recupera" para envases vacíos.', en:'Natura runs the "Natura Recupera" program for empty containers.'}},
  {id:19, brand:'Natura', name:'Ekos Pulpa Hidratante', cat:'skincare', risk:'bajo', ing:{es:'Envases con aluminio reciclado; formulación con bioingredientes amazónicos.', en:'Packaging with recycled aluminium; formulated with Amazonian bio-ingredients.'}, tip:{es:'Devolvé el envase vacío en tiendas Natura.', en:'Return the empty container at Natura stores.'}},
  {id:20, brand:'Natura', name:'Una Rubor Compacto', cat:'polvo', risk:'bajo', ing:{es:'Polvos compactos suelen tener base mineral con aglutinantes mínimos.', en:'Compact powders are usually mineral-based with minimal binders.'}, tip:{es:'Categoría generalmente segura dentro de la marca.', en:'Generally safe category within the brand.'}},
  {id:21, brand:'essence', name:'Lash Princess Rímel', cat:'rimel', risk:'alto', ing:{es:'Fórmulas económicas "volumen extremo" con alta carga de polímeros plásticos.', en:'Budget "extreme volume" formulas with high plastic-polymer content.'}, tip:{es:'Muy popular en Argentina; revisá el INCI en el dorso del envase.', en:'Very popular in Argentina; check the INCI on the back of the tube.'}},
  {id:22, brand:'essence', name:'Glitter suelto multiuso', cat:'glitter', risk:'alto', ing:{es:'El glitter cosmético tradicional es prácticamente 100% microplástico (PET/PVC).', en:'Traditional cosmetic glitter is almost 100% microplastic (PET/PVC).'}, tip:{es:'Reemplazalo por glitter biodegradable a base de celulosa.', en:'Replace it with biodegradable cellulose-based glitter.'}},
  {id:23, brand:'NYX Professional', name:'Glitter Goals Kit', cat:'glitter', risk:'alto', ing:{es:'Kits de glitter grueso, alto contenido plástico para adherencia.', en:'Chunky glitter kits, high plastic content for adhesion.'}, tip:{es:'Usalo con un fijador biodegradable y evitá que llegue al desagüe.', en:'Use with a biodegradable fixer and avoid rinsing it down the drain.'}},
  {id:24, brand:'NYX Professional', name:'Soft Matte Labial Líquido', cat:'labial', risk:'medio', ing:{es:'Fórmulas mate líquidas con siliconas y polímeros filmógenos.', en:'Liquid matte formulas with silicones and film-forming polymers.'}, tip:{es:'Buscá versiones "matte" con aceites vegetales en vez de silicona pura.', en:'Look for "matte" versions with vegetable oils instead of pure silicone.'}},
  {id:25, brand:'MAC Cosmetics', name:'Studio Fix Polvo Compacto', cat:'polvo', risk:'bajo', ing:{es:'Polvo prensado de base mineral, categoría de bajo riesgo en general.', en:'Mineral-based pressed powder, generally low-risk category.'}, tip:{es:'Buena alternativa dentro de polvos compactos.', en:'Good alternative within compact powders.'}},
  {id:26, brand:'MAC Cosmetics', name:'Dazzleshadow', cat:'sombra', risk:'medio', ing:{es:'Sombras con alto brillo suelen incluir mica recubierta y algo de polímero.', en:'High-shimmer eyeshadows often include coated mica and some polymer.'}, tip:{es:'Preferí acabados mate o satinados antes que "foil" extremo.', en:'Prefer matte or satin finishes over extreme "foil" effects.'}},
  {id:27, brand:'Garnier', name:'Micellar Agua Desmaquillante', cat:'skincare', risk:'bajo', ing:{es:'Producto acuoso sin partículas exfoliantes; riesgo bajo por formato.', en:'Water-based product with no exfoliating particles; low risk by format.'}, tip:{es:'Formato generalmente seguro frente a exfoliantes en crema.', en:'Generally safe format compared to cream scrubs.'}},
  {id:28, brand:'Garnier', name:'SkinActive Exfoliante de Frutas', cat:'exfoliante', risk:'medio', ing:{es:'Algunas versiones combinan partículas naturales con microesferas sintéticas de relleno.', en:'Some versions combine natural particles with synthetic filler microbeads.'}, tip:{es:'Leé el INCI: buscá "cellulose" o "fruit seed powder" en vez de "polyethylene".', en:'Read the INCI: look for "cellulose" or "fruit seed powder" instead of "polyethylene".'}},
  {id:29, brand:'Dermaglós', name:'Crema Facial Hidratante', cat:'skincare', risk:'bajo', ing:{es:'Marca argentina de fórmulas limpias para todo tipo de piel.', en:'Argentine brand with clean formulas for all skin types.'}, tip:{es:'Una de las más recomendadas para piel sensible en Argentina.', en:'One of the most recommended for sensitive skin in Argentina.'}},
  {id:30, brand:'Dermaglós', name:'Exfoliante Corporal', cat:'exfoliante', risk:'bajo', ing:{es:'Formulaciones con partículas naturales, sin microesferas plásticas.', en:'Formulated with natural particles, no plastic microbeads.'}, tip:{es:'Buena alternativa dentro de exfoliantes.', en:'Good alternative within exfoliants.'}},
  {id:31, brand:'Cetaphil', name:'Limpiador Facial Suave', cat:'skincare', risk:'bajo', ing:{es:'Fórmulas sin partículas exfoliantes, enfoque dermatológico.', en:'Formulas without exfoliating particles, dermatological focus.'}, tip:{es:'Apta para piel sensible; sin microplástico agregado.', en:'Suitable for sensitive skin; no added microplastic.'}},
  {id:32, brand:'Cetaphil', name:'Protector Solar Facial', cat:'solar', risk:'bajo', ing:{es:'Los protectores solares en general no llevan microesferas, aunque pueden tener siliconas filmógenas.', en:'Sunscreens generally don\'t carry microbeads, though may contain film-forming silicones.'}, tip:{es:'Preferí filtros minerales (óxido de zinc, dióxido de titanio).', en:'Prefer mineral filters (zinc oxide, titanium dioxide).'}},
  {id:33, brand:'Vogue Cosmetics', name:'Base Compacta', cat:'base', risk:'medio', ing:{es:'Marca argentina de gran distribución; fórmulas de polvo compacto con aglutinantes sintéticos.', en:'Widely distributed Argentine brand; compact powder formulas with synthetic binders.'}, tip:{es:'Consultá el INCI actualizado: la marca fue renovando fórmulas.', en:'Check the updated INCI: the brand has been reformulating.'}},
  {id:34, brand:'Vogue Cosmetics', name:'Labial Mate', cat:'labial', risk:'bajo', ing:{es:'Formato en barra, base de ceras.', en:'Stick format, wax based.'}, tip:{es:'Categoría generalmente de bajo riesgo.', en:'Generally low-risk category.'}},
  {id:35, brand:'Organic Shop', name:'Exfoliante Corporal Orgánico', cat:'exfoliante', risk:'bajo', ing:{es:'Uso mínimo de conservantes, partículas de origen vegetal (café, azúcar).', en:'Minimal preservative use, plant-based particles (coffee, sugar).'}, tip:{es:'Una de las líneas de exfoliantes recomendadas.', en:'One of the recommended exfoliant lines.'}},
  {id:36, brand:'Ruby Rose', name:'Sombra Individual', cat:'sombra', risk:'medio', ing:{es:'Marca brasileña muy vendida en Argentina; sombras económicas con carga variable de polímeros.', en:'Brazilian brand widely sold in Argentina; budget eyeshadows with variable polymer content.'}, tip:{es:'Preferí sus versiones mate a las shimmer intensas.', en:'Prefer matte finishes over intense shimmer versions.'}},
  {id:37, brand:'Ruby Rose', name:'Iluminador en Polvo', cat:'polvo', risk:'medio', ing:{es:'Los iluminadores de brillo intenso suelen usar mica recubierta con polímero.', en:'High-shimmer highlighters often use polymer-coated mica.'}, tip:{es:'Buscá "no PET glitter" en la etiqueta si es posible.', en:'Look for "no PET glitter" on the label if possible.'}},
  {id:38, brand:'Quem', name:'Base en Barra', cat:'base', risk:'medio', ing:{es:'Marca argentina en crecimiento; formato en barra con siliconas para deslizar.', en:'Growing Argentine brand; stick format with silicones for glide.'}, tip:{es:'Revisá el INCI de cada tono: puede variar.', en:'Check the INCI per shade: it can vary.'}},
  {id:39, brand:'Instituto Español', name:'Exfoliante Facial Clásico', cat:'exfoliante', risk:'alto', ing:{es:'Fórmula tradicional de farmacia con microesferas de polietileno.', en:'Traditional drugstore formula with polyethylene microbeads.'}, tip:{es:'Cambialo por un exfoliante con azúcar o avena molida.', en:'Swap it for a sugar or ground oatmeal scrub.'}},
  {id:40, brand:'Farmacity (marca propia)', name:'Base Líquida Cobertura Total', cat:'base', risk:'medio', ing:{es:'Marca propia de cadena de farmacias; fórmulas de larga duración con polímeros filmógenos.', en:'Pharmacy-chain private label; long-wear formulas with film-forming polymers.'}, tip:{es:'Consultá el packaging por versión "sin microplástico".', en:'Check the packaging for a "microplastic-free" version.'}},
  {id:41, brand:'Jazmín Chebar Beauty', name:'Paleta de Sombras', cat:'sombra', risk:'medio', ing:{es:'Línea de diseñadora local; paletas con acabados shimmer variables.', en:'Local designer line; palettes with variable shimmer finishes.'}, tip:{es:'Priorizá los tonos mate de la paleta.', en:'Prioritize the matte shades in the palette.'}},
  {id:42, brand:'Oceane', name:'Gloss Labial Brillante', cat:'labial', risk:'medio', ing:{es:'Marca brasileña popular; los gloss de alto brillo suelen llevar polímeros y a veces micro-glitter.', en:'Popular Brazilian brand; high-shine glosses often carry polymers and sometimes micro-glitter.'}, tip:{es:'Elegí versiones sin partículas brillantes visibles.', en:'Choose versions without visible shimmer particles.'}},
  {id:43, brand:'Natural Life', name:'Exfoliante Corporal de Café', cat:'exfoliante', risk:'bajo', ing:{es:'Marca argentina de cosmética natural; partículas de café molido en vez de plástico.', en:'Argentine natural-cosmetics brand; ground coffee particles instead of plastic.'}, tip:{es:'Buena alternativa 100% biodegradable.', en:'Good 100% biodegradable alternative.'}},
  {id:44, brand:'Payot', name:'Polvo Compacto Mineral', cat:'polvo', risk:'bajo', ing:{es:'Formulación mineral con mínimos aglutinantes sintéticos.', en:'Mineral formulation with minimal synthetic binders.'}, tip:{es:'Una de las opciones más seguras en polvos.', en:'One of the safer options among powders.'}}
];

let dbFilter = 'todos';
let dbCategory = 'todas';
let dbSearch = '';

function renderDBFilters(){
  const sel = $('#db-category');
  const cats = CATEGORIES[currentLang];
  sel.innerHTML = Object.keys(cats).map(k => `<option value="${k}">${escapeHTML(cats[k])}</option>`).join('');
  sel.value = dbCategory;
}

function riskLabel(risk){
  const map = {
    es:{alto:'Contiene', medio:'Depende', bajo:'Generalmente seguro'},
    en:{alto:'Contains', medio:'Depends', bajo:'Generally safe'}
  };
  return map[currentLang][risk];
}

function renderDB(){
  const grid = $('#db-grid');
  const q = dbSearch.trim().toLowerCase();
  const filtered = PRODUCTS.filter(p=>{
    if(dbFilter !== 'todos' && p.risk !== dbFilter) return false;
    if(dbCategory !== 'todas' && p.cat !== dbCategory) return false;
    if(q && !(`${p.brand} ${p.name}`.toLowerCase().includes(q))) return false;
    return true;
  });
  $('#db-count').textContent = currentLang === 'es'
    ? `${filtered.length} de ${PRODUCTS.length} productos`
    : `${filtered.length} of ${PRODUCTS.length} products`;

  grid.innerHTML = filtered.map((p,i) => `
    <button class="product-card reveal" style="transition-delay:${Math.min(i,10)*40}ms" data-id="${p.id}">
      <span class="brand">${escapeHTML(p.brand)}</span>
      <h3>${escapeHTML(p.name)}</h3>
      <span class="cat">${escapeHTML(CATEGORIES[currentLang][p.cat])}</span>
      <span class="risk-badge risk-${p.risk}">${riskLabel(p.risk)}</span>
    </button>`).join('') || `<p class="empty-note">${currentLang==='es' ? 'No encontramos productos con esos filtros.' : 'No products match these filters.'}</p>`;

  $$('.product-card', grid).forEach(card=>{
    card.addEventListener('click', ()=> openProductModal(Number(card.dataset.id)));
  });
  observeReveal();
}
$('#db-search').addEventListener('input', e=>{ dbSearch = e.target.value; renderDB(); });
$('#db-category').addEventListener('change', e=>{ dbCategory = e.target.value; renderDB(); });
$('#db-filters').addEventListener('click', e=>{
  const btn = e.target.closest('.filter-chip');
  if(!btn) return;
  dbFilter = btn.dataset.filter;
  $$('.filter-chip', $('#db-filters')).forEach(b=> b.classList.toggle('active', b===btn));
  renderDB();
});

/* ----- comentarios por producto (localStorage) ----- */
function getComments(productKey){ return store.get('eb-comments', {})[productKey] || []; }
function addComment(productKey, author, text){
  const all = store.get('eb-comments', {});
  all[productKey] = all[productKey] || [];
  all[productKey].unshift({ author: author || (currentLang==='es' ? 'Anónimo' : 'Anonymous'), text, date: new Date().toISOString() });
  store.set('eb-comments', all);
}

function openProductModal(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const modal = $('#product-modal');
  const body = $('#modal-body');
  const comments = getComments(p.brand+'|'+p.name);
  body.innerHTML = `
    <span class="risk-badge risk-${p.risk}">${riskLabel(p.risk)}</span>
    <h2 id="modal-title">${escapeHTML(p.brand)} — ${escapeHTML(p.name)}</h2>
    <p class="cat">${escapeHTML(CATEGORIES[currentLang][p.cat])}</p>
    <p class="ing-list"><strong>${currentLang==='es'?'Ingredientes típicos de riesgo:':'Typical risk ingredients:'}</strong><br>${escapeHTML(p.ing[currentLang])}</p>
    <p class="tip">💡 ${escapeHTML(p.tip[currentLang])}</p>
    <h3 class="sub-title" style="margin-top:1.4rem;font-size:1rem;">${currentLang==='es'?'Comentarios':'Comments'}</h3>
    <form id="modal-comment-form" class="comment-form">
      <input id="modal-comment-author" type="text" placeholder="${currentLang==='es'?'Tu nombre (opcional)':'Your name (optional)'}">
      <textarea id="modal-comment-text" rows="2" required placeholder="${currentLang==='es'?'¿Probaste este producto? Contanos…':'Tried this product? Tell us…'}"></textarea>
      <button class="btn btn-primary" type="submit">${currentLang==='es'?'Publicar':'Post'}</button>
    </form>
    <div class="comment-list" id="modal-comment-list">
      ${comments.length ? comments.map(c=>`<div class="comment-item"><strong>${escapeHTML(c.author)}</strong>: ${escapeHTML(c.text)}<time>${fmtDate(c.date, currentLang)}</time></div>`).join('')
        : `<p class="empty-note">${currentLang==='es'?'Sé la primera persona en comentar.':'Be the first to comment.'}</p>`}
    </div>
  `;
  $('#modal-comment-form').addEventListener('submit', e=>{
    e.preventDefault();
    const author = $('#modal-comment-author').value.trim();
    const text = $('#modal-comment-text').value.trim();
    if(!text) return;
    addComment(p.brand+'|'+p.name, author, text);
    toast(currentLang==='es' ? 'Comentario publicado' : 'Comment posted');
    openProductModal(id);
  });
  modal.classList.add('is-active');
  document.body.style.overflow = 'hidden';
}
function closeProductModal(){
  $('#product-modal').classList.remove('is-active');
  document.body.style.overflow = '';
}
$('#product-modal-close').addEventListener('click', closeProductModal);
$('#product-modal-backdrop').addEventListener('click', closeProductModal);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeProductModal(); });

/* generic comments render hook (for proposal section reuse) */
function renderComments(){ /* placeholder for i18n refresh chain */ }

/* ---------------------------------------------------------------
   8. ESCÁNER DE PRODUCTOS (cámara + búsqueda)
--------------------------------------------------------------- */
(function scanner(){
  const video = $('#scanner-video');
  const placeholder = $('#scanner-placeholder');
  const frame = $('#scanner-frame');
  const overlay = $('#scanner-overlay');
  const overlayText = $('#scanner-overlay-text');
  const startBtn = $('#scan-start');
  const stopBtn = $('#scan-stop');
  const searchInput = $('#scan-search');
  const searchBtn = $('#scan-search-btn');
  const suggestions = $('#scan-suggestions');
  const resultBox = $('#scan-result');
  let stream = null;

  async function startCamera(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
      showResult('error', currentLang==='es' ? 'Tu navegador no permite acceso a la cámara.' : 'Your browser doesn\'t allow camera access.', '');
      return;
    }
    try{
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      video.srcObject = stream;
      await video.play();
      placeholder.hidden = true;
      frame.classList.add('active');
      startBtn.hidden = true;
      stopBtn.hidden = false;
      toast(currentLang==='es' ? 'Cámara activada ✅' : 'Camera on ✅');
    }catch(err){
      showResult('error',
        currentLang==='es' ? 'No pudimos acceder a la cámara.' : 'We couldn\'t access the camera.',
        currentLang==='es' ? 'Revisá los permisos del navegador o probá desde el celular. Mientras tanto, podés buscar tu producto manualmente abajo.' : 'Check your browser permissions or try from your phone. Meanwhile, search your product manually below.'
      );
    }
  }
  function stopCamera(){
    if(stream){ stream.getTracks().forEach(t=>t.stop()); stream = null; }
    video.srcObject = null;
    placeholder.hidden = false;
    frame.classList.remove('active');
    startBtn.hidden = false;
    stopBtn.hidden = true;
  }
  startBtn.addEventListener('click', startCamera);
  stopBtn.addEventListener('click', stopCamera);

  function fuzzyMatch(query){
    const q = query.trim().toLowerCase();
    if(!q) return [];
    return PRODUCTS.filter(p => (`${p.brand} ${p.name}`).toLowerCase().includes(q)).slice(0,6);
  }

  function showSuggestions(list){
    if(!list.length){ suggestions.hidden = true; suggestions.innerHTML=''; return; }
    suggestions.hidden = false;
    suggestions.innerHTML = list.map(p => `<button type="button" data-id="${p.id}">${escapeHTML(p.brand)} — ${escapeHTML(p.name)}</button>`).join('');
    $$('button', suggestions).forEach(b => b.addEventListener('click', ()=>{
      searchInput.value = b.textContent;
      suggestions.hidden = true;
      analyze(Number(b.dataset.id));
    }));
  }
  searchInput.addEventListener('input', ()=> showSuggestions(fuzzyMatch(searchInput.value)));

  function showResult(type, title, text, extra){
    resultBox.hidden = false;
    resultBox.className = `scan-result ${type}`;
    resultBox.innerHTML = `<h3>${escapeHTML(title)}</h3>${text ? `<p>${escapeHTML(text)}</p>`:''}${extra || ''}`;
    resultBox.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  function analyze(productId){
    overlay.hidden = false;
    overlayText.textContent = I18N[currentLang]['scan.analyzing'];
    resultBox.hidden = true;
    setTimeout(()=>{
      overlay.hidden = true;
      const p = PRODUCTS.find(x=>x.id===productId);
      if(!p){
        showResult('error',
          currentLang==='es' ? 'No encontramos ese producto ❌' : 'We couldn\'t find that product ❌',
          currentLang==='es' ? 'Todavía no está en nuestra base de datos. Probá con otro nombre o marca.' : 'It\'s not in our database yet. Try another name or brand.'
        );
        return;
      }
      const label = riskLabel(p.risk);
      const type = p.risk === 'bajo' ? 'success' : (p.risk === 'medio' ? 'warn' : 'error');
      const icon = p.risk === 'bajo' ? '✅' : (p.risk === 'medio' ? '⚠️' : '🚫');
      showResult(type,
        `${icon} ${escapeHTML(p.brand)} ${escapeHTML(p.name)} — ${label}`,
        p.tip[currentLang],
        `<p style="margin-top:.4rem;"><a href="#base-datos" onclick="document.dispatchEvent(new CustomEvent('eb-open-product',{detail:${p.id}}))">${currentLang==='es'?'Ver ficha completa →':'See full listing →'}</a></p>`
      );
    }, 1600);
  }

  function searchAndAnalyze(){
    const q = searchInput.value.trim();
    if(!q){
      showResult('error', currentLang==='es' ? 'Escribí un producto primero' : 'Type a product first', '');
      return;
    }
    const matches = fuzzyMatch(q);
    suggestions.hidden = true;
    if(matches.length === 1){ analyze(matches[0].id); }
    else if(matches.length > 1){ analyze(matches[0].id); }
    else{
      overlay.hidden = false;
      overlayText.textContent = I18N[currentLang]['scan.analyzing'];
      resultBox.hidden = true;
      setTimeout(()=>{
        overlay.hidden = true;
        showResult('error',
          currentLang==='es' ? 'No encontramos ese producto ❌' : 'We couldn\'t find that product ❌',
          currentLang==='es' ? 'Probá buscar solo la marca, o revisá la base de datos completa.' : 'Try searching just the brand, or browse the full database.'
        );
      }, 1200);
    }
  }
  searchBtn.addEventListener('click', searchAndAnalyze);
  searchInput.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); searchAndAnalyze(); } });

  document.addEventListener('eb-open-product', e=> openProductModal(e.detail));
})();

/* ---------------------------------------------------------------
   9. MAPA DE PUNTOS DE RECICLAJE (Leaflet)
--------------------------------------------------------------- */
const MAP_POINTS = [
  {city:{es:'CABA — Palermo', en:'Buenos Aires — Palermo'}, type:'natura', lat:-34.588, lng:-58.430, desc:{es:'Tienda Natura con recolección de envases vacíos (Natura Recupera).', en:'Natura store with empty-container collection (Natura Recupera).'}},
  {city:{es:'CABA — Recoleta', en:'Buenos Aires — Recoleta'}, type:'puntoverde', lat:-34.588, lng:-58.393, desc:{es:'Punto Verde del GCBA para reciclaje de envases en general.', en:'City government "Green Point" for general packaging recycling.'}},
  {city:{es:'CABA — Belgrano', en:'Buenos Aires — Belgrano'}, type:'natura', lat:-34.562, lng:-58.456, desc:{es:'Local Natura con puntos de recolección de envases cosméticos.', en:'Natura store with cosmetic container drop-off.'}},
  {city:{es:'La Plata, Buenos Aires', en:'La Plata, Buenos Aires'}, type:'puntoverde', lat:-34.921, lng:-57.954, desc:{es:'Programa municipal de puntos verdes para residuos reciclables.', en:'Municipal green-points program for recyclable waste.'}},
  {city:{es:'Mar del Plata, Buenos Aires', en:'Mar del Plata, Buenos Aires'}, type:'puntoverde', lat:-38.005, lng:-57.542, desc:{es:'Puntos de reciclaje costeros, foco en reducir residuos en playas.', en:'Coastal recycling points focused on reducing beach waste.'}},
  {city:{es:'Rosario, Santa Fe', en:'Rosario, Santa Fe'}, type:'puntoverde', lat:-32.946, lng:-60.639, desc:{es:'Red municipal "Puntos Verdes" para reciclaje de envases.', en:'Municipal "Green Points" network for packaging recycling.'}},
  {city:{es:'Rafaela, Santa Fe', en:'Rafaela, Santa Fe'}, type:'natura', lat:-31.254, lng:-61.487, desc:{es:'Ciudad con Programa de Economía Circular Re-Rafaela, aliado de Natura/CEMPRE.', en:'City with the Re-Rafaela Circular Economy Program, a Natura/CEMPRE partner.'}},
  {city:{es:'Córdoba Capital', en:'Córdoba City'}, type:'puntoverde', lat:-31.420, lng:-64.189, desc:{es:'Centros verdes municipales para separación de reciclables.', en:'Municipal green centers for recyclable separation.'}},
  {city:{es:'Mendoza Capital', en:'Mendoza City'}, type:'refill', lat:-32.890, lng:-68.845, desc:{es:'Puntos verdes universitarios (UNCUYO) para botellas PET y envases.', en:'University (UNCUYO) green points for PET bottles and containers.'}},
  {city:{es:'Salta Capital', en:'Salta City'}, type:'puntoverde', lat:-24.783, lng:-65.412, desc:{es:'Programa municipal de reciclaje de envases plásticos.', en:'Municipal plastic-packaging recycling program.'}},
  {city:{es:'San Carlos de Bariloche, Río Negro', en:'Bariloche, Río Negro'}, type:'refill', lat:-41.133, lng:-71.310, desc:{es:'Tiendas a granel y refill de cosmética natural en el centro cívico.', en:'Bulk and natural-cosmetics refill shops near the civic center.'}},
  {city:{es:'Neuquén Capital', en:'Neuquén City'}, type:'puntoverde', lat:-38.951, lng:-68.059, desc:{es:'Puntos de reciclaje municipal en plazas principales.', en:'Municipal recycling points in main squares.'}},
  {city:{es:'Tucumán (San Miguel)', en:'Tucumán (San Miguel)'}, type:'puntoverde', lat:-26.808, lng:-65.217, desc:{es:'Iniciativas de recolección diferenciada en el microcentro.', en:'Sorted-waste collection initiatives downtown.'}},
  {city:{es:'Ushuaia, Tierra del Fuego', en:'Ushuaia, Tierra del Fuego'}, type:'refill', lat:-54.808, lng:-68.303, desc:{es:'Comercios locales con recarga de productos de higiene y cosmética.', en:'Local shops offering refill for hygiene and cosmetic products.'}}
];
const MAP_TYPE_META = {
  natura:{ color:'#ff6fa8', label:{es:'Natura Recupera', en:'Natura Recupera'} },
  puntoverde:{ color:'#2bd9c9', label:{es:'Punto Verde municipal', en:'Municipal Green Point'} },
  refill:{ color:'#7dd3fc', label:{es:'Tienda de refill / granel', en:'Refill / bulk store'} }
};
let leafletMap = null;
let leafletMarkers = [];
function initMap(){
  if(leafletMap || !window.L) return;
  leafletMap = L.map('leaflet-map', { scrollWheelZoom:false }).setView([-38.5, -63.5], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:'&copy; OpenStreetMap',
    maxZoom:18
  }).addTo(leafletMap);
  drawMarkers();
}
function drawMarkers(){
  if(!leafletMap) return;
  leafletMarkers.forEach(m => leafletMap.removeLayer(m));
  leafletMarkers = MAP_POINTS.map(pt=>{
    const meta = MAP_TYPE_META[pt.type];
    const marker = L.circleMarker([pt.lat, pt.lng], {
      radius:8, color:meta.color, fillColor:meta.color, fillOpacity:.85, weight:2
    }).addTo(leafletMap);
    marker.bindPopup(`<strong>${escapeHTML(pt.city[currentLang])}</strong><br>${escapeHTML(meta.label[currentLang])}<br><span style="opacity:.8">${escapeHTML(pt.desc[currentLang])}</span>`);
    return marker;
  });
}
function renderMapLegend(){
  const list = $('#map-legend-list');
  list.innerHTML = Object.entries(MAP_TYPE_META).map(([k,v])=>
    `<li><span class="legend-dot" style="background:${v.color}"></span>${escapeHTML(v.label[currentLang])}</li>`
  ).join('');
  drawMarkers();
}
/* init map lazily when section is visible */
const mapObserver = new IntersectionObserver(entries=>{
  entries.forEach(e=>{ if(e.isIntersecting){ initMap(); mapObserver.disconnect(); } });
}, {rootMargin:'200px'});
mapObserver.observe($('#mapa'));

/* ---------------------------------------------------------------
   10. PROPUESTA — pasos y marcas
--------------------------------------------------------------- */
const STEPS = [
  {es:{t:'Leé el INCI antes de comprar', d:'Buscá "Polyethylene", "Nylon-12", "PMMA" o "Polystyrene" en la etiqueta. Si aparecen, ese producto contiene microplástico.'}, en:{t:'Read the INCI before buying', d:'Look for "Polyethylene", "Nylon-12", "PMMA" or "Polystyrene" on the label. If they appear, that product contains microplastic.'}},
  {es:{t:'Cambiá tus exfoliantes', d:'Reemplazá los de microesferas por opciones con azúcar, sal marina o carozos molidos.'}, en:{t:'Switch your exfoliants', d:'Replace microbead scrubs with sugar, sea salt, or ground fruit-pit options.'}},
  {es:{t:'Priorizá sellos ecológicos', d:'"Zero Plastic Inside", OIA Cosmética Natural o Bioproducto Argentino son buenas señales.'}, en:{t:'Prioritize eco-labels', d:'"Zero Plastic Inside", OIA Natural Cosmetics or Argentine Bioproduct are good signs.'}},
  {es:{t:'Llevá tus envases vacíos a reciclar', d:'Usá el mapa de esta página para encontrar el punto Natura Recupera o Punto Verde más cercano.'}, en:{t:'Take your empty containers to recycle', d:'Use this page\'s map to find the nearest Natura Recupera or Green Point.'}},
  {es:{t:'Compartí lo que aprendiste', d:'Contale a alguien más sobre microplásticos — el cambio de hábito empieza por la conversación.'}, en:{t:'Share what you learned', d:'Tell someone else about microplastics — habit change starts with conversation.'}}
];
function renderSteps(){
  $('#prop-steps').innerHTML = STEPS.map((s,i)=>`
    <div class="step-card reveal" style="transition-delay:${i*60}ms">
      <span class="step-num">${i+1}</span>
      <div><h3>${escapeHTML(s[currentLang].t)}</h3><p>${escapeHTML(s[currentLang].d)}</p></div>
    </div>`).join('');
  observeReveal();
}

const BRANDS = [
  {name:'Rimmel London — Kind & Free', es:'Fórmulas veganas y de origen natural, envases con material reciclado.', en:'Vegan, natural-origin formulas, packaging with recycled content.'},
  {name:'Cetaphil', es:'Foco en sostenibilidad de producción, formulación y envasado. Apta piel sensible.', en:'Focus on sustainable production, formulation and packaging. Sensitive-skin friendly.'},
  {name:'Max Factor — Miracle', es:'Ingredientes mayormente naturales, énfasis hidratante.', en:'Mostly natural ingredients, hydration-focused.'},
  {name:'Organic Shop', es:'Gran variedad orgánica con mínimo uso de conservantes.', en:'Wide organic range with minimal preservative use.'},
  {name:'Dermaglós', es:'Fórmulas limpias para todo tipo de piel, marca argentina.', en:'Clean formulas for all skin types, Argentine brand.'},
  {name:'Natura', es:'Programa Natura Recupera: devolvé tus envases vacíos en tienda.', en:'Natura Recupera program: return your empty containers in-store.'}
];
function renderBrands(){
  $('#brand-grid').innerHTML = BRANDS.map((b,i)=>`
    <div class="brand-card reveal" style="transition-delay:${i*50}ms"><h4>${escapeHTML(b.name)}</h4><p>${escapeHTML(b[currentLang])}</p></div>`).join('');
  observeReveal();
}

/* proposal comments (general, not tied to one product id) */
function renderProposalComments(){
  const list = store.get('eb-proposal-comments', []);
  const wrap = $('#proposal-comment-list');
  wrap.innerHTML = list.length ? list.map(c=>`
    <div class="comment-item"><strong>${escapeHTML(c.product)}</strong> — ${escapeHTML(c.text)}<time>${fmtDate(c.date, currentLang)}</time></div>
  `).join('') : `<p class="empty-note">${currentLang==='es' ? 'Todavía no hay comentarios. ¡Sé la primera!' : 'No comments yet. Be the first!'}</p>`;
}
$('#proposal-comment-form').addEventListener('submit', e=>{
  e.preventDefault();
  const product = $('#pc-product').value.trim();
  const text = $('#pc-text').value.trim();
  if(!product || !text) return;
  const list = store.get('eb-proposal-comments', []);
  list.unshift({product, text, date:new Date().toISOString()});
  store.set('eb-proposal-comments', list);
  addComment(product, currentLang==='es'?'Anónimo':'Anonymous', text);
  e.target.reset();
  renderProposalComments();
  toast(currentLang==='es' ? '¡Gracias por tu comentario!' : 'Thanks for your comment!');
});

/* ---------------------------------------------------------------
   11. ACTIVIDADES — PREGUNTÁLE A GOTA + VERDADERO/FALSO
--------------------------------------------------------------- */
$$('.activity-tab').forEach(tab=>{
  tab.addEventListener('click', ()=>{
    $$('.activity-tab').forEach(t=>t.classList.toggle('active', t===tab));
    $('#panel-quiz').hidden = tab.dataset.tab !== 'quiz';
    $('#panel-vf').hidden = tab.dataset.tab !== 'vf';
  });
});

/* Gota (el personaje mascota) hace una pregunta simple con 2 opciones
   grandes e ilustradas con emoji — pensado para que lo pueda jugar
   un nene o nena de 5 años sin necesidad de leer mucho. */
function gotaMascotSVG(){
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M32 6 C42 22 50 32 50 42 A18 18 0 0 1 14 42 C14 32 22 22 32 6 Z" fill="#f2ecff"/>
    <circle cx="22" cy="30" r="4" fill="#ffffff" opacity=".55"/>
    <circle cx="25" cy="40" r="3.4" fill="#3a2a63"/>
    <circle cx="39" cy="40" r="3.4" fill="#3a2a63"/>
    <path d="M24 47 Q32 53 40 47" stroke="#3a2a63" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}

const GOTA_QUESTIONS = [
  { q:{es:'¿Qué es mejor para lavarte la carita?', en:'What\'s better for washing your face?'},
    a:{emoji:'🍯', label:{es:'Azúcar', en:'Sugar'}, correct:true},
    b:{emoji:'🧴', label:{es:'Bolitas de plástico', en:'Plastic beads'}, correct:false},
    fb:{correct:{es:'¡Sí! El azúcar se disuelve y no lastima el agua. 🎉', en:'Yes! Sugar dissolves and doesn\'t hurt the water. 🎉'},
        incorrect:{es:'Las bolitas de plástico no se deshacen y ensucian el mar. 💙', en:'Plastic beads don\'t dissolve and dirty the sea. 💙'}} },
  { q:{es:'¿A dónde van los frasquitos vacíos?', en:'Where do empty little bottles go?'},
    a:{emoji:'♻️', label:{es:'Al punto de reciclaje', en:'The recycling point'}, correct:true},
    b:{emoji:'🚽', label:{es:'Al inodoro', en:'The toilet'}, correct:false},
    fb:{correct:{es:'¡Genial! Así se pueden volver a usar. 🎉', en:'Great! That way they can be used again. 🎉'},
        incorrect:{es:'Mejor llevarlos a un punto verde para reciclar. ♻️', en:'Better to take them to a green point to recycle. ♻️'}} },
  { q:{es:'¿Cómo se ponen los pescaditos si el agua está limpia?', en:'How do the little fish feel when the water is clean?'},
    a:{emoji:'😊', label:{es:'Felices', en:'Happy'}, correct:true},
    b:{emoji:'😢', label:{es:'Tristes', en:'Sad'}, correct:false},
    fb:{correct:{es:'¡Exacto! El agua limpia los hace muy felices. 🐟', en:'Exactly! Clean water makes them very happy. 🐟'},
        incorrect:{es:'Con agua limpia, los pescaditos nadan felices. 🐟', en:'With clean water, the little fish swim happily. 🐟'}} },
  { q:{es:'¿Qué hacemos con la basura de la playa?', en:'What do we do with trash on the beach?'},
    a:{emoji:'🧺', label:{es:'La juntamos', en:'We pick it up'}, correct:true},
    b:{emoji:'🙈', label:{es:'La dejamos ahí', en:'We leave it there'}, correct:false},
    fb:{correct:{es:'¡Muy bien! Juntarla ayuda a cuidar el mar. 🌊', en:'Great job! Picking it up helps care for the sea. 🌊'},
        incorrect:{es:'Es mejor juntarla y tirarla en su lugar. 🧺', en:'It\'s better to pick it up and throw it away properly. 🧺'}} },
  { q:{es:'¿Qué le hace bien al planeta?', en:'What\'s good for the planet?'},
    a:{emoji:'🌱', label:{es:'Cuidar el agua', en:'Caring for water'}, correct:true},
    b:{emoji:'🔥', label:{es:'Ensuciarla', en:'Dirtying it'}, correct:false},
    fb:{correct:{es:'¡Sí! Cuidar el agua cuida a todos. 🌍', en:'Yes! Caring for water cares for everyone. 🌍'},
        incorrect:{es:'Cuidar el agua es lo que le hace bien al planeta. 🌱', en:'Caring for water is what\'s good for the planet. 🌱'}} },
  { q:{es:'¿Qué exfoliante eligen las personas que cuidan el mar?', en:'Which scrub do people who care for the sea choose?'},
    a:{emoji:'🧂', label:{es:'Con sal marina', en:'Sea salt'}, correct:true},
    b:{emoji:'✨', label:{es:'Con glitter plástico', en:'Plastic glitter'}, correct:false},
    fb:{correct:{es:'¡Correcto! La sal se disuelve solita. 🎉', en:'Correct! Salt dissolves on its own. 🎉'},
        incorrect:{es:'El glitter plástico no se deshace nunca. 🧂 es mejor.', en:'Plastic glitter never breaks down. 🧂 is better.'}} }
];
let gotaIdx = 0, gotaScore = 0, gotaAnswered = false;

function renderGotaQuestion(){
  const box = $('#quiz-box');
  if(!box) return;
  if(gotaIdx >= GOTA_QUESTIONS.length){
    box.innerHTML = `
      <div class="gota-box">
        <div class="gota-mascot-wrap happy">${gotaMascotSVG()}</div>
        <div class="gota-score">
          <p class="big">${gotaScore}/${GOTA_QUESTIONS.length}</p>
          <p>${currentLang==='es' ? '¡Gracias por jugar con Gota!' : 'Thanks for playing with Drop!'}</p>
          <button class="btn btn-primary" id="gota-restart">${currentLang==='es' ? 'Jugar de nuevo' : 'Play again'}</button>
        </div>
      </div>`;
    $('#gota-restart').addEventListener('click', ()=>{ gotaIdx=0; gotaScore=0; renderGotaQuestion(); });
    return;
  }
  const item = GOTA_QUESTIONS[gotaIdx];
  gotaAnswered = false;
  const dots = GOTA_QUESTIONS.map((_,i)=> `<span class="${i<gotaIdx?'done':''} ${i===gotaIdx?'current':''}"></span>`).join('');
  box.innerHTML = `
    <div class="gota-box">
      <div class="gota-progress-row">${dots}</div>
      <div class="gota-stage">
        <div class="gota-mascot-wrap" id="gota-mascot">${gotaMascotSVG()}</div>
        <div class="gota-bubble">${escapeHTML(item.q[currentLang])}</div>
      </div>
      <div class="gota-options">
        <button type="button" class="gota-option" data-correct="${item.a.correct}"><span class="em">${item.a.emoji}</span>${escapeHTML(item.a.label[currentLang])}</button>
        <button type="button" class="gota-option" data-correct="${item.b.correct}"><span class="em">${item.b.emoji}</span>${escapeHTML(item.b.label[currentLang])}</button>
      </div>
      <p class="gota-feedback" id="gota-feedback"></p>
    </div>`;
  const mascot = $('#gota-mascot');
  $$('.gota-option', box).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(gotaAnswered) return;
      gotaAnswered = true;
      const correct = btn.dataset.correct === 'true';
      $$('.gota-option', box).forEach(b=>{
        b.disabled = true;
        b.classList.add(b.dataset.correct === 'true' ? 'correct' : 'incorrect');
      });
      if(correct) gotaScore++;
      mascot.classList.add(correct ? 'happy' : 'oops');
      $('#gota-feedback').textContent = (correct ? item.fb.correct[currentLang] : item.fb.incorrect[currentLang]);
      setTimeout(()=>{ gotaIdx++; renderGotaQuestion(); }, 1500);
    });
  });
}

const VF = [
  {s:{es:'El maquillaje en polvo mineral suele ser de bajo riesgo de microplásticos.', en:'Mineral powder makeup is usually low-risk for microplastics.'}, a:true},
  {s:{es:'Todos los rímeles contienen microplástico sin excepción.', en:'All mascaras contain microplastic without exception.'}, a:false},
  {s:{es:'Los microplásticos se biodegradan en pocos meses.', en:'Microplastics biodegrade within a few months.'}, a:false},
  {s:{es:'"Polyethylene" en el INCI es una señal de alerta.', en:'"Polyethylene" on the INCI is a warning sign.'}, a:true},
  {s:{es:'En Argentina existen sellos ecológicos específicos para cosmética.', en:'Argentina has specific eco-labels for cosmetics.'}, a:true},
  {s:{es:'Los microplásticos solo afectan a los animales marinos, no a las personas.', en:'Microplastics only affect marine animals, not people.'}, a:false}
];
let vfIdx = 0, vfScore = 0, vfTotal = 0;
function renderVF(){
  const box = $('#vf-box');
  if(vfIdx >= VF.length){
    box.innerHTML = `<div class="vf-card">
      <p class="quiz-score big" style="font-family:var(--font-display);font-size:2.2rem;color:var(--accent-2);">${vfScore}/${VF.length}</p>
      <button class="btn btn-primary" id="vf-restart">${currentLang==='es'?'Jugar de nuevo':'Play again'}</button>
    </div>`;
    $('#vf-restart').addEventListener('click', ()=>{ vfIdx=0; vfScore=0; renderVF(); });
    return;
  }
  const item = VF[vfIdx];
  box.innerHTML = `
    <div class="vf-card">
      <p class="quiz-progress">${vfIdx+1}/${VF.length}</p>
      <p class="vf-statement">${escapeHTML(item.s[currentLang])}</p>
      <div class="vf-buttons">
        <button class="vf-true" data-v="true">✅ ${currentLang==='es'?'Verdadero':'True'}</button>
        <button class="vf-false" data-v="false">❌ ${currentLang==='es'?'Falso':'False'}</button>
      </div>
      <p class="vf-score" id="vf-feedback"></p>
    </div>`;
  $$('.vf-buttons button', box).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const val = btn.dataset.v === 'true';
      const correct = val === item.a;
      if(correct) vfScore++;
      $('#vf-feedback').textContent = correct ? (currentLang==='es'?'¡Correcto! ✅':'Correct! ✅') : (currentLang==='es'?'No era así ❌':'Not quite ❌');
      setTimeout(()=>{ vfIdx++; renderVF(); }, 900);
    });
  });
}

/* ---------------------------------------------------------------
   12. OPINIONES SOBRE LA PÁGINA
--------------------------------------------------------------- */
let selectedStars = 0;
$$('#star-input button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    selectedStars = Number(btn.dataset.star);
    $$('#star-input button').forEach(b => b.classList.toggle('active', Number(b.dataset.star) <= selectedStars));
  });
});
$('#opinion-form').addEventListener('submit', e=>{
  e.preventDefault();
  if(!selectedStars){ toast(currentLang==='es' ? 'Elegí una puntuación' : 'Choose a rating'); return; }
  const name = $('#op-name').value.trim() || (currentLang==='es'?'Anónimo':'Anonymous');
  const text = $('#op-comment').value.trim();
  if(!text) return;
  const list = store.get('eb-opinions', []);
  list.unshift({name, stars:selectedStars, text, date:new Date().toISOString()});
  store.set('eb-opinions', list);
  e.target.reset();
  selectedStars = 0;
  $$('#star-input button').forEach(b=>b.classList.remove('active'));
  renderOpinions();
  toast(currentLang==='es' ? '¡Gracias por tu opinión!' : 'Thanks for your review!');
});
function renderOpinions(){
  const list = store.get('eb-opinions', []);
  const listEl = $('#opinions-list');
  listEl.innerHTML = list.length ? list.map(o=>`
    <div class="opinion-item">
      <div class="row"><strong>${escapeHTML(o.name)}</strong><span class="stars">${'★'.repeat(o.stars)}${'☆'.repeat(5-o.stars)}</span></div>
      <p>${escapeHTML(o.text)}</p>
      <time>${fmtDate(o.date, currentLang)}</time>
    </div>`).join('') : `<p class="empty-note">${I18N[currentLang]['op.noReviews']}</p>`;

  if(list.length){
    const avg = list.reduce((a,o)=>a+o.stars,0) / list.length;
    $('#avg-number').textContent = avg.toFixed(1);
    const full = Math.round(avg);
    $('#avg-stars').textContent = '★'.repeat(full) + '☆'.repeat(5-full);
    $('#avg-count').textContent = currentLang==='es' ? `${list.length} opinión(es)` : `${list.length} review(s)`;
  } else {
    $('#avg-number').textContent = '–';
    $('#avg-stars').textContent = '☆☆☆☆☆';
    $('#avg-count').textContent = I18N[currentLang]['op.noReviews'];
  }
}

/* ---------------------------------------------------------------
   13. AMIGO VISUAL (CHATBOT)
   Asistente local basado en palabras clave: no depende de una API
   externa, así que responde al instante y funciona sin conexión.
--------------------------------------------------------------- */
function norm(str){
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ');
}

const CHAT_KB = [
  { kw:{es:['hola','buenas','buen dia','buenas tardes','buenas noches','ey','hey'], en:['hi','hello','hey','good morning']},
    a:{es:'¡Hola! Soy Gota, tu guía por EcoBelleza. Preguntame sobre microplásticos, maquillaje, reciclaje o cómo usar la página.', en:'Hi! I\'m Drop, your EcoBelleza guide. Ask me about microplastics, makeup, recycling, or how to use this site.'} },
  { kw:{es:['que es','microplastico','definicion','tamano'], en:['what is','microplastic','definition','size']},
    a:{es:'Un microplástico es cualquier fragmento de plástico de menos de 5mm. Puede fabricarse así a propósito (microesferas, glitter) o formarse cuando un plástico más grande se rompe con el tiempo. Te cuento más en la sección "Informe".', en:'A microplastic is any plastic fragment under 5mm. It can be made that way on purpose (microbeads, glitter) or form when bigger plastic breaks down over time. Check the "Report" section for more.'} },
  { kw:{es:['llega','maquillaje','cosmetico','por que tiene'], en:['reach','makeup','cosmetic','why does']},
    a:{es:'Se agrega a propósito porque es barato y da textura suave o efecto "aterciopelado". Aparece en el INCI como Polyethylene, Nylon-12, PMMA o Polystyrene.', en:'It\'s added on purpose because it\'s cheap and gives a smooth or "velvety" texture. It shows up on the INCI as Polyethylene, Nylon-12, PMMA or Polystyrene.'} },
  { kw:{es:['problema','peligro','dano','salud','grave'], en:['problem','danger','harm','health','serious']},
    a:{es:'No se biodegrada: cada lavado manda partículas al desagüe. Las plantas de tratamiento no las retienen todas, así que terminan en ríos y en el mar, y eventualmente vuelven a nosotros por la cadena alimentaria.', en:'It doesn\'t biodegrade: every wash sends particles down the drain. Treatment plants don\'t catch them all, so they reach rivers and the sea — and eventually come back to us through the food chain.'} },
  { kw:{es:['evitar','elegir','tips','consejos','que puedo hacer','rutina'], en:['avoid','choose','tips','advice','what can i do','routine']},
    a:{es:'Revisá el INCI antes de comprar, elegí exfoliantes con sal o azúcar en vez de microesferas, priorizá marcas con sellos ecológicos y llevá tus envases vacíos a puntos de refill. Mirá la sección "Propuestas" para más ideas.', en:'Check the INCI before buying, choose sugar or salt scrubs instead of microbeads, prioritize eco-certified brands, and take empty containers to refill points. See the "Proposals" section for more ideas.'} },
  { kw:{es:['inci','ingrediente','nylon','polyethylene','pmma','polystyrene','etiqueta'], en:['inci','ingredient','nylon','polyethylene','pmma','polystyrene','label']},
    a:{es:'En la lista de ingredientes (INCI), desconfiá de Polyethylene, Nylon-12, Polymethyl Methacrylate (PMMA) o Polystyrene: son nombres típicos de microplástico agregado.', en:'On the ingredient list (INCI), watch out for Polyethylene, Nylon-12, Polymethyl Methacrylate (PMMA) or Polystyrene: typical names for added microplastic.'} },
  { kw:{es:['exfoliante','microesfera','scrub'], en:['exfoliant','microbead','scrub']},
    a:{es:'Los exfoliantes tradicionales suelen usar microesferas de polietileno. Buscá alternativas con sal marina, azúcar o carozo de fruta molido: exfolian igual y son biodegradables.', en:'Traditional scrubs often use polyethylene microbeads. Look for sea salt, sugar or ground fruit-pit alternatives: they exfoliate just as well and are biodegradable.'} },
  { kw:{es:['glitter','purpurina','brillo'], en:['glitter','sparkle']},
    a:{es:'El glitter cosmético tradicional es casi 100% microplástico. Existen alternativas de celulosa biodegradable que brillan igual sin ese impacto.', en:'Traditional cosmetic glitter is almost 100% microplastic. Biodegradable cellulose alternatives shine just as much without the impact.'} },
  { kw:{es:['reciclar','reciclaje','punto verde','refill','mapa','donde llevo'], en:['recycle','recycling','green point','refill','map','where do i take']},
    a:{es:'En la sección "Mapa" tenés puntos de reciclaje y refill de referencia por ciudad en Argentina. Siempre confirmá disponibilidad en el sitio oficial de cada iniciativa antes de ir.', en:'The "Map" section has reference recycling and refill points by city in Argentina. Always confirm availability on each initiative\'s official site before going.'} },
  { kw:{es:['escanear','escaner','camara','buscar producto','analizar'], en:['scan','scanner','camera','search product','analyze']},
    a:{es:'En "Escanear" podés activar la cámara para enfocar el envase y después buscar el producto por nombre en nuestra base, o buscar directo sin cámara.', en:'In "Scan" you can turn on the camera to frame the package and then search the product by name in our database, or search directly without the camera.'} },
  { kw:{es:['marca','producto','base de datos','recomendame'], en:['brand','product','database','recommend']},
    a:{es:'La "Base de datos" tiene más de 40 productos clasificados por riesgo. En "Propuestas" además hay marcas con formulación más limpia disponibles en Argentina.', en:'The "Database" section has 40+ products classified by risk. "Proposals" also lists cleaner-formula brands available in Argentina.'} },
  { kw:{es:['sello','certificacion','oia','leaping bunny'], en:['seal','certification','leaping bunny']},
    a:{es:'En Argentina existe el sello OIA Cosmética Natural. A nivel internacional también se usan certificaciones como Leaping Bunny o Zero Plastic Inside.', en:'In Argentina there\'s the OIA Natural Cosmetics seal. Internationally, certifications like Leaping Bunny or Zero Plastic Inside are also used.'} },
  { kw:{es:['juego','quiz','preguntale a gota','jugar','gota'], en:['game','quiz','ask drop','play','drop']},
    a:{es:'En "Jugá y aprendé" podés jugar con Gota, nuestra gotita mascota, que te hace preguntas con opciones grandes e ilustradas. También hay un desafío de verdadero o falso.', en:'In "Play & learn" you can play with Drop, our mascot, who asks questions with big illustrated options. There\'s also a true-or-false challenge.'} },
  { kw:{es:['quien','equipo','hackapum','proyecto','sobre'], en:['who','team','hackapum','project','about']},
    a:{es:'EcoBelleza es un proyecto educativo creado para HackaPUM — Chicas en Tecnología, inspirado en el trabajo del equipo "Maquillaje & Microplásticos" (crédito en el pie de página).', en:'EcoBelleza is an educational project made for HackaPUM — Girls in Tech, inspired by the "Makeup & Microplastics" team\'s work (credited in the footer).'} },
  { kw:{es:['gracias','genial','buenisimo'], en:['thanks','thank you','great','awesome']},
    a:{es:'¡De nada! Si tenés otra duda, acá estoy.', en:'You\'re welcome! I\'m here if you have another question.'} },
  { kw:{es:['chau','adios','nos vemos'], en:['bye','goodbye','see you']},
    a:{es:'¡Chau! Volvé cuando quieras, sigo por acá.', en:'Bye! Come back whenever you like, I\'ll be here.'} },
  { kw:{es:['ayuda','que puedo hacer aca','opciones'], en:['help','what can i do here','options']},
    a:{es:'Puedo contarte sobre microplásticos, maquillaje, reciclaje, certificaciones o cómo usar el escáner y la base de datos. ¿Sobre qué querés saber más?', en:'I can tell you about microplastics, makeup, recycling, certifications, or how to use the scanner and database. What would you like to know more about?'} },
  { kw:{es:['biodegradable','se descompone','se deshace'], en:['biodegradable','breaks down','decompose']},
    a:{es:'Biodegradable significa que un material se descompone naturalmente en poco tiempo, gracias a bacterias y microorganismos. El plástico convencional no es biodegradable: puede tardar cientos de años en desaparecer.', en:'Biodegradable means a material breaks down naturally in a short time thanks to bacteria and microorganisms. Conventional plastic isn\'t biodegradable — it can take hundreds of years to disappear.'} },
  { kw:{es:['reciclable','diferencia biodegradable'], en:['recyclable','difference from biodegradable']},
    a:{es:'"Reciclable" significa que un material se puede procesar y transformar en algo nuevo (como un envase de vidrio o de PET). No es lo mismo que "biodegradable", que se descompone solo con el tiempo.', en:'"Recyclable" means a material can be processed and turned into something new (like a glass or PET container). It\'s not the same as "biodegradable", which breaks down on its own over time.'} },
  { kw:{es:['leer etiqueta','como leo','como se lee el inci','paso a paso'], en:['read the label','how do i read','how to read inci','step by step']},
    a:{es:'Para leer una etiqueta: 1) buscá la lista "Ingredients" o INCI en el envase, 2) fijate si aparece Polyethylene, Nylon, PMMA o Polystyrene, 3) si están cerca del principio de la lista, hay más cantidad. ¡Con práctica se hace rápido!', en:'To read a label: 1) find the "Ingredients" or INCI list on the package, 2) check for Polyethylene, Nylon, PMMA or Polystyrene, 3) if they appear near the start of the list, there\'s more of it. It gets quick with practice!'} },
  { kw:{es:['bebes','ninos','chicos','nene','nena','edad'], en:['babies','kids','children','age']},
    a:{es:'Los microplásticos también se detectaron en el cuerpo de bebés y niños, porque están en el aire, el agua y algunos alimentos. Por eso cuidar lo que usamos y reciclamos ayuda a toda la familia.', en:'Microplastics have also been found in babies\' and children\'s bodies, since they\'re in the air, water and some foods. That\'s why taking care of what we use and recycle helps the whole family.'} },
  { kw:{es:['punto verde','que es un punto verde'], en:['green point','what is a green point']},
    a:{es:'Un Punto Verde es un lugar (municipal o de una marca) donde podés dejar envases vacíos, pilas u otros residuos para que se reciclen correctamente. Mirá el mapa de esta página para encontrar uno cerca tuyo.', en:'A Green Point is a place (municipal or brand-run) where you can drop off empty containers, batteries or other waste for proper recycling. Check this page\'s map to find one near you.'} },
  { kw:{es:['no encuentro mi producto','no esta en la base','no aparece'], en:['can\'t find my product','not in the database','doesn\'t show up']},
    a:{es:'Si tu producto no está en la base de datos, probá buscar solo por la marca, o revisá el INCI del envase vos misma/o: si ves Polyethylene, Nylon-12, PMMA o Polystyrene, probablemente tenga microplástico.', en:'If your product isn\'t in the database, try searching just the brand, or check the package\'s INCI yourself: if you see Polyethylene, Nylon-12, PMMA or Polystyrene, it likely contains microplastic.'} },
  { kw:{es:['flip','tarjeta','dar vuelta','tarjetas'], en:['flip','card','turn over','flip card']},
    a:{es:'En "¿Cómo nos afecta?" podés tocar cada tarjeta para que se dé vuelta y descubrir más info del otro lado. ¡Probalas todas!', en:'In "How does it affect us?" you can tap each card to flip it and see more info on the other side. Try them all!'} },
  { kw:{es:['idioma','ingles','cambiar idioma'], en:['language','spanish','change language']},
    a:{es:'Podés cambiar el idioma de la página con el botón "EN"/"ES" en el encabezado, arriba a la derecha.', en:'You can switch the page language with the "EN"/"ES" button in the header, top right.'} },
  { kw:{es:['tema oscuro','tema claro','modo oscuro','modo claro'], en:['dark mode','light mode','dark theme','light theme']},
    a:{es:'Con el botón de sol/luna del encabezado podés cambiar entre modo claro y oscuro, el que te resulte más cómodo.', en:'Use the sun/moon button in the header to switch between light and dark mode, whichever feels more comfortable.'} }
];
const CHAT_GREETING = {
  es:'¡Hola! Soy Gota 💧. Preguntame lo que quieras sobre microplásticos, maquillaje o esta página.',
  en:'Hi! I\'m Drop 💧. Ask me anything about microplastics, makeup, or this site.'
};
const CHAT_FALLBACK = {
  es:'No estoy segura de eso todavía, pero puedo ayudarte con qué son los microplásticos, cómo elegir mejor tu maquillaje, dónde reciclar o cómo usar el escáner.',
  en:'I\'m not sure about that one yet, but I can help with what microplastics are, choosing better makeup, where to recycle, or how to use the scanner.'
};
const CHAT_SUGGESTIONS = {
  es:['¿Qué es un microplástico?','¿Cómo reciclo mis envases?','Recomendame una marca'],
  en:['What\'s a microplastic?','How do I recycle packaging?','Recommend a brand']
};

function chatFindAnswer(msg){
  const n = norm(msg);
  let best = null, bestScore = 0;
  CHAT_KB.forEach(entry=>{
    const words = entry.kw[currentLang] || entry.kw.es;
    let score = 0;
    words.forEach(w=>{ if(n.includes(norm(w))) score++; });
    if(score > bestScore){ bestScore = score; best = entry; }
  });
  return best ? (best.a[currentLang] || best.a.es) : (CHAT_FALLBACK[currentLang] || CHAT_FALLBACK.es);
}

let chatApplyLang = function(){};
(function chatWidget(){
  const widget = $('#chat-widget');
  if(!widget) return;
  const toggleBtn = $('#chat-toggle');
  const panel = $('#chat-panel');
  const closeBtn = $('#chat-close');
  const messagesEl = $('#chat-messages');
  const form = $('#chat-form');
  const input = $('#chat-input');
  const suggestionsEl = $('#chat-suggestions');
  const statusEl = $('#chat-status');
  let opened = false, greeted = false;

  function addMsg(text, who){
    const div = document.createElement('div');
    div.className = 'chat-msg ' + who;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function showTyping(){
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = '<span class="chat-typing"><span></span><span></span><span></span></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }
  function respond(userText){
    addMsg(userText, 'user');
    const typing = showTyping();
    setTimeout(()=>{
      typing.remove();
      addMsg(chatFindAnswer(userText), 'bot');
    }, 500 + Math.random()*500);
  }
  function renderSuggestions(){
    const list = CHAT_SUGGESTIONS[currentLang] || CHAT_SUGGESTIONS.es;
    suggestionsEl.innerHTML = list.map(s=>`<button type="button">${escapeHTML(s)}</button>`).join('');
    $$('button', suggestionsEl).forEach(b=> b.addEventListener('click', ()=> respond(b.textContent)));
  }
  function openChat(){
    opened = true;
    widget.classList.add('open');
    panel.hidden = false;
    toggleBtn.setAttribute('aria-expanded','true');
    if(!greeted){
      greeted = true;
      setTimeout(()=> addMsg(CHAT_GREETING[currentLang] || CHAT_GREETING.es, 'bot'), 200);
    }
    input.focus();
  }
  function closeChat(){
    opened = false;
    widget.classList.remove('open');
    toggleBtn.setAttribute('aria-expanded','false');
    panel.classList.add('closing');
    setTimeout(()=>{
      panel.hidden = true;
      panel.classList.remove('closing');
    }, 190);
  }
  toggleBtn.addEventListener('click', ()=> opened ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const v = input.value.trim();
    if(!v) return;
    input.value = '';
    respond(v);
  });

  chatApplyLang = function(){
    statusEl.textContent = currentLang==='es' ? 'En línea · te ayudo con tus dudas' : 'Online · here to help';
    input.placeholder = currentLang==='es' ? 'Preguntame algo…' : 'Ask me something…';
    renderSuggestions();
  };
  chatApplyLang();
})();

/* ---------------------------------------------------------------
   14. INICIO
--------------------------------------------------------------- */
applyI18n();
renderProposalComments();

})();
