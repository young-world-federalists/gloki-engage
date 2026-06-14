/*
 * IdentityCardSVG — the downloadable identity *credential*.
 *
 * Deliberately rendered in canonical English (the labels below) regardless of the
 * active UI locale, the way a passport or official credential stays canonical. This
 * is a product decision (Batch 14), not an oversight: the on-screen UI is fully
 * localized, but the exported credential card is not.
 *
 * It is also not a clean string-swap to change: the labels are a single sentence
 * fragmented around fixed-position, canvas-rendered PNGs (member name / community
 * name) at hardcoded x/y, so longer fr/sw strings would clip. If this decision is
 * ever revisited, it needs a layout reflow — let the labels auto-size like the
 * name/community images already do — then t() the labels (add `identityCardSvg.*`
 * keys to fr/sw) and localize the dialog's "Unknown Member"/"Unknown" fallbacks too
 * (kept English here so they stay coherent with this English card).
 */
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createRoot } from 'react-dom/client';

interface IdentityCardSVGProps {
  communityName: string;
  memberName: string;
  memberInitial: string;
  memberPhoto?: string;
  agentId: string;
  qrData: string;
  width?: number;
  height?: number;
  onRenderComplete?: () => void;
}

const IdentityCardSVG: React.FC<IdentityCardSVGProps> = ({
  communityName,
  memberName,
  memberInitial,
  memberPhoto,
  agentId,
  qrData,
  width = 428,
  height = 270,
  onRenderComplete
}) => {
  // Calculate dimensions and positions
  const cardWidth = width;
  const cardHeight = height;
  const headerHeight = 60;
  const footerHeight = 40;
  const bodyHeight = cardHeight - headerHeight - footerHeight;
  
  // State for QR code paths
  const [qrPaths, setQrPaths] = useState<Array<{key: number, d: string, fill: string}>>([]);
  
  // State for text images with positioning data
  const [memberNameImage, setMemberNameImage] = useState<{imageData: string, width: number, height: number, offsetX: number, offsetY: number}>({imageData: '', width: 0, height: 0, offsetX: 0, offsetY: 0});
  const [memberNameImageSmall, setMemberNameImageSmall] = useState<{imageData: string, width: number, height: number, offsetX: number, offsetY: number}>({imageData: '', width: 0, height: 0, offsetX: 0, offsetY: 0});
  const [communityNameImageWhite, setCommunityNameImageWhite] = useState<{imageData: string, width: number, height: number, offsetX: number, offsetY: number}>({imageData: '', width: 0, height: 0, offsetX: 0, offsetY: 0});
  const [communityNameImageBlack, setCommunityNameImageBlack] = useState<{imageData: string, width: number, height: number, offsetX: number, offsetY: number}>({imageData: '', width: 0, height: 0, offsetX: 0, offsetY: 0});
  
  // Function to render text as PNG with precise positioning
  const renderTextAsPNG = (
    text: string, 
    fontSize: number, 
    fontFamily: string, 
    fontWeight: string, 
    color: string,
  ): {imageData: string, width: number, height: number, offsetX: number, offsetY: number} => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return {imageData: '', width: 0, height: 0, offsetX: 0, offsetY: 0};

    // Set font first to measure text
    ctx.font = `${fontWeight} ${fontSize * 3}px ${fontFamily}`;
    
    // Measure the text to get accurate dimensions
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize * 3; // Approximate height
    
    // Create a larger canvas to render the text
    const padding = fontSize; // Add some padding - fontsize/3*3
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Set font and render text at known coordinates (with padding offset)
    ctx.font = `${fontWeight} ${fontSize * 3}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic'; // Use 'top' for more predictable positioning
    ctx.fillText(text, padding, canvas.height - padding);

    return {
      imageData: canvas.toDataURL('image/png'),
      width: canvas.width,
      height: canvas.height,
      offsetX: - padding, // Adjust for the clipping offset
      offsetY: - canvas.height + padding,
    };
  };
  
  // Function to generate QR code as SVG paths
  const generateQRCodePaths = async (value: string): Promise<Array<{key: number, d: string, fill: string}>> => {
    try {
      // Create a temporary div to render the QR code
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);
      
      // Render QR code to temporary element
      const root = createRoot(tempDiv);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('QR code generation timeout');
          observer.disconnect();
          root.unmount();
          document.body.removeChild(tempDiv);
          resolve([]);
        }, 5000); // 5 second timeout
        
        // Create MutationObserver to watch for SVG element
        const observer = new MutationObserver(() => {
          const svgElement = tempDiv.querySelector('svg');
          if (svgElement) {
            clearTimeout(timeout);
            observer.disconnect();
            
            const paths = svgElement.querySelectorAll('path');
            const pathData = Array.from(paths).map((path, index) => ({
              key: index,
              d: path.getAttribute('d') || '',
              fill: path.getAttribute('fill') || 'black'
            }));
            
            // Cleanup
            root.unmount();
            document.body.removeChild(tempDiv);
            resolve(pathData);
          }
        });
        
        // Start observing the temporary div for changes
        observer.observe(tempDiv, {
          childList: true,
          subtree: true
        });
        
        root.render(
          <QRCodeSVG value={value} size={120} level="M" />
        );
      });
    } catch (error) {
      console.error('Error generating QR code paths:', error);
      return [];
    }
  };

  // Generate QR code paths and text images on component mount
  useEffect(() => {
    generateQRCodePaths(qrData).then(setQrPaths);
    
    // Generate text images with precise positioning
    // Member name positioned at (115, headerHeight + 5) in SVG coordinates
    const memberImg = renderTextAsPNG(memberName, 20, 'Arial, sans-serif', 'bold', '#1f2937');

    // Member name small positioned at (115, headerHeight + 105) in SVG coordinates
    const memberImgSmall = renderTextAsPNG(memberName, 12, 'Arial, sans-serif', 'bold', '#6b7280');
    
    // Community name white positioned at (76, 24) in SVG coordinates  
    const communityImgWhite = renderTextAsPNG(communityName, 16, 'Arial, sans-serif', 'normal', '#ffffff');

    // Community name black positioned at (20, headerHeight + 140) in SVG coordinates
    const communityImgBlack = renderTextAsPNG(communityName + '.', 12, 'Arial, sans-serif', 'normal', '#6b7280');
    
    setMemberNameImage(memberImg);
    setMemberNameImageSmall(memberImgSmall);
    setCommunityNameImageWhite(communityImgWhite);
    setCommunityNameImageBlack(communityImgBlack);
  }, [qrData, memberName, communityName, headerHeight]);

  // Call onRenderComplete when qrPaths and text images are set
  useEffect(() => {
    if (qrPaths.length > 0 && memberNameImage.imageData && memberNameImageSmall.imageData && communityNameImageWhite.imageData && communityNameImageBlack.imageData && onRenderComplete) {
      onRenderComplete();
    }
  }, [qrPaths, memberNameImage, memberNameImageSmall, communityNameImageWhite, communityNameImageBlack, onRenderComplete]);
  
  // Colors
  const primaryColor = '#3b82f6';
  const primaryDarkColor = '#1d4ed8';
  const cardBackground = '#f8fafc';
  const textColor = '#1f2937';
  const textSecondaryColor = '#6b7280';
  const borderColor = '#e5e7eb';

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${cardWidth} ${cardHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Card background - simplified design */}
      <defs>
        {/* Simple gradients that work well in both screen and PDF */}
        <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
        
        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={primaryDarkColor} />
        </linearGradient>
        
        <linearGradient id="photoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={primaryDarkColor} />
        </linearGradient>
      </defs>

      {/* Card background */}
      <rect
        x="0"
        y="0"
        width={cardWidth}
        height={cardHeight}
        rx="12"
        ry="12"
        fill="url(#cardGradient)"
      />

      {/* Header */}
      <path
        d={`M 12 0 L ${cardWidth - 12} 0 Q ${cardWidth} 0 ${cardWidth} 12 L ${cardWidth} ${headerHeight} L 0 ${headerHeight} L 0 12 Q 0 0 12 0 Z`}
        fill="url(#headerGradient)"
      />
      
      {/* Header content */}
      {/* Logo */}
      <rect
        x="20"
        y="10"
        width="40"
        height="40"
        rx="8"
        ry="8"
        fill="rgba(255, 255, 255, 0.2)"
      />
      <text
        x="32"
        y="36"
        // textAnchor="middle"
        // dominantBaseline="middle"
        fill="white"
        fontSize="18"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        ID
      </text>
      
      {/* Title */}
      <text
        x="80"
        y="24"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.5"
      >
        AUTHENTICATED IDENTITY CARD
      </text>
      {communityNameImageWhite.imageData && (
        <image
          href={communityNameImageWhite.imageData}
          x={80 + communityNameImageWhite.offsetX / 3}
          y={46 + communityNameImageWhite.offsetY / 3}
          width={communityNameImageWhite.width / 3}
          height={communityNameImageWhite.height / 3}
        />
      )}

      {/* Body */}
      <rect
        x="0"
        y={headerHeight}
        width={cardWidth}
        height={bodyHeight}
        fill="transparent"
      />
      
      {/* Member photo */}
      <g transform={`translate(20, ${headerHeight + 20})`}>
        {/* Photo border */}
        <rect
          x="0"
          y="0"
          width="80"
          height="80"
          rx="12"
          ry="12"
          fill="none"
          stroke={primaryColor}
          strokeWidth="3"
        />
        
        {memberPhoto ? (
          <defs>
            <clipPath id="photoClip">
              <rect x="3" y="3" width="74" height="74" rx="9" ry="9" />
            </clipPath>
          </defs>
        ) : (
          <rect
            x="3"
            y="3"
            width="74"
            height="74"
            rx="9"
            ry="9"
            fill="url(#photoGradient)"
          />
        )}
        
        {memberPhoto ? (
          <image
            href={memberPhoto}
            x="3"
            y="3"
            width="74"
            height="74"
            clipPath="url(#photoClip)"
          />
        ) : (
          <text
            x="40"
            y="40"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="32"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            {memberInitial}
          </text>
        )}
      </g>
      
      {/* Member details */}
      {memberNameImage.imageData && (
        <image
          href={memberNameImage.imageData}
          x={120 + memberNameImage.offsetX / 3}
          y={headerHeight + 36 + memberNameImage.offsetY / 3}
          width={memberNameImage.width / 3}
          height={memberNameImage.height / 3}
        />
      )}
      
      {/* Member details */}
      <text
        x="120"
        y={headerHeight + 60}
        fill={textColor}
        fontSize="18"
        // fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        <tspan x="120" y={headerHeight + 60}>Authenticated</tspan>
        <tspan x="120" y={headerHeight + 80}>member</tspan>
      </text>
      
      {/* Main text - moved below photo for more width */}
      <g>
        <text
          x="20"
          y={headerHeight + 124}
          fill={textSecondaryColor}
          fontSize="12"
          fontFamily="Arial, sans-serif"
        >
          This certifies that 
        </text>
        {memberNameImageSmall.imageData && (
          <image
            href={memberNameImageSmall.imageData}
            x={114 + memberNameImageSmall.offsetX / 3}
            y={headerHeight + 124 + memberNameImageSmall.offsetY / 3}
            width={memberNameImageSmall.width / 3}
            height={memberNameImageSmall.height / 3}
          />
        )}
        <text
          x="20"
          y={headerHeight + 140}
          fill={textSecondaryColor}
          fontSize="12"
          fontFamily="Arial, sans-serif"
        >
          is an authenticated member of 
        </text>
        {communityNameImageBlack.imageData && (
          <image
            href={communityNameImageBlack.imageData}
            x={20 + communityNameImageBlack.offsetX / 3}
            y={headerHeight + 156 + communityNameImageBlack.offsetY / 3}
            width={communityNameImageBlack.width / 3}
            height={communityNameImageBlack.height / 3}
          />
        )}
      </g>
      
      {/* QR Code */}
      <g transform={`translate(${cardWidth - 160}, ${headerHeight + 18})`}>
        <rect
          x="0"
          y="0"
          width="140"
          height="140"
          rx="12"
          ry="12"
          fill="white"
          stroke={borderColor}
          strokeWidth="1"
        />
        {/* Render QR code as SVG paths */}
        <svg x="0" y="0" width="140" height="140" viewBox="0 0 140 140">
          <g transform="translate(10, 10) scale(2.44)">
            {qrPaths.map((path) => (
              <path
                key={path.key}
                d={path.d}
                fill={path.fill}
              />
            ))}
          </g>
        </svg>
      </g>

      {/* Footer */}
      <path
        d={`M 0 ${cardHeight - footerHeight} L ${cardWidth} ${cardHeight - footerHeight} L ${cardWidth} ${cardHeight - 12} Q ${cardWidth} ${cardHeight} ${cardWidth - 12} ${cardHeight} L 12 ${cardHeight} Q 0 ${cardHeight} 0 ${cardHeight - 12} Z`}
        fill={cardBackground}
        stroke={borderColor}
        strokeWidth="1"
        strokeDasharray="0 0 0 1"
      />
      
      {/* Member ID */}
      <text
        x={cardWidth / 2}
        y={cardHeight - 17}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textSecondaryColor}
        fontSize="10"
        fontWeight="normal"
        fontFamily="Courier New"
      >
        ID: {agentId}
      </text>
    </svg>
  );
};

export default IdentityCardSVG;
