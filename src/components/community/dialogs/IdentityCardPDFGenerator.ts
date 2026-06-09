import React from 'react';
import IdentityCardSVG from './IdentityCardSVG';

interface IdentityCardPDFGeneratorProps {
  communityName: string;
  memberName: string;
  memberInitial: string;
  memberPhoto?: string;
  agentId: string;
  qrData: string;
}

export const generateIdentityCardPDF = async ({
  communityName,
  memberName,
  memberInitial,
  memberPhoto,
  agentId,
  qrData,
}: IdentityCardPDFGeneratorProps): Promise<Blob> => {
  // Heavy PDF deps load on demand — only when the user actually exports a
  // card — so the IdentityCardDialog chunk stays small. The svg2pdf.js import
  // is a side effect: it registers jsPDF.prototype.svg.
  const [{ jsPDF }] = await Promise.all([
    import('jspdf'),
    import('svg2pdf.js'),
  ]);

  // Create a temporary container for the SVG
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.top = '-9999px';
  document.body.appendChild(tempContainer);

  try {
    
    // Create a React root to render the SVG
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(tempContainer);
    
    // Wait for the SVG to be rendered and QR code paths to be generated
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.error('PDF generation timeout - SVG not rendered');
        resolve();
      }, 10000); // 10 second timeout as fallback
      
      // Render the SVG component with onRenderComplete callback
      root.render(
        React.createElement(IdentityCardSVG, {
          communityName,
          memberName,
          memberInitial,
          memberPhoto,
          agentId,
          qrData,
          width: 428,
          height: 270,
          onRenderComplete: () => {
            clearTimeout(timeout);
            resolve();
          }
        })
      );
    });

    // Get the SVG element
    const svgElement = tempContainer.querySelector('svg') as SVGElement;
    if (!svgElement) {
      throw new Error('Failed to render SVG element');
    }

    // Create a new PDF document
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [85.6, 54], // ID card dimensions in mm
    });

    // Convert SVG to PDF (the SVG already contains the text as images)
    await pdf.svg(svgElement, {
      x: 0,
      y: 0,
      width: 85.6,
      height: 54,
    });

    // Clean up
    root.unmount();
    document.body.removeChild(tempContainer);

    // Return the PDF as a blob
    return pdf.output('blob');
  } catch (error) {
    // Clean up on error
    if (tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
    throw error;
  }
};
