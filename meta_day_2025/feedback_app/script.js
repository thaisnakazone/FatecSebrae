// ===============================
// script.js — final com click-outside mobile-friendly (avatar removido como autorizador)
// ===============================

// ===============================
// 1. IMPORTS FIREBASE
// ===============================
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, connectFirestoreEmulator,
  query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth, connectAuthEmulator, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  setPersistence, inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// ===============================
// 2. CONFIG FIREBASE
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyBinNESW5Am9fV-5EH4hEfBvhxgqwfRwfE",
  authDomain: "metaday-fatecsebrae.firebaseapp.com",
  projectId: "metaday-fatecsebrae",
  storageBucket: "metaday-fatecsebrae.firebasestorage.app",
  messagingSenderId: "813356147967",
  appId: "1:813356147967:web:40ec819dee718dd4e0d8ca",
  measurementId: "G-8Y56FGSNVL"
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

setPersistence(auth, inMemoryPersistence)
  .then(() => console.log("Persistência definida como 'inMemory'"))
  .catch((error) => console.error("Erro ao definir persistência:", error));

if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  console.log("Conectado aos Emuladores");
  connectFirestoreEmulator(db, "localhost", 8081);
  connectAuthEmulator(auth, "http://localhost:9099");
}

// ===============================
// 3. VOZ, BOCA, TYPEWRITER
// ===============================
let bocaAberta = false;
let animacao = null;
let voices = [];
let voicesReady = false;
let bocaTimer = null;

// DECLARAÇÕES PARA ELEMENTOS USADOS NO BLOCO 8
let nomeInput;
let arrowEl;

function carregarVozes() {
  voices = speechSynthesis.getVoices() || [];
  voicesReady = voices.length > 0;
  console.log("Vozes detectadas:", voices.map(v => `${v.name} (${v.lang})`));
}
speechSynthesis.onvoiceschanged = carregarVozes;
setTimeout(carregarVozes, 150);

function animarBoca() {
  if (animacao) return;
  animacao = setInterval(() => {
    bocaAberta = !bocaAberta;
    const avatar = document.getElementById("avatarImg");
    if (avatar) avatar.src = bocaAberta ? "avatar_aberta.png" : "avatar_fechada.png";
    else {
      const el = document.getElementById("boca_lia");
      if (el) el.classList.toggle("aberta");
    }
  }, 180);
}
function pararBoca() {
  if (animacao) { clearInterval(animacao); animacao = null; }
  const avatar = document.getElementById("avatarImg");
  if (avatar) avatar.src = "avatar_fechada.png";
  const el = document.getElementById("boca_lia");
  if (el) el.classList.remove("aberta");
}
function iniciarFallbackBoca() {
  if (bocaTimer) return;
  bocaTimer = setInterval(() => {
    const el = document.getElementById("boca_lia");
    if (el) el.classList.toggle("falando");
  }, 200);
}
function pararFallbackBoca() {
  if (bocaTimer) { clearInterval(bocaTimer); bocaTimer = null; }
  const el = document.getElementById("boca_lia");
  if (el) el.classList.remove("falando");
}

function pickFemalePtBrVoice(list) {
  const ua = navigator.userAgent;
  const isEdge = ua.includes("Edg");
  const isChrome = ua.includes("Chrome") && !isEdge;
  if ((!list || !list.length) && speechSynthesis.getVoices) list = speechSynthesis.getVoices();
  list = list || [];
  if (isEdge) {
    return list.find(v => v.name === "Microsoft Maria - Portuguese (Brazil)")
      || list.find(v => v.name === "Microsoft Francisca Online (Natural) - Portuguese (Brazil)")
      || list.find(v => v.name.toLowerCase().includes("maria"))
      || list.find(v => v.lang === "pt-BR");
  }
  if (isChrome) {
    return list.find(v => v.name === "Google português do Brasil")
      || list.find(v => v.name.toLowerCase().includes("google português"))
      || null;
  }
  return list.find(v => v.lang === "pt-BR") || null;
}

