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
// 2. CONFIGURAÇÃO FIREBASE
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

// Persistência só em memória (sempre desloga no refresh)
setPersistence(auth, inMemoryPersistence)
  .then(() => console.log("Persistência definida como 'inMemory'"))
  .catch((error) => console.error("Erro ao definir persistência:", error));

// Conexão com emuladores (se local)
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  console.log("Conectado aos Emuladores");
  connectFirestoreEmulator(db, "localhost", 8081);
  connectAuthEmulator(auth, "http://localhost:9099");
}

// ===============================
// 3. FUNÇÕES UTILITÁRIAS
// ===============================

let bocaAberta = false;
let animacao = null;
let voices = [];
let voicesReady = false;
let bocaTimer = null;

// Carrega vozes assim que o navegador disponibilizar
function carregarVozes() {
  voices = speechSynthesis.getVoices() || [];
  voicesReady = voices.length > 0;
  console.log("Vozes detectadas:", voices.map(v => `${v.name} (${v.lang})`));
}
speechSynthesis.onvoiceschanged = carregarVozes;
// tentativa inicial porque alguns navegadores não disparam onvoiceschanged imediatamente
setTimeout(carregarVozes, 150);

// animação da boca (troca imagem ou adiciona classe)
function animarBoca() {
  if (animacao) return;
  animacao = setInterval(() => {
    bocaAberta = !bocaAberta;
    const avatar = document.getElementById("avatarImg");
    if (avatar) {
      avatar.src = bocaAberta ? "avatar_aberta.png" : "avatar_fechada.png";
    } else {
      // fallback visual por classe
      const el = document.getElementById("boca_lia");
      if (el) el.classList.toggle("aberta");
    }
  }, 180);
}
function pararBoca() {
  if (animacao) {
    clearInterval(animacao);
    animacao = null;
  }
  const avatar = document.getElementById("avatarImg");
  if (avatar) avatar.src = "avatar_fechada.png";
  const el = document.getElementById("boca_lia");
  if (el) el.classList.remove("aberta");
}

// polling fallback para garantir movimento mesmo quando eventos não disparam
function iniciarFallbackBoca() {
  if (bocaTimer) return;
  bocaTimer = setInterval(() => {
    const el = document.getElementById("boca_lia");
    if (el) el.classList.toggle("falando");
  }, 200);
}
function pararFallbackBoca() {
  if (bocaTimer) {
    clearInterval(bocaTimer);
    bocaTimer = null;
  }
  const el = document.getElementById("boca_lia");
  if (el) el.classList.remove("falando");
}

// escolhe voz pt-BR feminina com lógica por navegador
function pickFemalePtBrVoice(list) {
  const ua = navigator.userAgent;
  const isEdge = ua.includes("Edg");
  const isChrome = ua.includes("Chrome") && !isEdge;

  // atualiza lista se necessário
  if ((!list || !list.length) && speechSynthesis.getVoices) {
    list = speechSynthesis.getVoices();
  }
  list = list || [];

  if (isEdge) {
    return (
      list.find(v => v.name === "Microsoft Maria - Portuguese (Brazil)") ||
      list.find(v => v.name === "Microsoft Francisca Online (Natural) - Portuguese (Brazil)") ||
      list.find(v => v.name.toLowerCase().includes("maria")) ||
      list.find(v => v.lang === "pt-BR")
    );
  }

  if (isChrome) {
    return (
      list.find(v => v.name === "Google português do Brasil") ||
      list.find(v => v.name.toLowerCase().includes("google português")) ||
      null // no Chrome, se não tiver Google, deixamos sem voice para evitar mudo
    );
  }

  // outros navegadores
  return list.find(v => v.lang === "pt-BR") || null;
}

// função principal de falar (usa voice escolhida, eventos e fallbacks)
function falar(texto) {
  // garante vozes carregadas; tenta novamente se não estiverem
  if (!voicesReady) {
    voices = speechSynthesis.getVoices() || [];
    voicesReady = voices.length > 0;
  }
  if (!voicesReady) {
    // aguarda um pouco e tenta novamente; evita bloquear a UI
    setTimeout(() => falar(texto), 150);
    return;
  }

  // cancela qualquer fala anterior pendente
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    try { speechSynthesis.cancel(); } catch (e) { /* ignora */ }
  }

  const utter = new SpeechSynthesisUtterance(texto);
  utter.lang = "pt-BR";

  // ajuste de rate/pitch por navegador
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
    console.log("Deixando o navegador usar a voz padrão para evitar mudo no Chrome.");
  }

  // eventos para sincronizar boca
  let started = false;
  utter.onstart = () => {
    started = true;
    animarBoca();
    iniciarFallbackBoca();
  };
  utter.onend = () => {
    pararBoca();
    pararFallbackBoca();
  };
  utter.onerror = (e) => {
    console.warn("Erro na fala:", e);
    pararBoca();
    pararFallbackBoca();
  };

  // mantém referência para evitar GC em alguns navegadores
  window._activeUtterance = utter;

  try {
    speechSynthesis.speak(utter);
  } catch (e) {
    console.warn("speak() falhou, tentando com pequeno delay:", e);
    setTimeout(() => {
      try { speechSynthesis.speak(utter); } catch (err) { console.warn(err); }
    }, 200);
  }

  // fallback: se após 1s nada começou, mostra botão de ativar som
  setTimeout(() => {
    if (!started && !speechSynthesis.speaking) {
      const btn = document.getElementById("ativarSom");
      if (btn) btn.style.display = "block";
    }
  }, 1000);
}

