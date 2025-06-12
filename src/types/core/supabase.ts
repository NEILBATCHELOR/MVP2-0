export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          assignee: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          service: string
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          service: string
          severity: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          service?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      approval_config_approvers: {
        Row: {
          approval_config_id: string
          approver_role_id: string | null
          approver_type: string
          approver_user_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_required: boolean | null
          order_priority: number | null
          updated_at: string | null
        }
        Insert: {
          approval_config_id: string
          approver_role_id?: string | null
          approver_type: string
          approver_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_required?: boolean | null
          order_priority?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_config_id?: string
          approver_role_id?: string | null
          approver_type?: string
          approver_user_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_required?: boolean | null
          order_priority?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_config_approvers_approval_config_id_fkey"
            columns: ["approval_config_id"]
            isOneToOne: false
            referencedRelation: "approval_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_config_approvers_approval_config_id_fkey"
            columns: ["approval_config_id"]
            isOneToOne: false
            referencedRelation: "approval_configs_with_approvers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_config_approvers_approver_role_id_fkey"
            columns: ["approver_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_config_approvers_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_config_approvers_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_config_approvers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_config_approvers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_config_history: {
        Row: {
          approval_config_id: string
          change_reason: string | null
          change_type: string
          changed_by: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          approval_config_id: string
          change_reason?: string | null
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          approval_config_id?: string
          change_reason?: string | null
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_config_history_approval_config_id_fkey"
            columns: ["approval_config_id"]
            isOneToOne: false
            referencedRelation: "approval_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_config_history_approval_config_id_fkey"
            columns: ["approval_config_id"]
            isOneToOne: false
            referencedRelation: "approval_configs_with_approvers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_config_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_config_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_configs: {
        Row: {
          active: boolean | null
          approval_mode: string | null
          auto_approval_conditions: Json | null
          auto_approve_threshold: number | null
          config_description: string | null
          config_name: string | null
          consensus_type: string
          created_at: string | null
          created_by: string | null
          eligible_roles: string[]
          escalation_config: Json | null
          id: string
          last_modified_by: string | null
          notification_config: Json | null
          permission_id: string
          required_approvals: number
          requires_all_approvers: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          approval_mode?: string | null
          auto_approval_conditions?: Json | null
          auto_approve_threshold?: number | null
          config_description?: string | null
          config_name?: string | null
          consensus_type?: string
          created_at?: string | null
          created_by?: string | null
          eligible_roles: string[]
          escalation_config?: Json | null
          id?: string
          last_modified_by?: string | null
          notification_config?: Json | null
          permission_id: string
          required_approvals?: number
          requires_all_approvers?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          approval_mode?: string | null
          auto_approval_conditions?: Json | null
          auto_approve_threshold?: number | null
          config_description?: string | null
          config_name?: string | null
          consensus_type?: string
          created_at?: string | null
          created_by?: string | null
          eligible_roles?: string[]
          escalation_config?: Json | null
          id?: string
          last_modified_by?: string | null
          notification_config?: Json | null
          permission_id?: string
          required_approvals?: number
          requires_all_approvers?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_configs_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_configs_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          action: string
          approved_by: string[]
          approvers: string[]
          created_at: string | null
          id: string
          metadata: Json | null
          rejected_by: string[]
          requested_by: string
          required_approvals: number
          resource: string
          resource_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          action: string
          approved_by?: string[]
          approvers: string[]
          created_at?: string | null
          id?: string
          metadata?: Json | null
          rejected_by?: string[]
          requested_by: string
          required_approvals?: number
          resource: string
          resource_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          approved_by?: string[]
          approvers?: string[]
          created_at?: string | null
          id?: string
          metadata?: Json | null
          rejected_by?: string[]
          requested_by?: string
          required_approvals?: number
          resource?: string
          resource_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          action_type: string | null
          api_version: string | null
          batch_operation_id: string | null
          category: string | null
          changes: Json | null
          correlation_id: string | null
          details: string | null
          duration: number | null
          entity_id: string | null
          entity_type: string | null
          id: string
          importance: number | null
          ip_address: string | null
          is_automated: boolean | null
          metadata: Json | null
          new_data: Json | null
          occurred_at: string | null
          old_data: Json | null
          parent_id: string | null
          project_id: string | null
          request_id: string | null
          session_id: string | null
          severity: string | null
          signature: string | null
          source: string | null
          status: string | null
          system_process_id: string | null
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
        }
        Insert: {
          action: string
          action_type?: string | null
          api_version?: string | null
          batch_operation_id?: string | null
          category?: string | null
          changes?: Json | null
          correlation_id?: string | null
          details?: string | null
          duration?: number | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          importance?: number | null
          ip_address?: string | null
          is_automated?: boolean | null
          metadata?: Json | null
          new_data?: Json | null
          occurred_at?: string | null
          old_data?: Json | null
          parent_id?: string | null
          project_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          signature?: string | null
          source?: string | null
          status?: string | null
          system_process_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          action?: string
          action_type?: string | null
          api_version?: string | null
          batch_operation_id?: string | null
          category?: string | null
          changes?: Json | null
          correlation_id?: string | null
          details?: string | null
          duration?: number | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          importance?: number | null
          ip_address?: string | null
          is_automated?: boolean | null
          metadata?: Json | null
          new_data?: Json | null
          occurred_at?: string | null
          old_data?: Json | null
          parent_id?: string | null
          project_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          signature?: string | null
          source?: string | null
          status?: string | null
          system_process_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      auth_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bulk_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_details: Json | null
          failed_count: number | null
          id: string
          metadata: Json | null
          operation_type: string | null
          processed_count: number | null
          progress: number | null
          status: string | null
          tags: string[] | null
          target_ids: string[] | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          failed_count?: number | null
          id?: string
          metadata?: Json | null
          operation_type?: string | null
          processed_count?: number | null
          progress?: number | null
          status?: string | null
          tags?: string[] | null
          target_ids?: string[] | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_details?: Json | null
          failed_count?: number | null
          id?: string
          metadata?: Json | null
          operation_type?: string | null
          processed_count?: number | null
          progress?: number | null
          status?: string | null
          tags?: string[] | null
          target_ids?: string[] | null
        }
        Relationships: []
      }
      cap_table_investors: {
        Row: {
          cap_table_id: string | null
          created_at: string | null
          id: string
          investor_id: string
        }
        Insert: {
          cap_table_id?: string | null
          created_at?: string | null
          id?: string
          investor_id: string
        }
        Update: {
          cap_table_id?: string | null
          created_at?: string | null
          id?: string
          investor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cap_table_investors_cap_table_id_fkey"
            columns: ["cap_table_id"]
            isOneToOne: false
            referencedRelation: "cap_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cap_table_investors_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
        ]
      }
      cap_tables: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cap_tables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_checks: {
        Row: {
          created_at: string
          id: string
          investor_id: string
          project_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: string
          risk_reason: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          investor_id: string
          project_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level: string
          risk_reason: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          investor_id?: string
          project_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string
          risk_reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_checks_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "compliance_checks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_reports: {
        Row: {
          created_at: string
          created_by: string
          findings: Json
          generated_at: string
          id: string
          issuer_id: string
          metadata: Json
          status: Database["public"]["Enums"]["compliance_status"]
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          findings?: Json
          generated_at?: string
          id?: string
          issuer_id: string
          metadata?: Json
          status?: Database["public"]["Enums"]["compliance_status"]
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          findings?: Json
          generated_at?: string
          id?: string
          issuer_id?: string
          metadata?: Json
          status?: Database["public"]["Enums"]["compliance_status"]
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      compliance_settings: {
        Row: {
          created_at: string
          id: string
          investor_count: number
          jurisdictions: string[] | null
          kyc_status: string
          minimum_investment: number
          organization_id: string
          require_accreditation: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          investor_count?: number
          jurisdictions?: string[] | null
          kyc_status?: string
          minimum_investment?: number
          organization_id: string
          require_accreditation?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          investor_count?: number
          jurisdictions?: string[] | null
          kyc_status?: string
          minimum_investment?: number
          organization_id?: string
          require_accreditation?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      consensus_settings: {
        Row: {
          consensus_type: string
          created_at: string
          eligible_roles: string[]
          id: string
          required_approvals: number
          updated_at: string
        }
        Insert: {
          consensus_type: string
          created_at?: string
          eligible_roles: string[]
          id?: string
          required_approvals: number
          updated_at?: string
        }
        Update: {
          consensus_type?: string
          created_at?: string
          eligible_roles?: string[]
          id?: string
          required_approvals?: number
          updated_at?: string
        }
        Relationships: []
      }
      credential_usage_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          credential_id: string
          id: string
          ip_address: string | null
          performed_at: string | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          credential_id: string
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          credential_id?: string
          id?: string
          ip_address?: string | null
          performed_at?: string | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credential_usage_logs_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "project_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      deployment_rate_limits: {
        Row: {
          completed_at: string | null
          environment: string | null
          id: string
          network: string | null
          project_id: string
          started_at: string
          status: string
          token_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          environment?: string | null
          id?: string
          network?: string | null
          project_id: string
          started_at?: string
          status: string
          token_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          environment?: string | null
          id?: string
          network?: string | null
          project_id?: string
          started_at?: string
          status?: string
          token_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      dfns_activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          organization_id: string | null
          status: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          organization_id?: string | null
          status: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          organization_id?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dfns_api_requests: {
        Row: {
          created_at: string | null
          endpoint: string
          error_message: string | null
          id: string
          method: string
          organization_id: string | null
          request_body: Json | null
          request_id: string | null
          response_body: Json | null
          response_time_ms: number | null
          status_code: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          organization_id?: string | null
          request_body?: Json | null
          request_id?: string | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          organization_id?: string | null
          request_body?: Json | null
          request_id?: string | null
          response_body?: Json | null
          response_time_ms?: number | null
          status_code?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dfns_applications: {
        Row: {
          app_id: string
          created_at: string | null
          description: string | null
          external_id: string | null
          id: string
          kind: string
          logo_url: string | null
          name: string
          organization_id: string | null
          origin: string | null
          privacy_policy_url: string | null
          relying_party: string | null
          status: string
          terms_of_service_url: string | null
          updated_at: string | null
        }
        Insert: {
          app_id: string
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          kind: string
          logo_url?: string | null
          name: string
          organization_id?: string | null
          origin?: string | null
          privacy_policy_url?: string | null
          relying_party?: string | null
          status?: string
          terms_of_service_url?: string | null
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          kind?: string
          logo_url?: string | null
          name?: string
          organization_id?: string | null
          origin?: string | null
          privacy_policy_url?: string | null
          relying_party?: string | null
          status?: string
          terms_of_service_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_broadcast_transactions: {
        Row: {
          broadcast_id: string
          created_at: string | null
          date_broadcast: string | null
          date_confirmed: string | null
          date_created: string
          dfns_broadcast_id: string
          error_message: string | null
          external_id: string | null
          id: string
          kind: string
          status: string
          transaction: string
          tx_hash: string | null
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          broadcast_id: string
          created_at?: string | null
          date_broadcast?: string | null
          date_confirmed?: string | null
          date_created?: string
          dfns_broadcast_id: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          kind: string
          status?: string
          transaction: string
          tx_hash?: string | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          broadcast_id?: string
          created_at?: string | null
          date_broadcast?: string | null
          date_confirmed?: string | null
          date_created?: string
          dfns_broadcast_id?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          kind?: string
          status?: string
          transaction?: string
          tx_hash?: string | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_broadcast_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "dfns_wallets"
            referencedColumns: ["wallet_id"]
          },
        ]
      }
      dfns_credentials: {
        Row: {
          algorithm: string
          attestation_type: string | null
          authenticator_info: Json | null
          created_at: string | null
          credential_id: string
          dfns_credential_id: string | null
          enrolled_at: string
          id: string
          kind: string
          last_used_at: string | null
          name: string | null
          public_key: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          algorithm: string
          attestation_type?: string | null
          authenticator_info?: Json | null
          created_at?: string | null
          credential_id: string
          dfns_credential_id?: string | null
          enrolled_at?: string
          id?: string
          kind: string
          last_used_at?: string | null
          name?: string | null
          public_key: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          algorithm?: string
          attestation_type?: string | null
          authenticator_info?: Json | null
          created_at?: string | null
          credential_id?: string
          dfns_credential_id?: string | null
          enrolled_at?: string
          id?: string
          kind?: string
          last_used_at?: string | null
          name?: string | null
          public_key?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dfns_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dfns_exchange_accounts: {
        Row: {
          account_id: string
          account_type: string
          created_at: string | null
          dfns_account_id: string | null
          exchange_integration_id: string | null
          id: string
          last_updated: string | null
          trading_enabled: boolean | null
          updated_at: string | null
          withdrawal_enabled: boolean | null
        }
        Insert: {
          account_id: string
          account_type: string
          created_at?: string | null
          dfns_account_id?: string | null
          exchange_integration_id?: string | null
          id?: string
          last_updated?: string | null
          trading_enabled?: boolean | null
          updated_at?: string | null
          withdrawal_enabled?: boolean | null
        }
        Update: {
          account_id?: string
          account_type?: string
          created_at?: string | null
          dfns_account_id?: string | null
          exchange_integration_id?: string | null
          id?: string
          last_updated?: string | null
          trading_enabled?: boolean | null
          updated_at?: string | null
          withdrawal_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_exchange_accounts_exchange_integration_id_fkey"
            columns: ["exchange_integration_id"]
            isOneToOne: false
            referencedRelation: "dfns_exchange_integrations"
            referencedColumns: ["integration_id"]
          },
        ]
      }
      dfns_exchange_balances: {
        Row: {
          account_id: string | null
          asset: string
          available: string
          created_at: string | null
          id: string
          last_updated: string | null
          locked: string
          total: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          asset: string
          available?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          locked?: string
          total?: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          asset?: string
          available?: string
          created_at?: string | null
          id?: string
          last_updated?: string | null
          locked?: string
          total?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_exchange_balances_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "dfns_exchange_accounts"
            referencedColumns: ["account_id"]
          },
        ]
      }
      dfns_exchange_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          credentials: Json
          dfns_exchange_id: string | null
          exchange_kind: string
          id: string
          integration_id: string
          last_sync_at: string | null
          name: string
          organization_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          credentials: Json
          dfns_exchange_id?: string | null
          exchange_kind: string
          id?: string
          integration_id: string
          last_sync_at?: string | null
          name: string
          organization_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          credentials?: Json
          dfns_exchange_id?: string | null
          exchange_kind?: string
          id?: string
          integration_id?: string
          last_sync_at?: string | null
          name?: string
          organization_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_fee_sponsors: {
        Row: {
          balance: string
          created_at: string | null
          dfns_sponsor_id: string | null
          external_id: string | null
          id: string
          name: string
          network: string
          organization_id: string | null
          spent_amount: string
          sponsor_address: string
          sponsor_id: string
          status: string
          transaction_count: number | null
          updated_at: string | null
        }
        Insert: {
          balance?: string
          created_at?: string | null
          dfns_sponsor_id?: string | null
          external_id?: string | null
          id?: string
          name: string
          network: string
          organization_id?: string | null
          spent_amount?: string
          sponsor_address: string
          sponsor_id: string
          status?: string
          transaction_count?: number | null
          updated_at?: string | null
        }
        Update: {
          balance?: string
          created_at?: string | null
          dfns_sponsor_id?: string | null
          external_id?: string | null
          id?: string
          name?: string
          network?: string
          organization_id?: string | null
          spent_amount?: string
          sponsor_address?: string
          sponsor_id?: string
          status?: string
          transaction_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_fiat_activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          error_details: Json | null
          id: string
          provider_data: Json | null
          status: string
          transaction_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          error_details?: Json | null
          id?: string
          provider_data?: Json | null
          status: string
          transaction_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          error_details?: Json | null
          id?: string
          provider_data?: Json | null
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dfns_fiat_activity_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "dfns_fiat_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      dfns_fiat_provider_configs: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          is_enabled: boolean | null
          provider: string
          supported_currencies: string[] | null
          supported_payment_methods: string[] | null
          updated_at: string | null
        }
        Insert: {
          configuration: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          provider: string
          supported_currencies?: string[] | null
          supported_payment_methods?: string[] | null
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          provider?: string
          supported_currencies?: string[] | null
          supported_payment_methods?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_fiat_quotes: {
        Row: {
          created_at: string | null
          estimated_processing_time: string | null
          exchange_rate: number
          expires_at: string
          fees: Json
          from_amount: number
          from_currency: string
          id: string
          payment_method: string
          provider: string
          to_amount: number
          to_currency: string
          type: string
        }
        Insert: {
          created_at?: string | null
          estimated_processing_time?: string | null
          exchange_rate: number
          expires_at: string
          fees: Json
          from_amount: number
          from_currency: string
          id?: string
          payment_method: string
          provider: string
          to_amount: number
          to_currency: string
          type: string
        }
        Update: {
          created_at?: string | null
          estimated_processing_time?: string | null
          exchange_rate?: number
          expires_at?: string
          fees?: Json
          from_amount?: number
          from_currency?: string
          id?: string
          payment_method?: string
          provider?: string
          to_amount?: number
          to_currency?: string
          type?: string
        }
        Relationships: []
      }
      dfns_fiat_transactions: {
        Row: {
          amount: number
          bank_account: Json | null
          created_at: string | null
          crypto_asset: string
          currency: string
          estimated_completion_time: string | null
          exchange_rate: Json | null
          expires_at: string | null
          fees: Json | null
          id: string
          metadata: Json | null
          organization_id: string | null
          payment_method: string | null
          payment_url: string | null
          project_id: string | null
          provider: string
          provider_transaction_id: string
          status: string
          tx_hash: string | null
          type: string
          updated_at: string | null
          user_id: string | null
          wallet_address: string
          wallet_id: string | null
          withdrawal_address: string | null
        }
        Insert: {
          amount: number
          bank_account?: Json | null
          created_at?: string | null
          crypto_asset: string
          currency: string
          estimated_completion_time?: string | null
          exchange_rate?: Json | null
          expires_at?: string | null
          fees?: Json | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          payment_method?: string | null
          payment_url?: string | null
          project_id?: string | null
          provider: string
          provider_transaction_id: string
          status: string
          tx_hash?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
          wallet_address: string
          wallet_id?: string | null
          withdrawal_address?: string | null
        }
        Update: {
          amount?: number
          bank_account?: Json | null
          created_at?: string | null
          crypto_asset?: string
          currency?: string
          estimated_completion_time?: string | null
          exchange_rate?: Json | null
          expires_at?: string | null
          fees?: Json | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          payment_method?: string | null
          payment_url?: string | null
          project_id?: string | null
          provider?: string
          provider_transaction_id?: string
          status?: string
          tx_hash?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string
          wallet_id?: string | null
          withdrawal_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_fiat_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "dfns_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      dfns_permission_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string | null
          id: string
          identity_id: string
          identity_kind: string
          organization_id: string | null
          permission_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string | null
          id?: string
          identity_id: string
          identity_kind: string
          organization_id?: string | null
          permission_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string | null
          id?: string
          identity_id?: string
          identity_kind?: string
          organization_id?: string | null
          permission_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_permission_assignments_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "dfns_permissions"
            referencedColumns: ["permission_id"]
          },
        ]
      }
      dfns_permissions: {
        Row: {
          category: string | null
          condition: Json | null
          created_at: string | null
          description: string | null
          dfns_permission_id: string | null
          effect: string
          id: string
          name: string
          operations: string[]
          organization_id: string | null
          permission_id: string
          resources: string[]
          status: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          condition?: Json | null
          created_at?: string | null
          description?: string | null
          dfns_permission_id?: string | null
          effect: string
          id?: string
          name: string
          operations: string[]
          organization_id?: string | null
          permission_id: string
          resources: string[]
          status?: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          condition?: Json | null
          created_at?: string | null
          description?: string | null
          dfns_permission_id?: string | null
          effect?: string
          id?: string
          name?: string
          operations?: string[]
          organization_id?: string | null
          permission_id?: string
          resources?: string[]
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_personal_access_tokens: {
        Row: {
          created_at: string | null
          dfns_token_id: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          name: string
          permission_assignments: Json | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dfns_token_id?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name: string
          permission_assignments?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dfns_token_id?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          name?: string
          permission_assignments?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_personal_access_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "dfns_users"
            referencedColumns: ["id"]
          },
        ]
      }
      dfns_policies: {
        Row: {
          activity_kind: string
          created_at: string | null
          description: string | null
          dfns_policy_id: string | null
          external_id: string | null
          id: string
          name: string
          organization_id: string | null
          policy_id: string
          rule: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          activity_kind: string
          created_at?: string | null
          description?: string | null
          dfns_policy_id?: string | null
          external_id?: string | null
          id?: string
          name: string
          organization_id?: string | null
          policy_id: string
          rule: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          activity_kind?: string
          created_at?: string | null
          description?: string | null
          dfns_policy_id?: string | null
          external_id?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          policy_id?: string
          rule?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_policy_approvals: {
        Row: {
          activity_id: string
          approval_id: string
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          dfns_approval_id: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          policy_id: string | null
          reason: string | null
          rejected_at: string | null
          rejected_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          activity_id: string
          approval_id: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          dfns_approval_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          policy_id?: string | null
          reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          activity_id?: string
          approval_id?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          dfns_approval_id?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          policy_id?: string | null
          reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_policy_approvals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "dfns_policies"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      dfns_service_accounts: {
        Row: {
          created_at: string | null
          dfns_service_account_id: string | null
          external_id: string | null
          id: string
          name: string
          organization_id: string | null
          permission_assignments: Json | null
          public_key: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dfns_service_account_id?: string | null
          external_id?: string | null
          id?: string
          name: string
          organization_id?: string | null
          permission_assignments?: Json | null
          public_key?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dfns_service_account_id?: string | null
          external_id?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          permission_assignments?: Json | null
          public_key?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_signatures: {
        Row: {
          created_at: string | null
          date_completed: string | null
          date_created: string
          dfns_signature_id: string
          error_message: string | null
          external_id: string | null
          id: string
          key_id: string | null
          kind: string
          message: string
          public_key: string
          signature: string | null
          signature_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_completed?: string | null
          date_created?: string
          dfns_signature_id: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          key_id?: string | null
          kind: string
          message: string
          public_key: string
          signature?: string | null
          signature_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_completed?: string | null
          date_created?: string
          dfns_signature_id?: string
          error_message?: string | null
          external_id?: string | null
          id?: string
          key_id?: string | null
          kind?: string
          message?: string
          public_key?: string
          signature?: string | null
          signature_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_signatures_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "dfns_signing_keys"
            referencedColumns: ["key_id"]
          },
        ]
      }
      dfns_signing_keys: {
        Row: {
          created_at: string | null
          curve: string
          date_exported: string | null
          delegated: boolean | null
          delegated_to: string | null
          dfns_key_id: string
          exported: boolean | null
          external_id: string | null
          id: string
          imported: boolean | null
          key_id: string
          network: string
          organization_id: string | null
          public_key: string
          scheme: string
          status: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curve: string
          date_exported?: string | null
          delegated?: boolean | null
          delegated_to?: string | null
          dfns_key_id: string
          exported?: boolean | null
          external_id?: string | null
          id?: string
          imported?: boolean | null
          key_id: string
          network: string
          organization_id?: string | null
          public_key: string
          scheme: string
          status?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curve?: string
          date_exported?: string | null
          delegated?: boolean | null
          delegated_to?: string | null
          dfns_key_id?: string
          exported?: boolean | null
          external_id?: string | null
          id?: string
          imported?: boolean | null
          key_id?: string
          network?: string
          organization_id?: string | null
          public_key?: string
          scheme?: string
          status?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_sponsored_fees: {
        Row: {
          amount: string
          asset: string
          created_at: string | null
          error_message: string | null
          fee_sponsor_id: string | null
          id: string
          sponsored_at: string
          sponsored_fee_id: string
          status: string
          tx_hash: string
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: string
          asset: string
          created_at?: string | null
          error_message?: string | null
          fee_sponsor_id?: string | null
          id?: string
          sponsored_at?: string
          sponsored_fee_id: string
          status?: string
          tx_hash: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: string
          asset?: string
          created_at?: string | null
          error_message?: string | null
          fee_sponsor_id?: string | null
          id?: string
          sponsored_at?: string
          sponsored_fee_id?: string
          status?: string
          tx_hash?: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_sponsored_fees_fee_sponsor_id_fkey"
            columns: ["fee_sponsor_id"]
            isOneToOne: false
            referencedRelation: "dfns_fee_sponsors"
            referencedColumns: ["sponsor_id"]
          },
          {
            foreignKeyName: "dfns_sponsored_fees_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "dfns_wallets"
            referencedColumns: ["wallet_id"]
          },
        ]
      }
      dfns_staking_integrations: {
        Row: {
          apr: string | null
          claimed_rewards: string
          created_at: string | null
          delegation_amount: string
          dfns_staking_id: string | null
          id: string
          last_claim_at: string | null
          last_reward_at: string | null
          network: string
          pending_rewards: string
          staking_id: string
          status: string
          total_rewards: string
          unstaking_period: string | null
          updated_at: string | null
          validator_address: string | null
          wallet_id: string | null
        }
        Insert: {
          apr?: string | null
          claimed_rewards?: string
          created_at?: string | null
          delegation_amount?: string
          dfns_staking_id?: string | null
          id?: string
          last_claim_at?: string | null
          last_reward_at?: string | null
          network: string
          pending_rewards?: string
          staking_id: string
          status: string
          total_rewards?: string
          unstaking_period?: string | null
          updated_at?: string | null
          validator_address?: string | null
          wallet_id?: string | null
        }
        Update: {
          apr?: string | null
          claimed_rewards?: string
          created_at?: string | null
          delegation_amount?: string
          dfns_staking_id?: string | null
          id?: string
          last_claim_at?: string | null
          last_reward_at?: string | null
          network?: string
          pending_rewards?: string
          staking_id?: string
          status?: string
          total_rewards?: string
          unstaking_period?: string | null
          updated_at?: string | null
          validator_address?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_staking_integrations_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "dfns_wallets"
            referencedColumns: ["wallet_id"]
          },
        ]
      }
      dfns_sync_status: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          last_sync_at: string
          next_sync_at: string | null
          organization_id: string | null
          sync_status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          last_sync_at?: string
          next_sync_at?: string | null
          organization_id?: string | null
          sync_status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string
          next_sync_at?: string | null
          organization_id?: string | null
          sync_status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dfns_transaction_history: {
        Row: {
          amount: string
          asset_name: string | null
          asset_symbol: string
          block_hash: string | null
          block_number: number | null
          contract_address: string | null
          created_at: string | null
          direction: string
          fee: string | null
          from_address: string | null
          id: string
          last_updated: string | null
          metadata: Json | null
          status: string
          timestamp: string
          to_address: string | null
          tx_hash: string
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: string
          asset_name?: string | null
          asset_symbol: string
          block_hash?: string | null
          block_number?: number | null
          contract_address?: string | null
          created_at?: string | null
          direction: string
          fee?: string | null
          from_address?: string | null
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          status: string
          timestamp: string
          to_address?: string | null
          tx_hash: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: string
          asset_name?: string | null
          asset_symbol?: string
          block_hash?: string | null
          block_number?: number | null
          contract_address?: string | null
          created_at?: string | null
          direction?: string
          fee?: string | null
          from_address?: string | null
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          status?: string
          timestamp?: string
          to_address?: string | null
          tx_hash?: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_transaction_history_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "dfns_wallets"
            referencedColumns: ["wallet_id"]
          },
        ]
      }
      dfns_transfers: {
        Row: {
          amount: string
          asset: string | null
          created_at: string | null
          date_broadcast: string | null
          date_confirmed: string | null
          date_created: string
          dfns_transfer_id: string
          error_message: string | null
          estimated_confirmation_time: string | null
          external_id: string | null
          fee: string | null
          gas_limit: string | null
          gas_price: string | null
          id: string
          max_fee_per_gas: string | null
          max_priority_fee_per_gas: string | null
          memo: string | null
          nonce: number | null
          status: string
          to_address: string
          transfer_id: string
          tx_hash: string | null
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: string
          asset?: string | null
          created_at?: string | null
          date_broadcast?: string | null
          date_confirmed?: string | null
          date_created?: string
          dfns_transfer_id: string
          error_message?: string | null
          estimated_confirmation_time?: string | null
          external_id?: string | null
          fee?: string | null
          gas_limit?: string | null
          gas_price?: string | null
          id?: string
          max_fee_per_gas?: string | null
          max_priority_fee_per_gas?: string | null
          memo?: string | null
          nonce?: number | null
          status?: string
          to_address: string
          transfer_id: string
          tx_hash?: string | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: string
          asset?: string | null
          created_at?: string | null
          date_broadcast?: string | null
          date_confirmed?: string | null
          date_created?: string
          dfns_transfer_id?: string
          error_message?: string | null
          estimated_confirmation_time?: string | null
          external_id?: string | null
          fee?: string | null
          gas_limit?: string | null
          gas_price?: string | null
          id?: string
          max_fee_per_gas?: string | null
          max_priority_fee_per_gas?: string | null
          memo?: string | null
          nonce?: number | null
          status?: string
          to_address?: string
          transfer_id?: string
          tx_hash?: string | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_transfers_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "dfns_wallets"
            referencedColumns: ["wallet_id"]
          },
        ]
      }
      dfns_users: {
        Row: {
          created_at: string | null
          dfns_user_id: string | null
          email: string | null
          external_id: string | null
          id: string
          kind: string
          last_login_at: string | null
          mfa_enabled: boolean | null
          organization_id: string | null
          public_key: string | null
          recovery_setup: boolean | null
          registered_at: string
          status: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          dfns_user_id?: string | null
          email?: string | null
          external_id?: string | null
          id?: string
          kind: string
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          organization_id?: string | null
          public_key?: string | null
          recovery_setup?: boolean | null
          registered_at?: string
          status?: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          dfns_user_id?: string | null
          email?: string | null
          external_id?: string | null
          id?: string
          kind?: string
          last_login_at?: string | null
          mfa_enabled?: boolean | null
          organization_id?: string | null
          public_key?: string | null
          recovery_setup?: boolean | null
          registered_at?: string
          status?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      dfns_validators: {
        Row: {
          apr: string | null
          commission: string
          created_at: string | null
          delegated_amount: string
          id: string
          last_updated: string | null
          name: string | null
          network: string
          rank: number | null
          status: string
          updated_at: string | null
          uptime: string | null
          validator_address: string
        }
        Insert: {
          apr?: string | null
          commission?: string
          created_at?: string | null
          delegated_amount?: string
          id?: string
          last_updated?: string | null
          name?: string | null
          network: string
          rank?: number | null
          status: string
          updated_at?: string | null
          uptime?: string | null
          validator_address: string
        }
        Update: {
          apr?: string | null
          commission?: string
          created_at?: string | null
          delegated_amount?: string
          id?: string
          last_updated?: string | null
          name?: string | null
          network?: string
          rank?: number | null
          status?: string
          updated_at?: string | null
          uptime?: string | null
          validator_address?: string
        }
        Relationships: []
      }
      dfns_wallet_balances: {
        Row: {
          asset_name: string | null
          asset_symbol: string
          balance: string
          contract_address: string | null
          created_at: string | null
          decimals: number
          id: string
          last_updated: string | null
          native_asset: boolean | null
          updated_at: string | null
          value_in_usd: string | null
          verified: boolean | null
          wallet_id: string | null
        }
        Insert: {
          asset_name?: string | null
          asset_symbol: string
          balance?: string
          contract_address?: string | null
          created_at?: string | null
          decimals?: number
          id?: string
          last_updated?: string | null
          native_asset?: boolean | null
          updated_at?: string | null
          value_in_usd?: string | null
          verified?: boolean | null
          wallet_id?: string | null
        }
        Update: {
          asset_name?: string | null
          asset_symbol?: string
          balance?: string
          contract_address?: string | null
          created_at?: string | null
          decimals?: number
          id?: string
          last_updated?: string | null
          native_asset?: boolean | null
          updated_at?: string | null
          value_in_usd?: string | null
          verified?: boolean | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_wallet_balances_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "dfns_wallets"
            referencedColumns: ["wallet_id"]
          },
        ]
      }
      dfns_wallet_nfts: {
        Row: {
          attributes: Json | null
          collection: string | null
          contract: string
          created_at: string | null
          description: string | null
          external_url: string | null
          id: string
          image_url: string | null
          last_updated: string | null
          name: string | null
          token_id: string
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          attributes?: Json | null
          collection?: string | null
          contract: string
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          last_updated?: string | null
          name?: string | null
          token_id: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          attributes?: Json | null
          collection?: string | null
          contract?: string
          created_at?: string | null
          description?: string | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          last_updated?: string | null
          name?: string | null
          token_id?: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_wallet_nfts_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "dfns_wallets"
            referencedColumns: ["wallet_id"]
          },
        ]
      }
      dfns_wallets: {
        Row: {
          address: string
          created_at: string | null
          custodial: boolean | null
          date_exported: string | null
          delegated: boolean | null
          delegated_to: string | null
          dfns_wallet_id: string
          exported: boolean | null
          external_id: string | null
          id: string
          imported: boolean | null
          investor_id: string | null
          name: string | null
          network: string
          organization_id: string | null
          project_id: string | null
          signing_key_id: string | null
          status: string
          tags: string[] | null
          updated_at: string | null
          wallet_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          custodial?: boolean | null
          date_exported?: string | null
          delegated?: boolean | null
          delegated_to?: string | null
          dfns_wallet_id: string
          exported?: boolean | null
          external_id?: string | null
          id?: string
          imported?: boolean | null
          investor_id?: string | null
          name?: string | null
          network: string
          organization_id?: string | null
          project_id?: string | null
          signing_key_id?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          wallet_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          custodial?: boolean | null
          date_exported?: string | null
          delegated?: boolean | null
          delegated_to?: string | null
          dfns_wallet_id?: string
          exported?: boolean | null
          external_id?: string | null
          id?: string
          imported?: boolean | null
          investor_id?: string | null
          name?: string | null
          network?: string
          organization_id?: string | null
          project_id?: string | null
          signing_key_id?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dfns_wallets_signing_key_id_fkey"
            columns: ["signing_key_id"]
            isOneToOne: false
            referencedRelation: "dfns_signing_keys"
            referencedColumns: ["key_id"]
          },
        ]
      }
      dfns_webhook_deliveries: {
        Row: {
          attempts: number | null
          created_at: string | null
          delivered_at: string | null
          delivery_id: string
          error_message: string | null
          event: string
          id: string
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_code: number | null
          status: string
          updated_at: string | null
          webhook_id: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_id: string
          error_message?: string | null
          event: string
          id?: string
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_code?: number | null
          status?: string
          updated_at?: string | null
          webhook_id?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_id?: string
          error_message?: string | null
          event?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_code?: number | null
          status?: string
          updated_at?: string | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dfns_webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "dfns_webhooks"
            referencedColumns: ["webhook_id"]
          },
        ]
      }
      dfns_webhooks: {
        Row: {
          created_at: string | null
          description: string | null
          dfns_webhook_id: string | null
          events: string[]
          external_id: string | null
          headers: Json | null
          id: string
          name: string
          organization_id: string | null
          secret: string | null
          status: string
          updated_at: string | null
          url: string
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dfns_webhook_id?: string | null
          events: string[]
          external_id?: string | null
          headers?: Json | null
          id?: string
          name: string
          organization_id?: string | null
          secret?: string | null
          status?: string
          updated_at?: string | null
          url: string
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dfns_webhook_id?: string | null
          events?: string[]
          external_id?: string | null
          headers?: Json | null
          id?: string
          name?: string
          organization_id?: string | null
          secret?: string | null
          status?: string
          updated_at?: string | null
          url?: string
          webhook_id?: string
        }
        Relationships: []
      }
      distribution_redemptions: {
        Row: {
          amount_redeemed: number
          created_at: string
          distribution_id: string
          id: string
          redemption_request_id: string
          updated_at: string | null
        }
        Insert: {
          amount_redeemed: number
          created_at?: string
          distribution_id: string
          id?: string
          redemption_request_id: string
          updated_at?: string | null
        }
        Update: {
          amount_redeemed?: number
          created_at?: string
          distribution_id?: string
          id?: string
          redemption_request_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_redemptions_distribution_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_redemptions_redemption_fkey"
            columns: ["redemption_request_id"]
            isOneToOne: false
            referencedRelation: "redemption_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          blockchain: string
          created_at: string
          distribution_date: string
          distribution_tx_hash: string
          fully_redeemed: boolean
          id: string
          investor_id: string
          notes: string | null
          project_id: string | null
          redemption_status: string | null
          remaining_amount: number
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          status: string
          subscription_id: string
          to_address: string
          token_address: string | null
          token_allocation_id: string
          token_amount: number
          token_symbol: string | null
          token_type: string
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          blockchain: string
          created_at?: string
          distribution_date: string
          distribution_tx_hash: string
          fully_redeemed?: boolean
          id?: string
          investor_id: string
          notes?: string | null
          project_id?: string | null
          redemption_status?: string | null
          remaining_amount: number
          standard?: Database["public"]["Enums"]["token_standard_enum"] | null
          status?: string
          subscription_id: string
          to_address: string
          token_address?: string | null
          token_allocation_id: string
          token_amount: number
          token_symbol?: string | null
          token_type: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          blockchain?: string
          created_at?: string
          distribution_date?: string
          distribution_tx_hash?: string
          fully_redeemed?: boolean
          id?: string
          investor_id?: string
          notes?: string | null
          project_id?: string | null
          redemption_status?: string | null
          remaining_amount?: number
          standard?: Database["public"]["Enums"]["token_standard_enum"] | null
          status?: string
          subscription_id?: string
          to_address?: string
          token_address?: string | null
          token_allocation_id?: string
          token_amount?: number
          token_symbol?: string | null
          token_type?: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributions_investor_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "distributions_project_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_subscription_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "multi_sig_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      document_approvals: {
        Row: {
          approver_id: string | null
          comments: string | null
          created_at: string | null
          document_id: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          approver_id?: string | null
          comments?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          status: string
          updated_at?: string | null
        }
        Update: {
          approver_id?: string | null
          comments?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_approvals_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string | null
          document_id: string | null
          file_path: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_workflows: {
        Row: {
          completed_signers: string[]
          created_at: string
          created_by: string
          deadline: string | null
          document_id: string
          id: string
          metadata: Json
          required_signers: string[]
          status: Database["public"]["Enums"]["workflow_status"]
          updated_at: string
          updated_by: string
        }
        Insert: {
          completed_signers?: string[]
          created_at?: string
          created_by: string
          deadline?: string | null
          document_id: string
          id?: string
          metadata?: Json
          required_signers: string[]
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          updated_by: string
        }
        Update: {
          completed_signers?: string[]
          created_at?: string
          created_by?: string
          deadline?: string | null
          document_id?: string
          id?: string
          metadata?: Json
          required_signers?: string[]
          status?: Database["public"]["Enums"]["workflow_status"]
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_workflows_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "issuer_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          expiry_date: string | null
          file_path: string | null
          file_url: string | null
          id: string
          metadata: Json | null
          name: string
          project_id: string | null
          status: string
          type: string
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
          workflow_stage_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          expiry_date?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name: string
          project_id?: string | null
          status?: string
          type: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          workflow_stage_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          expiry_date?: string | null
          file_path?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
          workflow_stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_workflow_stage_id_fkey"
            columns: ["workflow_stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      faucet_requests: {
        Row: {
          amount: string
          created_at: string | null
          id: string
          ip_address: string | null
          network: string
          status: string
          token_address: string | null
          transaction_hash: string | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          amount: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          network: string
          status?: string
          token_address?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          amount?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          network?: string
          status?: string
          token_address?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      fiat_quotes: {
        Row: {
          converted_to_transaction_id: string | null
          created_at: string
          estimated_processing_time: string | null
          exchange_rate: number
          expires_at: string
          fees: Json
          from_amount: number
          from_currency: string
          id: string
          payment_method: string
          provider: string
          session_id: string | null
          to_amount: number
          to_currency: string
          type: string
          user_id: string | null
        }
        Insert: {
          converted_to_transaction_id?: string | null
          created_at?: string
          estimated_processing_time?: string | null
          exchange_rate: number
          expires_at: string
          fees: Json
          from_amount: number
          from_currency: string
          id?: string
          payment_method: string
          provider: string
          session_id?: string | null
          to_amount: number
          to_currency: string
          type: string
          user_id?: string | null
        }
        Update: {
          converted_to_transaction_id?: string | null
          created_at?: string
          estimated_processing_time?: string | null
          exchange_rate?: number
          expires_at?: string
          fees?: Json
          from_amount?: number
          from_currency?: string
          id?: string
          payment_method?: string
          provider?: string
          session_id?: string | null
          to_amount?: number
          to_currency?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiat_quotes_converted_to_transaction_id_fkey"
            columns: ["converted_to_transaction_id"]
            isOneToOne: false
            referencedRelation: "fiat_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      fiat_transactions: {
        Row: {
          amount: number
          bank_account: Json | null
          created_at: string
          crypto_asset: string
          currency: string
          estimated_completion_time: string | null
          exchange_rate: Json | null
          expires_at: string | null
          fees: Json | null
          id: string
          metadata: Json | null
          organization_id: string | null
          payment_method: string | null
          payment_url: string | null
          project_id: string | null
          provider: string
          provider_transaction_id: string
          status: string
          tx_hash: string | null
          type: string
          updated_at: string
          user_id: string | null
          wallet_address: string
          wallet_id: string | null
          withdrawal_address: string | null
        }
        Insert: {
          amount: number
          bank_account?: Json | null
          created_at?: string
          crypto_asset: string
          currency: string
          estimated_completion_time?: string | null
          exchange_rate?: Json | null
          expires_at?: string | null
          fees?: Json | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          payment_method?: string | null
          payment_url?: string | null
          project_id?: string | null
          provider: string
          provider_transaction_id: string
          status: string
          tx_hash?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
          wallet_address: string
          wallet_id?: string | null
          withdrawal_address?: string | null
        }
        Update: {
          amount?: number
          bank_account?: Json | null
          created_at?: string
          crypto_asset?: string
          currency?: string
          estimated_completion_time?: string | null
          exchange_rate?: Json | null
          expires_at?: string | null
          fees?: Json | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          payment_method?: string | null
          payment_url?: string | null
          project_id?: string | null
          provider?: string
          provider_transaction_id?: string
          status?: string
          tx_hash?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
          wallet_id?: string | null
          withdrawal_address?: string | null
        }
        Relationships: []
      }
      fund_nav_data: {
        Row: {
          calculation_method: string | null
          change_amount: number | null
          change_percent: number | null
          created_at: string | null
          created_by: string | null
          date: string
          fund_id: string
          id: string
          market_conditions: string | null
          nav: number
          notes: string | null
          outstanding_shares: number
          previous_nav: number | null
          source: string
          total_assets: number
          total_liabilities: number
          updated_at: string | null
          validated: boolean | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          calculation_method?: string | null
          change_amount?: number | null
          change_percent?: number | null
          created_at?: string | null
          created_by?: string | null
          date: string
          fund_id: string
          id?: string
          market_conditions?: string | null
          nav: number
          notes?: string | null
          outstanding_shares: number
          previous_nav?: number | null
          source?: string
          total_assets: number
          total_liabilities?: number
          updated_at?: string | null
          validated?: boolean | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          calculation_method?: string | null
          change_amount?: number | null
          change_percent?: number | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          fund_id?: string
          id?: string
          market_conditions?: string | null
          nav?: number
          notes?: string | null
          outstanding_shares?: number
          previous_nav?: number | null
          source?: string
          total_assets?: number
          total_liabilities?: number
          updated_at?: string | null
          validated?: boolean | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: []
      }
      geographic_jurisdictions: {
        Row: {
          aml_risk_rating: string | null
          country_code: string
          country_code_3: string
          country_name: string
          created_at: string | null
          fatf_compliance_status: string | null
          id: string
          is_eu_sanctioned: boolean | null
          is_ofac_sanctioned: boolean | null
          is_un_sanctioned: boolean | null
          kyc_requirements_level: string | null
          offshore_financial_center: boolean | null
          region: string
          regulatory_regime: string | null
          sanctions_risk_level: string | null
          tax_treaty_status: string | null
          updated_at: string | null
        }
        Insert: {
          aml_risk_rating?: string | null
          country_code: string
          country_code_3: string
          country_name: string
          created_at?: string | null
          fatf_compliance_status?: string | null
          id?: string
          is_eu_sanctioned?: boolean | null
          is_ofac_sanctioned?: boolean | null
          is_un_sanctioned?: boolean | null
          kyc_requirements_level?: string | null
          offshore_financial_center?: boolean | null
          region: string
          regulatory_regime?: string | null
          sanctions_risk_level?: string | null
          tax_treaty_status?: string | null
          updated_at?: string | null
        }
        Update: {
          aml_risk_rating?: string | null
          country_code?: string
          country_code_3?: string
          country_name?: string
          created_at?: string | null
          fatf_compliance_status?: string | null
          id?: string
          is_eu_sanctioned?: boolean | null
          is_ofac_sanctioned?: boolean | null
          is_un_sanctioned?: boolean | null
          kyc_requirements_level?: string | null
          offshore_financial_center?: boolean | null
          region?: string
          regulatory_regime?: string | null
          sanctions_risk_level?: string | null
          tax_treaty_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      guardian_api_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          endpoint: string
          error_message: string | null
          execution_time_ms: number | null
          guardian_operation_id: string | null
          guardian_wallet_address: string | null
          guardian_wallet_id: string | null
          http_method: string
          id: string
          notes: string | null
          request_headers: Json | null
          request_payload: Json | null
          response_headers: Json | null
          response_payload: Json | null
          response_status: number | null
          success: boolean
          test_name: string
          test_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          endpoint: string
          error_message?: string | null
          execution_time_ms?: number | null
          guardian_operation_id?: string | null
          guardian_wallet_address?: string | null
          guardian_wallet_id?: string | null
          http_method: string
          id?: string
          notes?: string | null
          request_headers?: Json | null
          request_payload?: Json | null
          response_headers?: Json | null
          response_payload?: Json | null
          response_status?: number | null
          success?: boolean
          test_name: string
          test_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          endpoint?: string
          error_message?: string | null
          execution_time_ms?: number | null
          guardian_operation_id?: string | null
          guardian_wallet_address?: string | null
          guardian_wallet_id?: string | null
          http_method?: string
          id?: string
          notes?: string | null
          request_headers?: Json | null
          request_payload?: Json | null
          response_headers?: Json | null
          response_payload?: Json | null
          response_status?: number | null
          success?: boolean
          test_name?: string
          test_type?: string
        }
        Relationships: []
      }
      guardian_operations: {
        Row: {
          check_count: number | null
          completed_at: string | null
          created_at: string | null
          guardian_wallet_id: string | null
          id: string
          last_checked_at: string | null
          notes: string | null
          operation_error: Json | null
          operation_id: string
          operation_result: Json | null
          operation_status: string | null
          operation_type: string
          related_test_id: string | null
        }
        Insert: {
          check_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          guardian_wallet_id?: string | null
          id?: string
          last_checked_at?: string | null
          notes?: string | null
          operation_error?: Json | null
          operation_id: string
          operation_result?: Json | null
          operation_status?: string | null
          operation_type: string
          related_test_id?: string | null
        }
        Update: {
          check_count?: number | null
          completed_at?: string | null
          created_at?: string | null
          guardian_wallet_id?: string | null
          id?: string
          last_checked_at?: string | null
          notes?: string | null
          operation_error?: Json | null
          operation_id?: string
          operation_result?: Json | null
          operation_status?: string | null
          operation_type?: string
          related_test_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardian_operations_related_test_id_fkey"
            columns: ["related_test_id"]
            isOneToOne: false
            referencedRelation: "guardian_api_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_wallets: {
        Row: {
          created_by: string | null
          creation_request_id: string | null
          guardian_internal_id: string | null
          guardian_operation_id: string | null
          guardian_wallet_id: string
          id: string
          operation_check_request_id: string | null
          operation_completed_at: string | null
          requested_at: string | null
          test_notes: string | null
          updated_at: string | null
          wallet_addresses: Json | null
          wallet_details_request_id: string | null
          wallet_metadata: Json | null
          wallet_name: string | null
          wallet_retrieved_at: string | null
          wallet_status: string | null
        }
        Insert: {
          created_by?: string | null
          creation_request_id?: string | null
          guardian_internal_id?: string | null
          guardian_operation_id?: string | null
          guardian_wallet_id: string
          id?: string
          operation_check_request_id?: string | null
          operation_completed_at?: string | null
          requested_at?: string | null
          test_notes?: string | null
          updated_at?: string | null
          wallet_addresses?: Json | null
          wallet_details_request_id?: string | null
          wallet_metadata?: Json | null
          wallet_name?: string | null
          wallet_retrieved_at?: string | null
          wallet_status?: string | null
        }
        Update: {
          created_by?: string | null
          creation_request_id?: string | null
          guardian_internal_id?: string | null
          guardian_operation_id?: string | null
          guardian_wallet_id?: string
          id?: string
          operation_check_request_id?: string | null
          operation_completed_at?: string | null
          requested_at?: string | null
          test_notes?: string | null
          updated_at?: string | null
          wallet_addresses?: Json | null
          wallet_details_request_id?: string | null
          wallet_metadata?: Json | null
          wallet_name?: string | null
          wallet_retrieved_at?: string | null
          wallet_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardian_wallets_creation_request_id_fkey"
            columns: ["creation_request_id"]
            isOneToOne: false
            referencedRelation: "guardian_api_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_wallets_operation_check_request_id_fkey"
            columns: ["operation_check_request_id"]
            isOneToOne: false
            referencedRelation: "guardian_api_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_wallets_wallet_details_request_id_fkey"
            columns: ["wallet_details_request_id"]
            isOneToOne: false
            referencedRelation: "guardian_api_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      health_checks: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          last_check: string | null
          response_time: number | null
          service: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          last_check?: string | null
          response_time?: number | null
          service: string
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          last_check?: string | null
          response_time?: number | null
          service?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      investor_approvals: {
        Row: {
          approval_date: string | null
          approval_type: string
          created_at: string | null
          id: string
          investor_id: string
          metadata: Json | null
          rejection_reason: string | null
          required_documents: Json | null
          review_notes: string | null
          reviewer_id: string | null
          status: string
          submission_date: string | null
          updated_at: string | null
        }
        Insert: {
          approval_date?: string | null
          approval_type: string
          created_at?: string | null
          id?: string
          investor_id: string
          metadata?: Json | null
          rejection_reason?: string | null
          required_documents?: Json | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_date?: string | null
          approval_type?: string
          created_at?: string | null
          id?: string
          investor_id?: string
          metadata?: Json | null
          rejection_reason?: string | null
          required_documents?: Json | null
          review_notes?: string | null
          reviewer_id?: string | null
          status?: string
          submission_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_approvals_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
        ]
      }
      investor_group_members: {
        Row: {
          created_at: string
          group_id: string
          investor_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          investor_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          investor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_group_members_group_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "investor_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_group_members_investor_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
        ]
      }
      investor_groups: {
        Row: {
          created_at: string | null
          description: string | null
          group: string | null
          id: string
          member_count: number
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          group?: string | null
          id?: string
          member_count?: number
          name: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          group?: string | null
          id?: string
          member_count?: number
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_groups_investors: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          investor_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          investor_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          investor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_groups_investors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "investor_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_groups_investors_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
        ]
      }
      investors: {
        Row: {
          accreditation_expiry_date: string | null
          accreditation_status: string | null
          accreditation_type: string | null
          company: string | null
          created_at: string | null
          email: string
          investment_preferences: Json | null
          investor_id: string
          investor_status: string | null
          investor_type: string | null
          kyc_expiry_date: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_compliance_check: string | null
          lastUpdated: string | null
          name: string
          notes: string | null
          onboarding_completed: boolean | null
          profile_data: Json | null
          risk_assessment: Json | null
          tax_id_number: string | null
          tax_residency: string | null
          type: string
          updated_at: string | null
          verification_details: Json | null
          wallet_address: string | null
        }
        Insert: {
          accreditation_expiry_date?: string | null
          accreditation_status?: string | null
          accreditation_type?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          investment_preferences?: Json | null
          investor_id?: string
          investor_status?: string | null
          investor_type?: string | null
          kyc_expiry_date?: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          last_compliance_check?: string | null
          lastUpdated?: string | null
          name: string
          notes?: string | null
          onboarding_completed?: boolean | null
          profile_data?: Json | null
          risk_assessment?: Json | null
          tax_id_number?: string | null
          tax_residency?: string | null
          type: string
          updated_at?: string | null
          verification_details?: Json | null
          wallet_address?: string | null
        }
        Update: {
          accreditation_expiry_date?: string | null
          accreditation_status?: string | null
          accreditation_type?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          investment_preferences?: Json | null
          investor_id?: string
          investor_status?: string | null
          investor_type?: string | null
          kyc_expiry_date?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          last_compliance_check?: string | null
          lastUpdated?: string | null
          name?: string
          notes?: string | null
          onboarding_completed?: boolean | null
          profile_data?: Json | null
          risk_assessment?: Json | null
          tax_id_number?: string | null
          tax_residency?: string | null
          type?: string
          updated_at?: string | null
          verification_details?: Json | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      investors_backup_pre_kyc_update: {
        Row: {
          accreditation_expiry_date: string | null
          accreditation_status: string | null
          accreditation_type: string | null
          company: string | null
          created_at: string | null
          email: string | null
          investment_preferences: Json | null
          investor_id: string | null
          investor_status: string | null
          investor_type: string | null
          kyc_expiry_date: string | null
          kyc_status: string | null
          last_compliance_check: string | null
          lastUpdated: string | null
          name: string | null
          notes: string | null
          onboarding_completed: boolean | null
          profile_data: Json | null
          risk_assessment: Json | null
          tax_id_number: string | null
          tax_residency: string | null
          type: string | null
          updated_at: string | null
          verification_details: Json | null
          wallet_address: string | null
        }
        Insert: {
          accreditation_expiry_date?: string | null
          accreditation_status?: string | null
          accreditation_type?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          investment_preferences?: Json | null
          investor_id?: string | null
          investor_status?: string | null
          investor_type?: string | null
          kyc_expiry_date?: string | null
          kyc_status?: string | null
          last_compliance_check?: string | null
          lastUpdated?: string | null
          name?: string | null
          notes?: string | null
          onboarding_completed?: boolean | null
          profile_data?: Json | null
          risk_assessment?: Json | null
          tax_id_number?: string | null
          tax_residency?: string | null
          type?: string | null
          updated_at?: string | null
          verification_details?: Json | null
          wallet_address?: string | null
        }
        Update: {
          accreditation_expiry_date?: string | null
          accreditation_status?: string | null
          accreditation_type?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          investment_preferences?: Json | null
          investor_id?: string | null
          investor_status?: string | null
          investor_type?: string | null
          kyc_expiry_date?: string | null
          kyc_status?: string | null
          last_compliance_check?: string | null
          lastUpdated?: string | null
          name?: string | null
          notes?: string | null
          onboarding_completed?: boolean | null
          profile_data?: Json | null
          risk_assessment?: Json | null
          tax_id_number?: string | null
          tax_residency?: string | null
          type?: string | null
          updated_at?: string | null
          verification_details?: Json | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      invoice: {
        Row: {
          adjustments: number | null
          billed_amount: number | null
          diagnosis_codes: string | null
          due_date: string | null
          factoring_discount_rate: number | null
          factoring_terms: string | null
          invoice_date: string | null
          invoice_id: number
          invoice_number: string | null
          net_amount_due: number | null
          patient_dob: string | null
          patient_name: string | null
          payer_id: number | null
          policy_number: string | null
          pool_id: number | null
          procedure_codes: string | null
          provider_id: number | null
          service_dates: string | null
          upload_timestamp: string | null
        }
        Insert: {
          adjustments?: number | null
          billed_amount?: number | null
          diagnosis_codes?: string | null
          due_date?: string | null
          factoring_discount_rate?: number | null
          factoring_terms?: string | null
          invoice_date?: string | null
          invoice_id?: never
          invoice_number?: string | null
          net_amount_due?: number | null
          patient_dob?: string | null
          patient_name?: string | null
          payer_id?: number | null
          policy_number?: string | null
          pool_id?: number | null
          procedure_codes?: string | null
          provider_id?: number | null
          service_dates?: string | null
          upload_timestamp?: string | null
        }
        Update: {
          adjustments?: number | null
          billed_amount?: number | null
          diagnosis_codes?: string | null
          due_date?: string | null
          factoring_discount_rate?: number | null
          factoring_terms?: string | null
          invoice_date?: string | null
          invoice_id?: never
          invoice_number?: string | null
          net_amount_due?: number | null
          patient_dob?: string | null
          patient_name?: string | null
          payer_id?: number | null
          policy_number?: string | null
          pool_id?: number | null
          procedure_codes?: string | null
          provider_id?: number | null
          service_dates?: string | null
          upload_timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "payer"
            referencedColumns: ["payer_id"]
          },
          {
            foreignKeyName: "invoice_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "pool"
            referencedColumns: ["pool_id"]
          },
          {
            foreignKeyName: "invoice_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "provider"
            referencedColumns: ["provider_id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issued_date: string | null
          paid: boolean | null
          subscription_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_date?: string | null
          paid?: boolean | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_date?: string | null
          paid?: boolean | null
          subscription_id?: string | null
        }
        Relationships: []
      }
      issuer_access_roles: {
        Row: {
          created_at: string
          created_by: string
          id: string
          issuer_id: string
          role: Database["public"]["Enums"]["issuer_role"]
          updated_at: string
          updated_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          issuer_id: string
          role: Database["public"]["Enums"]["issuer_role"]
          updated_at?: string
          updated_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          issuer_id?: string
          role?: Database["public"]["Enums"]["issuer_role"]
          updated_at?: string
          updated_by?: string
          user_id?: string
        }
        Relationships: []
      }
      issuer_detail_documents: {
        Row: {
          document_name: string
          document_type: string
          document_url: string
          id: string
          is_public: boolean
          metadata: Json | null
          project_id: string
          status: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          document_name: string
          document_type: string
          document_url: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
          project_id: string
          status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string
          document_url?: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
          project_id?: string
          status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issuer_detail_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      issuer_documents: {
        Row: {
          created_at: string
          created_by: string
          document_type: Database["public"]["Enums"]["document_type"]
          expires_at: string | null
          file_url: string
          id: string
          issuer_id: string
          last_reviewed_at: string | null
          metadata: Json
          reviewed_by: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          updated_by: string
          uploaded_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          document_type: Database["public"]["Enums"]["document_type"]
          expires_at?: string | null
          file_url: string
          id?: string
          issuer_id: string
          last_reviewed_at?: string | null
          metadata?: Json
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          updated_by: string
          uploaded_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          expires_at?: string | null
          file_url?: string
          id?: string
          issuer_id?: string
          last_reviewed_at?: string | null
          metadata?: Json
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          updated_by?: string
          uploaded_at?: string
          version?: number
        }
        Relationships: []
      }
      kyc_screening_logs: {
        Row: {
          created_at: string | null
          id: string
          investor_id: string
          method: string
          new_status: string | null
          notes: string | null
          performed_by: string | null
          previous_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          investor_id: string
          method: string
          new_status?: string | null
          notes?: string | null
          performed_by?: string | null
          previous_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          investor_id?: string
          method?: string
          new_status?: string | null
          notes?: string | null
          performed_by?: string | null
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_screening_logs_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
        ]
      }
      mfa_policies: {
        Row: {
          applies_to: string[]
          created_at: string | null
          exceptions: string[]
          id: string
          name: string
          required: boolean
        }
        Insert: {
          applies_to: string[]
          created_at?: string | null
          exceptions: string[]
          id?: string
          name: string
          required: boolean
        }
        Update: {
          applies_to?: string[]
          created_at?: string | null
          exceptions?: string[]
          id?: string
          name?: string
          required?: boolean
        }
        Relationships: []
      }
      monitoring_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_name: string
          recorded_at: string | null
          service: string
          tags: Json | null
          unit: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_name: string
          recorded_at?: string | null
          service: string
          tags?: Json | null
          unit?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_name?: string
          recorded_at?: string | null
          service?: string
          tags?: Json | null
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      moonpay_asset_cache: {
        Row: {
          asset_data: Json
          cached_at: string | null
          contract_address: string
          expires_at: string | null
          id: string
          token_id: string
        }
        Insert: {
          asset_data: Json
          cached_at?: string | null
          contract_address: string
          expires_at?: string | null
          id?: string
          token_id: string
        }
        Update: {
          asset_data?: Json
          cached_at?: string | null
          contract_address?: string
          expires_at?: string | null
          id?: string
          token_id?: string
        }
        Relationships: []
      }
      moonpay_compliance_alerts: {
        Row: {
          alert_id: string | null
          alert_type: string
          assigned_to: string | null
          auto_generated: boolean | null
          created_at: string | null
          customer_id: string | null
          description: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          escalated_at: string | null
          escalated_to: string | null
          external_reference: string | null
          id: string
          metadata: Json | null
          recommended_actions: string[] | null
          related_alerts: string[] | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: string | null
          risk_score: number | null
          screening_results: Json | null
          severity: string
          source: string | null
          status: string
          title: string
          transaction_id: string | null
          triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          alert_id?: string | null
          alert_type: string
          assigned_to?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          description: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          external_reference?: string | null
          id?: string
          metadata?: Json | null
          recommended_actions?: string[] | null
          related_alerts?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          risk_score?: number | null
          screening_results?: Json | null
          severity?: string
          source?: string | null
          status?: string
          title: string
          transaction_id?: string | null
          triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_id?: string | null
          alert_type?: string
          assigned_to?: string | null
          auto_generated?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          description?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          external_reference?: string | null
          id?: string
          metadata?: Json | null
          recommended_actions?: string[] | null
          related_alerts?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          risk_score?: number | null
          screening_results?: Json | null
          severity?: string
          source?: string | null
          status?: string
          title?: string
          transaction_id?: string | null
          triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      moonpay_customers: {
        Row: {
          address: Json | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          external_customer_id: string | null
          first_name: string | null
          id: string
          identity_verification_status: string | null
          kyc_level: string | null
          last_name: string | null
          moonpay_customer_id: string | null
          preferred_payment_methods: string[] | null
          transaction_limits: Json | null
          updated_at: string | null
          verification_documents: Json | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          external_customer_id?: string | null
          first_name?: string | null
          id?: string
          identity_verification_status?: string | null
          kyc_level?: string | null
          last_name?: string | null
          moonpay_customer_id?: string | null
          preferred_payment_methods?: string[] | null
          transaction_limits?: Json | null
          updated_at?: string | null
          verification_documents?: Json | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          external_customer_id?: string | null
          first_name?: string | null
          id?: string
          identity_verification_status?: string | null
          kyc_level?: string | null
          last_name?: string | null
          moonpay_customer_id?: string | null
          preferred_payment_methods?: string[] | null
          transaction_limits?: Json | null
          updated_at?: string | null
          verification_documents?: Json | null
        }
        Relationships: []
      }
      moonpay_passes: {
        Row: {
          attributes: Json | null
          contract_address: string
          created_at: string | null
          description: string | null
          external_pass_id: string | null
          id: string
          image: string | null
          metadata_url: string | null
          name: string
          owner_address: string | null
          project_id: string
          status: string
          token_id: string
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          contract_address: string
          created_at?: string | null
          description?: string | null
          external_pass_id?: string | null
          id?: string
          image?: string | null
          metadata_url?: string | null
          name: string
          owner_address?: string | null
          project_id: string
          status: string
          token_id: string
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          contract_address?: string
          created_at?: string | null
          description?: string | null
          external_pass_id?: string | null
          id?: string
          image?: string | null
          metadata_url?: string | null
          name?: string
          owner_address?: string | null
          project_id?: string
          status?: string
          token_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      moonpay_policies: {
        Row: {
          created_at: string | null
          external_policy_id: string | null
          id: string
          is_active: boolean | null
          name: string
          rules: Json
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          external_policy_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rules: Json
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          external_policy_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rules?: Json
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      moonpay_policy_logs: {
        Row: {
          action_taken: string | null
          action_type: string
          after_state: Json | null
          approved_by: string | null
          auto_generated: boolean | null
          before_state: Json | null
          compliance_impact: string | null
          correlation_id: string | null
          created_at: string | null
          customer_id: string | null
          entity_id: string | null
          entity_type: string | null
          executed_at: string | null
          executed_by: string | null
          execution_status: string
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          ip_address: unknown | null
          log_id: string | null
          metadata: Json | null
          notes: string | null
          policy_id: string
          policy_name: string
          policy_type: string
          reason: string | null
          requires_action: boolean | null
          retention_period_days: number | null
          rule_conditions: Json | null
          rule_results: Json | null
          session_id: string | null
          severity: string | null
          source: string | null
          transaction_id: string | null
          triggered_by: string | null
          updated_at: string | null
          user_agent: string | null
          violation_details: Json | null
        }
        Insert: {
          action_taken?: string | null
          action_type: string
          after_state?: Json | null
          approved_by?: string | null
          auto_generated?: boolean | null
          before_state?: Json | null
          compliance_impact?: string | null
          correlation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          executed_by?: string | null
          execution_status?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          ip_address?: unknown | null
          log_id?: string | null
          metadata?: Json | null
          notes?: string | null
          policy_id: string
          policy_name: string
          policy_type: string
          reason?: string | null
          requires_action?: boolean | null
          retention_period_days?: number | null
          rule_conditions?: Json | null
          rule_results?: Json | null
          session_id?: string | null
          severity?: string | null
          source?: string | null
          transaction_id?: string | null
          triggered_by?: string | null
          updated_at?: string | null
          user_agent?: string | null
          violation_details?: Json | null
        }
        Update: {
          action_taken?: string | null
          action_type?: string
          after_state?: Json | null
          approved_by?: string | null
          auto_generated?: boolean | null
          before_state?: Json | null
          compliance_impact?: string | null
          correlation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          executed_by?: string | null
          execution_status?: string
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          ip_address?: unknown | null
          log_id?: string | null
          metadata?: Json | null
          notes?: string | null
          policy_id?: string
          policy_name?: string
          policy_type?: string
          reason?: string | null
          requires_action?: boolean | null
          retention_period_days?: number | null
          rule_conditions?: Json | null
          rule_results?: Json | null
          session_id?: string | null
          severity?: string | null
          source?: string | null
          transaction_id?: string | null
          triggered_by?: string | null
          updated_at?: string | null
          user_agent?: string | null
          violation_details?: Json | null
        }
        Relationships: []
      }
      moonpay_projects: {
        Row: {
          contract_address: string | null
          created_at: string | null
          description: string | null
          external_project_id: string | null
          id: string
          max_supply: number | null
          metadata: Json | null
          name: string
          network: string
          total_supply: number | null
          updated_at: string | null
        }
        Insert: {
          contract_address?: string | null
          created_at?: string | null
          description?: string | null
          external_project_id?: string | null
          id?: string
          max_supply?: number | null
          metadata?: Json | null
          name: string
          network: string
          total_supply?: number | null
          updated_at?: string | null
        }
        Update: {
          contract_address?: string | null
          created_at?: string | null
          description?: string | null
          external_project_id?: string | null
          id?: string
          max_supply?: number | null
          metadata?: Json | null
          name?: string
          network?: string
          total_supply?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      moonpay_swap_transactions: {
        Row: {
          base_amount: number
          base_currency: string
          created_at: string | null
          external_transaction_id: string | null
          fees: Json | null
          from_address: string
          id: string
          metadata: Json | null
          quote_amount: number
          quote_currency: string
          quote_id: string
          status: string
          to_address: string
          tx_hash: string | null
          updated_at: string | null
        }
        Insert: {
          base_amount: number
          base_currency: string
          created_at?: string | null
          external_transaction_id?: string | null
          fees?: Json | null
          from_address: string
          id?: string
          metadata?: Json | null
          quote_amount: number
          quote_currency: string
          quote_id: string
          status: string
          to_address: string
          tx_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          base_amount?: number
          base_currency?: string
          created_at?: string | null
          external_transaction_id?: string | null
          fees?: Json | null
          from_address?: string
          id?: string
          metadata?: Json | null
          quote_amount?: number
          quote_currency?: string
          quote_id?: string
          status?: string
          to_address?: string
          tx_hash?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      moonpay_transactions: {
        Row: {
          created_at: string | null
          crypto_amount: number | null
          crypto_currency: string
          customer_id: string | null
          external_transaction_id: string | null
          fees: Json | null
          fiat_amount: number
          fiat_currency: string
          id: string
          metadata: Json | null
          payment_method: string | null
          redirect_url: string | null
          status: string
          type: string
          updated_at: string | null
          wallet_address: string | null
          widget_redirect_url: string | null
        }
        Insert: {
          created_at?: string | null
          crypto_amount?: number | null
          crypto_currency: string
          customer_id?: string | null
          external_transaction_id?: string | null
          fees?: Json | null
          fiat_amount: number
          fiat_currency: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          redirect_url?: string | null
          status?: string
          type: string
          updated_at?: string | null
          wallet_address?: string | null
          widget_redirect_url?: string | null
        }
        Update: {
          created_at?: string | null
          crypto_amount?: number | null
          crypto_currency?: string
          customer_id?: string | null
          external_transaction_id?: string | null
          fees?: Json | null
          fiat_amount?: number
          fiat_currency?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          redirect_url?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          wallet_address?: string | null
          widget_redirect_url?: string | null
        }
        Relationships: []
      }
      moonpay_webhook_config: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivery_attempts_count: number | null
          delivery_settings: Json | null
          description: string | null
          environment: string
          events: string[]
          failed_deliveries_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_delivery_attempt: string | null
          last_failure_reason: string | null
          last_successful_delivery: string | null
          metadata: Json | null
          retry_policy: Json | null
          secret_key: string | null
          status: string
          successful_deliveries_count: number | null
          updated_at: string | null
          url: string
          version: string | null
          webhook_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivery_attempts_count?: number | null
          delivery_settings?: Json | null
          description?: string | null
          environment?: string
          events?: string[]
          failed_deliveries_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_delivery_attempt?: string | null
          last_failure_reason?: string | null
          last_successful_delivery?: string | null
          metadata?: Json | null
          retry_policy?: Json | null
          secret_key?: string | null
          status?: string
          successful_deliveries_count?: number | null
          updated_at?: string | null
          url: string
          version?: string | null
          webhook_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivery_attempts_count?: number | null
          delivery_settings?: Json | null
          description?: string | null
          environment?: string
          events?: string[]
          failed_deliveries_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_delivery_attempt?: string | null
          last_failure_reason?: string | null
          last_successful_delivery?: string | null
          metadata?: Json | null
          retry_policy?: Json | null
          secret_key?: string | null
          status?: string
          successful_deliveries_count?: number | null
          updated_at?: string | null
          url?: string
          version?: string | null
          webhook_id?: string | null
        }
        Relationships: []
      }
      moonpay_webhook_events: {
        Row: {
          event_data: Json
          event_type: string
          id: string
          last_processing_error: string | null
          processed: boolean | null
          processed_at: string | null
          processing_attempts: number | null
          received_at: string | null
          signature: string
        }
        Insert: {
          event_data: Json
          event_type: string
          id?: string
          last_processing_error?: string | null
          processed?: boolean | null
          processed_at?: string | null
          processing_attempts?: number | null
          received_at?: string | null
          signature: string
        }
        Update: {
          event_data?: Json
          event_type?: string
          id?: string
          last_processing_error?: string | null
          processed?: boolean | null
          processed_at?: string | null
          processing_attempts?: number | null
          received_at?: string | null
          signature?: string
        }
        Relationships: []
      }
      multi_sig_confirmations: {
        Row: {
          confirmed: boolean | null
          created_at: string | null
          id: string
          owner: string
          signature: string
          signer: string | null
          timestamp: string | null
          transaction_id: string | null
        }
        Insert: {
          confirmed?: boolean | null
          created_at?: string | null
          id?: string
          owner: string
          signature: string
          signer?: string | null
          timestamp?: string | null
          transaction_id?: string | null
        }
        Update: {
          confirmed?: boolean | null
          created_at?: string | null
          id?: string
          owner?: string
          signature?: string
          signer?: string | null
          timestamp?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multi_sig_confirmations_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "multi_sig_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_sig_transactions: {
        Row: {
          blockchain: string
          blockchain_specific_data: Json | null
          confirmations: number
          created_at: string | null
          data: string
          description: string | null
          destination_wallet_address: string
          executed: boolean
          hash: string
          id: string
          nonce: number
          required: number | null
          to: string | null
          token_address: string | null
          token_symbol: string | null
          updated_at: string | null
          value: string
          wallet_id: string | null
        }
        Insert: {
          blockchain: string
          blockchain_specific_data?: Json | null
          confirmations?: number
          created_at?: string | null
          data?: string
          description?: string | null
          destination_wallet_address: string
          executed?: boolean
          hash: string
          id?: string
          nonce: number
          required?: number | null
          to?: string | null
          token_address?: string | null
          token_symbol?: string | null
          updated_at?: string | null
          value: string
          wallet_id?: string | null
        }
        Update: {
          blockchain?: string
          blockchain_specific_data?: Json | null
          confirmations?: number
          created_at?: string | null
          data?: string
          description?: string | null
          destination_wallet_address?: string
          executed?: boolean
          hash?: string
          id?: string
          nonce?: number
          required?: number | null
          to?: string | null
          token_address?: string | null
          token_symbol?: string | null
          updated_at?: string | null
          value?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "multi_sig_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "multi_sig_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_sig_wallets: {
        Row: {
          address: string
          block_reason: string | null
          blockchain: string
          blocked_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          owners: string[]
          status: string | null
          threshold: number
          updated_at: string | null
        }
        Insert: {
          address: string
          block_reason?: string | null
          blockchain: string
          blocked_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          owners: string[]
          status?: string | null
          threshold: number
          updated_at?: string | null
        }
        Update: {
          address?: string
          block_reason?: string | null
          blockchain?: string
          blocked_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          owners?: string[]
          status?: string | null
          threshold?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      nav_oracle_configs: {
        Row: {
          active: boolean | null
          api_key_encrypted: string | null
          consecutive_failures: number | null
          created_at: string | null
          created_by: string | null
          endpoint_url: string | null
          fund_id: string
          id: string
          last_error: string | null
          last_update: string | null
          max_change_percent: number | null
          max_nav: number | null
          min_nav: number | null
          name: string
          oracle_type: string
          response_path: string | null
          success_rate: number | null
          update_frequency: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          api_key_encrypted?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string | null
          fund_id: string
          id?: string
          last_error?: string | null
          last_update?: string | null
          max_change_percent?: number | null
          max_nav?: number | null
          min_nav?: number | null
          name: string
          oracle_type: string
          response_path?: string | null
          success_rate?: number | null
          update_frequency?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          api_key_encrypted?: string | null
          consecutive_failures?: number | null
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string | null
          fund_id?: string
          id?: string
          last_error?: string | null
          last_update?: string | null
          max_change_percent?: number | null
          max_nav?: number | null
          min_nav?: number | null
          name?: string
          oracle_type?: string
          response_path?: string | null
          success_rate?: number | null
          update_frequency?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_required: boolean
          action_url: string | null
          created_at: string
          date: string
          description: string
          id: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_required?: boolean
          action_url?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_required?: boolean
          action_url?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_restrictions: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          id: string
          reason: string
          type: string
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          id?: string
          reason: string
          type: string
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          type?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      onchain_claims: {
        Row: {
          data: string | null
          id: string
          identity_id: string | null
          issuer_id: string | null
          signature: string
          status: string
          topic: number
          valid_from: string | null
          valid_to: string | null
          verification_timestamp: string
        }
        Insert: {
          data?: string | null
          id?: string
          identity_id?: string | null
          issuer_id?: string | null
          signature: string
          status: string
          topic: number
          valid_from?: string | null
          valid_to?: string | null
          verification_timestamp?: string
        }
        Update: {
          data?: string | null
          id?: string
          identity_id?: string | null
          issuer_id?: string | null
          signature?: string
          status?: string
          topic?: number
          valid_from?: string | null
          valid_to?: string | null
          verification_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "onchain_claims_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "onchain_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onchain_claims_issuer_id_fkey"
            columns: ["issuer_id"]
            isOneToOne: false
            referencedRelation: "onchain_issuers"
            referencedColumns: ["id"]
          },
        ]
      }
      onchain_identities: {
        Row: {
          blockchain: string
          created_at: string
          id: string
          identity_address: string
          is_active: boolean
          network: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          blockchain: string
          created_at?: string
          id?: string
          identity_address: string
          is_active?: boolean
          network: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          blockchain?: string
          created_at?: string
          id?: string
          identity_address?: string
          is_active?: boolean
          network?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      onchain_issuers: {
        Row: {
          blockchain: string
          created_at: string
          id: string
          is_active: boolean
          issuer_address: string
          issuer_name: string
          network: string
          trusted_for_claims: number[]
          updated_at: string
        }
        Insert: {
          blockchain: string
          created_at?: string
          id?: string
          is_active?: boolean
          issuer_address: string
          issuer_name: string
          network: string
          trusted_for_claims?: number[]
          updated_at?: string
        }
        Update: {
          blockchain?: string
          created_at?: string
          id?: string
          is_active?: boolean
          issuer_address?: string
          issuer_name?: string
          network?: string
          trusted_for_claims?: number[]
          updated_at?: string
        }
        Relationships: []
      }
      onchain_verification_history: {
        Row: {
          id: string
          identity_id: string | null
          reason: string | null
          required_claims: number[]
          result: boolean
          verification_timestamp: string
          verification_type: string
        }
        Insert: {
          id?: string
          identity_id?: string | null
          reason?: string | null
          required_claims?: number[]
          result: boolean
          verification_timestamp?: string
          verification_type: string
        }
        Update: {
          id?: string
          identity_id?: string | null
          reason?: string | null
          required_claims?: number[]
          result?: boolean
          verification_timestamp?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "onchain_verification_history_identity_id_fkey"
            columns: ["identity_id"]
            isOneToOne: false
            referencedRelation: "onchain_identities"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: Json | null
          business_type: string | null
          compliance_status: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          jurisdiction: string | null
          legal_name: string | null
          legal_representatives: Json | null
          name: string
          onboarding_completed: boolean | null
          registration_date: string | null
          registration_number: string | null
          status: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          business_type?: string | null
          compliance_status?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          jurisdiction?: string | null
          legal_name?: string | null
          legal_representatives?: Json | null
          name: string
          onboarding_completed?: boolean | null
          registration_date?: string | null
          registration_number?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          business_type?: string | null
          compliance_status?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          jurisdiction?: string | null
          legal_name?: string | null
          legal_representatives?: Json | null
          name?: string
          onboarding_completed?: boolean | null
          registration_date?: string | null
          registration_number?: string | null
          status?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payer: {
        Row: {
          name: string | null
          payer_id: number
        }
        Insert: {
          name?: string | null
          payer_id?: never
        }
        Update: {
          name?: string | null
          payer_id?: never
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      policy_rule_approvers: {
        Row: {
          comment: string | null
          created_at: string
          created_by: string
          id: string
          policy_rule_id: string
          status: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          created_by: string
          id?: string
          policy_rule_id: string
          status?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          created_by?: string
          id?: string
          policy_rule_id?: string
          status?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_rule_approvers_policy_rule_id_fkey"
            columns: ["policy_rule_id"]
            isOneToOne: false
            referencedRelation: "rules"
            referencedColumns: ["rule_id"]
          },
        ]
      }
      policy_rule_approvers_backup: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          policy_rule_id: string | null
          status: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          policy_rule_id?: string | null
          status?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          policy_rule_id?: string | null
          status?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      policy_template_approvers: {
        Row: {
          created_by: string | null
          status: string | null
          template_id: string
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_by?: string | null
          status?: string | null
          template_id: string
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_by?: string | null
          status?: string | null
          template_id?: string
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_template_approvers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "policy_templates"
            referencedColumns: ["template_id"]
          },
          {
            foreignKeyName: "policy_template_approvers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "policy_template_approvers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_templates: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          status: string
          template_data: Json
          template_id: string
          template_name: string
          template_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          status?: string
          template_data: Json
          template_id?: string
          template_name: string
          template_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          status?: string
          template_data?: Json
          template_id?: string
          template_name?: string
          template_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pool: {
        Row: {
          creation_timestamp: string | null
          pool_id: number
          pool_name: string | null
          pool_type: Database["public"]["Enums"]["pool_type_enum"] | null
        }
        Insert: {
          creation_timestamp?: string | null
          pool_id?: never
          pool_name?: string | null
          pool_type?: Database["public"]["Enums"]["pool_type_enum"] | null
        }
        Update: {
          creation_timestamp?: string | null
          pool_id?: never
          pool_name?: string | null
          pool_type?: Database["public"]["Enums"]["pool_type_enum"] | null
        }
        Relationships: []
      }
      project_credentials: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          key_vault_id: string
          project_id: string
          public_key: string
          revoked_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_vault_id: string
          project_id: string
          public_key: string
          revoked_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_vault_id?: string
          project_id?: string
          public_key?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          authorized_shares: number | null
          company_valuation: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration: Database["public"]["Enums"]["project_duration"] | null
          estimated_yield_percentage: number | null
          id: string
          investment_status: string
          is_primary: boolean | null
          jurisdiction: string | null
          legal_entity: string | null
          maturity_date: string | null
          minimum_investment: number | null
          name: string
          project_type: string | null
          share_price: number | null
          status: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          target_raise: number | null
          tax_id: string | null
          token_symbol: string | null
          total_notional: number | null
          transaction_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          authorized_shares?: number | null
          company_valuation?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration?: Database["public"]["Enums"]["project_duration"] | null
          estimated_yield_percentage?: number | null
          id?: string
          investment_status?: string
          is_primary?: boolean | null
          jurisdiction?: string | null
          legal_entity?: string | null
          maturity_date?: string | null
          minimum_investment?: number | null
          name: string
          project_type?: string | null
          share_price?: number | null
          status?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          target_raise?: number | null
          tax_id?: string | null
          token_symbol?: string | null
          total_notional?: number | null
          transaction_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          authorized_shares?: number | null
          company_valuation?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration?: Database["public"]["Enums"]["project_duration"] | null
          estimated_yield_percentage?: number | null
          id?: string
          investment_status?: string
          is_primary?: boolean | null
          jurisdiction?: string | null
          legal_entity?: string | null
          maturity_date?: string | null
          minimum_investment?: number | null
          name?: string
          project_type?: string | null
          share_price?: number | null
          status?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          target_raise?: number | null
          tax_id?: string | null
          token_symbol?: string | null
          total_notional?: number | null
          transaction_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      provider: {
        Row: {
          address: string | null
          name: string | null
          provider_id: number
        }
        Insert: {
          address?: string | null
          name?: string | null
          provider_id?: never
        }
        Update: {
          address?: string | null
          name?: string | null
          provider_id?: never
        }
        Relationships: []
      }
      ramp_network_config: {
        Row: {
          api_key_encrypted: string
          configuration: Json | null
          created_at: string
          created_by: string | null
          enabled_flows: string[]
          environment: string
          host_app_name: string
          host_logo_url: string
          id: string
          is_active: boolean
          organization_id: string | null
          updated_at: string
          webhook_secret_encrypted: string | null
        }
        Insert: {
          api_key_encrypted: string
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          enabled_flows?: string[]
          environment?: string
          host_app_name: string
          host_logo_url: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          updated_at?: string
          webhook_secret_encrypted?: string | null
        }
        Update: {
          api_key_encrypted?: string
          configuration?: Json | null
          created_at?: string
          created_by?: string | null
          enabled_flows?: string[]
          environment?: string
          host_app_name?: string
          host_logo_url?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          updated_at?: string
          webhook_secret_encrypted?: string | null
        }
        Relationships: []
      }
      ramp_supported_assets: {
        Row: {
          address: string | null
          chain: string
          created_at: string
          currency_code: string
          decimals: number
          enabled: boolean
          flow_type: string
          hidden: boolean
          id: string
          last_updated: string
          logo_url: string | null
          max_purchase_amount: number | null
          min_purchase_amount: number | null
          min_purchase_crypto_amount: string | null
          name: string
          network_fee: number | null
          price_data: Json | null
          symbol: string
          type: string
        }
        Insert: {
          address?: string | null
          chain: string
          created_at?: string
          currency_code?: string
          decimals: number
          enabled?: boolean
          flow_type: string
          hidden?: boolean
          id?: string
          last_updated?: string
          logo_url?: string | null
          max_purchase_amount?: number | null
          min_purchase_amount?: number | null
          min_purchase_crypto_amount?: string | null
          name: string
          network_fee?: number | null
          price_data?: Json | null
          symbol: string
          type: string
        }
        Update: {
          address?: string | null
          chain?: string
          created_at?: string
          currency_code?: string
          decimals?: number
          enabled?: boolean
          flow_type?: string
          hidden?: boolean
          id?: string
          last_updated?: string
          logo_url?: string | null
          max_purchase_amount?: number | null
          min_purchase_amount?: number | null
          min_purchase_crypto_amount?: string | null
          name?: string
          network_fee?: number | null
          price_data?: Json | null
          symbol?: string
          type?: string
        }
        Relationships: []
      }
      ramp_transaction_events: {
        Row: {
          event_data: Json
          event_type: string
          id: string
          ip_address: unknown | null
          ramp_event_id: string | null
          session_id: string | null
          timestamp: string
          transaction_id: string
          user_agent: string | null
        }
        Insert: {
          event_data: Json
          event_type: string
          id?: string
          ip_address?: unknown | null
          ramp_event_id?: string | null
          session_id?: string | null
          timestamp?: string
          transaction_id: string
          user_agent?: string | null
        }
        Update: {
          event_data?: Json
          event_type?: string
          id?: string
          ip_address?: unknown | null
          ramp_event_id?: string | null
          session_id?: string | null
          timestamp?: string
          transaction_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ramp_transaction_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "fiat_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ramp_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          flow_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          flow_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          flow_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      redemption_approver_assignments: {
        Row: {
          approval_config_id: string
          approval_signature: string | null
          approval_timestamp: string | null
          approver_user_id: string
          assigned_at: string | null
          comments: string | null
          id: string
          ip_address: unknown | null
          redemption_request_id: string
          rejection_reason: string | null
          status: string | null
          user_agent: string | null
        }
        Insert: {
          approval_config_id: string
          approval_signature?: string | null
          approval_timestamp?: string | null
          approver_user_id: string
          assigned_at?: string | null
          comments?: string | null
          id?: string
          ip_address?: unknown | null
          redemption_request_id: string
          rejection_reason?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Update: {
          approval_config_id?: string
          approval_signature?: string | null
          approval_timestamp?: string | null
          approver_user_id?: string
          assigned_at?: string | null
          comments?: string | null
          id?: string
          ip_address?: unknown | null
          redemption_request_id?: string
          rejection_reason?: string | null
          status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_approver_assignments_approval_config_id_fkey"
            columns: ["approval_config_id"]
            isOneToOne: false
            referencedRelation: "approval_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_approver_assignments_approval_config_id_fkey"
            columns: ["approval_config_id"]
            isOneToOne: false
            referencedRelation: "approval_configs_with_approvers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_approver_assignments_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "redemption_approver_assignments_approver_user_id_fkey"
            columns: ["approver_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_approvers: {
        Row: {
          approved: boolean
          approved_at: string | null
          approver_id: string
          avatar_url: string | null
          comments: string | null
          created_at: string
          decision_date: string | null
          id: string
          name: string
          redemption_id: string
          role: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approver_id: string
          avatar_url?: string | null
          comments?: string | null
          created_at?: string
          decision_date?: string | null
          id?: string
          name: string
          redemption_id: string
          role: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approver_id?: string
          avatar_url?: string | null
          comments?: string | null
          created_at?: string
          decision_date?: string | null
          id?: string
          name?: string
          redemption_id?: string
          role?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_redemption_approvers_redemption_id"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "redemption_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_approvers_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "redemption_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_requests: {
        Row: {
          conversion_rate: number
          created_at: string
          destination_wallet_address: string
          id: string
          investor_count: number | null
          investor_id: string | null
          investor_name: string | null
          is_bulk_redemption: boolean | null
          redemption_type: string
          rejected_by: string | null
          rejection_reason: string | null
          rejection_timestamp: string | null
          required_approvals: number
          source_wallet_address: string
          status: string
          token_amount: number
          token_type: string
          updated_at: string
        }
        Insert: {
          conversion_rate: number
          created_at?: string
          destination_wallet_address: string
          id?: string
          investor_count?: number | null
          investor_id?: string | null
          investor_name?: string | null
          is_bulk_redemption?: boolean | null
          redemption_type: string
          rejected_by?: string | null
          rejection_reason?: string | null
          rejection_timestamp?: string | null
          required_approvals?: number
          source_wallet_address: string
          status: string
          token_amount: number
          token_type: string
          updated_at?: string
        }
        Update: {
          conversion_rate?: number
          created_at?: string
          destination_wallet_address?: string
          id?: string
          investor_count?: number | null
          investor_id?: string | null
          investor_name?: string | null
          is_bulk_redemption?: boolean | null
          redemption_type?: string
          rejected_by?: string | null
          rejection_reason?: string | null
          rejection_timestamp?: string | null
          required_approvals?: number
          source_wallet_address?: string
          status?: string
          token_amount?: number
          token_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      redemption_rules: {
        Row: {
          allow_any_time_redemption: boolean | null
          created_at: string | null
          enable_admin_override: boolean | null
          enable_pro_rata_distribution: boolean | null
          id: string
          immediate_execution: boolean | null
          lock_tokens_on_request: boolean | null
          lock_up_period: number | null
          notify_investors: boolean | null
          queue_unprocessed_requests: boolean | null
          redemption_type: string
          repurchase_frequency: string | null
          require_multi_sig_approval: boolean | null
          required_approvers: number | null
          rule_id: string | null
          settlement_method: string | null
          submission_window_days: number | null
          total_approvers: number | null
          updated_at: string | null
          use_latest_nav: boolean | null
          use_window_nav: boolean | null
        }
        Insert: {
          allow_any_time_redemption?: boolean | null
          created_at?: string | null
          enable_admin_override?: boolean | null
          enable_pro_rata_distribution?: boolean | null
          id?: string
          immediate_execution?: boolean | null
          lock_tokens_on_request?: boolean | null
          lock_up_period?: number | null
          notify_investors?: boolean | null
          queue_unprocessed_requests?: boolean | null
          redemption_type: string
          repurchase_frequency?: string | null
          require_multi_sig_approval?: boolean | null
          required_approvers?: number | null
          rule_id?: string | null
          settlement_method?: string | null
          submission_window_days?: number | null
          total_approvers?: number | null
          updated_at?: string | null
          use_latest_nav?: boolean | null
          use_window_nav?: boolean | null
        }
        Update: {
          allow_any_time_redemption?: boolean | null
          created_at?: string | null
          enable_admin_override?: boolean | null
          enable_pro_rata_distribution?: boolean | null
          id?: string
          immediate_execution?: boolean | null
          lock_tokens_on_request?: boolean | null
          lock_up_period?: number | null
          notify_investors?: boolean | null
          queue_unprocessed_requests?: boolean | null
          redemption_type?: string
          repurchase_frequency?: string | null
          require_multi_sig_approval?: boolean | null
          required_approvers?: number | null
          rule_id?: string | null
          settlement_method?: string | null
          submission_window_days?: number | null
          total_approvers?: number | null
          updated_at?: string | null
          use_latest_nav?: boolean | null
          use_window_nav?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_rules_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rules"
            referencedColumns: ["rule_id"]
          },
        ]
      }
      redemption_settlements: {
        Row: {
          actual_completion: string | null
          burn_confirmed_at: string | null
          burn_gas_price: number | null
          burn_gas_used: number | null
          burn_status: string | null
          burn_transaction_hash: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          estimated_completion: string | null
          exchange_rate: number | null
          gas_estimate: number | null
          id: string
          last_retry_at: string | null
          nav_used: number | null
          redemption_request_id: string
          retry_count: number | null
          settlement_fee: number | null
          settlement_type: string
          status: string
          token_amount: number
          token_contract_address: string
          transfer_amount: number
          transfer_confirmed_at: string | null
          transfer_currency: string
          transfer_gas_price: number | null
          transfer_gas_used: number | null
          transfer_status: string | null
          transfer_to_address: string
          transfer_transaction_hash: string | null
          updated_at: string | null
        }
        Insert: {
          actual_completion?: string | null
          burn_confirmed_at?: string | null
          burn_gas_price?: number | null
          burn_gas_used?: number | null
          burn_status?: string | null
          burn_transaction_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          exchange_rate?: number | null
          gas_estimate?: number | null
          id?: string
          last_retry_at?: string | null
          nav_used?: number | null
          redemption_request_id: string
          retry_count?: number | null
          settlement_fee?: number | null
          settlement_type: string
          status?: string
          token_amount: number
          token_contract_address: string
          transfer_amount: number
          transfer_confirmed_at?: string | null
          transfer_currency?: string
          transfer_gas_price?: number | null
          transfer_gas_used?: number | null
          transfer_status?: string | null
          transfer_to_address: string
          transfer_transaction_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_completion?: string | null
          burn_confirmed_at?: string | null
          burn_gas_price?: number | null
          burn_gas_used?: number | null
          burn_status?: string | null
          burn_transaction_hash?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          exchange_rate?: number | null
          gas_estimate?: number | null
          id?: string
          last_retry_at?: string | null
          nav_used?: number | null
          redemption_request_id?: string
          retry_count?: number | null
          settlement_fee?: number | null
          settlement_type?: string
          status?: string
          token_amount?: number
          token_contract_address?: string
          transfer_amount?: number
          transfer_confirmed_at?: string | null
          transfer_currency?: string
          transfer_gas_price?: number | null
          transfer_gas_used?: number | null
          transfer_status?: string | null
          transfer_to_address?: string
          transfer_transaction_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_settlements_redemption_request_id_fkey"
            columns: ["redemption_request_id"]
            isOneToOne: false
            referencedRelation: "redemption_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      redemption_window_configs: {
        Row: {
          active: boolean | null
          auto_process: boolean | null
          created_at: string | null
          created_by: string | null
          enable_admin_override: boolean | null
          enable_pro_rata_distribution: boolean | null
          frequency: string
          fund_id: string
          id: string
          lock_tokens_on_request: boolean | null
          lock_up_period: number
          max_redemption_percentage: number | null
          name: string
          notification_days: number | null
          queue_unprocessed_requests: boolean | null
          submission_window_days: number
          updated_at: string | null
          use_window_nav: boolean | null
        }
        Insert: {
          active?: boolean | null
          auto_process?: boolean | null
          created_at?: string | null
          created_by?: string | null
          enable_admin_override?: boolean | null
          enable_pro_rata_distribution?: boolean | null
          frequency: string
          fund_id: string
          id?: string
          lock_tokens_on_request?: boolean | null
          lock_up_period?: number
          max_redemption_percentage?: number | null
          name: string
          notification_days?: number | null
          queue_unprocessed_requests?: boolean | null
          submission_window_days?: number
          updated_at?: string | null
          use_window_nav?: boolean | null
        }
        Update: {
          active?: boolean | null
          auto_process?: boolean | null
          created_at?: string | null
          created_by?: string | null
          enable_admin_override?: boolean | null
          enable_pro_rata_distribution?: boolean | null
          frequency?: string
          fund_id?: string
          id?: string
          lock_tokens_on_request?: boolean | null
          lock_up_period?: number
          max_redemption_percentage?: number | null
          name?: string
          notification_days?: number | null
          queue_unprocessed_requests?: boolean | null
          submission_window_days?: number
          updated_at?: string | null
          use_window_nav?: boolean | null
        }
        Relationships: []
      }
      redemption_windows: {
        Row: {
          approved_requests: number | null
          approved_value: number | null
          config_id: string
          created_at: string | null
          created_by: string | null
          current_requests: number | null
          end_date: string
          id: string
          max_redemption_amount: number | null
          nav: number | null
          nav_date: string | null
          nav_source: string | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          queued_requests: number | null
          queued_value: number | null
          rejected_requests: number | null
          rejected_value: number | null
          start_date: string
          status: string
          submission_end_date: string
          submission_start_date: string
          total_request_value: number | null
          updated_at: string | null
        }
        Insert: {
          approved_requests?: number | null
          approved_value?: number | null
          config_id: string
          created_at?: string | null
          created_by?: string | null
          current_requests?: number | null
          end_date: string
          id?: string
          max_redemption_amount?: number | null
          nav?: number | null
          nav_date?: string | null
          nav_source?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          queued_requests?: number | null
          queued_value?: number | null
          rejected_requests?: number | null
          rejected_value?: number | null
          start_date: string
          status?: string
          submission_end_date: string
          submission_start_date: string
          total_request_value?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_requests?: number | null
          approved_value?: number | null
          config_id?: string
          created_at?: string | null
          created_by?: string | null
          current_requests?: number | null
          end_date?: string
          id?: string
          max_redemption_amount?: number | null
          nav?: number | null
          nav_date?: string | null
          nav_source?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          queued_requests?: number | null
          queued_value?: number | null
          rejected_requests?: number | null
          rejected_value?: number | null
          start_date?: string
          status?: string
          submission_end_date?: string
          submission_start_date?: string
          total_request_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_windows_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "redemption_window_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_equivalence_mapping: {
        Row: {
          created_at: string | null
          equivalence_type: string
          equivalent_jurisdiction: string
          expiry_date: string | null
          home_jurisdiction: string
          id: string
          mutual_recognition: boolean | null
          notes: string | null
          passport_rights: boolean | null
          recognition_date: string
          regulatory_framework: string
          simplified_procedures: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equivalence_type: string
          equivalent_jurisdiction: string
          expiry_date?: string | null
          home_jurisdiction: string
          id?: string
          mutual_recognition?: boolean | null
          notes?: string | null
          passport_rights?: boolean | null
          recognition_date: string
          regulatory_framework: string
          simplified_procedures?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equivalence_type?: string
          equivalent_jurisdiction?: string
          expiry_date?: string | null
          home_jurisdiction?: string
          id?: string
          mutual_recognition?: boolean | null
          notes?: string | null
          passport_rights?: boolean | null
          recognition_date?: string
          regulatory_framework?: string
          simplified_procedures?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_equivalence_mapping_equivalent_jurisdiction_fkey"
            columns: ["equivalent_jurisdiction"]
            isOneToOne: false
            referencedRelation: "geographic_jurisdictions"
            referencedColumns: ["country_code"]
          },
          {
            foreignKeyName: "regulatory_equivalence_mapping_equivalent_jurisdiction_fkey"
            columns: ["equivalent_jurisdiction"]
            isOneToOne: false
            referencedRelation: "token_geographic_restrictions_view"
            referencedColumns: ["country_code"]
          },
          {
            foreignKeyName: "regulatory_equivalence_mapping_home_jurisdiction_fkey"
            columns: ["home_jurisdiction"]
            isOneToOne: false
            referencedRelation: "geographic_jurisdictions"
            referencedColumns: ["country_code"]
          },
          {
            foreignKeyName: "regulatory_equivalence_mapping_home_jurisdiction_fkey"
            columns: ["home_jurisdiction"]
            isOneToOne: false
            referencedRelation: "token_geographic_restrictions_view"
            referencedColumns: ["country_code"]
          },
        ]
      }
      ripple_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          destination_tag: number | null
          exchange_rate: number | null
          fee: number | null
          from_account: string
          from_country: string | null
          hash: string
          id: string
          ledger_index: number | null
          memo: string | null
          payment_type: string | null
          sequence_number: number | null
          source_tag: number | null
          status: string
          to_account: string
          to_country: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          destination_tag?: number | null
          exchange_rate?: number | null
          fee?: number | null
          from_account: string
          from_country?: string | null
          hash: string
          id?: string
          ledger_index?: number | null
          memo?: string | null
          payment_type?: string | null
          sequence_number?: number | null
          source_tag?: number | null
          status?: string
          to_account: string
          to_country?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          destination_tag?: number | null
          exchange_rate?: number | null
          fee?: number | null
          from_account?: string
          from_country?: string | null
          hash?: string
          id?: string
          ledger_index?: number | null
          memo?: string | null
          payment_type?: string | null
          sequence_number?: number | null
          source_tag?: number | null
          status?: string
          to_account?: string
          to_country?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          assessment_type: string
          created_at: string | null
          factors: Json | null
          id: string
          metadata: Json | null
          recommendations: Json | null
          risk_level: string
          risk_score: number | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          assessment_type: string
          created_at?: string | null
          factors?: Json | null
          id?: string
          metadata?: Json | null
          recommendations?: Json | null
          risk_level: string
          risk_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          assessment_type?: string
          created_at?: string | null
          factors?: Json | null
          id?: string
          metadata?: Json | null
          recommendations?: Json | null
          risk_level?: string
          risk_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_name: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_name: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_name?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_name_fkey"
            columns: ["permission_name"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "role_permissions_permission_name_fkey"
            columns: ["permission_name"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["permission_name"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          priority: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      rules: {
        Row: {
          created_at: string | null
          created_by: string
          is_template: boolean | null
          rule_details: Json | null
          rule_id: string
          rule_name: string
          rule_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          is_template?: boolean | null
          rule_details?: Json | null
          rule_id?: string
          rule_name: string
          rule_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          is_template?: boolean | null
          rule_details?: Json | null
          rule_id?: string
          rule_name?: string
          rule_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      secure_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          key_id: string
          last_used_at: string | null
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          key_id: string
          last_used_at?: string | null
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          key_id?: string
          last_used_at?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          contract_address: string | null
          created_at: string
          details: string | null
          device_info: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          related_events: string[] | null
          severity: string
          status: string | null
          timestamp: string
          transaction_hash: string | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string | null
          wallet_id: string | null
        }
        Insert: {
          contract_address?: string | null
          created_at?: string
          details?: string | null
          device_info?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          related_events?: string[] | null
          severity: string
          status?: string | null
          timestamp?: string
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
          wallet_id?: string | null
        }
        Update: {
          contract_address?: string | null
          created_at?: string
          details?: string | null
          device_info?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          related_events?: string[] | null
          severity?: string
          status?: string | null
          timestamp?: string
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
          wallet_id?: string | null
        }
        Relationships: []
      }
      settlement_metrics: {
        Row: {
          average_processing_time: unknown | null
          created_at: string | null
          date: string
          failed_settlements: number | null
          id: string
          successful_settlements: number | null
          total_fees_collected: number | null
          total_funds_transferred: number | null
          total_gas_used: number | null
          total_settlements: number | null
          total_tokens_burned: number | null
          updated_at: string | null
        }
        Insert: {
          average_processing_time?: unknown | null
          created_at?: string | null
          date: string
          failed_settlements?: number | null
          id?: string
          successful_settlements?: number | null
          total_fees_collected?: number | null
          total_funds_transferred?: number | null
          total_gas_used?: number | null
          total_settlements?: number | null
          total_tokens_burned?: number | null
          updated_at?: string | null
        }
        Update: {
          average_processing_time?: unknown | null
          created_at?: string | null
          date?: string
          failed_settlements?: number | null
          id?: string
          successful_settlements?: number | null
          total_fees_collected?: number | null
          total_funds_transferred?: number | null
          total_gas_used?: number | null
          total_settlements?: number | null
          total_tokens_burned?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      signatures: {
        Row: {
          created_at: string | null
          id: string
          proposal_id: string | null
          signature: string
          signer: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          proposal_id?: string | null
          signature: string
          signer: string
        }
        Update: {
          created_at?: string | null
          id?: string
          proposal_id?: string | null
          signature?: string
          signer?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "transaction_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_requirements: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          failure_reason: string | null
          id: string
          name: string
          order: number
          stage_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          name: string
          order: number
          stage_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          name?: string
          order?: number
          stage_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_requirements_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          allocated: boolean
          confirmed: boolean
          created_at: string | null
          currency: string
          distributed: boolean
          fiat_amount: number
          id: string
          investor_id: string
          notes: string | null
          project_id: string | null
          subscription_date: string | null
          subscription_id: string
          updated_at: string | null
        }
        Insert: {
          allocated?: boolean
          confirmed?: boolean
          created_at?: string | null
          currency: string
          distributed?: boolean
          fiat_amount: number
          id?: string
          investor_id: string
          notes?: string | null
          project_id?: string | null
          subscription_date?: string | null
          subscription_id: string
          updated_at?: string | null
        }
        Update: {
          allocated?: boolean
          confirmed?: boolean
          created_at?: string | null
          currency?: string
          distributed?: boolean
          fiat_amount?: number
          id?: string
          investor_id?: string
          notes?: string | null
          project_id?: string | null
          subscription_date?: string | null
          subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "subscriptions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      system_processes: {
        Row: {
          cancellable: boolean | null
          created_at: string | null
          end_time: string | null
          error_details: Json | null
          id: string
          metadata: Json | null
          notification_sent: boolean | null
          priority: string | null
          process_name: string
          progress: number | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cancellable?: boolean | null
          created_at?: string | null
          end_time?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          notification_sent?: boolean | null
          priority?: string | null
          process_name: string
          progress?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cancellable?: boolean | null
          created_at?: string | null
          end_time?: string | null
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          notification_sent?: boolean | null
          priority?: string | null
          process_name?: string
          progress?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          value?: string
        }
        Relationships: []
      }
      token_allocations: {
        Row: {
          allocation_date: string | null
          created_at: string
          distributed: boolean
          distribution_date: string | null
          distribution_tx_hash: string | null
          id: string
          investor_id: string
          minted: boolean
          minting_date: string | null
          minting_tx_hash: string | null
          notes: string | null
          project_id: string | null
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          subscription_id: string
          symbol: string | null
          token_amount: number
          token_id: string | null
          token_type: string
          updated_at: string | null
        }
        Insert: {
          allocation_date?: string | null
          created_at?: string
          distributed?: boolean
          distribution_date?: string | null
          distribution_tx_hash?: string | null
          id?: string
          investor_id: string
          minted?: boolean
          minting_date?: string | null
          minting_tx_hash?: string | null
          notes?: string | null
          project_id?: string | null
          standard?: Database["public"]["Enums"]["token_standard_enum"] | null
          subscription_id: string
          symbol?: string | null
          token_amount: number
          token_id?: string | null
          token_type: string
          updated_at?: string | null
        }
        Update: {
          allocation_date?: string | null
          created_at?: string
          distributed?: boolean
          distribution_date?: string | null
          distribution_tx_hash?: string | null
          id?: string
          investor_id?: string
          minted?: boolean
          minting_date?: string | null
          minting_tx_hash?: string | null
          notes?: string | null
          project_id?: string | null
          standard?: Database["public"]["Enums"]["token_standard_enum"] | null
          subscription_id?: string
          symbol?: string | null
          token_amount?: number
          token_id?: string | null
          token_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_allocations_investor_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
          {
            foreignKeyName: "token_allocations_project_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_allocations_subscription_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_allocations_token_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_allocations_token_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_allocations_token_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_allocations_token_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_allocations_token_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_allocations_token_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_allocations_token_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_allocations_token_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_deployment_history: {
        Row: {
          block_number: number | null
          blockchain: string
          environment: string
          error: string | null
          id: string
          project_id: string
          status: string
          timestamp: string
          token_id: string
          transaction_hash: string | null
        }
        Insert: {
          block_number?: number | null
          blockchain: string
          environment: string
          error?: string | null
          id?: string
          project_id: string
          status: string
          timestamp?: string
          token_id: string
          transaction_hash?: string | null
        }
        Update: {
          block_number?: number | null
          blockchain?: string
          environment?: string
          error?: string | null
          id?: string
          project_id?: string
          status?: string
          timestamp?: string
          token_id?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_deployments: {
        Row: {
          contract_address: string
          deployed_at: string | null
          deployed_by: string
          deployment_data: Json | null
          deployment_strategy: string | null
          id: string
          network: string
          status: string
          token_id: string
          transaction_hash: string
        }
        Insert: {
          contract_address: string
          deployed_at?: string | null
          deployed_by: string
          deployment_data?: Json | null
          deployment_strategy?: string | null
          id?: string
          network: string
          status?: string
          token_id: string
          transaction_hash: string
        }
        Update: {
          contract_address?: string
          deployed_at?: string | null
          deployed_by?: string
          deployment_data?: Json | null
          deployment_strategy?: string | null
          id?: string
          network?: string
          status?: string
          token_id?: string
          transaction_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_designs: {
        Row: {
          contract_address: string | null
          created_at: string | null
          deployment_date: string | null
          id: string
          name: string
          status: string
          total_supply: number
          type: string
        }
        Insert: {
          contract_address?: string | null
          created_at?: string | null
          deployment_date?: string | null
          id?: string
          name: string
          status?: string
          total_supply: number
          type: string
        }
        Update: {
          contract_address?: string | null
          created_at?: string | null
          deployment_date?: string | null
          id?: string
          name?: string
          status?: string
          total_supply?: number
          type?: string
        }
        Relationships: []
      }
      token_erc1155_balances: {
        Row: {
          address: string
          amount: string
          created_at: string | null
          id: string
          token_id: string
          token_type_id: string
          updated_at: string | null
        }
        Insert: {
          address: string
          amount: string
          created_at?: string | null
          id?: string
          token_id: string
          token_type_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          amount?: string
          created_at?: string | null
          id?: string
          token_id?: string
          token_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1155_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1155_crafting_recipes: {
        Row: {
          cooldown_period: number | null
          created_at: string | null
          id: string
          input_tokens: Json
          is_active: boolean | null
          output_quantity: number | null
          output_token_type_id: string
          recipe_name: string
          required_level: number | null
          success_rate: number | null
          token_id: string
          updated_at: string | null
        }
        Insert: {
          cooldown_period?: number | null
          created_at?: string | null
          id?: string
          input_tokens: Json
          is_active?: boolean | null
          output_quantity?: number | null
          output_token_type_id: string
          recipe_name: string
          required_level?: number | null
          success_rate?: number | null
          token_id: string
          updated_at?: string | null
        }
        Update: {
          cooldown_period?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: Json
          is_active?: boolean | null
          output_quantity?: number | null
          output_token_type_id?: string
          recipe_name?: string
          required_level?: number | null
          success_rate?: number | null
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1155_crafting_recipes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_crafting_recipes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_crafting_recipes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_crafting_recipes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_crafting_recipes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_crafting_recipes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_crafting_recipes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_crafting_recipes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1155_discount_tiers: {
        Row: {
          created_at: string | null
          discount_percentage: string
          id: string
          is_active: boolean | null
          max_quantity: number | null
          min_quantity: number
          tier_name: string | null
          token_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          min_quantity: number
          tier_name?: string | null
          token_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: string
          id?: string
          is_active?: boolean | null
          max_quantity?: number | null
          min_quantity?: number
          tier_name?: string | null
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1155_discount_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_discount_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_discount_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_discount_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_discount_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_discount_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_discount_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_discount_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1155_properties: {
        Row: {
          access_control: string | null
          airdrop_enabled: boolean | null
          airdrop_snapshot_block: number | null
          atomic_swaps_enabled: boolean | null
          base_price: string | null
          base_uri: string | null
          batch_minting_config: Json | null
          batch_minting_enabled: boolean | null
          batch_transfer_limits: Json | null
          bridge_enabled: boolean | null
          bridgeable_token_types: string[] | null
          bulk_discount_enabled: boolean | null
          bulk_discount_tiers: Json | null
          bundle_trading_enabled: boolean | null
          burn_roles: string[] | null
          burning_enabled: boolean | null
          claim_end_time: string | null
          claim_period_enabled: boolean | null
          claim_start_time: string | null
          community_treasury_enabled: boolean | null
          consumable_tokens: boolean | null
          container_config: Json | null
          container_enabled: boolean | null
          crafting_enabled: boolean | null
          created_at: string | null
          cross_collection_trading: boolean | null
          default_restriction_policy: string | null
          dynamic_uri_config: Json | null
          dynamic_uris: boolean | null
          enable_approval_for_all: boolean | null
          experience_points_enabled: boolean | null
          fusion_enabled: boolean | null
          has_royalty: boolean | null
          id: string
          is_burnable: boolean | null
          is_pausable: boolean | null
          layer2_support_enabled: boolean | null
          lazy_minting_enabled: boolean | null
          leveling_enabled: boolean | null
          marketplace_fee_percentage: string | null
          marketplace_fee_recipient: string | null
          marketplace_fees_enabled: boolean | null
          max_supply_per_type: string | null
          metadata_storage: string | null
          metadata_update_roles: string[] | null
          mint_roles: string[] | null
          price_multipliers: Json | null
          pricing_model: string | null
          proposal_creation_threshold: string | null
          referral_percentage: string | null
          referral_rewards_enabled: boolean | null
          royalty_percentage: string | null
          royalty_receiver: string | null
          sales_config: Json | null
          supply_tracking: boolean | null
          supply_tracking_advanced: boolean | null
          supported_layer2_networks: string[] | null
          token_id: string
          token_recipes: Json | null
          transfer_restrictions: Json | null
          treasury_percentage: string | null
          updatable_metadata: boolean | null
          updatable_uris: boolean | null
          updated_at: string | null
          use_geographic_restrictions: boolean | null
          voting_power_enabled: boolean | null
          voting_weight_per_token: Json | null
          whitelist_config: Json | null
          wrapped_versions: Json | null
        }
        Insert: {
          access_control?: string | null
          airdrop_enabled?: boolean | null
          airdrop_snapshot_block?: number | null
          atomic_swaps_enabled?: boolean | null
          base_price?: string | null
          base_uri?: string | null
          batch_minting_config?: Json | null
          batch_minting_enabled?: boolean | null
          batch_transfer_limits?: Json | null
          bridge_enabled?: boolean | null
          bridgeable_token_types?: string[] | null
          bulk_discount_enabled?: boolean | null
          bulk_discount_tiers?: Json | null
          bundle_trading_enabled?: boolean | null
          burn_roles?: string[] | null
          burning_enabled?: boolean | null
          claim_end_time?: string | null
          claim_period_enabled?: boolean | null
          claim_start_time?: string | null
          community_treasury_enabled?: boolean | null
          consumable_tokens?: boolean | null
          container_config?: Json | null
          container_enabled?: boolean | null
          crafting_enabled?: boolean | null
          created_at?: string | null
          cross_collection_trading?: boolean | null
          default_restriction_policy?: string | null
          dynamic_uri_config?: Json | null
          dynamic_uris?: boolean | null
          enable_approval_for_all?: boolean | null
          experience_points_enabled?: boolean | null
          fusion_enabled?: boolean | null
          has_royalty?: boolean | null
          id?: string
          is_burnable?: boolean | null
          is_pausable?: boolean | null
          layer2_support_enabled?: boolean | null
          lazy_minting_enabled?: boolean | null
          leveling_enabled?: boolean | null
          marketplace_fee_percentage?: string | null
          marketplace_fee_recipient?: string | null
          marketplace_fees_enabled?: boolean | null
          max_supply_per_type?: string | null
          metadata_storage?: string | null
          metadata_update_roles?: string[] | null
          mint_roles?: string[] | null
          price_multipliers?: Json | null
          pricing_model?: string | null
          proposal_creation_threshold?: string | null
          referral_percentage?: string | null
          referral_rewards_enabled?: boolean | null
          royalty_percentage?: string | null
          royalty_receiver?: string | null
          sales_config?: Json | null
          supply_tracking?: boolean | null
          supply_tracking_advanced?: boolean | null
          supported_layer2_networks?: string[] | null
          token_id: string
          token_recipes?: Json | null
          transfer_restrictions?: Json | null
          treasury_percentage?: string | null
          updatable_metadata?: boolean | null
          updatable_uris?: boolean | null
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          voting_power_enabled?: boolean | null
          voting_weight_per_token?: Json | null
          whitelist_config?: Json | null
          wrapped_versions?: Json | null
        }
        Update: {
          access_control?: string | null
          airdrop_enabled?: boolean | null
          airdrop_snapshot_block?: number | null
          atomic_swaps_enabled?: boolean | null
          base_price?: string | null
          base_uri?: string | null
          batch_minting_config?: Json | null
          batch_minting_enabled?: boolean | null
          batch_transfer_limits?: Json | null
          bridge_enabled?: boolean | null
          bridgeable_token_types?: string[] | null
          bulk_discount_enabled?: boolean | null
          bulk_discount_tiers?: Json | null
          bundle_trading_enabled?: boolean | null
          burn_roles?: string[] | null
          burning_enabled?: boolean | null
          claim_end_time?: string | null
          claim_period_enabled?: boolean | null
          claim_start_time?: string | null
          community_treasury_enabled?: boolean | null
          consumable_tokens?: boolean | null
          container_config?: Json | null
          container_enabled?: boolean | null
          crafting_enabled?: boolean | null
          created_at?: string | null
          cross_collection_trading?: boolean | null
          default_restriction_policy?: string | null
          dynamic_uri_config?: Json | null
          dynamic_uris?: boolean | null
          enable_approval_for_all?: boolean | null
          experience_points_enabled?: boolean | null
          fusion_enabled?: boolean | null
          has_royalty?: boolean | null
          id?: string
          is_burnable?: boolean | null
          is_pausable?: boolean | null
          layer2_support_enabled?: boolean | null
          lazy_minting_enabled?: boolean | null
          leveling_enabled?: boolean | null
          marketplace_fee_percentage?: string | null
          marketplace_fee_recipient?: string | null
          marketplace_fees_enabled?: boolean | null
          max_supply_per_type?: string | null
          metadata_storage?: string | null
          metadata_update_roles?: string[] | null
          mint_roles?: string[] | null
          price_multipliers?: Json | null
          pricing_model?: string | null
          proposal_creation_threshold?: string | null
          referral_percentage?: string | null
          referral_rewards_enabled?: boolean | null
          royalty_percentage?: string | null
          royalty_receiver?: string | null
          sales_config?: Json | null
          supply_tracking?: boolean | null
          supply_tracking_advanced?: boolean | null
          supported_layer2_networks?: string[] | null
          token_id?: string
          token_recipes?: Json | null
          transfer_restrictions?: Json | null
          treasury_percentage?: string | null
          updatable_metadata?: boolean | null
          updatable_uris?: boolean | null
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          voting_power_enabled?: boolean | null
          voting_weight_per_token?: Json | null
          whitelist_config?: Json | null
          wrapped_versions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1155_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1155_type_configs: {
        Row: {
          burn_rewards: Json | null
          crafting_materials: Json | null
          created_at: string | null
          experience_value: number | null
          id: string
          is_tradeable: boolean | null
          is_transferable: boolean | null
          mint_price: string | null
          rarity_tier: string | null
          supply_cap: string | null
          token_id: string
          token_type_id: string
          updated_at: string | null
          utility_type: string | null
        }
        Insert: {
          burn_rewards?: Json | null
          crafting_materials?: Json | null
          created_at?: string | null
          experience_value?: number | null
          id?: string
          is_tradeable?: boolean | null
          is_transferable?: boolean | null
          mint_price?: string | null
          rarity_tier?: string | null
          supply_cap?: string | null
          token_id: string
          token_type_id: string
          updated_at?: string | null
          utility_type?: string | null
        }
        Update: {
          burn_rewards?: Json | null
          crafting_materials?: Json | null
          created_at?: string | null
          experience_value?: number | null
          id?: string
          is_tradeable?: boolean | null
          is_transferable?: boolean | null
          mint_price?: string | null
          rarity_tier?: string | null
          supply_cap?: string | null
          token_id?: string
          token_type_id?: string
          updated_at?: string | null
          utility_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1155_type_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_type_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_type_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_type_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_type_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_type_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_type_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_type_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1155_types: {
        Row: {
          created_at: string | null
          description: string | null
          fungibility_type: string | null
          id: string
          max_supply: string | null
          metadata: Json | null
          name: string | null
          token_id: string
          token_type_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fungibility_type?: string | null
          id?: string
          max_supply?: string | null
          metadata?: Json | null
          name?: string | null
          token_id: string
          token_type_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fungibility_type?: string | null
          id?: string
          max_supply?: string | null
          metadata?: Json | null
          name?: string | null
          token_id?: string
          token_type_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1155_types_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_types_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_types_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_types_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_types_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_types_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_types_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_types_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1155_uri_mappings: {
        Row: {
          created_at: string | null
          id: string
          token_id: string
          token_type_id: string
          updated_at: string | null
          uri: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          token_id: string
          token_type_id: string
          updated_at?: string | null
          uri: string
        }
        Update: {
          created_at?: string | null
          id?: string
          token_id?: string
          token_type_id?: string
          updated_at?: string | null
          uri?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1155_uri_mappings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_uri_mappings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_uri_mappings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_uri_mappings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_uri_mappings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_uri_mappings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_uri_mappings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1155_uri_mappings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_controllers: {
        Row: {
          address: string
          created_at: string | null
          id: string
          permissions: string[] | null
          token_id: string
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          token_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          permissions?: string[] | null
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_controllers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_controllers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_controllers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_controllers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_controllers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_controllers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_controllers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_controllers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_corporate_actions: {
        Row: {
          action_details: Json
          action_type: string
          announcement_date: string
          created_at: string | null
          effective_date: string | null
          execution_transaction_hash: string | null
          id: string
          impact_on_price: string | null
          impact_on_supply: string | null
          payment_date: string | null
          record_date: string | null
          regulatory_approval_required: boolean | null
          shareholder_approval_required: boolean | null
          status: string | null
          token_id: string
          updated_at: string | null
          voting_deadline: string | null
        }
        Insert: {
          action_details: Json
          action_type: string
          announcement_date: string
          created_at?: string | null
          effective_date?: string | null
          execution_transaction_hash?: string | null
          id?: string
          impact_on_price?: string | null
          impact_on_supply?: string | null
          payment_date?: string | null
          record_date?: string | null
          regulatory_approval_required?: boolean | null
          shareholder_approval_required?: boolean | null
          status?: string | null
          token_id: string
          updated_at?: string | null
          voting_deadline?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          announcement_date?: string
          created_at?: string | null
          effective_date?: string | null
          execution_transaction_hash?: string | null
          id?: string
          impact_on_price?: string | null
          impact_on_supply?: string | null
          payment_date?: string | null
          record_date?: string | null
          regulatory_approval_required?: boolean | null
          shareholder_approval_required?: boolean | null
          status?: string | null
          token_id?: string
          updated_at?: string | null
          voting_deadline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_corporate_actions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_corporate_actions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_corporate_actions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_corporate_actions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_corporate_actions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_corporate_actions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_corporate_actions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_corporate_actions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_custody_providers: {
        Row: {
          certification_level: string | null
          created_at: string | null
          custody_agreement_hash: string | null
          id: string
          integration_status: string | null
          is_active: boolean | null
          jurisdiction: string | null
          provider_address: string | null
          provider_lei: string | null
          provider_name: string
          provider_type: string
          regulatory_approvals: string[] | null
          token_id: string
          updated_at: string | null
        }
        Insert: {
          certification_level?: string | null
          created_at?: string | null
          custody_agreement_hash?: string | null
          id?: string
          integration_status?: string | null
          is_active?: boolean | null
          jurisdiction?: string | null
          provider_address?: string | null
          provider_lei?: string | null
          provider_name: string
          provider_type: string
          regulatory_approvals?: string[] | null
          token_id: string
          updated_at?: string | null
        }
        Update: {
          certification_level?: string | null
          created_at?: string | null
          custody_agreement_hash?: string | null
          id?: string
          integration_status?: string | null
          is_active?: boolean | null
          jurisdiction?: string | null
          provider_address?: string | null
          provider_lei?: string | null
          provider_name?: string
          provider_type?: string
          regulatory_approvals?: string[] | null
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_custody_providers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_custody_providers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_custody_providers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_custody_providers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_custody_providers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_custody_providers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_custody_providers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_custody_providers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_documents: {
        Row: {
          created_at: string | null
          document_hash: string | null
          document_type: string | null
          document_uri: string
          id: string
          name: string
          token_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_hash?: string | null
          document_type?: string | null
          document_uri: string
          id?: string
          name: string
          token_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_hash?: string | null
          document_type?: string | null
          document_uri?: string
          id?: string
          name?: string
          token_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_documents_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_documents_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_documents_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_documents_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_documents_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_documents_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_documents_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_documents_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_partition_balances: {
        Row: {
          balance: string
          holder_address: string
          id: string
          last_updated: string | null
          metadata: Json | null
          partition_id: string
          updated_at: string | null
        }
        Insert: {
          balance?: string
          holder_address: string
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          partition_id: string
          updated_at?: string | null
        }
        Update: {
          balance?: string
          holder_address?: string
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          partition_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_partition_balances_partition_id_fkey"
            columns: ["partition_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_partitions"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_partition_operators: {
        Row: {
          authorized: boolean | null
          holder_address: string
          id: string
          last_updated: string | null
          metadata: Json | null
          operator_address: string
          partition_id: string
          updated_at: string | null
        }
        Insert: {
          authorized?: boolean | null
          holder_address: string
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          operator_address: string
          partition_id: string
          updated_at?: string | null
        }
        Update: {
          authorized?: boolean | null
          holder_address?: string
          id?: string
          last_updated?: string | null
          metadata?: Json | null
          operator_address?: string
          partition_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_partition_operators_partition_id_fkey"
            columns: ["partition_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_partitions"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_partition_transfers: {
        Row: {
          amount: string
          from_address: string
          id: string
          metadata: Json | null
          operator_address: string | null
          partition_id: string
          timestamp: string | null
          to_address: string
          transaction_hash: string | null
          updated_at: string | null
        }
        Insert: {
          amount: string
          from_address: string
          id?: string
          metadata?: Json | null
          operator_address?: string | null
          partition_id: string
          timestamp?: string | null
          to_address: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: string
          from_address?: string
          id?: string
          metadata?: Json | null
          operator_address?: string | null
          partition_id?: string
          timestamp?: string | null
          to_address?: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_partition_transfers_partition_id_fkey"
            columns: ["partition_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_partitions"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_partitions: {
        Row: {
          amount: string | null
          corporate_actions: boolean | null
          created_at: string | null
          custom_features: Json | null
          id: string
          metadata: Json | null
          name: string
          partition_id: string
          partition_type: string | null
          token_id: string
          total_supply: string | null
          transferable: boolean | null
          updated_at: string | null
        }
        Insert: {
          amount?: string | null
          corporate_actions?: boolean | null
          created_at?: string | null
          custom_features?: Json | null
          id?: string
          metadata?: Json | null
          name: string
          partition_id: string
          partition_type?: string | null
          token_id: string
          total_supply?: string | null
          transferable?: boolean | null
          updated_at?: string | null
        }
        Update: {
          amount?: string | null
          corporate_actions?: boolean | null
          created_at?: string | null
          custom_features?: Json | null
          id?: string
          metadata?: Json | null
          name?: string
          partition_id?: string
          partition_type?: string | null
          token_id?: string
          total_supply?: string | null
          transferable?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_partitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_partitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_partitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_partitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_partitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_partitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_partitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_partitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_properties: {
        Row: {
          accredited_investor_only: boolean | null
          advanced_corporate_actions: boolean | null
          advanced_governance_enabled: boolean | null
          advanced_risk_management: boolean | null
          aml_monitoring_enabled: boolean | null
          audit_trail_comprehensive: boolean | null
          auto_compliance: boolean | null
          automated_sanctions_screening: boolean | null
          beneficial_ownership_tracking: boolean | null
          board_election_support: boolean | null
          buyback_programs_enabled: boolean | null
          cap: string | null
          central_securities_depository_integration: boolean | null
          clearing_house_integration: boolean | null
          collateral_management_enabled: boolean | null
          compliance_automation_level: string | null
          compliance_module: string | null
          compliance_officer_notifications: boolean | null
          compliance_settings: Json | null
          concentration_limits: Json | null
          controller_address: string | null
          corporate_actions: boolean | null
          created_at: string | null
          cross_border_trading_enabled: boolean | null
          cross_chain_bridge_support: boolean | null
          cumulative_voting_enabled: boolean | null
          currency_hedging_enabled: boolean | null
          custody_integration_enabled: boolean | null
          custom_features: Json | null
          decimals: number | null
          default_restriction_policy: string | null
          disaster_recovery_enabled: boolean | null
          dividend_distribution: boolean | null
          document_hash: string | null
          document_management: boolean | null
          document_uri: string | null
          enforce_kyc: boolean | null
          enhanced_reporting_enabled: boolean | null
          esg_reporting_enabled: boolean | null
          financial_data_vendor_integration: boolean | null
          forced_redemption_enabled: boolean | null
          forced_transfers: boolean | null
          foreign_ownership_restrictions: Json | null
          geographic_restrictions: Json | null
          granular_control: boolean | null
          holding_period: number | null
          id: string
          initial_supply: string | null
          institutional_grade: boolean | null
          institutional_voting_services: boolean | null
          institutional_wallet_support: boolean | null
          insurance_coverage_enabled: boolean | null
          investor_accreditation: boolean | null
          investor_limits: Json | null
          investor_whitelist_enabled: boolean | null
          is_burnable: boolean | null
          is_issuable: boolean | null
          is_mintable: boolean | null
          is_multi_class: boolean | null
          is_pausable: boolean | null
          iso20022_messaging_support: boolean | null
          issuance_modules: boolean | null
          issuing_entity_lei: string | null
          issuing_entity_name: string | null
          issuing_jurisdiction: string | null
          jurisdiction_restrictions: Json | null
          kyc_settings: Json | null
          layer2_scaling_support: boolean | null
          legal_terms: string | null
          manual_approvals: boolean | null
          margin_requirements_dynamic: boolean | null
          market_data_feeds_enabled: boolean | null
          max_investor_count: number | null
          mergers_acquisitions_support: boolean | null
          multi_jurisdiction_compliance: boolean | null
          passport_regime_support: boolean | null
          pep_screening_enabled: boolean | null
          performance_analytics_enabled: boolean | null
          position_limits_enabled: boolean | null
          position_reconciliation_enabled: boolean | null
          price_discovery_mechanisms: Json | null
          prime_brokerage_support: boolean | null
          prospectus: string | null
          proxy_voting_enabled: boolean | null
          quorum_requirements: Json | null
          real_time_compliance_monitoring: boolean | null
          real_time_shareholder_registry: boolean | null
          recovery_mechanism: boolean | null
          regulation_type: string | null
          regulatory_equivalence_mapping: Json | null
          regulatory_filing_automation: boolean | null
          regulatory_reporting_automation: boolean | null
          require_kyc: boolean | null
          rights_offerings_enabled: boolean | null
          security_type: string | null
          settlement_integration: string | null
          share_repurchase_automation: boolean | null
          spin_offs_enabled: boolean | null
          stock_dividends_enabled: boolean | null
          stock_splits_enabled: boolean | null
          stress_testing_enabled: boolean | null
          suspicious_activity_reporting: boolean | null
          swift_integration_enabled: boolean | null
          third_party_custody_addresses: string[] | null
          token_details: string | null
          token_id: string
          traditional_finance_integration: boolean | null
          tranche_transferability: boolean | null
          transaction_monitoring_rules: Json | null
          transfer_restrictions: Json | null
          treasury_management_enabled: boolean | null
          treaty_benefits_enabled: boolean | null
          updated_at: string | null
          use_geographic_restrictions: boolean | null
          voting_delegation_enabled: boolean | null
          weighted_voting_by_class: boolean | null
          whitelist_config: Json | null
          whitelist_enabled: boolean | null
          withholding_tax_automation: boolean | null
        }
        Insert: {
          accredited_investor_only?: boolean | null
          advanced_corporate_actions?: boolean | null
          advanced_governance_enabled?: boolean | null
          advanced_risk_management?: boolean | null
          aml_monitoring_enabled?: boolean | null
          audit_trail_comprehensive?: boolean | null
          auto_compliance?: boolean | null
          automated_sanctions_screening?: boolean | null
          beneficial_ownership_tracking?: boolean | null
          board_election_support?: boolean | null
          buyback_programs_enabled?: boolean | null
          cap?: string | null
          central_securities_depository_integration?: boolean | null
          clearing_house_integration?: boolean | null
          collateral_management_enabled?: boolean | null
          compliance_automation_level?: string | null
          compliance_module?: string | null
          compliance_officer_notifications?: boolean | null
          compliance_settings?: Json | null
          concentration_limits?: Json | null
          controller_address?: string | null
          corporate_actions?: boolean | null
          created_at?: string | null
          cross_border_trading_enabled?: boolean | null
          cross_chain_bridge_support?: boolean | null
          cumulative_voting_enabled?: boolean | null
          currency_hedging_enabled?: boolean | null
          custody_integration_enabled?: boolean | null
          custom_features?: Json | null
          decimals?: number | null
          default_restriction_policy?: string | null
          disaster_recovery_enabled?: boolean | null
          dividend_distribution?: boolean | null
          document_hash?: string | null
          document_management?: boolean | null
          document_uri?: string | null
          enforce_kyc?: boolean | null
          enhanced_reporting_enabled?: boolean | null
          esg_reporting_enabled?: boolean | null
          financial_data_vendor_integration?: boolean | null
          forced_redemption_enabled?: boolean | null
          forced_transfers?: boolean | null
          foreign_ownership_restrictions?: Json | null
          geographic_restrictions?: Json | null
          granular_control?: boolean | null
          holding_period?: number | null
          id?: string
          initial_supply?: string | null
          institutional_grade?: boolean | null
          institutional_voting_services?: boolean | null
          institutional_wallet_support?: boolean | null
          insurance_coverage_enabled?: boolean | null
          investor_accreditation?: boolean | null
          investor_limits?: Json | null
          investor_whitelist_enabled?: boolean | null
          is_burnable?: boolean | null
          is_issuable?: boolean | null
          is_mintable?: boolean | null
          is_multi_class?: boolean | null
          is_pausable?: boolean | null
          iso20022_messaging_support?: boolean | null
          issuance_modules?: boolean | null
          issuing_entity_lei?: string | null
          issuing_entity_name?: string | null
          issuing_jurisdiction?: string | null
          jurisdiction_restrictions?: Json | null
          kyc_settings?: Json | null
          layer2_scaling_support?: boolean | null
          legal_terms?: string | null
          manual_approvals?: boolean | null
          margin_requirements_dynamic?: boolean | null
          market_data_feeds_enabled?: boolean | null
          max_investor_count?: number | null
          mergers_acquisitions_support?: boolean | null
          multi_jurisdiction_compliance?: boolean | null
          passport_regime_support?: boolean | null
          pep_screening_enabled?: boolean | null
          performance_analytics_enabled?: boolean | null
          position_limits_enabled?: boolean | null
          position_reconciliation_enabled?: boolean | null
          price_discovery_mechanisms?: Json | null
          prime_brokerage_support?: boolean | null
          prospectus?: string | null
          proxy_voting_enabled?: boolean | null
          quorum_requirements?: Json | null
          real_time_compliance_monitoring?: boolean | null
          real_time_shareholder_registry?: boolean | null
          recovery_mechanism?: boolean | null
          regulation_type?: string | null
          regulatory_equivalence_mapping?: Json | null
          regulatory_filing_automation?: boolean | null
          regulatory_reporting_automation?: boolean | null
          require_kyc?: boolean | null
          rights_offerings_enabled?: boolean | null
          security_type?: string | null
          settlement_integration?: string | null
          share_repurchase_automation?: boolean | null
          spin_offs_enabled?: boolean | null
          stock_dividends_enabled?: boolean | null
          stock_splits_enabled?: boolean | null
          stress_testing_enabled?: boolean | null
          suspicious_activity_reporting?: boolean | null
          swift_integration_enabled?: boolean | null
          third_party_custody_addresses?: string[] | null
          token_details?: string | null
          token_id: string
          traditional_finance_integration?: boolean | null
          tranche_transferability?: boolean | null
          transaction_monitoring_rules?: Json | null
          transfer_restrictions?: Json | null
          treasury_management_enabled?: boolean | null
          treaty_benefits_enabled?: boolean | null
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          voting_delegation_enabled?: boolean | null
          weighted_voting_by_class?: boolean | null
          whitelist_config?: Json | null
          whitelist_enabled?: boolean | null
          withholding_tax_automation?: boolean | null
        }
        Update: {
          accredited_investor_only?: boolean | null
          advanced_corporate_actions?: boolean | null
          advanced_governance_enabled?: boolean | null
          advanced_risk_management?: boolean | null
          aml_monitoring_enabled?: boolean | null
          audit_trail_comprehensive?: boolean | null
          auto_compliance?: boolean | null
          automated_sanctions_screening?: boolean | null
          beneficial_ownership_tracking?: boolean | null
          board_election_support?: boolean | null
          buyback_programs_enabled?: boolean | null
          cap?: string | null
          central_securities_depository_integration?: boolean | null
          clearing_house_integration?: boolean | null
          collateral_management_enabled?: boolean | null
          compliance_automation_level?: string | null
          compliance_module?: string | null
          compliance_officer_notifications?: boolean | null
          compliance_settings?: Json | null
          concentration_limits?: Json | null
          controller_address?: string | null
          corporate_actions?: boolean | null
          created_at?: string | null
          cross_border_trading_enabled?: boolean | null
          cross_chain_bridge_support?: boolean | null
          cumulative_voting_enabled?: boolean | null
          currency_hedging_enabled?: boolean | null
          custody_integration_enabled?: boolean | null
          custom_features?: Json | null
          decimals?: number | null
          default_restriction_policy?: string | null
          disaster_recovery_enabled?: boolean | null
          dividend_distribution?: boolean | null
          document_hash?: string | null
          document_management?: boolean | null
          document_uri?: string | null
          enforce_kyc?: boolean | null
          enhanced_reporting_enabled?: boolean | null
          esg_reporting_enabled?: boolean | null
          financial_data_vendor_integration?: boolean | null
          forced_redemption_enabled?: boolean | null
          forced_transfers?: boolean | null
          foreign_ownership_restrictions?: Json | null
          geographic_restrictions?: Json | null
          granular_control?: boolean | null
          holding_period?: number | null
          id?: string
          initial_supply?: string | null
          institutional_grade?: boolean | null
          institutional_voting_services?: boolean | null
          institutional_wallet_support?: boolean | null
          insurance_coverage_enabled?: boolean | null
          investor_accreditation?: boolean | null
          investor_limits?: Json | null
          investor_whitelist_enabled?: boolean | null
          is_burnable?: boolean | null
          is_issuable?: boolean | null
          is_mintable?: boolean | null
          is_multi_class?: boolean | null
          is_pausable?: boolean | null
          iso20022_messaging_support?: boolean | null
          issuance_modules?: boolean | null
          issuing_entity_lei?: string | null
          issuing_entity_name?: string | null
          issuing_jurisdiction?: string | null
          jurisdiction_restrictions?: Json | null
          kyc_settings?: Json | null
          layer2_scaling_support?: boolean | null
          legal_terms?: string | null
          manual_approvals?: boolean | null
          margin_requirements_dynamic?: boolean | null
          market_data_feeds_enabled?: boolean | null
          max_investor_count?: number | null
          mergers_acquisitions_support?: boolean | null
          multi_jurisdiction_compliance?: boolean | null
          passport_regime_support?: boolean | null
          pep_screening_enabled?: boolean | null
          performance_analytics_enabled?: boolean | null
          position_limits_enabled?: boolean | null
          position_reconciliation_enabled?: boolean | null
          price_discovery_mechanisms?: Json | null
          prime_brokerage_support?: boolean | null
          prospectus?: string | null
          proxy_voting_enabled?: boolean | null
          quorum_requirements?: Json | null
          real_time_compliance_monitoring?: boolean | null
          real_time_shareholder_registry?: boolean | null
          recovery_mechanism?: boolean | null
          regulation_type?: string | null
          regulatory_equivalence_mapping?: Json | null
          regulatory_filing_automation?: boolean | null
          regulatory_reporting_automation?: boolean | null
          require_kyc?: boolean | null
          rights_offerings_enabled?: boolean | null
          security_type?: string | null
          settlement_integration?: string | null
          share_repurchase_automation?: boolean | null
          spin_offs_enabled?: boolean | null
          stock_dividends_enabled?: boolean | null
          stock_splits_enabled?: boolean | null
          stress_testing_enabled?: boolean | null
          suspicious_activity_reporting?: boolean | null
          swift_integration_enabled?: boolean | null
          third_party_custody_addresses?: string[] | null
          token_details?: string | null
          token_id?: string
          traditional_finance_integration?: boolean | null
          tranche_transferability?: boolean | null
          transaction_monitoring_rules?: Json | null
          transfer_restrictions?: Json | null
          treasury_management_enabled?: boolean | null
          treaty_benefits_enabled?: boolean | null
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          voting_delegation_enabled?: boolean | null
          weighted_voting_by_class?: boolean | null
          whitelist_config?: Json | null
          whitelist_enabled?: boolean | null
          withholding_tax_automation?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc1400_regulatory_filings: {
        Row: {
          auto_generated: boolean | null
          compliance_status: string | null
          created_at: string | null
          document_hash: string | null
          document_uri: string | null
          due_date: string | null
          filing_date: string
          filing_jurisdiction: string
          filing_reference: string | null
          filing_type: string
          id: string
          regulatory_body: string | null
          token_id: string
          updated_at: string | null
        }
        Insert: {
          auto_generated?: boolean | null
          compliance_status?: string | null
          created_at?: string | null
          document_hash?: string | null
          document_uri?: string | null
          due_date?: string | null
          filing_date: string
          filing_jurisdiction: string
          filing_reference?: string | null
          filing_type: string
          id?: string
          regulatory_body?: string | null
          token_id: string
          updated_at?: string | null
        }
        Update: {
          auto_generated?: boolean | null
          compliance_status?: string | null
          created_at?: string | null
          document_hash?: string | null
          document_uri?: string | null
          due_date?: string | null
          filing_date?: string
          filing_jurisdiction?: string
          filing_reference?: string | null
          filing_type?: string
          id?: string
          regulatory_body?: string | null
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc1400_regulatory_filings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_regulatory_filings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_regulatory_filings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_regulatory_filings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_regulatory_filings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_regulatory_filings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_regulatory_filings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc1400_regulatory_filings_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc20_properties: {
        Row: {
          access_control: string | null
          allow_management: boolean | null
          anti_whale_enabled: boolean | null
          auto_liquidity_enabled: boolean | null
          blacklist_enabled: boolean | null
          burn_on_transfer: boolean | null
          burn_percentage: string | null
          burnable_by: string | null
          buy_fee_enabled: boolean | null
          cap: string | null
          charity_fee_percentage: string | null
          compliance_config: Json | null
          cooldown_period: number | null
          created_at: string | null
          default_restriction_policy: string | null
          deflation_enabled: boolean | null
          deflation_rate: string | null
          fee_on_transfer: Json | null
          gas_config: Json | null
          governance_enabled: boolean | null
          governance_features: Json | null
          governance_token_address: string | null
          id: string
          initial_supply: string | null
          is_burnable: boolean | null
          is_mintable: boolean | null
          is_pausable: boolean | null
          liquidity_fee_percentage: string | null
          lottery_enabled: boolean | null
          lottery_percentage: string | null
          marketing_fee_percentage: string | null
          max_total_supply: string | null
          max_wallet_amount: string | null
          mintable_by: string | null
          pausable_by: string | null
          permit: boolean | null
          presale_enabled: boolean | null
          presale_end_time: string | null
          presale_rate: string | null
          presale_start_time: string | null
          proposal_threshold: string | null
          quorum_percentage: string | null
          rebasing: Json | null
          reflection_enabled: boolean | null
          reflection_percentage: string | null
          sell_fee_enabled: boolean | null
          snapshot: boolean | null
          staking_enabled: boolean | null
          staking_rewards_rate: string | null
          timelock_delay: number | null
          token_id: string
          token_type: string | null
          trading_start_time: string | null
          transfer_config: Json | null
          updated_at: string | null
          use_geographic_restrictions: boolean | null
          vesting_cliff_period: number | null
          vesting_enabled: boolean | null
          vesting_release_frequency: string | null
          vesting_total_period: number | null
          voting_delay: number | null
          voting_period: number | null
          whitelist_config: Json | null
        }
        Insert: {
          access_control?: string | null
          allow_management?: boolean | null
          anti_whale_enabled?: boolean | null
          auto_liquidity_enabled?: boolean | null
          blacklist_enabled?: boolean | null
          burn_on_transfer?: boolean | null
          burn_percentage?: string | null
          burnable_by?: string | null
          buy_fee_enabled?: boolean | null
          cap?: string | null
          charity_fee_percentage?: string | null
          compliance_config?: Json | null
          cooldown_period?: number | null
          created_at?: string | null
          default_restriction_policy?: string | null
          deflation_enabled?: boolean | null
          deflation_rate?: string | null
          fee_on_transfer?: Json | null
          gas_config?: Json | null
          governance_enabled?: boolean | null
          governance_features?: Json | null
          governance_token_address?: string | null
          id?: string
          initial_supply?: string | null
          is_burnable?: boolean | null
          is_mintable?: boolean | null
          is_pausable?: boolean | null
          liquidity_fee_percentage?: string | null
          lottery_enabled?: boolean | null
          lottery_percentage?: string | null
          marketing_fee_percentage?: string | null
          max_total_supply?: string | null
          max_wallet_amount?: string | null
          mintable_by?: string | null
          pausable_by?: string | null
          permit?: boolean | null
          presale_enabled?: boolean | null
          presale_end_time?: string | null
          presale_rate?: string | null
          presale_start_time?: string | null
          proposal_threshold?: string | null
          quorum_percentage?: string | null
          rebasing?: Json | null
          reflection_enabled?: boolean | null
          reflection_percentage?: string | null
          sell_fee_enabled?: boolean | null
          snapshot?: boolean | null
          staking_enabled?: boolean | null
          staking_rewards_rate?: string | null
          timelock_delay?: number | null
          token_id: string
          token_type?: string | null
          trading_start_time?: string | null
          transfer_config?: Json | null
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          vesting_cliff_period?: number | null
          vesting_enabled?: boolean | null
          vesting_release_frequency?: string | null
          vesting_total_period?: number | null
          voting_delay?: number | null
          voting_period?: number | null
          whitelist_config?: Json | null
        }
        Update: {
          access_control?: string | null
          allow_management?: boolean | null
          anti_whale_enabled?: boolean | null
          auto_liquidity_enabled?: boolean | null
          blacklist_enabled?: boolean | null
          burn_on_transfer?: boolean | null
          burn_percentage?: string | null
          burnable_by?: string | null
          buy_fee_enabled?: boolean | null
          cap?: string | null
          charity_fee_percentage?: string | null
          compliance_config?: Json | null
          cooldown_period?: number | null
          created_at?: string | null
          default_restriction_policy?: string | null
          deflation_enabled?: boolean | null
          deflation_rate?: string | null
          fee_on_transfer?: Json | null
          gas_config?: Json | null
          governance_enabled?: boolean | null
          governance_features?: Json | null
          governance_token_address?: string | null
          id?: string
          initial_supply?: string | null
          is_burnable?: boolean | null
          is_mintable?: boolean | null
          is_pausable?: boolean | null
          liquidity_fee_percentage?: string | null
          lottery_enabled?: boolean | null
          lottery_percentage?: string | null
          marketing_fee_percentage?: string | null
          max_total_supply?: string | null
          max_wallet_amount?: string | null
          mintable_by?: string | null
          pausable_by?: string | null
          permit?: boolean | null
          presale_enabled?: boolean | null
          presale_end_time?: string | null
          presale_rate?: string | null
          presale_start_time?: string | null
          proposal_threshold?: string | null
          quorum_percentage?: string | null
          rebasing?: Json | null
          reflection_enabled?: boolean | null
          reflection_percentage?: string | null
          sell_fee_enabled?: boolean | null
          snapshot?: boolean | null
          staking_enabled?: boolean | null
          staking_rewards_rate?: string | null
          timelock_delay?: number | null
          token_id?: string
          token_type?: string | null
          trading_start_time?: string | null
          transfer_config?: Json | null
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          vesting_cliff_period?: number | null
          vesting_enabled?: boolean | null
          vesting_release_frequency?: string | null
          vesting_total_period?: number | null
          voting_delay?: number | null
          voting_period?: number | null
          whitelist_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc20_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc20_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc20_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc20_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc20_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc20_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc20_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc20_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc3525_allocations: {
        Row: {
          created_at: string | null
          id: string
          linked_token_id: string | null
          recipient: string | null
          slot_id: string
          token_id: string
          token_id_within_slot: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          linked_token_id?: string | null
          recipient?: string | null
          slot_id: string
          token_id: string
          token_id_within_slot: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          linked_token_id?: string | null
          recipient?: string | null
          slot_id?: string
          token_id?: string
          token_id_within_slot?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_erc3525_allocations_linked_token_id_fkey"
            columns: ["linked_token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_linked_token_id_fkey"
            columns: ["linked_token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_linked_token_id_fkey"
            columns: ["linked_token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_linked_token_id_fkey"
            columns: ["linked_token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_linked_token_id_fkey"
            columns: ["linked_token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_linked_token_id_fkey"
            columns: ["linked_token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_linked_token_id_fkey"
            columns: ["linked_token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_linked_token_id_fkey"
            columns: ["linked_token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc3525_payment_schedules: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          is_completed: boolean | null
          payment_amount: string
          payment_date: string
          payment_type: string
          slot_id: string
          token_id: string
          transaction_hash: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_completed?: boolean | null
          payment_amount: string
          payment_date: string
          payment_type: string
          slot_id: string
          token_id: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_completed?: boolean | null
          payment_amount?: string
          payment_date?: string
          payment_type?: string
          slot_id?: string
          token_id?: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc3525_payment_schedules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_payment_schedules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_payment_schedules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_payment_schedules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_payment_schedules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_payment_schedules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_payment_schedules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_payment_schedules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc3525_properties: {
        Row: {
          access_control: string | null
          accredited_investor_only: boolean | null
          accrual_enabled: boolean | null
          accrual_frequency: string | null
          accrual_rate: string | null
          allows_slot_enumeration: boolean | null
          approval_workflow_enabled: boolean | null
          audit_trail_enhanced: boolean | null
          auto_unit_calculation: boolean | null
          base_uri: string | null
          batch_operations_enabled: boolean | null
          collateral_factor: string | null
          compound_interest_enabled: boolean | null
          coupon_frequency: string | null
          created_at: string | null
          cross_slot_transfers: boolean | null
          custom_extensions: string | null
          custom_slot_properties: Json | null
          default_restriction_policy: string | null
          delegate_enabled: boolean | null
          derivative_type: string | null
          dynamic_metadata: boolean | null
          dynamic_slot_creation: boolean | null
          early_redemption_enabled: boolean | null
          emergency_pause_enabled: boolean | null
          expiration_date: string | null
          financial_instrument_type: string | null
          flash_loan_enabled: boolean | null
          fractional_ownership_enabled: boolean | null
          fractionalizable: boolean | null
          geographic_restrictions: string[] | null
          has_royalty: boolean | null
          holding_period_restrictions: number | null
          id: string
          institutional_custody_support: boolean | null
          interest_rate: string | null
          is_burnable: boolean | null
          is_pausable: boolean | null
          kyc_required: boolean | null
          leverage_ratio: string | null
          liquidation_threshold: string | null
          liquidity_provision_enabled: boolean | null
          margin_requirements: Json | null
          market_maker_enabled: boolean | null
          maturity_date: string | null
          mergable: boolean | null
          metadata: Json | null
          metadata_storage: string | null
          minimum_trade_value: string | null
          multi_signature_required: boolean | null
          partial_value_trading: boolean | null
          payment_schedule: Json | null
          permissioning_advanced: boolean | null
          permissioning_enabled: boolean | null
          principal_amount: string | null
          proposal_value_threshold: string | null
          quorum_calculation_method: string | null
          recovery_mechanisms: Json | null
          redemption_penalty_rate: string | null
          regulatory_compliance_enabled: boolean | null
          reporting_requirements: Json | null
          royalty_percentage: string | null
          royalty_receiver: string | null
          sales_config: Json | null
          settlement_type: string | null
          slot_admin_roles: string[] | null
          slot_approvals: boolean | null
          slot_creation_enabled: boolean | null
          slot_enumeration_enabled: boolean | null
          slot_freeze_enabled: boolean | null
          slot_marketplace_enabled: boolean | null
          slot_merge_enabled: boolean | null
          slot_split_enabled: boolean | null
          slot_transfer_restrictions: Json | null
          slot_transfer_validation: Json | null
          slot_type: string | null
          slot_voting_enabled: boolean | null
          splittable: boolean | null
          staking_yield_rate: string | null
          strike_price: string | null
          supply_tracking: boolean | null
          token_id: string
          trading_fee_percentage: string | null
          trading_fees_enabled: boolean | null
          transfer_limits: Json | null
          underlying_asset: string | null
          underlying_asset_address: string | null
          updatable_slots: boolean | null
          updatable_uris: boolean | null
          updatable_values: boolean | null
          updated_at: string | null
          use_geographic_restrictions: boolean | null
          value_adjustment_enabled: boolean | null
          value_aggregation: boolean | null
          value_aggregation_enabled: boolean | null
          value_approvals: boolean | null
          value_calculation_formula: string | null
          value_computation_method: string | null
          value_decimals: number | null
          value_marketplace_enabled: boolean | null
          value_oracle_address: string | null
          value_transfer_restrictions: Json | null
          value_transfers_enabled: boolean | null
          value_weighted_voting: boolean | null
          voting_power_calculation: string | null
          whitelist_config: Json | null
          yield_farming_enabled: boolean | null
        }
        Insert: {
          access_control?: string | null
          accredited_investor_only?: boolean | null
          accrual_enabled?: boolean | null
          accrual_frequency?: string | null
          accrual_rate?: string | null
          allows_slot_enumeration?: boolean | null
          approval_workflow_enabled?: boolean | null
          audit_trail_enhanced?: boolean | null
          auto_unit_calculation?: boolean | null
          base_uri?: string | null
          batch_operations_enabled?: boolean | null
          collateral_factor?: string | null
          compound_interest_enabled?: boolean | null
          coupon_frequency?: string | null
          created_at?: string | null
          cross_slot_transfers?: boolean | null
          custom_extensions?: string | null
          custom_slot_properties?: Json | null
          default_restriction_policy?: string | null
          delegate_enabled?: boolean | null
          derivative_type?: string | null
          dynamic_metadata?: boolean | null
          dynamic_slot_creation?: boolean | null
          early_redemption_enabled?: boolean | null
          emergency_pause_enabled?: boolean | null
          expiration_date?: string | null
          financial_instrument_type?: string | null
          flash_loan_enabled?: boolean | null
          fractional_ownership_enabled?: boolean | null
          fractionalizable?: boolean | null
          geographic_restrictions?: string[] | null
          has_royalty?: boolean | null
          holding_period_restrictions?: number | null
          id?: string
          institutional_custody_support?: boolean | null
          interest_rate?: string | null
          is_burnable?: boolean | null
          is_pausable?: boolean | null
          kyc_required?: boolean | null
          leverage_ratio?: string | null
          liquidation_threshold?: string | null
          liquidity_provision_enabled?: boolean | null
          margin_requirements?: Json | null
          market_maker_enabled?: boolean | null
          maturity_date?: string | null
          mergable?: boolean | null
          metadata?: Json | null
          metadata_storage?: string | null
          minimum_trade_value?: string | null
          multi_signature_required?: boolean | null
          partial_value_trading?: boolean | null
          payment_schedule?: Json | null
          permissioning_advanced?: boolean | null
          permissioning_enabled?: boolean | null
          principal_amount?: string | null
          proposal_value_threshold?: string | null
          quorum_calculation_method?: string | null
          recovery_mechanisms?: Json | null
          redemption_penalty_rate?: string | null
          regulatory_compliance_enabled?: boolean | null
          reporting_requirements?: Json | null
          royalty_percentage?: string | null
          royalty_receiver?: string | null
          sales_config?: Json | null
          settlement_type?: string | null
          slot_admin_roles?: string[] | null
          slot_approvals?: boolean | null
          slot_creation_enabled?: boolean | null
          slot_enumeration_enabled?: boolean | null
          slot_freeze_enabled?: boolean | null
          slot_marketplace_enabled?: boolean | null
          slot_merge_enabled?: boolean | null
          slot_split_enabled?: boolean | null
          slot_transfer_restrictions?: Json | null
          slot_transfer_validation?: Json | null
          slot_type?: string | null
          slot_voting_enabled?: boolean | null
          splittable?: boolean | null
          staking_yield_rate?: string | null
          strike_price?: string | null
          supply_tracking?: boolean | null
          token_id: string
          trading_fee_percentage?: string | null
          trading_fees_enabled?: boolean | null
          transfer_limits?: Json | null
          underlying_asset?: string | null
          underlying_asset_address?: string | null
          updatable_slots?: boolean | null
          updatable_uris?: boolean | null
          updatable_values?: boolean | null
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          value_adjustment_enabled?: boolean | null
          value_aggregation?: boolean | null
          value_aggregation_enabled?: boolean | null
          value_approvals?: boolean | null
          value_calculation_formula?: string | null
          value_computation_method?: string | null
          value_decimals?: number | null
          value_marketplace_enabled?: boolean | null
          value_oracle_address?: string | null
          value_transfer_restrictions?: Json | null
          value_transfers_enabled?: boolean | null
          value_weighted_voting?: boolean | null
          voting_power_calculation?: string | null
          whitelist_config?: Json | null
          yield_farming_enabled?: boolean | null
        }
        Update: {
          access_control?: string | null
          accredited_investor_only?: boolean | null
          accrual_enabled?: boolean | null
          accrual_frequency?: string | null
          accrual_rate?: string | null
          allows_slot_enumeration?: boolean | null
          approval_workflow_enabled?: boolean | null
          audit_trail_enhanced?: boolean | null
          auto_unit_calculation?: boolean | null
          base_uri?: string | null
          batch_operations_enabled?: boolean | null
          collateral_factor?: string | null
          compound_interest_enabled?: boolean | null
          coupon_frequency?: string | null
          created_at?: string | null
          cross_slot_transfers?: boolean | null
          custom_extensions?: string | null
          custom_slot_properties?: Json | null
          default_restriction_policy?: string | null
          delegate_enabled?: boolean | null
          derivative_type?: string | null
          dynamic_metadata?: boolean | null
          dynamic_slot_creation?: boolean | null
          early_redemption_enabled?: boolean | null
          emergency_pause_enabled?: boolean | null
          expiration_date?: string | null
          financial_instrument_type?: string | null
          flash_loan_enabled?: boolean | null
          fractional_ownership_enabled?: boolean | null
          fractionalizable?: boolean | null
          geographic_restrictions?: string[] | null
          has_royalty?: boolean | null
          holding_period_restrictions?: number | null
          id?: string
          institutional_custody_support?: boolean | null
          interest_rate?: string | null
          is_burnable?: boolean | null
          is_pausable?: boolean | null
          kyc_required?: boolean | null
          leverage_ratio?: string | null
          liquidation_threshold?: string | null
          liquidity_provision_enabled?: boolean | null
          margin_requirements?: Json | null
          market_maker_enabled?: boolean | null
          maturity_date?: string | null
          mergable?: boolean | null
          metadata?: Json | null
          metadata_storage?: string | null
          minimum_trade_value?: string | null
          multi_signature_required?: boolean | null
          partial_value_trading?: boolean | null
          payment_schedule?: Json | null
          permissioning_advanced?: boolean | null
          permissioning_enabled?: boolean | null
          principal_amount?: string | null
          proposal_value_threshold?: string | null
          quorum_calculation_method?: string | null
          recovery_mechanisms?: Json | null
          redemption_penalty_rate?: string | null
          regulatory_compliance_enabled?: boolean | null
          reporting_requirements?: Json | null
          royalty_percentage?: string | null
          royalty_receiver?: string | null
          sales_config?: Json | null
          settlement_type?: string | null
          slot_admin_roles?: string[] | null
          slot_approvals?: boolean | null
          slot_creation_enabled?: boolean | null
          slot_enumeration_enabled?: boolean | null
          slot_freeze_enabled?: boolean | null
          slot_marketplace_enabled?: boolean | null
          slot_merge_enabled?: boolean | null
          slot_split_enabled?: boolean | null
          slot_transfer_restrictions?: Json | null
          slot_transfer_validation?: Json | null
          slot_type?: string | null
          slot_voting_enabled?: boolean | null
          splittable?: boolean | null
          staking_yield_rate?: string | null
          strike_price?: string | null
          supply_tracking?: boolean | null
          token_id?: string
          trading_fee_percentage?: string | null
          trading_fees_enabled?: boolean | null
          transfer_limits?: Json | null
          underlying_asset?: string | null
          underlying_asset_address?: string | null
          updatable_slots?: boolean | null
          updatable_uris?: boolean | null
          updatable_values?: boolean | null
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          value_adjustment_enabled?: boolean | null
          value_aggregation?: boolean | null
          value_aggregation_enabled?: boolean | null
          value_approvals?: boolean | null
          value_calculation_formula?: string | null
          value_computation_method?: string | null
          value_decimals?: number | null
          value_marketplace_enabled?: boolean | null
          value_oracle_address?: string | null
          value_transfer_restrictions?: Json | null
          value_transfers_enabled?: boolean | null
          value_weighted_voting?: boolean | null
          voting_power_calculation?: string | null
          whitelist_config?: Json | null
          yield_farming_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc3525_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc3525_slot_configs: {
        Row: {
          created_at: string | null
          divisible: boolean | null
          id: string
          max_value: string | null
          min_value: string | null
          slot_description: string | null
          slot_id: string
          slot_name: string | null
          slot_properties: Json | null
          slot_type: string | null
          token_id: string
          tradeable: boolean | null
          transferable: boolean | null
          updated_at: string | null
          value_precision: number | null
          value_units: string | null
        }
        Insert: {
          created_at?: string | null
          divisible?: boolean | null
          id?: string
          max_value?: string | null
          min_value?: string | null
          slot_description?: string | null
          slot_id: string
          slot_name?: string | null
          slot_properties?: Json | null
          slot_type?: string | null
          token_id: string
          tradeable?: boolean | null
          transferable?: boolean | null
          updated_at?: string | null
          value_precision?: number | null
          value_units?: string | null
        }
        Update: {
          created_at?: string | null
          divisible?: boolean | null
          id?: string
          max_value?: string | null
          min_value?: string | null
          slot_description?: string | null
          slot_id?: string
          slot_name?: string | null
          slot_properties?: Json | null
          slot_type?: string | null
          token_id?: string
          tradeable?: boolean | null
          transferable?: boolean | null
          updated_at?: string | null
          value_precision?: number | null
          value_units?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc3525_slot_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slot_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slot_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slot_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slot_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slot_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slot_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slot_configs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc3525_slots: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string | null
          slot_id: string
          slot_transferable: boolean | null
          token_id: string
          updated_at: string | null
          value_units: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          slot_id: string
          slot_transferable?: boolean | null
          token_id: string
          updated_at?: string | null
          value_units?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          slot_id?: string
          slot_transferable?: boolean | null
          token_id?: string
          updated_at?: string | null
          value_units?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc3525_slots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_slots_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc3525_value_adjustments: {
        Row: {
          adjustment_amount: string
          adjustment_date: string | null
          adjustment_reason: string | null
          adjustment_type: string
          approved_by: string | null
          created_at: string | null
          id: string
          oracle_price: string | null
          oracle_source: string | null
          slot_id: string
          token_id: string
          transaction_hash: string | null
        }
        Insert: {
          adjustment_amount: string
          adjustment_date?: string | null
          adjustment_reason?: string | null
          adjustment_type: string
          approved_by?: string | null
          created_at?: string | null
          id?: string
          oracle_price?: string | null
          oracle_source?: string | null
          slot_id: string
          token_id: string
          transaction_hash?: string | null
        }
        Update: {
          adjustment_amount?: string
          adjustment_date?: string | null
          adjustment_reason?: string | null
          adjustment_type?: string
          approved_by?: string | null
          created_at?: string | null
          id?: string
          oracle_price?: string | null
          oracle_source?: string | null
          slot_id?: string
          token_id?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc3525_value_adjustments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_value_adjustments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_value_adjustments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_value_adjustments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_value_adjustments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_value_adjustments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_value_adjustments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc3525_value_adjustments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc4626_asset_allocations: {
        Row: {
          asset: string
          created_at: string | null
          description: string | null
          expected_apy: string | null
          id: string
          percentage: string
          protocol: string | null
          token_id: string
          updated_at: string | null
        }
        Insert: {
          asset: string
          created_at?: string | null
          description?: string | null
          expected_apy?: string | null
          id?: string
          percentage: string
          protocol?: string | null
          token_id: string
          updated_at?: string | null
        }
        Update: {
          asset?: string
          created_at?: string | null
          description?: string | null
          expected_apy?: string | null
          id?: string
          percentage?: string
          protocol?: string | null
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc4626_asset_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_asset_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_asset_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_asset_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_asset_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_asset_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_asset_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_asset_allocations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc4626_fee_tiers: {
        Row: {
          created_at: string | null
          deposit_fee_rate: string | null
          id: string
          is_active: boolean | null
          management_fee_rate: string
          max_balance: string | null
          min_balance: string
          performance_fee_rate: string
          tier_benefits: Json | null
          tier_name: string
          token_id: string
          updated_at: string | null
          withdrawal_fee_rate: string | null
        }
        Insert: {
          created_at?: string | null
          deposit_fee_rate?: string | null
          id?: string
          is_active?: boolean | null
          management_fee_rate: string
          max_balance?: string | null
          min_balance: string
          performance_fee_rate: string
          tier_benefits?: Json | null
          tier_name: string
          token_id: string
          updated_at?: string | null
          withdrawal_fee_rate?: string | null
        }
        Update: {
          created_at?: string | null
          deposit_fee_rate?: string | null
          id?: string
          is_active?: boolean | null
          management_fee_rate?: string
          max_balance?: string | null
          min_balance?: string
          performance_fee_rate?: string
          tier_benefits?: Json | null
          tier_name?: string
          token_id?: string
          updated_at?: string | null
          withdrawal_fee_rate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc4626_fee_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_fee_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_fee_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_fee_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_fee_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_fee_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_fee_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_fee_tiers_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc4626_performance_metrics: {
        Row: {
          apy: string | null
          benchmark_performance: string | null
          created_at: string | null
          daily_yield: string | null
          id: string
          max_drawdown: string | null
          metric_date: string
          net_flow: string | null
          new_deposits: string | null
          share_price: string
          sharpe_ratio: string | null
          token_id: string
          total_assets: string
          total_fees_collected: string | null
          volatility: string | null
          withdrawals: string | null
        }
        Insert: {
          apy?: string | null
          benchmark_performance?: string | null
          created_at?: string | null
          daily_yield?: string | null
          id?: string
          max_drawdown?: string | null
          metric_date: string
          net_flow?: string | null
          new_deposits?: string | null
          share_price: string
          sharpe_ratio?: string | null
          token_id: string
          total_assets: string
          total_fees_collected?: string | null
          volatility?: string | null
          withdrawals?: string | null
        }
        Update: {
          apy?: string | null
          benchmark_performance?: string | null
          created_at?: string | null
          daily_yield?: string | null
          id?: string
          max_drawdown?: string | null
          metric_date?: string
          net_flow?: string | null
          new_deposits?: string | null
          share_price?: string
          sharpe_ratio?: string | null
          token_id?: string
          total_assets?: string
          total_fees_collected?: string | null
          volatility?: string | null
          withdrawals?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc4626_performance_metrics_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_performance_metrics_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_performance_metrics_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_performance_metrics_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_performance_metrics_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_performance_metrics_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_performance_metrics_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_performance_metrics_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc4626_properties: {
        Row: {
          access_control: string | null
          apy_tracking_enabled: boolean | null
          arbitrage_enabled: boolean | null
          asset_address: string | null
          asset_decimals: number | null
          asset_name: string | null
          asset_symbol: string | null
          audit_trail_comprehensive: boolean | null
          auto_compounding_enabled: boolean | null
          automated_rebalancing: boolean | null
          automated_reporting: boolean | null
          benchmark_index: string | null
          benchmark_tracking_enabled: boolean | null
          borrowing_enabled: boolean | null
          bridge_protocols: string[] | null
          circuit_breaker_enabled: boolean | null
          compliance_reporting_enabled: boolean | null
          compound_frequency: string | null
          created_at: string | null
          cross_chain_yield_enabled: boolean | null
          cross_dex_optimization: boolean | null
          custody_integration: boolean | null
          custom_strategy: boolean | null
          default_restriction_policy: string | null
          defi_protocol_integrations: string[] | null
          deposit_fee: string | null
          deposit_limit: string | null
          diversification_enabled: boolean | null
          dynamic_fees_enabled: boolean | null
          early_withdrawal_penalty: string | null
          emergency_exit_enabled: boolean | null
          emergency_shutdown: boolean | null
          fee_rebate_enabled: boolean | null
          fee_recipient: string | null
          fee_structure: Json | null
          fee_tier_system_enabled: boolean | null
          fee_voting_enabled: boolean | null
          flash_loans: boolean | null
          fund_administration_enabled: boolean | null
          gas_fee_optimization: boolean | null
          governance_token_address: string | null
          governance_token_enabled: boolean | null
          id: string
          impermanent_loss_protection: boolean | null
          institutional_grade: boolean | null
          insurance_coverage_amount: string | null
          insurance_enabled: boolean | null
          insurance_provider: string | null
          is_burnable: boolean | null
          is_mintable: boolean | null
          is_pausable: boolean | null
          late_withdrawal_penalty: string | null
          lending_protocol_enabled: boolean | null
          leverage_enabled: boolean | null
          liquidity_incentives_rate: string | null
          liquidity_mining_enabled: boolean | null
          liquidity_provider_rewards: Json | null
          liquidity_reserve: string | null
          management_fee: string | null
          manager_performance_threshold: string | null
          manager_replacement_enabled: boolean | null
          market_making_enabled: boolean | null
          max_deposit: string | null
          max_drawdown_threshold: string | null
          max_leverage_ratio: string | null
          max_slippage: string | null
          max_withdrawal: string | null
          min_deposit: string | null
          min_withdrawal: string | null
          mobile_app_integration: boolean | null
          multi_asset_enabled: boolean | null
          notification_system_enabled: boolean | null
          performance_fee: string | null
          performance_fee_high_water_mark: boolean | null
          performance_history_retention: number | null
          performance_metrics: boolean | null
          performance_tracking: boolean | null
          permit: boolean | null
          portfolio_analytics_enabled: boolean | null
          real_time_pnl_tracking: boolean | null
          rebalance_threshold: string | null
          rebalancing_enabled: boolean | null
          rebalancing_rules: Json | null
          regulatory_framework: string | null
          risk_management_enabled: boolean | null
          risk_tolerance: string | null
          social_trading_enabled: boolean | null
          stop_loss_enabled: boolean | null
          stop_loss_threshold: string | null
          strategy_complexity: string | null
          strategy_controller: string | null
          strategy_documentation: string | null
          strategy_voting_enabled: boolean | null
          tax_reporting_enabled: boolean | null
          third_party_audits_enabled: boolean | null
          token_id: string
          updated_at: string | null
          use_geographic_restrictions: boolean | null
          vault_strategy: string | null
          vault_type: string | null
          voting_power_per_share: string | null
          whitelist_config: Json | null
          withdrawal_fee: string | null
          withdrawal_limit: string | null
          withdrawal_rules: Json | null
          yield_distribution_schedule: string | null
          yield_optimization_enabled: boolean | null
          yield_optimization_strategy: string | null
          yield_source: string | null
          yield_sources: Json | null
        }
        Insert: {
          access_control?: string | null
          apy_tracking_enabled?: boolean | null
          arbitrage_enabled?: boolean | null
          asset_address?: string | null
          asset_decimals?: number | null
          asset_name?: string | null
          asset_symbol?: string | null
          audit_trail_comprehensive?: boolean | null
          auto_compounding_enabled?: boolean | null
          automated_rebalancing?: boolean | null
          automated_reporting?: boolean | null
          benchmark_index?: string | null
          benchmark_tracking_enabled?: boolean | null
          borrowing_enabled?: boolean | null
          bridge_protocols?: string[] | null
          circuit_breaker_enabled?: boolean | null
          compliance_reporting_enabled?: boolean | null
          compound_frequency?: string | null
          created_at?: string | null
          cross_chain_yield_enabled?: boolean | null
          cross_dex_optimization?: boolean | null
          custody_integration?: boolean | null
          custom_strategy?: boolean | null
          default_restriction_policy?: string | null
          defi_protocol_integrations?: string[] | null
          deposit_fee?: string | null
          deposit_limit?: string | null
          diversification_enabled?: boolean | null
          dynamic_fees_enabled?: boolean | null
          early_withdrawal_penalty?: string | null
          emergency_exit_enabled?: boolean | null
          emergency_shutdown?: boolean | null
          fee_rebate_enabled?: boolean | null
          fee_recipient?: string | null
          fee_structure?: Json | null
          fee_tier_system_enabled?: boolean | null
          fee_voting_enabled?: boolean | null
          flash_loans?: boolean | null
          fund_administration_enabled?: boolean | null
          gas_fee_optimization?: boolean | null
          governance_token_address?: string | null
          governance_token_enabled?: boolean | null
          id?: string
          impermanent_loss_protection?: boolean | null
          institutional_grade?: boolean | null
          insurance_coverage_amount?: string | null
          insurance_enabled?: boolean | null
          insurance_provider?: string | null
          is_burnable?: boolean | null
          is_mintable?: boolean | null
          is_pausable?: boolean | null
          late_withdrawal_penalty?: string | null
          lending_protocol_enabled?: boolean | null
          leverage_enabled?: boolean | null
          liquidity_incentives_rate?: string | null
          liquidity_mining_enabled?: boolean | null
          liquidity_provider_rewards?: Json | null
          liquidity_reserve?: string | null
          management_fee?: string | null
          manager_performance_threshold?: string | null
          manager_replacement_enabled?: boolean | null
          market_making_enabled?: boolean | null
          max_deposit?: string | null
          max_drawdown_threshold?: string | null
          max_leverage_ratio?: string | null
          max_slippage?: string | null
          max_withdrawal?: string | null
          min_deposit?: string | null
          min_withdrawal?: string | null
          mobile_app_integration?: boolean | null
          multi_asset_enabled?: boolean | null
          notification_system_enabled?: boolean | null
          performance_fee?: string | null
          performance_fee_high_water_mark?: boolean | null
          performance_history_retention?: number | null
          performance_metrics?: boolean | null
          performance_tracking?: boolean | null
          permit?: boolean | null
          portfolio_analytics_enabled?: boolean | null
          real_time_pnl_tracking?: boolean | null
          rebalance_threshold?: string | null
          rebalancing_enabled?: boolean | null
          rebalancing_rules?: Json | null
          regulatory_framework?: string | null
          risk_management_enabled?: boolean | null
          risk_tolerance?: string | null
          social_trading_enabled?: boolean | null
          stop_loss_enabled?: boolean | null
          stop_loss_threshold?: string | null
          strategy_complexity?: string | null
          strategy_controller?: string | null
          strategy_documentation?: string | null
          strategy_voting_enabled?: boolean | null
          tax_reporting_enabled?: boolean | null
          third_party_audits_enabled?: boolean | null
          token_id: string
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          vault_strategy?: string | null
          vault_type?: string | null
          voting_power_per_share?: string | null
          whitelist_config?: Json | null
          withdrawal_fee?: string | null
          withdrawal_limit?: string | null
          withdrawal_rules?: Json | null
          yield_distribution_schedule?: string | null
          yield_optimization_enabled?: boolean | null
          yield_optimization_strategy?: string | null
          yield_source?: string | null
          yield_sources?: Json | null
        }
        Update: {
          access_control?: string | null
          apy_tracking_enabled?: boolean | null
          arbitrage_enabled?: boolean | null
          asset_address?: string | null
          asset_decimals?: number | null
          asset_name?: string | null
          asset_symbol?: string | null
          audit_trail_comprehensive?: boolean | null
          auto_compounding_enabled?: boolean | null
          automated_rebalancing?: boolean | null
          automated_reporting?: boolean | null
          benchmark_index?: string | null
          benchmark_tracking_enabled?: boolean | null
          borrowing_enabled?: boolean | null
          bridge_protocols?: string[] | null
          circuit_breaker_enabled?: boolean | null
          compliance_reporting_enabled?: boolean | null
          compound_frequency?: string | null
          created_at?: string | null
          cross_chain_yield_enabled?: boolean | null
          cross_dex_optimization?: boolean | null
          custody_integration?: boolean | null
          custom_strategy?: boolean | null
          default_restriction_policy?: string | null
          defi_protocol_integrations?: string[] | null
          deposit_fee?: string | null
          deposit_limit?: string | null
          diversification_enabled?: boolean | null
          dynamic_fees_enabled?: boolean | null
          early_withdrawal_penalty?: string | null
          emergency_exit_enabled?: boolean | null
          emergency_shutdown?: boolean | null
          fee_rebate_enabled?: boolean | null
          fee_recipient?: string | null
          fee_structure?: Json | null
          fee_tier_system_enabled?: boolean | null
          fee_voting_enabled?: boolean | null
          flash_loans?: boolean | null
          fund_administration_enabled?: boolean | null
          gas_fee_optimization?: boolean | null
          governance_token_address?: string | null
          governance_token_enabled?: boolean | null
          id?: string
          impermanent_loss_protection?: boolean | null
          institutional_grade?: boolean | null
          insurance_coverage_amount?: string | null
          insurance_enabled?: boolean | null
          insurance_provider?: string | null
          is_burnable?: boolean | null
          is_mintable?: boolean | null
          is_pausable?: boolean | null
          late_withdrawal_penalty?: string | null
          lending_protocol_enabled?: boolean | null
          leverage_enabled?: boolean | null
          liquidity_incentives_rate?: string | null
          liquidity_mining_enabled?: boolean | null
          liquidity_provider_rewards?: Json | null
          liquidity_reserve?: string | null
          management_fee?: string | null
          manager_performance_threshold?: string | null
          manager_replacement_enabled?: boolean | null
          market_making_enabled?: boolean | null
          max_deposit?: string | null
          max_drawdown_threshold?: string | null
          max_leverage_ratio?: string | null
          max_slippage?: string | null
          max_withdrawal?: string | null
          min_deposit?: string | null
          min_withdrawal?: string | null
          mobile_app_integration?: boolean | null
          multi_asset_enabled?: boolean | null
          notification_system_enabled?: boolean | null
          performance_fee?: string | null
          performance_fee_high_water_mark?: boolean | null
          performance_history_retention?: number | null
          performance_metrics?: boolean | null
          performance_tracking?: boolean | null
          permit?: boolean | null
          portfolio_analytics_enabled?: boolean | null
          real_time_pnl_tracking?: boolean | null
          rebalance_threshold?: string | null
          rebalancing_enabled?: boolean | null
          rebalancing_rules?: Json | null
          regulatory_framework?: string | null
          risk_management_enabled?: boolean | null
          risk_tolerance?: string | null
          social_trading_enabled?: boolean | null
          stop_loss_enabled?: boolean | null
          stop_loss_threshold?: string | null
          strategy_complexity?: string | null
          strategy_controller?: string | null
          strategy_documentation?: string | null
          strategy_voting_enabled?: boolean | null
          tax_reporting_enabled?: boolean | null
          third_party_audits_enabled?: boolean | null
          token_id?: string
          updated_at?: string | null
          use_geographic_restrictions?: boolean | null
          vault_strategy?: string | null
          vault_type?: string | null
          voting_power_per_share?: string | null
          whitelist_config?: Json | null
          withdrawal_fee?: string | null
          withdrawal_limit?: string | null
          withdrawal_rules?: Json | null
          yield_distribution_schedule?: string | null
          yield_optimization_enabled?: boolean | null
          yield_optimization_strategy?: string | null
          yield_source?: string | null
          yield_sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc4626_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc4626_strategy_params: {
        Row: {
          created_at: string | null
          default_value: string | null
          description: string | null
          id: string
          is_required: boolean | null
          name: string
          param_type: string | null
          token_id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          name: string
          param_type?: string | null
          token_id: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          name?: string
          param_type?: string | null
          token_id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_erc4626_strategy_params_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_strategy_params_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_strategy_params_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_strategy_params_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_strategy_params_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_strategy_params_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_strategy_params_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_strategy_params_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc4626_vault_strategies: {
        Row: {
          actual_apy: string | null
          allocation_percentage: string
          created_at: string | null
          expected_apy: string | null
          id: string
          is_active: boolean | null
          last_rebalance: string | null
          max_allocation_percentage: string | null
          min_allocation_percentage: string | null
          protocol_address: string | null
          protocol_name: string | null
          risk_score: number | null
          strategy_name: string
          strategy_type: string
          token_id: string
          updated_at: string | null
        }
        Insert: {
          actual_apy?: string | null
          allocation_percentage: string
          created_at?: string | null
          expected_apy?: string | null
          id?: string
          is_active?: boolean | null
          last_rebalance?: string | null
          max_allocation_percentage?: string | null
          min_allocation_percentage?: string | null
          protocol_address?: string | null
          protocol_name?: string | null
          risk_score?: number | null
          strategy_name: string
          strategy_type: string
          token_id: string
          updated_at?: string | null
        }
        Update: {
          actual_apy?: string | null
          allocation_percentage?: string
          created_at?: string | null
          expected_apy?: string | null
          id?: string
          is_active?: boolean | null
          last_rebalance?: string | null
          max_allocation_percentage?: string | null
          min_allocation_percentage?: string | null
          protocol_address?: string | null
          protocol_name?: string | null
          risk_score?: number | null
          strategy_name?: string
          strategy_type?: string
          token_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc4626_vault_strategies_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_vault_strategies_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_vault_strategies_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_vault_strategies_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_vault_strategies_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_vault_strategies_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_vault_strategies_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc4626_vault_strategies_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc721_attributes: {
        Row: {
          created_at: string | null
          id: string
          token_id: string
          trait_type: string
          updated_at: string | null
          values: string[]
        }
        Insert: {
          created_at?: string | null
          id?: string
          token_id: string
          trait_type: string
          updated_at?: string | null
          values: string[]
        }
        Update: {
          created_at?: string | null
          id?: string
          token_id?: string
          trait_type?: string
          updated_at?: string | null
          values?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "token_erc721_attributes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_attributes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_attributes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_attributes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_attributes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_attributes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_attributes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_attributes_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc721_mint_phases: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          max_per_wallet: number | null
          max_supply: number | null
          merkle_root: string | null
          phase_name: string
          phase_order: number
          price: string | null
          start_time: string | null
          token_id: string
          updated_at: string | null
          whitelist_required: boolean | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          max_per_wallet?: number | null
          max_supply?: number | null
          merkle_root?: string | null
          phase_name: string
          phase_order: number
          price?: string | null
          start_time?: string | null
          token_id: string
          updated_at?: string | null
          whitelist_required?: boolean | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          max_per_wallet?: number | null
          max_supply?: number | null
          merkle_root?: string | null
          phase_name?: string
          phase_order?: number
          price?: string | null
          start_time?: string | null
          token_id?: string
          updated_at?: string | null
          whitelist_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc721_mint_phases_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_mint_phases_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_mint_phases_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_mint_phases_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_mint_phases_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_mint_phases_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_mint_phases_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_mint_phases_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc721_properties: {
        Row: {
          access_control: string | null
          admin_mint_enabled: boolean | null
          asset_type: string | null
          auto_increment_ids: boolean | null
          auto_reveal: boolean | null
          base_uri: string | null
          batch_minting_config: Json | null
          breeding_enabled: boolean | null
          bridge_contracts: Json | null
          burn_roles: string[] | null
          contract_uri: string | null
          created_at: string | null
          creator_earnings_address: string | null
          creator_earnings_enabled: boolean | null
          creator_earnings_percentage: string | null
          cross_chain_enabled: boolean | null
          custom_base_uri: string | null
          custom_operator_filter_address: string | null
          default_restriction_policy: string | null
          dutch_auction_duration: number | null
          dutch_auction_enabled: boolean | null
          dutch_auction_end_price: string | null
          dutch_auction_start_price: string | null
          dynamic_uri_config: Json | null
          enable_dynamic_metadata: boolean | null
          enable_fractional_ownership: boolean | null
          enumerable: boolean | null
          evolution_enabled: boolean | null
          has_royalty: boolean | null
          id: string
          is_burnable: boolean | null
          is_mintable: boolean | null
          is_pausable: boolean | null
          layer2_enabled: boolean | null
          layer2_networks: string[] | null
          marketplace_approved: string[] | null
          max_mints_per_tx: number | null
          max_mints_per_wallet: number | null
          max_supply: string | null
          metadata_frozen: boolean | null
          metadata_provenance_hash: string | null
          metadata_storage: string | null
          mint_phases_enabled: boolean | null
          mint_roles: string[] | null
          minting_method: string | null
          minting_price: string | null
          operator_filter_enabled: boolean | null
          permission_config: Json | null
          placeholder_image_uri: string | null
          pre_reveal_uri: string | null
          public_mint_enabled: boolean | null
          public_sale_enabled: boolean | null
          public_sale_end_time: string | null
          public_sale_price: string | null
          public_sale_start_time: string | null
          reserved_tokens: number | null
          reveal_batch_size: number | null
          reveal_delay: number | null
          revealable: boolean | null
          royalty_percentage: string | null
          royalty_receiver: string | null
          sales_config: Json | null
          soulbound: boolean | null
          staking_enabled: boolean | null
          staking_rewards_rate: string | null
          staking_rewards_token_address: string | null
          supply_cap_enabled: boolean | null
          supply_validation_enabled: boolean | null
          token_id: string
          total_supply_cap: string | null
          transfer_locked: boolean | null
          transfer_restrictions: Json | null
          updatable_uris: boolean | null
          updated_at: string | null
          uri_storage: string | null
          use_geographic_restrictions: boolean | null
          use_safe_transfer: boolean | null
          utility_enabled: boolean | null
          utility_type: string | null
          whitelist_config: Json | null
          whitelist_sale_enabled: boolean | null
          whitelist_sale_end_time: string | null
          whitelist_sale_price: string | null
          whitelist_sale_start_time: string | null
        }
        Insert: {
          access_control?: string | null
          admin_mint_enabled?: boolean | null
          asset_type?: string | null
          auto_increment_ids?: boolean | null
          auto_reveal?: boolean | null
          base_uri?: string | null
          batch_minting_config?: Json | null
          breeding_enabled?: boolean | null
          bridge_contracts?: Json | null
          burn_roles?: string[] | null
          contract_uri?: string | null
          created_at?: string | null
          creator_earnings_address?: string | null
          creator_earnings_enabled?: boolean | null
          creator_earnings_percentage?: string | null
          cross_chain_enabled?: boolean | null
          custom_base_uri?: string | null
          custom_operator_filter_address?: string | null
          default_restriction_policy?: string | null
          dutch_auction_duration?: number | null
          dutch_auction_enabled?: boolean | null
          dutch_auction_end_price?: string | null
          dutch_auction_start_price?: string | null
          dynamic_uri_config?: Json | null
          enable_dynamic_metadata?: boolean | null
          enable_fractional_ownership?: boolean | null
          enumerable?: boolean | null
          evolution_enabled?: boolean | null
          has_royalty?: boolean | null
          id?: string
          is_burnable?: boolean | null
          is_mintable?: boolean | null
          is_pausable?: boolean | null
          layer2_enabled?: boolean | null
          layer2_networks?: string[] | null
          marketplace_approved?: string[] | null
          max_mints_per_tx?: number | null
          max_mints_per_wallet?: number | null
          max_supply?: string | null
          metadata_frozen?: boolean | null
          metadata_provenance_hash?: string | null
          metadata_storage?: string | null
          mint_phases_enabled?: boolean | null
          mint_roles?: string[] | null
          minting_method?: string | null
          minting_price?: string | null
          operator_filter_enabled?: boolean | null
          permission_config?: Json | null
          placeholder_image_uri?: string | null
          pre_reveal_uri?: string | null
          public_mint_enabled?: boolean | null
          public_sale_enabled?: boolean | null
          public_sale_end_time?: string | null
          public_sale_price?: string | null
          public_sale_start_time?: string | null
          reserved_tokens?: number | null
          reveal_batch_size?: number | null
          reveal_delay?: number | null
          revealable?: boolean | null
          royalty_percentage?: string | null
          royalty_receiver?: string | null
          sales_config?: Json | null
          soulbound?: boolean | null
          staking_enabled?: boolean | null
          staking_rewards_rate?: string | null
          staking_rewards_token_address?: string | null
          supply_cap_enabled?: boolean | null
          supply_validation_enabled?: boolean | null
          token_id: string
          total_supply_cap?: string | null
          transfer_locked?: boolean | null
          transfer_restrictions?: Json | null
          updatable_uris?: boolean | null
          updated_at?: string | null
          uri_storage?: string | null
          use_geographic_restrictions?: boolean | null
          use_safe_transfer?: boolean | null
          utility_enabled?: boolean | null
          utility_type?: string | null
          whitelist_config?: Json | null
          whitelist_sale_enabled?: boolean | null
          whitelist_sale_end_time?: string | null
          whitelist_sale_price?: string | null
          whitelist_sale_start_time?: string | null
        }
        Update: {
          access_control?: string | null
          admin_mint_enabled?: boolean | null
          asset_type?: string | null
          auto_increment_ids?: boolean | null
          auto_reveal?: boolean | null
          base_uri?: string | null
          batch_minting_config?: Json | null
          breeding_enabled?: boolean | null
          bridge_contracts?: Json | null
          burn_roles?: string[] | null
          contract_uri?: string | null
          created_at?: string | null
          creator_earnings_address?: string | null
          creator_earnings_enabled?: boolean | null
          creator_earnings_percentage?: string | null
          cross_chain_enabled?: boolean | null
          custom_base_uri?: string | null
          custom_operator_filter_address?: string | null
          default_restriction_policy?: string | null
          dutch_auction_duration?: number | null
          dutch_auction_enabled?: boolean | null
          dutch_auction_end_price?: string | null
          dutch_auction_start_price?: string | null
          dynamic_uri_config?: Json | null
          enable_dynamic_metadata?: boolean | null
          enable_fractional_ownership?: boolean | null
          enumerable?: boolean | null
          evolution_enabled?: boolean | null
          has_royalty?: boolean | null
          id?: string
          is_burnable?: boolean | null
          is_mintable?: boolean | null
          is_pausable?: boolean | null
          layer2_enabled?: boolean | null
          layer2_networks?: string[] | null
          marketplace_approved?: string[] | null
          max_mints_per_tx?: number | null
          max_mints_per_wallet?: number | null
          max_supply?: string | null
          metadata_frozen?: boolean | null
          metadata_provenance_hash?: string | null
          metadata_storage?: string | null
          mint_phases_enabled?: boolean | null
          mint_roles?: string[] | null
          minting_method?: string | null
          minting_price?: string | null
          operator_filter_enabled?: boolean | null
          permission_config?: Json | null
          placeholder_image_uri?: string | null
          pre_reveal_uri?: string | null
          public_mint_enabled?: boolean | null
          public_sale_enabled?: boolean | null
          public_sale_end_time?: string | null
          public_sale_price?: string | null
          public_sale_start_time?: string | null
          reserved_tokens?: number | null
          reveal_batch_size?: number | null
          reveal_delay?: number | null
          revealable?: boolean | null
          royalty_percentage?: string | null
          royalty_receiver?: string | null
          sales_config?: Json | null
          soulbound?: boolean | null
          staking_enabled?: boolean | null
          staking_rewards_rate?: string | null
          staking_rewards_token_address?: string | null
          supply_cap_enabled?: boolean | null
          supply_validation_enabled?: boolean | null
          token_id?: string
          total_supply_cap?: string | null
          transfer_locked?: boolean | null
          transfer_restrictions?: Json | null
          updatable_uris?: boolean | null
          updated_at?: string | null
          uri_storage?: string | null
          use_geographic_restrictions?: boolean | null
          use_safe_transfer?: boolean | null
          utility_enabled?: boolean | null
          utility_type?: string | null
          whitelist_config?: Json | null
          whitelist_sale_enabled?: boolean | null
          whitelist_sale_end_time?: string | null
          whitelist_sale_price?: string | null
          whitelist_sale_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc721_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_properties_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_erc721_trait_definitions: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          possible_values: Json | null
          rarity_weights: Json | null
          token_id: string
          trait_name: string
          trait_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          possible_values?: Json | null
          rarity_weights?: Json | null
          token_id: string
          trait_name: string
          trait_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          possible_values?: Json | null
          rarity_weights?: Json | null
          token_id?: string
          trait_name?: string
          trait_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_erc721_trait_definitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_trait_definitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_trait_definitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_trait_definitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_trait_definitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_trait_definitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_trait_definitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_erc721_trait_definitions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_events: {
        Row: {
          data: Json | null
          event_type: string
          id: string
          is_read: boolean
          message: string
          severity: string
          timestamp: string
          token_id: string
        }
        Insert: {
          data?: Json | null
          event_type: string
          id?: string
          is_read?: boolean
          message: string
          severity: string
          timestamp?: string
          token_id: string
        }
        Update: {
          data?: Json | null
          event_type?: string
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          timestamp?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_geographic_restrictions: {
        Row: {
          country_code: string
          created_at: string | null
          created_by: string | null
          effective_date: string
          expiry_date: string | null
          holding_period_restriction: number | null
          id: string
          max_investment_amount: string | null
          max_ownership_percentage: number | null
          min_investment_amount: string | null
          notes: string | null
          reporting_requirements: Json | null
          requires_local_custodian: boolean | null
          requires_regulatory_approval: boolean | null
          requires_tax_clearance: boolean | null
          restriction_type: string
          token_id: string
          transfer_restrictions: Json | null
          updated_at: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          expiry_date?: string | null
          holding_period_restriction?: number | null
          id?: string
          max_investment_amount?: string | null
          max_ownership_percentage?: number | null
          min_investment_amount?: string | null
          notes?: string | null
          reporting_requirements?: Json | null
          requires_local_custodian?: boolean | null
          requires_regulatory_approval?: boolean | null
          requires_tax_clearance?: boolean | null
          restriction_type: string
          token_id: string
          transfer_restrictions?: Json | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          expiry_date?: string | null
          holding_period_restriction?: number | null
          id?: string
          max_investment_amount?: string | null
          max_ownership_percentage?: number | null
          min_investment_amount?: string | null
          notes?: string | null
          reporting_requirements?: Json | null
          requires_local_custodian?: boolean | null
          requires_regulatory_approval?: boolean | null
          requires_tax_clearance?: boolean | null
          restriction_type?: string
          token_id?: string
          transfer_restrictions?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_geographic_restrictions_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "geographic_jurisdictions"
            referencedColumns: ["country_code"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "token_geographic_restrictions_view"
            referencedColumns: ["country_code"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_operations: {
        Row: {
          amount: number | null
          asset_token_address: string | null
          blocks: Json | null
          error_message: string | null
          id: string
          lock_duration: number | null
          lock_id: string | null
          lock_reason: string | null
          nft_token_id: string | null
          operation_type: string
          operator: string
          partition: string | null
          recipient: string | null
          sender: string | null
          slot_id: string | null
          status: string | null
          target_address: string | null
          timestamp: string | null
          token_id: string
          token_type_id: string | null
          transaction_hash: string | null
          unlock_time: string | null
          value: number | null
        }
        Insert: {
          amount?: number | null
          asset_token_address?: string | null
          blocks?: Json | null
          error_message?: string | null
          id?: string
          lock_duration?: number | null
          lock_id?: string | null
          lock_reason?: string | null
          nft_token_id?: string | null
          operation_type: string
          operator: string
          partition?: string | null
          recipient?: string | null
          sender?: string | null
          slot_id?: string | null
          status?: string | null
          target_address?: string | null
          timestamp?: string | null
          token_id: string
          token_type_id?: string | null
          transaction_hash?: string | null
          unlock_time?: string | null
          value?: number | null
        }
        Update: {
          amount?: number | null
          asset_token_address?: string | null
          blocks?: Json | null
          error_message?: string | null
          id?: string
          lock_duration?: number | null
          lock_id?: string | null
          lock_reason?: string | null
          nft_token_id?: string | null
          operation_type?: string
          operator?: string
          partition?: string | null
          recipient?: string | null
          sender?: string | null
          slot_id?: string | null
          status?: string | null
          target_address?: string | null
          timestamp?: string | null
          token_id?: string
          token_type_id?: string | null
          transaction_hash?: string | null
          unlock_time?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "token_operations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_operations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_operations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_operations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_operations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_operations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_operations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_operations_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_sanctions_rules: {
        Row: {
          auto_block_sanctioned_entities: boolean | null
          created_at: string | null
          enhanced_due_diligence_required: boolean | null
          id: string
          last_screening_update: string | null
          manual_review_threshold: string | null
          sanctions_regime: string
          screening_enabled: boolean | null
          screening_frequency: string | null
          token_id: string
          updated_at: string | null
          whitelist_override_allowed: boolean | null
        }
        Insert: {
          auto_block_sanctioned_entities?: boolean | null
          created_at?: string | null
          enhanced_due_diligence_required?: boolean | null
          id?: string
          last_screening_update?: string | null
          manual_review_threshold?: string | null
          sanctions_regime: string
          screening_enabled?: boolean | null
          screening_frequency?: string | null
          token_id: string
          updated_at?: string | null
          whitelist_override_allowed?: boolean | null
        }
        Update: {
          auto_block_sanctioned_entities?: boolean | null
          created_at?: string | null
          enhanced_due_diligence_required?: boolean | null
          id?: string
          last_screening_update?: string | null
          manual_review_threshold?: string | null
          sanctions_regime?: string
          screening_enabled?: boolean | null
          screening_frequency?: string | null
          token_id?: string
          updated_at?: string | null
          whitelist_override_allowed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "token_sanctions_rules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_sanctions_rules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_sanctions_rules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_sanctions_rules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_sanctions_rules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_sanctions_rules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_sanctions_rules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_sanctions_rules_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_templates: {
        Row: {
          blocks: Json
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          project_id: string
          standard: string
          updated_at: string | null
        }
        Insert: {
          blocks: Json
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          standard: string
          updated_at?: string | null
        }
        Update: {
          blocks?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          standard?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_templates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      token_versions: {
        Row: {
          blocks: Json | null
          created_at: string | null
          created_by: string | null
          data: Json
          decimals: number | null
          id: string
          metadata: Json | null
          name: string | null
          notes: string | null
          standard: string | null
          symbol: string | null
          token_id: string
          version: number
        }
        Insert: {
          blocks?: Json | null
          created_at?: string | null
          created_by?: string | null
          data: Json
          decimals?: number | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          standard?: string | null
          symbol?: string | null
          token_id: string
          version: number
        }
        Update: {
          blocks?: Json | null
          created_at?: string | null
          created_by?: string | null
          data?: Json
          decimals?: number | null
          id?: string
          metadata?: Json | null
          name?: string | null
          notes?: string | null
          standard?: string | null
          symbol?: string | null
          token_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_whitelists: {
        Row: {
          approval_date: string | null
          approval_reason: string | null
          approved_by: string | null
          blockchain: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          removal_by: string | null
          removal_date: string | null
          removal_reason: string | null
          token_id: string
          updated_at: string | null
          updated_by: string | null
          wallet_address: string
        }
        Insert: {
          approval_date?: string | null
          approval_reason?: string | null
          approved_by?: string | null
          blockchain: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          removal_by?: string | null
          removal_date?: string | null
          removal_reason?: string | null
          token_id: string
          updated_at?: string | null
          updated_by?: string | null
          wallet_address: string
        }
        Update: {
          approval_date?: string | null
          approval_reason?: string | null
          approved_by?: string | null
          blockchain?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          removal_by?: string | null
          removal_date?: string | null
          removal_reason?: string | null
          token_id?: string
          updated_at?: string | null
          updated_by?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_token_whitelists_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_whitelists_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_whitelists_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_whitelists_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_whitelists_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_whitelists_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_whitelists_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "fk_token_whitelists_token_id"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_whitelists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_whitelists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_whitelists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_whitelists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_whitelists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_whitelists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_whitelists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_whitelists_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          address: string | null
          approvals: string[] | null
          blockchain: string | null
          blocks: Json
          config_mode:
            | Database["public"]["Enums"]["token_config_mode_enum"]
            | null
          contract_preview: string | null
          created_at: string | null
          decimals: number
          deployed_by: string | null
          deployment_environment: string | null
          deployment_error: string | null
          deployment_status: string | null
          deployment_timestamp: string | null
          deployment_transaction: string | null
          description: string | null
          id: string
          metadata: Json | null
          name: string
          project_id: string
          reviewers: string[] | null
          standard: Database["public"]["Enums"]["token_standard_enum"]
          status: Database["public"]["Enums"]["token_status_enum"]
          symbol: string
          total_supply: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          approvals?: string[] | null
          blockchain?: string | null
          blocks: Json
          config_mode?:
            | Database["public"]["Enums"]["token_config_mode_enum"]
            | null
          contract_preview?: string | null
          created_at?: string | null
          decimals?: number
          deployed_by?: string | null
          deployment_environment?: string | null
          deployment_error?: string | null
          deployment_status?: string | null
          deployment_timestamp?: string | null
          deployment_transaction?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          reviewers?: string[] | null
          standard: Database["public"]["Enums"]["token_standard_enum"]
          status?: Database["public"]["Enums"]["token_status_enum"]
          symbol: string
          total_supply?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          approvals?: string[] | null
          blockchain?: string | null
          blocks?: Json
          config_mode?:
            | Database["public"]["Enums"]["token_config_mode_enum"]
            | null
          contract_preview?: string | null
          created_at?: string | null
          decimals?: number
          deployed_by?: string | null
          deployment_environment?: string | null
          deployment_error?: string | null
          deployment_status?: string | null
          deployment_timestamp?: string | null
          deployment_transaction?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          reviewers?: string[] | null
          standard?: Database["public"]["Enums"]["token_standard_enum"]
          status?: Database["public"]["Enums"]["token_status_enum"]
          symbol?: string
          total_supply?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_events: {
        Row: {
          actor: string | null
          actor_role: string | null
          created_at: string
          data: Json
          event_type: string
          id: string
          request_id: string
          timestamp: string
        }
        Insert: {
          actor?: string | null
          actor_role?: string | null
          created_at?: string
          data: Json
          event_type: string
          id?: string
          request_id: string
          timestamp?: string
        }
        Update: {
          actor?: string | null
          actor_role?: string | null
          created_at?: string
          data?: Json
          event_type?: string
          id?: string
          request_id?: string
          timestamp?: string
        }
        Relationships: []
      }
      transaction_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean | null
          transaction_id: string | null
          type: string
          wallet_address: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          transaction_id?: string | null
          type: string
          wallet_address: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          transaction_id?: string | null
          type?: string
          wallet_address?: string
        }
        Relationships: []
      }
      transaction_proposals: {
        Row: {
          blockchain: string
          created_at: string | null
          created_by: string | null
          data: string | null
          description: string | null
          id: string
          nonce: number | null
          status: string
          title: string
          to_address: string
          token_address: string | null
          token_symbol: string | null
          updated_at: string | null
          value: string
          wallet_id: string | null
        }
        Insert: {
          blockchain: string
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          description?: string | null
          id?: string
          nonce?: number | null
          status?: string
          title: string
          to_address: string
          token_address?: string | null
          token_symbol?: string | null
          updated_at?: string | null
          value: string
          wallet_id?: string | null
        }
        Update: {
          blockchain?: string
          created_at?: string | null
          created_by?: string | null
          data?: string | null
          description?: string | null
          id?: string
          nonce?: number | null
          status?: string
          title?: string
          to_address?: string
          token_address?: string | null
          token_symbol?: string | null
          updated_at?: string | null
          value?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_proposals_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "multi_sig_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_signatures: {
        Row: {
          created_at: string
          id: string
          proposal_id: string
          signature: string
          signer: string
          transaction_hash: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          proposal_id: string
          signature: string
          signer: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          proposal_id?: string
          signature?: string
          signer?: string
          transaction_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_signatures_proposal_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "transaction_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          block_hash: string | null
          block_number: number | null
          blockchain: string
          confirmations: number | null
          created_at: string | null
          destination_tag: number | null
          estimated_confirmation_time: unknown | null
          from_address: string
          gas_limit: number | null
          gas_price: number | null
          gas_used: number | null
          id: string
          max_fee_per_gas: number | null
          max_priority_fee_per_gas: number | null
          memo: string | null
          network_fee: number | null
          status: string
          to_address: string
          token_address: string | null
          token_symbol: string | null
          transaction_hash: string
          transaction_index: number | null
          transfer_type: string | null
          type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          block_hash?: string | null
          block_number?: number | null
          blockchain?: string
          confirmations?: number | null
          created_at?: string | null
          destination_tag?: number | null
          estimated_confirmation_time?: unknown | null
          from_address: string
          gas_limit?: number | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          max_fee_per_gas?: number | null
          max_priority_fee_per_gas?: number | null
          memo?: string | null
          network_fee?: number | null
          status?: string
          to_address: string
          token_address?: string | null
          token_symbol?: string | null
          transaction_hash: string
          transaction_index?: number | null
          transfer_type?: string | null
          type?: string
          updated_at?: string | null
          value?: number
        }
        Update: {
          block_hash?: string | null
          block_number?: number | null
          blockchain?: string
          confirmations?: number | null
          created_at?: string | null
          destination_tag?: number | null
          estimated_confirmation_time?: unknown | null
          from_address?: string
          gas_limit?: number | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          max_fee_per_gas?: number | null
          max_priority_fee_per_gas?: number | null
          memo?: string | null
          network_fee?: number | null
          status?: string
          to_address?: string
          token_address?: string | null
          token_symbol?: string | null
          transaction_hash?: string
          transaction_index?: number | null
          transfer_type?: string | null
          type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      user_mfa_settings: {
        Row: {
          backup_codes: Json | null
          created_at: string | null
          enabled: boolean
          id: string
          secret: string | null
          updated_at: string | null
          user_id: string
          verified: boolean
        }
        Insert: {
          backup_codes?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          secret?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean
        }
        Update: {
          backup_codes?: Json | null
          created_at?: string | null
          enabled?: boolean
          id?: string
          secret?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          ip_address: string | null
          last_active_at: string | null
          session_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          session_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          encrypted_private_key: string | null
          id: string
          name: string
          public_key: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          encrypted_private_key?: string | null
          id: string
          name: string
          public_key?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          encrypted_private_key?: string | null
          id?: string
          name?: string
          public_key?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      wallet_details: {
        Row: {
          blockchain_specific_data: Json
          created_at: string | null
          id: string
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          blockchain_specific_data: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          blockchain_specific_data?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_details_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "multi_sig_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_signatories: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          status: string | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          role: string
          status?: string | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          status?: string | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          chain_id: string | null
          confirmation_count: number | null
          created_at: string | null
          data: Json | null
          from_address: string | null
          gas_limit: number | null
          gas_price: number | null
          id: string
          nonce: number | null
          status: string | null
          to_address: string | null
          token_address: string | null
          token_symbol: string | null
          tx_hash: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          chain_id?: string | null
          confirmation_count?: number | null
          created_at?: string | null
          data?: Json | null
          from_address?: string | null
          gas_limit?: number | null
          gas_price?: number | null
          id?: string
          nonce?: number | null
          status?: string | null
          to_address?: string | null
          token_address?: string | null
          token_symbol?: string | null
          tx_hash?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          chain_id?: string | null
          confirmation_count?: number | null
          created_at?: string | null
          data?: Json | null
          from_address?: string | null
          gas_limit?: number | null
          gas_price?: number | null
          id?: string
          nonce?: number | null
          status?: string | null
          to_address?: string | null
          token_address?: string | null
          token_symbol?: string | null
          tx_hash?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: []
      }
      whitelist_entries: {
        Row: {
          added_by: string | null
          address: string
          created_at: string | null
          id: string
          label: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          address: string
          created_at?: string | null
          id?: string
          label?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          address?: string
          created_at?: string | null
          id?: string
          label?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whitelist_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          required_approvals: number
          rule_id: string | null
          total_approvers: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          required_approvals: number
          rule_id?: string | null
          total_approvers: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          required_approvals?: number
          rule_id?: string | null
          total_approvers?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whitelist_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whitelist_settings_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rules"
            referencedColumns: ["rule_id"]
          },
        ]
      }
      whitelist_signatories: {
        Row: {
          approved: boolean | null
          approved_at: string | null
          id: string
          user_id: string | null
          whitelist_id: string | null
        }
        Insert: {
          approved?: boolean | null
          approved_at?: string | null
          id?: string
          user_id?: string | null
          whitelist_id?: string | null
        }
        Update: {
          approved?: boolean | null
          approved_at?: string | null
          id?: string
          user_id?: string | null
          whitelist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whitelist_signatories_whitelist_id_fkey"
            columns: ["whitelist_id"]
            isOneToOne: false
            referencedRelation: "whitelist_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_stages: {
        Row: {
          completion_percentage: number
          created_at: string
          description: string | null
          id: string
          name: string
          order: number
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          completion_percentage?: number
          created_at?: string
          description?: string | null
          id: string
          name: string
          order: number
          organization_id: string
          status: string
          updated_at?: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          order?: number
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_redemption_windows: {
        Row: {
          approved_requests: number | null
          approved_value: number | null
          config_id: string | null
          config_name: string | null
          created_at: string | null
          created_by: string | null
          current_requests: number | null
          enable_pro_rata_distribution: boolean | null
          end_date: string | null
          frequency: string | null
          id: string | null
          max_redemption_amount: number | null
          nav: number | null
          nav_date: string | null
          nav_source: string | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          queued_requests: number | null
          queued_value: number | null
          rejected_requests: number | null
          rejected_value: number | null
          start_date: string | null
          status: string | null
          submission_end_date: string | null
          submission_start_date: string | null
          total_request_value: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_windows_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "redemption_window_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_analytics: {
        Row: {
          action: string | null
          batch_operation_id: string | null
          category: string | null
          correlation_id: string | null
          duration: number | null
          entity_id: string | null
          entity_type: string | null
          id: string | null
          ip_address: string | null
          project_id: string | null
          session_id: string | null
          severity: string | null
          source: string | null
          status: string | null
          system_process_id: string | null
          timestamp: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          batch_operation_id?: string | null
          category?: string | null
          correlation_id?: string | null
          duration?: number | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          ip_address?: string | null
          project_id?: string | null
          session_id?: string | null
          severity?: string | null
          source?: string | null
          status?: string | null
          system_process_id?: string | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          batch_operation_id?: string | null
          category?: string | null
          correlation_id?: string | null
          duration?: number | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string | null
          ip_address?: string | null
          project_id?: string | null
          session_id?: string | null
          severity?: string | null
          source?: string | null
          status?: string | null
          system_process_id?: string | null
          timestamp?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      activity_metrics: {
        Row: {
          action_type: string | null
          activity_count: number | null
          avg_duration: number | null
          day: string | null
          entity_type: string | null
          status: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      activity_summary_daily: {
        Row: {
          activity_count: number | null
          avg_duration: number | null
          category: string | null
          day: string | null
          severity: string | null
          source: string | null
          status: string | null
          unique_users_count: number | null
        }
        Relationships: []
      }
      approval_configs_with_approvers: {
        Row: {
          active: boolean | null
          approval_mode: string | null
          approver_count: number | null
          auto_approval_conditions: Json | null
          auto_approve_threshold: number | null
          config_description: string | null
          config_name: string | null
          configured_approvers: Json | null
          consensus_type: string | null
          created_at: string | null
          created_by: string | null
          eligible_roles: string[] | null
          escalation_config: Json | null
          id: string | null
          last_modified_by: string | null
          notification_config: Json | null
          permission_id: string | null
          required_approvals: number | null
          requires_all_approvers: boolean | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_configs_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "user_permissions_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approval_configs_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_coverage: {
        Row: {
          function_name: unknown | null
          schema_name: unknown | null
          table_name: unknown | null
          trigger_name: unknown | null
        }
        Relationships: []
      }
      latest_nav_by_fund: {
        Row: {
          change_amount: number | null
          change_percent: number | null
          created_at: string | null
          date: string | null
          fund_id: string | null
          nav: number | null
          source: string | null
          validated: boolean | null
        }
        Relationships: []
      }
      redemption_approval_status: {
        Row: {
          approval_config_id: string | null
          approved_count: number | null
          approver_details: Json | null
          config_name: string | null
          consensus_type: string | null
          overall_status: string | null
          pending_count: number | null
          redemption_request_id: string | null
          rejected_count: number | null
          required_approvals: number | null
          total_assigned_approvers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_approver_assignments_approval_config_id_fkey"
            columns: ["approval_config_id"]
            isOneToOne: false
            referencedRelation: "approval_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemption_approver_assignments_approval_config_id_fkey"
            columns: ["approval_config_id"]
            isOneToOne: false
            referencedRelation: "approval_configs_with_approvers"
            referencedColumns: ["id"]
          },
        ]
      }
      restriction_statistics: {
        Row: {
          active_rules: number | null
          blocked_countries: number | null
          blocked_investor_types: number | null
          total_rules: number | null
        }
        Relationships: []
      }
      settlement_summary: {
        Row: {
          actual_completion: string | null
          completion_time: string | null
          created_at: string | null
          id: string | null
          nav_used: number | null
          processing_time_seconds: number | null
          redemption_request_id: string | null
          settlement_type: string | null
          status: string | null
          token_amount: number | null
          transfer_amount: number | null
        }
        Insert: {
          actual_completion?: string | null
          completion_time?: never
          created_at?: string | null
          id?: string | null
          nav_used?: number | null
          processing_time_seconds?: never
          redemption_request_id?: string | null
          settlement_type?: string | null
          status?: string | null
          token_amount?: number | null
          transfer_amount?: number | null
        }
        Update: {
          actual_completion?: string | null
          completion_time?: never
          created_at?: string | null
          id?: string | null
          nav_used?: number | null
          processing_time_seconds?: never
          redemption_request_id?: string | null
          settlement_type?: string | null
          status?: string | null
          token_amount?: number | null
          transfer_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "redemption_settlements_redemption_request_id_fkey"
            columns: ["redemption_request_id"]
            isOneToOne: false
            referencedRelation: "redemption_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      system_process_activities: {
        Row: {
          action: string | null
          activity_id: string | null
          activity_metadata: Json | null
          activity_status: string | null
          activity_time: string | null
          end_time: string | null
          entity_id: string | null
          entity_type: string | null
          priority: string | null
          process_id: string | null
          process_name: string | null
          progress: number | null
          start_time: string | null
          status: string | null
        }
        Relationships: []
      }
      system_process_activity: {
        Row: {
          activity_count: number | null
          duration_seconds: number | null
          end_time: string | null
          failed_activities: number | null
          process_id: string | null
          process_name: string | null
          process_status: string | null
          start_time: string | null
        }
        Relationships: []
      }
      system_process_performance: {
        Row: {
          avg_duration_seconds: number | null
          failed_executions: number | null
          max_duration_seconds: number | null
          min_duration_seconds: number | null
          process_name: string | null
          success_rate: number | null
          successful_executions: number | null
          total_executions: number | null
        }
        Relationships: []
      }
      token_erc1155_view: {
        Row: {
          access_control: string | null
          airdrop_enabled: boolean | null
          base_price: string | null
          base_uri: string | null
          batch_minting_config: Json | null
          batch_transfer_limits: Json | null
          bridge_enabled: boolean | null
          bulk_discount_enabled: boolean | null
          burning_enabled: boolean | null
          claim_end_time: string | null
          claim_period_enabled: boolean | null
          claim_start_time: string | null
          container_config: Json | null
          crafting_enabled: boolean | null
          decimals: number | null
          description: string | null
          dynamic_uri_config: Json | null
          enable_approval_for_all: boolean | null
          erc1155_property_id: string | null
          experience_points_enabled: boolean | null
          fusion_enabled: boolean | null
          has_royalty: boolean | null
          is_burnable: boolean | null
          is_pausable: boolean | null
          lazy_minting_enabled: boolean | null
          marketplace_fees_enabled: boolean | null
          metadata: Json | null
          metadata_storage: string | null
          name: string | null
          pricing_model: string | null
          property_created_at: string | null
          property_updated_at: string | null
          royalty_percentage: string | null
          royalty_receiver: string | null
          sales_config: Json | null
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          status: Database["public"]["Enums"]["token_status_enum"] | null
          supply_tracking: boolean | null
          symbol: string | null
          token_created_at: string | null
          token_id: string | null
          token_updated_at: string | null
          total_supply: string | null
          transfer_restrictions: Json | null
          updatable_metadata: boolean | null
          updatable_uris: boolean | null
          voting_power_enabled: boolean | null
          whitelist_config: Json | null
        }
        Relationships: []
      }
      token_erc1400_view: {
        Row: {
          advanced_corporate_actions: boolean | null
          advanced_governance_enabled: boolean | null
          advanced_risk_management: boolean | null
          aml_monitoring_enabled: boolean | null
          auto_compliance: boolean | null
          automated_sanctions_screening: boolean | null
          beneficial_ownership_tracking: boolean | null
          cap: string | null
          compliance_automation_level: string | null
          compliance_module: string | null
          compliance_settings: Json | null
          controller_address: string | null
          corporate_actions: boolean | null
          cross_border_trading_enabled: boolean | null
          custody_integration_enabled: boolean | null
          custom_features: Json | null
          decimals: number | null
          description: string | null
          dividend_distribution: boolean | null
          document_hash: string | null
          document_management: boolean | null
          document_uri: string | null
          enforce_kyc: boolean | null
          enhanced_reporting_enabled: boolean | null
          erc1400_property_id: string | null
          forced_redemption_enabled: boolean | null
          forced_transfers: boolean | null
          geographic_restrictions: Json | null
          granular_control: boolean | null
          holding_period: number | null
          initial_supply: string | null
          institutional_grade: boolean | null
          insurance_coverage_enabled: boolean | null
          investor_accreditation: boolean | null
          is_burnable: boolean | null
          is_issuable: boolean | null
          is_mintable: boolean | null
          is_multi_class: boolean | null
          is_pausable: boolean | null
          iso20022_messaging_support: boolean | null
          issuance_modules: boolean | null
          issuing_entity_lei: string | null
          issuing_entity_name: string | null
          issuing_jurisdiction: string | null
          kyc_settings: Json | null
          legal_terms: string | null
          manual_approvals: boolean | null
          max_investor_count: number | null
          metadata: Json | null
          multi_jurisdiction_compliance: boolean | null
          name: string | null
          prime_brokerage_support: boolean | null
          property_created_at: string | null
          property_updated_at: string | null
          prospectus: string | null
          proxy_voting_enabled: boolean | null
          real_time_compliance_monitoring: boolean | null
          recovery_mechanism: boolean | null
          regulation_type: string | null
          require_kyc: boolean | null
          security_type: string | null
          settlement_integration: string | null
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          status: Database["public"]["Enums"]["token_status_enum"] | null
          stock_splits_enabled: boolean | null
          swift_integration_enabled: boolean | null
          symbol: string | null
          token_created_at: string | null
          token_details: string | null
          token_id: string | null
          token_updated_at: string | null
          total_supply: string | null
          traditional_finance_integration: boolean | null
          tranche_transferability: boolean | null
          transfer_restrictions: Json | null
          treasury_management_enabled: boolean | null
          whitelist_enabled: boolean | null
        }
        Relationships: []
      }
      token_erc20_view: {
        Row: {
          access_control: string | null
          allow_management: boolean | null
          anti_whale_enabled: boolean | null
          cap: string | null
          compliance_config: Json | null
          decimals: number | null
          description: string | null
          erc20_property_id: string | null
          fee_on_transfer: Json | null
          gas_config: Json | null
          governance_enabled: boolean | null
          governance_features: Json | null
          initial_supply: string | null
          is_burnable: boolean | null
          is_mintable: boolean | null
          is_pausable: boolean | null
          max_wallet_amount: string | null
          metadata: Json | null
          name: string | null
          permit: boolean | null
          presale_enabled: boolean | null
          presale_rate: string | null
          property_created_at: string | null
          property_updated_at: string | null
          proposal_threshold: string | null
          quorum_percentage: string | null
          rebasing: Json | null
          reflection_enabled: boolean | null
          reflection_percentage: string | null
          snapshot: boolean | null
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          status: Database["public"]["Enums"]["token_status_enum"] | null
          symbol: string | null
          token_created_at: string | null
          token_id: string | null
          token_type: string | null
          token_updated_at: string | null
          total_supply: string | null
          trading_start_time: string | null
          transfer_config: Json | null
          vesting_cliff_period: number | null
          vesting_enabled: boolean | null
          voting_delay: number | null
          voting_period: number | null
          whitelist_config: Json | null
        }
        Relationships: []
      }
      token_erc3525_view: {
        Row: {
          access_control: string | null
          accredited_investor_only: boolean | null
          accrual_enabled: boolean | null
          accrual_rate: string | null
          allows_slot_enumeration: boolean | null
          base_uri: string | null
          compound_interest_enabled: boolean | null
          coupon_frequency: string | null
          cross_slot_transfers: boolean | null
          decimals: number | null
          derivative_type: string | null
          description: string | null
          dynamic_metadata: boolean | null
          dynamic_slot_creation: boolean | null
          early_redemption_enabled: boolean | null
          erc3525_property_id: string | null
          expiration_date: string | null
          financial_instrument_type: string | null
          flash_loan_enabled: boolean | null
          fractional_ownership_enabled: boolean | null
          has_royalty: boolean | null
          interest_rate: string | null
          is_burnable: boolean | null
          is_pausable: boolean | null
          kyc_required: boolean | null
          liquidity_provision_enabled: boolean | null
          maturity_date: string | null
          mergable: boolean | null
          metadata: Json | null
          metadata_storage: string | null
          minimum_trade_value: string | null
          name: string | null
          partial_value_trading: boolean | null
          permissioning_enabled: boolean | null
          principal_amount: string | null
          property_created_at: string | null
          property_updated_at: string | null
          regulatory_compliance_enabled: boolean | null
          royalty_percentage: string | null
          royalty_receiver: string | null
          sales_config: Json | null
          settlement_type: string | null
          slot_approvals: boolean | null
          slot_creation_enabled: boolean | null
          slot_transfer_validation: Json | null
          slot_type: string | null
          splittable: boolean | null
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          status: Database["public"]["Enums"]["token_status_enum"] | null
          strike_price: string | null
          supply_tracking: boolean | null
          symbol: string | null
          token_created_at: string | null
          token_id: string | null
          token_updated_at: string | null
          total_supply: string | null
          underlying_asset: string | null
          updatable_slots: boolean | null
          updatable_uris: boolean | null
          updatable_values: boolean | null
          value_aggregation: boolean | null
          value_approvals: boolean | null
          value_computation_method: string | null
          value_decimals: number | null
          value_transfers_enabled: boolean | null
          yield_farming_enabled: boolean | null
        }
        Relationships: []
      }
      token_erc4626_view: {
        Row: {
          access_control: string | null
          apy_tracking_enabled: boolean | null
          asset_address: string | null
          asset_decimals: number | null
          asset_name: string | null
          asset_symbol: string | null
          auto_compounding_enabled: boolean | null
          automated_rebalancing: boolean | null
          benchmark_index: string | null
          benchmark_tracking_enabled: boolean | null
          circuit_breaker_enabled: boolean | null
          compliance_reporting_enabled: boolean | null
          compound_frequency: string | null
          cross_chain_yield_enabled: boolean | null
          custom_strategy: boolean | null
          decimals: number | null
          description: string | null
          emergency_exit_enabled: boolean | null
          emergency_shutdown: boolean | null
          erc4626_property_id: string | null
          fee_structure: Json | null
          fee_voting_enabled: boolean | null
          flash_loans: boolean | null
          governance_token_enabled: boolean | null
          institutional_grade: boolean | null
          insurance_enabled: boolean | null
          is_burnable: boolean | null
          is_mintable: boolean | null
          is_pausable: boolean | null
          liquidity_mining_enabled: boolean | null
          market_making_enabled: boolean | null
          metadata: Json | null
          multi_asset_enabled: boolean | null
          name: string | null
          performance_metrics: boolean | null
          permit: boolean | null
          property_created_at: string | null
          property_updated_at: string | null
          rebalancing_enabled: boolean | null
          rebalancing_rules: Json | null
          risk_management_enabled: boolean | null
          risk_tolerance: string | null
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          status: Database["public"]["Enums"]["token_status_enum"] | null
          strategy_complexity: string | null
          strategy_controller: string | null
          strategy_voting_enabled: boolean | null
          symbol: string | null
          third_party_audits_enabled: boolean | null
          token_created_at: string | null
          token_id: string | null
          token_updated_at: string | null
          total_supply: string | null
          vault_strategy: string | null
          vault_type: string | null
          yield_optimization_enabled: boolean | null
          yield_source: string | null
        }
        Relationships: []
      }
      token_erc721_view: {
        Row: {
          access_control: string | null
          asset_type: string | null
          auto_increment_ids: boolean | null
          base_uri: string | null
          contract_uri: string | null
          cross_chain_enabled: boolean | null
          decimals: number | null
          description: string | null
          enable_dynamic_metadata: boolean | null
          enable_fractional_ownership: boolean | null
          enumerable: boolean | null
          erc721_property_id: string | null
          has_royalty: boolean | null
          is_burnable: boolean | null
          is_pausable: boolean | null
          max_mints_per_tx: number | null
          max_mints_per_wallet: number | null
          max_supply: string | null
          metadata: Json | null
          metadata_storage: string | null
          minting_method: string | null
          minting_price: string | null
          name: string | null
          permission_config: Json | null
          pre_reveal_uri: string | null
          property_created_at: string | null
          property_updated_at: string | null
          public_sale_enabled: boolean | null
          public_sale_price: string | null
          public_sale_start_time: string | null
          reserved_tokens: number | null
          revealable: boolean | null
          royalty_percentage: string | null
          royalty_receiver: string | null
          sales_config: Json | null
          soulbound: boolean | null
          staking_enabled: boolean | null
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          status: Database["public"]["Enums"]["token_status_enum"] | null
          symbol: string | null
          token_created_at: string | null
          token_id: string | null
          token_updated_at: string | null
          total_supply: string | null
          updatable_uris: boolean | null
          uri_storage: string | null
          utility_enabled: boolean | null
          utility_type: string | null
          whitelist_config: Json | null
          whitelist_sale_enabled: boolean | null
          whitelist_sale_price: string | null
          whitelist_sale_start_time: string | null
        }
        Relationships: []
      }
      token_geographic_restrictions_view: {
        Row: {
          country_code: string | null
          country_name: string | null
          effective_date: string | null
          expiry_date: string | null
          is_eu_sanctioned: boolean | null
          is_ofac_sanctioned: boolean | null
          is_un_sanctioned: boolean | null
          max_ownership_percentage: number | null
          notes: string | null
          region: string | null
          regulatory_regime: string | null
          requires_local_custodian: boolean | null
          requires_regulatory_approval: boolean | null
          restriction_type: string | null
          sanctions_risk_level: string | null
          standard: Database["public"]["Enums"]["token_standard_enum"] | null
          token_id: string | null
          token_name: string | null
          token_symbol: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1155_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc1400_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc20_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc3525_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc4626_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_erc721_view"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "token_whitelist_summary"
            referencedColumns: ["token_id"]
          },
          {
            foreignKeyName: "token_geographic_restrictions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_whitelist_summary: {
        Row: {
          created_at: string | null
          erc1155_whitelist_enabled: boolean | null
          erc1400_whitelist_enabled: boolean | null
          erc20_whitelist_enabled: boolean | null
          erc3525_whitelist_enabled: boolean | null
          erc4626_whitelist_enabled: boolean | null
          erc721_whitelist_enabled: boolean | null
          token_id: string | null
          token_name: string | null
          token_standard:
            | Database["public"]["Enums"]["token_standard_enum"]
            | null
          token_symbol: string | null
          updated_at: string | null
          whitelisted_address_count: number | null
        }
        Relationships: []
      }
      transfer_history: {
        Row: {
          amount: number | null
          asset: string | null
          block_number: number | null
          blockchain: string | null
          confirmations: number | null
          created_at: string | null
          from_address: string | null
          gas_used: number | null
          hash: string | null
          id: string | null
          memo: string | null
          network_fee: number | null
          status: string | null
          to_address: string | null
          transfer_type: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          asset?: string | null
          block_number?: number | null
          blockchain?: string | null
          confirmations?: number | null
          created_at?: string | null
          from_address?: string | null
          gas_used?: number | null
          hash?: string | null
          id?: string | null
          memo?: string | null
          network_fee?: number | null
          status?: string | null
          to_address?: string | null
          transfer_type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          asset?: string | null
          block_number?: number | null
          blockchain?: string | null
          confirmations?: number | null
          created_at?: string | null
          from_address?: string | null
          gas_used?: number | null
          hash?: string | null
          id?: string | null
          memo?: string | null
          network_fee?: number | null
          status?: string | null
          to_address?: string | null
          transfer_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activity_summary: {
        Row: {
          active_days: number | null
          last_activity: string | null
          projects_accessed: number | null
          session_count: number | null
          total_activities: number | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: []
      }
      user_permissions_view: {
        Row: {
          email: string | null
          permission_description: string | null
          permission_name: string | null
          role_name: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: []
      }
      valid_policy_approvers: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          policy_rule_id: string | null
          status: string | null
          timestamp: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_rule_approvers_policy_rule_id_fkey"
            columns: ["policy_rule_id"]
            isOneToOne: false
            referencedRelation: "rules"
            referencedColumns: ["rule_id"]
          },
        ]
      }
    }
    Functions: {
      add_investors_to_group: {
        Args: { p_group_id: string; p_investor_ids: string[] }
        Returns: undefined
      }
      add_policy_approver: {
        Args:
          | { p_policy_id: string; p_user_id: string; p_created_by: string }
          | {
              policy_id: string
              user_id: string
              created_by: string
              status_val?: string
            }
        Returns: undefined
      }
      add_policy_approver_with_cast: {
        Args: { policy_id: string; user_id: string; created_by_id: string }
        Returns: boolean
      }
      add_table_to_realtime: {
        Args: { table_name: string }
        Returns: undefined
      }
      archive_old_moonpay_compliance_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      assign_redemption_approvers: {
        Args: { p_redemption_request_id: string; p_approval_config_id: string }
        Returns: boolean
      }
      check_permission: {
        Args: { p_role_name: string; p_resource: string; p_action: string }
        Returns: boolean
      }
      check_user_permission: {
        Args: { user_id: string; permission: string }
        Returns: boolean
      }
      cleanup_expired_asset_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_moonpay_policy_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_webhook_events: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_orphaned_policy_approvers: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      column_exists: {
        Args: {
          p_schema_name: string
          p_table_name: string
          p_column_name: string
        }
        Returns: boolean
      }
      create_audit_trigger: {
        Args: { table_name: string; is_high_volume?: boolean }
        Returns: undefined
      }
      create_project_with_cap_table: {
        Args: { project_data: Json; cap_table_name: string }
        Returns: Json
      }
      create_selective_audit_trigger: {
        Args: { p_table: string; p_condition?: string }
        Returns: undefined
      }
      create_transaction_events_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_project_cascade: {
        Args: { project_id: string }
        Returns: undefined
      }
      delete_user_with_privileges: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      exec: {
        Args: { query: string }
        Returns: Json
      }
      execute_safely: {
        Args: { p_statement: string }
        Returns: boolean
      }
      get_activity_counts_by_timeframe: {
        Args: { p_start_time: string; p_end_time: string; p_interval?: string }
        Returns: {
          time_bucket: string
          activity_count: number
        }[]
      }
      get_activity_distribution_by_category: {
        Args: { p_start_time: string; p_end_time: string }
        Returns: {
          category: string
          activity_count: number
          percentage: number
        }[]
      }
      get_activity_hierarchy: {
        Args: { root_id: string }
        Returns: {
          id: string
          action: string
          activity_timestamp: string
          status: string
          level: number
        }[]
      }
      get_moonpay_webhook_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_webhooks: number
          active_webhooks: number
          failed_webhooks: number
          avg_success_rate: number
        }[]
      }
      get_token_whitelist_addresses: {
        Args: { p_token_id: string }
        Returns: {
          address: string
          source: string
          is_active: boolean
          approved_date: string
        }[]
      }
      get_unique_group_memberships: {
        Args: { investor_ids: string[] }
        Returns: {
          group_id: string
          investor_count: number
        }[]
      }
      get_unique_member_count: {
        Args: { group_id_param: string }
        Returns: number
      }
      get_users_by_role_for_approval: {
        Args: { role_names: string[] }
        Returns: {
          user_id: string
          user_name: string
          user_email: string
          role_name: string
          role_id: string
        }[]
      }
      get_users_with_any_permission: {
        Args: { permission_names: string[] }
        Returns: {
          user_id: string
          name: string
          email: string
          role: string
        }[]
      }
      get_users_with_permission: {
        Args: { permission_name: string }
        Returns: {
          user_id: string
          name: string
          email: string
          role: string
        }[]
      }
      get_users_with_permission_simple: {
        Args: { p_permission_id: string }
        Returns: string[]
      }
      insert_policy_approver: {
        Args: { p_policy_id: string; p_user_id: string; p_created_by: string }
        Returns: undefined
      }
      is_address_whitelisted: {
        Args: { p_token_id: string; p_address: string }
        Returns: boolean
      }
      list_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      log_audit: {
        Args: {
          p_action: string
          p_user_id: string
          p_entity_type: string
          p_entity_id?: string
          p_details?: string
          p_status?: string
          p_metadata?: Json
          p_old_data?: Json
          p_new_data?: Json
        }
        Returns: string
      }
      migrate_token_json_to_tables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_activity_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      remove_investors_from_group: {
        Args: { p_group_id: string; p_investor_ids: string[] }
        Returns: undefined
      }
      safe_cast_to_uuid: {
        Args: { input: string }
        Returns: string
      }
      safe_uuid_cast: {
        Args: { text_id: string }
        Returns: string
      }
      save_consensus_config: {
        Args: {
          p_consensus_type: string
          p_required_approvals: number
          p_eligible_roles: string[]
        }
        Returns: boolean
      }
      sync_group_memberships: {
        Args: { group_id_param: string }
        Returns: undefined
      }
      sync_investor_group_memberships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      table_exists: {
        Args: { p_schema_name: string; p_table_name: string }
        Returns: boolean
      }
      track_system_process: {
        Args: { process_name: string; description?: string; metadata?: Json }
        Returns: string
      }
      update_bulk_operation_progress: {
        Args: {
          p_operation_id: string
          p_progress: number
          p_processed_count?: number
          p_failed_count?: number
          p_status?: string
        }
        Returns: boolean
      }
      update_system_process_progress: {
        Args: {
          p_process_id: string
          p_progress: number
          p_processed_count?: number
          p_status?: string
        }
        Returns: boolean
      }
      update_system_process_status: {
        Args: { process_id: string; new_status: string; error_details?: string }
        Returns: boolean
      }
      update_user_role: {
        Args: { p_user_id: string; p_role: string }
        Returns: undefined
      }
      upsert_policy_template_approver: {
        Args: {
          p_template_id: string
          p_user_id: string
          p_created_by: string
          p_status?: string
        }
        Returns: undefined
      }
      user_has_delete_permission: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      validate_blockchain_address: {
        Args: { blockchain: string; address: string }
        Returns: boolean
      }
      validate_geographic_restriction: {
        Args: {
          p_token_id: string
          p_investor_country_code: string
          p_investment_amount?: number
        }
        Returns: {
          is_allowed: boolean
          restriction_type: string
          max_ownership_percentage: number
          requires_enhanced_dd: boolean
          blocking_reason: string
        }[]
      }
      validate_whitelist_config_permissive: {
        Args: { config: Json }
        Returns: boolean
      }
    }
    Enums: {
      compliance_status: "compliant" | "non_compliant" | "pending_review"
      document_status: "pending" | "approved" | "rejected" | "expired"
      document_type:
        | "commercial_register"
        | "certificate_incorporation"
        | "memorandum_articles"
        | "director_list"
        | "shareholder_register"
        | "financial_statements"
        | "regulatory_status"
        | "qualification_summary"
        | "business_description"
        | "organizational_chart"
        | "key_people_cv"
        | "aml_kyc_description"
      issuer_document_type:
        | "issuer_creditworthiness"
        | "project_security_type"
        | "offering_details"
        | "term_sheet"
        | "special_rights"
        | "underwriters"
        | "use_of_proceeds"
        | "financial_highlights"
        | "timing"
        | "risk_factors"
      issuer_role: "admin" | "editor" | "viewer" | "compliance_officer"
      kyc_status: "approved" | "pending" | "failed" | "not_started" | "expired"
      pool_type_enum: "Total Pool" | "Tranche"
      project_duration:
        | "1_month"
        | "3_months"
        | "6_months"
        | "9_months"
        | "12_months"
        | "over_12_months"
      token_config_mode_enum: "min" | "max" | "basic" | "advanced"
      token_standard_enum:
        | "ERC-20"
        | "ERC-721"
        | "ERC-1155"
        | "ERC-1400"
        | "ERC-3525"
        | "ERC-4626"
      token_status_enum:
        | "DRAFT"
        | "UNDER REVIEW"
        | "APPROVED"
        | "READY TO MINT"
        | "MINTED"
        | "DEPLOYED"
        | "PAUSED"
        | "DISTRIBUTED"
        | "REJECTED"
      workflow_status: "pending" | "completed" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      compliance_status: ["compliant", "non_compliant", "pending_review"],
      document_status: ["pending", "approved", "rejected", "expired"],
      document_type: [
        "commercial_register",
        "certificate_incorporation",
        "memorandum_articles",
        "director_list",
        "shareholder_register",
        "financial_statements",
        "regulatory_status",
        "qualification_summary",
        "business_description",
        "organizational_chart",
        "key_people_cv",
        "aml_kyc_description",
      ],
      issuer_document_type: [
        "issuer_creditworthiness",
        "project_security_type",
        "offering_details",
        "term_sheet",
        "special_rights",
        "underwriters",
        "use_of_proceeds",
        "financial_highlights",
        "timing",
        "risk_factors",
      ],
      issuer_role: ["admin", "editor", "viewer", "compliance_officer"],
      kyc_status: ["approved", "pending", "failed", "not_started", "expired"],
      pool_type_enum: ["Total Pool", "Tranche"],
      project_duration: [
        "1_month",
        "3_months",
        "6_months",
        "9_months",
        "12_months",
        "over_12_months",
      ],
      token_config_mode_enum: ["min", "max", "basic", "advanced"],
      token_standard_enum: [
        "ERC-20",
        "ERC-721",
        "ERC-1155",
        "ERC-1400",
        "ERC-3525",
        "ERC-4626",
      ],
      token_status_enum: [
        "DRAFT",
        "UNDER REVIEW",
        "APPROVED",
        "READY TO MINT",
        "MINTED",
        "DEPLOYED",
        "PAUSED",
        "DISTRIBUTED",
        "REJECTED",
      ],
      workflow_status: ["pending", "completed", "rejected"],
    },
  },
} as const
