import { PDFDocument, PDFPage, rgb, grayscale } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { format } from 'date-fns';

// Import the DejaVu fonts
import DejaVuSansRegular from '@/assets/fonts/dejavu/DejaVuSans.ttf';
import DejaVuSansBold from '@/assets/fonts/dejavu/DejaVuSans-Bold.ttf';

export interface CompetencyResponse {
  question: string;
  answer: 'yes' | 'not-yet' | 'yes_no' | string;
  comment: string;
  section?: string;
  helpText?: string;
}

export interface MedicationCompetencyData {
  employeeId: string;
  employeeName: string;
  periodIdentifier: string;
  assessmentDate: string;
  supervisor?: string;
  branch?: string;
  responses: CompetencyResponse[];
  signature?: string;
  completedAt: string;
  questionnaireName?: string;
  overallResult?: 'competent' | 'not-yet-competent' | 'requires-training';
}

interface CompanyInfo {
  name?: string;
  logo?: string;
}

export async function generateMedicationCompetencyPdf(
  data: MedicationCompetencyData,
  company?: CompanyInfo
): Promise<void> {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Embed fonts
    const regularFontBytes = await fetch(DejaVuSansRegular).then(res => res.arrayBuffer());
    const boldFontBytes = await fetch(DejaVuSansBold).then(res => res.arrayBuffer());
    
    const regularFont = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);

    // Embed company logo if provided
    let logoImage = null;
    if (company?.logo) {
      try {
        const logoBytes = await fetch(company.logo).then(res => res.arrayBuffer());
        logoImage = await pdfDoc.embedPng(logoBytes);
      } catch (error) {
        console.warn('Could not embed logo:', error);
      }
    }

    let page = pdfDoc.addPage([595, 842]); // A4 size
    let yPosition = 820;
    
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    // Premium color palette - modern medical luxury theme
    const colors = {
      primary: rgb(0.1, 0.3, 0.6),         // Deep medical blue
      secondary: rgb(0.05, 0.5, 0.35),     // Emerald medical green
      accent: rgb(0.85, 0.25, 0.15),       // Crimson red
      gold: rgb(0.9, 0.75, 0.2),           // Medical certification gold
      platinum: rgb(0.85, 0.85, 0.92),     // Platinum silver
      text: rgb(0.15, 0.15, 0.15),         // Rich charcoal
      textLight: rgb(0.45, 0.45, 0.45),    // Sophisticated gray
      background: rgb(0.98, 0.99, 1.0),    // Pure white-blue
      cardBg: rgb(0.96, 0.98, 1.0),        // Subtle card background
      success: rgb(0.1, 0.65, 0.3),        // Professional green
      warning: rgb(0.9, 0.55, 0.1),        // Amber warning
      border: rgb(0.82, 0.85, 0.88),       // Elegant border
      white: rgb(1, 1, 1),
      gradient1: rgb(0.08, 0.25, 0.55),    // Gradient start
      gradient2: rgb(0.12, 0.35, 0.65),    // Gradient mid
      gradient3: rgb(0.16, 0.45, 0.75),    // Gradient end
      shadow: rgb(0.9, 0.9, 0.95)          // Subtle shadow
    };

    // Helper functions
    const drawText = (text: string, x: number, y: number, options: any = {}) => {
      const { size = 10, bold = false, color = colors.text, maxWidth, lineHeight, ...rest } = options;
      const drawOptions: any = {
        x,
        y,
        size,
        font: bold ? boldFont : regularFont,
        color,
      };
      if (typeof maxWidth !== 'undefined') drawOptions.maxWidth = maxWidth;
      if (typeof lineHeight !== 'undefined') drawOptions.lineHeight = lineHeight;
      page.drawText(text, { ...drawOptions, ...rest });
    };

    const drawRectangle = (x: number, y: number, width: number, height: number, color: any) => {
      page.drawRectangle({
        x,
        y,
        width,
        height,
        color
      });
    };

    const addNewPage = () => {
      page = pdfDoc.addPage([595, 842]);
      yPosition = 800;
      drawPageHeader();
    };

    const checkPageSpace = (requiredSpace: number) => {
      if (yPosition - requiredSpace < 80) {
        addNewPage();
      }
    };

    const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
      const lines: string[] = [];
      const paragraphs = String(text || '').split(/\r?\n/);

      const pushBrokenWord = (word: string) => {
        let remainder = word;
        while (font.widthOfTextAtSize(remainder, fontSize) > maxWidth && remainder.length > 1) {
          let sliceEnd = 1;
          for (let i = 1; i <= remainder.length; i++) {
            const part = remainder.slice(0, i);
            if (font.widthOfTextAtSize(part, fontSize) > maxWidth) {
              sliceEnd = i - 1;
              break;
            }
            sliceEnd = i;
          }
          const part = remainder.slice(0, sliceEnd);
          if (!part) break;
          lines.push(part);
          remainder = remainder.slice(sliceEnd);
        }
        if (remainder) lines.push(remainder);
      };

      for (let p = 0; p < paragraphs.length; p++) {
        const para = paragraphs[p];
        const words = para.split(/\s+/).filter(Boolean);
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (testWidth <= maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            // If the word alone is too wide, break it into pieces
            if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
              pushBrokenWord(word);
              currentLine = '';
            } else {
              currentLine = word;
            }
          }
        }

        if (currentLine) lines.push(currentLine);
        // Keep paragraph spacing (but avoid trailing empty line)
        if (p < paragraphs.length - 1) lines.push('');
      }

      return lines;
    };

    // Page header (for subsequent pages)
    const drawPageHeader = () => {
      if (page !== pdfDoc.getPage(0)) {
        drawRectangle(0, pageHeight - 25, pageWidth, 25, colors.primary);
        drawText('Medication Competency Assessment', margin, pageHeight - 18, {
          color: colors.white,
          size: 10,
          bold: true
        });
        drawText(`${data.employeeName} - ${data.periodIdentifier}`, pageWidth - margin - 200, pageHeight - 18, {
          color: colors.white,
          size: 9
        });
        yPosition = pageHeight - 40;
      }
    };

    // Luxurious header with sophisticated gradient
    const drawModernHeader = () => {
      // Premium gradient background (sophisticated multi-layer effect)
      for (let i = 0; i < 20; i++) {
        const ratio = i / 19;
        const r = 0.08 + (0.16 - 0.08) * ratio;
        const g = 0.25 + (0.45 - 0.25) * ratio;
        const b = 0.55 + (0.75 - 0.55) * ratio;
        drawRectangle(0, yPosition - 160 + (i * 3), pageWidth, 3, rgb(r, g, b));
      }

      // Elegant overlay with subtle transparency effect
      drawRectangle(0, yPosition - 160, pageWidth, 160, colors.primary);
      
      // Luxury accent stripe
      drawRectangle(0, yPosition - 165, pageWidth, 5, colors.gold);

      // Decorative elements
      drawRectangle(margin, yPosition - 20, contentWidth, 2, colors.gold);
      
      // Premium logo placement with shadow effect
      if (logoImage) {
        // Shadow effect
        const logoSize = 60;
        drawRectangle(margin + 2, yPosition - 92, logoSize * 2, logoSize, colors.shadow);
        page.drawImage(logoImage, {
          x: margin,
          y: yPosition - 90,
          width: logoSize * 2,
          height: logoSize,
        });
      }

      // Company branding with elegant typography
      if (company?.name) {
        drawText(company.name.toUpperCase(), margin + (logoImage ? 140 : 0), yPosition - 35, {
          color: colors.gold,
          size: 16,
          bold: true
        });
        drawText('Healthcare Excellence Division', margin + (logoImage ? 140 : 0), yPosition - 52, {
          color: colors.platinum,
          size: 10
        });
      }

      // Prestigious main title with embossed effect
      drawText('MEDICATION COMPETENCY', margin, yPosition - 85, {
        color: colors.white,
        size: 24,
        bold: true
      });
      drawText('CERTIFICATION ASSESSMENT', margin, yPosition - 105, {
        color: colors.gold,
        size: 18,
        bold: true
      });

      // Professional subtitle with sophistication
      drawText('Advanced Clinical Skills Evaluation & Professional Development Framework', 
        margin, yPosition - 125, {
          color: colors.platinum,
          size: 11
        });

      // Luxury information panel with premium styling
      const infoBoxY = yPosition - 155;
      // Shadow for depth
      drawRectangle(pageWidth - 248, infoBoxY - 2, 210, 47, colors.shadow);
      // Main panel with gradient-like effect
      drawRectangle(pageWidth - 250, infoBoxY, 210, 45, colors.white);
      drawRectangle(pageWidth - 250, infoBoxY + 40, 210, 5, colors.gold);
      
      // Premium typography for info panel
      drawText('ASSESSMENT CERTIFICATE', pageWidth - 240, infoBoxY + 30, {
        color: colors.primary,
        size: 9,
        bold: true
      });
      
      drawText('ID:', pageWidth - 240, infoBoxY + 18, {
        color: colors.text,
        size: 9,
        bold: true
      });
      drawText(data.periodIdentifier, pageWidth - 210, infoBoxY + 18, {
        color: colors.primary,
        size: 9,
        bold: true
      });
      
      drawText('Issued:', pageWidth - 240, infoBoxY + 6, {
        color: colors.text,
        size: 9,
        bold: true
      });
      drawText(format(new Date(), 'MMM dd, yyyy'), pageWidth - 200, infoBoxY + 6, {
        color: colors.text,
        size: 9
      });

      yPosition -= 180;
    };

    // Luxurious employee information card
    const drawEmployeeCard = () => {
      checkPageSpace(130);
      
      const cardHeight = 120;
      const cardY = yPosition - cardHeight;
      
      // Premium card design with shadow and gradient
      drawRectangle(margin + 2, cardY - 2, contentWidth, cardHeight, colors.shadow);
      drawRectangle(margin, cardY, contentWidth, cardHeight, colors.white);
      
      // Elegant header with gold accent
      drawRectangle(margin, cardY + cardHeight - 30, contentWidth, 30, colors.primary);
      drawRectangle(margin, cardY + cardHeight - 5, contentWidth, 5, colors.gold);
      
      // Professional icon and title
      drawText('👨‍⚕️ HEALTHCARE PROFESSIONAL PROFILE', margin + 15, cardY + cardHeight - 20, {
        color: colors.white,
        size: 13,
        bold: true
      });

      // Elegant employee details with improved spacing
      const detailsY = cardY + cardHeight - 50;
      
      // Primary information row
      drawText('Professional Name:', margin + 20, detailsY, { bold: true, size: 11, color: colors.text });
      drawText(data.employeeName, margin + 150, detailsY, { 
        size: 12, 
        color: colors.primary, 
        bold: true 
      });
      
      drawText('Assessment Date:', margin + 20, detailsY - 20, { bold: true, size: 11, color: colors.text });
      drawText(data.assessmentDate, margin + 150, detailsY - 20, { size: 11 });
      
      // Secondary information with professional styling
      if (data.supervisor) {
        drawText('Clinical Supervisor:', margin + 20, detailsY - 40, { bold: true, size: 11, color: colors.text });
        drawText(data.supervisor, margin + 150, detailsY - 40, { size: 11, color: colors.secondary });
      }
      
      // Right column information
      if (data.branch) {
        drawText('Healthcare Division:', margin + 320, detailsY, { bold: true, size: 11, color: colors.text });
        drawText(data.branch, margin + 450, detailsY, { size: 11, color: colors.secondary });
      }
      
      drawText('Certification Date:', margin + 320, detailsY - 20, { bold: true, size: 11, color: colors.text });
      drawText(format(new Date(data.completedAt), 'MMM dd, yyyy HH:mm'), margin + 450, detailsY - 20, { 
        size: 11,
        color: colors.primary 
      });

      // Professional certification stamp effect
      drawRectangle(margin + contentWidth - 80, cardY + 15, 70, 25, colors.gold);
      drawText('CERTIFIED', margin + contentWidth - 75, cardY + 25, {
        color: colors.white,
        size: 8,
        bold: true
      });

      yPosition = cardY - 25;
    };

    // Premium competency analytics dashboard
    const drawCompetencySummary = () => {
      checkPageSpace(100);
      
      const competentCount = data.responses.filter(r => r.answer === 'yes').length;
      const totalCount = data.responses.length;
      const percentage = Math.round((competentCount / totalCount) * 100);
      
      // Luxury analytics card with sophisticated design
      const summaryHeight = 85;
      const summaryY = yPosition - summaryHeight;
      
      // Card with shadow and elegant border
      drawRectangle(margin + 2, summaryY - 2, contentWidth, summaryHeight, colors.shadow);
      drawRectangle(margin, summaryY, contentWidth, summaryHeight, colors.white);
      drawRectangle(margin, summaryY + summaryHeight - 3, contentWidth, 3, colors.gold);
      
      // Premium analytics section header
      drawText('📈 CLINICAL COMPETENCY ANALYTICS', margin + 20, summaryY + 65, {
        bold: true,
        size: 14,
        color: colors.primary
      });
      
      // Sophisticated progress visualization
      const progressWidth = 320;
      const progressHeight = 12;
      const progressX = margin + 20;
      const progressY = summaryY + 35;
      
      // Multi-layered progress bar with premium styling
      drawRectangle(progressX - 2, progressY - 2, progressWidth + 4, progressHeight + 4, colors.border);
      drawRectangle(progressX, progressY, progressWidth, progressHeight, colors.platinum);
      
      // Gradient progress fill
      const fillWidth = (progressWidth * percentage) / 100;
      const progressColor = percentage >= 90 ? colors.success : 
                           percentage >= 80 ? colors.gold : 
                           percentage >= 70 ? colors.warning : colors.accent;
      
      // Elegant solid progress fill
      drawRectangle(progressX, progressY, fillWidth, progressHeight, progressColor);
      
      // Performance metrics with professional styling
      drawText(`${competentCount}/${totalCount} Core Competencies Achieved`, 
        progressX + progressWidth + 25, summaryY + 65, { 
          size: 12, 
          bold: true,
          color: colors.text 
        });
      
      drawText(`Performance Score: ${percentage}%`, 
        progressX + progressWidth + 25, summaryY + 48, { 
          size: 11,
          color: colors.primary 
        });
      
      // Professional certification status with premium badge
      const resultText = percentage >= 90 ? 'EXPERT LEVEL COMPETENT' : 
                        percentage >= 80 ? 'PROFESSIONALLY COMPETENT' : 
                        percentage >= 70 ? 'COMPETENT - REQUIRES REVIEW' : 
                        'ADDITIONAL TRAINING REQUIRED';
      const resultColor = percentage >= 90 ? colors.success : 
                         percentage >= 80 ? colors.gold : 
                         percentage >= 70 ? colors.warning : colors.accent;
      
      // Status badge with elegant styling
      const badgeWidth = 200;
      const badgeX = margin + 20;
      const badgeY = summaryY + 12;
      drawRectangle(badgeX, badgeY, badgeWidth, 18, resultColor);
      drawRectangle(badgeX, badgeY + 15, badgeWidth, 3, colors.gold);
      
      drawText(resultText, badgeX + 8, badgeY + 8, {
        bold: true,
        size: 9,
        color: colors.white
      });

      // Professional certification seal
      const sealX = margin + contentWidth - 60;
      const sealY = summaryY + 15;
      drawRectangle(sealX, sealY, 50, 50, colors.gold);
      drawText('CERT', sealX + 12, sealY + 30, {
        bold: true,
        size: 10,
        color: colors.white
      });
      drawText(`${percentage}%`, sealX + 15, sealY + 18, {
        bold: true,
        size: 8,
        color: colors.white
      });

      yPosition = summaryY - 25;
    };

    // Premium competency assessment documentation
    const drawCompetencyAssessments = () => {
      checkPageSpace(50);
      
      // Sophisticated section title with premium styling
      drawRectangle(margin, yPosition - 5, contentWidth, 35, colors.primary);
      drawRectangle(margin, yPosition - 8, contentWidth, 3, colors.gold);
      
      drawText('🏆 COMPREHENSIVE CLINICAL COMPETENCY EVALUATION', margin + 15, yPosition + 10, {
        bold: true,
        size: 15,
        color: colors.white
      });
      
      drawText('Advanced Skills Assessment & Professional Development Matrix', margin + 15, yPosition - 8, {
        size: 10,
        color: colors.platinum
      });
      
      yPosition -= 45;

      // Group responses by section with enhanced organization
      const sections = data.responses.reduce((acc, response) => {
        const section = response.section || 'Core Clinical Competencies';
        if (!acc[section]) acc[section] = [];
        acc[section].push(response);
        return acc;
      }, {} as Record<string, CompetencyResponse[]>);

      Object.entries(sections).forEach(([sectionName, responses]) => {
        checkPageSpace(50);
        
        // Luxury section header with professional gradient effect
        drawRectangle(margin + 2, yPosition - 27, contentWidth, 25, colors.shadow);
        drawRectangle(margin, yPosition - 25, contentWidth, 25, colors.secondary);
        drawRectangle(margin, yPosition - 5, contentWidth, 3, colors.gold);
        
        drawText(`⭐ ${sectionName.toUpperCase()}`, margin + 15, yPosition - 15, {
          color: colors.white,
          size: 12,
          bold: true
        });
        
        // Section competency count
        const sectionCompetent = responses.filter(r => r.answer === 'yes').length;
        drawText(`${sectionCompetent}/${responses.length} Competencies Achieved`, 
          margin + contentWidth - 200, yPosition - 15, {
            color: colors.platinum,
            size: 10,
            bold: true
          });
        
        yPosition -= 35;

        responses.forEach((response, index) => {
          // Calculate required height for this premium item
          const questionLines = wrapText(response.question, contentWidth - 120, regularFont, 11);
          const examplesText = response.helpText || 'Clinical observation and professional assessment';
          const exampleLines = wrapText(examplesText, contentWidth - 120, regularFont, 9);
          const commentLines = response.comment ? wrapText(response.comment, contentWidth - 140, regularFont, 10) : [];
          
          const requiredHeight = 35 + // base height with premium spacing
            (questionLines.length * 14) + // question text with improved spacing
            (exampleLines.length * 11) + 8 + // examples text + spacing
            25 + // assessment section
            (commentLines.length * 12) + 20; // comments + luxury spacing
          
          checkPageSpace(requiredHeight);
          
          const itemY = yPosition - requiredHeight;
          
          // Premium competency card design
          const bgColor = response.answer === 'yes' ? rgb(0.94, 0.99, 0.94) : 
                         response.answer === 'not-yet' ? rgb(1, 0.96, 0.93) : 
                         rgb(0.97, 0.97, 0.99);
          
          // Card with shadow and elegant border
          drawRectangle(margin + 2, itemY - 2, contentWidth, requiredHeight, colors.shadow);
          drawRectangle(margin, itemY, contentWidth, requiredHeight, bgColor);
          
          // Premium status indicator with sophisticated styling
          const statusIcon = response.answer === 'yes' ? '🏆' : 
                           response.answer === 'not-yet' ? '⏳' : '📋';
          const statusColor = response.answer === 'yes' ? colors.success : 
                            response.answer === 'not-yet' ? colors.warning : 
                            colors.textLight;
          
          // Professional status badge
          const badgeWidth = 120;
          const badgeX = margin + contentWidth - badgeWidth - 10;
          const badgeY = itemY + requiredHeight - 20;
          
          drawRectangle(badgeX, badgeY, badgeWidth, 15, statusColor);
          drawRectangle(badgeX, badgeY + 12, badgeWidth, 3, colors.gold);
          
          const statusText = response.answer === 'yes' ? 'COMPETENT ✓' : 
                            response.answer === 'not-yet' ? 'IN PROGRESS' : 
                            'PENDING REVIEW';
          
          drawText(statusText, badgeX + 8, badgeY + 7, {
            size: 8,
            bold: true,
            color: colors.white
          });
          
          let currentY = itemY + requiredHeight - 15;
          
          // Premium competency number indicator
          drawRectangle(margin + 8, currentY - 5, 25, 15, colors.primary);
          drawText(`${index + 1}`, margin + 18, currentY + 2, { 
            size: 9, 
            bold: true, 
            color: colors.white 
          });
          
          // Professional question styling
          questionLines.forEach((line, lineIndex) => {
            drawText(line, margin + 45, currentY - (lineIndex * 14), {
              size: 11,
              bold: true,
              color: colors.text
            });
          });
          
          // Move Y position after question
          currentY -= (questionLines.length * 14) + 10;
          
          // Evidence methodology with elegant styling
          if (examplesText) {
            drawText('Assessment Method:', margin + 45, currentY, {
              size: 9,
              bold: true,
              color: colors.primary
            });
            currentY -= 12;
            
            exampleLines.forEach((line, lineIndex) => {
              drawText(`• ${line}`, margin + 50, currentY - (lineIndex * 11), {
                size: 9,
                color: colors.textLight,
                bold: false
              });
            });
            currentY -= (exampleLines.length * 11) + 10;
          }
          
          // Professional assessment result
          drawText('Clinical Assessment Result:', margin + 45, currentY, {
            size: 10,
            bold: true,
            color: colors.primary
          });
          
          const resultText = response.answer === 'yes' ? 'Competency Achieved - Professional Standard Met' : 
                            response.answer === 'not-yet' ? 'Development Required - Additional Support Needed' : 
                            'Assessment Pending - Review Required';
          
          drawText(resultText, margin + 200, currentY, {
            size: 10,
            color: statusColor,
            bold: true
          });
          
          currentY -= 18;
          
          // Professional comments section
          if (response.comment) {
            drawText('Clinical Notes & Observations:', margin + 45, currentY, {
              size: 10,
              bold: true,
              color: colors.primary
            });
            currentY -= 12;
            
            commentLines.forEach((line, lineIndex) => {
              drawText(line, margin + 50, currentY - (lineIndex * 12), {
                size: 10,
                color: colors.text
              });
            });
          }
          
          yPosition = itemY - 15;
        });
        
        yPosition -= 10;
      });
    };

    // Premium signature and certification section
    const drawSignatureSection = () => {
      checkPageSpace(120);
      
      const signatureResponse = data.responses.find(r => r.question.toLowerCase().includes('signature'));
      
      if (signatureResponse || data.signature) {
        // Elegant certification card
        const certHeight = 100;
        const certY = yPosition - certHeight;
        
        drawRectangle(margin + 2, certY - 2, contentWidth, certHeight, colors.shadow);
        drawRectangle(margin, certY, contentWidth, certHeight, colors.white);
        
        // Premium header with gold accents
        drawRectangle(margin, certY + certHeight - 25, contentWidth, 25, colors.primary);
        drawRectangle(margin, certY + certHeight - 5, contentWidth, 5, colors.gold);
        
        drawText('🏅 PROFESSIONAL CERTIFICATION & ACKNOWLEDGMENT', margin + 15, certY + certHeight - 15, {
          bold: true,
          size: 13,
          color: colors.white
        });
        
        // Professional signature section
        drawText('Healthcare Professional Signature:', margin + 20, certY + 55, {
          bold: true,
          size: 11,
          color: colors.text
        });
        
        const signature = data.signature || signatureResponse?.comment || '';
        drawText(signature || '[Digital Signature Applied]', margin + 220, certY + 55, {
          size: 12,
          color: colors.primary,
          bold: true
        });
        
        drawText('Certification Date:', margin + 20, certY + 35, {
          bold: true,
          size: 11,
          color: colors.text
        });
        drawText(format(new Date(data.completedAt), 'MMM dd, yyyy HH:mm'), margin + 150, certY + 35, {
          size: 11,
          color: colors.primary
        });
        
        // Elegant signature line with premium styling
        page.drawLine({
          start: { x: margin + 220, y: certY + 50 },
          end: { x: margin + 450, y: certY + 50 },
          thickness: 1.5,
          color: colors.gold
        });
        
        // Professional verification statement
        drawText('This document certifies the successful completion of medication competency assessment', 
          margin + 20, certY + 15, {
            size: 9,
            color: colors.textLight
          });
        drawText('as per healthcare professional standards and regulatory requirements.', 
          margin + 20, certY + 5, {
            size: 9,
            color: colors.textLight
          });
        
        // Professional certification seal
        drawRectangle(margin + contentWidth - 70, certY + 25, 60, 60, colors.gold);
        drawText('VERIFIED', margin + contentWidth - 65, certY + 60, {
          bold: true,
          size: 9,
          color: colors.white
        });
        drawText('COMPETENCY', margin + contentWidth - 68, certY + 45, {
          bold: true,
          size: 8,
          color: colors.white
        });
        drawText('CERT', margin + contentWidth - 55, certY + 32, {
          bold: true,
          size: 9,
          color: colors.white
        });
        
        yPosition = certY - 20;
      }
    };

    // Premium footer with professional branding
    const drawFooter = () => {
      const footerY = 35;
      
      // Sophisticated footer with gradient effect
      drawRectangle(0, 0, pageWidth, footerY, colors.primary);
      drawRectangle(0, footerY - 3, pageWidth, 3, colors.gold);
      
      // Professional confidentiality statement
      drawText('🔒 CONFIDENTIAL HEALTHCARE DOCUMENT', margin, 22, {
        color: colors.gold,
        size: 9,
        bold: true
      });
      
      drawText('Generated by Advanced Compliance Management System • Professional Healthcare Certification', 
        margin, 12, {
          color: colors.platinum,
          size: 8
        });
      
      // Page information with elegant styling
      drawText(`Certificate Page ${pdfDoc.getPageCount()}`, pageWidth - 150, 22, {
        color: colors.white,
        size: 9,
        bold: true
      });
      
      drawText(`Issued: ${format(new Date(), 'PPP')}`, pageWidth - 200, 12, {
        color: colors.platinum,
        size: 8
      });
      
      // Security verification mark
      drawText('✓ VERIFIED', pageWidth - 80, 7, {
        color: colors.gold,
        size: 7,
        bold: true
      });
    };

    // Generate the PDF content
    drawModernHeader();
    drawEmployeeCard();
    drawCompetencySummary();
    drawCompetencyAssessments();
    drawSignatureSection();
    
    // Add footer to all pages
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      page = pdfDoc.getPage(i);
      drawFooter();
    }

    // Save and download the PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `medication-competency-${data.employeeName.replace(/\s+/g, '-')}-${data.periodIdentifier}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating medication competency PDF:', error);
    throw error;
  }
}