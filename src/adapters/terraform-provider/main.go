package main

import (
	"context"
	"log"

	"github.com/hashicorp/terraform-plugin-framework/tfsdk"
	"github.com/hashicorp/terraform-plugin-framework/tfsdk/provider"
)

func main() {
	// For now, just log that provider is starting
	log.Println("Chiral Terraform Provider v1.0.0")
	log.Println("Stateless multi-cloud infrastructure generation")
}
