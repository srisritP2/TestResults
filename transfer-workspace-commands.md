# Transfer Workspace - Separate Commands

## 🚀 Run These Commands in a New Terminal Window

### Step 1: Open New PowerShell Window
```powershell
# Press Win + R, type "powershell", press Enter
# Or open Windows Terminal and create new tab
```

### Step 2: Create Transfer Workspace
```powershell
# Create dedicated transfer directory
New-Item -ItemType Directory -Path "C:\GitTransfer" -Force
Set-Location "C:\GitTransfer"

# Verify you're in the right place
Get-Location
```

### Step 3: Clone Repository (Bare)
```powershell
# Clone the source repository with full history
git clone --bare https://github.com/srisritP2/TestResults.git

# Navigate to the bare repository
Set-Location "TestResults.git"

# Verify the clone worked
git branch -a
```

### Step 4: Push to New Repository
```powershell
# Replace YOUR_TOKEN with your actual srisri-t token
git push --mirror https://YOUR_TOKEN@github.com/srisri-t/AutomationTestResults.git
```

### Step 5: Cleanup
```powershell
# Go back to transfer directory
Set-Location "C:\GitTransfer"

# Remove the temporary bare repository
Remove-Item -Recurse -Force "TestResults.git"

# Verify cleanup
Get-ChildItem
```

### Step 6: Clone Your New Repository
```powershell
# Clone your new repository for development
git clone https://github.com/srisri-t/AutomationTestResults.git

# Navigate to the new repository
Set-Location "AutomationTestResults"

# Verify everything transferred
git log --oneline -10
git branch -a
git remote -v
```

## 🎯 Your New Repository URLs
- **Repository:** https://github.com/srisri-t/AutomationTestResults
- **Future GitHub Pages:** https://srisri-t.github.io/AutomationTestResults

## 🧹 Complete Cleanup (Optional)
```powershell
# When done, remove the entire transfer workspace
Set-Location "C:\"
Remove-Item -Recurse -Force "C:\GitTransfer"
```

---

## 📋 Quick Copy-Paste Commands

**For New Terminal Window:**
```powershell
New-Item -ItemType Directory -Path "C:\GitTransfer" -Force
Set-Location "C:\GitTransfer"
git clone --bare https://github.com/srisritP2/TestResults.git
Set-Location "TestResults.git"
```

**Then run with your token:**
```powershell
git push --mirror https://YOUR_TOKEN@github.com/srisri-t/AutomationTestResults.git
```

**Cleanup:**
```powershell
Set-Location "C:\GitTransfer"
Remove-Item -Recurse -Force "TestResults.git"
git clone https://github.com/srisri-t/AutomationTestResults.git
```