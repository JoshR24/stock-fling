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
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
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
          data: Json
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      transaction_type: "buy" | "sell"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface StockDataCacheEntry {
  symbol: string;
  name: string;
  price: number;
  change: number;
  chartData: { date: string; value: number }[];
  description: string;
  news: {
    id: string;
    title: string;
    summary: string;
    date: string;
    url: string;
  }[];
}
