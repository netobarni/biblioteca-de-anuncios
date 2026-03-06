'use client';

import { useState } from 'react';

interface Ad {
  id: string;
  page_name: string;
  ad_snapshot_url: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_titles?: string[];
}

interface SearchResult {
  ads: Ad[];
  searchTerms: string;
  totalFound: number;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!caption.trim()) {
      setError('Cole a legenda do post para buscar');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar anuncios');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Biblioteca de Anuncios
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Descubra se um post esta sendo anunciado na Meta
        </p>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Link do Post (opcional)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/... ou https://www.facebook.com/..."
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Legenda do Post *
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Cole aqui a legenda do post que voce quer verificar..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Buscando...
              </span>
            ) : (
              'Buscar Anuncios'
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Resultados da Busca
              </h2>
              <span className="px-3 py-1 bg-purple-500/30 text-purple-300 rounded-full text-sm">
                {result.totalFound} anuncio(s) encontrado(s)
              </span>
            </div>

            <p className="text-gray-400 text-sm mb-4">
              Termos buscados: <span className="text-purple-400">{result.searchTerms}</span>
            </p>

            {result.ads.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">&#128269;</div>
                <p className="text-gray-400">Nenhum anuncio encontrado com esses termos</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {result.ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{ad.page_name}</h3>
                        {ad.ad_creative_bodies && ad.ad_creative_bodies[0] && (
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {ad.ad_creative_bodies[0]}
                          </p>
                        )}
                        {ad.ad_creative_link_titles && ad.ad_creative_link_titles[0] && (
                          <p className="text-purple-400 text-sm mt-1">
                            {ad.ad_creative_link_titles[0]}
                          </p>
                        )}
                      </div>
                      <a
                        href={ad.ad_snapshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                      >
                        Ver Anuncio
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
