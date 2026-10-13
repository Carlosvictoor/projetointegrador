/*
 * algoritmos.js
 * Algoritmos e estruturas de dados usados pelo sistema.
 *
 * Todas as funções foram implementadas manualmente (sem Array.sort,
 * Array.find, Array.filter etc.) para aplicar o conteúdo da disciplina:
 * laços, contadores, acumuladores, vetores, matrizes, registros,
 * ordenação, busca sequencial, busca binária e recursão.
 */

// ---------------------------------------------------------------
// Utilitários de comparação
// ---------------------------------------------------------------

// Deixa o texto em minúsculas e sem acentos, para comparar "Érico" com "erico".
function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

// Compara dois valores. Retorna negativo se a < b, zero se iguais e positivo se a > b.
function comparar(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  const x = normalizar(a);
  const y = normalizar(b);
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}

// Copia um vetor elemento por elemento (para não alterar o original ao ordenar).
function copiarVetor(vetor) {
  const copia = [];
  for (let i = 0; i < vetor.length; i++) {
    copia[i] = vetor[i];
  }
  return copia;
}

// Remove o elemento da posição informada, deslocando os seguintes para a esquerda.
function removerDoVetor(vetor, indice) {
  for (let i = indice; i < vetor.length - 1; i++) {
    vetor[i] = vetor[i + 1];
  }
  vetor.length = vetor.length - 1;
}

// ---------------------------------------------------------------
// Ordenação
// ---------------------------------------------------------------

// Ordenação por inserção (Insertion Sort) de um vetor de registros pelo campo informado.
// Usada nas listagens de livros, leitores e empréstimos.
function ordenarPorInsercao(vetor, campo, decrescente) {
  const v = copiarVetor(vetor);
  for (let i = 1; i < v.length; i++) {
    const atual = v[i];
    let j = i - 1;
    while (j >= 0) {
      let resultado = comparar(v[j][campo], atual[campo]);
      if (decrescente) resultado = -resultado;
      if (resultado <= 0) break;
      v[j + 1] = v[j];
      j--;
    }
    v[j + 1] = atual;
  }
  return v;
}

// Método da bolha (Bubble Sort), em ordem decrescente. Usado nos rankings.
// A flag "houveTroca" encerra o laço mais cedo quando o vetor já está ordenado.
function ordenarPorBolhaDecrescente(vetor, campo) {
  const v = copiarVetor(vetor);
  let houveTroca = true;
  for (let fim = v.length - 1; fim > 0 && houveTroca; fim--) {
    houveTroca = false;
    for (let i = 0; i < fim; i++) {
      if (comparar(v[i][campo], v[i + 1][campo]) < 0) {
        const aux = v[i];
        v[i] = v[i + 1];
        v[i + 1] = aux;
        houveTroca = true;
      }
    }
  }
  return v;
}

// ---------------------------------------------------------------
// Busca
// ---------------------------------------------------------------

// Busca sequencial por trecho de texto em um ou mais campos.
// Retorna os registros encontrados e quantas comparações foram feitas.
function buscaSequencial(vetor, campos, termo) {
  const alvo = normalizar(termo);
  const resultados = [];
  let comparacoes = 0;
  for (let i = 0; i < vetor.length; i++) {
    for (let c = 0; c < campos.length; c++) {
      comparacoes++;
      if (normalizar(vetor[i][campos[c]]).includes(alvo)) {
        resultados[resultados.length] = vetor[i];
        break;
      }
    }
  }
  return { resultados: resultados, comparacoes: comparacoes };
}

// Busca sequencial por valor exato. Serve de comparação com a busca binária.
function buscaSequencialExata(vetor, campo, chave) {
  let comparacoes = 0;
  for (let i = 0; i < vetor.length; i++) {
    comparacoes++;
    if (comparar(vetor[i][campo], chave) === 0) {
      return { indice: i, comparacoes: comparacoes };
    }
  }
  return { indice: -1, comparacoes: comparacoes };
}

// Busca binária iterativa. O vetor PRECISA estar ordenado pelo campo.
function buscaBinaria(vetor, campo, chave) {
  let inicio = 0;
  let fim = vetor.length - 1;
  let comparacoes = 0;
  while (inicio <= fim) {
    const meio = Math.floor((inicio + fim) / 2);
    const resultado = comparar(vetor[meio][campo], chave);
    comparacoes++;
    if (resultado === 0) {
      return { indice: meio, comparacoes: comparacoes };
    }
    if (resultado < 0) {
      inicio = meio + 1;
    } else {
      fim = meio - 1;
    }
  }
  return { indice: -1, comparacoes: comparacoes };
}

