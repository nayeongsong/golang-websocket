package router

import (
	"golang-web4web/docs"
	_ "golang-web4web/docs"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()
	docs.SwaggerInfo.Title = "Swagger Web4Web API"

	// Swagger setup
	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	// apiv1 := router.Group("/api/v1")

	return router
}
