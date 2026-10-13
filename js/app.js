/*
 * app.js
 * Liga a interface (formulários, tabelas e abas) aos dados e algoritmos.
 */

let banco = carregarBanco();

// ---------------------------------------------------------------
// Utilitários de interface
// ---------------------------------------------------------------

function el(id) {
  return document.getElementById(id);
}

// Evita que textos digitados pelo usuário sejam interpretados como HTML.
function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatarData(iso) {
  const partes = iso.split('-');
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

let temporizadorAviso = null;
function mostrarAviso(mensagem, tipo) {
  const aviso = el('aviso');
  aviso.textContent = mensagem;
  aviso.className = 'aviso visivel ' + (tipo || 'sucesso');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(function () {
    aviso.className = 'aviso';
  }, 3500);
}

// Monta uma tabela HTML a partir dos cabeçalhos e das linhas (já escapadas).
function montarTabela(cabecalhos, linhas, mensagemVazia) {
  if (linhas.length === 0) {
    return '<p class="vazio">' + (mensagemVazia || 'Nenhum registro.') + '</p>';
  }
  let html = '<div class="tabela-rolagem"><table><thead><tr>';
  for (let i = 0; i < cabecalhos.length; i++) html += '<th>' + cabecalhos[i] + '</th>';
  html += '</tr></thead><tbody>';
  for (let i = 0; i < linhas.length; i++) {
    html += '<tr>';
    for (let j = 0; j < linhas[i].length; j++) html += '<td>' + linhas[i][j] + '</td>';
    html += '</tr>';
  }
  return html + '</tbody></table></div>';
}

function preencherSelect(select, opcoes, textoInicial) {
  let html = textoInicial ? '<option value="">' + textoInicial + '</option>' : '';
  for (let i = 0; i < opcoes.length; i++) {
    html += '<option value="' + escapar(opcoes[i].valor) + '">' + escapar(opcoes[i].texto) + '</option>';
  }
  select.innerHTML = html;
}

// ---------------------------------------------------------------
// Consultas aos dados
// ---------------------------------------------------------------

// Os vetores ficam sempre em ordem crescente de id (novos registros entram no fim),
// por isso dá para localizar pelo id com a busca binária recursiva.
function livroPorId(id) {
  const indice = buscaBinariaRecursiva(banco.livros, 'id', Number(id));
  return indice === -1 ? null : banco.livros[indice];
}

function leitorPorId(id) {
  const indice = buscaBinariaRecursiva(banco.leitores, 'id', Number(id));
  return indice === -1 ? null : banco.leitores[indice];
}

function emprestimoPorId(id) {
  const indice = buscaBinariaRecursiva(banco.emprestimos, 'id', Number(id));
  return indice === -1 ? null : banco.emprestimos[indice];
}

function estaAberto(emprestimo) {
  return emprestimo.dataDevolucao === null;
}

function diasDeAtraso(emprestimo, hoje) {
  const atraso = diasEntre(emprestimo.dataPrevista, hoje);
  return atraso > 0 ? atraso : 0;
}

function tituloDoLivro(id) {
  const livro = livroPorId(id);
  return livro ? livro.titulo : '(livro removido)';
}

function nomeDoLeitor(id) {
  const leitor = leitorPorId(id);
  return leitor ? leitor.nome : '(leitor removido)';
}

// Contador de empréstimos por livro ou por leitor.
function contarEmprestimos(campo, id, somenteAbertos) {
  return contarSe(banco.emprestimos, function (e) {
    return e[campo] === id && (!somenteAbertos || estaAberto(e));
  });
}

// ---------------------------------------------------------------
// Navegação entre abas
// ---------------------------------------------------------------

const botoesAba = document.querySelectorAll('.aba');
for (let i = 0; i < botoesAba.length; i++) {
  botoesAba[i].addEventListener('click', function () {
    abrirAba(this.dataset.aba);
  });
}

function abrirAba(nome) {
  for (let i = 0; i < botoesAba.length; i++) {
    botoesAba[i].classList.toggle('ativa', botoesAba[i].dataset.aba === nome);
  }
  const secoes = document.querySelectorAll('.secao');
  for (let i = 0; i < secoes.length; i++) {
    secoes[i].classList.toggle('ativa', secoes[i].id === nome);
  }
}

// ---------------------------------------------------------------
// Painel
// ---------------------------------------------------------------

function renderizarPainel() {
  const hoje = hojeISO();

  // Acumuladores e contadores percorrendo os empréstimos uma única vez.
  let abertos = 0;
  let atrasados = 0;
  let multaPendente = 0;
  let multaArrecadada = 0;
  const linhasAtraso = [];
  for (let i = 0; i < banco.emprestimos.length; i++) {
    const e = banco.emprestimos[i];
    if (estaAberto(e)) {
      abertos++;
      const atraso = diasDeAtraso(e, hoje);
      if (atraso > 0) {
        atrasados++;
        multaPendente += atraso * MULTA_POR_DIA;
        linhasAtraso[linhasAtraso.length] = [
          escapar(tituloDoLivro(e.livroId)),
          escapar(nomeDoLeitor(e.leitorId)),
          formatarData(e.dataPrevista),
          '<span class="etiqueta perigo">' + atraso + ' dia(s)</span>',
          formatarMoeda(atraso * MULTA_POR_DIA)
        ];
      }
    } else {
      multaArrecadada += e.multa;
    }
  }

  const totalExemplares = somaRecursiva(banco.livros, 'exemplares');
  const totalDisponiveis = somaRecursiva(banco.livros, 'disponiveis');

  // Média de empréstimos por leitor.
  const porLeitor = [];
  for (let i = 0; i < banco.leitores.length; i++) {
    porLeitor[i] = contarEmprestimos('leitorId', banco.leitores[i].id, false);
  }
  const mediaPorLeitor = media(porLeitor);

  const anos = maiorEMenor(banco.livros, 'ano');

  const cartoes = [
    ['Títulos no acervo', banco.livros.length],
    ['Exemplares', totalExemplares + ' <small>(' + totalDisponiveis + ' disponíveis)</small>'],
    ['Leitores', banco.leitores.length],
    ['Empréstimos em aberto', abertos],
    ['Atrasados', '<span class="' + (atrasados > 0 ? 'texto-perigo' : '') + '">' + atrasados + '</span>'],
    ['Multas pendentes', formatarMoeda(multaPendente)],
    ['Multas arrecadadas', formatarMoeda(multaArrecadada)],
    ['Média de empréstimos por leitor', mediaPorLeitor.toFixed(1)],
    ['Livro mais antigo', anos.menor ? escapar(anos.menor.titulo) + ' <small>(' + anos.menor.ano + ')</small>' : '-'],
    ['Livro mais recente', anos.maior ? escapar(anos.maior.titulo) + ' <small>(' + anos.maior.ano + ')</small>' : '-']
  ];
  let html = '';
  for (let i = 0; i < cartoes.length; i++) {
    html += '<div class="cartao"><span class="cartao-titulo">' + cartoes[i][0] +
      '</span><span class="cartao-valor">' + cartoes[i][1] + '</span></div>';
  }
  el('cartoes').innerHTML = html;

  el('tabela-atrasados').innerHTML = montarTabela(
    ['Livro', 'Leitor', 'Devolução prevista', 'Atraso', 'Multa'],
    linhasAtraso,
    'Nenhum empréstimo atrasado. 🎉'
  );
}

el('btn-restaurar').addEventListener('click', function () {
  banco = gerarDadosExemplo();
  salvarBanco(banco);
  renderizarTudo();
  mostrarAviso('Dados de exemplo restaurados.');
});

// ---------------------------------------------------------------
// Livros
// ---------------------------------------------------------------

function renderizarLivros() {
  const termo = el('busca-livros').value.trim();
  const ordem = el('ordem-livros').value;

  let lista = banco.livros;
  let info = banco.livros.length + ' livro(s) cadastrado(s).';
  if (termo !== '') {
    const busca = buscaSequencial(lista, ['titulo', 'autor', 'categoria', 'codigo'], termo);
    lista = busca.resultados;
    info = busca.resultados.length + ' resultado(s) para "' + escapar(termo) +
      '": busca sequencial com ' + busca.comparacoes + ' comparações.';
  }

  const decrescente = ordem === 'ano-desc';
  const campo = decrescente ? 'ano' : ordem;
  lista = ordenarPorInsercao(lista, campo, decrescente);

  const linhas = [];
  for (let i = 0; i < lista.length; i++) {
    const l = lista[i];
    const classe = l.disponiveis === 0 ? 'perigo' : 'ok';
    linhas[i] = [
      '<code>' + l.codigo + '</code>',
      escapar(l.titulo),
      escapar(l.autor),
      escapar(l.categoria),
      l.ano,
      '<span class="etiqueta ' + classe + '">' + l.disponiveis + ' / ' + l.exemplares + '</span>',
      contarEmprestimos('livroId', l.id, false),
      '<button class="botao pequeno perigo" data-remover-livro="' + l.id + '">Remover</button>'
    ];
  }
  el('info-livros').innerHTML = info;
  el('tabela-livros').innerHTML = montarTabela(
    ['Código', 'Título', 'Autor', 'Categoria', 'Ano', 'Disponíveis', 'Empréstimos', ''],
    linhas,
    'Nenhum livro encontrado.'
  );
}

el('form-livro').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const dados = new FormData(this);
  const exemplares = Number(dados.get('exemplares'));
  const id = banco.proximoId.livro++;
  banco.livros[banco.livros.length] = {
    id: id,
    codigo: gerarCodigoLivro(id),
    titulo: dados.get('titulo').trim(),
    autor: dados.get('autor').trim(),
    categoria: dados.get('categoria'),
    ano: Number(dados.get('ano')),
    exemplares: exemplares,
    disponiveis: exemplares
  };
  salvarBanco(banco);
  this.reset();
  renderizarTudo();
  mostrarAviso('Livro cadastrado com o código ' + gerarCodigoLivro(id) + '.');
});

