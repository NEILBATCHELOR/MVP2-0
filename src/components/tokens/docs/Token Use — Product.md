# Token Use —> Product

Date: March 19, 2025 2:20 PM
Status: Not started

Here's the simplified ERC-standard configuration clearly reproduced in tabular form, with compelling reasons for each selection:

| Asset Type | Primary ERC Structure | Alternative ERC Structure | Compelling Reason |
| --- | --- | --- | --- |
| **Structured Products** | ERC-1400 → ERC-20 | ERC-1400 + ERC-3525 → ERC-20 | Regulatory compliance, issuer control, liquidity |
| **Equity** | ERC-1400 → ERC-20 | ERC-1400 + ERC-3525 → ERC-20 | Simple compliance, investor governance, liquidity |
| **Commodities** | ERC-1155 → ERC-20 | ERC-20 directly (purely fungible commodities) | Batch efficiency, fractionalization, tradability |
| **Funds, ETFs, ETPs** | ERC-1400 + ERC-4626 → ERC-20 | ERC-4626 → ERC-20 (if minimal compliance) | Automated yield management, NAV clarity, compliance |
| **Bonds** | ERC-1400 → ERC-20 | ERC-1400 + ERC-3525 → ERC-20 | Clear issuer control, compliance, easy market liquidity |
| **Quantitative Strategies** | ERC-1400 + ERC-4626 → ERC-20 | ERC-4626 → ERC-20 (if minimal compliance) | Efficient management, compliance, yield integration |
| **Private Equity** | ERC-1400 → ERC-20 | ERC-1400 + ERC-3525 → ERC-20 | Regulatory adherence, investor restrictions, fractional liquidity |
| **Private Debt** | ERC-1400 → ERC-20 | ERC-1400 + ERC-3525 → ERC-20 | Issuer-controlled compliance, fractional tradability |
| **Real Estate** | ERC-1400 + ERC-3525 → ERC-20 | ERC-1400 → ERC-20 (simpler fractionalization) | Flexible fractional ownership, strong compliance controls |
| **Energy** | ERC-1400 + ERC-1155 → ERC-20 | ERC-1400 → ERC-20 (simple issuance) | Batch management, compliance, efficient market trading |
| **Infrastructure** | ERC-1400 + ERC-3525 → ERC-20 | ERC-1400 → ERC-20 (if no differentiation needed) | Compliance for large-scale projects, flexible fractionalization |
| **Collectibles & Other Assets** | ERC-721 / ERC-1155 → ERC-20 | ERC-721 → ERC-20 (for highly unique assets) | Clear uniqueness, fractional tradability |
| **Digital Tokenized Fund** | ERC-1400 + ERC-4626 → ERC-20 | ERC-4626 → ERC-20 (minimal compliance scenarios) | Efficient yield management, compliance, seamless trading |

---

### Explanation of Arrows ("→"):

- Indicates token issuance and compliance managed by the initial ERC-standard.
- Tokens can then be wrapped into ERC-20 for liquidity, tradability, and seamless integration with exchanges or decentralized finance protocols.

This table clearly summarizes the simplified structure for optimal regulatory compliance, operational efficiency, and seamless liquidity for each asset category.