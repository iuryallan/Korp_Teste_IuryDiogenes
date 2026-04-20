import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BillingService } from '../../services/billing';
import { InvoiceItemRequest } from '../../models/invoice.model';
import { InventoryService } from '../../services/inventory';
import { Product } from '../../models/product.model';

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
  templateUrl: './invoice-form.html',
  styleUrl: './invoice-form.scss',
})

export class InvoiceForm implements OnInit {
  products: Product[] = [];
  items: InvoiceItemRequest[] = [{ product_id: 0, quantity: 1 }];
  loading = false;
  editId: number | null = null;
  invoiceNumber: number = 0;

  constructor(
    private billingService: BillingService,
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = +id;
      this.loadInvoice(this.editId);
    }
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erro ao carregar produtos', 'Fechar', { duration: 3000 }),
    });
  }

  loadInvoice(id: number) {
    this.billingService.getInvoice(id).subscribe({
      next: (invoice) => {
        this.invoiceNumber = invoice.number;
        this.items = invoice.items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        }));
        this.cdr.detectChanges();
      },
      error: () => this.snackBar.open('Erro ao carregar nota', 'Fechar', { duration: 3000 }),
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
    const request$ = this.editId
      ? this.billingService.updateInvoice(this.editId, this.items)
      : this.billingService.createInvoice(this.items);

    request$.subscribe({
      next: () => {
        this.snackBar.open(this.editId ? 'Nota atualizada!' : 'Nota criada!', 'Fechar', {
          duration: 3000,
        });
        this.router.navigate(['/invoices']);
      },
      error: () => {
        this.snackBar.open('Erro ao salvar nota', 'Fechar', { duration: 3000 });
        this.loading = false;
      },
    });
  }
}
