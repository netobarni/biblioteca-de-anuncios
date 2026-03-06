import { NextRequest, NextResponse } from 'next/server';

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

interface Ad {
  id: string;
  page_name: string;
  ad_snapshot_url: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_titles?: string[];
}

function extractKeywords(caption: string): string {
  // Remove emojis, hashtags, mentions, URLs
  let cleaned = caption
    .replace(/[\u{1F600}-\u{1F6FF}]/gu, '') // emojis
    .replace(/#\w+/g, '') // hashtags
    .replace(/@\w+/g, '') // mentions
    .replace(/https?:\/\/\S+/g, '') // URLs
    .replace(/[^\w\sáéíóúâêîôûãõàèìòùäëïöüç]/gi, ' ') // special chars
    .toLowerCase();

  // Common Portuguese stopwords
  const stopwords = new Set([
    'a', 'o', 'e', 'de', 'da', 'do', 'em', 'um', 'uma', 'para', 'com', 'que',
    'na', 'no', 'se', 'os', 'as', 'por', 'mais', 'como', 'mas', 'foi', 'ao',
    'ele', 'das', 'tem', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'nos',
    'ja', 'eu', 'tambem', 'so', 'pelo', 'pela', 'ate', 'isso', 'ela', 'entre',
    'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me',
    'esse', 'eles', 'voce', 'essa', 'num', 'nem', 'suas', 'meu', 'minha', 'numa',
    'pelos', 'elas', 'havia', 'seja', 'qual', 'sera', 'nos', 'tenho', 'lhe',
    'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te',
    'voces', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas',
    'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes',
    'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo',
    'estou', 'esta', 'estamos', 'estao', 'estive', 'esteve', 'estivemos',
    'estiveram', 'estava', 'estavamos', 'estavam', 'estivera', 'estiveramos',
    'esteja', 'estejamos', 'estejam', 'estivesse', 'estivessemos', 'estivessem',
    'estiver', 'estivermos', 'estiverem', 'the', 'and', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can'
  ]);

  // Extract words
  const words = cleaned
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopwords.has(word));

  // Get unique words, prioritize longer ones
  const uniqueWords = [...new Set(words)]
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);

  return uniqueWords.join(' ');
}

export async function POST(request: NextRequest) {
  try {
    const { caption, url } = await request.json();

    if (!caption || caption.trim().length === 0) {
      return NextResponse.json(
        { error: 'Legenda e obrigatoria' },
        { status: 400 }
      );
    }

    if (!META_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Token da API nao configurado' },
        { status: 500 }
      );
    }

    // Extract search keywords from caption
    const searchTerms = extractKeywords(caption);

    if (!searchTerms) {
      return NextResponse.json(
        { error: 'Nao foi possivel extrair palavras-chave da legenda' },
        { status: 400 }
      );
    }

    // Search Meta Ad Library
    const fields = [
      'page_name',
      'ad_snapshot_url',
      'ad_creative_bodies',
      'ad_creative_link_captions',
      'ad_creative_link_titles'
    ].join(',');

    const params = new URLSearchParams({
      search_terms: searchTerms,
      ad_reached_countries: "['BR']",
      ad_active_status: 'ACTIVE',
      fields: fields,
      access_token: META_ACCESS_TOKEN,
      limit: '25'
    });

    const apiUrl = `https://graph.facebook.com/v19.0/ads_archive?${params.toString()}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('Meta API Error:', data.error);
      return NextResponse.json(
        { error: data.error.message || 'Erro na API da Meta' },
        { status: 500 }
      );
    }

    const ads: Ad[] = data.data || [];

    return NextResponse.json({
      ads,
      searchTerms,
      totalFound: ads.length
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
