import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private url = environment.inventoryUrl;

  constructor(private http: HttpClient) {}

  getProducts() {
    return this.http.get<Product[]>(`${this.url}/products`);
  }

  createProduct(data: Omit<Product, 'ID'>) {
    return this.http.post<Product>(`${this.url}/products`, data);
  }

  restockProduct(id: number, quantity: number) {
    return this.http.put(`${this.url}/products/${id}/restock`, { quantity });
  }
}
