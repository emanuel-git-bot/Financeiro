import React from 'react';
import BankScreen from './BankScreen';
import { processPicPayFile } from '../logic/picpayParser';

export default function PicPayScreen() {
  return (
    <BankScreen
      title="PicPay"
      color="#21C25E"
      hint="Selecione o extrato exportado do PicPay (.xlsx ou .csv)"
      // '*/*': o MIME type de .csv varia muito entre apps/aparelhos Android
      // (text/csv, text/comma-separated-values, application/csv...) e filtrar
      // por tipo específico acaba escondendo o arquivo no seletor. A extensão
      // do nome do arquivo já decide o parsing (ver excelUtils.readWorkbookRows).
      mimeTypes={['*/*']}
      parseFn={processPicPayFile}
    />
  );
}
