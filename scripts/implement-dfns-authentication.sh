# DFNS Authentication Implementation Script
# Priority: Replace mock implementations with real DFNS API calls

echo "🔐 DFNS Authentication - Real API Integration Script"
echo "=================================================="

echo "📋 Phase 1: Service Account Authentication (Real API)"
echo "Files to modify:"
echo "  - src/infrastructure/dfns/auth.ts"
echo "  - src/infrastructure/dfns/client.ts"
echo "  - src/infrastructure/dfns/config.ts"

echo ""
echo "🎯 Priority Tasks:"

echo "1. Update auth.ts - Replace mock service account authentication"
echo "   Current: Returns mock token after 100ms delay"
echo "   Needed: Real POST /auth/service-accounts/login"

echo "2. Add missing service account endpoints to client.ts:"
echo "   - POST /auth/service-accounts (Create)"
echo "   - GET /auth/service-accounts (List)"
echo "   - PUT /auth/service-accounts/{id}/activate"
echo "   - PUT /auth/service-accounts/{id}/deactivate"

echo "3. Update config.ts with real DFNS endpoints"
echo "   - Replace mock URLs with production DFNS API"
echo "   - Add proper environment variable handling"

echo ""
echo "🛠️  Implementation Commands:"

echo "# 1. Install DFNS SDK (if available)"
echo "pnpm add @dfns/sdk"

echo "# 2. Update environment variables"
echo "echo 'VITE_DFNS_API_URL=https://api.dfns.co' >> .env"
echo "echo 'VITE_DFNS_APP_ID=your-app-id' >> .env"
echo "echo 'VITE_DFNS_ORIGIN=https://yourdomain.com' >> .env"

echo "# 3. Run TypeScript check to find issues"
echo "pnpm run type-check"

echo ""
echo "📝 Code Changes Needed:"

echo "File: src/infrastructure/dfns/auth.ts"
echo "Method: requestServiceAccountToken()"
echo "Replace mock implementation with:"
echo ""
echo "```typescript"
echo "private async requestServiceAccountToken("
echo "  serviceAccountId: string,"
echo "  privateKey: string"
echo "): Promise<{ accessToken: string }> {"
echo "  const challenge = await this.client.post('/auth/service-accounts/login/init', {"
echo "    serviceAccountId"
echo "  });"
echo "  "
echo "  const signature = await this.signChallenge(challenge.data.challenge, privateKey);"
echo "  "
echo "  const response = await this.client.post('/auth/service-accounts/login', {"
echo "    serviceAccountId,"
echo "    signature"
echo "  });"
echo "  "
echo "  return { accessToken: response.data.accessToken };"
echo "}"
echo "```"

echo ""
echo "📊 Progress Tracking:"
echo "Create file: progress-tracker.md"

cat > /Users/neilbatchelor/Cursor/Chain\ Capital\ Production/scripts/dfns-implementation-progress.md << 'EOF'
# DFNS Implementation Progress

## Phase 1: Real API Integration
- [ ] Replace mock service account authentication
- [ ] Add real credential creation flow
- [ ] Update WebAuthn challenge/response
- [ ] Test with actual DFNS staging environment

## Phase 2: Service Account Management
- [ ] Implement POST /auth/service-accounts
- [ ] Implement GET /auth/service-accounts
- [ ] Add activate/deactivate endpoints
- [ ] Create management UI

## Phase 3: Credential Lifecycle
- [ ] POST /auth/credentials/init
- [ ] POST /auth/credentials (complete creation)
- [ ] PUT /auth/credentials/activate
- [ ] DELETE /auth/credentials/{id}

## Phase 4: Advanced Features
- [ ] Recovery credential generation
- [ ] ASN.1/DER signature formatting
- [ ] Password manager integration
- [ ] Advanced curve support

## Testing Checklist
- [ ] Service account login/logout
- [ ] WebAuthn credential creation
- [ ] User action signing
- [ ] Error handling
- [ ] Token refresh
EOF

echo ""
echo "🔍 Validation Commands:"

echo "# Test authentication"
echo "pnpm run test:auth"

echo "# Check for TypeScript errors"
echo "pnpm run build"

echo "# Test DFNS connectivity"
echo "curl -X GET \"https://api.dfns.co/auth/ping\" -H \"X-DFNS-APPID: your-app-id\""

echo ""
echo "📚 Documentation to Review:"
echo "1. https://docs.dfns.co/d/api-docs/authentication/service-account-management"
echo "2. https://docs.dfns.co/d/advanced-topics/authentication/request-signing"
echo "3. https://docs.dfns.co/d/api-docs/authentication/credential-management"

echo ""
echo "⚠️  Important Notes:"
echo "- Test in DFNS staging environment first"
echo "- Keep mock implementations as fallback during development"
echo "- Add comprehensive error handling for API failures"
echo "- Implement proper request signing with real private keys"

echo ""
echo "🎯 Success Criteria:"
echo "✅ Real DFNS service account authentication working"
echo "✅ Actual API calls replacing all mock implementations"
echo "✅ WebAuthn credentials created through DFNS API"
echo "✅ Request signing with proper ASN.1/DER formatting"
echo "✅ Full error handling for API failures"

echo ""
echo "📞 Next Steps:"
echo "1. Run this script to understand the scope"
echo "2. Set up DFNS staging environment"
echo "3. Begin with auth.ts modifications"
echo "4. Test each component incrementally"
echo "5. Move to production environment when ready"

echo ""
echo "🚀 Ready to begin Phase 1 implementation!"
