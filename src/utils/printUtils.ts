import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helper to convert modern CSS oklch(...) colors to rgb/rgba/hex using HTML5 Canvas
function convertOklchToRgb(cssText: string): string {
  if (!cssText || !cssText.includes('oklch')) return cssText;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return cssText;

  return cssText.replace(/oklch\([^)]+\)/gi, (match) => {
    try {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = match;
      const resolved = ctx.fillStyle;
      if (resolved && resolved !== '#000000') {
        return resolved;
      }
      if (match.includes(' 0 0') || match.includes(' 0% 0') || match.includes(' 0%')) {
        return '#000000';
      }
      return resolved || '#000000';
    } catch {
      return '#000000';
    }
  });
}

// Pre-process DOM element trees to replace any oklch colors before rendering
function sanitizeOklchInNodeTree(root: HTMLElement) {
  const elements = [root, ...Array.from(root.querySelectorAll('*'))];
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  elements.forEach((node) => {
    const el = node as HTMLElement;
    if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
      el.style.cssText = convertOklchToRgb(el.style.cssText);
    }

    if (ctx) {
      try {
        const comp = window.getComputedStyle(el);
        const color = comp.color;
        const bg = comp.backgroundColor;
        const border = comp.borderColor;

        if (color && color.includes('oklch')) {
          el.style.color = convertOklchToRgb(color);
        }
        if (bg && bg.includes('oklch')) {
          el.style.backgroundColor = convertOklchToRgb(bg);
        }
        if (border && border.includes('oklch')) {
          el.style.borderColor = convertOklchToRgb(border);
        }
      } catch {
        // quiet catch
      }
    }
  });
}

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

  // Sanitize any oklch in cloned element tree
  sanitizeOklchInNodeTree(clone);

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
      windowHeight: cloneHeight,
      onclone: (clonedDoc) => {
        // Process all <style> elements in cloned document to remove oklch
        const styleElements = clonedDoc.querySelectorAll('style');
        styleElements.forEach((styleEl) => {
          if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
            styleEl.textContent = convertOklchToRgb(styleEl.textContent);
          }
        });

        // Process all elements in cloned document
        const allNodes = clonedDoc.querySelectorAll('*');
        allNodes.forEach((node) => {
          const el = node as HTMLElement;
          if (el.style && el.style.cssText && el.style.cssText.includes('oklch')) {
            el.style.cssText = convertOklchToRgb(el.style.cssText);
          }
        });
      }
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









