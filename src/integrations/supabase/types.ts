export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          completed_at: string | null
          id: string
          requested_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          requested_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          requested_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          last_updated: string | null
          support_email: string
          support_phone: string | null
        }
        Insert: {
          id?: string
          last_updated?: string | null
          support_email?: string
          support_phone?: string | null
        }
        Update: {
          id?: string
          last_updated?: string | null
          support_email?: string
          support_phone?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string | null
          id: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          friend_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          friend_id?: string | null
          id?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mlb_schedules: {
        Row: {
          away_team: string | null
          game_date: string | null
          home_team: string | null
          id: number
          location: string | null
          state: string | null
          venue: string | null
        }
        Insert: {
          away_team?: string | null
          game_date?: string | null
          home_team?: string | null
          id?: number
          location?: string | null
          state?: string | null
          venue?: string | null
        }
        Update: {
          away_team?: string | null
          game_date?: string | null
          home_team?: string | null
          id?: number
          location?: string | null
          state?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      nba_schedules: {
        Row: {
          away_team: string | null
          game_date: string | null
          home_team: string | null
          id: number
          location: string | null
          state: string | null
          venue: string | null
        }
        Insert: {
          away_team?: string | null
          game_date?: string | null
          home_team?: string | null
          id?: number
          location?: string | null
          state?: string | null
          venue?: string | null
        }
        Update: {
          away_team?: string | null
          game_date?: string | null
          home_team?: string | null
          id?: number
          location?: string | null
          state?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      nfl_schedules: {
        Row: {
          away_team: string | null
          created_at: string
          game_date: string | null
          home_team: string | null
          id: number
          location: string | null
          state: string | null
          venue: string | null
        }
        Insert: {
          away_team?: string | null
          created_at?: string
          game_date?: string | null
          home_team?: string | null
          id?: number
          location?: string | null
          state?: string | null
          venue?: string | null
        }
        Update: {
          away_team?: string | null
          created_at?: string
          game_date?: string | null
          home_team?: string | null
          id?: number
          location?: string | null
          state?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      nhl_schedules: {
        Row: {
          away_team: string | null
          game_date: string | null
          home_team: string | null
          id: number
          location: string | null
          state: string | null
          venue: string | null
        }
        Insert: {
          away_team?: string | null
          game_date?: string | null
          home_team?: string | null
          id?: number
          location?: string | null
          state?: string | null
          venue?: string | null
        }
        Update: {
          away_team?: string | null
          game_date?: string | null
          home_team?: string | null
          id?: number
          location?: string | null
          state?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      paper_trading_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trading_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_trading_positions: {
        Row: {
          average_price: number
          created_at: string
          id: string
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_price: number
          created_at?: string
          id?: string
          quantity: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_price?: number
          created_at?: string
          id?: string
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trading_positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_trading_transactions: {
        Row: {
          created_at: string
          id: string
          price: number
          quantity: number
          symbol: string
          total_amount: number
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price: number
          quantity: number
          symbol: string
          total_amount: number
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          quantity?: number
          symbol?: string
          total_amount?: number
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paper_trading_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      stock_data_cache: {
        Row: {
          data: Json
          last_updated: string
          symbol: string
        }
        Insert: {
          data?: Json
          last_updated?: string
          symbol: string
        }
        Update: {
          data?: Json
          last_updated?: string
          symbol?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          created_at: string | null
          last_updated: string | null
          name: string | null
          status: Database["public"]["Enums"]["stock_status"] | null
          symbol: string
        }
        Insert: {
          created_at?: string | null
          last_updated?: string | null
          name?: string | null
          status?: Database["public"]["Enums"]["stock_status"] | null
          symbol: string
        }
        Update: {
          created_at?: string | null
          last_updated?: string | null
          name?: string | null
          status?: Database["public"]["Enums"]["stock_status"] | null
          symbol?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_friend_request: {
        Args: { friend_request_id: string; response: string }
        Returns: {
          created_at: string
          friend_id: string | null
          id: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
      }
    }
    Enums: {
      stock_status: "active" | "inactive" | "delisted"
      transaction_type: "buy" | "sell"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      stock_status: ["active", "inactive", "delisted"],
      transaction_type: ["buy", "sell"],
    },
  },
} as const
