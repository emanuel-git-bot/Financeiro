# Financeiro Mobile

App React Native (Expo) que reproduz a lógica de `picpay.py` e `execute.py` (controle de teto
proporcional de R$ 81.000/ano sobre entradas), com uma tela inicial para escolher o banco.

## Estrutura

- `App.js` — navegação (Home → PicPay / PagBank)
- `src/screens/HomeScreen.js` — seleção do banco
- `src/screens/PicPayScreen.js` + `src/logic/picpayParser.js` — equivalente a `picpay.py`
  (aceita `.xlsx`/`.csv`, título nas colunas, descrição = 3ª coluna, resgates de CDB ignorados no teto)
- `src/screens/PagBankScreen.js` + `src/logic/pagbankParser.js` — equivalente a `execute.py`
  (`.xlsx`, pula as 8 primeiras linhas, colunas fixas `Entradas`/`Saidas`/`Data`/`Descrição`)
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

## Observações

- O cálculo assume ano fiscal de 12 meses e meta anual de R$ 81.000 (mesma constante dos scripts
  Python). Para mudar, edite `META_ANUAL` em `src/logic/calculations.js`.
- A leitura de CSV do PicPay decodifica como `latin1` e separador `;`, igual ao script original.
- Datas em texto são interpretadas como dia/mês/ano (formato brasileiro).
