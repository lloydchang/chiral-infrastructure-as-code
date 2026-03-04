package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/hashicorp/terraform-plugin-framework/tfsdk"
	"github.com/hashicorp/terraform-plugin-framework/tfsdk/plugin"
)

func main() {
	if err := run(context.Background()); err != nil {
		log.Fatalf("Failed to run Chiral Terraform provider: %v", err)
	}
}

func run(ctx context.Context) error {
	plugin.Serve(ctx, &plugin.ServeOpts{
		Name: "chiral",
		ProviderAddr: "registry.terraform.io/chiral/chiral",
	})
}

type provider struct{}

func (p *provider) GetSchema(_ context.GetSchemaRequest) (*tfsdk.Schema, error) {
	return New().Schema()
}

func (p *provider) PrepareProviderConfig(ctx context.PrepareProviderConfigRequest) error {
	// No preparation needed
	return nil
}

func (p *provider) Configure(ctx context.ConfigureProviderConfigRequest) error {
	// No configuration needed
	return nil
}

func (p *provider) Stop(ctx context.StopRequest) error {
	// No cleanup needed
	return nil
}

func (p *provider) Close(ctx context.CloseRequest) error {
	// No cleanup needed
	return nil
}
