// CONFIGURAÇÃO FIXA DO ALUNO
const CONFIG_ALUNO = {
  turma: "8C",
  numeroChamada: 6,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// ============================================================
// DADOS FICTÍCIOS DO 8º ANO (fallback quando não há dados na API)
// ============================================================
const dadosFicticios = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Média mínima de referência
const MEDIA_MINIMA = 6.0;

// Estado da sessão em memória
let pinSessao = null;
let dadosBoletimAtual = null;

// ============================================================
// FUNÇÃO: normalizarNota
// Converte qualquer nota antiga/legada para a escala 0–10.
// Retorna null quando a nota ainda não foi lançada ou é inválida.
// ============================================================
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = typeof valor === "string"
    ? parseFloat(valor.replace(",", "."))
    : valor;

  if (isNaN(numero)) {
    return null;
  }

  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  return null;
}

// ============================================================
// FUNÇÃO: calcularMedia
// ============================================================
function calcularMedia(notas) {
  const notasValidas = notas.filter((n) => n !== null);

  if (notasValidas.length === 0) {
    return null;
  }

  const soma = notasValidas.reduce((total, n) => total + n, 0);
  return soma / notasValidas.length;
}

// ============================================================
// FUNÇÃO: definirSituacao
// ============================================================
function definirSituacao(media) {
  if (media === null) {
    return { texto: "Nota ainda não disponível", classe: "situacao-indisponivel" };
  }
  if (media >= MEDIA_MINIMA) {
    return { texto: "Bom desempenho", classe: "situacao-bom" };
  }
  return { texto: "Atenção", classe: "situacao-atencao" };
}

// ============================================================
// FUNÇÃO: somarFaltas
// ============================================================
function somarFaltas(faltas) {
  if (!Array.isArray(faltas)) return 0;
  return faltas.reduce((total, f) => total + (Number(f) || 0), 0);
}

// ============================================================
// FUNÇÃO: formatarNota
// ============================================================
function formatarNota(nota) {
  if (nota === null || nota === undefined) {
    return "—";
  }
  return Number(nota).toFixed(1).replace(".", ",");
}

// ============================================================
// ELEMENTOS DO DOM
// ============================================================
const inputPin = document.getElementById("input-pin");
const btnEntrar = document.getElementById("btn-entrar");
const msgLogin = document.getElementById("msg-login");
const secaoLogin = document.getElementById("secao-login");
const conteudoBoletim = document.getElementById("conteudo-boletim");
const corpoTabela = document.getElementById("corpo-tabela");

const btnAlterarDados = document.getElementById("btn-alterar-dados");
const modalEdicao = document.getElementById("modal-edicao");
const corpoTabelaEdicao = document.getElementById("corpo-tabela-edicao");
const btnSalvar = document.getElementById("btn-salvar");
const btnCancelar = document.getElementById("btn-cancelar");
const msgEdicao = document.getElementById("msg-edicao");

// ============================================================
// LOGIN / ABRIR BOLETIM
// ============================================================
btnEntrar.addEventListener("click", abrirBoletim);

async function abrirBoletim() {
  const pinDigitado = inputPin.value.trim();

  if (!pinDigitado) {
    msgLogin.textContent = "Por favor, digite o PIN.";
    return;
  }

  msgLogin.textContent = "Conectando...";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
      return;
    }

    if (resposta.status === 429) {
      msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      return;
    }

    if (!resposta.ok) {
      msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      return;
    }

    const resultado = await resposta.json();

    // Guardar PIN na memória durante a sessão e limpar campo do DOM
    pinSessao = pinDigitado;
    inputPin.value = "";

    // Regra de prioridade: Dados da API > Dados locais
    if (resultado && resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      dadosBoletimAtual = resultado.dados.disciplinas;
    } else {
      dadosBoletimAtual = dadosFicticios;
    }

    secaoLogin.style.display = "none";
    conteudoBoletim.style.display = "block";
    renderizarBoletim(dadosBoletimAtual);

  } catch (erro) {
    msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  }
}

