package main

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/iuryallan/estoque/config"
	"github.com/iuryallan/estoque/handlers"
	"github.com/iuryallan/estoque/models"
)

func main() {
	config.Load()

	db := config.Connect()
	db.AutoMigrate(&models.Product{})

	productHandler := handlers.NewProductHandler(db)

	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/products", productHandler.List)
	r.GET("/products/:id", productHandler.Find)
	r.POST("/products", productHandler.Create)
	r.PUT("/products/:id", productHandler.Update)
	r.PUT("/products/:id/debit", productHandler.Debit)
	r.PUT("/products/:id/restock", productHandler.Restock)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	r.Run(":" + port)
}