import React from 'react';
import BankScreen from './BankScreen';
import { processPagBankFile } from '../logic/pagbankParser';

export default function PagBankScreen() {
  return (
    <BankScreen
      title="PagBank"
      color="#FFA300"
      hint="Selecione o extrato exportado do PagBank (.xlsx)"
      mimeTypes={[
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ]}
      parseFn={processPagBankFile}
    />
  );
}