// ============================================================
// RENDERIZAÇÃO DA TABELA E CARDS
// ============================================================
function renderizarBoletim(listaDisciplinas) {
  corpoTabela.innerHTML = "";

  const resumoDisciplinas = listaDisciplinas.map((item) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const media = calcularMedia([n1, n2, n3]);
    const faltasArray = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const faltasTotais = somarFaltas(faltasArray);
    const situacao = definirSituacao(media);

    return {
      disciplina: item.disciplina,
      n1, n2, n3,
      media,
      faltasTotais,
      situacao
    };
  });

  resumoDisciplinas.forEach((d) => {
    const linha = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = d.disciplina;

    const tdTri1 = document.createElement("td");
    tdTri1.textContent = formatarNota(d.n1);

    const tdTri2 = document.createElement("td");
    tdTri2.textContent = formatarNota(d.n2);

    const tdTri3 = document.createElement("td");
    tdTri3.textContent = formatarNota(d.n3);

    const tdMedia = document.createElement("td");
    tdMedia.textContent = formatarNota(d.media);

    const tdFaltas = document.createElement("td");
    tdFaltas.textContent = d.faltasTotais;

    const tdSituacao = document.createElement("td");
    tdSituacao.className = d.situacao.classe;
    tdSituacao.textContent = d.situacao.texto;

    linha.appendChild(tdNome);
    linha.appendChild(tdTri1);
    linha.appendChild(tdTri2);
    linha.appendChild(tdTri3);
    linha.appendChild(tdMedia);
    linha.appendChild(tdFaltas);
    linha.appendChild(tdSituacao);

    corpoTabela.appendChild(linha);
  });

  // Atualizar cards
  const mediasDisponiveis = resumoDisciplinas
    .map((d) => d.media)
    .filter((m) => m !== null);

  const mediaGeral = mediasDisponiveis.length > 0
    ? mediasDisponiveis.reduce((t, m) => t + m, 0) / mediasDisponiveis.length
    : null;

  const totalFaltas = resumoDisciplinas.reduce((t, d) => t + d.faltasTotais, 0);
  const bomDesempenho = resumoDisciplinas.filter((d) => d.situacao.texto === "Bom desempenho").length;
  const atencao = resumoDisciplinas.filter((d) => d.situacao.texto === "Atenção").length;
  const frequenciaDemonstrativa = 92;

  document.getElementById("card-media-geral").textContent =
    mediaGeral !== null ? formatarNota(mediaGeral) : "—";
  document.getElementById("card-total-faltas").textContent = totalFaltas;
  document.getElementById("card-bom-desempenho").textContent = bomDesempenho;
  document.getElementById("card-atencao").textContent = atencao;
  document.getElementById("card-frequencia").textContent =
    frequenciaDemonstrativa + "% • Frequência adequada";
}

// ============================================================
// MODAL DE EDIÇÃO
// ============================================================
btnAlterarDados.addEventListener("click", () => {
  msgEdicao.textContent = "";
  abrirModalEdicao();
});

btnCancelar.addEventListener("click", () => {
  modalEdicao.style.display = "none";
});

function abrirModalEdicao() {
  corpoTabelaEdicao.innerHTML = "";

  dadosBoletimAtual.forEach((item, index) => {
    const linha = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = item.disciplina;
    linha.appendChild(tdNome);

    // Formatar notas para exibição no campo
    const valTri1 = normalizarNota(item.tri1);
    const valTri2 = normalizarNota(item.tri2);
    const valTri3 = normalizarNota(item.tri3);

    const f1 = Array.isArray(item.faltas) ? item.faltas[0] ?? 0 : 0;
    const f2 = Array.isArray(item.faltas) ? item.faltas[1] ?? 0 : 0;
    const f3 = Array.isArray(item.faltas) ? item.faltas[2] ?? 0 : 0;

    linha.appendChild(criarTdInput(`nota-1-${index}`, valTri1 !== null ? String(valTri1).replace(".", ",") : ""));
    linha.appendChild(criarTdInput(`nota-2-${index}`, valTri2 !== null ? String(valTri2).replace(".", ",") : ""));
    linha.appendChild(criarTdInput(`nota-3-${index}`, valTri3 !== null ? String(valTri3).replace(".", ",") : ""));

    linha.appendChild(criarTdInput(`falta-1-${index}`, f1));
    linha.appendChild(criarTdInput(`falta-2-${index}`, f2));
    linha.appendChild(criarTdInput(`falta-3-${index}`, f3));

    corpoTabelaEdicao.appendChild(linha);
  });

  modalEdicao.style.display = "flex";
}

