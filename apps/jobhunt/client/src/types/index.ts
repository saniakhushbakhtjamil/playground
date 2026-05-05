export type JobStatus = "saved" | "applying" | "applied" | "interview" | "offer" | "closed";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  job_type: string;
  salary_range: string;
  posted_date: string;
  source: string;
  apply_type: string;
  apply_url: string;
  status: JobStatus;
  match_score: number | null;
  match_reasons: string[];
  red_flags: string[];
  recommendation: string;
  notes: string;
  applied_at: string | null;
  found_at: string;
  updated_at: string;
}

export type DocumentType = "cv" | "cover_letter" | "email" | "other";

export interface JobDocument {
  id: string;
  job_id: string | null;
  type: DocumentType;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CvVersion {
  id: string;
  name: string;
  content: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  total: number;
  byStatus: Partial<Record<JobStatus, number>>;
  avgMatchScore: number | null;
  recentActivity: Pick<Job, "id" | "title" | "company" | "status" | "updated_at">[];
}
