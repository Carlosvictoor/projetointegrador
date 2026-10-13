# Biblioteca Comunitária

Sistema web para controle de acervo e empréstimos de uma biblioteca de escola ou ONG.
Projeto Integrador: Programação WEB, UNISA 2026.

## Problema

Bibliotecas pequenas de escolas e ONGs costumam controlar os empréstimos em cadernos ou planilhas.
Isso dificulta saber quais livros estão disponíveis, quem está com livro atrasado e quais títulos
são mais procurados. O sistema resolve isso com cadastro de livros e leitores, controle de empréstimos
com prazo e multa, e relatórios.

## Como executar

Não precisa instalar nada. Basta abrir o arquivo `index.html` no navegador (Chrome, Edge ou Firefox).

Os dados ficam salvos no próprio navegador (`localStorage`). Na primeira vez, o sistema já abre com
dados de exemplo. Para voltar a eles, use o botão **Restaurar dados de exemplo** no Painel.

## Funcionalidades

- **Painel:** totais do acervo, empréstimos em aberto, atrasados, multas, média por leitor, livro mais antigo e mais recente.
- **Livros:** cadastro, remoção, busca por texto, ordenação por título, autor, ano ou código, e comparação entre busca sequencial e binária por código.
- **Leitores:** cadastro, remoção, busca e situação (regular ou com atraso).
- **Empréstimos:** novo empréstimo com prazo, devolução com cálculo automático de multa, histórico.
  - Regras: até 3 livros por leitor; quem tem livro atrasado não pode pegar outro; multa de R$ 0,50 por dia.
- **Relatórios:** ranking de livros e leitores, e matriz de empréstimos por mês e categoria.

## Estrutura

```
biblioteca-pi/
├── index.html          Estrutura da página (abas, formulários e tabelas)
├── css/estilo.css      Visual e layout responsivo
└── js/
    ├── algoritmos.js   Ordenação, buscas, recursão, matrizes e estatísticas
    ├── dados.js        Registros, gravação no navegador e dados de exemplo
    └── app.js          Interface: liga formulários e tabelas aos dados
```

Tecnologias: HTML5, CSS3 e JavaScript puro, sem bibliotecas externas.

## Conteúdo da disciplina aplicado

| Conteúdo do plano de ensino | Onde aparece |
|---|---|
| Variáveis, laços, decisões, entrada e saída | Em todo o `app.js` (formulários, validações e tabelas) |
| Contadores e acumuladores | `contarSe`, `media` e os totais do painel (`renderizarPainel`) |
| Flags (sinalizadores) | `houveTroca` no método da bolha; `leitorComAtraso` no empréstimo |
| Maior e menor valor | `maiorEMenor` (livro mais antigo/recente), `indiceDoMaior` |
| Média | `media` (empréstimos por leitor) |
| Vetores | Os registros de livros, leitores e empréstimos; `copiarVetor`, `removerDoVetor` |
| Registros | Objetos `livro`, `leitor` e `emprestimo` (descritos em `dados.js`) |
| Cadeias de caracteres | `normalizar` (minúsculas, sem acento), busca por trecho, códigos `L0001` |
| Ordenação | `ordenarPorInsercao` (listagens) e `ordenarPorBolhaDecrescente` (rankings) |
| Busca sequencial | `buscaSequencial` (busca por texto) e `buscaSequencialExata` |
| Busca binária | `buscaBinaria` (busca por código, com contagem de comparações) |
| Matrizes | `criarMatriz`, `somarLinhas` e `somarColunas` (relatório mês x categoria) |
| Procedimentos e funções | Todo o código é organizado em funções |
| Recursão | `buscaBinariaRecursiva` (localizar por id) e `somaRecursiva` (total de exemplares) |

## Comparação das buscas

Na aba **Livros**, a busca por código mostra quantas comparações cada método fez.
Com 20 livros, a busca sequencial pode precisar de até 20 comparações; a binária, no máximo 5
(log₂ 20 ≈ 4,3). Quanto maior o acervo, maior a vantagem da busca binária, desde que o vetor esteja ordenado.
