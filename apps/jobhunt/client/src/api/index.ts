import type { Job, JobStatus, JobDocument, DocumentType, CvVersion, Stats, Heatmap } from "../types";

const BASE = "/api";

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Jobs
export const getJobs = () => req<Job[]>("/jobs");
export const getJob = (id: string) => req<Job>(`/jobs/${id}`);
export const createJob = (data: Partial<Job>) =>
  req<Job>("/jobs", { method: "POST", body: JSON.stringify(data) });
export const updateJobStatus = (id: string, status: JobStatus) =>
  req<Job>(`/jobs/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const updateJob = (id: string, data: Partial<Job>) =>
  req<Job>(`/jobs/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteJob = (id: string) =>
  req<void>(`/jobs/${id}`, { method: "DELETE" });

// Documents
export const getDocuments = (job_id?: string) =>
  req<JobDocument[]>(`/documents${job_id ? `?job_id=${job_id}` : ""}`);
export const createDocument = (data: { job_id?: string; type: DocumentType; title: string; content: string }) =>
  req<JobDocument>("/documents", { method: "POST", body: JSON.stringify(data) });
export const updateDocument = (id: string, data: Partial<JobDocument>) =>
  req<JobDocument>(`/documents/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteDocument = (id: string) =>
  req<void>(`/documents/${id}`, { method: "DELETE" });

// CV Versions
export const getCvVersions = () => req<CvVersion[]>("/cv-versions");
export const createCvVersion = (data: Partial<CvVersion>) =>
  req<CvVersion>("/cv-versions", { method: "POST", body: JSON.stringify(data) });
export const updateCvVersion = (id: string, data: Partial<CvVersion>) =>
  req<CvVersion>(`/cv-versions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteCvVersion = (id: string) =>
  req<void>(`/cv-versions/${id}`, { method: "DELETE" });

// Stats
export const getStats = () => req<Stats>("/stats");
export const getHeatmap = (days = 90) => req<Heatmap>(`/stats/heatmap?days=${days}`);
