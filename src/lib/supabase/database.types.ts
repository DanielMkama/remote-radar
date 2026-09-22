/**
 * Hand-written types for the Supabase tables, matching supabase/schema.sql.
 * Regenerate/replace with `supabase gen types typescript` once a real
 * project is linked, if preferred.
 */

export interface OpportunityRow {
  id: string;
  opportunity_type: string;
  title: string;
  company: string;
  company_url: string | null;
  description: string;
  url: string;
  source: string;
  source_url: string;
  source_id: string | null;
  employment_type: string;
  employment_types: string[];
  location_text: string | null;
  location_status: string;
  salary_text: string | null;
  salary_currency: string | null;
  salary_period: string | null;
  salary_min: number | null;
  salary_max: number | null;
  normalized_monthly_min: number | null;
  normalized_monthly_max: number | null;
  salary_status: string;
  category: string;
  tags: string[];
  posted_at: string | null;
  discovered_at: string;
  deadline: string | null;
  application_url: string;
  raw_source_data: unknown;
  verification_status: string;
  freshness: string;
  duplicate_fingerprint: string;
  created_at: string;
  updated_at: string;
}

export type OpportunityInsert = Omit<OpportunityRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
};

export interface OpportunitySourceRow {
  id: string;
  opportunity_id: string;
  source: string;
  source_id: string | null;
  source_url: string;
  discovered_at: string;
}

export type OpportunitySourceInsert = Omit<OpportunitySourceRow, "id"> & { id?: string };

export interface SourceRunRow {
  id: string;
  source: string;
  status: "ok" | "error";
  started_at: string;
  finished_at: string;
  fetched_count: number;
  design_count: number;
  worldwide_count: number;
  in_range_count: number;
  new_count: number;
  updated_count: number;
  duplicate_count: number;
  error_message: string | null;
  created_at: string;
}

export type SourceRunInsert = Omit<SourceRunRow, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

// supabase-js's generics (GenericTable / GenericSchema, from
// @supabase/postgrest-js) require every table to carry `Relationships`
// and every schema to carry `Views`/`Functions`, even when unused — omit
// them and query results silently collapse to `never` instead of erroring
// clearly. `[]`/`{}` are correct here: this schema has no foreign-key
// relationships, views, or Postgres functions declared.
type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      opportunities: {
        Row: OpportunityRow;
        Insert: OpportunityInsert;
        Update: Partial<OpportunityInsert>;
      } & NoRelationships;
      opportunity_sources: {
        Row: OpportunitySourceRow;
        Insert: OpportunitySourceInsert;
        Update: Partial<OpportunitySourceInsert>;
      } & NoRelationships;
      source_runs: {
        Row: SourceRunRow;
        Insert: SourceRunInsert;
        Update: Partial<SourceRunInsert>;
      } & NoRelationships;
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
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
