# Chiral Terraform Provider Makefile

.PHONY: build clean install test

# Build the Terraform provider
build:
	go build -o terraform-provider-chiral .

# Clean build artifacts
clean:
	rm -f terraform-provider-chiral
	rm -rf dist/

# Install the provider locally
install: build
	mkdir -p ~/.terraform.d/plugins/
	cp terraform-provider-chiral ~/.terraform.d/plugins/

# Run tests
test:
	go test ./...

# Format Go code
fmt:
	go fmt ./...

# Lint Go code
lint:
	golangci-lint run

# Build for multiple platforms
build-all:
	GOOS=linux GOARCH=amd64 go build -o dist/terraform-provider-chiral-linux-amd64 .
	GOOS=darwin GOARCH=amd64 go build -o dist/terraform-provider-chiral-darwin-amd64 .
	GOOS=windows GOARCH=amd64 go build -o dist/terraform-provider-chiral-windows-amd64.exe .
