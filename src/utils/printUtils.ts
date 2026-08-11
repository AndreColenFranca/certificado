import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Converts any oklch(...) color string into a browser-resolved RGB / Hex string using HTML5 Canvas
 */
function convertOklchToRgb(cssValue: string): string {
  if (!cssValue || !cssValue.includes('oklch')) return cssValue;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return cssValue;

  return cssValue.replace(/oklch\([^)]+\)/gi, (match) => {
    try {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = match;
      const resolved = ctx.fillStyle;
      if (resolved && resolved !== '#000000') {
        return resolved;
      }
      return '#000000';
    } catch {
      return '#000000';
    }
  });
}

/**
 * Copies computed inline styles from a source DOM subtree to a target DOM subtree,
 * converting any lingering oklch values to browser-compatible RGB values.
 */
function copyInlineComputedStyles(source: HTMLElement, target: HTMLElement) {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll('*'))];
  const targetNodes = [target, ...Array.from(target.querySelectorAll('*'))];

  for (let i = 0; i < sourceNodes.length; i++) {
    const srcEl = sourceNodes[i] as HTMLElement;
    const tgtEl = targetNodes[i] as HTMLElement;

    if (!srcEl || !tgtEl || srcEl.nodeType !== Node.ELEMENT_NODE) continue;

    try {
      const computed = window.getComputedStyle(srcEl);
      let inlineCss = '';

      for (let j = 0; j < computed.length; j++) {
        const prop = computed[j];
        if (!prop || prop.startsWith('--')) continue; // Skip custom CSS variables

        let val = computed.getPropertyValue(prop);
        if (val && val.includes('oklch')) {
          val = convertOklchToRgb(val);
        }
        if (val) {
          inlineCss += `${prop}:${val};`;
        }
      }

      tgtEl.setAttribute('style', inlineCss);
    } catch (e) {
      // Fallback: keep existing inline styles if getComputedStyle fails on special nodes
      if (tgtEl.style && tgtEl.style.cssText && tgtEl.style.cssText.includes('oklch')) {
        tgtEl.style.cssText = convertOklchToRgb(tgtEl.style.cssText);
      }
    }
  }
}

/**
 * Generates a high-quality 1-page A4 PDF for a given HTML element.
 * Uses an isolated, clean iframe to completely bypass Tailwind v4 oklch CSS stylesheet parsing errors.
 */
export async function generateCertificatePdf(
  elementId = 'printable-certificate-document',
  docTitle = 'Certificado_de_Autenticidade'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found`);
    return false;
  }

  // 1. Create an isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '-9999px';
  iframe.style.width = '800px';
  iframe.style.height = '1130px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return false;
  }

  // 2. Initialize clean HTML structure inside iframe (no external oklch stylesheets)
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: #ffffff; color: #0f172a; font-family: system-ui, -apple-system, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; overflow: hidden; width: 100%; height: 100%; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body style="width: 794px; margin: 0 auto; background: #ffffff; padding: 0;">
      </body>
    </html>
  `);
  iframeDoc.close();

  // 3. Clone source element and copy computed RGB styles
  const clone = element.cloneNode(true) as HTMLElement;
  copyInlineComputedStyles(element, clone);

  // Force strict A4 layout bounds on cloned container, clearing any computed top margins or transforms
  clone.style.width = '770px';
  clone.style.maxWidth = '770px';
  clone.style.marginTop = '0px';
  clone.style.marginBottom = '0px';
  clone.style.marginLeft = 'auto';
  clone.style.marginRight = 'auto';
  clone.style.transform = 'none';
  clone.style.position = 'relative';
  clone.style.top = '0px';
  clone.style.left = '0px';
  clone.style.padding = '16px';
  clone.style.boxSizing = 'border-box';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';

  iframeDoc.body.appendChild(clone);

  try {
    // Wait for images & fonts to settle in the iframe
    await new Promise((resolve) => setTimeout(resolve, 350));

    const renderHeight = clone.offsetHeight || clone.getBoundingClientRect().height || 1000;

    // 4. Capture with html2canvas inside the isolated iframe document with scroll offsets reset to 0
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: 770,
      height: renderHeight,
      windowWidth: 800,
      windowHeight: renderHeight + 20
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // 5. Construct A4 PDF in jsPDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    const margin = 5; // 5mm page margin
    const maxPdfWidth = pdfWidth - margin * 2; // 200mm
    const maxPdfHeight = pdfHeight - margin * 2; // 287mm

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let fitWidth = maxPdfWidth;
    let fitHeight = fitWidth / ratio;

    // STRICT GUARANTEE: If fitHeight exceeds maxPdfHeight, scale both width & height proportionally so it ALWAYS fits on Page 1!
    if (fitHeight > maxPdfHeight) {
      fitHeight = maxPdfHeight;
      fitWidth = fitHeight * ratio;
    }

    const xOffset = (pdfWidth - fitWidth) / 2;
    const yOffset = (pdfHeight - fitHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, fitWidth, fitHeight);

    const filename = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error in generateCertificatePdf:', err);
    // Fallback: window.print() if canvas generation fails
    try {
      window.print();
    } catch (e) {
      console.error('Fallback print failed:', e);
    }
    return false;
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
}

/**
 * Trigger print dialog or generate PDF directly
 */
export async function printElement(
  elementId = 'printable-certificate-document',
  docTitle = 'Certificado_de_Autenticidade'
) {
  const isSandboxed = window.self !== window.top;

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
      console.warn('Native window.print failed, falling back to PDF generation:', err);
    }
  }

  await generateCertificatePdf(elementId, docTitle);
}
