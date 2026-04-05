import { useState } from "react";
import { Button, Card, Modal } from "../../../components/ui";

interface Datafile {
  id: number;
  riverName: string;
  date: string;
}

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
    <div>
      <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
        <h1 className="text-[2rem] font-bold text-primary m-0 tracking-[-0.3px]">
          Manage Existing Datafiles
        </h1>

        {/* Search bar */}
        <div className="flex items-center gap-2 bg-white border-[1.5px] border-black/10 rounded-lg px-3.5 py-2 min-w-[220px] transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_rgba(26,158,122,0.1)]">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16} className="text-text-light shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search datafiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none outline-none text-[0.875rem] text-text-dark bg-transparent flex-1 min-w-0 placeholder:text-text-light"
          />
          {search && (
            <button
              className="bg-transparent border-none cursor-pointer text-text-light text-[0.75rem] p-0 leading-none transition-colors duration-150 hover:text-[#4b5563]"
              onClick={() => setSearch("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <Card className="p-6 min-h-[200px]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-muted text-[0.9rem]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={32} height={32} className="opacity-40">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p className="m-0">No datafiles found{search ? ` for "${search}"` : ""}.</p>
          </div>
        ) : (
          <ul className="list-none m-0 p-0 flex flex-col gap-3">
            {filtered.map((file, index) => (
              <li
                key={file.id}
                className="flex items-center bg-[#f5fbf8] border-[1.5px] border-accent/20 rounded-[10px] overflow-hidden transition-[box-shadow,transform] duration-150 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-px animate-row-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="w-[5px] self-stretch bg-accent shrink-0" />
                <div className="flex-1 px-5 py-[18px] flex flex-col gap-1">
                  <span className="text-[1rem] font-semibold text-primary">{file.riverName}</span>
                  <span className="text-[0.8rem] text-text-muted">{file.date}</span>
                </div>
                <div className="flex gap-1 px-4">
                  <button
                    className="flex items-center justify-center w-9 h-9 rounded-lg border-none cursor-pointer transition-[background,color] duration-150 bg-transparent text-[#4b5563] hover:bg-accent/10 hover:text-accent"
                    onClick={() => openEdit(file)}
                    aria-label={`Edit ${file.riverName}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={18} height={18}>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="flex items-center justify-center w-9 h-9 rounded-lg border-none cursor-pointer transition-[background,color] duration-150 bg-transparent text-text-light hover:bg-danger/[0.08] hover:text-danger"
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
      </Card>

      {/* DELETE MODAL */}
      {modalMode === "delete" && selected && (
        <Modal
          title="Delete Datafile"
          onClose={closeModal}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </>
          }
        >
          <div className="flex justify-center text-[#f59e0b] mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} width={28} height={28}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p className="text-center text-[0.9rem] text-[#374151] m-0 leading-relaxed">
            Are you sure you want to delete <strong>{selected.riverName}</strong>?
            <br />
            <span className="text-[0.8rem] text-text-light">This action cannot be undone.</span>
          </p>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {modalMode === "edit" && selected && (
        <Modal
          title="Edit Datafile"
          onClose={closeModal}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Save
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-semibold text-text-dark">River Name</label>
              <input
                className="px-3.5 py-[10px] bg-white border-[1.5px] border-black/10 rounded-lg text-[0.9rem] text-text-dark outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:shadow-[0_0_0_3px_rgba(26,158,122,0.1)]"
                value={editValues.riverName}
                onChange={(e) => setEditValues((v) => ({ ...v, riverName: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.85rem] font-semibold text-text-dark">Date</label>
              <input
                type="date"
                className="px-3.5 py-[10px] bg-white border-[1.5px] border-black/10 rounded-lg text-[0.9rem] text-text-dark outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent focus:shadow-[0_0_0_3px_rgba(26,158,122,0.1)]"
                value={editValues.date}
                onChange={(e) => setEditValues((v) => ({ ...v, date: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
