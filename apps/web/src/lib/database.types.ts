export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          amount: number
          category_id: string
          category_kind: Database['public']['Enums']['category_kind']
          created_at: string
          currency: Database['public']['Enums']['currency']
          id: string
          month: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          category_id: string
          category_kind?: Database['public']['Enums']['category_kind']
          created_at?: string
          currency: Database['public']['Enums']['currency']
          id?: string
          month: string
          user_id?: string
        }
        Update: {
          amount?: number
          category_id?: string
          category_kind?: Database['public']['Enums']['category_kind']
          created_at?: string
          currency?: Database['public']['Enums']['currency']
          id?: string
          month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'budgets_category_fkey'
            columns: ['category_id', 'user_id', 'category_kind']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id', 'user_id', 'kind']
          },
        ]
      }
      categories: {
        Row: {
          archived_at: string | null
          created_at: string
          emoji: string
          id: string
          kind: Database['public']['Enums']['category_kind']
          name: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          archived_at?: string | null
          created_at?: string
          emoji?: string
          id?: string
          kind: Database['public']['Enums']['category_kind']
          name: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          emoji?: string
          id?: string
          kind?: Database['public']['Enums']['category_kind']
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_purchases: {
        Row: {
          asset: string
          cost: number
          cost_currency: Database['public']['Enums']['currency']
          created_at: string
          id: string
          occurred_on: string
          platform: string
          quantity: number
          user_id: string
        }
        ComputedFields: never
        Insert: {
          asset?: string
          cost: number
          cost_currency?: Database['public']['Enums']['currency']
          created_at?: string
          id?: string
          occurred_on: string
          platform?: string
          quantity: number
          user_id?: string
        }
        Update: {
          asset?: string
          cost?: number
          cost_currency?: Database['public']['Enums']['currency']
          created_at?: string
          id?: string
          occurred_on?: string
          platform?: string
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      movements: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          currency: Database['public']['Enums']['currency']
          description: string | null
          id: string
          occurred_on: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          currency: Database['public']['Enums']['currency']
          description?: string | null
          id?: string
          occurred_on: string
          user_id?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          currency?: Database['public']['Enums']['currency']
          description?: string | null
          id?: string
          occurred_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'movements_category_fkey'
            columns: ['category_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      savings_contributions: {
        Row: {
          amount: number
          created_at: string
          currency: Database['public']['Enums']['currency']
          goal_id: string
          id: string
          occurred_on: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          created_at?: string
          currency: Database['public']['Enums']['currency']
          goal_id: string
          id?: string
          occurred_on: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: Database['public']['Enums']['currency']
          goal_id?: string
          id?: string
          occurred_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'savings_contributions_goal_fkey'
            columns: ['goal_id', 'user_id', 'currency']
            isOneToOne: false
            referencedRelation: 'savings_goals'
            referencedColumns: ['id', 'user_id', 'saving_currency']
          },
        ]
      }
      savings_goals: {
        Row: {
          archived: boolean
          created_at: string
          emoji: string
          id: string
          name: string
          saving_currency: Database['public']['Enums']['currency']
          target_amount: number
          target_currency: Database['public']['Enums']['currency']
          user_id: string
        }
        ComputedFields: never
        Insert: {
          archived?: boolean
          created_at?: string
          emoji?: string
          id?: string
          name: string
          saving_currency: Database['public']['Enums']['currency']
          target_amount: number
          target_currency: Database['public']['Enums']['currency']
          user_id?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          saving_currency?: Database['public']['Enums']['currency']
          target_amount?: number
          target_currency?: Database['public']['Enums']['currency']
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      category_kind: 'income' | 'expense'
      currency: 'ARS' | 'USD'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      category_kind: ['income', 'expense'],
      currency: ['ARS', 'USD'],
    },
  },
} as const
