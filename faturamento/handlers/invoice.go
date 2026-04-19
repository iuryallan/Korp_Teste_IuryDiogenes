package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/iuryallan/faturamento/models"
	"gorm.io/gorm"
)

type InvoiceHandler struct {
	DB *gorm.DB
}

func NewInvoiceHandler(db *gorm.DB) *InvoiceHandler {
	return &InvoiceHandler{DB: db}
}

type ItemRequest struct {
	ProductID  uint    `json:"product_id"`
	Quantity   float64 `json:"quantity"`
}

type CreateInvoiceRequest struct {
	Items []ItemRequest `json:"items"`
}

type ProductResponse struct {
	ID          uint    `json:"ID"`
	Code        string  `json:"code"`
	Description string  `json:"description"`
	Balance     float64 `json:"balance"`
}

func fetchProduct(productID uint) (*ProductResponse, error) {
	inventoryURL := os.Getenv("INVENTORY_SERVICE_URL")
	if inventoryURL == "" {
		inventoryURL = "http://localhost:8081"
	}
	url := fmt.Sprintf("%s/products/%d", inventoryURL, productID)
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("inventory service unavailable")
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("product not found")
	}
	var product ProductResponse
	json.NewDecoder(resp.Body).Decode(&product)
	return &product, nil
}

func debitProduct(productID uint, quantity float64) error {
	inventoryURL := os.Getenv("INVENTORY_SERVICE_URL")
	if inventoryURL == "" {
		inventoryURL = "http://localhost:8081"
	}
	body, _ := json.Marshal(map[string]float64{"quantity": quantity})
	url := fmt.Sprintf("%s/products/%d/debit", inventoryURL, productID)
	req, _ := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return fmt.Errorf("inventory service unavailable")
	}
	if resp.StatusCode != http.StatusOK {
		var body map[string]string
		json.NewDecoder(resp.Body).Decode(&body)
		return fmt.Errorf(body["error"])
	}
	return nil
}

func returnProduct(productID uint, quantity float64) error {
	inventoryURL := os.Getenv("INVENTORY_SERVICE_URL")
	if inventoryURL == "" {
		inventoryURL = "http://localhost:8081"
	}
	body, _ := json.Marshal(map[string]float64{"quantity": quantity})
	url := fmt.Sprintf("%s/products/%d/return", inventoryURL, productID)
	req, _ := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := (&http.Client{}).Do(req)
	if err != nil {
		return fmt.Errorf("inventory service unavailable")
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to return product")
	}
	return nil
}

func (h *InvoiceHandler) List(c *gin.Context) {
	var invoices []models.Invoice
	h.DB.Preload("Items").Find(&invoices)
	c.JSON(http.StatusOK, invoices)
}

func (h *InvoiceHandler) Find(c *gin.Context) {
	id := c.Param("id")
	var invoice models.Invoice
	if h.DB.Preload("Items").First(&invoice, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}
	c.JSON(http.StatusOK, invoice)
}

func (h *InvoiceHandler) Create(c *gin.Context) {
	var req CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var items []models.InvoiceItem
	for _, r := range req.Items {
		product, err := fetchProduct(r.ProductID)
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
			return
		}
		items = append(items, models.InvoiceItem{
			ProductID:          r.ProductID,
			ProductCode:        product.Code,
			ProductDescription: product.Description,
			Quantity:           r.Quantity,
		})
	}

	var count int64
	h.DB.Model(&models.Invoice{}).Count(&count)

	invoice := models.Invoice{
		Number: int(count) + 1,
		Status: "Open",
		Items:  items,
	}
	h.DB.Create(&invoice)
	c.JSON(http.StatusCreated, invoice)
}

func (h *InvoiceHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var invoice models.Invoice
	if h.DB.Preload("Items").First(&invoice, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}
	if invoice.Status != "Open" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only open invoices can be edited"})
		return
	}

	var req CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Deleta itens antigos
	h.DB.Where("invoice_id = ?", invoice.ID).Delete(&models.InvoiceItem{})

	// Cria novos itens com snapshot
	var items []models.InvoiceItem
	for _, r := range req.Items {
		product, err := fetchProduct(r.ProductID)
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
			return
		}
		items = append(items, models.InvoiceItem{
			InvoiceID:          invoice.ID,
			ProductID:          r.ProductID,
			ProductCode:        product.Code,
			ProductDescription: product.Description,
			Quantity:           r.Quantity,
		})
	}

	h.DB.Create(&items)
	invoice.Items = items
	c.JSON(http.StatusOK, invoice)
}

func (h *InvoiceHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	var invoice models.Invoice
	if h.DB.Preload("Items").First(&invoice, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}
	if invoice.Status != "Open" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only open invoices can be deleted"})
		return
	}
	h.DB.Where("invoice_id = ?", invoice.ID).Delete(&models.InvoiceItem{})
	h.DB.Delete(&invoice)
	c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted"})
}

func (h *InvoiceHandler) Print(c *gin.Context) {
	id := c.Param("id")
	var invoice models.Invoice
	if h.DB.Preload("Items").First(&invoice, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}
	if invoice.Status != "Open" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only open invoices can be printed"})
		return
	}

	for _, item := range invoice.Items {
		if err := debitProduct(item.ProductID, item.Quantity); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": err.Error()})
			return
		}
	}

	invoice.Status = "Closed"
	h.DB.Save(&invoice)
	c.JSON(http.StatusOK, invoice)
}