// Generated from the linked Supabase project. Regenerate with:
//   npx supabase gen types typescript --linked > lib/supabase/database.types.ts
// Do not hand-edit the generated section below — add convenience aliases at the bottom instead.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date: string
          id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          id: string
          quantity: number
          variant_id: string
        }
        Insert: {
          cart_id: string
          id?: string
          quantity: number
          variant_id: string
        }
        Update: {
          cart_id?: string
          id?: string
          quantity?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      collections: {
        Row: {
          audience: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          audience?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          audience?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      content_blocks: {
        Row: {
          content: Json
          id: string
          is_active: boolean
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          is_active?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          is_active?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country_code: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          phone: string
          postal_code: string | null
          recipient_name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country_code?: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          postal_code?: string | null
          recipient_name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country_code?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          postal_code?: string | null
          recipient_name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_preferences: {
        Row: {
          customer_id: string
          marketing_email: boolean
          order_notifications: boolean
          updated_at: string
        }
        Insert: {
          customer_id: string
          marketing_email?: boolean
          order_notifications?: boolean
          updated_at?: string
        }
        Update: {
          customer_id?: string
          marketing_email?: boolean
          order_notifications?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_products: {
        Row: {
          deal_id: string
          product_id: string
        }
        Insert: {
          deal_id: string
          product_id: string
        }
        Update: {
          deal_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_products_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          discount_percent: number | null
          ends_at: string
          id: string
          is_active: boolean
          placement: string
          starts_at: string
          title: string
        }
        Insert: {
          discount_percent?: number | null
          ends_at: string
          id?: string
          is_active?: boolean
          placement: string
          starts_at: string
          title: string
        }
        Update: {
          discount_percent?: number | null
          ends_at?: string
          id?: string
          is_active?: boolean
          placement?: string
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      email_messages: {
        Row: {
          created_at: string
          event_type: string
          id: string
          inquiry_id: string | null
          order_id: string | null
          provider_message_id: string | null
          recipient: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          inquiry_id?: string | null
          order_id?: string | null
          provider_message_id?: string | null
          recipient: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          inquiry_id?: string | null
          order_id?: string | null
          provider_message_id?: string | null
          recipient?: string
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "contact_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          quantity_on_hand: number
          quantity_reserved: number
          reorder_level: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          quantity_on_hand?: number
          quantity_reserved?: number
          reorder_level?: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          quantity_on_hand?: number
          quantity_reserved?: number
          reorder_level?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          quantity_delta: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          variant_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          quantity_delta: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          variant_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          quantity_delta?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      material_finishes: {
        Row: {
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          id: string
          read_at: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          customer_id: string
          id?: string
          read_at?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          read_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_path: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          unit_cost: number | null
          unit_price: number
          variant_id: string | null
          variant_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku?: string | null
          unit_cost?: number | null
          unit_price: number
          variant_id?: string | null
          variant_name: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_cost?: number | null
          unit_price?: number
          variant_id?: string | null
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          is_customer_visible: boolean
          note: string
          order_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_customer_visible?: boolean
          note: string
          order_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          is_customer_visible?: boolean
          note?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_personalized_messages: {
        Row: {
          created_at: string
          message: string
          order_id: string
          recipient_name: string
        }
        Insert: {
          created_at?: string
          message: string
          order_id: string
          recipient_name: string
        }
        Update: {
          created_at?: string
          message?: string
          order_id?: string
          recipient_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_personalized_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          discount_total: number
          fulfilment: Database["public"]["Enums"]["fulfilment_method"]
          id: string
          order_number: string
          shipping_address: Json | null
          shipping_rate_id: string | null
          shipping_total: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          discount_total?: number
          fulfilment: Database["public"]["Enums"]["fulfilment_method"]
          id?: string
          order_number?: string
          shipping_address?: Json | null
          shipping_rate_id?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          discount_total?: number
          fulfilment?: Database["public"]["Enums"]["fulfilment_method"]
          id?: string
          order_number?: string
          shipping_address?: Json | null
          shipping_rate_id?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_rate_id_fkey"
            columns: ["shipping_rate_id"]
            isOneToOne: false
            referencedRelation: "shipping_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          created_at: string
          event_key: string
          id: string
          payload: Json
          payment_id: string | null
          provider: string
        }
        Insert: {
          created_at?: string
          event_key: string
          id?: string
          payload: Json
          payment_id?: string | null
          provider: string
        }
        Update: {
          created_at?: string
          event_key?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number | null
          created_at: string
          id: string
          payload: Json | null
          payment_id: string
          provider_reference: string | null
          transaction_type: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          payload?: Json | null
          payment_id: string
          provider_reference?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          payload?: Json | null
          payment_id?: string
          provider_reference?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_collections: {
        Row: {
          collection_id: string
          product_id: string
        }
        Insert: {
          collection_id: string
          product_id: string
        }
        Update: {
          collection_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_material_finishes: {
        Row: {
          material_finish_id: string
          product_id: string
        }
        Insert: {
          material_finish_id: string
          product_id: string
        }
        Update: {
          material_finish_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_material_finishes_material_finish_id_fkey"
            columns: ["material_finish_id"]
            isOneToOne: false
            referencedRelation: "material_finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_material_finishes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          media_kind: string
          product_id: string
          sort_order: number
          storage_path: string
          variant_id: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          media_kind: string
          product_id: string
          sort_order?: number
          storage_path: string
          variant_id?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          media_kind?: string
          product_id?: string
          sort_order?: number
          storage_path?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_media_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          display_order: number
          id: string
          option_id: string
          value: string
        }
        Insert: {
          display_order?: number
          id?: string
          option_id: string
          value: string
        }
        Update: {
          display_order?: number
          id?: string
          option_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          display_order: number
          id: string
          name: string
          product_id: string
        }
        Insert: {
          display_order?: number
          id?: string
          name: string
          product_id: string
        }
        Update: {
          display_order?: number
          id?: string
          name?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          cost_price: number | null
          created_at: string
          id: string
          is_active: boolean
          price: number | null
          product_id: string
          sku: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number | null
          product_id: string
          sku: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number | null
          product_id?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          care_instructions: string | null
          cost_price: number | null
          created_at: string
          description: string
          id: string
          is_active: boolean
          is_bestseller: boolean
          is_featured: boolean
          materials: string[]
          name: string
          product_kind: Database["public"]["Enums"]["product_kind"]
          returns_info: string | null
          shipping_info: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          base_price: number
          care_instructions?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          materials?: string[]
          name: string
          product_kind?: Database["public"]["Enums"]["product_kind"]
          returns_info?: string | null
          shipping_info?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          care_instructions?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          materials?: string[]
          name?: string
          product_kind?: Database["public"]["Enums"]["product_kind"]
          returns_info?: string | null
          shipping_info?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          delivered_at: string | null
          dispatched_at: string | null
          id: string
          order_id: string
          status: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          delivered_at?: string | null
          dispatched_at?: string | null
          id?: string
          order_id: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          delivered_at?: string | null
          dispatched_at?: string | null
          id?: string
          order_id?: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          amount: number
          id: string
          is_active: boolean
          min_order_amount: number | null
          name: string
          shipping_zone_id: string
        }
        Insert: {
          amount: number
          id?: string
          is_active?: boolean
          min_order_amount?: number | null
          name: string
          shipping_zone_id: string
        }
        Update: {
          amount?: number
          id?: string
          is_active?: boolean
          min_order_amount?: number | null
          name?: string
          shipping_zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_shipping_zone_id_fkey"
            columns: ["shipping_zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          country_codes: string[]
          id: string
          is_active: boolean
          is_international: boolean
          name: string
        }
        Insert: {
          country_codes?: string[]
          id?: string
          is_active?: boolean
          is_international?: boolean
          name: string
        }
        Update: {
          country_codes?: string[]
          id?: string
          is_active?: boolean
          is_international?: boolean
          name?: string
        }
        Relationships: []
      }
      variant_option_values: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_option_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string
          product_id: string
          wishlist_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          wishlist_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_items_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      fulfilment_method: "DELIVERY" | "COLLECTION"
      order_status:
        | "PAYMENT_PENDING"
        | "PAYMENT_CONFIRMED"
        | "PROCESSING"
        | "READY_FOR_COLLECTION"
        | "DISPATCHED"
        | "IN_TRANSIT"
        | "DELIVERED"
        | "COMPLETED"
        | "CANCELLED"
        | "REFUNDED"
      payment_provider: "MPESA" | "STRIPE"
      payment_status:
        | "PENDING"
        | "PROCESSING"
        | "SUCCEEDED"
        | "FAILED"
        | "CANCELLED"
        | "REFUNDED"
      product_kind: "SET" | "INDIVIDUAL_PIECE"
      user_role: "CUSTOMER" | "ASSISTANT" | "ADMIN"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      fulfilment_method: ["DELIVERY", "COLLECTION"],
      order_status: [
        "PAYMENT_PENDING",
        "PAYMENT_CONFIRMED",
        "PROCESSING",
        "READY_FOR_COLLECTION",
        "DISPATCHED",
        "IN_TRANSIT",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
        "REFUNDED",
      ],
      payment_provider: ["MPESA", "STRIPE"],
      payment_status: [
        "PENDING",
        "PROCESSING",
        "SUCCEEDED",
        "FAILED",
        "CANCELLED",
        "REFUNDED",
      ],
      product_kind: ["SET", "INDIVIDUAL_PIECE"],
      user_role: ["CUSTOMER", "ASSISTANT", "ADMIN"],
    },
  },
} as const

// Convenience aliases for the app's custom enums.
export type UserRole = Database["public"]["Enums"]["user_role"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type ProductKind = Database["public"]["Enums"]["product_kind"];
export type PaymentProvider = Database["public"]["Enums"]["payment_provider"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type FulfilmentMethod = Database["public"]["Enums"]["fulfilment_method"];
