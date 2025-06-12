1\) Redemptions (Token Buyback & Asset Payout)

sequenceDiagram

participant Investor

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

Investor-\>\>+ChainCapital: Submit redemption request

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate eligibility

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject redemption

GuardianPolicyEnforcement-\>\>+GuardianWallet: Initiate fund settlement

GuardianWallet-\>\>+Blockchain: Burn redeemed tokens, update cap table

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Investor: Confirm redemption & settlement

2\) Minting & Burning Tokens

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

Issuer-\>\>+ChainCapital: Request minting/burning

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate request

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject mint/burn

GuardianPolicyEnforcement-\>\>+GuardianWallet: Execute mint/burn
transaction

GuardianWallet-\>\>+Blockchain: Record mint/burn event, update cap table

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Issuer: Notify mint/burn completion

3\) Pausing & Locking Tokens

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

participant Investor

Issuer-\>\>+ChainCapital: Request pause/lock action

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate request

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject pause/lock

GuardianPolicyEnforcement-\>\>+GuardianWallet: Enforce restriction

GuardianWallet-\>\>+Blockchain: Record pause/lock event

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Issuer: Notify action completion

GuardianWallet\--\>\>Investor: Notify impacted investors of the
restriction

4\) Blocking & Unblocking Tokens

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

participant Investor

Issuer-\>\>+ChainCapital: Request to block/unblock an investor

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate compliance
restrictions

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject
block/unblock

GuardianPolicyEnforcement-\>\>+GuardianWallet: Enforce block/unblock
action

GuardianWallet-\>\>+Blockchain: Update investor whitelist & cap table

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Issuer: Notify block/unblock completion

GuardianWallet\--\>\>Investor: Notify affected investor of status change

5\) Force Transfers

sequenceDiagram

participant Issuer

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant GuardianWallet

participant Blockchain

participant Investor

Issuer-\>\>+ChainCapital: Request forced transfer

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate request for
compliance

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject forced
transfer

GuardianPolicyEnforcement-\>\>+GuardianWallet: Execute forced transfer

GuardianWallet-\>\>+Blockchain: Record forced transfer transaction

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Issuer: Notify forced transfer completion

GuardianWallet\--\>\>Investor: Notify affected investor of forced
transfer

6\) Conditional Transfers

sequenceDiagram

participant Investor

participant ChainCapital

participant GuardianPolicyEnforcement

participant MultiSigApprovers

participant Oracle

participant GuardianWallet

participant Blockchain

participant DestinationAddress-Party

Investor-\>\>+ChainCapital: Initiate token transfer

ChainCapital-\>\>+GuardianPolicyEnforcement: Validate transfer
conditions

GuardianPolicyEnforcement-\>\>+Oracle: Request Oracle validation

Oracle\--\>\>GuardianPolicyEnforcement: Provide external condition data

GuardianPolicyEnforcement-\>\>+MultiSigApprovers: Request
multi-signature approval

MultiSigApprovers\--\>\>GuardianPolicyEnforcement: Approval granted

GuardianPolicyEnforcement\--\>\>ChainCapital: Approve/reject transfer

GuardianPolicyEnforcement-\>\>+GuardianWallet: Execute conditional
transfer

GuardianWallet-\>\>+Blockchain: Record transfer event, update cap table

Blockchain\--\>\>GuardianWallet: Confirm execution

GuardianWallet\--\>\>Investor: Notify of transfer completion

GuardianWallet\--\>\>DestinationAddress-Party: Notify recipient of
incoming transfer
