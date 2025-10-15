#!/bin/bash

echo "========================================"
echo "Cleanup and Import Reports from Git"
echo "========================================"
echo

cd "$(dirname "$0")/public/TestResultsJsons"

echo "Running cleanup and import script..."
node cleanup-and-import-from-git.js

echo
echo "========================================"
echo "Cleanup completed!"
echo "========================================"
echo
echo "Next steps:"
echo "1. Open your browser"
echo "2. Open Developer Console (F12)"
echo "3. Run: localStorage.clear(); location.reload();"
echo "4. Your reports will be refreshed with proper numbering"
echo

read -p "Press Enter to continue..."