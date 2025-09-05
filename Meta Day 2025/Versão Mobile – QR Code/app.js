const dadosAndares = {
  "Térreo": "No térreo, você encontrará a feira de empreendedores e negócios.",
  "1º andar": "No 1º andar, estão as palestras e workshops.",
  "2º andar": "No 2º andar, temos a área de startups e inovação.",
  "3º andar": "No 3º andar, está a praça de alimentação.",
  "4º andar": "No 4º andar, temos o espaço de networking."
};

let bocaAberta = false;
let animacao;
let voices = [];

// Carrega vozes assim que o navegador disponibilizar
function carregarVozes() {
  voices = speechSynthesis.getVoices();
  console.log("Vozes detectadas:", voices.map(v => `${v.name} (${v.lang})`));
}
speechSynthesis.onvoiceschanged = carregarVozes;

function iniciar() {
  const nome = document.getElementById('nome').value.trim();
  if (!nome) {
    alert("Digite seu nome!");
    return;
  }

  document.getElementById('tela-nome').style.display = 'none';
  document.getElementById('tela-menu').style.display = 'block';

  document.getElementById('saudacao').textContent =
    `Olá, ${nome}! Eu sou a Lia. É um prazer ter você aqui conosco no Meta Day Fatec Sebrae!`;

  document.getElementById('frase').textContent =
    "Clique nos botões abaixo e descubra o que há em cada andar.";

  const botoesDiv = document.getElementById('botoes');
  botoesDiv.innerHTML = '';
  for (let andar in dadosAndares) {
    const btn = document.createElement('button');
    btn.textContent = andar;
    btn.onclick = () => mostrarInfo(andar);
    botoesDiv.appendChild(btn);
  }

  // Aqui usamos a função de sequência
  falarSequencia([
    `Olá, ${nome}! Eu sou a Lia. É um prazer ter você aqui conosco no Meta Day Fatec Sebrae!`,
    "Clique nos botões abaixo e descubra o que há em cada andar."
  ]);
}

function mostrarInfo(andar) {
  document.getElementById('info').textContent = dadosAndares[andar];
  falarSequencia([dadosAndares[andar]]);
}

function falarSequencia(frases) {
  if (frases.length === 0) return;

  const utterance = new SpeechSynthesisUtterance(frases[0]);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.0;

  // Tenta achar a voz "Google português do Brasil"
  let vozGoogle = voices.find(v =>
    v.name.toLowerCase().includes('google') &&
    v.name.toLowerCase().includes('português')
  ) || voices.find(v => v.lang.startsWith('pt'));

  if (vozGoogle) {
    utterance.voice = vozGoogle;
    console.log("Usando voz:", vozGoogle.name);
  }

  utterance.onstart = animarBoca;
  utterance.onend = () => {
    pararBoca();
    // Chama recursivamente para a próxima frase
    falarSequencia(frases.slice(1));
  };

  speechSynthesis.speak(utterance);
}

function animarBoca() {
  animacao = setInterval(() => {
    bocaAberta = !bocaAberta;
    document.getElementById('avatar').src =
      bocaAberta ? 'avatar_aberta.png' : 'avatar_fechada.png';
  }, 200);
}

function pararBoca() {
  clearInterval(animacao);
  document.getElementById('avatar').src = 'avatar_fechada.png';
}