import { useState } from "react";
import "./ManageDatafiles.css";

interface Datafile {
  id: number;
  riverName: string;
  date: string;
}

// Mock data — replace with API fetch later
const MOCK_DATAFILES: Datafile[] = [
  { id: 1, riverName: "Apies River", date: "02/03/2024" },
  { id: 2, riverName: "Hennops River", date: "02/03/2024" },
  { id: 3, riverName: "Crocodile River", date: "02/03/2024" },
];

type ModalMode = "edit" | "delete" | null;

export default function ManageDatafiles() {
  const [datafiles, setDatafiles] = useState<Datafile[]>(MOCK_DATAFILES);
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Datafile | null>(null);
  const [editValues, setEditValues] = useState({ riverName: "", date: "" });

  const filtered = datafiles.filter((d) =>
    d.riverName.toLowerCase().includes(search.toLowerCase())
  );

  // ── Open modals ───────────────────────────────────────
  const openEdit = (file: Datafile) => {
    setSelected(file);
    setEditValues({ riverName: file.riverName, date: file.date });
    setModalMode("edit");
  };

  const openDelete = (file: Datafile) => {
    setSelected(file);
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
  };

  // ── Actions ───────────────────────────────────────────
  const handleSaveEdit = () => {
    if (!editValues.riverName || !editValues.date) return;
    setDatafiles((prev) =>
      prev.map((d) =>
        d.id === selected?.id
          ? { ...d, riverName: editValues.riverName, date: editValues.date }
          : d
      )
    );
    // TODO: PATCH /api/datafiles/:id
    closeModal();
  };

  const handleDelete = () => {
    setDatafiles((prev) => prev.filter((d) => d.id !== selected?.id));
    // TODO: DELETE /api/datafiles/:id
    closeModal();
  };

  return (
    <div className="manage-page">
      <div className="manage-page__header">
        <h1 className="manage-page__title">Manage Existing Datafiles</h1>

        {/* Search bar */}
        <div className="manage-search">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search datafiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="manage-search__input"
          />
          {search && (
            <button className="manage-search__clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>
      </div>

      <div className="manage-card">
        {filtered.length === 0 ? (
          <div className="manage-empty">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={32} height={32}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p>No datafiles found{search ? ` for "${search}"` : ""}.</p>
          </div>
        ) : (
          <ul className="manage-list">
            {filtered.map((file, index) => (
              <li
                key={file.id}
                className="manage-row"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="manage-row__accent" />
                <div className="manage-row__info">
                  <span className="manage-row__name">{file.riverName}</span>
                  <span className="manage-row__date">{file.date}</span>
                </div>
                <div className="manage-row__actions">
                  <button
                    className="manage-row__btn manage-row__btn--edit"
                    onClick={() => openEdit(file)}
                    aria-label={`Edit ${file.riverName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="manage-row__btn manage-row__btn--delete"
                    onClick={() => openDelete(file)}
                    aria-label={`Delete ${file.riverName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── DELETE MODAL ──────────────────────────────── */}
      {modalMode === "delete" && selected && (
        <div className="manage-modal-overlay" onClick={closeModal}>
          <div className="manage-modal manage-modal--danger" onClick={(e) => e.stopPropagation()}>
            <div className="manage-modal__header">
              <h2 className="manage-modal__title">Delete Datafile</h2>
              <button className="manage-modal__close" onClick={closeModal}>✕</button>
            </div>

            <div className="manage-modal__body">
              <div className="manage-modal__warning-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={28} height={28}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <p className="manage-modal__warning-text">
                Are you sure you want to delete <strong>{selected.riverName}</strong>?
                <br />
                <span>This action cannot be undone.</span>
              </p>
            </div>

            <div className="manage-modal__footer">
              <button className="manage-modal__btn manage-modal__btn--secondary" onClick={closeModal}>
                Cancel
              </button>
              <button className="manage-modal__btn manage-modal__btn--delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}