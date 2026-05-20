import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const Database = () => {
  const [schema, setSchema] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rows, setRows] = useState([]);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState(null);

  const activeTable = useMemo(
    () => schema.find((table) => table.name === selectedTable),
    [schema, selectedTable],
  );

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await api.get('/schema');
        const tables = response.data.tables || [];
        setSchema(tables);
        setSelectedTable(tables[0]?.name || '');
      } catch (err) {
        console.error('Schema error:', err);
        setError('No se pudo leer el esquema de learning_cads_react.');
      } finally {
        setLoadingSchema(false);
      }
    };

    fetchSchema();
  }, []);

  useEffect(() => {
    if (!selectedTable) return;

    const fetchRows = async () => {
      setLoadingRows(true);
      try {
        const response = await api.get(`/tables/${encodeURIComponent(selectedTable)}`);
        setRows(response.data.rows || []);
      } catch (err) {
        console.error('Table rows error:', err);
        setRows([]);
      } finally {
        setLoadingRows(false);
      }
    };

    fetchRows();
  }, [selectedTable]);

  if (loadingSchema) return <div className="p-8 text-center animate-pulse">Leyendo tablas y atributos...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl m-4 border border-red-100">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Base de datos learning_cads_react</h1>
        <p className="text-slate-500">Tablas, atributos y registros leidos directamente desde MySQL.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">Tablas</h2>
          <div className="space-y-2">
            {schema.map((table) => (
              <button
                key={table.name}
                type="button"
                onClick={() => setSelectedTable(table.name)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedTable === table.name ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-indigo-50'
                }`}
              >
                {table.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6 min-w-0">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">Atributos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b">
                    <th className="py-2 pr-4">Campo</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Nulo</th>
                    <th className="py-2 pr-4">Llave</th>
                    <th className="py-2 pr-4">Default</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTable?.columns || []).map((column) => (
                    <tr key={column.name} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-bold text-slate-700">{column.name}</td>
                      <td className="py-2 pr-4 text-slate-500">{column.type}</td>
                      <td className="py-2 pr-4 text-slate-500">{column.nullable ? 'Si' : 'No'}</td>
                      <td className="py-2 pr-4 text-slate-500">{column.key || '-'}</td>
                      <td className="py-2 pr-4 text-slate-500">{String(column.defaultValue ?? '-')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-3">Registros</h2>
            {loadingRows ? (
              <div className="py-8 text-center text-slate-400 animate-pulse">Cargando registros...</div>
            ) : rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400 border-b">
                      {Object.keys(rows[0]).map((key) => (
                        <th key={key} className="py-2 pr-4 whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b last:border-0">
                        {Object.entries(row).map(([key, value]) => (
                          <td key={key} className="py-2 pr-4 max-w-64 truncate text-slate-600">
                            {formatValue(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">Sin registros para mostrar.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const formatValue = (value) => {
  if (value === null || value === undefined) return '-';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export default Database;
