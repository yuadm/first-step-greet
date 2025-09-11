import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import DejaVuSansRegularUrl from '@/assets/fonts/dejavu/DejaVuSans.ttf'
import DejaVuSansBoldUrl from '@/assets/fonts/dejavu/DejaVuSans-Bold.ttf'
import { format } from 'date-fns'
import { supabase } from '@/integrations/supabase/client'

interface CompanyInfo {
  name?: string
  logo?: string
}

interface QuestionResponse {
  question_id: string
  response_value: string | null
  compliance_questions: {
    question_text: string
    question_type: string
  }
}

export async function generateQuestionnairePDF(
  complianceRecordId: string,
  employeeName: string,
  complianceTypeName: string,
  company?: CompanyInfo
) {
  try {
    // Fetch questionnaire response data
    const { data: responseData, error: responseError } = await supabase
      .from('compliance_questionnaire_responses')
      .select(`
        *,
        compliance_questionnaires(name, description)
      `)
      .eq('compliance_record_id', complianceRecordId)
      .single();

    if (responseError || !responseData) {
      throw new Error('Failed to fetch questionnaire response data');
    }

    // Fetch responses with questions
    const { data: responsesData, error: responsesError } = await supabase
      .from('compliance_responses')
      .select(`
        question_id,
        response_value
      `)
      .eq('questionnaire_response_id', responseData.id);

    if (responsesError) {
      throw new Error('Failed to fetch questionnaire responses');
    }

    // Fetch questions separately
    const questionIds = responsesData?.map(r => r.question_id) || [];
    const { data: questionsData, error: questionsError } = await supabase
      .from('compliance_questions')
      .select('id, question_text, question_type')
      .in('id', questionIds);

    if (questionsError) {
      throw new Error('Failed to fetch questions');
    }

    // Combine responses with questions
    const combinedData: QuestionResponse[] = (responsesData || []).map(response => {
      const question = questionsData?.find(q => q.id === response.question_id);
      return {
        question_id: response.question_id,
        response_value: response.response_value,
        compliance_questions: {
          question_text: question?.question_text || 'Unknown Question',
          question_type: question?.question_type || 'text'
        }
      };
    });

    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);

    // Load fonts
    const regularBytes = await fetch(DejaVuSansRegularUrl).then(r => r.arrayBuffer());
    const boldBytes = await fetch(DejaVuSansBoldUrl).then(r => r.arrayBuffer());
    const font = await doc.embedFont(new Uint8Array(regularBytes), { subset: true });
    const boldFont = await doc.embedFont(new Uint8Array(boldBytes), { subset: true });

    // Try to embed company logo
    let embeddedLogo: any | undefined;
    if (company?.logo) {
      try {
        const logoBytes = await fetch(company.logo).then(r => r.arrayBuffer());
        try {
          embeddedLogo = await doc.embedPng(logoBytes);
        } catch {
          embeddedLogo = await doc.embedJpg(logoBytes);
        }
      } catch {
        embeddedLogo = undefined;
      }
    }

    // Create page
    const page = doc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Layout constants
    const marginX = 48;
    const marginTop = 64;
    const lineHeight = 16;
    const contentWidth = width - marginX * 2;

    let yPosition = height - marginTop;

    // Header with logo and company info
    if (embeddedLogo) {
      const logoWidth = 60;
      const logoHeight = 40;
      page.drawImage(embeddedLogo, {
        x: marginX,
        y: yPosition - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      yPosition -= logoHeight + 10;
    }

    // Company name
    if (company?.name) {
      page.drawText(company.name, {
        x: marginX,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
    }

    // Title
    page.drawText('Compliance Questionnaire Response', {
      x: marginX,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 35;

    // Employee info
    page.drawText(`Employee: ${employeeName}`, {
      x: marginX,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;

    page.drawText(`Compliance Type: ${complianceTypeName}`, {
      x: marginX,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= lineHeight;

    page.drawText(`Completed: ${format(new Date(responseData.completed_at), 'dd/MM/yyyy HH:mm')}`, {
      x: marginX,
      y: yPosition,
      size: 12,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Questionnaire name
    if (responseData.compliance_questionnaires?.name) {
      page.drawText(`Questionnaire: ${responseData.compliance_questionnaires.name}`, {
        x: marginX,
        y: yPosition,
        size: 14,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
    }

    // Line separator
    page.drawLine({
      start: { x: marginX, y: yPosition },
      end: { x: width - marginX, y: yPosition },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    yPosition -= 20;

    // Questions and responses
    if (combinedData && combinedData.length > 0) {
      for (const response of combinedData) {
        // Check if we need a new page
        if (yPosition < 100) {
          const newPage = doc.addPage([595, 842]);
          yPosition = height - marginTop;
        }

        // Question text
        const questionText = response.compliance_questions.question_text;
        const wrappedQuestion = wrapText(questionText, font, 12, contentWidth - 20);
        
        page.drawText('Q:', {
          x: marginX,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0),
        });

        let questionY = yPosition;
        for (const line of wrappedQuestion) {
          page.drawText(line, {
            x: marginX + 15,
            y: questionY,
            size: 12,
            font: font,
            color: rgb(0, 0, 0),
          });
          questionY -= lineHeight;
        }
        yPosition = questionY - 5;

        // Response
        if (response.response_value) {
          try {
            const responseValue = JSON.parse(response.response_value);
            
            page.drawText('A:', {
              x: marginX,
              y: yPosition,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.4, 0.8),
            });

            const answerText = responseValue.answer || 'No answer provided';
            const wrappedAnswer = wrapText(answerText, font, 12, contentWidth - 20);
            
            let answerY = yPosition;
            for (const line of wrappedAnswer) {
              page.drawText(line, {
                x: marginX + 15,
                y: answerY,
                size: 12,
                font: font,
                color: rgb(0.2, 0.4, 0.8),
              });
              answerY -= lineHeight;
            }
            yPosition = answerY;

            // Comment if exists
            if (responseValue.comment) {
              yPosition -= 5;
              page.drawText('Comment:', {
                x: marginX + 15,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: rgb(0.5, 0.5, 0.5),
              });
              yPosition -= 15;

              const wrappedComment = wrapText(responseValue.comment, font, 10, contentWidth - 30);
              for (const line of wrappedComment) {
                page.drawText(line, {
                  x: marginX + 30,
                  y: yPosition,
                  size: 10,
                  font: font,
                  color: rgb(0.5, 0.5, 0.5),
                });
                yPosition -= 12;
              }
            }
          } catch (e) {
            // Fallback for non-JSON response values
            page.drawText('A:', {
              x: marginX,
              y: yPosition,
              size: 12,
              font: boldFont,
              color: rgb(0.2, 0.4, 0.8),
            });

            const wrappedAnswer = wrapText(response.response_value, font, 12, contentWidth - 20);
            let answerY = yPosition;
            for (const line of wrappedAnswer) {
              page.drawText(line, {
                x: marginX + 15,
                y: answerY,
                size: 12,
                font: font,
                color: rgb(0.2, 0.4, 0.8),
              });
              answerY -= lineHeight;
            }
            yPosition = answerY;
          }
        }

        yPosition -= 20; // Space between questions
      }
    }

    // Footer
    const footerY = 50;
    page.drawText(`Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, {
      x: marginX,
      y: footerY,
      size: 8,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Generate and download PDF
    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `questionnaire-response-${employeeName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error generating questionnaire PDF:', error);
    throw error;
  }
}

// Helper function to wrap text
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
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
        // Word is too long, force it on its own line
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}