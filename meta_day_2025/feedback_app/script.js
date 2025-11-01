// ===============================
// script.js — final com logs e reset seguro
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

function falar(texto) {
  return new Promise((resolve) => {
    if (!voicesReady) {
      voices = speechSynthesis.getVoices() || [];
      voicesReady = voices.length > 0;
    }
    if (!voicesReady) {
      setTimeout(() => {
        // tenta novamente mantendo a Promise
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

    const voz = pickFemalePtBrVoice(voices);
    if (voz && (isEdge || voz.name.includes("Google"))) {
      utter.voice = voz;
      console.log("Usando voz:", voz.name);
    } else {
      if (voz) console.log("Voz detectada (não aplicada no Chrome):", voz.name);
      console.log("Usando voz padrão do navegador.");
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
        // guarda valor atual e preenche com Anônimo(a)
        previousValue = nomeInput.value || '';
        nomeInput.value = 'Anônimo(a)';
        nomeInput.setAttribute('aria-label', 'Nome preenchido automaticamente como Anônimo ou Anônima');
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

    // opcional: se o usuário editar manualmente enquanto não está readonly,
    // mantemos comportamento normal (não marcamos auto a checkbox)
    nomeInput.addEventListener('input', () => {
      if (!nomeInput.readOnly) {
        // nada extra aqui; o listener já existente atualizarVisibilidadeSeta() cuida da seta
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

    // liga listener seguro: substitui por clone para remover listeners antigos
    const safeBtn = toggleLoginBtnEl.cloneNode(true);
    toggleLoginBtnEl.parentNode.replaceChild(safeBtn, toggleLoginBtnEl);

    // evento que alterna .active e atualiza aria-hidden
    safeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!loginFormEl) return console.warn("loginForm não encontrado");
      const abriu = loginFormEl.classList.toggle("active");
      loginFormEl.setAttribute("aria-hidden", abriu ? "false" : "true");
      safeBtn.textContent = abriu ? "Fechar" : "Admin";
      if (abriu) safeBtn.classList.add("wide"); else safeBtn.classList.remove("wide");
      if (abriu) {
        const email = document.getElementById("loginEmail");
        setTimeout(() => email?.focus(), 50);
      }
    });
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

      const nome = (window.userName || nomeInput?.value?.trim() || "Anônimo");
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

        // limpa a mensagem (opcional: faz isso antes ou depois de voltarParaIntro)
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
    if (btn) btn.style.setProperty('display','', 'important'); // limpa possíveis valores forçados
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

  // se essas variáveis estiverem no escopo global/externo, ok;
  // caso contrário, substitua por document.getElementById(...)
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

  // garantir restauração manual do scroll do history (executar apenas uma vez no boot seria ideal)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // rolar o container principal (se existir) e a janela para o topo
  if (main) {
    // sem comportamento smooth aqui se quiser garantir posição imediata:
    main.scrollTo({ top: 0, behavior: 'smooth' });
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // garantir que o header entre em vista
  const header = document.querySelector('header') || document.getElementById('header');
  if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===============================
// Click-outside robusto para #loginForm (tratando toggler/avatar)
// ===============================
(function () {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return console.warn('[login] #loginForm não encontrado (click-outside não habilitado)');

  // seletor do elemento que reabre/fecha (avatar ou botão admin); ajuste se necessário
  const reopenTogglerSelector = '#avatar, #toggleLoginBtn';

  const isOpen = () =>
    loginForm.classList.contains('active') ||
    loginForm.getAttribute('aria-hidden') === 'false';

  function abrirLogin() {
    loginForm.classList.add('active');
    loginForm.setAttribute('aria-hidden', 'false');
    loginForm.querySelector('#loginEmail')?.focus();
    attachOutsideListener();
  }

  function fecharLogin() {
    loginForm.classList.remove('active');
    loginForm.setAttribute('aria-hidden', 'true');
    detachOutsideListener();
  }

  // handler robusto que ignora cliques dentro do form e no toggler(s)
  function outsideHandler(ev) {
    if (!isOpen()) return;
    const tgt = ev.target;
    // se clicou dentro do form, ignora
    if (loginForm.contains(tgt)) return;
    // se clicou num toggler (avatar ou toggleLoginBtn), ignora para evitar conflito
    if (tgt.closest && tgt.closest(reopenTogglerSelector)) return;
    // fora do form e dos togglers: fecha
    fecharLogin();
  }

  let attached = false;
  function attachOutsideListener() {
    if (attached) return;
    document.addEventListener('pointerdown', outsideHandler, true); // capture
    attached = true;
    // console.log('[login] outside listener attached');
  }
  function detachOutsideListener() {
    if (!attached) return;
    document.removeEventListener('pointerdown', outsideHandler, true);
    attached = false;
    // console.log('[login] outside listener detached');
  }

  // se existir um toggler local, substitui/integra seu handler para usar abrir/fechar
  const togglerLocal = document.querySelector('#toggleLoginBtn');
  if (togglerLocal) {
    // substitui listeners antigos com clone apenas se ainda não exposto
    const clone = togglerLocal.cloneNode(true);
    togglerLocal.parentNode.replaceChild(clone, togglerLocal);
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      if (isOpen()) fecharLogin(); else abrirLogin();
    });
  }

  // se houver avatar que também abre o admin, integre sem duplicar handlers
  const avatar = document.getElementById('avatar');
  if (avatar) {
    avatar.addEventListener('click', (e) => {
      e.preventDefault();
      if (isOpen()) fecharLogin(); else abrirLogin();
    });
  }

  // se o form iniciar aberto, anexa listener
  if (isOpen()) attachOutsideListener();

  // expõe funções se outro código quiser usá-las
  window.abrirLogin = abrirLogin;
  window.fecharLogin = fecharLogin;
})();