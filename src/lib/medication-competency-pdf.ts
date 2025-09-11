import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { format } from 'date-fns';

// Import the DejaVu fonts
import DejaVuSansRegular from '@/assets/fonts/dejavu/DejaVuSans.ttf';
import DejaVuSansBold from '@/assets/fonts/dejavu/DejaVuSans-Bold.ttf';

export interface MedicationCompetencyData {
  employeeId: string;
  employeeName: string;
  periodIdentifier: string;
  assessmentDate: string;
  questionnaire: {
    medicationKnowledge: string;
    safePractices: string;
    documentation: string;
    emergencyProcedures: string;
    errorReporting: string;
    patientRights: string;
    confidentiality: string;
    additionalComments?: string;
  };
  confirmed: boolean;
  completedAt: string;
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
    let yPosition = 800;
    
    const pageWidth = page.getWidth();
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);

    // Helper functions
    const drawText = (text: string, x: number, y: number, options: any = {}) => {
      page.drawText(text, {
        x,
        y,
        size: options.size || 12,
        font: options.bold ? boldFont : regularFont,
        color: options.color || rgb(0, 0, 0),
        maxWidth: options.maxWidth || contentWidth,
        lineHeight: options.lineHeight || options.size || 12,
        ...options
      });
    };

    const addSpacer = (height: number) => {
      yPosition -= height;
      if (yPosition < 100) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 800;
      }
    };

    const drawKeyValue = (key: string, value: string, valueMaxWidth = 400) => {
      drawText(`${key}:`, margin, yPosition, { bold: true, size: 11 });
      const wrappedValue = wrapText(value, valueMaxWidth, regularFont, 11);
      const lines = wrappedValue.split('\n');
      
      lines.forEach((line, index) => {
        drawText(line, margin + 150, yPosition - (index * 14), { size: 11 });
      });
      
      addSpacer(Math.max(20, lines.length * 14));
    };

    const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            lines.push(word);
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines.join('\n');
    };

    // Draw header
    const drawReportHeader = () => {
      // Logo
      if (logoImage) {
        const logoHeight = 60;
        const logoWidth = 120;
        page.drawImage(logoImage, {
          x: margin,
          y: yPosition - logoHeight,
          width: logoWidth,
          height: logoHeight,
        });
      }

      // Company name
      if (company?.name) {
        drawText(company.name, margin + (logoImage ? 130 : 0), yPosition - 20, {
          bold: true,
          size: 16,
          color: rgb(0.2, 0.2, 0.2)
        });
      }

      // Title
      drawText('MEDICATION COMPETENCY ASSESSMENT', margin, yPosition - 45, {
        bold: true,
        size: 18,
        color: rgb(0.1, 0.1, 0.1)
      });

      // Period and date
      drawText(`Assessment Period: ${data.periodIdentifier}`, margin, yPosition - 70, {
        size: 12,
        color: rgb(0.3, 0.3, 0.3)
      });

      addSpacer(90);
    };

    // Draw the header
    drawReportHeader();

    // Employee Information
    drawText('EMPLOYEE INFORMATION', margin, yPosition, { bold: true, size: 14 });
    addSpacer(20);

    drawKeyValue('Employee Name', data.employeeName);
    drawKeyValue('Assessment Date', data.assessmentDate);
    drawKeyValue('Completed At', format(new Date(data.completedAt), 'PPP p'));

    addSpacer(20);

    // Assessment Questions
    drawText('COMPETENCY ASSESSMENT', margin, yPosition, { bold: true, size: 14 });
    addSpacer(20);

    const questions = [
      { key: 'Medication Knowledge', value: data.questionnaire.medicationKnowledge },
      { key: 'Safe Practices', value: data.questionnaire.safePractices },
      { key: 'Documentation', value: data.questionnaire.documentation },
      { key: 'Emergency Procedures', value: data.questionnaire.emergencyProcedures },
      { key: 'Error Reporting', value: data.questionnaire.errorReporting },
      { key: 'Patient Rights', value: data.questionnaire.patientRights },
      { key: 'Confidentiality', value: data.questionnaire.confidentiality }
    ];

    questions.forEach((q) => {
      drawKeyValue(q.key, q.value);
    });

    if (data.questionnaire.additionalComments) {
      drawKeyValue('Additional Comments', data.questionnaire.additionalComments);
    }

    addSpacer(20);

    // Confirmation
    drawText('CONFIRMATION', margin, yPosition, { bold: true, size: 14 });
    addSpacer(20);

    const confirmationText = data.confirmed 
      ? '✓ Employee has confirmed understanding and agreement to comply with the Medication Assessment and Competency Procedure'
      : '✗ Employee has NOT confirmed understanding';

    drawText(confirmationText, margin, yPosition, { 
      size: 11,
      color: data.confirmed ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0)
    });

    addSpacer(30);

    // Footer
    drawText('This document was generated automatically on ' + format(new Date(), 'PPP p'), 
      margin, yPosition, { 
        size: 10, 
        color: rgb(0.5, 0.5, 0.5) 
      });

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