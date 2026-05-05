import { useEffect, useState } from "react";
import { getDocuments, getCvVersions, createDocument, deleteDocument, createCvVersion, deleteCvVersion } from "../api";
import type { JobDocument, CvVersion, DocumentType } from "../types";
import { Plus, Trash2, X, FileText, Mail, File } from "lucide-react";

const TYPE_ICONS: Record<DocumentType, React.ElementType> = {
  cv: FileText,
  cover_letter: File,
  email: Mail,
  other: File,
};

const TYPE_LABELS: Record<DocumentType, string> = {
  cv: "CV",
  cover_letter: "Cover Letter",
  email: "Email",
  other: "Other",
};

function DocCard({ doc, onDelete }: { doc: JobDocument | CvVersion; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const type = "type" in doc ? doc.type as DocumentType : "cv";
  const Icon = TYPE_ICONS[type];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-800/50"
        onClick={() => setExpanded((e) => !e)}
      >
        <Icon size={15} className="text-violet-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{"name" in doc ? doc.name : doc.title}</p>
          <p className="text-xs text-zinc-500">
            {"type" in doc ? TYPE_LABELS[doc.type as DocumentType] : "CV"} ·{" "}
            {new Date(doc.created_at).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-zinc-600 hover:text-red-400 p-1 rounded"
        >
          <Trash2 size={13} />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-zinc-800 p-3">
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
            {doc.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function AddDocModal({ onClose, onAdd }: { onClose: () => void; onAdd: (doc: JobDocument) => void }) {
  const [form, setForm] = useState({ type: "cover_letter" as DocumentType, title: "", content: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const doc = await createDocument(form);
      onAdd(doc);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="font-semibold text-zinc-100">New Document</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as DocumentType }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
            >
              {(Object.keys(TYPE_LABELS) as DocumentType[]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Content</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Document"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddCvModal({ onClose, onAdd }: { onClose: () => void; onAdd: (cv: CvVersion) => void }) {
  const [form, setForm] = useState({ name: "", content: "", is_default: 0 });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cv = await createCvVersion(form);
      onAdd(cv);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="font-semibold text-zinc-100">New CV Version</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Name (e.g. "PM Focused")</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Content (paste your CV text)</label>
            <textarea
              required
              rows={10}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 font-mono"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default === 1}
              onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked ? 1 : 0 }))}
              className="accent-violet-500"
            />
            Set as default CV
          </label>
          <button
            type="submit"
            disabled={saving}
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save CV"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Docs() {
  const [docs, setDocs] = useState<JobDocument[]>([]);
  const [cvs, setCvs] = useState<CvVersion[]>([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showAddCv, setShowAddCv] = useState(false);

  useEffect(() => {
    getDocuments().then(setDocs).catch(console.error);
    getCvVersions().then(setCvs).catch(console.error);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-1">Docs</h1>
      <p className="text-sm text-zinc-500 mb-8">Your CVs, cover letters, and emails in one place.</p>

      {/* CV Versions */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">CV Versions</h2>
          <button
            onClick={() => setShowAddCv(true)}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} /> New CV
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {cvs.length === 0 && <p className="text-sm text-zinc-600">No CV versions yet.</p>}
          {cvs.map((cv) => (
            <div key={cv.id} className="relative">
              {cv.is_default === 1 && (
                <span className="absolute top-3 right-10 text-xs text-emerald-400 font-medium">default</span>
              )}
              <DocCard
                doc={{ ...cv, type: "cv" as DocumentType, title: cv.name, job_id: null }}
                onDelete={async () => {
                  await deleteCvVersion(cv.id);
                  setCvs((prev) => prev.filter((c) => c.id !== cv.id));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* General Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Documents</h2>
          <button
            onClick={() => setShowAddDoc(true)}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 border border-violet-800 hover:border-violet-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} /> New Doc
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {docs.length === 0 && <p className="text-sm text-zinc-600">No documents yet.</p>}
          {docs.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onDelete={async () => {
                await deleteDocument(doc.id);
                setDocs((prev) => prev.filter((d) => d.id !== doc.id));
              }}
            />
          ))}
        </div>
      </div>

      {showAddDoc && (
        <AddDocModal onClose={() => setShowAddDoc(false)} onAdd={(d) => setDocs((prev) => [d, ...prev])} />
      )}
      {showAddCv && (
        <AddCvModal onClose={() => setShowAddCv(false)} onAdd={(cv) => setCvs((prev) => [cv, ...prev])} />
      )}
    </div>
  );
}
