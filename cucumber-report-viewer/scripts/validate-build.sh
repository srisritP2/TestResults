#!/bin/bash

echo "🔍 Validating build output..."

DIST_DIR="$(dirname "$0")/../dist"
REQUIRED_FILES=(
  "index.html"
  "manifest.json"
  "img/icons/favicon-16x16.png"
  "img/icons/favicon-32x32.png"
  "img/icons/apple-touch-icon.png"
)

ALL_VALID=true

# Check if dist directory exists
if [ ! -d "$DIST_DIR" ]; then
  echo "❌ dist directory does not exist"
  exit 1
fi

# Check required files
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$DIST_DIR/$file" ]; then
    echo "❌ Missing required file: $file"
    ALL_VALID=false
  else
    echo "✅ Found: $file"
  fi
done

# Validate manifest.json if it exists
MANIFEST_PATH="$DIST_DIR/manifest.json"
if [ -f "$MANIFEST_PATH" ]; then
  if command -v jq >/dev/null 2>&1; then
    if jq empty "$MANIFEST_PATH" >/dev/null 2>&1; then
      echo "✅ manifest.json is valid JSON"
      
      # Check required manifest fields
      REQUIRED_FIELDS=("name" "short_name" "start_url" "display" "icons")
      for field in "${REQUIRED_FIELDS[@]}"; do
        if ! jq -e ".$field" "$MANIFEST_PATH" >/dev/null 2>&1; then
          echo "❌ Missing manifest field: $field"
          ALL_VALID=false
        fi
      done
      
      # Check if start_url is correct for GitHub Pages
      START_URL=$(jq -r '.start_url' "$MANIFEST_PATH")
      if [[ "$START_URL" != *"/TestResults/"* ]]; then
        echo "❌ Incorrect start_url in manifest: $START_URL"
        ALL_VALID=false
      fi
    else
      echo "❌ Invalid manifest.json"
      ALL_VALID=false
    fi
  else
    echo "⚠️  jq not available, skipping JSON validation"
  fi
fi

# Check for CSS and JS bundles
CSS_COUNT=$(find "$DIST_DIR" -name "*.css" -type f | wc -l)
JS_COUNT=$(find "$DIST_DIR" -name "*.js" -type f ! -name "*service-worker*" | wc -l)

if [ "$CSS_COUNT" -eq 0 ]; then
  echo "❌ No CSS bundles found"
  ALL_VALID=false
else
  echo "✅ Found $CSS_COUNT CSS bundle(s)"
fi

if [ "$JS_COUNT" -eq 0 ]; then
  echo "❌ No JS bundles found"
  ALL_VALID=false
else
  echo "✅ Found $JS_COUNT JS bundle(s)"
fi

if [ "$ALL_VALID" = true ]; then
  echo "🎉 Build validation passed!"
  exit 0
else
  echo "💥 Build validation failed!"
  exit 1
fi