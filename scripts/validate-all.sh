#!/bin/bash

# Token CRUD Validation Runner - Shell Script Version
# 
# This script runs all ERC validation scripts sequentially.
# Use this if you prefer shell scripts over TypeScript runner.
#
# Usage: ./scripts/validate-all.sh
# Usage with options: VERBOSE=true CONTINUE_ON_FAILURE=true ./scripts/validate-all.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VERBOSE="${VERBOSE:-false}"
CONTINUE_ON_FAILURE="${CONTINUE_ON_FAILURE:-false}"
CLEANUP_TEST_DATA="${CLEANUP_TEST_DATA:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Validation scripts
SCRIPTS=(
    "validate-erc20-crud.ts:ERC-20 Utility Tokens"
    "validate-erc721-crud.ts:ERC-721 NFT Tokens"
    "validate-erc1155-crud.ts:ERC-1155 Multi-Tokens"
    "validate-erc1400-crud.ts:ERC-1400 Security Tokens"
    "validate-erc3525-crud.ts:ERC-3525 Semi-Fungible Tokens"
    "validate-erc4626-crud.ts:ERC-4626 Vault Tokens"
)

# Results tracking
RESULTS=()
START_TIME=$(date +%s)
TOTAL_SCRIPTS=${#SCRIPTS[@]}
PASSED=0
FAILED=0
SKIPPED=0

print_header() {
    echo -e "${WHITE}$(printf '=%.0s' {1..80})${NC}"
    echo -e "${WHITE}🚀 SHELL-BASED TOKEN CRUD VALIDATION RUNNER${NC}"
    echo -e "${WHITE}$(printf '=%.0s' {1..80})${NC}"
    echo -e "Started: $(date)"
    echo -e "Scripts to run: ${TOTAL_SCRIPTS}"
    echo -e "Continue on failure: ${CONTINUE_ON_FAILURE}"
    echo -e "Verbose output: ${VERBOSE}"
    echo -e "${WHITE}$(printf '=%.0s' {1..80})${NC}"
}

run_validation() {
    local script_info="$1"
    local script_file=$(echo "$script_info" | cut -d: -f1)
    local script_name=$(echo "$script_info" | cut -d: -f2)
    local script_path="$SCRIPT_DIR/$script_file"
    
    echo ""
    echo -e "${WHITE}$(printf '=%.0s' {1..60})${NC}"
    echo -e "${CYAN}🔍 Running: ${script_name}${NC}"
    echo -e "${BLUE}📄 Script: ${script_file}${NC}"
    echo -e "${PURPLE}🕐 Started: $(date +'%H:%M:%S')${NC}"
    echo -e "${WHITE}$(printf '=%.0s' {1..60})${NC}"
    echo ""
    
    local start_time=$(date +%s)
    
    # Check if script exists
    if [[ ! -f "$script_path" ]]; then
        echo -e "${YELLOW}⚠️ Script not found: ${script_path}${NC}"
        echo -e "${YELLOW}   Skipping ${script_name}...${NC}"
        RESULTS+=("SKIPPED:$script_name:Script not found:0")
        ((SKIPPED++))
        return
    fi
    
    # Run the script
    echo -e "${GREEN}▶️ Executing: npx tsx ${script_file}${NC}"
    echo ""
    
    local exit_code=0
    local duration=0
    
    if [[ "$VERBOSE" == "true" ]]; then
        # Run with full output
        cd "$PROJECT_ROOT"
        npx tsx "$script_path" || exit_code=$?
    else
        # Run with captured output
        cd "$PROJECT_ROOT"
        local output
        output=$(npx tsx "$script_path" 2>&1) || exit_code=$?
        
        if [[ $exit_code -ne 0 ]]; then
            echo -e "${RED}❌ Error output:${NC}"
            echo "$output"
        fi
    fi
    
    duration=$(($(date +%s) - start_time))
    
    if [[ $exit_code -eq 0 ]]; then
        echo ""
        echo -e "${GREEN}✅ ${script_name} completed successfully in ${duration}s${NC}"
        RESULTS+=("PASSED:$script_name::$duration")
        ((PASSED++))
    else
        echo ""
        echo -e "${RED}❌ ${script_name} failed with exit code ${exit_code}${NC}"
        RESULTS+=("FAILED:$script_name:Exit code $exit_code:$duration")
        ((FAILED++))
        
        if [[ "$CONTINUE_ON_FAILURE" != "true" ]]; then
            echo ""
            echo -e "${RED}🛑 Stopping validation sequence due to failure in ${script_name}${NC}"
            echo -e "${YELLOW}   Set CONTINUE_ON_FAILURE=true to continue on failures${NC}"
            generate_report
            exit 1
        fi
    fi
}

generate_report() {
    local total_duration=$(($(date +%s) - START_TIME))
    
    echo ""
    echo ""
    echo -e "${WHITE}$(printf '=%.0s' {1..80})${NC}"
    echo -e "${WHITE}📊 SHELL VALIDATION REPORT${NC}"
    echo -e "${WHITE}$(printf '=%.0s' {1..80})${NC}"
    echo -e "Report Generated: $(date)"
    echo -e "Total Execution Time: ${total_duration}s"
    echo ""
    
    # Summary statistics
    local success_rate=0
    if [[ $TOTAL_SCRIPTS -gt 0 ]]; then
        success_rate=$(( (PASSED * 100) / TOTAL_SCRIPTS ))
    fi
    
    echo -e "${WHITE}📈 SUMMARY STATISTICS${NC}"
    echo -e "${WHITE}$(printf '─%.0s' {1..40})${NC}"
    echo -e "Total Scripts: ${TOTAL_SCRIPTS}"
    echo -e "${GREEN}✅ Passed: ${PASSED}${NC}"
    echo -e "${RED}❌ Failed: ${FAILED}${NC}"
    echo -e "${YELLOW}⏭️ Skipped: ${SKIPPED}${NC}"
    echo -e "${CYAN}📊 Success Rate: ${success_rate}%${NC}"
    echo ""
    
    # Detailed results
    echo -e "${WHITE}📋 DETAILED RESULTS${NC}"
    echo -e "${WHITE}$(printf '─%.0s' {1..40})${NC}"
    
    local index=1
    for result in "${RESULTS[@]}"; do
        local status=$(echo "$result" | cut -d: -f1)
        local name=$(echo "$result" | cut -d: -f2)
        local error=$(echo "$result" | cut -d: -f3)
        local duration=$(echo "$result" | cut -d: -f4)
        
        local status_icon=""
        local color=""
        case "$status" in
            "PASSED")
                status_icon="✅"
                color="${GREEN}"
                ;;
            "FAILED")
                status_icon="❌"
                color="${RED}"
                ;;
            "SKIPPED")
                status_icon="⏭️"
                color="${YELLOW}"
                ;;
        esac
        
        echo -e "${index}. ${status_icon} ${name}"
        echo -e "   Status: ${color}${status}${NC}"
        echo -e "   Duration: ${duration}s"
        
        if [[ -n "$error" && "$error" != "" ]]; then
            echo -e "   Error: ${error}"
        fi
        
        echo ""
        ((index++))
    done
    
    # Recommendations
    echo -e "${WHITE}💡 RECOMMENDATIONS${NC}"
    echo -e "${WHITE}$(printf '─%.0s' {1..40})${NC}"
    
    if [[ $FAILED -eq 0 && $SKIPPED -eq 0 ]]; then
        echo -e "${GREEN}🎉 Perfect! All validations passed successfully.${NC}"
        echo ""
        echo -e "✨ Your token CRUD system is working correctly across all standards."
        echo ""
        echo -e "📈 Suggested next steps:"
        echo -e "  • Add these validations to your CI/CD pipeline"
        echo -e "  • Consider adding performance benchmarks"
        echo -e "  • Implement automated regression testing"
    else
        if [[ $FAILED -gt 0 ]]; then
            echo -e "${RED}❌ Failed validations require attention.${NC}"
            echo -e "  Review error messages above and fix issues."
        fi
        
        if [[ $SKIPPED -gt 0 ]]; then
            echo -e "${YELLOW}⏭️ Skipped scripts need implementation.${NC}"
            echo -e "  Create missing validation scripts for complete coverage."
        fi
        
        echo ""
        echo -e "🔧 Recommended actions:"
        echo -e "  1. Fix failed validations by reviewing error messages"
        echo -e "  2. Check database schema and connectivity"
        echo -e "  3. Verify all dependencies are installed"
        echo -e "  4. Run individual scripts for detailed debugging"
        echo -e "  5. Ensure test environment is properly configured"
    fi
    
    echo ""
    echo -e "${WHITE}🛠️ Available Environment Variables:${NC}"
    echo -e "  VERBOSE=true                 # Show detailed output"
    echo -e "  CONTINUE_ON_FAILURE=true     # Continue after failures"
    echo -e "  CLEANUP_TEST_DATA=false      # Keep test data for debugging"
    echo ""
}

main() {
    print_header
    
    echo ""
    echo -e "${CYAN}🚀 Starting Sequential Token CRUD Validation...${NC}"
    
    for script_info in "${SCRIPTS[@]}"; do
        run_validation "$script_info"
        
        # Brief pause between validations
        sleep 1
    done
    
    generate_report
    
    # Exit with appropriate code
    if [[ $FAILED -gt 0 ]]; then
        echo -e "${RED}❌ Some validations failed. See report above for details.${NC}"
        exit 1
    else
        echo -e "${GREEN}🎉 All validations completed successfully!${NC}"
        exit 0
    fi
}

# Run main function
main "$@"
