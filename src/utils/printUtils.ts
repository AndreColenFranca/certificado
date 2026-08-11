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

        // NEVER copy margins, top/bottom positions, or transforms from on-screen flex layouts!
        if (
          prop.startsWith('margin') ||
          prop === 'top' ||
          prop === 'bottom' ||
          prop === 'position' ||
          prop === 'transform' ||
          prop === 'translate'
        ) {
          continue;
        }

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
      if (tgtEl.style && tgtEl.style.cssText && tgtEl.style.cssText.includes('oklch')) {
        tgtEl.style.cssText = convertOklchToRgb(tgtEl.style.cssText);
      }
    }
  }
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

  // 2. Initialize clean HTML structure inside iframe
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { background: #ffffff; color: #0f172a; font-family: system-ui, -apple-system, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
          img { max-width: 100%; height: auto; }
        </style>
      </head>
      <body style="width: 780px; margin: 0 auto; background: #ffffff; padding: 0;">
      </body>
    </html>
  `);
  iframeDoc.close();

  // 3. Clone source element and copy computed RGB styles
  const clone = element.cloneNode(true) as HTMLElement;
  copyInlineComputedStyles(element, clone);

  // Force strict A4 layout bounds on cloned container, starting directly at top 0
  clone.style.width = '780px';
  clone.style.maxWidth = '780px';
  clone.style.margin = '0 auto';
  clone.style.marginTop = '0px';
  clone.style.marginBottom = '0px';
  clone.style.padding = '16px';
  clone.style.position = 'relative';
  clone.style.top = '0px';
  clone.style.left = '0px';
  clone.style.transform = 'none';
  clone.style.boxSizing = 'border-box';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';

  if (clone.firstElementChild) {
    (clone.firstElementChild as HTMLElement).style.marginTop = '0px';
  }

  iframeDoc.body.appendChild(clone);

  try {
    // Inline images to Base64 Data URLs to avoid CORS taints
    await convertImagesToDataUrls(clone);

    // Wait for images & fonts to settle in the iframe
    await new Promise((resolve) => setTimeout(resolve, 300));

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

    // 4. Capture clone element directly with html2canvas
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800,
      windowHeight: 1130
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

    const marginTopBottom = 5; // 5mm top & bottom margins
    const marginLeftRight = 5; // 5mm left & right margins
    const maxPdfWidth = pdfWidth - marginLeftRight * 2; // 200mm
    const maxPdfHeight = pdfHeight - marginTopBottom * 2; // 287mm

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
