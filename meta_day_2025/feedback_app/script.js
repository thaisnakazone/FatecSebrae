// ===============================
// script.js (integrado: saudação com nome + seta como gatilho + salvar todos campos + retornar ao intro)
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
// Declaradas com let para evitar redeclaração em outras seções
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
  if (!voicesReady) {
    voices = speechSynthesis.getVoices() || [];
    voicesReady = voices.length > 0;
  }
  if (!voicesReady) { setTimeout(() => falar(texto), 150); return; }
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
  if (voz && (isEdge || voz.name.includes("Google"))) { utter.voice = voz; console.log("Usando voz:", voz.name); }
  else { if (voz) console.log("Voz detectada (não aplicada no Chrome):", voz.name); console.log("Usando voz padrão do navegador."); }

  let started = false;
  utter.onstart = () => { started = true; animarBoca(); iniciarFallbackBoca(); };
  utter.onend = () => { pararBoca(); pararFallbackBoca(); };
  utter.onerror = (e) => { console.warn("Erro na fala:", e); pararBoca(); pararFallbackBoca(); };

  window._activeUtterance = utter;
  try { speechSynthesis.speak(utter); }
  catch (e) { console.warn("speak() falhou, tentando com delay:", e); setTimeout(() => { try { speechSynthesis.speak(utter); } catch(e){console.warn(e);} }, 200); }

  setTimeout(() => {
    if (!started && !speechSynthesis.speaking) {
      const btn = document.getElementById("ativarSom");
      if (btn) btn.style.display = "block";
    }
  }, 1000);
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
// 4. ELEMENTOS DO DOM
// ===============================
const toggleLoginBtn = document.getElementById("toggleLoginBtn");
const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userStatus = document.getElementById("userStatus");
const feedbackList = document.getElementById("feedbackList");
const form = document.getElementById("feedbackForm");
const statusMsg = document.getElementById("statusMsg");
const feedbackContainer = document.getElementById("feedbackContainer");

// NOTE: nomeInput and arrowEl are assigned after DOMContentLoaded

// ===============================
// 5. EVENT LISTENERS
// ===============================

// Toggle do formulário de login
if (toggleLoginBtn) {
  toggleLoginBtn.addEventListener("click", () => {
    loginForm.classList.toggle("active");
    toggleLoginBtn.textContent = loginForm.classList.contains("active") ? "Fechar área restrita" : "Área restrita";
  });
}

// Login
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (error) { console.error("Erro no login:", error); alert("Falha no login. Verifique email e senha."); }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    const emailEl = document.getElementById("loginEmail");
    const passEl = document.getElementById("loginPassword");
    if (emailEl) emailEl.value = ""; if (passEl) passEl.value = "";
  });
}

// Envio de feedback (agora salva todos os campos + nome)
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

    // if (!comentarios && !favorito) {
    //   statusMsg.textContent = "❌ Escreva ao menos um comentário ou projeto favorito antes de enviar.";
    //   statusMsg.style.color = "red";
    //   return;
    // }

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
      statusMsg.textContent = "✅ Feedback enviado com sucesso!";
      statusMsg.style.color = "green";
      falar("Seu feedback foi enviado com sucesso!");

      // volta para a tela inicial para o próximo usuário
      voltarParaIntro();

      setTimeout(() => statusMsg.textContent = "", 3000);
    } catch (error) {
      console.error("Erro ao salvar feedback:", error);
      statusMsg.textContent = "❌ Erro ao enviar feedback. Tente novamente.";
      statusMsg.style.color = "red";
    }
  });
}

// ===============================
// 6. OBSERVADORES (admin leitura)
// ===============================
let unsubscribe = null;
onAuthStateChanged(auth, (user) => {
  if (user && user.email === "fatecsebrae@metaday.com.br") {
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline";
    if (userStatus) userStatus.textContent = `Logado como: ${user.email}`;
    if (feedbackList) feedbackList.style.display = "block";

    const q = query(collection(db, "feedbacks"), orderBy("criadoEm", "desc"));
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
    if (loginBtn) loginBtn.style.display = "inline";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (userStatus) userStatus.textContent = "";
    if (feedbackList) feedbackList.style.display = "none";
    if (unsubscribe) unsubscribe();
  }
});

// ===============================
// 7. BOTÃO ATIVAR SOM (FALLBACK)
// ===============================
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

// ===============================
// 8. SETA E ABERTURA (seta é gatilho; exige nome)
// ===============================

