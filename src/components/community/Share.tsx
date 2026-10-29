import React, { useRef } from 'react';
import { Copy, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './Share.module.scss';
import { useAppSelector } from '../../store/hooks';

import { encodeCommunityInvitation } from '../../services/encodeDecode';

interface ShareProps {
  communityId: string;
}

const Share: React.FC<ShareProps> = ({ communityId }) => {
  const qrSectionRef = useRef<HTMLDivElement>(null);
  
  // Get community contract info from Redux
  const { contracts } = useAppSelector(state => state.user);
  const { publicKey } = useAppSelector(state => state.user);
  const communityContract = contracts.find((c) => c.id === communityId);
  const server = communityContract?.address || '';
  const agent = publicKey || '';
  const contract = communityContract?.id || '';

  // Only include the three fields needed for sharing
  const credentials = {
    server,
    agent,
    contract,
  };

  const qrData = encodeCommunityInvitation(server, agent, contract);

  const handleCopyCredentials = () => {
    navigator.clipboard.writeText(JSON.stringify(credentials, null, 2));
  };

  const handleDownloadQR = () => {
    if (!qrSectionRef.current) {
      console.error('QR section ref not found');
      return;
    }

    // Get the QR SVG element
    const qrSvgElement = qrSectionRef.current.querySelector('svg');
    if (!qrSvgElement) {
      console.error('QR SVG not found');
      return;
    }

    // Get the QR SVG content
    const qrSvgContent = new XMLSerializer().serializeToString(qrSvgElement);
    
    // Create canvas and draw everything manually with proper rounded corners
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = 2; // Higher resolution
    canvas.width = 264 * scale; // Reduced width (300 - 36 = 264)
    canvas.height = 300 * scale; // Keep height the same
    
    if (ctx) {
      // Scale the context
      ctx.scale(scale, scale);
      
      // Helper function to draw rounded rectangle
      const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number, fillColor: string, strokeColor?: string, strokeWidth?: number) => {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        if (fillColor) {
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
        
        if (strokeColor && strokeWidth) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
      };
      
      // Canvas/SVG literals — cannot reference SCSS tokens at draw time. Keep in sync
      // with variables.scss: #3b82f6=$primary, #1d4ed8≈$primary-dark, #f8fafc=$gray-50,
      // #1f2937=$gray-800, #6b7280=$gray-600, #e5e7eb=$gray-200.
      // Draw white background with rounded corners (reduced width)
      drawRoundedRect(0, 0, 264, 300, 12, '#ffffff');
      
      // Draw title (smaller font, closer to frame)
      ctx.fillStyle = '#1f2937';
      ctx.font = '500 16px system-ui, Avenir, Helvetica, Arial, sans-serif'; // Smaller font
      ctx.textAlign = 'center';
      ctx.fillText('Community QR Code', 132, 25); // Centered in 264px width, closer to top
      
      // Draw QR code container background - frame only around QR code (keep same size)
      const qrSize = 200; // QR code size (keep same)
      const framePadding = 14; // Keep same padding
      const frameSize = qrSize + (framePadding * 2); // Frame size = QR size + padding on both sides
      const frameX = (264 - frameSize) / 2; // Center the frame in reduced width image
      const frameY = 40; // Closer to title
      
      // Draw white background for QR code area
      drawRoundedRect(frameX, frameY, frameSize, frameSize, 8, '#ffffff');
      
      // Convert QR SVG to image and draw it
      const qrSvgBlob = new Blob([qrSvgContent], { type: 'image/svg+xml;charset=utf-8' });
      const qrSvgUrl = URL.createObjectURL(qrSvgBlob);
      const qrImg = new Image();
      
      qrImg.onload = () => {
        // Draw the QR code image (centered in frame with smaller padding)
        ctx.drawImage(qrImg, frameX + framePadding, frameY + framePadding, qrSize, qrSize);
        
        // Draw rounded border frame around the QR code only (smaller frame)
        drawRoundedRect(frameX, frameY, frameSize, frameSize, 8, 'transparent', '#e5e7eb', 2);
        
        // Draw description text (smaller font, closer to frame)
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px system-ui, Avenir, Helvetica, Arial, sans-serif'; // Smaller font
        ctx.textAlign = 'center';
        ctx.fillText('Scan this QR code to join the community', 132, frameY + frameSize + 20); // Centered in 264px width
        
        // Create download link
        const link = document.createElement('a');
        link.download = `community-${communityId.substring(0, 8)}-qr.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Clean up
        URL.revokeObjectURL(qrSvgUrl);
      };
      
      qrImg.src = qrSvgUrl;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Share Community</h2>
        <p>Share this community with others via QR code</p>
      </div>

      <div className={styles.content}>
        <div className={styles.qrSection} ref={qrSectionRef}>
          <h3>Community QR Code</h3>
          <div className={styles.qrCodeContainer}>
            <QRCodeSVG
              value={qrData}
              size={320}
              level="M"
              className={styles.qrCode}
            />
          </div>
          <p className={styles.qrDescription}>
            Scan this QR code to join the community
          </p>
        </div>

        <div className={styles.communityInfoSection}>
          <h3>Community Credentials</h3>
          <div className={styles.communityDetails}>
            <pre className={styles.scrollXNoWrap}>
              {JSON.stringify(credentials, null, 2)}
            </pre>
          </div>
        </div>

        <div className={styles.actionsSection}>
          <div className={styles.actionButtons}>
            <button onClick={handleCopyCredentials} className={styles.actionButton}>
              <Copy size={20} />
              Copy Credentials
            </button>
            <button onClick={handleDownloadQR} className={styles.actionButton}>
              <Download size={20} />
              Download QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Share; 