package main

import (
	"context"
	"log"

	"github.com/hashicorp/terraform-plugin-framework/tfsdk"
	"github.com/hashicorp/terraform-plugin-framework/tfsdk/plugin"
)

func main() {
	plugin.Serve(context.Background(), plugin.ServeOpts{
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
