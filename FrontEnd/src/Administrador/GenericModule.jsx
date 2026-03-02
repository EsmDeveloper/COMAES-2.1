import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GenericModule = ({ modelKey: propModelKey, displayName: propDisplayName }) => {
  const params = useParams();
  const modelKey = propModelKey || params.module;
  const displayName = propDisplayName || modelKey;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [schema, setSchema] = useState([]);
  const [formState, setFormState] = useState({});
  const { token: authToken } = useAuth();
  // fallback to localStorage
  let storedToken = authToken || null;
  try { if (!storedToken) storedToken = localStorage.getItem('comaes_token'); } catch(e) { storedToken = null; }
  const apiBase = `/api/admin/${modelKey}`;
  const authHeaders = storedToken ? { Authorization: `Bearer ${storedToken}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiBase, { headers: authHeaders });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchSchema = async () => {
    try {
      const res = await fetch(`${apiBase}/schema`, { headers: authHeaders });
      const s = await res.json();
      setSchema(Array.isArray(s) ? s : []);
      // initialize formState with defaults
      const initial = {};
      s.forEach(f => { if (!f.primaryKey) initial[f.name] = f.defaultValue ?? ''; });
      setFormState(initial);
    } catch (e) { console.error('schema fetch', e); }
  };

  useEffect(() => { fetchItems(); fetchSchema(); }, [modelKey]);

  const createItem = async () => {
    try {
      await fetch(apiBase, { method: 'POST', headers: authHeaders, body: JSON.stringify(formState) });
      setFormState(schema.reduce((acc,f)=> { if (!f.primaryKey) acc[f.name]=''; return acc; }, {}));
      fetchItems();
    } catch (e) { console.error(e); alert('Erro ao criar'); }
  };

  const updateItem = async () => {
    if (!selected) return alert('Selecione um registro');
    try {
      await fetch(`${apiBase}/${selected.id}`, { method: 'PUT', headers: authHeaders, body: JSON.stringify(formState) });
      setSelected(null);
      setFormState(schema.reduce((acc,f)=> { if (!f.primaryKey) acc[f.name]=''; return acc; }, {}));
      fetchItems();
    } catch (e) { console.error(e); alert('Erro ao atualizar'); }
  };

  const deleteItem = async (id) => {
    if (!confirm('Tem a certeza que pretende apagar?')) return;
    await fetch(`${apiBase}/${id}`, { method: 'DELETE', headers: authHeaders });
    fetchItems();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">{displayName} — Painel</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Tabela — {displayName}</h3>
          {loading ? <p>Carregando...</p> : (
            <div className="overflow-auto max-h-96">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {schema.length === 0 ? (
                      <>
                        <th className="p-2 text-left">ID</th>
                        <th className="p-2 text-left">Resumo</th>
                      </>
                    ) : (
                      schema.map(f => <th key={f.name} className="p-2 text-left">{f.name}</th>)
                    )}
                    <th className="p-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(it => (
                    <tr key={it.id} className="border-b">
                      {schema.length === 0 ? (
                        <>
                          <td className="p-2">{it.id}</td>
                          <td className="p-2 truncate max-w-md">{JSON.stringify(it).slice(0, 120)}</td>
                        </>
                      ) : (
                        schema.map(f => (
                          <td key={f.name} className="p-2 truncate max-w-[220px]">{typeof it[f.name] === 'object' ? JSON.stringify(it[f.name]) : String(it[f.name] ?? '')}</td>
                        ))
                      )}
                      <td className="p-2">
                        <button onClick={() => { setSelected(it); const s = {};
                          schema.forEach(f => { if (!f.primaryKey) s[f.name] = it[f.name] ?? ''; }); setFormState(s);
                        }} className="mr-2 text-blue-600">Editar</button>
                        <button onClick={() => deleteItem(it.id)} className="text-red-600">Apagar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Dashboard — Métricas</h3>
          <p>Total de registos: <strong>{items.length}</strong></p>
          <p>Último carregamento: <small>{new Date().toLocaleString()}</small></p>
          <div className="mt-4">
            <h4 className="font-semibold mb-1">Adicionar / Editar Registo</h4>
            {schema.length === 0 ? (
              <p>Sem esquema disponível.</p>
            ) : (
              <form onSubmit={e => { e.preventDefault(); selected ? updateItem() : createItem(); }} className="space-y-2">
                {schema.filter(f => !f.primaryKey).map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium mb-1">{f.name}</label>
                    {f.enumValues ? (
                      <select value={formState[f.name] ?? ''} onChange={e => setFormState({...formState, [f.name]: e.target.value })} className="w-full p-2 border rounded">
                        <option value="">--</option>
                        {f.enumValues.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : f.type && /BOOLEAN/i.test(f.type) ? (
                      <input type="checkbox" checked={!!formState[f.name]} onChange={e => setFormState({...formState, [f.name]: e.target.checked })} />
                    ) : f.type && /INT|DECIMAL|FLOAT|DOUBLE/i.test(f.type) ? (
                      <input type="number" value={formState[f.name] ?? ''} onChange={e => setFormState({...formState, [f.name]: e.target.value })} className="w-full p-2 border rounded" />
                    ) : f.type && /DATE|TIME/i.test(f.type) ? (
                      <input type="date" value={formState[f.name] ?? ''} onChange={e => setFormState({...formState, [f.name]: e.target.value })} className="w-full p-2 border rounded" />
                    ) : (
                      <input type="text" value={formState[f.name] ?? ''} onChange={e => setFormState({...formState, [f.name]: e.target.value })} className="w-full p-2 border rounded" />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">{selected ? 'Atualizar' : 'Criar'}</button>
                  <button type="button" onClick={() => { setSelected(null); setFormState(schema.reduce((acc,f)=> { if (!f.primaryKey) acc[f.name]=''; return acc; }, {})); }} className="px-3 py-1 bg-gray-200 rounded">Limpar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericModule;
