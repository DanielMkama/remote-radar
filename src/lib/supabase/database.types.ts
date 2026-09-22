/**
 * Hand-written types for the Supabase `jobs` table, matching
 * supabase/schema.sql. Regenerate/replace with `supabase gen types
 * typescript` once a real project is linked, if preferred.
 */

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string;
          external_id: string;
          source: string;
          title: string;
          company: string;
          company_logo: string | null;
          url: string;
          description: string | null;
          location: string | null;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string | null;
          salary_period: string | null;
          job_type: string | null;
          category: string | null;
          tags: string[] | null;
          posted_at: string | null;
          collected_at: string;
          match_score: number | null;
          is_worldwide: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_id: string;
          source: string;
          title: string;
          company: string;
          company_logo?: string | null;
          url: string;
          description?: string | null;
          location?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string | null;
          salary_period?: string | null;
          job_type?: string | null;
          category?: string | null;
          tags?: string[] | null;
          posted_at?: string | null;
          collected_at?: string;
          match_score?: number | null;
          is_worldwide?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_id?: string;
          source?: string;
          title?: string;
          company?: string;
          company_logo?: string | null;
          url?: string;
          description?: string | null;
          location?: string | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string | null;
          salary_period?: string | null;
          job_type?: string | null;
          category?: string | null;
          tags?: string[] | null;
          posted_at?: string | null;
          collected_at?: string;
          match_score?: number | null;
          is_worldwide?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