el('tabela-livros').addEventListener('click', function (evento) {
  const id = evento.target.dataset.removerLivro;
  if (!id) return;
  const livro = livroPorId(id);
  if (contarEmprestimos('livroId', livro.id, true) > 0) {
    mostrarAviso('Não é possível remover: o livro tem empréstimos em aberto.', 'erro');
    return;
  }
  removerDoVetor(banco.livros, buscaBinariaRecursiva(banco.livros, 'id', livro.id));
  salvarBanco(banco);
  renderizarTudo();
  mostrarAviso('Livro "' + livro.titulo + '" removido.');
});

// Demonstração: compara a quantidade de comparações da busca sequencial e da binária.
el('form-busca-codigo').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const codigo = new FormData(this).get('codigo').trim().toUpperCase();

  const sequencial = buscaSequencialExata(banco.livros, 'codigo', codigo);
  const ordenado = ordenarPorInsercao(banco.livros, 'codigo', false);
  const binaria = buscaBinaria(ordenado, 'codigo', codigo);

  let html;
  if (binaria.indice === -1) {
    html = '<p class="vazio">Nenhum livro com o código <code>' + escapar(codigo) + '</code>.</p>';
  } else {
    const l = ordenado[binaria.indice];
    html = '<p><strong>' + escapar(l.titulo) + '</strong>, de ' + escapar(l.autor) +
      ' (' + l.ano + '): ' + l.disponiveis + ' de ' + l.exemplares + ' exemplar(es) disponível(is).</p>';
  }
  html += '<div class="comparativo">' +
    '<div><span>Busca sequencial</span><strong>' + sequencial.comparacoes + '</strong> comparações</div>' +
    '<div><span>Busca binária</span><strong>' + binaria.comparacoes + '</strong> comparações</div>' +
    '</div>';
  el('resultado-busca-codigo').innerHTML = html;
});

