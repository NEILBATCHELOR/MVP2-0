#!/bin/bash

# This script generates type mappers for all missing domain types
# Run it after fixing type inconsistencies with npm run types:fix-inconsistencies

echo "Starting to generate all missing type mappers..."

echo "Generating mapper for BaseModel..."
npm run types:generate-mapper -- --table=base_model --domain=BaseModel
sleep 1

echo "Generating mapper for User..."
npm run types:generate-mapper -- --table=user --domain=User
sleep 1

echo "Generating mapper for Project..."
npm run types:generate-mapper -- --table=project --domain=Project
sleep 1

echo "Generating mapper for Address..."
npm run types:generate-mapper -- --table=address --domain=Address
sleep 1

echo "Generating mapper for LegalRepresentative..."
npm run types:generate-mapper -- --table=legal_representative --domain=LegalRepresentative
sleep 1

echo "Generating mapper for RiskAssessment..."
npm run types:generate-mapper -- --table=risk_assessment --domain=RiskAssessment
sleep 1

echo "Generating mapper for InvestmentPreferences..."
npm run types:generate-mapper -- --table=investment_preferences --domain=InvestmentPreferences
sleep 1

echo "Generating mapper for DocumentRequirement..."
npm run types:generate-mapper -- --table=document_requirement --domain=DocumentRequirement
sleep 1

echo "Generating mapper for InvestorWithDetails..."
npm run types:generate-mapper -- --table=investor_with_details --domain=InvestorWithDetails
sleep 1

echo "Generating mapper for BaseSubscription..."
npm run types:generate-mapper -- --table=base_subscription --domain=BaseSubscription
sleep 1

echo "Generating mapper for BaseRedemptionRequest..."
npm run types:generate-mapper -- --table=base_redemption_request --domain=BaseRedemptionRequest
sleep 1

echo "Generating mapper for BaseTokenAllocation..."
npm run types:generate-mapper -- --table=base_token_allocation --domain=BaseTokenAllocation
sleep 1

echo "Generating mapper for Approver..."
npm run types:generate-mapper -- --table=approver --domain=Approver
sleep 1

echo "Generating mapper for RedemptionWindow..."
npm run types:generate-mapper -- --table=redemption_window --domain=RedemptionWindow
sleep 1

echo "Generating mapper for ActivityLog..."
npm run types:generate-mapper -- --table=activity_log --domain=ActivityLog
sleep 1

echo "Generating mapper for Wallet..."
npm run types:generate-mapper -- --table=wallet --domain=Wallet
sleep 1

echo "Generating mapper for TokenBalance..."
npm run types:generate-mapper -- --table=token_balance --domain=TokenBalance
sleep 1

echo "Generating mapper for Transaction..."
npm run types:generate-mapper -- --table=transaction --domain=Transaction
sleep 1

echo "Generating mapper for MultiSigTransaction..."
npm run types:generate-mapper -- --table=multi_sig_transaction --domain=MultiSigTransaction
sleep 1

echo "Generating mapper for Invoice..."
npm run types:generate-mapper -- --table=invoice --domain=Invoice
sleep 1

echo "Generating mapper for InvoiceItem..."
npm run types:generate-mapper -- --table=invoice_item --domain=InvoiceItem
sleep 1

echo "Generating mapper for WorkflowStage..."
npm run types:generate-mapper -- --table=workflow_stage --domain=WorkflowStage
sleep 1

echo "Generating mapper for Token..."
npm run types:generate-mapper -- --table=token --domain=Token
sleep 1

echo "Generating mapper for TokenERC20Properties..."
npm run types:generate-mapper -- --table=token_e_r_c20_properties --domain=TokenERC20Properties
sleep 1

echo "Generating mapper for TokenERC721Properties..."
npm run types:generate-mapper -- --table=token_e_r_c721_properties --domain=TokenERC721Properties
sleep 1

