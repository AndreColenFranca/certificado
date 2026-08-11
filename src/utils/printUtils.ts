import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function generateCertificatePdf(
  elementId = 'printable-certificate-document',
  docTitle = 'Certificado_de_Autenticidade'
) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  // Scroll parent container to top so html2canvas captures from top offset 0
  const parent = element.parentElement;
  const oldScrollTop = parent ? parent.scrollTop : 0;
  if (parent) {
    parent.scrollTop = 0;
  }

  try {
    // Allow any pending renders
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Capture the visible element directly
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0
    });

    // Restore scroll position
    if (parent) {
      parent.scrollTop = oldScrollTop;
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Create a single-page A4 PDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    // Use 6mm margins
    let renderWidth = pdfWidth - 12;
    let renderHeight = renderWidth / ratio;

    if (renderHeight > pdfHeight - 12) {
      renderHeight = pdfHeight - 12;
      renderWidth = renderHeight * ratio;
    }

    const xOffset = (pdfWidth - renderWidth) / 2;
    const yOffset = (pdfHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);

    const cleanFilename = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    pdf.save(cleanFilename);
  } catch (err) {
    console.error('Error generating PDF with html2canvas:', err);
    if (parent) {
      parent.scrollTop = oldScrollTop;
    }
    try {
      window.print();
    } catch (e) {
      console.error('Print fallback failed:', e);
    }
  }
}

export async function printElement(
  elementId = 'printable-certificate-document',
  docTitle = 'Certificado_de_Autenticidade'
) {
  const isSandboxed = window.self !== window.top;

  // In standalone top window, try native print dialog first
  if (!isSandboxed) {
    try {
      const prevTitle = document.title;
      if (docTitle) document.title = docTitle;
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
      }, 1000);
      return;
    } catch (err) {
      console.warn('Native window.print failed, generating PDF instead:', err);
    }
  }

  // In sandboxed frame or fallback, generate & download 1-page A4 PDF directly
  await generateCertificatePdf(elementId, docTitle);
}







