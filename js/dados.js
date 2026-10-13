/*
 * dados.js
 * Estrutura dos registros, gravação no navegador (localStorage)
 * e geração dos dados de exemplo.
 *
 * Registros (vetores de objetos):
 *   livro      { id, codigo, titulo, autor, categoria, ano, exemplares, disponiveis }
 *   leitor     { id, nome, tipo, contato }
 *   emprestimo { id, livroId, leitorId, dataEmprestimo, dataPrevista, dataDevolucao, multa }
 */

const CATEGORIAS = ['Literatura', 'Infantil', 'Didático', 'Ciências', 'História', 'Outros'];
const TIPOS_LEITOR = ['Aluno', 'Professor', 'Comunidade'];
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Regras da biblioteca
const PRAZO_PADRAO_DIAS = 14;
const MAX_EMPRESTIMOS_POR_LEITOR = 3;
const MULTA_POR_DIA = 0.5; // R$ por dia de atraso

const CHAVE_ARMAZENAMENTO = 'biblioteca-pi-dados';

function bancoVazio() {
  return {
    livros: [],
    leitores: [],
    emprestimos: [],
    proximoId: { livro: 1, leitor: 1, emprestimo: 1 }
  };
}

function carregarBanco() {
  try {
    const texto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
    if (texto) return JSON.parse(texto);
  } catch (erro) {
    console.warn('Não foi possível ler os dados salvos:', erro);
  }
  return gerarDadosExemplo();
}

function salvarBanco(banco) {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(banco));
  } catch (erro) {
    console.warn('Não foi possível salvar os dados:', erro);
  }
}

function gerarCodigoLivro(id) {
  return 'L' + String(id).padStart(4, '0');
}

