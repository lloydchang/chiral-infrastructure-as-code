package main

import (
	"context"
	"log"

	"github.com/hashicorp/terraform-plugin-framework/tfsdk"
	"github.com/hashicorp/terraform-plugin-framework/tfsdk/provider"
)

// Provider implementation
type chiralProvider struct{}

func (p *chiralProvider) GetSchema(_ context.GetSchemaRequest) (*tfsdk.Schema, error) {
	return &providerSchema, nil
}

func (p *chiralProvider) Configure(ctx context.ProviderConfigureRequest, resp *provider.ConfigureResponse) {
	// No configuration needed for Chiral provider
}

func (p *chiralProvider) Resources(ctx context.ResourceRequest) []tfsdk.Resource {
	return []tfsdk.Resource{
		kubernetesClusterResource{},
	}
}

func (p *chiralProvider) Close(ctx context.ProviderCloseRequest) error {
	// No cleanup needed for stateless provider
	return nil
}

// Provider schema
var providerSchema = tfsdk.Schema{
	Attributes: map[string]tfsdk.SchemaAttribute{
		"output_directory": {
			Type:     tfsdk.TypeString,
			Optional:  true,
			Computed: false,
		},
	},
}

// Kubernetes cluster resource
type kubernetesClusterResource struct{}

func (r *kubernetesClusterResource) GetSchema(_ context.GetSchemaRequest) (*tfsdk.Schema, error) {
	return &kubernetesClusterSchema, nil
}

func (r *kubernetesClusterResource) Create(ctx context.ResourceCreateRequest, resp *ResourceCreateResponse) {
	var config KubernetesClusterConfig
	diags := req.Config.Get(ctx, &config)
	resp.Diagnostics.Append(diags...)
	
	if diags.HasError() {
		return
	}

	log.Printf("Creating Chiral Kubernetes cluster: %s", config.ProjectName)

	// Generate multi-cloud artifacts
	artifacts := map[string]interface{}{
		"aws":   "./chiral-artifacts/aws",
		"azure":  "./chiral-artifacts/azure", 
		"gcp":    "./chiral-artifacts/gcp",
	}

	// Set resource state
	result := KubernetesClusterResourceModel{
		ID:         "chiral_kubernetes_cluster.main",
		Config:     config,
		GeneratedAt: ctx.Time().Format(time.RFC3339),
		Artifacts:  artifacts,
	}

	diags = resp.State.Set(ctx, result)
	resp.Diagnostics.Append(diags...)
}

func (r *kubernetesClusterResource) Read(ctx context.ResourceReadRequest, resp *ResourceReadResponse) {
	var state KubernetesClusterResourceModel
	diags := req.State.Get(ctx, &state)
	resp.Diagnostics.Append(diags...)
	
	if diags.HasError() {
		return
	}

	// Return current state
	diags = resp.State.Set(ctx, state)
	resp.Diagnostics.Append(diags...)
}

func (r *kubernetesClusterResource) Update(ctx context.ResourceUpdateRequest, resp *ResourceUpdateResponse) {
	var config KubernetesClusterConfig
	diags := req.Config.Get(ctx, &config)
	resp.Diagnostics.Append(diags...)
	
	if diags.HasError() {
		return
	}

	log.Printf("Updating Chiral Kubernetes cluster: %s", config.ProjectName)

	// Update resource state
	result := KubernetesClusterResourceModel{
		ID:         "chiral_kubernetes_cluster.main",
		Config:     config,
		GeneratedAt: ctx.Time().Format(time.RFC3339),
		Artifacts:  map[string]interface{}{
			"aws":   "./chiral-artifacts/aws",
			"azure":  "./chiral-artifacts/azure",
			"gcp":    "./chiral-artifacts/gcp",
		},
	}

	diags = resp.State.Set(ctx, result)
	resp.Diagnostics.Append(diags...)
}

func (r *kubernetesClusterResource) Delete(ctx context.ResourceDeleteRequest, resp *ResourceDeleteResponse) {
	log.Printf("Deleting Chiral Kubernetes cluster")
	
	// Stateless provider - no actual deletion needed
	// Users would manually delete generated artifacts
	resp.State.RemoveResource(ctx)
}

// Kubernetes cluster schema
var kubernetesClusterSchema = tfsdk.Schema{
	Attributes: map[string]tfsdk.SchemaAttribute{
		"id": {
			Type:     tfsdk.TypeString,
			Computed: true,
		},
		"config": {
			Type:     tfsdk.TypeString,
			Required: true,
		},
		"generated_at": {
			Type:     tfsdk.TypeString,
			Optional:  true,
			Computed:  true,
		},
		"artifacts": {
			Type:     tfsdk.TypeMap,
			Elem:     &tfsdk.Schema{
				Attributes: map[string]tfsdk.SchemaAttribute{
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
			},
			Optional:  true,
			Computed:  true,
		},
	},
}

// Configuration models
type KubernetesClusterConfig struct {
	ProjectName string `tfsdk:"project_name"`
	Environment string `tfsdk:"environment"`
	NetworkCIDR string `tfsdk:"network_cidr"`
	K8s        struct {
		Version   string `tfsdk:"version"`
		MinNodes  int    `tfsdk:"min_nodes"`
		MaxNodes  int    `tfsdk:"max_nodes"`
		Size      string `tfsdk:"size"`
	} `tfsdk:"k8s"`
	Postgres struct {
		EngineVersion string `tfsdk:"engine_version"`
		Size         string `tfsdk:"size"`
		StorageGB    int    `tfsdk:"storage_gb"`
	} `tfsdk:"postgres"`
	ADFS struct {
		Size           string `tfsdk:"size"`
		WindowsVersion string `tfsdk:"windows_version"`
	} `tfsdk:"adfs"`
}

type KubernetesClusterResourceModel struct {
	ID         string                 `tfsdk:"id"`
	Config     KubernetesClusterConfig  `tfsdk:"config"`
	GeneratedAt string                 `tfsdk:"generated_at"`
	Artifacts  map[string]interface{}   `tfsdk:"artifacts"`
}
