# Marvel Verse

Projeto de faculdade desenvolvido com HTML, CSS e JavaScript, sem frameworks.

## Sobre o projeto

A ideia é revisitar os personagens que fizeram parte dos quadrinhos e desenhos dos anos 90 e 2000. A página combina uma apresentação editorial com um catálogo de personagens.

## Como executar

1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Inicie o `index.html` usando a extensão Live Server.
4. Com internet ativa, aguarde o carregamento dos personagens.

## Onde entra a API?

O arquivo `script.js` consulta o conjunto de dados da [SuperHero API (akabab)](https://github.com/akabab/superhero-api), hospedado no jsDelivr. O JavaScript filtra os registros da editora Marvel Comics, monta os cards, aplica busca, filtros, ordenação e o botão **Carregar mais**.

A API é um conjunto público de dados, não um serviço de atualização ao vivo. A página busca os dados quando é aberta ou recarregada.

## Estrutura

- `index.html`: conteúdo e marcação semântica.
- `assets/css/style.css`: estilos e responsividade.
- `assets/js/script.js`: busca de dados, criação dos cards e interações.
- `assets/images/`: artes locais usadas nos personagens em destaque.

## Decisões de implementação

Os cards são criados por JavaScript. Cada card é um `article` e inclui um botão para alternar entre informações e atributos. O botão pode ser usado por teclado e informa seu estado com `aria-pressed`. A busca tem rótulo, os resultados são anunciados por uma região de status e há tratamento de erros de rede. A página também respeita a preferência por movimento reduzido.

## Créditos

Projeto acadêmico não oficial, sem vínculo com a Marvel. Personagens e ilustrações pertencem aos respectivos titulares. Dados: akabab SuperHero API. As oito imagens de destaque foram fornecidas para este projeto.

## Organização dos arquivos

A pasta `assets` reúne os arquivos estáticos do projeto: `css` para os estilos, `js` para as funcionalidades e `images` para as imagens dos personagens. Os caminhos no HTML, CSS e JavaScript foram atualizados para essa estrutura.

## Checklist antes de entregar

- Abrir com Live Server e conferir se os personagens aparecem após a consulta à API.
- Pesquisar um nome existente e outro inexistente.
- Testar filtros, ordenação, botão de carregar mais e virar os cards.
- Desligar a internet temporariamente e verificar a mensagem de erro e o botão de tentar novamente.
- Testar no celular ou no modo responsivo do navegador, e navegar com Tab e Enter.

**Observação:** a API fornece um catálogo público, não dados atualizados em tempo real. É necessário ter conexão com a internet. As imagens locais são usadas apenas nos personagens selecionados; os demais usam imagens da API.
