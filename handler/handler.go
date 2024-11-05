package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ExampleHandler godoc
// @Summary Example handler
// @Description This is an example handler
// @Tags example
// @Accept  json
// @Produce  json
// @Success 200 {object} map[string]string
// @Router /example [get]
func ExampleHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Example handler",
	})
}
