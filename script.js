// ============================================================
// DADOS FICTÍCIOS DO 8º ANO (dados brutos, como vieram)
// ============================================================
const dados = [
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

// ============================================================
// FUNÇÃO: normalizarNota
// Converte qualquer nota para a escala 0–10.
// Retorna null quando a nota ainda não foi lançada ou é inválida.
// ============================================================
function normalizarNota(valor) {
  // Vazio, null ou undefined = nota ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Aceita ponto ou vírgula decimal (transforma "8,5" em 8.5)
  const numero = typeof valor === "string"
    ? parseFloat(valor.replace(",", "."))
    : valor;

  // Se não for um número válido, é inválido
  if (isNaN(numero)) {
    return null;
  }

  // 0 a 10 permanece igual
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  // Maiores que 10 e até 100: divide por 10 (ex: 82 → 8.2 / 100 → 10.0)
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  // Fora das regras = inválido
  return null;
}

// ============================================================
// FUNÇÃO: calcularMedia
// Calcula a média usando SOMENTE as notas disponíveis.
// Nota ausente nunca vira zero.
// ============================================================
function calcularMedia(notas) {
  const notasValidas = notas.filter((n) => n !== null);

  if (notasValidas.length === 0) {
    return null; // nenhuma nota válida
  }

  const soma = notasValidas.reduce((total, n) => total + n, 0);
  return soma / notasValidas.length;
}

// ============================================================
// FUNÇÃO: definirSituacao
// Retorna a situação conforme a média disponível.
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
// Soma as faltas dos três trimestres de uma disciplina.
// ============================================================
function somarFaltas(faltas) {
  return faltas.reduce((total, f) => total + f, 0);
}

// ============================================================
// FUNÇÃO: formatarNota
// Mostra a nota com uma casa decimal ou o texto de ausência.
// ============================================================
function formatarNota(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// ============================================================
// PROCESSAMENTO DOS DADOS
// Percorre cada disciplina e monta um objeto "resumo" já calculado.
// ============================================================
const resumoDisciplinas = dados.map((item) => {
  const n1 = normalizarNota(item.tri1);
  const n2 = normalizarNota(item.tri2);
  const n3 = normalizarNota(item.tri3);

  const media = calcularMedia([n1, n2, n3]);
  const faltasTotais = somarFaltas(item.faltas);
  const situacao = definirSituacao(media);

  return {
    disciplina: item.disciplina,
    n1, n2, n3,
    media,
    faltasTotais,
    situacao
  };
});

// ============================================================
// PREENCHER A TABELA (DOM)
// ============================================================
const corpoTabela = document.getElementById("corpo-tabela");

resumoDisciplinas.forEach((d) => {
  const linha = document.createElement("tr");

  linha.innerHTML = `
    <td>${d.disciplina}</td>
    <td>${formatarNota(d.n1)}</td>
    <td>${formatarNota(d.n2)}</td>
    <td>${formatarNota(d.n3)}</td>
    <td>${formatarNota(d.media)}</td>
    <td>${d.faltasTotais}</td>
    <td class="${d.situacao.classe}">${d.situacao.texto}</td>
  `;

  corpoTabela.appendChild(linha);
});

// ============================================================
// CALCULAR E MOSTRAR OS CARDS DE RESUMO
// ============================================================

// Média geral: média das médias disponíveis (ignora as ausentes)
const mediasDisponiveis = resumoDisciplinas
  .map((d) => d.media)
  .filter((m) => m !== null);

const mediaGeral = mediasDisponiveis.length > 0
  ? mediasDisponiveis.reduce((t, m) => t + m, 0) / mediasDisponiveis.length
  : null;

// Total de faltas de todas as disciplinas
const totalFaltas = resumoDisciplinas.reduce((t, d) => t + d.faltasTotais, 0);

// Disciplinas com bom desempenho e com atenção
const bomDesempenho = resumoDisciplinas.filter((d) => d.situacao.texto === "Bom desempenho").length;
const atencao = resumoDisciplinas.filter((d) => d.situacao.texto === "Atenção").length;

// Frequência: APENAS DEMONSTRATIVA nesta versão.
// No futuro ela será calculada de outra forma (não a partir das faltas).
const frequenciaDemonstrativa = 92;

// Preenchendo os cards
document.getElementById("card-media-geral").textContent =
  mediaGeral !== null ? formatarNota(mediaGeral) : "—";

document.getElementById("card-total-faltas").textContent = totalFaltas;

document.getElementById("card-bom-desempenho").textContent = bomDesempenho;

document.getElementById("card-atencao").textContent = atencao;

document.getElementById("card-frequencia").textContent =
  frequenciaDemonstrativa + "% • Frequência adequada";.