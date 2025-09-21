// PDF Design System and Shared Utilities
import jsPDF from 'jspdf';

export interface CompanySettings {
  name: string;
  logo?: string;
}

export interface PDFStyles {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    lightGray: string;
    border: string;
  };
  fonts: {
    heading: { size: number; weight: string };
    subheading: { size: number; weight: string };
    body: { size: number; weight: string };
    small: { size: number; weight: string };
  };
  spacing: {
    margin: number;
    padding: number;
    lineHeight: number;
    sectionSpacing: number;
  };
}

export const defaultStyles: PDFStyles = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f1f5f9',
    text: '#1e293b',
    lightGray: '#f8fafc',
    border: '#e2e8f0'
  },
  fonts: {
    heading: { size: 16, weight: 'bold' },
    subheading: { size: 13, weight: 'bold' },
    body: { size: 10, weight: 'normal' },
    small: { size: 9, weight: 'normal' }
  },
  spacing: {
    margin: 20,
    padding: 15,
    lineHeight: 6,
    sectionSpacing: 12
  }
};

export class PDFBuilder {
  private pdf: jsPDF;
  private styles: PDFStyles;
  private yPosition: number;
  private pageWidth: number;
  private pageHeight: number;

  constructor(styles: PDFStyles = defaultStyles) {
    this.pdf = new jsPDF();
    this.styles = styles;
    this.yPosition = this.styles.spacing.margin;
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
    this.setupPage();
  }

  private setupPage() {
    this.pdf.setFont('helvetica', 'normal');
    this.addPageBorder();
  }

  private addPageBorder() {
    // Elegant gradient-style border
    this.pdf.setDrawColor(226, 232, 240);
    this.pdf.setLineWidth(2);
    this.pdf.roundedRect(
      this.styles.spacing.margin / 2, 
      this.styles.spacing.margin / 2, 
      this.pageWidth - this.styles.spacing.margin, 
      this.pageHeight - this.styles.spacing.margin, 
      3, 3
    );
    
    // Inner accent line
    this.pdf.setDrawColor(37, 99, 235);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(
      this.styles.spacing.margin, 
      this.styles.spacing.margin + 5, 
      this.pageWidth - this.styles.spacing.margin, 
      this.styles.spacing.margin + 5
    );
  }

  private ensureSpace(needed: number): void {
    if (this.yPosition + needed > this.pageHeight - this.styles.spacing.margin - 10) {
      this.pdf.addPage();
      this.addPageBorder();
      this.yPosition = this.styles.spacing.margin + 10;
    }
  }

  async addLogo(logoUrl: string, companyName: string): Promise<void> {
    if (!logoUrl) {
      this.addCompanyHeader(companyName);
      return;
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = logoUrl;
      });

      const maxWidth = 60;
      const maxHeight = 30;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const logoWidth = img.width * scale;
      const logoHeight = img.height * scale;
      const logoX = (this.pageWidth / 2) - (logoWidth / 2);