// preferência exata pela voz Google feminina pt-BR
function pickGoogleFemalePtBrVoice(list) {
  list = list || (speechSynthesis.getVoices ? speechSynthesis.getVoices() : []);
  if (!list || !list.length) return null;

  // 1) correspondência exata com o name que você obteve
  const exactName = 'Google português do Brasil pt-BR';
  const exact = list.find(v => (v.name || '').trim().toLowerCase() === exactName.toLowerCase());
  if (exact) return exact;

  // 2) correspondência por aproximação (casos variados)
  const approx = list.find(v => /google/i.test(v.name) && /pt[-_ ]?br/i.test(v.lang) || /google/i.test(v.name) && /pt[-_ ]?br/i.test(v.name));
  if (approx) return approx;

  // 3) heurística robusta como fallback
  const candidates = [];
  list.forEach(v => {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    if (/google/i.test(name) && /pt-?br/.test(lang)) candidates.push({ v, score: 120 });
    if (name.includes('google português') || name.includes('google portugues') || name.includes('google portuguese')) candidates.push({ v, score: 100 });
    if (/pt-?br/.test(lang)) {
      let s = 60;
      if (/maria|francisca|female|woman|feminine/.test(name)) s += 20;
      candidates.push({ v, score: s });
    }
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].v || null;
}

// função falar() atualizada — substitua sua versão por esta
function falar(texto) {
  return new Promise((resolve) => {
    if (!voicesReady) {
      voices = speechSynthesis.getVoices() || [];
      voicesReady = voices.length > 0;
    }
    if (!voicesReady) {
      setTimeout(() => {
        falar(texto).then(resolve);
      }, 150);
      return;
    }

    if (speechSynthesis.speaking || speechSynthesis.pending) {
      try { speechSynthesis.cancel(); } catch (e) {}
    }

    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = "pt-BR";
    const ua = navigator.userAgent;
    const isEdge = ua.includes("Edg");
    const isChrome = ua.includes("Chrome") && !isEdge;
    utter.rate = isEdge ? 1.2 : 1.0;
    utter.pitch = 1.05;

    // tentativa agressiva de escolher voz Google feminina pt-BR; se não achar, usa seu fallback existente
    const voz = pickGoogleFemalePtBrVoice(voices) || pickFemalePtBrVoice(voices) || null;
    if (voz) {
      try {
        utter.voice = voz;
        console.log("Voz selecionada:", voz.name, voz.lang);
      } catch (e) {
        console.warn("Não foi possível aplicar a voz selecionada:", e);
      }
    } else {
      console.log("Nenhuma voz pt-BR específica encontrada; usando voz padrão do navegador.");
    }

    let started = false;
    utter.onstart = () => {
      started = true;
      animarBoca();
      iniciarFallbackBoca();
    };
    utter.onend = () => {
      pararBoca();
      pararFallbackBoca();
      resolve();
    };
    utter.onerror = (e) => {
      console.warn("Erro na fala:", e);
      pararBoca();
      pararFallbackBoca();
      resolve();
    };

    window._activeUtterance = utter;
    try {
      speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("speak() falhou, tentando com delay:", e);
      setTimeout(() => {
        try { speechSynthesis.speak(utter); } catch (err) { console.warn(err); resolve(); }
      }, 200);
    }

    setTimeout(() => {
      if (!started && !speechSynthesis.speaking) {
        const btn = document.getElementById("ativarSom");
        if (btn) btn.style.display = "block";
      }
    }, 1000);
  });
}

function startTypewriterAndSpeech() {
  const nome = (window.userName || "").trim();
  const saudacao = nome ? `Olá, ${nome}! ` : "Olá! ";

  const partes = [
    { texto: saudacao + "Eu sou a ", tag: "span" },
    { texto: "Lia", tag: "strong" },
    { texto: "!", tag: "span" },
    { texto: "<br>", tag: "br" },
    { texto: "Adorei te ver no ", tag: "span" },
    { texto: "Meta Day Fatec Sebrae", tag: "em" },
    { texto: "!", tag: "span" },
    { texto: "<br>", tag: "br" },
    { texto: "Deixe seu feedback e contribua para experiências cada vez melhores.", tag: "span" }
  ];

  const liaMessage = document.getElementById("liaMessage");
  if (liaMessage) {
    liaMessage.style.opacity = "1";
    const p = liaMessage.querySelector("p");
    if (p) {
      p.innerHTML = "";
      let parteIndex = 0;
      let charIndex = 0;
      let currentNode = null;
      function typeWriter() {
        if (parteIndex < partes.length) {
          const parte = partes[parteIndex];
          if (parte.tag === "br") {
            p.appendChild(document.createElement("br"));
            parteIndex++; charIndex = 0; setTimeout(typeWriter, 200); return;
          }
          if (charIndex === 0) { currentNode = document.createElement(parte.tag); p.appendChild(currentNode); }
          if (charIndex < parte.texto.length) {
            currentNode.textContent += parte.texto.charAt(charIndex);
            charIndex++; setTimeout(typeWriter, 40);
          } else {
            parteIndex++; charIndex = 0; setTimeout(typeWriter, 200);
          }
        }
      }
      typeWriter();
    }
  }

  const textoLimpo = nome
    ? `Olá, ${nome}! Eu sou a Lia! Adorei te ver no Meta Day Fatec Sebrae! Deixe seu feedback e contribua para experiências cada vez melhores.`
    : `Olá! Eu sou a Lia! Adorei te ver no Meta Day Fatec Sebrae! Deixe seu feedback e contribua para experiências cada vez melhores.`;
  falar(textoLimpo);
}

// ===============================
// 4. ELEMENTOS DO DOM (queries leves; bindings feitos após DOMContentLoaded)
// ===============================
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userStatus = document.getElementById("userStatus");
const feedbackList = document.getElementById("feedbackList");
const form = document.getElementById("feedbackForm");
const statusMsg = document.getElementById("statusMsg");
const feedbackContainer = document.getElementById("feedbackContainer");

// ===============================
// 5+6+7+8. DOMContentLoaded: bindings seguros, move botão, toggle login, observador auth, listeners form
// ===============================
let unsubscribe = null; // para onSnapshot

window.addEventListener("DOMContentLoaded", () => {
  // garante que a página inicie no estado intro (Admin escondido)
  document.body.classList.add("intro-active");

  // re-queries que dependem do DOM
  nomeInput = document.getElementById("nomeInicial");
  arrowEl = document.querySelector(".arrow");

  // --- bindings: checkbox "Entrar como anônimo(a)" (colar aqui) ---
  const entrarAnonimo = document.getElementById('entrarAnonimo');

  if (entrarAnonimo && nomeInput) {
    let previousValue = '';

    entrarAnonimo.addEventListener('change', (e) => {
      if (e.target.checked) {
        // guarda valor atual e preenche com Pessoa anônima
        previousValue = nomeInput.value || '';
        nomeInput.value = 'Pessoa anônima';
        nomeInput.setAttribute('aria-label', 'Nome preenchido automaticamente como Pessoa anônima');
        nomeInput.readOnly = true;
        nomeInput.classList.add('disabled');

        // garante que a lógica que mostra a seta rode
        if (typeof atualizarVisibilidadeSeta === 'function') {
          atualizarVisibilidadeSeta();
        } else {
          nomeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } else {
        // restaura e permite edição
        nomeInput.readOnly = false;
        nomeInput.classList.remove('disabled');
        nomeInput.value = previousValue;
        nomeInput.focus();

        if (typeof atualizarVisibilidadeSeta === 'function') {
          atualizarVisibilidadeSeta();
        } else {
          nomeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    nomeInput.addEventListener('input', () => {
      if (!nomeInput.readOnly) {
        // sem ação extra; atualizarVisibilidadeSeta já cuida
      }
    });
  }
  // --- fim bindings anon ---

  // garante estado inicial de botões (logout escondido) com prioridade
  const loginBtnElInit = document.getElementById("loginBtn");
  const logoutBtnElInit = document.getElementById("logoutBtn");
  if (loginBtnElInit) loginBtnElInit.style.setProperty('display','inline-flex','important');
  if (logoutBtnElInit) logoutBtnElInit.style.setProperty('display','none','important');

  // prepara o estado inicial da seta
  if (!nomeInput) console.warn("input #nomeInicial não encontrado no DOM");
  if (arrowEl) { arrowEl.classList.remove("visible"); arrowEl.style.display = "none"; }

  if (nomeInput && arrowEl) {
    const atualizarVisibilidadeSeta = () => {
      const v = nomeInput.value.trim();
      if (v) {
        arrowEl.style.display = "";
        void arrowEl.offsetWidth;
        arrowEl.classList.add("visible");
        arrowEl.setAttribute("aria-hidden", "false");
        arrowEl.style.pointerEvents = "";
      } else {
        arrowEl.classList.remove("visible");
        arrowEl.setAttribute("aria-hidden", "true");
        arrowEl.style.pointerEvents = "none";
        setTimeout(() => {
          if (!arrowEl.classList.contains("visible")) arrowEl.style.display = "none";
        }, 240);
      }
    };

    // expõe a função para ser chamada fora deste escopo (checkbox usa)
    window.atualizarVisibilidadeSeta = atualizarVisibilidadeSeta;

    atualizarVisibilidadeSeta();
    nomeInput.addEventListener("input", atualizarVisibilidadeSeta);

    nomeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (nomeInput.value.trim() === "") {
          nomeInput.classList.add("input-required-shake");
          setTimeout(() => nomeInput.classList.remove("input-required-shake"), 300);
          nomeInput.focus();
          return;
        }
        window.userName = nomeInput.value.trim();
        abrirComLia();
      }
    });
  }

  const ua = navigator.userAgent;
  const isEdge = ua.includes("Edg");
  if (isEdge) {
    const intro = document.getElementById("intro");
    const main = document.getElementById("mainContent");
    if (intro) intro.style.display = "block";
    if (main) main.style.display = "none";
  }

  if (arrowEl) {
    arrowEl.addEventListener("click", (e) => {
      e.preventDefault();
      if (!nomeInput || nomeInput.value.trim() === "") {
        nomeInput?.classList.add("input-required-shake");
        setTimeout(() => nomeInput?.classList.remove("input-required-shake"), 300);
        nomeInput?.focus();
        return;
      }
      window.userName = nomeInput.value.trim();
      abrirComLia();
    });
  } else {
    const fallbackClick = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (["input", "button", "a", "textarea", "select"].includes(tag)) return;
      abrirComLia();
      document.removeEventListener("click", fallbackClick);
    };
    document.addEventListener("click", fallbackClick);
  }

  nomeInput?.focus();

  // --- mover/renomear botão e garantir listeners corretos ---
  const toggleLoginBtnEl = document.getElementById("toggleLoginBtn");
  const topActions = document.querySelector(".top-bar .top-actions");
  const loginFormEl = document.getElementById("loginForm");
  const loginBtnEl = document.getElementById("loginBtn");
  const logoutBtnEl = document.getElementById("logoutBtn");

  // garante aria-hidden inicial se faltar
  if (loginFormEl && !loginFormEl.hasAttribute("aria-hidden")) {
    loginFormEl.setAttribute("aria-hidden", loginFormEl.classList.contains("active") ? "false" : "true");
  }

  if (toggleLoginBtnEl) {
    // renomeia e acessibilidade (texto inicial conforme estado)
    toggleLoginBtnEl.textContent = loginFormEl && loginFormEl.classList.contains("active") ? "Fechar" : "Admin";
    toggleLoginBtnEl.setAttribute("aria-label", "Administração");

    // move para top-actions se existir (se o elemento já estiver dentro, appendChild apenas garante ordem)
    if (topActions && toggleLoginBtnEl.parentNode !== topActions) topActions.appendChild(toggleLoginBtnEl);

    // substituímos a clonagem anterior; o handler robusto é adicionado mais abaixo
  }

  // --- login / logout bindings (garantidos aqui) ---
  if (loginBtnEl) {
    loginBtnEl.addEventListener("click", async () => {
      const email = document.getElementById("loginEmail")?.value || "";
      const password = document.getElementById("loginPassword")?.value || "";
      try { await signInWithEmailAndPassword(auth, email, password); }
      catch (error) { console.error("Erro no login:", error); alert("Falha no login. Verifique email e senha."); }
    });
  }

  if (logoutBtnEl) {
    logoutBtnEl.addEventListener("click", async () => {
      try {
        await signOut(auth);
      } catch (e) { console.warn("Erro ao deslogar:", e); }
      const emailEl = document.getElementById("loginEmail");
      const passEl = document.getElementById("loginPassword");
      if (emailEl) emailEl.value = "";
      if (passEl) passEl.value = "";
    });
  }

  // utilitário: fala e resolve quando terminar
  function speakAndWait(text) {
    // tenta reutilizar a função falar existente se ela retornar uma Promise
    if (typeof falar === 'function') {
      try {
        const r = falar(text);
        if (r && typeof r.then === 'function') return r;
      } catch (e) {
        // se falar lançar, continua para fallback
      }
    }

    return new Promise(resolve => {
      if (!window.speechSynthesis) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }

  // --- form envio feedback ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nome = (window.userName || nomeInput?.value?.trim() || "Pessoa anônima");
      const perfil = document.querySelector('input[name="perfil"]:checked')?.value || null;
      const avaliacaoGeral = document.querySelector('input[name="avaliacaoGeral"]:checked')?.value || null;
      const organizacao = document.querySelector('input[name="organizacao"]:checked')?.value || null;
      const areas = Array.from(document.querySelectorAll('input[name="areas"]:checked')).map(el => el.value);
      const favorito = document.getElementById("favorito")?.value?.trim() || "";
      const comentarios = document.getElementById("comentarios")?.value?.trim() || "";

      try {
        await addDoc(collection(db, "feedbacks"), {
          nome,
          perfil,
          avaliacaoGeral,
          organizacao,
          areas,
          favorito,
          comentarios,
          criadoEm: new Date()
        });

        form.reset();

        const mensagem = "✅ Feedback enviado com sucesso!";
        statusMsg.textContent = mensagem;
        statusMsg.style.color = "green";

        // inicia a fala e aguarda seu término (se existir)
        await speakAndWait("Seu feedback foi enviado com sucesso!");

        // garante que a mensagem permaneça visível por pelo menos 1500ms após a fala
        await new Promise(r => setTimeout(r, 1500));

        // limpa a mensagem
        statusMsg.textContent = "";

        // volta para a tela inicial para o próximo usuário
        voltarParaIntro();

      } catch (error) {
        console.error("Erro ao salvar feedback:", error);
        statusMsg.textContent = "❌ Erro ao enviar feedback. Tente novamente.";
        statusMsg.style.color = "red";
      }
    });
  }

  // --- Observador único para auth (mostra/oculta admin UI e, se admin, carrega feedbacks) ---
  onAuthStateChanged(auth, (user) => {
    console.log('onAuthStateChanged -> user =', user);

    // re-obter elementos (garante que existam no escopo)
    const btn = document.getElementById("toggleLoginBtn");
    const loginBtnEl = document.getElementById("loginBtn");
    const logoutBtnEl = document.getElementById("logoutBtn");
    const userStatus = document.getElementById("userStatus");
    const feedbackList = document.getElementById("feedbackList");

    // RESET PADRÃO: assume não logado (observer é a única fonte de verdade)
    if (btn) btn.style.setProperty('display','', 'important');
    if (loginBtnEl) loginBtnEl.style.setProperty('display','inline-flex','important');
    if (logoutBtnEl) logoutBtnEl.style.setProperty('display','none','important');
    if (userStatus) userStatus.textContent = "";
    if (feedbackList) feedbackList.style.setProperty('display','none','important');

    // Se for admin, ajusta para mostrar área admin
    if (user && user.email === "fatecsebrae@metaday.com.br") {
      if (loginBtnEl) loginBtnEl.style.setProperty('display','none','important');
      if (logoutBtnEl) logoutBtnEl.style.setProperty('display','inline-flex','important');
      if (userStatus) userStatus.textContent = `Logado como: ${user.email}`;
      if (feedbackList) feedbackList.style.setProperty('display','block','important');

      // subscribe aos feedbacks (se for o seu fluxo)
      const q = query(collection(db, "feedbacks"), orderBy("criadoEm", "desc"));
      if (unsubscribe) unsubscribe();
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (feedbackContainer) feedbackContainer.innerHTML = "";
        snapshot.forEach((doc) => {
          const data = doc.data();
          const div = document.createElement("div");
          div.className = "feedback-item";
          div.innerHTML = `
            <p><strong>Nome</strong> ${data.nome || "-"}</p>
            <p><strong>Perfil</strong> ${data.perfil || "-"}</p>
            <p><strong>Avaliação geral</strong> ${data.avaliacaoGeral || "-"}</p>
            <p><strong>Organização</strong> ${data.organizacao || "-"}</p>
            <p><strong>Áreas</strong> ${data.areas ? data.areas.join(", ") : "-"}</p>
            <p><strong>Projeto favorito</strong> ${data.favorito || "-"}</p>
            <p><strong>Comentários</strong> ${data.comentarios || "-"}</p>
          `;
          if (feedbackContainer) feedbackContainer.appendChild(div);
        });
      });
    } else {
      // não admin: limpa subscription se houver
      if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    }
  });

  // --- botão ativar som (fallback) ---
  const btnAtivarSom = document.getElementById("ativarSom");
  if (btnAtivarSom) {
    btnAtivarSom.addEventListener("click", () => {
      btnAtivarSom.style.display = "none";
      if (window.AudioContext) {
        try { const ctx = new AudioContext(); if (ctx.state === "suspended") ctx.resume(); } catch (e) {}
      }
      carregarVozes();
      startTypewriterAndSpeech();
    });
  }

  // --- toggler handlers e click-outside mobile-friendly (somente toggler abre) ---
  (function () {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return console.warn('[login] #loginForm não encontrado (click-outside não habilitado)');

    const togglerSelector = '#toggleLoginBtn';
    const toggler = document.querySelector(togglerSelector);

    let outsideAttached = false;
    let lastToggleAt = 0;
    const MIN_TOGGLE_INTERVAL = 180; // ms - ajuste se quiser mais leniente

    const isOpen = () =>
      loginForm.classList.contains('active') ||
      loginForm.getAttribute('aria-hidden') === 'false';

    function attachOutside() {
      if (outsideAttached) return;
      document.addEventListener('pointerdown', outsideHandler, true);
      document.addEventListener('touchstart', outsideHandler, { capture: true, passive: true });
      outsideAttached = true;
    }
    function detachOutside() {
      if (!outsideAttached) return;
      document.removeEventListener('pointerdown', outsideHandler, true);
      document.removeEventListener('touchstart', outsideHandler, { capture: true, passive: true });
      outsideAttached = false;
    }

    function abrirLoginLocal() {
      if (isOpen()) return;
      loginForm.classList.add('active');
      loginForm.setAttribute('aria-hidden', 'false');
      setTimeout(() => loginForm.querySelector('#loginEmail')?.focus(), 70);
      attachOutside();
      lastToggleAt = Date.now();
      const t = document.querySelector(togglerSelector);
      if (t) t.textContent = 'Fechar';
    }

    function fecharLoginLocal() {
      if (!isOpen()) return;
      loginForm.classList.remove('active');
      loginForm.setAttribute('aria-hidden', 'true');
      detachOutside();
      lastToggleAt = Date.now();
      const t = document.querySelector(togglerSelector);
      if (t) t.textContent = 'Admin';
    }

    function outsideHandler(ev) {
      if (!isOpen()) return;
      const tgt = ev.target;
      if (!tgt) return;
      if (loginForm.contains(tgt)) return;
      if (tgt.closest && tgt.closest(togglerSelector)) return;
      const now = Date.now();
      if (now - lastToggleAt < MIN_TOGGLE_INTERVAL) return;
      fecharLoginLocal();
    }

    function handleToggleClick(ev) {
      ev.preventDefault();
      const now = Date.now();
      if (now - lastToggleAt < MIN_TOGGLE_INTERVAL) return;
      if (isOpen()) fecharLoginLocal();
      else abrirLoginLocal();
    }

    if (toggler) {
      toggler.removeEventListener('click', handleToggleClick);
      toggler.addEventListener('click', handleToggleClick);
    }

    if (isOpen()) attachOutside();

    // Proteção extra: expõe janela de permissão apenas para o toggler (não ao avatar)
    (function secureOpenWrapper() {
      const realAbrirGlobal = window.abrirLogin || function () { abrirLoginLocal(); };
      let allowOpen = false;

      // wrapper global seguro
      window.abrirLogin = function safeAbrirLogin() {
        if (!allowOpen) {
          console.log('abrirLogin bloqueada (não veio do toggler).');
          return;
        }
        allowOpen = false;
        try { realAbrirGlobal(); } catch (e) { abrirLoginLocal(); }
      };

      const togg = document.querySelector(togglerSelector);

      if (togg) {
        togg.removeEventListener('click', handleToggleClick);
        togg.addEventListener('click', function (ev) {
          ev?.preventDefault?.();
          const now = Date.now();
          if (now - lastToggleAt < MIN_TOGGLE_INTERVAL) return;
          if (isOpen()) fecharLoginLocal();
          else {
            allowOpen = true;
            abrirLoginLocal();
          }
        });
      }
    })();

  })();

}); // end DOMContentLoaded