function criarTdInput(id, valor) {
  const td = document.createElement("td");
  const input = document.createElement("input");
  input.type = "text";
  input.id = id;
  input.className = "input-edicao";
  input.value = valor !== null && valor !== undefined ? valor : "";
  td.appendChild(input);
  return td;
}

// Validar nota digitada pelo usuário (0 a 10, ponto, vírgula ou vazio)
function validarNotaDigitada(str) {
  if (str === null || str === undefined) return { valida: true, valor: null };
  const texto = String(str).trim();
  if (texto === "") return { valida: true, valor: null };

  // Não aceita formatos como 75, 82, 100
  const textoComPonto = texto.replace(",", ".");
  const num = Number(textoComPonto);

  if (isNaN(num) || num < 0 || num > 10) {
    return { valida: false, valor: null };
  }

  return { valida: true, valor: num };
}

// Validar falta digitada pelo usuário (inteiro >= 0)
function validarFaltaDigitada(str) {
  if (str === null || str === undefined) return { valida: false, valor: null };
  const texto = String(str).trim();
  if (texto === "") return { valida: false, valor: null };

  const num = Number(texto);
  if (isNaN(num) || !Number.isInteger(num) || num < 0) {
    return { valida: false, valor: null };
  }

  return { valida: true, valor: num };
}

// ============================================================
// SALVAR ALTERAÇÕES
// ============================================================
btnSalvar.addEventListener("click", salvarEdicao);

async function salvarEdicao() {
  msgEdicao.textContent = "";
  let temErro = false;
  const novasDisciplinas = [];

  dadosBoletimAtual.forEach((item, index) => {
    const inputN1 = document.getElementById(`nota-1-${index}`);
    const inputN2 = document.getElementById(`nota-2-${index}`);
    const inputN3 = document.getElementById(`nota-3-${index}`);

    const inputF1 = document.getElementById(`falta-1-${index}`);
    const inputF2 = document.getElementById(`falta-2-${index}`);
    const inputF3 = document.getElementById(`falta-3-${index}`);

    // Limpar marcações de erro
    [inputN1, inputN2, inputN3, inputF1, inputF2, inputF3].forEach(inp => inp.classList.remove("input-invalido"));

    const resN1 = validarNotaDigitada(inputN1.value);
    const resN2 = validarNotaDigitada(inputN2.value);
    const resN3 = validarNotaDigitada(inputN3.value);

    const resF1 = validarFaltaDigitada(inputF1.value);
    const resF2 = validarFaltaDigitada(inputF2.value);
    const resF3 = validarFaltaDigitada(inputF3.value);

    if (!resN1.valida) { inputN1.classList.add("input-invalido"); temErro = true; }
    if (!resN2.valida) { inputN2.classList.add("input-invalido"); temErro = true; }
    if (!resN3.valida) { inputN3.classList.add("input-invalido"); temErro = true; }

    if (!resF1.valida) { inputF1.classList.add("input-invalido"); temErro = true; }
    if (!resF2.valida) { inputF2.classList.add("input-invalido"); temErro = true; }
    if (!resF3.valida) { inputF3.classList.add("input-invalido"); temErro = true; }

    novasDisciplinas.push({
      disciplina: item.disciplina,
      tri1: resN1.valor,
      tri2: resN2.valor,
      tri3: resN3.valor,
      faltas: [resF1.valor ?? 0, resF2.valor ?? 0, resF3.valor ?? 0]
    });
  });

  if (temErro) {
    msgEdicao.textContent = "Verifique os campos destacados em vermelho.";
    return;
  }

  msgEdicao.textContent = "Salvando...";

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      msgEdicao.textContent = "Não foi possível salvar os dados. Tente novamente.";
      return;
    }

    dadosBoletimAtual = novasDisciplinas;
    renderizarBoletim(dadosBoletimAtual);
    msgEdicao.textContent = "Dados salvos com sucesso.";

    setTimeout(() => {
      modalEdicao.style.display = "none";
    }, 1200);

  } catch (erro) {
    msgEdicao.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
  }
}
