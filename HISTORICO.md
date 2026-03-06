# Historico do Projeto - Biblioteca de Anuncios

## Data: 06/Mar/2026

---

## Objetivo
Criar uma aplicacao web que permite verificar se um post do Instagram/Facebook esta sendo anunciado na Meta Ad Library.

---

## O que foi feito

### 1. Configuracao da API Meta Ad Library
- Configurado app no Meta for Developers
- Use case: "Other" + "Business"
- Permissao: `ads_read` (suficiente para acessar Ad Library)
- Token gerado no Graph API Explorer

### 2. Criacao do Projeto Next.js
- Framework: Next.js 16 com TypeScript
- Estilizacao: Tailwind CSS
- Deploy: Vercel
- Repositorio: https://github.com/netobarni/biblioteca-de-anuncios

### 3. Funcionalidades Implementadas

#### API /api/search
- Recebe a legenda do post
- Remove apenas emojis e URLs
- Busca na Meta Ad Library usando a legenda completa
- Retorna anuncios ativos E concluidos (`ad_active_status: ALL`)
- Limite de 50 resultados

#### Frontend
- Campo para colar a legenda do post
- Botao de busca
- Lista de resultados com:
  - Nome da pagina
  - Texto do anuncio
  - Status (Ativo/Concluido)
  - Datas de inicio e fim
  - Link para ver o anuncio

### 4. Tentativa de Extracao Automatica de Legenda (NAO FUNCIONOU)

Tentamos extrair a legenda automaticamente de URLs do Instagram/Facebook, mas nao funcionou porque:

- Instagram usa renderizacao client-side (React/JavaScript)
- A pagina retorna apenas HTML vazio sem os dados do post
- O oEmbed API do Instagram retorna erro
- O endpoint /embed/ tambem nao contem a legenda acessivel

**Solucoes possiveis (nao implementadas):**
- Puppeteer/Playwright (lento e caro no serverless)
- APIs terceiros como RapidAPI (pago)
- Instagram Graph API (so funciona para posts proprios)

**Decisao:** Manter entrada manual da legenda.

---

## Arquivos Principais

```
biblioteca-de-anuncios/
├── src/
│   └── app/
│       ├── page.tsx          # Frontend principal
│       ├── layout.tsx        # Layout com metadata
│       └── api/
│           └── search/
│               └── route.ts  # API de busca na Ad Library
├── .env.local                # Token da API (nao commitado)
├── .env.example              # Template do .env
└── HISTORICO.md              # Este arquivo
```

---

## Variaveis de Ambiente

```env
META_ACCESS_TOKEN=seu_token_aqui
```

O token deve ser gerado em: https://developers.facebook.com/tools/explorer

---

## Como Funciona a Busca

1. Usuario cola a legenda do post
2. Sistema remove emojis e URLs
3. Envia para a Meta Ad Library API:
   - Endpoint: `https://graph.facebook.com/v19.0/ads_archive`
   - Parametros: search_terms, ad_reached_countries, ad_active_status
4. Retorna anuncios que contenham os termos buscados
5. Exibe resultados com status e datas

---

## Limitacoes

1. **Busca por termos, nao exata** - A API da Meta busca por palavras-chave, nao por correspondencia exata
2. **Apenas Brasil** - Configurado para `ad_reached_countries: ['BR']`
3. **Token expira** - O access token precisa ser renovado periodicamente
4. **Rate limits** - A API tem limites de requisicoes (nao documentados pela Meta)

---

## Proximas Melhorias Possiveis

- [ ] Adicionar mais paises na busca
- [ ] Implementar paginacao de resultados
- [ ] Salvar historico de buscas
- [ ] Adicionar filtros (por data, por pagina, etc.)
- [ ] Renovacao automatica do token

---

*Criado com auxilio do Claude Code*