// Busca binária recursiva. Mesma ideia da anterior, mas cada chamada
// resolve metade do problema. Usada para localizar registros pelo id.
function buscaBinariaRecursiva(vetor, campo, chave, inicio, fim) {
  if (inicio === undefined) inicio = 0;
  if (fim === undefined) fim = vetor.length - 1;
  if (inicio > fim) return -1; // caso base: não encontrou

  const meio = Math.floor((inicio + fim) / 2);
  const resultado = comparar(vetor[meio][campo], chave);
  if (resultado === 0) return meio; // caso base: encontrou
  if (resultado < 0) return buscaBinariaRecursiva(vetor, campo, chave, meio + 1, fim);
  return buscaBinariaRecursiva(vetor, campo, chave, inicio, meio - 1);
}

// ---------------------------------------------------------------
// Estatísticas (contadores, acumuladores, maior/menor, média)
// ---------------------------------------------------------------

// Soma recursiva de um campo numérico: soma(i) = v[i] + soma(i + 1).
function somaRecursiva(vetor, campo, i) {
  if (i === undefined) i = 0;
  if (i >= vetor.length) return 0; // caso base
  return vetor[i][campo] + somaRecursiva(vetor, campo, i + 1);
}

// Conta quantos registros satisfazem a condição.
function contarSe(vetor, condicao) {
  let contador = 0;
  for (let i = 0; i < vetor.length; i++) {
    if (condicao(vetor[i])) contador++;
  }
  return contador;
}

// Média aritmética de um vetor de números.
function media(numeros) {
  if (numeros.length === 0) return 0;
  let acumulador = 0;
  for (let i = 0; i < numeros.length; i++) {
    acumulador += numeros[i];
  }
  return acumulador / numeros.length;
}

// Encontra o registro com maior e com menor valor no campo informado.
function maiorEMenor(vetor, campo) {
  if (vetor.length === 0) return { maior: null, menor: null };
  let maior = vetor[0];
  let menor = vetor[0];
  for (let i = 1; i < vetor.length; i++) {
    if (vetor[i][campo] > maior[campo]) maior = vetor[i];
    if (vetor[i][campo] < menor[campo]) menor = vetor[i];
  }
  return { maior: maior, menor: menor };
}

// ---------------------------------------------------------------
// Matrizes
// ---------------------------------------------------------------

// Cria uma matriz linhas x colunas preenchida com o valor inicial.
function criarMatriz(linhas, colunas, valorInicial) {
  const matriz = [];
  for (let i = 0; i < linhas; i++) {
    matriz[i] = [];
    for (let j = 0; j < colunas; j++) {
      matriz[i][j] = valorInicial;
    }
  }
  return matriz;
}

// Soma de cada linha da matriz.
function somarLinhas(matriz) {
  const totais = [];
  for (let i = 0; i < matriz.length; i++) {
    let soma = 0;
    for (let j = 0; j < matriz[i].length; j++) soma += matriz[i][j];
    totais[i] = soma;
  }
  return totais;
}

// Soma de cada coluna da matriz.
function somarColunas(matriz) {
  const totais = [];
  if (matriz.length === 0) return totais;
  for (let j = 0; j < matriz[0].length; j++) {
    let soma = 0;
    for (let i = 0; i < matriz.length; i++) soma += matriz[i][j];
    totais[j] = soma;
  }
  return totais;
}

// Posição do maior valor de um vetor de números.
function indiceDoMaior(numeros) {
  let indice = 0;
  for (let i = 1; i < numeros.length; i++) {
    if (numeros[i] > numeros[indice]) indice = i;
  }
  return indice;
}

// ---------------------------------------------------------------
// Datas (formato "AAAA-MM-DD")
// ---------------------------------------------------------------

function dataParaISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return ano + '-' + mes + '-' + dia;
}

function isoParaData(iso) {
  const partes = iso.split('-');
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

function hojeISO() {
  return dataParaISO(new Date());
}

function somarDias(iso, dias) {
  const data = isoParaData(iso);
  data.setDate(data.getDate() + dias);
  return dataParaISO(data);
}

// Quantidade de dias de "de" até "ate" (negativo se "ate" for antes).
function diasEntre(de, ate) {
  const umDia = 24 * 60 * 60 * 1000;
  return Math.round((isoParaData(ate) - isoParaData(de)) / umDia);
}
