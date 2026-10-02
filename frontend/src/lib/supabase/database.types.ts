
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "connections": {
                  Row: {
                    "accepted_at": string | null,"approver_id": string,"created_at": string,"id": number,"requester_id": string,"skill_post_id": number,"status": Database["public"]['Enums']["connection_status"]
                  }
                  Insert: {
                    "accepted_at"?: string | null,"approver_id": string,"created_at"?: string,"id"?: never,"requester_id"?: string,"skill_post_id": number,"status"?: Database["public"]['Enums']["connection_status"]
                  }
                  Update: {
                    "accepted_at"?: string | null,"approver_id"?: string,"created_at"?: string,"id"?: never,"requester_id"?: string,"skill_post_id"?: number,"status"?: Database["public"]['Enums']["connection_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "connections_approver_id_fkey"
      columns: ["approver_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_skill_post_id_fkey"
      columns: ["skill_post_id"]
isOneToOne: false
      referencedRelation: "skill_posts"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "connection_id": number,"content": string,"created_at": string,"id": number,"sender_id": string
                  }
                  Insert: {
                    "connection_id": number,"content": string,"created_at"?: string,"id"?: never,"sender_id"?: string
                  }
                  Update: {
                    "connection_id"?: number,"content"?: string,"created_at"?: string,"id"?: never,"sender_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_connection_id_fkey"
      columns: ["connection_id"]
isOneToOne: false
      referencedRelation: "connections"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"id": string,"username": string | null
                  }
                  Insert: {
                    "created_at"?: string,"id": string,"username"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"username"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"skill_posts": {
                  Row: {
                    "archived": boolean,"author_id": string,"created_at": string,"description": string,"id": number,"poster_image_path": string | null,"title": string,"type": Database["public"]['Enums']["post_type"]
                  }
                  Insert: {
                    "archived"?: boolean,"author_id"?: string,"created_at"?: string,"description": string,"id"?: never,"poster_image_path"?: string | null,"title": string,"type": Database["public"]['Enums']["post_type"]
                  }
                  Update: {
                    "archived"?: boolean,"author_id"?: string,"created_at"?: string,"description"?: string,"id"?: never,"poster_image_path"?: string | null,"title"?: string,"type"?: Database["public"]['Enums']["post_type"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "skill_posts_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"user_locations": {
                  Row: {
                    "location": unknown,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "location": unknown,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "location"?: unknown,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_locations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "app_stats":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"claim_username":
{ Args: { "p_username": string }; Returns: undefined
                           },
"generate_usernames":
{ Args: Record<PropertyKey, never>; Returns: (string)[]
                           },
"is_connection_participant":
{ Args: { "p_connection_id": number }; Returns: boolean
                           },
"nearby_posts":
{ Args: { "lat": number,"lon": number,"radius_m"?: number }; Returns: {
              "archived": boolean,
"author_id": string,
"created_at": string,
"description": string,
"id": number,
"poster_image_path": string | null,
"title": string,
"type": Database["public"]['Enums']["post_type"]
            }[]
                          SetofOptions: {
        from: "*"
        to: "skill_posts"
        isOneToOne: false
        isSetofReturn: true
      } },
"set_my_location":
{ Args: { "lat": number,"lon": number }; Returns: undefined
                           }
          }
          Enums: {
            "connection_status": "PENDING"|"ACCEPTED"|"REJECTED"|"COMPLETED","post_type": "OFFER"|"ASK"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "connection_status": ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"],"post_type": ["OFFER", "ASK"]
          }
        }
} as const
