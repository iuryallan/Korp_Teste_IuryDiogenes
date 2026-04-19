import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService, Product } from '../../services/inventory';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  styles: [
    `
      .page-header {
        margin-bottom: 32px;
      }
      h1 {
        font-size: 22px;
        font-weight: 600;
        color: var(--text);
      }
      .subtitle {
        font-size: 13px;
        color: var(--text-muted);
        margin-top: 4px;
      }

      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 32px;
      }
      .card-title {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 20px;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      .span-2 {
        grid-column: span 2;
      }
      mat-form-field {
        width: 100%;
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
        transition: all 0.15s;
      }
      .btn-primary {
        background: var(--accent);
        color: #fff;
        &:hover {
          background: var(--accent-dim);
        }
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
      .count-badge {
        font-size: 12px;
        font-weight: 500;
        color: var(--accent);
        background: rgba(16, 185, 129, 0.1);
        padding: 2px 10px;
        border-radius: 20px;
      }
      table {
        width: 100%;
        table-layout: fixed;
      }
      col.col-desc {
        width: 50%;
      }
      col.col-code {
        width: 25%;
      }
      col.col-bal {
        width: 25%;
      }
      .balance-cell {
        font-family: 'DM Mono', monospace;
        font-size: 13px;
        color: var(--accent) !important;
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
      <h1>Produtos</h1>
      <p class="subtitle">Gerencie o cadastro e estoque de produtos</p>
    </div>

    <div class="card">
      <div class="card-title">Novo Produto</div>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput [(ngModel)]="form.code" placeholder="P001" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="span-2">
          <mat-label>Descrição</mat-label>
          <input matInput [(ngModel)]="form.description" placeholder="Nome do produto" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Saldo inicial</mat-label>
          <input matInput type="number" [(ngModel)]="form.balance" min="0" />
        </mat-form-field>
      </div>
      <button class="btn btn-primary" (click)="createProduct()" [disabled]="loading">
        {{ loading ? 'Salvando...' : '+ Cadastrar produto' }}
      </button>
    </div>

    <div class="table-card">
      <div class="table-header">
        <span class="table-title">Estoque</span>
        <span class="count-badge">{{ products.length }} produto(s)</span>
      </div>
      <div *ngIf="products.length === 0" class="empty">Nenhum produto cadastrado ainda.</div>
      <table mat-table [dataSource]="products" *ngIf="products.length > 0">
        <colgroup>
          <col class="col-code" />
          <col class="col-desc" />
          <col class="col-bal" />
        </colgroup>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Descrição</th>
          <td mat-cell *matCellDef="let p">{{ p.description }}</td>
        </ng-container>
        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>Código</th>
          <td mat-cell *matCellDef="let p">{{ p.code }}</td>
        </ng-container>
        <ng-container matColumnDef="balance">
          <th mat-header-cell *matHeaderCellDef>Saldo</th>
          <td mat-cell *matCellDef="let p" class="balance-cell">{{ p.balance }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </div>
  `,
})
export class Products implements OnInit {
  products: Product[] = [];
  columns = ['code', 'description', 'balance'];
  form = { code: '', description: '', balance: 0 };
  loading = false;

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 }),
    });
  }

  createProduct() {
    if (!this.form.code || !this.form.description) {
      this.snackBar.open('Preencha todos os campos', 'Fechar', { duration: 3000 });
      return;
    }
    this.loading = true;
    this.inventoryService.createProduct(this.form).subscribe({
      next: () => {
        this.snackBar.open('Produto cadastrado!', 'Fechar', { duration: 3000 });
        this.form = { code: '', description: '', balance: 0 };
        this.loading = false;
        this.loadProducts();
      },
      error: () => {
        this.snackBar.open('Erro ao cadastrar', 'Fechar', { duration: 3000 });
        this.loading = false;
      },
    });
  }
}
