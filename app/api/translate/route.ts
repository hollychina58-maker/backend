import { NextRequest, NextResponse } from 'next/server';
import { translateContent, translateBlogContent, translateProductContent } from '../../../lib/translate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, sourceLang, targetLangs, content, specs } = body;

    if (!type || !sourceLang || !targetLangs || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!Array.isArray(targetLangs)) {
      return NextResponse.json(
        { success: false, error: 'targetLangs must be an array' },
        { status: 400 }
      );
    }

    let translatedContent;

    if (type === 'product') {
      translatedContent = await translateProductContent(content, specs || [], sourceLang, targetLangs);
    } else if (type === 'blog') {
      translatedContent = await translateBlogContent(content, sourceLang, targetLangs);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "product" or "blog"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: translatedContent,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { success: false, error: 'Translation failed' },
      { status: 500 }
    );
  }
}