el('busca-livros').addEventListener('input', renderizarLivros);
el('ordem-livros').addEventListener('change', renderizarLivros);

// ---------------------------------------------------------------
// Leitores
// ---------------------------------------------------------------

function renderizarLeitores() {
  const termo = el('busca-leitores').value.trim();
  let lista = banco.leitores;
  let info = banco.leitores.length + ' leitor(es) cadastrado(s).';
  if (termo !== '') {
    const busca = buscaSequencial(lista, ['nome', 'tipo', 'contato'], termo);
    lista = busca.resultados;
    info = busca.resultados.length + ' resultado(s): busca sequencial com ' + busca.comparacoes + ' comparações.';
  }
  lista = ordenarPorInsercao(lista, 'nome', false);

  const hoje = hojeISO();
  const linhas = [];
  for (let i = 0; i < lista.length; i++) {
    const leitor = lista[i];
    let abertos = 0;
    let atrasados = 0;
    for (let j = 0; j < banco.emprestimos.length; j++) {
      const e = banco.emprestimos[j];
      if (e.leitorId === leitor.id && estaAberto(e)) {
        abertos++;
        if (diasDeAtraso(e, hoje) > 0) atrasados++;
      }
    }
    const situacao = atrasados > 0
      ? '<span class="etiqueta perigo">Com atraso</span>'
      : '<span class="etiqueta ok">Regular</span>';
    linhas[i] = [
      escapar(leitor.nome),
      escapar(leitor.tipo),
      escapar(leitor.contato || '-'),
      contarEmprestimos('leitorId', leitor.id, false),
      abertos,
      situacao,
      '<button class="botao pequeno perigo" data-remover-leitor="' + leitor.id + '">Remover</button>'
    ];
  }
  el('info-leitores').innerHTML = info;
  el('tabela-leitores').innerHTML = montarTabela(
    ['Nome', 'Tipo', 'Contato', 'Total de empréstimos', 'Em aberto', 'Situação', ''],
    linhas,
    'Nenhum leitor encontrado.'
  );
}

