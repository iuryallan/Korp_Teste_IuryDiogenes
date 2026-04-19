package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/iuryallan/estoque/models"
	"gorm.io/gorm"
)

type ProductHandler struct {
	DB *gorm.DB
}

func NewProductHandler(db *gorm.DB) *ProductHandler {
	return &ProductHandler{DB: db}
}

func (h *ProductHandler) List(c *gin.Context) {
	var products []models.Product
	h.DB.Find(&products)
	c.JSON(http.StatusOK, products)
}

func (h *ProductHandler) Find(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if h.DB.First(&product, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, product)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	h.DB.Create(&product)
	c.JSON(http.StatusCreated, product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if h.DB.First(&product, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	var data models.Product
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product.Code = data.Code
	product.Description = data.Description
	product.Balance = data.Balance
	h.DB.Save(&product)
	c.JSON(http.StatusOK, product)
}

type DebitRequest struct {
	Quantity float64 `json:"quantity"`
}

func (h *ProductHandler) Debit(c *gin.Context) {
	id := c.Param("id")

	idempotencyKey := c.GetHeader("Idempotency-Key")

	var result struct {
		models.Product
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var product models.Product

		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			First(&product, id).Error; err != nil {
			return fmt.Errorf("product not found")
		}

		if idempotencyKey != "" && product.LastIdempotencyKey == idempotencyKey {
			result.Product = product
			return nil
		}

		var req DebitRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			return fmt.Errorf("invalid request")
		}

		if product.Balance < req.Quantity {
			return fmt.Errorf("insufficient balance")
		}

		product.Balance -= req.Quantity
		product.LastIdempotencyKey = idempotencyKey

		if err := tx.Save(&product).Error; err != nil {
			return err
		}

		result.Product = product
		return nil
	})

	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "product not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result.Product)
}

type ReturnRequest struct {
	Quantity float64 `json:"quantity"`
}

func (h *ProductHandler) Return(c *gin.Context) {
	id := c.Param("id")

	var result struct {
		models.Product
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		var product models.Product

		if err := tx.Set("gorm:query_option", "FOR UPDATE").
			First(&product, id).Error; err != nil {
			return fmt.Errorf("product not found")
		}

		var req ReturnRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			return fmt.Errorf("invalid request")
		}

		product.Balance += req.Quantity
		if err := tx.Save(&product).Error; err != nil {
			return err
		}

		result.Product = product
		return nil
	})

	if err != nil {
		status := http.StatusBadRequest
		if err.Error() == "product not found" {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result.Product)
}