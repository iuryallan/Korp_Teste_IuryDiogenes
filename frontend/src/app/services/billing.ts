import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Invoice, InvoiceItemRequest } from '../models/invoice.model';

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

  getSummary() {
    return this.http.get<{ summary: string }>(`${this.url}/invoices/summary`);
  }
}