el('form-leitor').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const dados = new FormData(this);
  banco.leitores[banco.leitores.length] = {
    id: banco.proximoId.leitor++,
    nome: dados.get('nome').trim(),
    tipo: dados.get('tipo'),
    contato: dados.get('contato').trim()
  };
  salvarBanco(banco);
  this.reset();
  renderizarTudo();
  mostrarAviso('Leitor cadastrado.');
});

el('tabela-leitores').addEventListener('click', function (evento) {
  const id = evento.target.dataset.removerLeitor;
  if (!id) return;
  const leitor = leitorPorId(id);
  if (contarEmprestimos('leitorId', leitor.id, true) > 0) {
    mostrarAviso('Não é possível remover: o leitor tem livros em aberto.', 'erro');
    return;
  }
  removerDoVetor(banco.leitores, buscaBinariaRecursiva(banco.leitores, 'id', leitor.id));
  salvarBanco(banco);
  renderizarTudo();
  mostrarAviso('Leitor "' + leitor.nome + '" removido.');
});

el('busca-leitores').addEventListener('input', renderizarLeitores);

// ---------------------------------------------------------------
// Empréstimos
// ---------------------------------------------------------------

function renderizarEmprestimos() {
  const hoje = hojeISO();

  // Selects do formulário: só livros com exemplar disponível.
  const livrosDisponiveis = [];
  for (let i = 0; i < banco.livros.length; i++) {
    if (banco.livros[i].disponiveis > 0) livrosDisponiveis[livrosDisponiveis.length] = banco.livros[i];
  }
  const opcoesLivros = [];
  const livrosOrdenados = ordenarPorInsercao(livrosDisponiveis, 'titulo', false);
  for (let i = 0; i < livrosOrdenados.length; i++) {
    const l = livrosOrdenados[i];
    opcoesLivros[i] = { valor: l.id, texto: l.titulo + ' (' + l.codigo + ') - ' + l.disponiveis + ' disp.' };
  }
  preencherSelect(el('sel-livro'), opcoesLivros, 'Selecione um livro');

  const opcoesLeitores = [];
  const leitoresOrdenados = ordenarPorInsercao(banco.leitores, 'nome', false);
  for (let i = 0; i < leitoresOrdenados.length; i++) {
    opcoesLeitores[i] = { valor: leitoresOrdenados[i].id, texto: leitoresOrdenados[i].nome };
  }
  preencherSelect(el('sel-leitor'), opcoesLeitores, 'Selecione um leitor');

  // Separa abertos e devolvidos.
  const abertos = [];
  const devolvidos = [];
  for (let i = 0; i < banco.emprestimos.length; i++) {
    const e = banco.emprestimos[i];
    if (estaAberto(e)) abertos[abertos.length] = e;
    else devolvidos[devolvidos.length] = e;
  }

  const abertosOrdenados = ordenarPorInsercao(abertos, 'dataPrevista', false);
  const linhasAbertos = [];
  for (let i = 0; i < abertosOrdenados.length; i++) {
    const e = abertosOrdenados[i];
    const atraso = diasDeAtraso(e, hoje);
    const restantes = diasEntre(hoje, e.dataPrevista);
    let situacao;
    if (atraso > 0) {
      situacao = '<span class="etiqueta perigo">Atrasado ' + atraso + ' dia(s): ' + formatarMoeda(atraso * MULTA_POR_DIA) + '</span>';
    } else if (restantes <= 2) {
      situacao = '<span class="etiqueta alerta">Vence em ' + restantes + ' dia(s)</span>';
    } else {
      situacao = '<span class="etiqueta ok">No prazo</span>';
    }
    linhasAbertos[i] = [
      escapar(tituloDoLivro(e.livroId)),
      escapar(nomeDoLeitor(e.leitorId)),
      formatarData(e.dataEmprestimo),
      formatarData(e.dataPrevista),
      situacao,
      '<button class="botao pequeno" data-devolver="' + e.id + '">Devolver</button>'
    ];
  }
  el('tabela-abertos').innerHTML = montarTabela(
    ['Livro', 'Leitor', 'Empréstimo', 'Devolução prevista', 'Situação', ''],
    linhasAbertos,
    'Nenhum empréstimo em aberto.'
  );

  const devolvidosOrdenados = ordenarPorInsercao(devolvidos, 'dataDevolucao', true);
  const linhasDevolvidos = [];
  for (let i = 0; i < devolvidosOrdenados.length && i < 15; i++) {
    const e = devolvidosOrdenados[i];
    linhasDevolvidos[i] = [
      escapar(tituloDoLivro(e.livroId)),
      escapar(nomeDoLeitor(e.leitorId)),
      formatarData(e.dataEmprestimo),
      formatarData(e.dataDevolucao),
      e.multa > 0 ? formatarMoeda(e.multa) : '-'
    ];
  }
  el('tabela-devolvidos').innerHTML = montarTabela(
    ['Livro', 'Leitor', 'Empréstimo', 'Devolução', 'Multa paga'],
    linhasDevolvidos,
    'Nenhuma devolução registrada.'
  );
}

