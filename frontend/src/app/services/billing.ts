import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface InvoiceItem {
  product_id: number;
  product_code: string;
  product_description: string;
  quantity: number;
}

export interface Invoice {
  ID: number;
  number: number;
  status: string;
  items: InvoiceItem[];
}

export interface InvoiceItemRequest {
  product_id: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class BillingService {
  private url = environment.billingUrl;

  constructor(private http: HttpClient) {}

  getInvoices() {
    return this.http.get<Invoice[]>(`${this.url}/invoices`);
  }

  getInvoice(id: number) {
    return this.http.get<Invoice>(`${this.url}/invoices/${id}`);
  }

  createInvoice(items: InvoiceItemRequest[]) {
    return this.http.post<Invoice>(`${this.url}/invoices`, { items });
  }

  updateInvoice(id: number, items: InvoiceItemRequest[]) {
    return this.http.put<Invoice>(`${this.url}/invoices/${id}`, { items });
  }

  deleteInvoice(id: number) {
    return this.http.delete(`${this.url}/invoices/${id}`);
  }

  printInvoice(id: number) {
    return this.http.post<Invoice>(`${this.url}/invoices/${id}/print`, {});
  }
}