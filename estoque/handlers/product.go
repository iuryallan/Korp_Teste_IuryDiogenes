package handlers

import (
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
	var product models.Product
	if h.DB.First(&product, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var req DebitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if product.Balance < req.Quantity {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	product.Balance -= req.Quantity
	h.DB.Save(&product)
	c.JSON(http.StatusOK, product)
}

type ReturnRequest struct {
	Quantity float64 `json:"quantity"`
}

func (h *ProductHandler) Return(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if h.DB.First(&product, id).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	var req ReturnRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	product.Balance += req.Quantity
	h.DB.Save(&product)
	c.JSON(http.StatusOK, product)
}