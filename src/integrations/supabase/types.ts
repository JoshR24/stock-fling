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
        Args: {
          friend_request_id: string
          response: string
        }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
