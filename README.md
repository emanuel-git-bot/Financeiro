# Financeiro Mobile

App React Native (Expo) que reproduz a lógica de `picpay.py` e `execute.py` (controle de teto
proporcional de R$ 81.000/ano sobre entradas), com perfis por usuário, bancos adicionados sob
demanda (com suporte a qualquer banco via `.ofx`), armazenamento persistente por conta e um
dashboard consolidado.

## Estrutura

- `App.js` — navegação: ProfileSelect → Home → (AddBank | Account | Dashboard)
- `src/context/UserContext.js` — perfil atualmente selecionado (em memória, escolhido a cada abertura)
- `src/storage/db.js` — persistência local (AsyncStorage): perfis, contas por banco (adicionadas
  explicitamente pelo usuário) e transações, com deduplicação ao reimportar extratos com período
  sobreposto. `BANK_TEMPLATES` é o catálogo de bancos com parser pronto.
- `src/screens/ProfileSelectScreen.js` — tela inicial "quem está usando" (sem senha, toque pra entrar)
- `src/screens/HomeScreen.js` — lista os bancos já adicionados do perfil atual + "Adicionar banco" + Dashboard
- `src/screens/AddBankScreen.js` — escolher um banco do catálogo (PicPay, PagBank Empresa/Pessoal,
  Nubank) ou adicionar qualquer outro banco via arquivo `.ofx`
- `src/screens/AccountScreen.js` + `src/logic/picpayParser.js` / `pagbankParser.js` / `nubankParser.js`
  / `ofxParser.js` — upload, parsing e edição dos filtros de "ignorar no teto" por conta
- `src/screens/DashboardScreen.js` — resumo de todas as contas salvas do perfil, com um card
  "Todos os bancos" somando o histórico combinado
- `src/logic/calculations.js` — cálculo do resumo mensal e do limite proporcional (compartilhado)
- `src/logic/excelUtils.js` — leitura de xlsx/csv/texto e utilitários de parsing

## Rodando

```bash
cd financeiro-mobile
npm install
npx expo install --fix
npx expo start
```

Abra no celular com o app **Expo Go** escaneando o QR code (Android/iOS), ou pressione `a`/`i`
no terminal para abrir em um emulador Android/iOS.

## Perfis e bancos

- Ao abrir o app, escolha (ou crie) um perfil — ex: "Pai", "Mãe", "Eu". Sem senha, é só tocar.
  Segure o dedo num perfil pra remover (e apagar os dados salvos dele).
- A Home começa vazia: toque em **"Adicionar banco"** pra escolher entre os bancos com suporte
  pronto (PicPay, PagBank Empresa, PagBank Pessoal, Nubank) ou adicionar **qualquer outro banco**
  via arquivo **.ofx** — só dar um nome pra identificar. Segure o dedo num banco na Home pra removê-lo
  (e apagar os dados salvos dele).
- Cada banco adicionado guarda seu próprio histórico de transações — subir um extrato novo
  **acrescenta** aos dados já salvos (sem duplicar transações repetidas), em vez de substituir.
  - Bancos que trazem um ID único por transação no extrato (Nubank no CSV, e qualquer `.ofx` via
    `FITID`) usam esse ID pra deduplicação exata. PicPay/PagBank caem num heurístico (data + entradas
    + saídas + descrição).
- **Ignorar transferências entre suas próprias contas:** como não dá pra saber automaticamente qual
  texto cada banco usa pra descrever uma transferência entre duas contas suas (ex: PagBank Empresa →
  Pessoal), isso é configurável: na tela de cada conta tem uma caixa "Ignorar no teto" onde você
  adiciona um trecho de texto que aparece nessas transações — a partir daí, toda transação com esse
  texto na descrição é excluída do cálculo automaticamente, em qualquer extrato novo. "Resgate de
  CDB" já é ignorado sempre, sem precisar configurar nada.
- **Dashboard** (tela acessível pelo Home) mostra um resumo de todas as contas salvas do perfil,
  mais um card "Todos os bancos" com a soma combinada de tudo.

## Observações

- O cálculo assume ano fiscal de 12 meses e meta anual de R$ 81.000 (mesma constante dos scripts
  Python). Para mudar, edite `META_ANUAL` em `src/logic/calculations.js`.
- A leitura de CSV do PicPay decodifica como `latin1` e separador `;`, igual ao script original;
  Nubank usa `utf-8` e vírgula.
- Datas em texto são interpretadas como dia/mês/ano (formato brasileiro).
- O parser de `.ofx` é genérico (testado contra extratos reais do Nubank) e deve funcionar pra
  qualquer banco que siga o padrão OFX (`<STMTTRN>`/`<TRNAMT>`/`<DTPOSTED>`/`<FITID>`/`<MEMO>`),
  mas bancos com variações do formato podem precisar de ajuste.
