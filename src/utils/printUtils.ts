import html2pdf from 'html2pdf.js';

export async function printElement(
  elementId = 'printable-certificate-document',
  docTitle = 'Certificado_de_Autenticidade'
) {
  const prevTitle = document.title;
  if (docTitle) {
    document.title = docTitle;
  }

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return;
  }

  // Create an isolated temporary container at top:0 left:0
  // This avoids scroll offsets, modal wrapper margins, or page 2/3 break issues in html2canvas
  const tempContainer = document.createElement('div');
  tempContainer.id = 'temp-pdf-print-container';
  tempContainer.style.position = 'fixed';
  tempContainer.style.top = '0';
  tempContainer.style.left = '0';
  tempContainer.style.width = '794px'; // A4 width at 96 DPI
  tempContainer.style.zIndex = '-999999';
  tempContainer.style.backgroundColor = '#ffffff';
  tempContainer.style.margin = '0';
  tempContainer.style.padding = '0';
  tempContainer.style.overflow = 'hidden';

  // Deep clone the certificate element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.margin = '0';
  clone.style.padding = '24px 32px';
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.boxSizing = 'border-box';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.border = '6px double #b45309';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0c0a09';
  clone.style.position = 'relative';
  clone.style.transform = 'none';

  tempContainer.appendChild(clone);
  document.body.appendChild(tempContainer);

  try {
    // Small delay to allow images (QR code, logo) inside the cloned DOM to render
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanFilename = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const opt = {
      margin: [4, 4, 4, 4] as [number, number, number, number],
      filename: cleanFilename,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0,
        windowWidth: 794
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(clone).save();
  } catch (pdfErr) {
    console.error('html2pdf generation error:', pdfErr);
    // Fallback if html2pdf fails
    try {
      window.print();
    } catch (e) {
      console.error('Final print fallback error:', e);
    }
  } finally {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  }
}






