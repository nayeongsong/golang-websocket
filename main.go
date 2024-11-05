package main

import (
	"golang-web4web/router"
	"log"
	"net/http"
)

func init() {

}
func main() {
	routersInit := router.SetupRouter()
	server := &http.Server{
		Addr:    "localhost:8080",
		Handler: routersInit,
	}
	log.Println("Starting server on http://localhost:8080")
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Could not listen on %s: %v\n", "localhost:8080", err)
	}
}
