import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function generateProjectPDF(project: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Add Page numbering footer
  const addFooters = () => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado por EvalAI Safety System   |   Página ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  };

  // --- HEADER SECTON ---
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 0, pageWidth, 5, 'F');
  y += 5;

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('REPORTE TÉCNICO DE SEGURIDAD', margin, y + 10);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`ID Documento: ${project.docNum || 'REV-' + new Date().getFullYear().toString() + '001'}`, pageWidth - margin, y + 10, { align: 'right' });
  doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, pageWidth - margin, y + 15, { align: 'right' });
  
  y += 25;

  // --- PROJECT INFO SECTION ---
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  const titleLines = doc.splitTextToSize(project.name, pageWidth - margin * 2);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 5;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    body: [
      ['Cliente / Área', project.client || 'No especificado', 'Responsable', project.author || 'No especificado'],
      ['Tipo de Máquina', project.type || 'Industrial', 'Normativa Base', 'ISO 12100, NR-12']
    ],
    margin: { left: margin, right: margin }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // --- 1. MÁQUINA / ENTORNO (SETUP) ---
  let s = null;
  if (project.evaluations.length > 0 && project.evaluations[0].projectSetup) {
      s = project.evaluations[project.evaluations.length - 1].projectSetup || project.evaluations[0].projectSetup;
  }
  
  if (s) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 158, 11);
    doc.text('1. DATOS DE LA MÁQUINA E INSTALACIÓN', margin, y);
    y += 5;
    
    autoTable(doc, {
      startY: y,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, textColor: [51, 65, 85] },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
      body: [
        ['Uso Previsto:', s.intendedUse || '-'],
        ['Entorno Previsto:', s.intendedEnvironment || '-'],
        ['Personal Operativo:', s.operatedBy || '-'],
        ['Capacitación Mínima:', s.trainingLevel || '-'],
        ['Dimensiones (Aprox):', s.dimensions || '-'],
        ['Personal de Mantenimiento:', s.maintenance || '-'],
        ['Fuentes de Energía (LOTO):', s.energySources || '-'],
      ],
      margin: { left: margin, right: margin }
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // --- 2. RESUMEN DE EVALUACIONES ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('2. HISTORIAL DE EVALUACIONES (BITÁCORA)', margin, y);
  y += 5;

  const evData = project.evaluations.map((ev: any) => [
    `v${ev.version}`,
    new Date(ev.date).toLocaleDateString(),
    ev.label,
    ev.status || 'En curso',
    ev.findings?.length || 0
  ]);

  autoTable(doc, {
    startY: y,
    theme: 'striped',
    head: [['Versión', 'Fecha', 'Etapa', 'Estado', 'Hallazgos']],
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
    styles: { fontSize: 9 },
    body: evData,
    margin: { left: margin, right: margin }
  });
  y = (doc as any).lastAutoTable.finalY + 15;

  // --- 3. DETALLE DE HALLAZGOS Y MEDIDAS ---
  doc.addPage();
  y = margin + 5;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text('3. REGISTRO DETALLADO DE HALLAZGOS', margin, y);
  y += 10;

  project.evaluations.forEach((ev: any, evIdx: number) => {
    if (!ev.findings || ev.findings.length === 0) return;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`ETAPA: ${ev.label.toUpperCase()} (v${ev.version})`, margin, y);
    y += 5;

    ev.findings.forEach((f: any, fIdx: number) => {
      const fTitle = `${f.id || 'H-' + (fIdx + 1)}. ${f.title}`;
      
      autoTable(doc, {
        startY: y,
        theme: 'grid',
        head: [[
          { content: fTitle, styles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
          { content: `PHR: ${f.phr || 'N/A'}`, styles: { fillColor: f.phr > 40 ? [254, 226, 226] : [255, 243, 205], textColor: f.phr > 40 ? [185, 28, 28] : [133, 77, 14], halign: 'right' } }
        ]],
        body: [
          [{ content: `Peligro: ${f.taskType || '-'} / ${f.hazardSubtype || '-'}`, colSpan: 2 }],
          [{ content: `Ubicación: ${f.location || '-'}`, colSpan: 2 }],
          [{ content: `Actividad: ${f.activity || '-'}`, colSpan: 2 }],
          [{ content: 'Medidas Propuestas:', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }],
          ... (f.measures && f.measures.length > 0 ? f.measures.map((m: any) => [{ content: `• [${m.type}] ${m.desc}`, colSpan: 2 }]) : [[{ content: 'Sin medidas asignadas', colSpan: 2, styles: { fontStyle: 'italic', textColor: [150, 150, 150] } }]])
        ],
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: margin, right: margin }
      });
      
      y = (doc as any).lastAutoTable.finalY + 10;
      
      if (y > pageHeight - margin - 20) {
        doc.addPage();
        y = margin + 5;
      }
    });
    
    y += 10;
  });

  addFooters();
  doc.save(`Reporte_Auditoria_${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}
