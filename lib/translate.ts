const MYMEMORY_API = process.env.TRANSLATION_API_URL || 'https://api.mymemory.translated.net/get';
const GOOGLE_TRANSLATE_API = 'https://translation.googleapis.com/language/translate/v2';
const GOOGLE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

interface TranslationResult {
  success: boolean;
  translatedText: string;
  error?: string;
}

async function translateWithGoogle(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  if (!GOOGLE_API_KEY) {
    return { success: false, translatedText: '', error: 'Google Translate API key not configured' };
  }

  try {
    const langPair = sourceLang === 'en' ? 'en' : sourceLang;
    const target = targetLang === 'en' ? 'en' : targetLang;

    const response = await fetch(
      `${GOOGLE_TRANSLATE_API}?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: langPair,
          target: target,
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
      return { success: false, translatedText: '', error: errorMsg };
    }

    const data = await response.json();
    if (data.data?.translations?.[0]?.translatedText) {
      return {
        success: true,
        translatedText: data.data.translations[0].translatedText,
      };
    } else {
      return { success: false, translatedText: '', error: 'Invalid response from Google Translate' };
    }
  } catch (error) {
    return {
      success: false,
      translatedText: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

async function translateWithMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  try {
    const langPair = `${sourceLang}|${targetLang}`;
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      return {
        success: true,
        translatedText: data.responseData.translatedText,
      };
    } else {
      return {
        success: false,
        translatedText: '',
        error: data.responseDetails || 'Translation failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      translatedText: '',
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  if (!text || text.trim() === '') {
    return { success: true, translatedText: '' };
  }

  if (sourceLang === targetLang) {
    return { success: true, translatedText: text };
  }

  // Try Google Translate first
  if (GOOGLE_API_KEY) {
    const googleResult = await translateWithGoogle(text, sourceLang, targetLang);
    if (googleResult.success) {
      return googleResult;
    }
    console.log('Google Translate failed, falling back to MyMemory:', googleResult.error);
  }

  // Fallback to MyMemory
  return translateWithMyMemory(text, sourceLang, targetLang);
}

export async function translateContent(
  content: Record<string, { name: string; description: string }>,
  sourceLang: string,
  targetLangs: string[]
): Promise<Record<string, { name: string; description: string }>> {
  const result: Record<string, { name: string; description: string }> = {};

  // Copy source language content
  result[sourceLang] = { ...content[sourceLang] };

  for (const lang of targetLangs) {
    if (lang === sourceLang) continue;

    const sourceContent = content[sourceLang] || { name: '', description: '' };
    const targetContent: { name: string; description: string } = { name: '', description: '' };

    // Translate name
    if (sourceContent.name) {
      const nameResult = await translateText(sourceContent.name, sourceLang, lang);
      targetContent.name = nameResult.success ? nameResult.translatedText : sourceContent.name;
    }

    // Translate description
    if (sourceContent.description) {
      const descResult = await translateText(sourceContent.description, sourceLang, lang);
      targetContent.description = descResult.success ? descResult.translatedText : sourceContent.description;
    }

    result[lang] = targetContent;
  }

  return result;
}

interface ProductSpec {
  name: string;
  value: string;
  unit?: string;
}

export async function translateProductContent(
  content: Record<string, { name: string; description: string }>,
  specs: Record<string, ProductSpec[]>,
  sourceLang: string,
  targetLangs: string[]
): Promise<{ content: Record<string, { name: string; description: string }>; specs: Record<string, ProductSpec[]> }> {
  const result: Record<string, { name: string; description: string }> = {};

  // Copy source language content
  result[sourceLang] = { ...content[sourceLang] };

  for (const lang of targetLangs) {
    if (lang === sourceLang) continue;

    const sourceContent = content[sourceLang] || { name: '', description: '' };
    const targetContent: { name: string; description: string } = { name: '', description: '' };

    // Translate name
    if (sourceContent.name) {
      const nameResult = await translateText(sourceContent.name, sourceLang, lang);
      targetContent.name = nameResult.success ? nameResult.translatedText : sourceContent.name;
    }

    // Translate description
    if (sourceContent.description) {
      const descResult = await translateText(sourceContent.description, sourceLang, lang);
      targetContent.description = descResult.success ? descResult.translatedText : sourceContent.description;
    }

    result[lang] = targetContent;
  }

  // Translate specs for each target language (per-language specs)
  const specsResult: Record<string, ProductSpec[]> = {};

  // Copy source language specs
  specsResult[sourceLang] = (specs[sourceLang] || []).map(spec => ({ ...spec }));

  // Translate specs for each target language
  for (const lang of targetLangs) {
    if (lang === sourceLang) continue;

    const sourceSpecs = specs[sourceLang] || [];
    specsResult[lang] = sourceSpecs.map(spec => ({ ...spec }));

    for (let i = 0; i < sourceSpecs.length; i++) {
      const spec = sourceSpecs[i];

      if (spec.name) {
        const nameResult = await translateText(spec.name, sourceLang, lang);
        specsResult[lang][i].name = nameResult.success ? nameResult.translatedText : spec.name;
      }

      if (spec.value) {
        const valueResult = await translateText(spec.value, sourceLang, lang);
        specsResult[lang][i].value = valueResult.success ? valueResult.translatedText : spec.value;
      }

      if (spec.unit) {
        const unitResult = await translateText(spec.unit, sourceLang, lang);
        specsResult[lang][i].unit = unitResult.success ? unitResult.translatedText : spec.unit;
      }
    }
  }

  return { content: result, specs: specsResult };
}

export async function translateBlogContent(
  content: Record<string, { title: string; excerpt: string; content: string }>,
  sourceLang: string,
  targetLangs: string[]
): Promise<Record<string, { title: string; excerpt: string; content: string }>> {
  const result: Record<string, { title: string; excerpt: string; content: string }> = {};

  // Copy source language content
  result[sourceLang] = { ...content[sourceLang] };

  for (const lang of targetLangs) {
    if (lang === sourceLang) continue;

    const sourceContent = content[sourceLang] || { title: '', excerpt: '', content: '' };
    const targetContent: { title: string; excerpt: string; content: string } = { title: '', excerpt: '', content: '' };

    // Translate title
    if (sourceContent.title) {
      const titleResult = await translateText(sourceContent.title, sourceLang, lang);
      targetContent.title = titleResult.success ? titleResult.translatedText : sourceContent.title;
    }

    // Translate excerpt
    if (sourceContent.excerpt) {
      const excerptResult = await translateText(sourceContent.excerpt, sourceLang, lang);
      targetContent.excerpt = excerptResult.success ? excerptResult.translatedText : sourceContent.excerpt;
    }

    // Translate full content (markdown)
    if (sourceContent.content) {
      const contentResult = await translateText(sourceContent.content, sourceLang, lang);
      targetContent.content = contentResult.success ? contentResult.translatedText : sourceContent.content;
    }

    result[lang] = targetContent;
  }

  return result;
}