// Função que abre a UI da Lia, sempre lendo o nome atual do input
function abrirComLia() {
  const nomeAtual = (window.userName || nomeInput?.value?.trim() || "").trim();
  if (!nomeAtual) {
    alert("Digite seu nome para começar");
    nomeInput?.focus();
    return;
  }
  window.userName = nomeAtual;

  const intro = document.getElementById("intro");
  const main = document.getElementById("mainContent");

  if (intro) intro.style.display = "none";
  if (main) { main.style.display = "block"; main.scrollIntoView({ behavior: "smooth" }); }
  if (arrowEl) { arrowEl.classList.remove("visible"); arrowEl.style.display = "none"; }

  carregarVozes();
  startTypewriterAndSpeech();
}

// --- função helper: volta para a tela inicial após envio ---
function voltarParaIntro() {
  // limpa nome guardado
  window.userName = "";

  // esconde o main e mostra intro
  const intro = document.getElementById("intro");
  const main = document.getElementById("mainContent");
  if (intro) intro.style.display = ""; // deixa a exibição padrão do CSS
  if (main) main.style.display = "none";

  // limpa e foca o input para próximo usuário
  if (nomeInput) {
    nomeInput.value = "";
    nomeInput.focus();

    // garante que a seta volte oculta (consistente com sua lógica de visibilidade)
    if (arrowEl) {
      arrowEl.classList.remove("visible");
      arrowEl.setAttribute("aria-hidden", "true");
      arrowEl.style.pointerEvents = "none";
      // opcional: ocultar depois da transição
      setTimeout(() => {
        if (!arrowEl.classList.contains("visible")) {
          arrowEl.style.display = "none";
        }
      }, 260);
    }
  }
}

// ======= Integração: Enter aciona seta e seta só visível quando há nome =======
// (toda a inicialização que precisa do DOM fica aqui)
window.addEventListener("DOMContentLoaded", () => {
  // inicializa referências globais (usadas por outras partes do script)
  nomeInput = document.getElementById("nomeInicial");
  arrowEl = document.querySelector(".arrow");

  if (!nomeInput) {
    console.warn("input #nomeInicial não encontrado no DOM");
  }

  // garante que a seta comece oculta (CSS também controla opacidade/transição)
  if (arrowEl) {
    arrowEl.classList.remove("visible");
    arrowEl.style.display = "none";
  }

  // mostra/oculta a seta conforme o usuário digita
  if (nomeInput && arrowEl) {
    const atualizarVisibilidadeSeta = () => {
      const v = nomeInput.value.trim();
      if (v) {
        arrowEl.style.display = "";
        void arrowEl.offsetWidth; // force reflow para transição
        arrowEl.classList.add("visible");
        arrowEl.setAttribute("aria-hidden", "false");
        arrowEl.style.pointerEvents = "";
      } else {
        arrowEl.classList.remove("visible");
        arrowEl.setAttribute("aria-hidden", "true");
        arrowEl.style.pointerEvents = "none";
        setTimeout(() => {
          if (!arrowEl.classList.contains("visible")) {
            arrowEl.style.display = "none";
          }
        }, 240);
      }
    };

    atualizarVisibilidadeSeta();
    nomeInput.addEventListener("input", atualizarVisibilidadeSeta);

    // Enter aciona a seta, somente se houver texto
    nomeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (nomeInput.value.trim() === "") {
          // feedback visual curto
          nomeInput.classList.add("input-required-shake");
          setTimeout(() => nomeInput.classList.remove("input-required-shake"), 300);
          nomeInput.focus();
          return;
        }
        // seta a variável global e reutiliza a função de abertura
        window.userName = nomeInput.value.trim();
        abrirComLia();
      }
    });
  }

  const ua = navigator.userAgent;
  const isEdge = ua.includes("Edg");

  // Edge: não iniciar automaticamente; deixa intro visível até o usuário digitar e clicar
  if (isEdge) {
    const intro = document.getElementById("intro");
    const main = document.getElementById("mainContent");
    if (intro) intro.style.display = "block";
    if (main) main.style.display = "none";
  }

  // sempre vincula o clique da seta à função (ela vai ler o input no momento)
  if (arrowEl) {
    arrowEl.addEventListener("click", (e) => {
      e.preventDefault();
      if (!nomeInput || nomeInput.value.trim() === "") {
        // feedback curto e foco se usuário tentou clicar sem preencher
        nomeInput?.classList.add("input-required-shake");
        setTimeout(() => nomeInput?.classList.remove("input-required-shake"), 300);
        nomeInput?.focus();
        return;
      }
      window.userName = nomeInput.value.trim();
      abrirComLia();
    });
  } else {
    // fallback: qualquer clique tenta abrir (verifica nome) — uma vez apenas
    const fallbackClick = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (["input", "button", "a", "textarea", "select"].includes(tag)) return;
      abrirComLia();
      document.removeEventListener("click", fallbackClick);
    };
    document.addEventListener("click", fallbackClick);
  }

  // foco automático no input para melhor UX
  nomeInput?.focus();
});