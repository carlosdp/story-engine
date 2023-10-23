export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      archive: {
        Row: {
          archivedon: string
          completedon: string | null
          createdon: string
          data: Json | null
          expirein: unknown
          id: string
          keepuntil: string
          name: string
          on_complete: boolean
          output: Json | null
          priority: number
          retrybackoff: boolean
          retrycount: number
          retrydelay: number
          retrylimit: number
          singletonkey: string | null
          singletonon: string | null
          startafter: string
          startedon: string | null
          state: Database["public"]["Enums"]["job_state"]
        }
        Insert: {
          archivedon?: string
          completedon?: string | null
          createdon: string
          data?: Json | null
          expirein: unknown
          id: string
          keepuntil: string
          name: string
          on_complete: boolean
          output?: Json | null
          priority: number
          retrybackoff: boolean
          retrycount: number
          retrydelay: number
          retrylimit: number
          singletonkey?: string | null
          singletonon?: string | null
          startafter: string
          startedon?: string | null
          state: Database["public"]["Enums"]["job_state"]
        }
        Update: {
          archivedon?: string
          completedon?: string | null
          createdon?: string
          data?: Json | null
          expirein?: unknown
          id?: string
          keepuntil?: string
          name?: string
          on_complete?: boolean
          output?: Json | null
          priority?: number
          retrybackoff?: boolean
          retrycount?: number
          retrydelay?: number
          retrylimit?: number
          singletonkey?: string | null
          singletonon?: string | null
          startafter?: string
          startedon?: string | null
          state?: Database["public"]["Enums"]["job_state"]
        }
      }
      character_conversations: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          source_character_id: string
          target_character_id: string
          type: string
          updated_at: string | null
          world_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          source_character_id: string
          target_character_id: string
          type: string
          updated_at?: string | null
          world_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          source_character_id?: string
          target_character_id?: string
          type?: string
          updated_at?: string | null
          world_id?: string
        }
      }
      character_relationships: {
        Row: {
          character_id: string
          created_at: string
          description_of_interactions: string
          id: string
          related_character_id: string
          relationship_type: string
          updated_at: string
        }
        Insert: {
          character_id: string
          created_at?: string
          description_of_interactions: string
          id?: string
          related_character_id: string
          relationship_type: string
          updated_at?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          description_of_interactions?: string
          id?: string
          related_character_id?: string
          relationship_type?: string
          updated_at?: string
        }
      }
      characters: {
        Row: {
          allocated: boolean | null
          backstory: string
          created_at: string
          deceased: boolean | null
          description: string
          embedding: unknown
          id: string
          name: string
          personality: string
          updated_at: string
          world_id: string
          writing_style: string
        }
        Insert: {
          allocated?: boolean | null
          backstory: string
          created_at?: string
          deceased?: boolean | null
          description: string
          embedding: unknown
          id?: string
          name: string
          personality: string
          updated_at?: string
          world_id: string
          writing_style: string
        }
        Update: {
          allocated?: boolean | null
          backstory?: string
          created_at?: string
          deceased?: boolean | null
          description?: string
          embedding?: unknown
          id?: string
          name?: string
          personality?: string
          updated_at?: string
          world_id?: string
          writing_style?: string
        }
      }
      design_documents: {
        Row: {
          content: string
          created_at: string
          id: string
          world_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          world_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          world_id?: string
        }
      }
      job: {
        Row: {
          completedon: string | null
          createdon: string
          data: Json | null
          expirein: unknown
          id: string
          keepuntil: string
          name: string
          on_complete: boolean
          output: Json | null
          priority: number
          retrybackoff: boolean
          retrycount: number
          retrydelay: number
          retrylimit: number
          singletonkey: string | null
          singletonon: string | null
          startafter: string
          startedon: string | null
          state: Database["public"]["Enums"]["job_state"]
        }
        Insert: {
          completedon?: string | null
          createdon?: string
          data?: Json | null
          expirein?: unknown
          id?: string
          keepuntil?: string
          name: string
          on_complete?: boolean
          output?: Json | null
          priority?: number
          retrybackoff?: boolean
          retrycount?: number
          retrydelay?: number
          retrylimit?: number
          singletonkey?: string | null
          singletonon?: string | null
          startafter?: string
          startedon?: string | null
          state?: Database["public"]["Enums"]["job_state"]
        }
        Update: {
          completedon?: string | null
          createdon?: string
          data?: Json | null
          expirein?: unknown
          id?: string
          keepuntil?: string
          name?: string
          on_complete?: boolean
          output?: Json | null
          priority?: number
          retrybackoff?: boolean
          retrycount?: number
          retrydelay?: number
          retrylimit?: number
          singletonkey?: string | null
          singletonon?: string | null
          startafter?: string
          startedon?: string | null
          state?: Database["public"]["Enums"]["job_state"]
        }
      }
      locations: {
        Row: {
          backstory: string | null
          created_at: string
          description: string | null
          embedding: unknown
          id: string
          location: unknown | null
          name: string
          world_id: string
        }
        Insert: {
          backstory?: string | null
          created_at?: string
          description?: string | null
          embedding: unknown
          id?: string
          location?: unknown | null
          name: string
          world_id: string
        }
        Update: {
          backstory?: string | null
          created_at?: string
          description?: string | null
          embedding?: unknown
          id?: string
          location?: unknown | null
          name?: string
          world_id?: string
        }
      }
      mission_characters: {
        Row: {
          character_id: string
          created_at: string
          mission_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          mission_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          mission_id?: string
        }
      }
      mission_objectives: {
        Row: {
          created_at: string
          data: Json
          id: string
          instructions: string
          mission_id: string
          prerequisite_id: string | null
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          instructions: string
          mission_id: string
          prerequisite_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          instructions?: string
          mission_id?: string
          prerequisite_id?: string | null
        }
      }
      missions: {
        Row: {
          created_at: string
          id: string
          storyline_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          storyline_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          storyline_id?: string
          updated_at?: string
        }
      }
      observations: {
        Row: {
          created_at: string
          embedding: unknown
          id: string
          location: unknown | null
          subsystem: string
          text: string
          updated_at: string
          updated_observation_id: string | null
          world_id: string
        }
        Insert: {
          created_at?: string
          embedding: unknown
          id?: string
          location?: unknown | null
          subsystem: string
          text: string
          updated_at?: string
          updated_observation_id?: string | null
          world_id: string
        }
        Update: {
          created_at?: string
          embedding?: unknown
          id?: string
          location?: unknown | null
          subsystem?: string
          text?: string
          updated_at?: string
          updated_observation_id?: string | null
          world_id?: string
        }
      }
      players: {
        Row: {
          character_id: string | null
          created_at: string
          id: string
          name: string
          world_id: string
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          id?: string
          name: string
          world_id: string
        }
        Update: {
          character_id?: string | null
          created_at?: string
          id?: string
          name?: string
          world_id?: string
        }
      }
      profiles: {
        Row: {
          created_at: string | null
          is_staff: boolean
          owns_rust: boolean | null
          rust_played_minutes_recent: number | null
          rust_played_minutes_total: number | null
          steam_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_staff?: boolean
          owns_rust?: boolean | null
          rust_played_minutes_recent?: number | null
          rust_played_minutes_total?: number | null
          steam_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_staff?: boolean
          owns_rust?: boolean | null
          rust_played_minutes_recent?: number | null
          rust_played_minutes_total?: number | null
          steam_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
      }
      research_sessions: {
        Row: {
          created_at: string
          id: string
          research_id: string
          started_at: string
          stopped_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          research_id: string
          started_at?: string
          stopped_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          research_id?: string
          started_at?: string
          stopped_at?: string | null
          updated_at?: string
        }
      }
      researchables: {
        Row: {
          created_at: string
          depends_on: string | null
          description: string
          id: string
          name: string
          time_required: unknown
          updated_at: string
          world_id: string
        }
        Insert: {
          created_at?: string
          depends_on?: string | null
          description: string
          id?: string
          name: string
          time_required: unknown
          updated_at?: string
          world_id: string
        }
        Update: {
          created_at?: string
          depends_on?: string | null
          description?: string
          id?: string
          name?: string
          time_required?: unknown
          updated_at?: string
          world_id?: string
        }
      }
      scenarios: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          world_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          world_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          world_id?: string
        }
      }
      schedule: {
        Row: {
          created_on: string
          cron: string
          data: Json | null
          name: string
          options: Json | null
          timezone: string | null
          updated_on: string
        }
        Insert: {
          created_on?: string
          cron: string
          data?: Json | null
          name: string
          options?: Json | null
          timezone?: string | null
          updated_on?: string
        }
        Update: {
          created_on?: string
          cron?: string
          data?: Json | null
          name?: string
          options?: Json | null
          timezone?: string | null
          updated_on?: string
        }
      }
      signals: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          from_action_id: string | null
          from_subsystem: string | null
          id: string
          payload: Json
          response_to: string | null
          subsystem: string
          world_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          from_action_id?: string | null
          from_subsystem?: string | null
          id?: string
          payload: Json
          response_to?: string | null
          subsystem: string
          world_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          from_action_id?: string | null
          from_subsystem?: string | null
          id?: string
          payload?: Json
          response_to?: string | null
          subsystem?: string
          world_id?: string
        }
      }
      storyline_characters: {
        Row: {
          character_id: string
          created_at: string
          storyline_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          storyline_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          storyline_id?: string
        }
      }
      storyline_stories: {
        Row: {
          created_at: string
          id: string
          storyline_id: string
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          storyline_id: string
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          storyline_id?: string
          text?: string
        }
      }
      storylines: {
        Row: {
          created_at: string
          id: string
          name: string | null
          prompt: string
          scenario_id: string | null
          updated_at: string
          world_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          prompt: string
          scenario_id?: string | null
          updated_at?: string
          world_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          prompt?: string
          scenario_id?: string | null
          updated_at?: string
          world_id?: string
        }
      }
      subscription: {
        Row: {
          created_on: string
          event: string
          name: string
          updated_on: string
        }
        Insert: {
          created_on?: string
          event: string
          name: string
          updated_on?: string
        }
        Update: {
          created_on?: string
          event?: string
          name?: string
          updated_on?: string
        }
      }
      thought_process_actions: {
        Row: {
          action: string
          created_at: string
          data: Json | null
          id: string
          parameters: Json
          result: string | null
          status: Database["public"]["Enums"]["action_status"]
          thought_process_id: string | null
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          data?: Json | null
          id?: string
          parameters: Json
          result?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          thought_process_id?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          data?: Json | null
          id?: string
          parameters?: Json
          result?: string | null
          status?: Database["public"]["Enums"]["action_status"]
          thought_process_id?: string | null
          updated_at?: string
        }
      }
      thought_process_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thought_process_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thought_process_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thought_process_id?: string
          updated_at?: string
        }
      }
      thought_processes: {
        Row: {
          created_at: string
          data: Json
          id: string
          initiating_message_id: string
          parent_thought_process_id: string | null
          subsystem: string
          terminated_at: string | null
          updated_at: string
          world_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          initiating_message_id: string
          parent_thought_process_id?: string | null
          subsystem: string
          terminated_at?: string | null
          updated_at?: string
          world_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          initiating_message_id?: string
          parent_thought_process_id?: string | null
          subsystem?: string
          terminated_at?: string | null
          updated_at?: string
          world_id?: string
        }
      }
      version: {
        Row: {
          cron_on: string | null
          maintained_on: string | null
          version: number
        }
        Insert: {
          cron_on?: string | null
          maintained_on?: string | null
          version: number
        }
        Update: {
          cron_on?: string | null
          maintained_on?: string | null
          version?: number
        }
      }
      worlds: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          ready: boolean
          settings: Json
          state: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          name: string
          ready?: boolean
          settings?: Json
          state?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          ready?: boolean
          settings?: Json
          state?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      available_researchables: {
        Row: {
          active: boolean | null
          created_at: string | null
          depends_on: string | null
          description: string | null
          finish_time: string | null
          id: string | null
          name: string | null
          time_required: unknown | null
          updated_at: string | null
          world_id: string | null
        }
      }
      completed_researchables: {
        Row: {
          created_at: string | null
          depends_on: string | null
          description: string | null
          id: string | null
          name: string | null
          time_required: unknown | null
          updated_at: string | null
          world_id: string | null
        }
      }
      npc_characters: {
        Row: {
          allocated: boolean | null
          backstory: string | null
          created_at: string | null
          deceased: boolean | null
          description: string | null
          embedding: unknown | null
          id: string | null
          name: string | null
          personality: string | null
          updated_at: string | null
          world_id: string | null
          writing_style: string | null
        }
      }
      players_with_characters: {
        Row: {
          allocated: boolean | null
          backstory: string | null
          created_at: string | null
          deceased: boolean | null
          description: string | null
          embedding: unknown | null
          id: string | null
          name: string | null
          personality: string | null
          player_id: string | null
          player_name: string | null
          updated_at: string | null
          world_id: string | null
          writing_style: string | null
        }
      }
      queued_signals: {
        Row: {
          acknowledged_at: string | null
          created_at: string | null
          from_action_id: string | null
          from_subsystem: string | null
          id: string | null
          payload: Json | null
          response_to: string | null
          subsystem: string | null
          world_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string | null
          from_action_id?: string | null
          from_subsystem?: string | null
          id?: string | null
          payload?: Json | null
          response_to?: string | null
          subsystem?: string | null
          world_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string | null
          from_action_id?: string | null
          from_subsystem?: string | null
          id?: string | null
          payload?: Json | null
          response_to?: string | null
          subsystem?: string | null
          world_id?: string | null
        }
      }
      scenario_characters: {
        Row: {
          allocated: boolean | null
          backstory: string | null
          created_at: string | null
          deceased: boolean | null
          description: string | null
          embedding: unknown | null
          id: string | null
          name: string | null
          personality: string | null
          scenario_id: string | null
          updated_at: string | null
          world_id: string | null
          writing_style: string | null
        }
      }
      staff_users: {
        Row: {
          user_id: string | null
        }
        Insert: {
          user_id?: string | null
        }
        Update: {
          user_id?: string | null
        }
      }
      users: {
        Row: {
          created_at: string | null
          discord_id: string | null
          email: string | null
          id: string | null
          is_staff: boolean | null
          owns_rust: boolean | null
          rust_played_minutes_recent: number | null
          rust_played_minutes_total: number | null
          steam_id: string | null
          updated_at: string | null
          user_id: string | null
        }
      }
    }
    Functions: {
      acknowledge_signals: {
        Args: {
          ids: string[]
        }
        Returns: undefined
      }
      create_scenario: {
        Args: {
          world_id: string
          name: string
          description: string
        }
        Returns: string
      }
      create_world: {
        Args: {
          name: string
          description: string
        }
        Returns: {
          active: boolean
          created_at: string
          description: string
          id: string
          name: string
          ready: boolean
          settings: Json
          state: Json
          updated_at: string
        }
      }
      createcharacter: {
        Args: {
          storyline_id: string
        }
        Returns: string
      }
      get_player_by_name: {
        Args: {
          player_world_id: string
          player_name: string
        }
        Returns: {
          character_id: string | null
          created_at: string
          id: string
          name: string
          world_id: string
        }
      }
      hydrated_missions: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          storyline_id: string
          characters: Json
          objectives: Json
        }[]
      }
      related_characters: {
        Args: {
          p_character_id: string
        }
        Returns: {
          id: string
          rust_npc_type: string
          first_name: string
          last_name: string
          title: string
          backstory: string
          personality: string
          writing_style: string
          created_at: string
          updated_at: string
          relationship_type: string
          description_of_interactions: string
        }[]
      }
      search_observations: {
        Args: {
          search_embedding: unknown
          search_location: unknown
          decay_rate: number
          min_similarity: number
          max_range: number
        }
        Returns: {
          id: string
          subsystem: string
          text: string
          embedding: unknown
          location: unknown
          updated_observation_id: string
          created_at: string
          updated_at: string
          similarity: number
          distance: number
          time_weight: number
          final_weight: number
        }[]
      }
      submit_design_document: {
        Args: {
          world_id: string
          content: string
        }
        Returns: string
      }
      switch_research: {
        Args: {
          research_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      action_status: "pending" | "waiting" | "complete" | "failed"
      job_state:
        | "created"
        | "retry"
        | "active"
        | "completed"
        | "expired"
        | "cancelled"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

