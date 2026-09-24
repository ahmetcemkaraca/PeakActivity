# PeakActivity desktop: the native Tauri bundler owns installers and identity.
SHELL := /usr/bin/env bash
PYTHON ?= python3
DESKTOP_DIR ?= aw-tauri
WEBUI_DIR ?= $(DESKTOP_DIR)/aw-webui
SERVER_DIR ?= aw-server-rust
WINDOW_DIR ?= aw-watcher-window
AFK_DIR ?= aw-watcher-afk
CLIENT_DIR ?= aw-client
WAYLAND_DIR ?= awatcher
PACKAGE_STAGE ?= $(CURDIR)/build/peakactivity-helpers
OS := $(shell uname -s)
PLATFORM := $(if $(filter Darwin,$(OS)),macos,$(if $(filter Linux,$(OS)),linux,windows))
WAYLAND_ARG := $(if $(filter linux,$(PLATFORM)),--helper "aw-awatcher=$(abspath $(WAYLAND_DIR))/target/release/awatcher",)

.PHONY: build package helpers experience-check boundary-check test policy source clean

helpers:
	$(MAKE) -C "$(WINDOW_DIR)" build
	cd "$(WINDOW_DIR)" && poetry run pip install --no-deps "$(abspath $(CLIENT_DIR))" && poetry run make package
	$(MAKE) -C "$(AFK_DIR)" build
	cd "$(AFK_DIR)" && poetry run pip install --no-deps "$(abspath $(CLIENT_DIR))" && poetry run make package
ifeq ($(PLATFORM),linux)
	cargo build --locked --release --manifest-path "$(WAYLAND_DIR)/Cargo.toml"
endif
	$(PYTHON) scripts/package/stage_helpers.py --platform "$(PLATFORM)" \
	  --helper "aw-watcher-window=$(abspath $(WINDOW_DIR))/dist/aw-watcher-window" \
	  --helper "aw-watcher-afk=$(abspath $(AFK_DIR))/dist/aw-watcher-afk" \
	  $(WAYLAND_ARG) --output "$(PACKAGE_STAGE)"

build: helpers experience-check
	$(MAKE) -C "$(DESKTOP_DIR)" WEBUI_DIR="$(abspath $(WEBUI_DIR))" prebuild
	cd "$(DESKTOP_DIR)" && AW_WEBUI_DIR="$(abspath $(WEBUI_DIR))/dist" npm run tauri build -- --config "$(PACKAGE_STAGE)/tauri-resources.json"

experience-check:
	$(PYTHON) -m scripts.validate_experience --root . --ui-root "$(WEBUI_DIR)/src" --output "$(WEBUI_DIR)/src/generated/product-experience.json"

boundary-check:
	$(PYTHON) scripts/validate_egress_boundary.py --root . --server-root "$(SERVER_DIR)" \
	  --desktop-root "$(DESKTOP_DIR)" --webui-root "$(WEBUI_DIR)" --client-root "$(CLIENT_DIR)" \
	  --helper-root "$(WINDOW_DIR)" --helper-root "$(AFK_DIR)" \
	  --helper-root "$(WAYLAND_DIR)"

package: build
	@echo "Native installers are under $(DESKTOP_DIR)/src-tauri/target/release/bundle. Release evidence and signing are separate gates."

policy:
	$(PYTHON) scripts/public_policy.py --root . --format json

# Explicit full checks; implementation does not invoke this target automatically.
test: experience-check boundary-check
	$(PYTHON) -m pytest scripts/tests -q
	$(MAKE) -C "$(WEBUI_DIR)" test
	cd "$(DESKTOP_DIR)/src-tauri" && cargo test --locked
	$(MAKE) -C "$(WINDOW_DIR)" test
	$(MAKE) -C "$(AFK_DIR)" test
ifeq ($(PLATFORM),linux)
	cargo test --locked --manifest-path "$(WAYLAND_DIR)/Cargo.toml"
endif

source:
	$(PYTHON) scripts/export_source.py --root . --output "$(OUTPUT)"

# Never recursively clean component checkouts or user data.
clean:
	rm -rf -- build/peakactivity-helpers