el('form-emprestimo').addEventListener('submit', function (evento) {
  evento.preventDefault();
  const dados = new FormData(this);
  const livro = livroPorId(dados.get('livroId'));
  const leitor = leitorPorId(dados.get('leitorId'));
  const prazo = Number(dados.get('prazo'));
  const hoje = hojeISO();

  if (!livro || !leitor) {
    mostrarAviso('Selecione o livro e o leitor.', 'erro');
    return;
  }
  if (livro.disponiveis <= 0) {
    mostrarAviso('Não há exemplares disponíveis deste livro.', 'erro');
    return;
  }

  // Regras: limite de livros por leitor e bloqueio para quem está com atraso.
  let abertosDoLeitor = 0;
  let leitorComAtraso = false;
  for (let i = 0; i < banco.emprestimos.length; i++) {
    const e = banco.emprestimos[i];
    if (e.leitorId === leitor.id && estaAberto(e)) {
      abertosDoLeitor++;
      if (diasDeAtraso(e, hoje) > 0) leitorComAtraso = true;
    }
  }
  if (leitorComAtraso) {
    mostrarAviso(leitor.nome + ' tem livro atrasado e precisa devolvê-lo antes de um novo empréstimo.', 'erro');
    return;
  }
  if (abertosDoLeitor >= MAX_EMPRESTIMOS_POR_LEITOR) {
    mostrarAviso(leitor.nome + ' já está com ' + MAX_EMPRESTIMOS_POR_LEITOR + ' livros (limite).', 'erro');
    return;
  }

  banco.emprestimos[banco.emprestimos.length] = {
    id: banco.proximoId.emprestimo++,
    livroId: livro.id,
    leitorId: leitor.id,
    dataEmprestimo: hoje,
    dataPrevista: somarDias(hoje, prazo),
    dataDevolucao: null,
    multa: 0
  };
  livro.disponiveis--;
  salvarBanco(banco);
  this.reset();
  el('form-emprestimo').prazo.value = PRAZO_PADRAO_DIAS;
  renderizarTudo();
  mostrarAviso('Empréstimo registrado. Devolução até ' + formatarData(somarDias(hoje, prazo)) + '.');
});

