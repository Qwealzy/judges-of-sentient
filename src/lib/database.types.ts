// src/lib/database.types.ts
export type Json =
  | string | number | boolean | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      pledges: {
        Row: {
          id: string;
          created_at: string;
          username: string;
          profile_image_url: string;
          description: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          username: string;
          profile_image_url: string;
          description: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          username?: string;
          profile_image_url?: string;
          description?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
