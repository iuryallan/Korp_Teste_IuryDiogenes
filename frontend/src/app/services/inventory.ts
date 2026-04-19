import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Product {
  ID: number;
  code: string;
  description: string;
  balance: number;
}

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
}