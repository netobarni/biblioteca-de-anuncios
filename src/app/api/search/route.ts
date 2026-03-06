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

function cleanCaption(caption: string): string {
  // Remove only emojis and URLs, keep the rest
  return caption
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // emojis
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // dingbats
    .replace(/https?:\/\/\S+/g, '') // URLs
    .replace(/\s+/g, ' ') // multiple spaces
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const { caption } = await request.json();

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

    // Clean caption but keep all text
    const searchTerms = cleanCaption(caption);

    if (!searchTerms || searchTerms.length < 3) {
      return NextResponse.json(
        { error: 'Legenda muito curta para buscar' },
        { status: 400 }
      );
    }

    // Search Meta Ad Library
    const fields = [
      'page_name',
      'ad_snapshot_url',
      'ad_creative_bodies',
      'ad_creative_link_captions',
      'ad_creative_link_titles',
      'ad_delivery_start_time',
      'ad_delivery_stop_time'
    ].join(',');

    const params = new URLSearchParams({
      search_terms: searchTerms,
      ad_reached_countries: "['BR']",
      ad_active_status: 'ALL',
      fields: fields,
      access_token: META_ACCESS_TOKEN,
      limit: '50'
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
