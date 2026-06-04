package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"taskapp/database"
	"taskapp/handlers"
)

func main() {
	database.Connect()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:5173"},
		AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders: []string{"Content-Type"},
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	tasks := r.Group("/tasks")
	{
		tasks.GET("", handlers.GetTasks)
		tasks.POST("", handlers.CreateTask)
		tasks.PUT("/:id", handlers.UpdateTask)
		tasks.DELETE("/:id", handlers.DeleteTask)
	}

	r.Run(":8080")
}