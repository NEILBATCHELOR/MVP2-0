**Issuance Module: Replace the BackOffice Tab with RBAC**

**Function: (Role-Based Access & Invitation Management Tab) (only after
one owner has onboarded)**

This tab or step in the issuance process will handle user role
assignments, invitations, and key generation.

**Functional Overview**

**Invite Users to the System**

Input: Name, Email, Role Selection (Dropdown)

Actions:

Send an invite email with an auto-generated password.

Allow multiple invites (nested configuration).

Revoke or re-invite users if needed.

**Role-Based Access Assignment**

**Owner**: Full control over token settings and issuance.

**Agents**: Manage investors but cannot modify the contract.

**Compliance Officers**: Approve/reject investor applications.

Multiple users per role (add/remove functionality).

**Auto-Generate Credentials**

System generates:

A **temporary password** for login (forced reset on first login).

A **cryptographic key** upon invite acceptance for signing actions.

**Cryptographic Key Management**

Upon invite acceptance:

A **key pair** is generated for signing approved transactions.

Users receive a **private signing key** (e.g., via a secure channel).

Admins can view the **public key** for verification.

**User Management & UI Controls**

**Add User** Button: Opens a modal to enter name, email, and role.

**Remove User** Button: Deletes a user from the system.

**Revoke/Re-invite** Button: Resends the invitation email.