el('tabela-abertos').addEventListener('click', function (evento) {
  const id = evento.target.dataset.devolver;
  if (!id) return;
  const emprestimo = emprestimoPorId(id);
  const hoje = hojeISO();
  const atraso = diasDeAtraso(emprestimo, hoje);
  emprestimo.dataDevolucao = hoje;
  emprestimo.multa = atraso * MULTA_POR_DIA;
  const livro = livroPorId(emprestimo.livroId);
  if (livro) livro.disponiveis++;
  salvarBanco(banco);
  renderizarTudo();
  if (atraso > 0) {
    mostrarAviso('Devolvido com ' + atraso + ' dia(s) de atraso. Multa: ' + formatarMoeda(emprestimo.multa) + '.', 'alerta');
  } else {
    mostrarAviso('Devolução registrada dentro do prazo.');
  }
});

// ---------------------------------------------------------------
// Relatórios
// ---------------------------------------------------------------

function renderizarRanking(destino, vetor, campoId, campoNome, cabecalho) {
  // Monta um vetor de registros { nome, total } e ordena com o método da bolha.
  const contagem = [];
  for (let i = 0; i < vetor.length; i++) {
    contagem[i] = { nome: vetor[i][campoNome], total: contarEmprestimos(campoId, vetor[i].id, false) };
  }
  const ordenado = ordenarPorBolhaDecrescente(contagem, 'total');
  const maximo = ordenado.length > 0 && ordenado[0].total > 0 ? ordenado[0].total : 1;

  const linhas = [];
  for (let i = 0; i < ordenado.length && i < 10; i++) {
    const largura = Math.round((ordenado[i].total / maximo) * 100);
    linhas[i] = [
      (i + 1) + 'º',
      escapar(ordenado[i].nome),
      '<div class="barra"><div style="width:' + largura + '%"></div><span>' + ordenado[i].total + '</span></div>'
    ];
  }
  el(destino).innerHTML = montarTabela(['#', cabecalho, 'Empréstimos'], linhas, 'Sem dados.');
}

