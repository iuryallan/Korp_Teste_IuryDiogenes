package models

import "gorm.io/gorm"

type Invoice struct {
	gorm.Model
	Number int           `json:"number"`
	Status string        `json:"status"`
	Items  []InvoiceItem `json:"items" gorm:"foreignKey:InvoiceID"`
}

type InvoiceItem struct {
	gorm.Model
	InvoiceID  uint    `json:"invoice_id"`
	ProductID  uint    `json:"product_id"`
	Quantity   float64 `json:"quantity"`
}