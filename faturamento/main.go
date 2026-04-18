package main

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/iuryallan/faturamento/config"
	"github.com/iuryallan/faturamento/handlers"
	"github.com/iuryallan/faturamento/models"
)

func main() {
	config.Load()

	db := config.Connect()
	db.AutoMigrate(&models.Invoice{}, &models.InvoiceItem{})

	invoiceHandler := handlers.NewInvoiceHandler(db)

	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/invoices", invoiceHandler.List)
	r.GET("/invoices/:id", invoiceHandler.Find)
	r.POST("/invoices", invoiceHandler.Create)
	r.POST("/invoices/:id/print", invoiceHandler.Print)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	r.Run(":" + port)
}