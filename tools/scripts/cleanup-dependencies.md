# Dependency Cleanup Report

## 🔍 Analysis Summary

**Project:** Chain Capital - Institutional Tokenization Platform  
**Total Dependencies:** 95  
**Potentially Unused:** 18 packages (~19% reduction possible)

## 🌐 Web3 Integration Findings

### Current Status
- ✅ **ethers.js v6.13.7** - ACTIVELY USED (primary Web3 library)
- ❌ **@reown/appkit v1.7.3** - NOT USED (no imports found)
- ❌ **@reown/appkit-adapter-wagmi v1.7.3** - NOT USED (no imports found)  
- ❌ **wagmi v2.15.2** - NOT USED (no direct imports found)
- ⚠️ **viem v2.28.3** - INDIRECT DEPENDENCY (used by wagmi, keep if planning to use wagmi)
- ✅ **@tanstack/react-query v5.75.2** - USED (query management)

### Recommendations
Your project uses **ethers.js extensively** for Web3 functionality through a custom provider management system. The @reown/appkit and wagmi packages appear to be unused legacy dependencies.

## 📦 Packages to Remove

### 🚨 High Confidence Removals
```bash
npm uninstall @reown/appkit @reown/appkit-adapter-wagmi wagmi
```

### 🔧 Tool Dependencies (Likely Unused)
```bash
npm uninstall shadcn-ui ts-morph chalk
```

### 📱 Feature Dependencies (Review Usage)
```bash
# Remove if not using these features:
npm uninstall tesseract.js        # OCR functionality
npm uninstall react-webcam        # Camera capture
npm uninstall vaul                # Drawer component
npm uninstall embla-carousel-react # Carousel component
npm uninstall @hello-pangea/dnd   # Drag and drop
npm uninstall jspdf-autotable     # PDF table generation
```

### 🖥️ Server Dependencies (If Client-Only)
```bash
# Remove if this is a client-only app:
npm uninstall express cors ws sharp
```

### 🔄 Polyfills (Check if Needed)
```bash
# Remove if targeting modern browsers only:
npm uninstall rollup-plugin-polyfill-node node-fetch
```

## ⚠️ Version Conflicts Check

### Web3 Stack Versions
| Package | Version | Status |
|---------|---------|---------|
| @reown/appkit | ^1.7.3 | 🔄 COMPATIBLE |
| @reown/appkit-adapter-wagmi | ^1.7.3 | 🔄 COMPATIBLE |
| wagmi | ^2.15.2 | 🔄 COMPATIBLE |
| viem | ^2.28.3 | 🔄 COMPATIBLE |
| @tanstack/react-query | ^5.75.2 | ✅ COMPATIBLE |

**No version conflicts detected** - all packages use compatible semver ranges.

## 🎯 Action Plan

### Phase 1: Safe Removals (Immediate)
```bash
# Remove unused Web3 packages
npm uninstall @reown/appkit @reown/appkit-adapter-wagmi wagmi

# Remove CLI tools
npm uninstall shadcn-ui ts-morph chalk
```

### Phase 2: Feature Review (Manual Check Required)
1. Search codebase for usage of:
   - `tesseract` (OCR)
   - `react-webcam` (Camera)
   - `vaul` (Drawer)
   - `embla-carousel` (Carousel)
   - `@hello-pangea/dnd` (Drag & Drop)

2. Remove unused features:
```bash
npm uninstall [unused-packages-from-search]
```

### Phase 3: Server Dependencies (If Client-Only)
```bash
# Only if this is a pure client-side app
npm uninstall express cors ws sharp
```

## 🔍 How to Verify Usage

### Search for Package Usage
```bash
# Search for imports/usage
grep -r "import.*@reown" src/
grep -r "import.*wagmi" src/
grep -r "import.*tesseract" src/
grep -r "react-webcam" src/
grep -r "vaul" src/
grep -r "embla-carousel" src/
grep -r "@hello-pangea/dnd" src/
```

### Check Node Modules Size
```bash
du -sh node_modules/
# Before cleanup: ~XXX MB
# After cleanup: ~XXX MB (estimated 15-20% reduction)
```

## 🚀 Benefits of Cleanup

- **Faster installs:** Fewer packages to download
- **Smaller bundle:** Reduced dependency tree
- **Better security:** Fewer attack vectors
- **Cleaner codebase:** Less dependency management
- **Faster builds:** Less to process

## ⚡ Quick Cleanup Script

Create and run this script for safe removals:

```bash
#!/bin/bash
echo "🧹 Starting dependency cleanup..."

# Phase 1: Safe removals
echo "📦 Removing unused Web3 packages..."
npm uninstall @reown/appkit @reown/appkit-adapter-wagmi wagmi

echo "🔧 Removing CLI tools..."
npm uninstall shadcn-ui ts-morph chalk

echo "🔄 Running npm audit..."
npm audit fix

echo "✅ Cleanup complete! Run 'npm run dev' to test."
```

## 🔮 Future Considerations

If you plan to integrate wallet connections in the future:
- **Keep viem** (modern, TypeScript-first)
- **Consider wagmi** (React hooks for Ethereum)
- **@reown/appkit** provides pre-built wallet connection UI

Your current **ethers.js + custom provider system** is robust and well-architected, so only add additional Web3 libraries if you need specific features they provide.