// Inicia o texto com digitação (seu typewriter original), depois chama falar com texto limpo
function startTypewriterAndSpeech() {
  const partes = [
    { texto: "Olá! Eu sou a ", tag: "span" },
    { texto: "Lia", tag: "strong" },
    { texto: "!", tag: "span" },
    { texto: "<br>", tag: "br" },
    { texto: "Adorei te ver no ", tag: "span" },
    { texto: "Meta Day Fatec Sebrae", tag: "em" },
    { texto: "!", tag: "span" },
    { texto: "<br>", tag: "br" },
    { texto: "Deixe seu feedback e nos ajude a melhorar.", tag: "span" }
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
            parteIndex++;
            charIndex = 0;
            setTimeout(typeWriter, 200);
            return;
          }
          if (charIndex === 0) {
            currentNode = document.createElement(parte.tag);
            p.appendChild(currentNode);
          }
          if (charIndex < parte.texto.length) {
            currentNode.textContent += parte.texto.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 40);
          } else {
            parteIndex++;
            charIndex = 0;
            setTimeout(typeWriter, 200);
          }
        }
      }
      typeWriter();
    }
  }

  // chama fala com texto limpo
  const textoLimpo = "Olá! Eu sou a Lia! Adorei te ver no Meta Day Fatec Sebrae! Deixe seu feedback e nos ajude a melhorar.";
  falar(textoLimpo);
}

// Botão fallback (coloque no HTML: <button id="ativarSom" style="display:none">Ativar som</button>)
const btn = document.getElementById("ativarSom");
if (btn) {
  btn.addEventListener("click", () => {
    btn.style.display = "none";
    // tentar desbloquear contexto de áudio
    if (window.AudioContext) {
      try { const ctx = new AudioContext(); if (ctx.state === "suspended") ctx.resume(); } catch (e) {}
    }
    startTypewriterAndSpeech();
  });
}

// inicia automaticamente no carregamento do DOM
window.addEventListener("DOMContentLoaded", () => {
  // garante que vozes tenham chance de carregar antes de disparar
  setTimeout(() => {
    carregarVozes();
    startTypewriterAndSpeech();
  }, 200);
});

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

// ===============================
// 5. EVENT LISTENERS
// ===============================

// Toggle do formulário de login
toggleLoginBtn.addEventListener("click", () => {
  loginForm.classList.toggle("active");
  toggleLoginBtn.textContent = loginForm.classList.contains("active")
    ? "Fechar área restrita"
    : "Área restrita";
});

// Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Erro no login:", error);
    alert("Falha no login. Verifique email e senha.");
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  document.getElementById("loginEmail").value = "";
  document.getElementById("loginPassword").value = "";
});

// Envio de feedback
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("nome").value || "Anônimo";
  const mensagem = document.getElementById("mensagem").value.trim();

  if (!mensagem) {
    statusMsg.textContent = "❌ Digite uma mensagem antes de enviar.";
    statusMsg.style.color = "red";
    return;
  }

  try {
    await addDoc(collection(db, "feedbacks"), {
      nome,
      mensagem,
      criadoEm: new Date()
    });
    form.reset();
    statusMsg.textContent = "✅ Feedback enviado com sucesso!";
    statusMsg.style.color = "green";
    falar("Seu feedback foi enviado com sucesso!");
    setTimeout(() => statusMsg.textContent = "", 3000);
  } catch (error) {
    console.error("Erro ao salvar feedback:", error);
    statusMsg.textContent = "❌ Erro ao enviar feedback. Tente novamente.";
    statusMsg.style.color = "red";
  }
});

// ===============================
// 6. OBSERVADORES
// ===============================
let unsubscribe = null;

onAuthStateChanged(auth, (user) => {
  if (user && user.email === "fatecsebrae@metaday.com.br") {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    userStatus.textContent = `Logado como: ${user.email}`;
    feedbackList.style.display = "block";

    const q = query(collection(db, "feedbacks"), orderBy("criadoEm", "desc"));
    unsubscribe = onSnapshot(q, (snapshot) => {
      feedbackContainer.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "feedback-item";
        div.innerHTML = `<strong>${data.nome}</strong>: ${data.mensagem}`;
        feedbackContainer.appendChild(div);
      });
    });
  } else {
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    userStatus.textContent = "";
    feedbackList.style.display = "none";
    if (unsubscribe) unsubscribe();
  }
});