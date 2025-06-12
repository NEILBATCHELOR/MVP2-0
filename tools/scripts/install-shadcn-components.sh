#!/bin/bash

# Script to install all required shadcn components
# Migrated from shadcn-ui to shadcn
# Reference: https://ui.shadcn.com/docs/cli

echo "Installing shadcn components..."
echo "Note: This script installs components using the latest shadcn CLI"
echo "If a component fails to install, you can continue from where it left off"

# Array of components to install
components=(
  "button"
  "input"
  "form"
  "card"
  "dialog"
  "select"
  "checkbox"
  "switch"
  "table"
  "tabs"
  "alert"
  "toast"
  "avatar"
  "badge"
  "sheet"
  "popover"
  "dropdown-menu"
  "slider"
  "progress"
  "radio-group"
  "separator"
  "tooltip"
  "navigation-menu"
  "accordion"
  "calendar"
  "aspect-ratio"
  "hover-card"
  "command"
)

# Install each component
for component in "${components[@]}"; do
  echo "Installing $component..."
  # Use --overwrite to automatically overwrite existing files
  npx shadcn@latest add "$component" --yes --overwrite
  
  # Check if installation was successful
  if [ $? -eq 0 ]; then
    echo "✅ Successfully installed $component"
  else
    echo "❌ Failed to install $component"
  fi
  
  # Small delay to prevent rate limiting
  sleep 1
done

echo "Installation complete! Check above for any components that failed to install."