      const format = logoUrl.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
      this.pdf.addImage(logoUrl, format, logoX, this.yPosition, logoWidth, logoHeight);
      this.yPosition += logoHeight + 8;
    } catch (error) {
      console.error('Error adding logo:', error);
    }

    this.addCompanyHeader(companyName);
  }

  private addCompanyHeader(companyName: string): void {
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(this.styles.fonts.heading.size);
    this.pdf.setTextColor(37, 99, 235);
    this.pdf.text(companyName, this.pageWidth / 2, this.yPosition, { align: 'center' });
    this.yPosition += this.styles.spacing.sectionSpacing;
  }

  addTitle(title: string): void {
    this.ensureSpace(25);
    
    this.pdf.setFillColor(241, 245, 249);
    this.pdf.roundedRect(
      this.styles.spacing.margin, 
      this.yPosition - 8, 
      this.pageWidth - (2 * this.styles.spacing.margin), 
      18, 
      2, 2, 'F'
    );
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(this.styles.fonts.heading.size);
    this.pdf.setTextColor(30, 41, 59);
    this.pdf.text(title, this.pageWidth / 2, this.yPosition + 3, { align: 'center' });
    this.yPosition += 25;
  }

  addInfoSection(title: string, items: Array<{label: string; value: string}>): void {
    this.ensureSpace(40);
    
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.roundedRect(
      this.styles.spacing.margin - 5, 
      this.yPosition - 5, 
      this.pageWidth - (2 * this.styles.spacing.margin) + 10, 
      15, 
      2, 2, 'F'
    );
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(this.styles.fonts.subheading.size);
    this.pdf.setTextColor(37, 99, 235);
    this.pdf.text(title, this.styles.spacing.margin, this.yPosition + 3);
    this.yPosition += 20;
    
    items.forEach(item => {
      this.ensureSpace(8);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(this.styles.fonts.body.size);
      this.pdf.setTextColor(100, 116, 139);
      
      const labelWidth = this.pdf.getTextWidth(item.label + ':');
      this.pdf.text(item.label + ':', this.styles.spacing.margin, this.yPosition);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(30, 41, 59);
      this.pdf.text(item.value, this.styles.spacing.margin + labelWidth + 5, this.yPosition);
      
      this.yPosition += this.styles.spacing.lineHeight + 2;
    });
    
    this.yPosition += this.styles.spacing.sectionSpacing;
  }

  addCheckboxGrid(title: string, options: Array<{label: string; checked: boolean}>): void {
    this.ensureSpace(60);
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(this.styles.fonts.subheading.size);
    this.pdf.setTextColor(30, 41, 59);
    this.pdf.text(title, this.styles.spacing.margin, this.yPosition);
    this.yPosition += this.styles.spacing.sectionSpacing;
    
    const columnWidth = (this.pageWidth - (2 * this.styles.spacing.margin)) / 2;
    
    for (let i = 0; i < options.length; i += 2) {
      this.ensureSpace(10);
      
      const leftOption = options[i];
      this.addCheckboxItem(leftOption.label, leftOption.checked, this.styles.spacing.margin);
      
      if (i + 1 < options.length) {
        const rightOption = options[i + 1];
        this.addCheckboxItem(rightOption.label, rightOption.checked, this.styles.spacing.margin + columnWidth);
      }
      
      this.yPosition += this.styles.spacing.lineHeight + 2;
    }
    
    this.yPosition += this.styles.spacing.sectionSpacing;
  }

  private addCheckboxItem(label: string, checked: boolean, x: number): void {
    this.pdf.setDrawColor(226, 232, 240);
    this.pdf.setLineWidth(0.5);
    this.pdf.roundedRect(x, this.yPosition - 3, 4, 4, 0.5, 0.5);
    
    if (checked) {
      this.pdf.setFillColor(37, 99, 235);
      this.pdf.roundedRect(x + 0.5, this.yPosition - 2.5, 3, 3, 0.5, 0.5, 'F');
    }
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(this.styles.fonts.body.size);
    this.pdf.setTextColor(30, 41, 59);
    this.pdf.text(label, x + 8, this.yPosition);
  }

  addTextArea(title: string, content: string): void {
    this.ensureSpace(30);
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(this.styles.fonts.subheading.size);
    this.pdf.setTextColor(30, 41, 59);
    this.pdf.text(title, this.styles.spacing.margin, this.yPosition);
    this.yPosition += this.styles.spacing.lineHeight + 3;
    
    const textHeight = Math.max(20, this.pdf.splitTextToSize(content, this.pageWidth - (2 * this.styles.spacing.margin) - 10).length * this.styles.spacing.lineHeight + 10);
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.roundedRect(
      this.styles.spacing.margin, 
      this.yPosition - 5, 
      this.pageWidth - (2 * this.styles.spacing.margin), 
      textHeight, 
      2, 2, 'F'
    );
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(this.styles.fonts.body.size);
    this.pdf.setTextColor(30, 41, 59);
    
    const lines = this.pdf.splitTextToSize(content, this.pageWidth - (2 * this.styles.spacing.margin) - 10);
    this.pdf.text(lines, this.styles.spacing.margin + 5, this.yPosition);
    this.yPosition += textHeight + this.styles.spacing.sectionSpacing;
  }

  addDeclaration(): void {
    this.ensureSpace(50);
    
    this.pdf.setDrawColor(37, 99, 235);
    this.pdf.setLineWidth(1);
    this.pdf.roundedRect(
      this.styles.spacing.margin, 
      this.yPosition - 10, 
      this.pageWidth - (2 * this.styles.spacing.margin), 
      40, 
      3, 3
    );
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(this.styles.fonts.subheading.size);
    this.pdf.setTextColor(37, 99, 235);
    this.pdf.text('DECLARATION', this.styles.spacing.margin + 10, this.yPosition - 2);
    this.yPosition += 8;
    
    const declarationText = 'I certify that, to the best of my knowledge, the information I have given is true and complete. I understand that any deliberate omission, falsification or misrepresentation may lead to refusal of appointment or dismissal.';
    
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(this.styles.fonts.body.size);
    this.pdf.setTextColor(30, 41, 59);
    
    const lines = this.pdf.splitTextToSize(declarationText, this.pageWidth - (2 * this.styles.spacing.margin) - 20);
    this.pdf.text(lines, this.styles.spacing.margin + 10, this.yPosition);
    this.yPosition += 45;
  }

  addFooter(footerData: Array<{label: string; value: string}>): void {
    this.ensureSpace(60);
    
    this.pdf.setFillColor(248, 250, 252);
    this.pdf.roundedRect(
      this.styles.spacing.margin, 
      this.yPosition - 5, 
      this.pageWidth - (2 * this.styles.spacing.margin), 
      50, 
      2, 2, 'F'
    );
    
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(this.styles.fonts.subheading.size);
    this.pdf.setTextColor(37, 99, 235);
    this.pdf.text('REFERENCE INFORMATION', this.styles.spacing.margin + 10, this.yPosition + 5);
    this.yPosition += 15;
    
    footerData.forEach(item => {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(this.styles.fonts.body.size);
      this.pdf.setTextColor(100, 116, 139);
      
      const labelWidth = this.pdf.getTextWidth(item.label + ':');
      this.pdf.text(item.label + ':', this.styles.spacing.margin + 10, this.yPosition);
      
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(30, 41, 59);
      this.pdf.text(item.value, this.styles.spacing.margin + 10 + labelWidth + 5, this.yPosition);
      
      this.yPosition += this.styles.spacing.lineHeight + 1;
    });
    
    this.yPosition += 10;
  }

  getPDF(): jsPDF {
    return this.pdf;
  }
}