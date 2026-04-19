import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BillingService, Invoice } from '../../services/billing';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatSnackBarModule],
  styles: [
    `
      .page-header {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        margin-bottom: 32px;
      }
      h1 {
        font-size: 22px;
        font-weight: 600;
      }
      .subtitle {
        font-size: 13px;
        color: var(--text-muted);
        margin-top: 4px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        font-family: 'DM Sans', sans-serif;
        cursor: pointer;
        border: none;
        text-decoration: none;
        transition: all 0.15s;
      }
      .btn-primary {
        background: var(--accent);
        color: #fff;
        &:hover {
          background: var(--accent-dim);
        }
      }

      .table-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
      }
      .table-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
      }
      .table-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-muted);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      table {
        width: 100%;
        table-layout: fixed;
      }
      col.col-num {
        width: 25%;
      }
      col.col-status {
        width: 25%;
      }
      col.col-items {
        width: 25%;
      }
      col.col-action {
        width: 25%;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }
      .badge-open {
        background: rgba(16, 185, 129, 0.1);
        color: var(--accent);
      }
      .badge-closed {
        background: rgba(107, 114, 128, 0.15);
        color: var(--text-muted);
      }
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
      .dot-open {
        background: var(--accent);
      }
      .dot-closed {
        background: var(--text-muted);
      }
      .num-cell {
        font-family: 'DM Mono', monospace;
        font-size: 13px;
      }

      .print-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        font-family: 'DM Sans', sans-serif;
        cursor: pointer;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text);
        transition: all 0.15s;
        &:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(16, 185, 129, 0.06);
        }
        &:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      }
      .spinner {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .empty {
        text-align: center;
        padding: 48px;
        color: var(--text-muted);
        font-size: 14px;
      }
    `,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1>Notas Fiscais</h1>
        <p class="subtitle">Emissão e controle de notas</p>
      </div>
      <a class="btn btn-primary" routerLink="/invoices/new">+ Nova nota</a>
    </div>

    <div class="table-card">
      <div class="table-header">
        <span class="table-title">Notas</span>
      </div>
      <div *ngIf="invoices.length === 0" class="empty">Nenhuma nota emitida ainda.</div>
      <table mat-table [dataSource]="invoices" *ngIf="invoices.length > 0">
        <colgroup>
          <col class="col-num" />
          <col class="col-status" />
          <col class="col-items" />
          <col class="col-action" />
        </colgroup>
        <ng-container matColumnDef="number">
          <th mat-header-cell *matHeaderCellDef>Nº</th>
          <td mat-cell *matCellDef="let n" class="num-cell">#{{ n.number }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let n">
            <span [class]="n.status === 'Open' ? 'badge badge-open' : 'badge badge-closed'">
              <span [class]="n.status === 'Open' ? 'dot dot-open' : 'dot dot-closed'"></span>
              {{ n.status === 'Open' ? 'Aberta' : 'Fechada' }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="items">
          <th mat-header-cell *matHeaderCellDef>Itens</th>
          <td mat-cell *matCellDef="let n">{{ n.items?.length || 0 }} produto(s)</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let n">
            <button
              class="print-btn"
              [disabled]="n.status !== 'Open' || printingId === n.ID"
              (click)="print(n)"
            >
              <span *ngIf="printingId === n.ID" class="spinner"></span>
              {{ printingId === n.ID ? 'Imprimindo...' : '↓ Imprimir' }}
            </button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </div>
  `,
})
export class Invoices implements OnInit {
  invoices: Invoice[] = [];
  columns = ['number', 'status', 'items', 'actions'];
  printingId: number | null = null;

  constructor(
    private billingService: BillingService,
    private snackBar: MatSnackBar,
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

  print(invoice: Invoice) {
    this.printingId = invoice.ID;
    this.billingService.printInvoice(invoice.ID).subscribe({
      next: () => {
        this.snackBar.open(`Nota #${invoice.number} impressa!`, 'Fechar', { duration: 3000 });
        this.printingId = null;
        this.loadInvoices();
      },
      error: (err) => {
        this.snackBar.open(err.error?.error || 'Erro ao imprimir', 'Fechar', { duration: 4000 });
        this.printingId = null;
        this.cdr.detectChanges();
      },
    });
  }
}
