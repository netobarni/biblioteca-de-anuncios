import { NextRequest, NextResponse } from 'next/server';

async function extractFromInstagram(url: string): Promise<string | null> {
  try {
    // Try oEmbed first
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    const oembedResponse = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (oembedResponse.ok) {
      const data = await oembedResponse.json();
      if (data.title) {
        return data.title;
      }
    }

    // Try fetching the page directly
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });

    if (pageResponse.ok) {
      const html = await pageResponse.text();

      // Try to find caption in meta tags
      const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
      if (ogDescMatch) {
        // Decode HTML entities
        const caption = ogDescMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#039;/g, "'");
        return caption;
      }

      // Try description meta tag
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      if (descMatch) {
        return descMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&');
      }

      // Try to find in JSON-LD or script tags
      const scriptMatch = html.match(/"caption":\s*"([^"]+)"/);
      if (scriptMatch) {
        return scriptMatch[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Instagram extraction error:', error);
    return null;
  }
}

async function extractFromFacebook(url: string): Promise<string | null> {
  try {
    // Try fetching the page
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    if (pageResponse.ok) {
      const html = await pageResponse.text();

      // Try og:description
      const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
      if (ogDescMatch) {
        return ogDescMatch[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&#039;/g, "'");
      }

      // Try description
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      if (descMatch) {
        return descMatch[1];
      }
    }

    return null;
  } catch (error) {
    console.error('Facebook extraction error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.trim()) {
      return NextResponse.json(
        { error: 'URL e obrigatoria' },
        { status: 400 }
      );
    }

    let caption: string | null = null;
    let platform: string = 'unknown';

    // Detect platform and extract
    if (url.includes('instagram.com')) {
      platform = 'instagram';
      caption = await extractFromInstagram(url);
    } else if (url.includes('facebook.com') || url.includes('fb.com')) {
      platform = 'facebook';
      caption = await extractFromFacebook(url);
    } else {
      return NextResponse.json(
        { error: 'URL deve ser do Instagram ou Facebook' },
        { status: 400 }
      );
    }

    if (!caption) {
      return NextResponse.json(
        {
          error: `Falha ao extrair legenda do ${platform === 'instagram' ? 'Instagram' : 'Facebook'}. Verifique se o link esta correto e o perfil e publico. Cole a legenda manualmente.`,
          platform,
          extracted: false
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      caption,
      platform,
      url
    });

  } catch (error) {
    console.error('Extract error:', error);
    return NextResponse.json(
      { error: 'Erro ao extrair legenda' },
      { status: 500 }
    );
  }
}