// ---------------------------------------------------------------
// Dados de exemplo, para o sistema já abrir com informações.
// ---------------------------------------------------------------
function gerarDadosExemplo() {
  const banco = bancoVazio();

  const livros = [
    ['Dom Casmurro', 'Machado de Assis', 'Literatura', 1899, 3],
    ['Memórias Póstumas de Brás Cubas', 'Machado de Assis', 'Literatura', 1881, 2],
    ['O Cortiço', 'Aluísio Azevedo', 'Literatura', 1890, 2],
    ['Vidas Secas', 'Graciliano Ramos', 'Literatura', 1938, 3],
    ['Capitães da Areia', 'Jorge Amado', 'Literatura', 1937, 2],
    ['A Hora da Estrela', 'Clarice Lispector', 'Literatura', 1977, 2],
    ['O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'Infantil', 1943, 4],
    ['O Menino Maluquinho', 'Ziraldo', 'Infantil', 1980, 3],
    ['Reinações de Narizinho', 'Monteiro Lobato', 'Infantil', 1931, 2],
    ['A Bolsa Amarela', 'Lygia Bojunga', 'Infantil', 1976, 2],
    ['Matemática Básica', 'Luiz Roberto Dante', 'Didático', 2016, 5],
    ['Gramática da Língua Portuguesa', 'Pasquale Cipro Neto', 'Didático', 2008, 3],
    ['Lógica de Programação e Algoritmos', 'Sandro Araujo', 'Didático', 2020, 2],
    ['O Universo numa Casca de Noz', 'Stephen Hawking', 'Ciências', 2001, 1],
    ['Cosmos', 'Carl Sagan', 'Ciências', 1980, 2],
    ['A Origem das Espécies', 'Charles Darwin', 'Ciências', 1859, 1],
    ['O Povo Brasileiro', 'Darcy Ribeiro', 'História', 1995, 2],
    ['Raízes do Brasil', 'Sérgio Buarque de Holanda', 'História', 1936, 2],
    ['1808', 'Laurentino Gomes', 'História', 2007, 3],
    ['Quarto de Despejo', 'Carolina Maria de Jesus', 'Outros', 1960, 2]
  ];
  for (let i = 0; i < livros.length; i++) {
    const id = banco.proximoId.livro++;
    banco.livros[banco.livros.length] = {
      id: id,
      codigo: gerarCodigoLivro(id),
      titulo: livros[i][0],
      autor: livros[i][1],
      categoria: livros[i][2],
      ano: livros[i][3],
      exemplares: livros[i][4],
      disponiveis: livros[i][4]
    };
  }

  const leitores = [
    ['Ana Beatriz Souza', 'Aluno', '(11) 98888-1001'],
    ['Bruno Henrique Lima', 'Aluno', '(11) 98888-1002'],
    ['Carla Mendes', 'Professor', 'carla.mendes@escola.org'],
    ['Diego Santos', 'Aluno', '(11) 98888-1004'],
    ['Eduarda Ferreira', 'Comunidade', '(11) 98888-1005'],
    ['Felipe Araújo', 'Aluno', '(11) 98888-1006'],
    ['Gabriela Rocha', 'Professor', 'gabriela.rocha@escola.org'],
    ['Heitor Oliveira', 'Comunidade', '(11) 98888-1008'],
    ['Isabela Costa', 'Aluno', '(11) 98888-1009'],
    ['João Pedro Alves', 'Aluno', '(11) 98888-1010']
  ];
  for (let i = 0; i < leitores.length; i++) {
    banco.leitores[banco.leitores.length] = {
      id: banco.proximoId.leitor++,
      nome: leitores[i][0],
      tipo: leitores[i][1],
      contato: leitores[i][2]
    };
  }

  // Gerador pseudoaleatório com semente fixa: os dados de exemplo saem sempre iguais.
  let semente = 2026;
  function aleatorio(maximo) {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    return Math.floor((semente / 2147483648) * maximo);
  }

  const hoje = hojeISO();

  // Histórico: 80 empréstimos já devolvidos ao longo dos últimos meses.
  for (let i = 0; i < 80; i++) {
    const livro = banco.livros[aleatorio(banco.livros.length)];
    const leitor = banco.leitores[aleatorio(banco.leitores.length)];
    const dataEmprestimo = somarDias(hoje, -(20 + aleatorio(260)));
    const dataPrevista = somarDias(dataEmprestimo, PRAZO_PADRAO_DIAS);
    const dataDevolucao = somarDias(dataEmprestimo, 3 + aleatorio(18));
    const atraso = diasEntre(dataPrevista, dataDevolucao);
    banco.emprestimos[banco.emprestimos.length] = {
      id: 0,
      livroId: livro.id,
      leitorId: leitor.id,
      dataEmprestimo: dataEmprestimo,
      dataPrevista: dataPrevista,
      dataDevolucao: dataDevolucao,
      multa: atraso > 0 ? atraso * MULTA_POR_DIA : 0
    };
  }

  // Empréstimos em aberto: alguns dentro do prazo e alguns atrasados.
  const abertos = [
    [1, 1, 5], [7, 2, 2], [11, 4, 10], [4, 6, 20], [15, 9, 25], [19, 10, 17], [8, 3, 1]
  ]; // [livroId, leitorId, dias desde o empréstimo]
  for (let i = 0; i < abertos.length; i++) {
    const dataEmprestimo = somarDias(hoje, -abertos[i][2]);
    banco.emprestimos[banco.emprestimos.length] = {
      id: 0,
      livroId: abertos[i][0],
      leitorId: abertos[i][1],
      dataEmprestimo: dataEmprestimo,
      dataPrevista: somarDias(dataEmprestimo, PRAZO_PADRAO_DIAS),
      dataDevolucao: null,
      multa: 0
    };
    banco.livros[abertos[i][0] - 1].disponiveis--;
  }

  // Coloca o histórico em ordem de data e numera os empréstimos.
  banco.emprestimos = ordenarPorInsercao(banco.emprestimos, 'dataEmprestimo', false);
  for (let i = 0; i < banco.emprestimos.length; i++) {
    banco.emprestimos[i].id = banco.proximoId.emprestimo++;
  }

  return banco;
}