function renderizarMatriz() {
  const seletor = el('ano-matriz');

  // Lista os anos que têm empréstimos (para o select), sem repetir.
  const anos = [];
  for (let i = 0; i < banco.emprestimos.length; i++) {
    const ano = Number(banco.emprestimos[i].dataEmprestimo.substring(0, 4));
    if (buscaSequencialExata(anos, 'ano', ano).indice === -1) {
      anos[anos.length] = { ano: ano };
    }
  }
  const anoAtual = new Date().getFullYear();
  if (anos.length === 0) anos[0] = { ano: anoAtual };
  const anosOrdenados = ordenarPorInsercao(anos, 'ano', true);

  const anoEscolhido = Number(seletor.value) || anoAtual;
  const opcoes = [];
  for (let i = 0; i < anosOrdenados.length; i++) {
    opcoes[i] = { valor: anosOrdenados[i].ano, texto: String(anosOrdenados[i].ano) };
  }
  preencherSelect(seletor, opcoes);
  seletor.value = anoEscolhido;
  const ano = Number(seletor.value) || anosOrdenados[0].ano;

  // Matriz 12 meses x categorias: cada célula conta os empréstimos daquele mês/categoria.
  const matriz = criarMatriz(12, CATEGORIAS.length, 0);
  for (let i = 0; i < banco.emprestimos.length; i++) {
    const e = banco.emprestimos[i];
    if (Number(e.dataEmprestimo.substring(0, 4)) !== ano) continue;
    const livro = livroPorId(e.livroId);
    if (!livro) continue;
    const mes = Number(e.dataEmprestimo.substring(5, 7)) - 1;
    let coluna = CATEGORIAS.indexOf(livro.categoria);
    if (coluna === -1) coluna = CATEGORIAS.length - 1;
    matriz[mes][coluna]++;
  }

  const totaisMes = somarLinhas(matriz);
  const totaisCategoria = somarColunas(matriz);
  let totalGeral = 0;
  for (let i = 0; i < totaisMes.length; i++) totalGeral += totaisMes[i];

  // Maior valor da matriz, para destacar a célula.
  let maiorCelula = 0;
  for (let i = 0; i < 12; i++) {
    for (let j = 0; j < CATEGORIAS.length; j++) {
      if (matriz[i][j] > maiorCelula) maiorCelula = matriz[i][j];
    }
  }

  let html = '<div class="tabela-rolagem"><table class="matriz"><thead><tr><th>Mês</th>';
  for (let j = 0; j < CATEGORIAS.length; j++) html += '<th>' + CATEGORIAS[j] + '</th>';
  html += '<th>Total</th></tr></thead><tbody>';
  for (let i = 0; i < 12; i++) {
    html += '<tr><th>' + MESES[i] + '</th>';
    for (let j = 0; j < CATEGORIAS.length; j++) {
      const valor = matriz[i][j];
      const intensidade = maiorCelula > 0 ? valor / maiorCelula : 0;
      html += '<td style="--intensidade:' + intensidade.toFixed(2) + '" class="celula' + (valor > 0 && valor === maiorCelula ? ' destaque' : '') + '">' + (valor || '') + '</td>';
    }
    html += '<td class="total">' + totaisMes[i] + '</td></tr>';
  }
  html += '</tbody><tfoot><tr><th>Total</th>';
  for (let j = 0; j < CATEGORIAS.length; j++) html += '<td class="total">' + totaisCategoria[j] + '</td>';
  html += '<td class="total">' + totalGeral + '</td></tr></tfoot></table></div>';
  el('matriz').innerHTML = html;

  if (totalGeral === 0) {
    el('resumo-matriz').textContent = 'Nenhum empréstimo em ' + ano + '.';
  } else {
    const mesPico = indiceDoMaior(totaisMes);
    const categoriaTop = indiceDoMaior(totaisCategoria);
    el('resumo-matriz').innerHTML = 'Em ' + ano + ': <strong>' + totalGeral + '</strong> empréstimos. ' +
      'Mês com mais movimento: <strong>' + MESES[mesPico] + '</strong> (' + totaisMes[mesPico] + '). ' +
      'Categoria mais procurada: <strong>' + CATEGORIAS[categoriaTop] + '</strong> (' + totaisCategoria[categoriaTop] + ').';
  }
}

function renderizarRelatorios() {
  renderizarRanking('ranking-livros', banco.livros, 'livroId', 'titulo', 'Livro');
  renderizarRanking('ranking-leitores', banco.leitores, 'leitorId', 'nome', 'Leitor');
  renderizarMatriz();
}

el('ano-matriz').addEventListener('change', renderizarMatriz);

// ---------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------

function renderizarTudo() {
  renderizarPainel();
  renderizarLivros();
  renderizarLeitores();
  renderizarEmprestimos();
  renderizarRelatorios();
}

(function iniciar() {
  const opcoesCategorias = [];
  for (let i = 0; i < CATEGORIAS.length; i++) opcoesCategorias[i] = { valor: CATEGORIAS[i], texto: CATEGORIAS[i] };
  preencherSelect(el('sel-categoria'), opcoesCategorias, 'Selecione');

  const opcoesTipos = [];
  for (let i = 0; i < TIPOS_LEITOR.length; i++) opcoesTipos[i] = { valor: TIPOS_LEITOR[i], texto: TIPOS_LEITOR[i] };
  preencherSelect(el('sel-tipo'), opcoesTipos, 'Selecione');

  el('form-emprestimo').prazo.value = PRAZO_PADRAO_DIAS;
  el('regras').textContent = 'Regras: prazo padrão de ' + PRAZO_PADRAO_DIAS + ' dias, até ' +
    MAX_EMPRESTIMOS_POR_LEITOR + ' livros por leitor, multa de ' + formatarMoeda(MULTA_POR_DIA) +
    ' por dia de atraso. Leitores com atraso não podem pegar novos livros.';

  salvarBanco(banco);
  renderizarTudo();
})();
