import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, lastPage, total, onPage }) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <p className="text-gray-500 text-sm">
        Página <span className="font-bold text-gray-800">{page}</span> de{' '}
        <span className="font-bold text-gray-800">{lastPage}</span>
        {total != null && (
          <> &mdash; <span className="font-bold text-gray-800">{total}</span> registros</>
        )}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 rounded text-sm font-bold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= lastPage}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-700 rounded text-sm font-bold transition-colors"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