echo "Generating mapper for TokenERC721Attribute..."
npm run types:generate-mapper -- --table=token_e_r_c721_attribute --domain=TokenERC721Attribute
sleep 1

echo "Generating mapper for TokenERC1155Properties..."
npm run types:generate-mapper -- --table=token_e_r_c1155_properties --domain=TokenERC1155Properties
sleep 1

echo "Generating mapper for TokenERC1155Type..."
npm run types:generate-mapper -- --table=token_e_r_c1155_type --domain=TokenERC1155Type
sleep 1

echo "Generating mapper for TokenERC1155Balance..."
npm run types:generate-mapper -- --table=token_e_r_c1155_balance --domain=TokenERC1155Balance
sleep 1

echo "Generating mapper for TokenERC1155UriMapping..."
npm run types:generate-mapper -- --table=token_e_r_c1155_uri_mapping --domain=TokenERC1155UriMapping
sleep 1

echo "Generating mapper for TokenERC1400Properties..."
npm run types:generate-mapper -- --table=token_e_r_c1400_properties --domain=TokenERC1400Properties
sleep 1

echo "Generating mapper for TokenERC1400Partition..."
npm run types:generate-mapper -- --table=token_e_r_c1400_partition --domain=TokenERC1400Partition
sleep 1

echo "Generating mapper for TokenERC1400Controller..."
npm run types:generate-mapper -- --table=token_e_r_c1400_controller --domain=TokenERC1400Controller
sleep 1

echo "Generating mapper for TokenERC3525Properties..."
npm run types:generate-mapper -- --table=token_e_r_c3525_properties --domain=TokenERC3525Properties
sleep 1

echo "Generating mapper for TokenERC3525Slot..."
npm run types:generate-mapper -- --table=token_e_r_c3525_slot --domain=TokenERC3525Slot
sleep 1

echo "Generating mapper for TokenERC3525Allocation..."
npm run types:generate-mapper -- --table=token_e_r_c3525_allocation --domain=TokenERC3525Allocation
sleep 1

echo "Generating mapper for TokenERC4626Properties..."
npm run types:generate-mapper -- --table=token_e_r_c4626_properties --domain=TokenERC4626Properties
sleep 1

echo "Generating mapper for TokenERC4626StrategyParam..."
npm run types:generate-mapper -- --table=token_e_r_c4626_strategy_param --domain=TokenERC4626StrategyParam
sleep 1

echo "Generating mapper for TokenERC4626AssetAllocation..."
npm run types:generate-mapper -- --table=token_e_r_c4626_asset_allocation --domain=TokenERC4626AssetAllocation
sleep 1

echo "Generating mapper for TokenVersion..."
npm run types:generate-mapper -- --table=token_version --domain=TokenVersion
sleep 1

echo "Generating mapper for VersionDiff..."
npm run types:generate-mapper -- --table=version_diff --domain=VersionDiff
sleep 1

echo "Generating mapper for TokenDeployment..."
npm run types:generate-mapper -- --table=token_deployment --domain=TokenDeployment
sleep 1

echo "Generating mapper for TokenOperation..."
npm run types:generate-mapper -- --table=token_operation --domain=TokenOperation
sleep 1

echo "Generating mapper for TokenTemplate..."
npm run types:generate-mapper -- --table=token_template --domain=TokenTemplate
sleep 1

echo "Generating mapper for TokenDesign..."
npm run types:generate-mapper -- --table=token_design --domain=TokenDesign
sleep 1

echo "Generating mapper for TokenDocument..."
npm run types:generate-mapper -- --table=token_document --domain=TokenDocument
sleep 1

echo "Generating mapper for InvestorDocument..."
npm run types:generate-mapper -- --table=investor_document --domain=InvestorDocument
sleep 1

echo "Generating mapper for IssuerDocument..."
npm run types:generate-mapper -- --table=issuer_document --domain=IssuerDocument
sleep 1

echo "All type mappers have been generated!"
echo "Run npm run types:validate to check if all issues have been resolved." 