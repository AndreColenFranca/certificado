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

  // 1. Create a clean, temporary wrapper placed at top: 0, left: 0 of the screen
  const tempWrapper = document.createElement('div');
  tempWrapper.id = 'temp-pdf-render-wrapper';
  tempWrapper.style.position = 'fixed';
  tempWrapper.style.top = '0';
  tempWrapper.style.left = '0';
  tempWrapper.style.width = '794px'; // Standard A4 width at 96 DPI
  tempWrapper.style.zIndex = '999999'; // Render on top so html2canvas computes full visibility
  tempWrapper.style.backgroundColor = '#ffffff';
  tempWrapper.style.margin = '0';
  tempWrapper.style.padding = '0';
  tempWrapper.style.boxSizing = 'border-box';
  tempWrapper.style.overflow = 'hidden';
  tempWrapper.style.pointerEvents = 'none';

  // 2. Clone the certificate element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.margin = '0';
  clone.style.padding = '28px 36px';
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.boxSizing = 'border-box';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.border = '6px double #b45309';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0c0a09';
  clone.style.position = 'relative';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.transform = 'none';

  tempWrapper.appendChild(clone);
  document.body.appendChild(tempWrapper);

  try {
    // Brief delay to ensure cloned images/fonts/QR are rendered
    await new Promise((resolve) => setTimeout(resolve, 250));

    const cloneHeight = clone.offsetHeight || clone.getBoundingClientRect().height || 1050;

    // 3. Capture with html2canvas strictly bounded to 0,0 with exact clone dimensions
    const canvas = await html2canvas(clone, {
      scale: 2, // High DPI resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      x: 0,
      y: 0,
      width: 794,
      height: cloneHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 794,
      windowHeight: cloneHeight
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // 4. Build single-page jsPDF document (A4: 210mm x 297mm)
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

    const margin = 6; // 6mm margin around document
    let renderWidth = pdfWidth - (margin * 2);
    let renderHeight = renderWidth / ratio;

    if (renderHeight > (pdfHeight - (margin * 2))) {
      renderHeight = pdfHeight - (margin * 2);
      renderWidth = renderHeight * ratio;
    }

    const xOffset = (pdfWidth - renderWidth) / 2;
    const yOffset = (pdfHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);

    const cleanFilename = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    pdf.save(cleanFilename);
  } catch (err) {
    console.error('Error generating PDF with html2canvas:', err);
    try {
      window.print();
    } catch (e) {
      console.error('Print fallback failed:', e);
    }
  } finally {
    if (document.body.contains(tempWrapper)) {
      document.body.removeChild(tempWrapper);
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








