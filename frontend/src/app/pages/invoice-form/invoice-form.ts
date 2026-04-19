import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BillingService, InvoiceItem } from '../../services/billing';
import { InventoryService, Product } from '../../services/inventory';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
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
        max-width: 620px;
      }
      .card-title {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 20px;
      }
      .item-row {
        display: grid;
        grid-template-columns: 1fr 120px 36px;
        gap: 12px;
        margin-bottom: 12px;
      }
      mat-form-field {
        width: 100%;
      }
      .remove-btn {
        width: 36px;
        height: 36px;
        border-radius: 6px;
        border: 1px solid var(--border);
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        position: relative;
        top: 8px;
        line-height: 1;
        &:hover {
          border-color: var(--danger);
          color: var(--danger);
          background: rgba(239, 68, 68, 0.06);
        }
      }
      .divider {
        height: 1px;
        background: var(--border);
        margin: 20px 0;
      }
      .actions {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
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
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
      .btn-ghost {
        background: transparent;
        color: var(--text-muted);
        border: 1px solid var(--border);
        &:hover {
          color: var(--text);
        }
      }
      .btn-add {
        background: transparent;
        color: var(--accent);
        border: 1px dashed rgba(16, 185, 129, 0.4);
        width: 100%;
        justify-content: center;
        margin-bottom: 20px;
        &:hover {
          background: rgba(16, 185, 129, 0.06);
        }
      }
    `,
  ],
  template: `
    <div class="page-header">
      <h1>Nova Nota Fiscal</h1>
      <p class="subtitle">Adicione produtos e salve a nota</p>
    </div>

    <div class="card">
      <div class="card-title">Itens da nota</div>

      <div class="item-row" *ngFor="let item of items; let i = index">
        <mat-form-field appearance="outline">
          <mat-label>Produto</mat-label>
          <mat-select [(ngModel)]="item.product_id">
            <mat-option *ngFor="let p of products" [value]="p.ID">
              {{ p.code }} — {{ p.description }} (saldo: {{ p.balance }})
            </mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" [style.opacity]="!item.product_id ? '0.4' : '1'">
          <mat-label>Qtd</mat-label>
          <input
            matInput
            type="number"
            [(ngModel)]="item.quantity"
            min="1"
            [max]="getBalance(item.product_id)"
            [disabled]="!item.product_id"
          />
        </mat-form-field>
        <button class="remove-btn" (click)="removeItem(i)">×</button>
      </div>

      <button class="btn btn-add" (click)="addItem()">+ Adicionar produto</button>

      <div class="divider"></div>

      <div class="actions">
        <button class="btn btn-primary" (click)="save()" [disabled]="loading">
          {{ loading ? 'Salvando...' : 'Salvar nota' }}
        </button>
        <a class="btn btn-ghost" routerLink="/invoices">Cancelar</a>
      </div>
    </div>
  `,
})
export class InvoiceForm implements OnInit {
  products: Product[] = [];
  items: InvoiceItem[] = [{ product_id: 0, quantity: 1 }];
  loading = false;

  constructor(
    private billingService: BillingService,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 }),
    });
  }

  getBalance(productId: number): number {
    const product = this.products.find((p) => p.ID === productId);
    return product ? product.balance : 9999;
  }

  addItem() {
    this.items.push({ product_id: 0, quantity: 1 });
  }
  removeItem(i: number) {
    this.items.splice(i, 1);
  }

  save() {
    if (this.items.length === 0) {
      this.snackBar.open('Adicione ao menos um produto', 'Fechar', { duration: 3000 });
      return;
    }
    if (this.items.some((i) => !i.product_id || i.quantity <= 0)) {
      this.snackBar.open('Preencha todos os itens corretamente', 'Fechar', { duration: 3000 });
      return;
    }
    this.loading = true;
    this.billingService.createInvoice(this.items).subscribe({
      next: () => {
        this.snackBar.open('Nota criada com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/invoices']);
      },
      error: () => {
        this.snackBar.open('Erro ao criar nota', 'Fechar', { duration: 3000 });
        this.loading = false;
      },
    });
  }
}
