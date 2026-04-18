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

type CreateInvoiceRequest struct {
	Items []models.InvoiceItem `json:"items"`
}

func (h *InvoiceHandler) Create(c *gin.Context) {
	var req CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var count int64
	h.DB.Model(&models.Invoice{}).Count(&count)

	invoice := models.Invoice{
		Number: int(count) + 1,
		Status: "Open",
		Items:  req.Items,
	}

	h.DB.Create(&invoice)
	c.JSON(http.StatusCreated, invoice)
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

	inventoryURL := os.Getenv("INVENTORY_SERVICE_URL")

	for _, item := range invoice.Items {
		body, _ := json.Marshal(map[string]float64{
			"quantity": item.Quantity,
		})

		url := fmt.Sprintf("%s/products/%d/debit", inventoryURL, item.ProductID)
		req, _ := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{}
		resp, err := client.Do(req)

		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error": "Inventory service unavailable. Please try again later.",
			})
			return
		}

		if resp.StatusCode != http.StatusOK {
			var respBody map[string]string
			json.NewDecoder(resp.Body).Decode(&respBody)
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("Failed to debit product %d: %s", item.ProductID, respBody["error"]),
			})
			return
		}
	}

	invoice.Status = "Closed"
	h.DB.Save(&invoice)
	c.JSON(http.StatusOK, invoice)
}