package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/hashicorp/terraform-plugin-framework/tfsdk"
	"github.com/hashicorp/terraform-plugin-framework/tfsdk/plugin"
	"github.com/hashicorp/terraform-plugin-framework/tfsdk/validate"
)

// Provider configuration schema
var providerSchema = tfsdk.Schema{
	Attributes: map[string]tfsdk.SchemaAttribute{
		"output_directory": {
			Type:     tfsdk.TypeString,
			Optional:  true,
			Computed: false,
		},
	},
}

// Resource schemas
var kubernetesClusterResourceSchema = tfsdk.Schema{
	Attributes: map[string]tfsdk.SchemaAttribute{
		"config": {
			Type:     tfsdk.TypeString,
			Optional:  false,
			Computed: false,
		},
		"generated_at": {
			Type:     tfsdk.TypeString,
			Optional:  true,
			Computed:  true,
		},
		"artifacts": {
			Type:     tfsdk.TypeList,
			Elem:     tfsdk.SchemaAttribute{
				"aws": {
					Type:     tfsdk.TypeString,
					Optional:  true,
					Computed:  true,
				},
				"azure": {
					Type:     tfsdk.TypeString,
					Optional:  true,
					Computed:  true,
				},
				"gcp": {
					Type:     tfsdk.TypeString,
					Optional:  true,
					Computed:  true,
				},
			},
			Optional:  true,
			Computed:  true,
		},
	},
}

func New() tfsdk.Provider {
	return &provider{
		Schema: providerSchema,
		ResourcesMap: map[string]tfsdk.Resource{
			"chiral_kubernetes_cluster": {
				Schema: kubernetesClusterResourceSchema,
			},
		},
	}
}

func (p *provider) Configure(ctx context.ProviderConfigureRequest, resp *provider.ConfigureResponse) {
	// No configuration needed for Chiral provider
}

func (p *provider) Resources(ctx context.ResourceRequest) []tfsdk.Resource {
	return []tfsdk.Resource{
		{
			Name: "chiral_kubernetes_cluster",
			Schema: kubernetesClusterResourceSchema,
		},
	}
}

func (p *provider) Close(ctx context.ProviderCloseRequest) error {
	// No cleanup needed for stateless provider
	return nil
}

var (
	providerData = plugin.ProviderData{
		Name: "chiral",
		Schema: providerSchema,
	}
)

func main() {
	plugin.Serve(context.Context{ServeEvent: context.ServeEvent{
		Request: nil,
		Response: nil,
		Data:    providerData,
	})
}
