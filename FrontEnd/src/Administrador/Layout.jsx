import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const modules = [
  'user','funcao','redefinicaosenha','configuracaousuario','torneio','noticia','pergunta','questaomatematica','questoes_programacao','questaoingles','tentativateste','ticketsuporte','participante_torneio','notificacao','conquista','conquistausuario'
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">COMAES — Painel Administrativo</h1>
          <div>
            <Link to="/" className="bg-white text-blue-600 px-3 py-1 rounded">Voltar</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-6 gap-6">
        <nav className="md:col-span-1 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Módulos</h3>
          <ul className="space-y-1">
            {modules.map(m => (
              <li key={m}><Link to={`/administrador/${m}`} className="text-sm text-blue-600 hover:underline">{m}</Link></li>
            ))}
          </ul>
        </nav>

        <main className="md:col-span-5 bg-white p-4 rounded shadow">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
