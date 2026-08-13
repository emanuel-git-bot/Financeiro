# Financeiro Mobile

App React Native (Expo) que reproduz a lógica de `picpay.py` e `execute.py` (controle de teto
proporcional de R$ 81.000/ano sobre entradas), com perfis por usuário, armazenamento persistente
por conta e um dashboard consolidado.

## Estrutura

- `App.js` — navegação: ProfileSelect → Home → (PicPay | PagBankSelect → Account | Dashboard)
- `src/context/UserContext.js` — perfil atualmente selecionado (em memória, escolhido a cada abertura)
- `src/storage/db.js` — persistência local (AsyncStorage): perfis, contas por banco e transações,
  com deduplicação ao reimportar planilhas com período sobreposto
- `src/screens/ProfileSelectScreen.js` — tela inicial "quem está usando" (sem senha, toque pra entrar)
- `src/screens/HomeScreen.js` — atalhos pra PicPay, PagBank e Dashboard do perfil atual
- `src/screens/PagBankSelectScreen.js` — escolha entre PagBank Empresa / Pessoal
- `src/screens/AccountScreen.js` + `src/logic/picpayParser.js` / `pagbankParser.js` — upload,
  parsing (lógica de `picpay.py`/`execute.py`) e edição dos filtros de "ignorar no teto" por conta
- `src/screens/DashboardScreen.js` — resumo de todas as contas salvas do perfil atual
- `src/logic/calculations.js` — cálculo do resumo mensal e do limite proporcional (compartilhado)
- `src/logic/excelUtils.js` — leitura de xlsx/csv e utilitários de parsing

## Rodando

```bash
cd financeiro-mobile
npm install
npx expo install --fix
npx expo start
```

Abra no celular com o app **Expo Go** escaneando o QR code (Android/iOS), ou pressione `a`/`i`
no terminal para abrir em um emulador Android/iOS.

## Perfis e contas

- Ao abrir o app, escolha (ou crie) um perfil — ex: "Pai", "Mãe", "Eu". Sem senha, é só tocar.
  Segure o dedo num perfil pra remover (e apagar os dados salvos dele).
- Cada perfil tem 3 contas fixas: **PicPay**, **PagBank Empresa** e **PagBank Pessoal**. Cada uma
  guarda seu próprio histórico de transações — subir uma planilha nova **acrescenta** aos dados
  já salvos (sem duplicar transações repetidas), em vez de substituir.
- **Ignorar transferências entre suas próprias contas:** como não dá pra saber automaticamente qual
  texto o PagBank usa pra descrever uma transferência entre a conta Empresa e a Pessoal, isso é
  configurável: na tela de cada conta tem uma caixa "Ignorar no teto" onde você adiciona um trecho
  de texto (ex: um pedaço do nome da outra conta) que aparece nessas transações — a partir daí, toda
  transação com esse texto na descrição é excluída do cálculo de entradas/saídas automaticamente,
  em qualquer planilha nova. "Resgate de CDB" já é ignorado sempre, sem precisar configurar nada.
- **Dashboard** (tela acessível pelo Home) mostra um resumo de todas as contas salvas do perfil:
  entradas acumuladas, limite acumulado e status (dentro/ultrapassou), com atalho pra abrir cada uma.

## Observações

- O cálculo assume ano fiscal de 12 meses e meta anual de R$ 81.000 (mesma constante dos scripts
  Python). Para mudar, edite `META_ANUAL` em `src/logic/calculations.js`.
- A leitura de CSV do PicPay decodifica como `latin1` e separador `;`, igual ao script original.
- Datas em texto são interpretadas como dia/mês/ano (formato brasileiro).
- A deduplicação de transações usa data + entradas + saídas + descrição como chave. Duas transações
  genuinamente idênticas (mesmo valor, mesma descrição, mesmo dia) podem ser tratadas como uma só —
  limitação aceitável dado que os extratos não trazem um ID único por linha.
