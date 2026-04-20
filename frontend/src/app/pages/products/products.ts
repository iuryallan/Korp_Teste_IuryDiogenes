import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService } from '../../services/inventory';
import { Product } from '../../models/product.model';

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
  templateUrl: './products.html',
  styleUrl: './products.scss',
})

export class Products implements OnInit {
  products: Product[] = [];
  columns = ['description', 'code', 'balance'];
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
