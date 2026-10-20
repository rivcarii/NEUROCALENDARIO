/** Compatibilidad: el informe se compone en `reportDoc` y se dibuja en `reportHtml` (teléfono) o `reportPdf` (navegador). */
export { buildReportDoc, DISCLAIMER, type Block, type ReportInput, type ReportSections } from './reportDoc';
export { buildReportHtml, esc } from './reportHtml';
export { computeAdherence, type Adherence } from './adherence';
