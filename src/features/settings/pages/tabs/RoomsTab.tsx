import { useState } from "react";
import { Plus } from "lucide-react";
import { RowActions } from "../../../../components/ui/RowActions";
import { ViewDrawer } from "../../../../components/ui/ViewDrawer";
import { EditModal  } from "../../../../components/ui/EditModal";
import { Pagination } from "../../../../components/ui/Pagination";

const INITIAL_ROOMS = [
  { id:"1", name:"Room 101",    type:"Classroom",    capacity:40, floor:"1st" },
  { id:"2", name:"Lab 1",       type:"Laboratory",   capacity:28, floor:"1st" },
  { id:"3", name:"Room 204",    type:"Classroom",    capacity:35, floor:"2nd" },
  { id:"4", name:"Computer Lab",type:"Computer Lab", capacity:30, floor:"2nd" },
  { id:"5", name:"Library",     type:"Library",      capacity:60, floor:"GF"  },
];
const ROOM_TYPES = ["Classroom","Laboratory","Computer Lab","Library","Auditorium","Staff Room","Office","Other"];

export function RoomsTab() {
  const [rooms,    setRooms]    = useState(INITIAL_ROOMS);
  const [modal,    setModal]    = useState(false);
  const [viewItem, setViewItem] = useState<any|null>(null);
  const [editItem, setEditItem] = useState<any|null>(null);
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form,     setForm]     = useState({ name:"", type:"Classroom", capacity:"40", floor:"1st" });

  const paged = rooms.slice((page-1)*pageSize, page*pageSize);

  function save() {
    if (!form.name) return;
    setRooms(p => [...p, { id:String(Date.now()), ...form, capacity:Number(form.capacity) }]);
    setModal(false);
    setForm({ name:"", type:"Classroom", capacity:"40", floor:"1st" });
  }

  return (
    <>
      <div className="surface">
        <div className="surface-head">
          <div><h3>Rooms &amp; Facilities</h3><p>Classrooms, labs, and other facilities</p></div>
          <button className="primary" onClick={() => setModal(true)}>
            <Plus size={14}/> Add room
          </button>
        </div>

        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Room name</th>
                <th>Type</th>
                <th style={{ textAlign:"center" }}>Capacity</th>
                <th>Floor</th>
                <th style={{ textAlign:"right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>No rooms yet. Add one above.</td></tr>
              ) : paged.map((r, idx) => (
                <tr key={r.id}>
                  <td style={{ color:"var(--muted-2)", fontSize:11 }}>{(page-1)*pageSize+idx+1}</td>
                  <td><b style={{ fontSize:13 }}>{r.name}</b></td>
                  <td><span className="status-pill info" style={{ fontSize:10 }}>{r.type}</span></td>
                  <td style={{ textAlign:"center" }}><b>{r.capacity}</b></td>
                  <td style={{ fontSize:12 }}>{r.floor}</td>
                  <td style={{ textAlign:"right" }}>
                    <RowActions
                      onView={() => setViewItem(r)}
                      onEdit={() => setEditItem(r)}
                      onDelete={() => setRooms(p => p.filter(x => x.id !== r.id))}
                      deleteLabel="room"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={rooms.length}
          onPage={setPage} onPageSize={ps => { setPageSize(ps); setPage(1); }} label="rooms" />
      </div>

      {/* Create modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="modal-card" style={{ width:"min(420px,96vw)" }}>
            <div className="modal-head">
              <h2>Add room</h2>
              <button className="icon-button" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide">
                <span>Room name *</span>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Room 301, Physics Lab"/>
              </label>
              <label className="human-field">
                <span>Type</span>
                <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}>
                  {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="human-field">
                <span>Capacity</span>
                <input type="number" value={form.capacity} onChange={e => setForm(p=>({...p,capacity:e.target.value}))} placeholder="40"/>
              </label>
              <label className="human-field">
                <span>Floor</span>
                <input value={form.floor} onChange={e => setForm(p=>({...p,floor:e.target.value}))} placeholder="e.g. Ground, 1st, 2nd"/>
              </label>
            </div></div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={!form.name}>Add room</button>
            </div>
          </div>
        </div>
      )}

      {/* View drawer */}
      {viewItem && (
        <ViewDrawer title="Room" item={viewItem}
          onClose={() => setViewItem(null)}
          onEdit={() => { setEditItem(viewItem); setViewItem(null); }}
          fields={[
            { key:"name",     label:"Room name", wide:true },
            { key:"type",     label:"Type" },
            { key:"capacity", label:"Capacity" },
            { key:"floor",    label:"Floor" },
          ]}
        />
      )}

      {/* Edit modal */}
      {editItem && (
        <EditModal title="Room" item={editItem}
          onClose={() => setEditItem(null)}
          onSave={async data => {
            setRooms(p => p.map(x => x.id === editItem.id ? { ...x, ...data } : x));
          }}
          fields={[
            { key:"name",     label:"Room name", required:true, wide:true },
            { key:"type",     label:"Type", type:"select", options: ROOM_TYPES.map(v => ({ value:v, label:v })) },
            { key:"capacity", label:"Capacity", type:"number" },
            { key:"floor",    label:"Floor" },
          ]}
        />
      )}
    </>
  );
}