// ===============================
// 8. Funções auxiliares usadas no DOM (fora do DOMContentLoaded)
// ===============================
function abrirComLia() {
  const nomeAtual = (window.userName || nomeInput?.value?.trim() || "").trim();
  if (!nomeAtual) {
    alert("Digite seu nome para começar");
    nomeInput?.focus();
    return;
  }
  window.userName = nomeAtual;

  // remove estado intro-active para exibir admin no topo
  document.body.classList.remove("intro-active");

  const intro = document.getElementById("intro");
  const main = document.getElementById("mainContent");

  if (intro) intro.style.display = "none";
  if (main) { main.style.display = "block"; window.scrollTo({ top: 0, behavior: "smooth" }); }
  if (arrowEl) { arrowEl.classList.remove("visible"); arrowEl.style.display = "none"; }

  carregarVozes();
  startTypewriterAndSpeech();
}

// --- função helper: volta para a tela inicial após envio ---
function voltarParaIntro() {
  window.userName = "";

  // adiciona estado intro-active para ocultar admin no topo
  document.body.classList.add("intro-active");

  const intro = document.getElementById("intro");
  const main = document.getElementById("mainContent"); // única declaração de main
  if (intro) intro.style.display = "";
  if (main) main.style.display = "none";

  if (typeof nomeInput !== 'undefined' && nomeInput) {
    nomeInput.value = "";
    nomeInput.focus();

    if (typeof arrowEl !== 'undefined' && arrowEl) {
      arrowEl.classList.remove("visible");
      arrowEl.setAttribute("aria-hidden", "true");
      arrowEl.style.pointerEvents = "none";
      setTimeout(() => {
        if (!arrowEl.classList.contains("visible")) {
          arrowEl.style.display = "none";
        }
      }, 260);
    }
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  if (main) {
    main.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const header = document.querySelector('header') || document.getElementById('header');
  if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}