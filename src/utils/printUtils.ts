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
 * Converts images in a container to Base64 Data URLs to avoid CORS taints in html2canvas
 */
async function convertImagesToDataUrls(container: HTMLElement) {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(async (img) => {
      if (!img.src || img.src.startsWith('data:')) return;
      try {
        const res = await fetch(img.src, { mode: 'cors' });
        if (!res.ok) return;
        const blob = await res.blob();
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              img.src = reader.result;
            }
            resolve();
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(blob);
        });
      } catch {
        // Fallback gracefully if CORS prevents direct fetch
      }
    })
  );
}

/**
 * Generates a high-quality 1-page A4 PDF for a given HTML element.
 * Uses an isolated, clean iframe with embedded app stylesheets (oklch converted to RGB).
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
  iframe.style.visibility = 'hidden';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return false;
  }

  // 2. Extract application stylesheets and convert any oklch color codes
  let cssRulesText = '';
  try {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        if (sheet.cssRules) {
          for (const rule of Array.from(sheet.cssRules)) {
            cssRulesText += rule.cssText + '\n';
          }
        }
      } catch {
        // Ignore cross-origin stylesheet errors
      }
    }
  } catch {
    // Fallback
  }

  cssRulesText = convertOklchToRgb(cssRulesText);

  // 3. Initialize clean HTML structure inside iframe with Tailwind styles
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            background-color: #ffffff !important;
            color: #09090b !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0 !important;
            padding: 0 !important;
            width: 800px !important;
            height: auto !important;
            overflow: visible !important;
          }
          img { max-width: 100%; height: auto; }
          ${cssRulesText}
        </style>
      </head>
      <body style="width: 800px; margin: 0; padding: 0; background-color: #ffffff;">
      </body>
    </html>
  `);
  iframeDoc.close();

  // 4. Clone source element and append into iframe body
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'printable-certificate-pdf-clone';

  // Apply clean 1-page document bounds to clone
  clone.style.width = '780px';
  clone.style.maxWidth = '780px';
  clone.style.margin = '0 auto';
  clone.style.padding = '24px';
  clone.style.boxSizing = 'border-box';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0px';
  clone.style.border = 'none';
  clone.style.position = 'relative';
  clone.style.top = '0px';
  clone.style.left = '0px';
  clone.style.transform = 'none';

  iframeDoc.body.appendChild(clone);

  try {
    // Inline images to Base64 Data URLs to avoid CORS taints
    await convertImagesToDataUrls(clone);

    // Wait for images & fonts to settle in the iframe
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Wait for any remaining <img> in clone to finish loading
    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve(true);
            else {
              img.onload = () => resolve(true);
              img.onerror = () => resolve(true);
            }
          })
      )
    );

    // 5. Capture clone element directly with html2canvas
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // 6. Construct A4 PDF in jsPDF (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    const marginTopBottom = 6; // 6mm top & bottom margins
    const marginLeftRight = 6; // 6mm left & right margins
    const maxPdfWidth = pdfWidth - marginLeftRight * 2; // 198mm
    const maxPdfHeight = pdfHeight - marginTopBottom * 2; // 285mm

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    let fitWidth = maxPdfWidth;
    let fitHeight = fitWidth / ratio;

    // Scale down proportionally if height exceeds max printable height on 1 page
    if (fitHeight > maxPdfHeight) {
      fitHeight = maxPdfHeight;
      fitWidth = fitHeight * ratio;
    }

    const xOffset = (pdfWidth - fitWidth) / 2;
    const yOffset = marginTopBottom;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, fitWidth, fitHeight);

    const filename = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error in generateCertificatePdf:', err);
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