**View Public Key** Button: Displays a user[']{dir="rtl"}s verification
key.

**Role Reassignment**: Modify roles after assignment if needed.

**User Flow & Interaction**

**Step 1: Inviting Users**

1.  **Admin navigates to \"Role-Based Access & Invitation
    Management\".**

2.  **Clicks \"Add User\" → Modal opens:**

    - Enter **Name** and **Email**.

    - Select **Role** from a dropdown.

    - Click \"Send Invitation\".

<!-- -->

3.  **System Actions:**

    - Generates a **temporary password**.

    - Sends an **invite email** with login credentials.

    - Waits for user acceptance.

**Step 2: User Accepts Invitation**

1.  **User clicks on invite link, logs in using the auto-generated
    password.**

2.  **System prompts password reset.**

3.  **System generates a cryptographic key pair.**

    - **Private Key** shared securely.

    - **Public Key** stored for verification.

**Step 3: Managing Users**

Admins can **add or remove users**.

Admins can **view assigned roles & public keys**.

Admins can **revoke or resend invites**.

**Technical Considerations**

1.  **Database Storage:**

    1.  Store **user details** (Name, Email, Role).

    2.  Store **hashed passwords** (not plaintext).

    3.  Store **public keys** (for verification).

    4.  Track **invite status** (pending, accepted, revoked).

<!-- -->

2.  **Security & Cryptographic Key Generation**

    1.  Use **RSA, ECDSA, or Ed25519** for key pair generation.

    2.  Securely distribute **private keys** (e.g., user dashboard,
        email encryption).

    3.  Store only **public keys** for verification.

<!-- -->

3.  **API Endpoints**

    - POST /invite-user → Sends invite email with role.

    - POST /accept-invite → Confirms invite, triggers key generation.

    - GET /list-users → Fetches users & roles.

    <!-- -->

    - DELETE /remove-user/:id → Revokes access.

    - PUT /update-role/:id → Modifies role.

**Wireframe UI Outline**

**Role-Based Access Management Tab**

  ----------- ------------------- ---------------- ------------ -----------------
   **Name**        **Email**          **Role**      **Status**     **Actions**

   John Doe    john@example.com        Owner         Accepted    🔑 View Public
                                                                       Key

  Jane Smith   jane@example.com      Compliance      Pending    🔄 Resend Invite
                                      Officer                   

     Alice     alice@example.com       Agent         Accepted    🔑 View Public
    Johnson                                                            Key

   **\[+ Add                                                    
   User\]**                                                     
  ----------- ------------------- ---------------- ------------ -----------------

**Buttons & Actions:**

**\[+ Add User\]** → Opens modal for name, email, role selection.

🔄 **Resend Invite** → Resends invite if pending.

🔑 **View Public Key** → Displays cryptographic key for verification.

✏ **Edit** → Allows role reassignment.

❌ **Remove** → Revokes user access.

**Expanded Admin Permissions for Role-Based Access Management**

To enhance security and flexibility, admins should have additional
controls over **role management, user privileges, cryptographic keys,
and activity tracking**. Below is an expanded specification to
incorporate advanced permissions.

**Enhanced Admin Permissions & Controls**

**1. Role Hierarchy & Administrative Controls**

Admins should be able to **define and manage permissions** for different
roles beyond simple role assignment.

**New Role Levels**

**Super Admin**

Full control over all system settings, including security and user
management.

Can create, delete, and modify **all roles**.

Has the ability to **suspend accounts**, **revoke access**, and **reset
keys**.

**Owner (Default Admin Role)**

Can manage **token settings**, **issuance configurations**, and **user
invitations**.

Cannot remove a **Super Admin**.

Cannot modify cryptographic security settings.

**Compliance Manager (Elevated Compliance Role)**

Manages investor applications and approvals.

Can suspend investors but **cannot modify system-wide compliance
settings**.

**Agents** (No Change)

Manage investors but cannot modify contract/token settings.

**Compliance Officers** (No Change)

Approve or reject investor applications.

**Custom Roles (Optional)**

Super Admins can create additional roles with specific permissions.

**2. Expanded Admin Features**

Admins will now have additional **control options** in the Role-Based
Access Management tab.

**A. Advanced User Management**

**Search & Filter Users**: Search by name, email, role, or status.

**Bulk Actions**: Select multiple users to revoke access, reassign
roles, or reset passwords.

**User Suspension**: Temporarily suspend a user instead of deleting
them.

**Activity Logs**: View historical actions taken by each user (e.g.,
approvals, transactions, logins).

**B. Cryptographic Key Controls**

**View Public Keys**: Only **Super Admins and Owners** can see public
keys of users.

**Revoke & Reissue Keys**: If a private key is compromised, **Super
Admins** can revoke access and force regeneration.

**Enforce Key Rotation**: Option to require users to rotate
cryptographic keys after a set period.

**C. Security & Access Logs**

- **Audit Log Tracking**:

  - Tracks all **role changes, key generation, approvals, and critical
    actions**.

  - Available only to **Super Admins and Owners**.

  - Can be exported for compliance records.

- **Real-Time Access Monitoring**:

  - Admins can see **who is logged in**, last activity timestamps, and
    active sessions.

  - Can force **logouts of compromised accounts**.

**3. New UI Controls for Admin Permissions**

The **Role-Based Access Management Tab** will now have an **\"Advanced
Admin Panel\"**, only visible to **Super Admins & Owners**.

  ---------- ------------------- --------------- ------------ ---------- -------------
   **Name**       **Email**         **Role**      **Status**   **Public   **Actions**
                                                                Key**    

   John Doe   john@example.com     Super Admin      Active     🔑 View      ✏ Edit

  Jane Smith  jane@example.com     Compliance     Suspended   ❌ Revoked 🔄 Reset Key
                                     Officer                             

    Alice     alice@example.com       Agent         Active     🔑 View      ✏ Edit
   Johnson                                                               

  **\[+ Add                                                              
   User\]**                                                              
  ---------- ------------------- --------------- ------------ ---------- -------------

**4. New API Endpoints for Admin Features**

To support these expanded permissions, the backend will require new API
endpoints:

  ------------------ ------------ ------------------------- ------------------
      **Action**      **Method**        **Endpoint**        **Required Role**

     Invite User         POST           /invite-user        Owner, Super Admin

  Accept Invitation      POST          /accept-invite           All users

    Revoke Access       DELETE        /revoke-user/:id      Super Admin, Owner

     Suspend User       PATCH         /suspend-user/:id        Super Admin

     Generate Key        POST         /generate-key/:id      System Automated

      Rotate Key         PUT           /rotate-key/:id         Super Admin

  View User Activity     GET         /activity-logs/:id     Super Admin, Owner

     View Active         GET          /active-sessions         Super Admin
       Sessions                                             

     Force Logout        POST         /force-logout/:id     Super Admin, Owner
  ------------------ ------------ ------------------------- ------------------

**5. User Flow with Expanded Admin Capabilities**

**Step 1: Super Admin Defines Roles**

Navigates to \"Advanced Admin Panel\".

Clicks **\"Manage Roles & Permissions\"**.

Creates custom roles or modifies existing ones.

**Step 2: Inviting a New User with Permissions**

Admin navigates to \"Role-Based Access Management\".

Clicks **\"Add User\"**.

Fills in:

- **Name & Email**.

- **Assigns Role** (Owner, Agent, Compliance Officer, etc.).

- **Enforces Key Signing?** (Yes/No).

  Clicks **\"Send Invitation\"**.

**Step 3: User Accepts and Key is Generated**

User clicks invite link, logs in with auto-generated password.

System prompts password reset.

**Cryptographic key is generated** upon acceptance.

If the user role requires key signing, a **private key is shared
securely**.

**Step 4: Admin Management**

**Monitor Activity Logs**.

**Suspend Users if Necessary**.

**Rotate or Revoke Keys** if needed.

**Force Logout Users** from active sessions.

**6. Security Considerations**

- **Role Escalation Protections**:

  - A **Super Admin cannot be deleted** without another Super
    Admin[']{dir="rtl"}s approval.

  - Users **cannot self-assign** higher roles.

- **Key Management Security**:

  - **Private keys** are **never stored in plaintext**.

  - **Revoked keys** are immediately invalidated in the system.

- **Audit & Compliance**:

  - Actions such as **role modifications, approvals, and key rotations**
    are logged with timestamps.

  - Compliance reports can be **exported for regulatory review**.

**Enhanced Role-Based Access Control (RBAC) with 2-of-3 Consensus &
Policy-Driven Automation**

Expanding on the Role-Based Access Management System, this enhancement
introduces multi-signature policy enforcement with a 2-of-3 consensus
mechanism for critical actions and policy-driven automation based on
pre-configured rules.

**1. Multi-Signature Policy Enforcement (2-of-3 Consensus)**

For high-impact actions, the system will require two out of three
designated approvers (e.g., Super Admin, Compliance Manager, or Owner)
to approve or cryptographically sign the request before execution.

**Key Features**

- Two of three approvers must sign off on defined sensitive actions.

- Cryptographic Signatures (ECDSA, Ed25519, or MPC-based TSS) enforce
  approvals.

- If two approvers sign, the action is automatically executed.

- Automation via Pre-Defined Policies:

  - If pre-set conditions are met, approvals can be automated based on
    predefined logic.

  - The system will trigger automated approvals without human
    intervention where policies allow.

**2. Policy-Driven Automation**

Admins can define approval policies that automate certain actions based
on preset conditions.

**Examples of Policy-Based Automations**

  --------------- ------------------------------------ ------------------
    **Action**          **Policy-Driven Approval       **Requires 2-of-3
                              Conditions**                Consensus?**

     Investor          If KYC & AML are verified,      ❌ (Policy-Based)
     Approval                 auto-approve             

  Token Transfer      If within compliance limits,     ❌ (Policy-Based)
                              auto-approve             

  Fund Redemption If redemption rules met & liquidity    ✅ (Multi-Sig
                        available, auto-approve            Required)

   Key Rotation    Only auto-rotate if within last 6     ✅ (Multi-Sig
                                 months                    Required)

  Smart Contract    Always requires 2-of-3 approval      ✅ (Mandatory
      Upgrade                                              Multi-Sig)

       Role        Requires two signers unless it's a    ✅ (Multi-Sig
   Reassignment                downgrade                   Required)
  --------------- ------------------------------------ ------------------

**3. Expanded User Roles with Policy-Based Approval Authority**

The system now includes **three designated policy enforcers** to approve
transactions and high-risk actions:

  -------------- ----------------------- ----------------------------------
     **Role**          **Multi-Sig                **Permissions**
                     Requirement?**      

     **Super       Always required for   Full control over system, security
     Admin**       governance actions         settings, and user roles

    **Owner**    Required for high-risk  Manages token settings, issuance,
                    financial actions              and compliance

   **Compliance  Required for regulatory  Approves KYC, AML, and investor
    Manager**            actions                     onboarding

   **Compliance            No            Approves investor applications but
    Officer**                                 cannot override policies

    **Agent**              No               Manages investors but has no
                                                  approval rights
  -------------- ----------------------- ----------------------------------

**Key Rules for Consensus Approval**

- **Super Admin, Owner, and Compliance Manager** are the designated
  approvers.

- If an action **meets policy conditions**, it **can be automated**.

- If not automated, it **must be approved by 2 out of 3 signers**.

**4. Expanded UI for Policy & Multi-Sig Management**

A new **\"Policy & Approval Rules\"** tab will allow configuration of
automation and consensus requirements.

**A. Approval Flow Dashboard**

  -------------- --------------- --------------- ------------- ------------ --------------
    **Action**    **Initiator**    **Status**     **Approvers   **Approved   **Approve /
                                                  Required**       By**        Reject**

  Smart Contract      Admin          Pending        2 of 3       None Yet    ✅ Approve /
     Upgrade                                                                  ❌ Reject

     Investor      Compliance     Auto-Approved        0          System          \-
    Onboarding       Officer                                      Policy    

  Token Transfer      Agent          Pending        2 of 3       Owner ✅    ✅ Approve /
                                                                              ❌ Reject

   Key Rotation      System       Auto-Approved        0          System          \-
                                                                  Policy    
  -------------- --------------- --------------- ------------- ------------ --------------

**B. Policy Configuration Panel**

Toggle 2-of-3 approval per action type.

Set automation thresholds (e.g., auto-approve token transfers under
\$500k).

Define enforcement roles (assign approvers for specific actions).

Log past approvals & signatures.

**5. Cryptographic Approval & Signature Flow**

Admin initiates an action (e.g., fund redemption).

System checks policy rules:

If policy allows auto-approval, action is executed.

If manual approval is required, system requests 2-of-3 multi-signatures.

Approvers receive approval request (via UI, email, or wallet signing
request).

Two of the three designated signers approve the action using
cryptographic keys.

System executes the transaction on-chain.

**Security Measures:**

Digital signatures stored on-chain for verification.

Timeout-based auto-rejection if approval is not received within a set
timeframe.

**6. API Endpoints for Multi-Sig & Policy Management**

  --------------- ------------ --------------------------- --------------------------
    **Action**     **Method**         **Endpoint**             **Required Role**

      Request         POST      /request-approval/:action        Any Initiator
     Approval                                              

  Approve Action      POST        /approve/:action/:id        Owner, Super Admin,
                                                               Compliance Manager

   Reject Action      POST         /reject/:action/:id        Owner, Super Admin,
                                                               Compliance Manager

    Get Pending       GET          /pending-approvals             Any Approver
     Approvals                                             

   Get Approval       GET           /approval-history             Super Admin
      History                                              

     Configure        POST          /configure-policy             Super Admin
   Policy Rules                                            

      Enable          POST          /set-auto-approve             Super Admin
   Auto-Approval                                           
  --------------- ------------ --------------------------- --------------------------

**7. Security Enhancements**

- Threshold Signature Scheme (TSS) Support:

  - Eliminates need for a single point of key failure.

  - Distributed key signing ensures robust security.

- MPC (Multi-Party Computation) Signing for High-Security Actions:

  - Smart contract upgrades require threshold key approval.

- Customisable Governance Rules:

  - Owners can change the 2-of-3 structure to 3-of-4 or more.

  - Different actions can have different consensus thresholds.

**8. Final Workflow for Policy & Multi-Sig Enforcement**

**Step 1: Defining Policy Rules**

Super Admin navigates to \"Policy & Approval Rules\".

Configures:

Actions requiring 2-of-3 consensus.

Actions eligible for automation.

Roles allowed to approve specific requests.

**Step 2: Initiating an Action**

1.  A user (e.g., Agent) submits an action request.

2.  System checks policy conditions:

    - If rules allow auto-approval, action is executed.

    - Otherwise, 2-of-3 approval is triggered.

**Step 3: Multi-Signature Approval**

The three designated approvers receive an approval request.

Two of the three signers must cryptographically sign.

System verifies threshold is met.

Action is executed on-chain.

**Step 4: Execution & Logging**

- Action is executed immediately upon approval.

- All approvals and rejections are stored in logs.

- Audit logs track:

  - Who requested

  - Short description of request

  - Who approved or rejected.

  - Time and date of action.

  - Categorised action

  - Cryptographic proof of approval.

  - Export to csv.
