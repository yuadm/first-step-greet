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

    // Color palette - modern medical theme
    const colors = {
      primary: rgb(0.2, 0.4, 0.7),      // Medical blue
      secondary: rgb(0.1, 0.6, 0.4),     // Medical green
      accent: rgb(0.8, 0.2, 0.2),        // Alert red
      text: rgb(0.2, 0.2, 0.2),          // Dark gray
      textLight: rgb(0.5, 0.5, 0.5),     // Medium gray
      background: rgb(0.97, 0.98, 0.99), // Light blue-gray
      success: rgb(0.2, 0.7, 0.3),       // Success green
      warning: rgb(0.9, 0.6, 0.1),       // Warning orange
      border: rgb(0.85, 0.85, 0.85),     // Light border
      white: rgb(1, 1, 1)
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

    // Modern header with gradient effect simulation
    const drawModernHeader = () => {
      // Header background with gradient effect (simulated with multiple rectangles)
      for (let i = 0; i < 8; i++) {
        const intensity = 0.2 + (i * 0.1);
        drawRectangle(0, yPosition - 140 + (i * 4), pageWidth, 4, rgb(intensity * 0.2, intensity * 0.4, intensity * 0.7));
      }

      // Main header background
      drawRectangle(0, yPosition - 140, pageWidth, 140, colors.primary);

      // Company logo and info
      if (logoImage) {
        const logoSize = 50;
        page.drawImage(logoImage, {
          x: margin,
          y: yPosition - 80,
          width: logoSize * 2,
          height: logoSize,
        });
      }

      // Company name
      if (company?.name) {
        drawText(company.name, margin + (logoImage ? 120 : 0), yPosition - 30, {
          color: colors.white,
          size: 14,
          bold: true
        });
      }

      // Main title
      drawText('MEDICATION COMPETENCY ASSESSMENT', margin, yPosition - 65, {
        color: colors.white,
        size: 20,
        bold: true
      });

      // Subtitle
      drawText('Professional Healthcare Certification', margin, yPosition - 85, {
        color: rgb(0.9, 0.9, 0.9),
        size: 11
      });

      // Assessment info box
      const infoBoxY = yPosition - 130;
      drawRectangle(pageWidth - 220, infoBoxY, 180, 35, rgb(0.9, 0.9, 1.0));
      
      drawText('Assessment ID:', pageWidth - 210, infoBoxY + 20, {
        color: colors.text,
        size: 8,
        bold: true
      });
      drawText(data.periodIdentifier, pageWidth - 130, infoBoxY + 20, {
        color: colors.text,
        size: 8
      });
      
      drawText('Generated:', pageWidth - 210, infoBoxY + 8, {
        color: colors.text,
        size: 8,
        bold: true
      });
      drawText(format(new Date(), 'MMM dd, yyyy'), pageWidth - 130, infoBoxY + 8, {
        color: colors.text,
        size: 8
      });

      yPosition -= 160;
    };

    // Employee information card
    const drawEmployeeCard = () => {
      checkPageSpace(120);
      
      const cardHeight = 100;
      const cardY = yPosition - cardHeight;
      
      // Card background
      drawRectangle(margin, cardY, contentWidth, cardHeight, colors.background);
      
      // Card header
      drawRectangle(margin, cardY + cardHeight - 25, contentWidth, 25, colors.secondary);
      drawText('👤 EMPLOYEE INFORMATION', margin + 15, cardY + cardHeight - 17, {
        color: colors.white,
        size: 12,
        bold: true
      });

      // Employee details
      const detailsY = cardY + cardHeight - 45;
      drawText('Name:', margin + 20, detailsY, { bold: true, size: 11 });
      drawText(data.employeeName, margin + 100, detailsY, { size: 11, color: colors.primary });
      
      drawText('Assessment Date:', margin + 20, detailsY - 18, { bold: true, size: 11 });
      drawText(data.assessmentDate, margin + 150, detailsY - 18, { size: 11 });
      
      if (data.supervisor) {
        drawText('Supervisor:', margin + 20, detailsY - 36, { bold: true, size: 11 });
        drawText(data.supervisor, margin + 100, detailsY - 36, { size: 11 });
      }
      
      if (data.branch) {
        drawText('Branch:', margin + 300, detailsY, { bold: true, size: 11 });
        drawText(data.branch, margin + 350, detailsY, { size: 11 });
      }
      
      drawText('Completed:', margin + 300, detailsY - 18, { bold: true, size: 11 });
      drawText(format(new Date(data.completedAt), 'MMM dd, yyyy HH:mm'), margin + 370, detailsY - 18, { size: 11 });

      yPosition = cardY - 20;
    };

    // Competency results summary
    const drawCompetencySummary = () => {
      checkPageSpace(80);
      
      const competentCount = data.responses.filter(r => r.answer === 'yes').length;
      const totalCount = data.responses.length;
      const percentage = Math.round((competentCount / totalCount) * 100);
      
      // Summary card
      const summaryHeight = 60;
      const summaryY = yPosition - summaryHeight;
      
      drawRectangle(margin, summaryY, contentWidth, summaryHeight, colors.background);
      
      // Progress indicator
      const progressWidth = 300;
      const progressHeight = 8;
      const progressX = margin + 20;
      const progressY = summaryY + 25;
      
      // Progress background
      drawRectangle(progressX, progressY, progressWidth, progressHeight, rgb(0.9, 0.9, 0.9));
      
      // Progress fill
      const fillWidth = (progressWidth * percentage) / 100;
      const progressColor = percentage >= 80 ? colors.success : percentage >= 60 ? colors.warning : colors.accent;
      drawRectangle(progressX, progressY, fillWidth, progressHeight, progressColor);
      
      // Summary text
      drawText('📊 COMPETENCY SUMMARY', margin + 20, summaryY + 45, {
        bold: true,
        size: 12,
        color: colors.primary
      });
      
      drawText(`${competentCount}/${totalCount} competencies demonstrated (${percentage}%)`, 
        progressX + progressWidth + 20, summaryY + 45, { size: 11 });
      
      // Overall result
      const resultText = percentage >= 80 ? 'COMPETENT' : percentage >= 60 ? 'REQUIRES REVIEW' : 'ADDITIONAL TRAINING REQUIRED';
      const resultColor = percentage >= 80 ? colors.success : percentage >= 60 ? colors.warning : colors.accent;
      
      drawText(resultText, margin + 20, summaryY + 10, {
        bold: true,
        size: 10,
        color: resultColor
      });

      yPosition = summaryY - 20;
    };

    // Individual competency assessments
    const drawCompetencyAssessments = () => {
      checkPageSpace(40);
      
      drawText('🎯 DETAILED COMPETENCY ASSESSMENT', margin, yPosition, {
        bold: true,
        size: 14,
        color: colors.primary
      });
      yPosition -= 25;

      // Group responses by section
      const sections = data.responses.reduce((acc, response) => {
        const section = response.section || 'General';
        if (!acc[section]) acc[section] = [];
        acc[section].push(response);
        return acc;
      }, {} as Record<string, CompetencyResponse[]>);

      Object.entries(sections).forEach(([sectionName, responses]) => {
        checkPageSpace(40);
        
        // Section header
        drawRectangle(margin, yPosition - 20, contentWidth, 20, colors.secondary);
        drawText(sectionName.toUpperCase(), margin + 10, yPosition - 13, {
          color: colors.white,
          size: 10,
          bold: true
        });
        yPosition -= 30;

        responses.forEach((response, index) => {
          // Calculate required height for this item
          const questionLines = wrapText(response.question, contentWidth - 100, regularFont, 10);
          const examplesText = response.helpText || 'Direct observation / discussion';
          const exampleLines = wrapText(examplesText, contentWidth - 100, regularFont, 8);
          const commentLines = response.comment ? wrapText(response.comment, contentWidth - 120, regularFont, 9) : [];
          
          const requiredHeight = 25 + // base height
            (questionLines.length * 12) + // question text
            (exampleLines.length * 10) + 5 + // examples text + spacing
            20 + // assessment label + answer
            (commentLines.length * 11) + 15; // comments + spacing
          
          checkPageSpace(requiredHeight);
          
          const itemY = yPosition - requiredHeight;
          
          // Competency item background
          const bgColor = response.answer === 'yes' ? rgb(0.95, 1, 0.95) : 
                         response.answer === 'not-yet' ? rgb(1, 0.97, 0.95) : 
                         rgb(0.98, 0.98, 0.98);
          
          drawRectangle(margin, itemY, contentWidth, requiredHeight, bgColor);
          
          // Status indicator
          const statusIcon = response.answer === 'yes' ? '✅' : 
                           response.answer === 'not-yet' ? '⚠️' : '❓';
          const statusColor = response.answer === 'yes' ? colors.success : 
                            response.answer === 'not-yet' ? colors.warning : 
                            colors.textLight;
          
          let currentY = itemY + requiredHeight - 10;
          
          drawText(statusIcon, margin + 10, currentY, { size: 12 });
          
          // Question text
          questionLines.forEach((line, lineIndex) => {
            drawText(line, margin + 30, currentY - (lineIndex * 12), {
              size: 10,
              bold: true,
              color: colors.text
            });
          });
          
          // Move Y position after question
          currentY -= (questionLines.length * 12) + 5;
          
          // Examples/Evidence text
          if (examplesText) {
            exampleLines.forEach((line, lineIndex) => {
              drawText(line, margin + 30, currentY - (lineIndex * 10), {
                size: 8,
                color: colors.textLight,
                bold: false
              });
            });
            currentY -= (exampleLines.length * 10) + 8;
          }
          
          // Assessment label and answer
          drawText('Assessment:', margin + 30, currentY, {
            size: 9,
            bold: true,
            color: colors.textLight
          });
          
          drawText(response.answer === 'yes' ? 'Competent' : 
                  response.answer === 'not-yet' ? 'Not Yet Competent' : 
                  'Not Assessed', margin + 100, currentY, {
            size: 9,
            color: statusColor,
            bold: true
          });
          
          currentY -= 14;
          
          // Comments
          if (response.comment) {
            drawText('Comments:', margin + 30, currentY, {
              size: 9,
              bold: true,
              color: colors.textLight
            });
            commentLines.forEach((line, lineIndex) => {
              drawText(line, margin + 100, currentY - (lineIndex * 11), {
                size: 9,
                color: colors.text
              });
            });
          }
          
          yPosition = itemY - 10;
        });
        
        yPosition -= 10;
      });
    };

    // Signature section
    const drawSignatureSection = () => {
      checkPageSpace(100);
      
      const signatureResponse = data.responses.find(r => r.question.toLowerCase().includes('signature'));
      
      if (signatureResponse || data.signature) {
        drawRectangle(margin, yPosition - 80, contentWidth, 80, colors.background);
        
        drawText('✍️ EMPLOYEE ACKNOWLEDGMENT', margin + 15, yPosition - 20, {
          bold: true,
          size: 12,
          color: colors.primary
        });
        
        drawText('Employee Signature:', margin + 15, yPosition - 45, {
          bold: true,
          size: 10
        });
        
        const signature = data.signature || signatureResponse?.comment || '';
        drawText(signature, margin + 130, yPosition - 45, {
          size: 11,
          color: colors.primary,
          bold: true
        });
        
        drawText('Date:', margin + 350, yPosition - 45, {
          bold: true,
          size: 10
        });
        drawText(format(new Date(data.completedAt), 'MMM dd, yyyy'), margin + 385, yPosition - 45, {
          size: 11
        });
        
        // Signature line
        page.drawLine({
          start: { x: margin + 130, y: yPosition - 50 },
          end: { x: margin + 340, y: yPosition - 50 },
          thickness: 0.5,
          color: colors.border
        });
        
        yPosition -= 100;
      }
    };

    // Footer
    const drawFooter = () => {
      const footerY = 30;
      drawRectangle(0, 0, pageWidth, footerY, colors.primary);
      
      drawText('Confidential Medical Document - Generated by Compliance Management System', 
        margin, 18, {
          color: colors.white,
          size: 8
        });
      
      drawText(`Page ${pdfDoc.getPageCount()} • ${format(new Date(), 'PPP')}`, 
        pageWidth - 200, 18, {
          color: colors.white,
          size: 8
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