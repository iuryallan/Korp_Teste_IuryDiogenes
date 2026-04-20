import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { BillingService } from '../../services/billing';
import { Invoice } from '../../models/invoice.model';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatSnackBarModule, MatDialogModule],
  templateUrl: './invoices.html',
  styleUrl: './invoices.scss',
})

export class Invoices implements OnInit {
  invoices: Invoice[] = [];
  columns = ['number', 'status', 'items', 'actions'];
  printingId: number | null = null;
  summary: string = '';
  loadingSummary: boolean = false;

  constructor(
    private billingService: BillingService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadInvoices();
  }

  loadInvoices() {
    this.billingService.getInvoices().subscribe({
      next: (data) => {
        this.invoices = data;
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erro ao carregar notas', 'Fechar', { duration: 3000 }),
    });
  }

  edit(invoice: Invoice) {
    this.router.navigate(['/invoices', invoice.ID, 'edit']);
  }

  confirmDelete(invoice: Invoice) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: `Excluir nota #${invoice.number}? Esta ação não pode ser desfeita.` },
      panelClass: 'dark-dialog',
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.deleteInvoice(invoice);
    });
  }

  deleteInvoice(invoice: Invoice) {
    this.billingService.deleteInvoice(invoice.ID).subscribe({
      next: () => {
        this.snackBar.open(`Nota #${invoice.number} excluída.`, 'Fechar', { duration: 3000 });
        this.loadInvoices();
      },
      error: () => this.snackBar.open('Erro ao excluir nota', 'Fechar', { duration: 3000 }),
    });
  }

  print(invoice: Invoice) {
    this.printingId = invoice.ID;
    this.billingService.printInvoice(invoice.ID).subscribe({
      next: (closed) => {
        this.printingId = null;
        this.generatePDF(closed);
        this.loadInvoices();
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Erro ao imprimir', 'Fechar', { duration: 4000 });
        this.printingId = null;
        this.cdr.detectChanges();
      },
    });
  }

  generateSummary() {
    this.loadingSummary = true;
    this.summary = '';
    this.billingService.getSummary().subscribe({
      next: (data) => {
        this.summary = data.summary;
        this.loadingSummary = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Erro ao gerar resumo', 'Fechar', { duration: 3000 });
        this.loadingSummary = false;
      },
    });
  }

  generatePDF(invoice: Invoice) {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Nota Fiscal', margin, y);

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`Emitida em ${new Date().toLocaleDateString('pt-BR')}`, margin, y);

    y += 8;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, 210 - margin, y);

    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Informações', margin, y);

    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Número:`, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`#${invoice.number}`, margin + 30, y);

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Status:`, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.text('Fechada', margin + 30, y);

    y += 10;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, 210 - margin, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Produtos', margin, y);

    y += 8;
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 5, 170, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Código', margin + 2, y);
    doc.text('Descrição', margin + 30, y);
    doc.text('Qtd', margin + 150, y);

    doc.setTextColor(0, 0, 0);
    invoice.items.forEach((item, index) => {
      y += 10;
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, y - 5, 170, 8, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(item.product_code, margin + 2, y);
      doc.text(item.product_description, margin + 30, y);
      doc.text(`${item.quantity}x`, margin + 150, y);
    });

    // Rodapé
    y += 16;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, 210 - margin, y);
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Documento gerado automaticamente pelo sistema Korp NF.', margin, y);

    doc.save(`nota-fiscal-${invoice.number}.pdf`);
  }
}
