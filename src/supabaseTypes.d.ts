export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      archive: {
        Row: {
          archivedon: string;
          completedon: string | null;
          createdon: string;
          data: Json | null;
          expirein: unknown;
          id: string;
          keepuntil: string;
          name: string;
          on_complete: boolean;
          output: Json | null;
          priority: number;
          retrybackoff: boolean;
          retrycount: number;
          retrydelay: number;
          retrylimit: number;
          singletonkey: string | null;
          singletonon: string | null;
          startafter: string;
          startedon: string | null;
          state: Database['public']['Enums']['job_state'];
        };
        Insert: {
          archivedon?: string;
          completedon?: string | null;
          createdon: string;
          data?: Json | null;
          expirein: unknown;
          id: string;
          keepuntil: string;
          name: string;
          on_complete: boolean;
          output?: Json | null;
          priority: number;
          retrybackoff: boolean;
          retrycount: number;
          retrydelay: number;
          retrylimit: number;
          singletonkey?: string | null;
          singletonon?: string | null;
          startafter: string;
          startedon?: string | null;
          state: Database['public']['Enums']['job_state'];
        };
        Update: {
          archivedon?: string;
          completedon?: string | null;
          createdon?: string;
          data?: Json | null;
          expirein?: unknown;
          id?: string;
          keepuntil?: string;
          name?: string;
          on_complete?: boolean;
          output?: Json | null;
          priority?: number;
          retrybackoff?: boolean;
          retrycount?: number;
          retrydelay?: number;
          retrylimit?: number;
          singletonkey?: string | null;
          singletonon?: string | null;
          startafter?: string;
          startedon?: string | null;
          state?: Database['public']['Enums']['job_state'];
        };
      };
      character_relationships: {
        Row: {
          character_id: string;
          created_at: string;
          description_of_interactions: string;
          id: string;
          related_character_id: string;
          relationship_type: string;
          updated_at: string;
        };
        Insert: {
          character_id: string;
          created_at?: string;
          description_of_interactions: string;
          id?: string;
          related_character_id: string;
          relationship_type: string;
          updated_at?: string;
        };
        Update: {
          character_id?: string;
          created_at?: string;
          description_of_interactions?: string;
          id?: string;
          related_character_id?: string;
          relationship_type?: string;
          updated_at?: string;
        };
      };
      characters: {
        Row: {
          backstory: string;
          created_at: string;
          first_name: string;
          id: string;
          last_name: string;
          personality: string;
          rust_npc_type: string;
          title: string | null;
          updated_at: string;
          writing_style: string;
        };
        Insert: {
          backstory: string;
          created_at?: string;
          first_name: string;
          id?: string;
          last_name: string;
          personality: string;
          rust_npc_type: string;
          title?: string | null;
          updated_at?: string;
          writing_style: string;
        };
        Update: {
          backstory?: string;
          created_at?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          personality?: string;
          rust_npc_type?: string;
          title?: string | null;
          updated_at?: string;
          writing_style?: string;
        };
      };
      job: {
        Row: {
          completedon: string | null;
          createdon: string;
          data: Json | null;
          expirein: unknown;
          id: string;
          keepuntil: string;
          name: string;
          on_complete: boolean;
          output: Json | null;
          priority: number;
          retrybackoff: boolean;
          retrycount: number;
          retrydelay: number;
          retrylimit: number;
          singletonkey: string | null;
          singletonon: string | null;
          startafter: string;
          startedon: string | null;
          state: Database['public']['Enums']['job_state'];
        };
        Insert: {
          completedon?: string | null;
          createdon?: string;
          data?: Json | null;
          expirein?: unknown;
          id?: string;
          keepuntil?: string;
          name: string;
          on_complete?: boolean;
          output?: Json | null;
          priority?: number;
          retrybackoff?: boolean;
          retrycount?: number;
          retrydelay?: number;
          retrylimit?: number;
          singletonkey?: string | null;
          singletonon?: string | null;
          startafter?: string;
          startedon?: string | null;
          state?: Database['public']['Enums']['job_state'];
        };
        Update: {
          completedon?: string | null;
          createdon?: string;
          data?: Json | null;
          expirein?: unknown;
          id?: string;
          keepuntil?: string;
          name?: string;
          on_complete?: boolean;
          output?: Json | null;
          priority?: number;
          retrybackoff?: boolean;
          retrycount?: number;
          retrydelay?: number;
          retrylimit?: number;
          singletonkey?: string | null;
          singletonon?: string | null;
          startafter?: string;
          startedon?: string | null;
          state?: Database['public']['Enums']['job_state'];
        };
      };
      schedule: {
        Row: {
          created_on: string;
          cron: string;
          data: Json | null;
          name: string;
          options: Json | null;
          timezone: string | null;
          updated_on: string;
        };
        Insert: {
          created_on?: string;
          cron: string;
          data?: Json | null;
          name: string;
          options?: Json | null;
          timezone?: string | null;
          updated_on?: string;
        };
        Update: {
          created_on?: string;
          cron?: string;
          data?: Json | null;
          name?: string;
          options?: Json | null;
          timezone?: string | null;
          updated_on?: string;
        };
      };
      subscription: {
        Row: {
          created_on: string;
          event: string;
          name: string;
          updated_on: string;
        };
        Insert: {
          created_on?: string;
          event: string;
          name: string;
          updated_on?: string;
        };
        Update: {
          created_on?: string;
          event?: string;
          name?: string;
          updated_on?: string;
        };
      };
      version: {
        Row: {
          cron_on: string | null;
          maintained_on: string | null;
          version: number;
        };
        Insert: {
          cron_on?: string | null;
          maintained_on?: string | null;
          version: number;
        };
        Update: {
          cron_on?: string | null;
          maintained_on?: string | null;
          version?: number;
        };
      };
    };
    Views: {
      users: {
        Row: {
          email: string | null;
          id: string | null;
        };
        Insert: {
          email?: string | null;
          id?: string | null;
        };
        Update: {
          email?: string | null;
          id?: string | null;
        };
      };
    };
    Functions: {
      related_characters: {
        Args: {
          p_character_id: string;
        };
        Returns: {
          id: string;
          rust_npc_type: string;
          first_name: string;
          last_name: string;
          title: string;
          backstory: string;
          personality: string;
          writing_style: string;
          created_at: string;
          updated_at: string;
          relationship_type: string;
          description_of_interactions: string;
        }[];
      };
    };
    Enums: {
      job_state: 'created' | 'retry' | 'active' | 'completed' | 'expired' | 'cancelled' | 'failed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          owner: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          name: string;
          owner?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          owner?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: string[];
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
