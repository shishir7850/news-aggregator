// Simple English detection based on common English words and character patterns
const ENGLISH_COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'new', 'after', 'use', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'want', 'because', 'any', 'these', 'give', 'most', 'us', 'is', 'are', 'was',
  'were', 'been', 'has', 'had', 'said', 'says', 'news', 'report', 'market', 'stock',
]);

// Non-ASCII heavy scripts that indicate non-English
const NON_LATIN_PATTERN = /[\u0400-\u04FF\u0600-\u06FF\u0900-\u097F\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;

export function isLikelyEnglish(text: string): boolean {
  if (!text || text.length < 10) return true; // Too short to determine

  // Check for non-Latin scripts (Cyrillic, Arabic, Devanagari, CJK, etc.)
  const nonLatinChars = (text.match(NON_LATIN_PATTERN) || []).length;
  if (nonLatinChars > text.length * 0.1) {
    return false;
  }

  // Check for common English words
  const words = text.toLowerCase().split(/\s+/);
  const englishWordCount = words.filter((word) =>
    ENGLISH_COMMON_WORDS.has(word.replace(/[^a-z]/g, ''))
  ).length;

  // If more than 15% of words are common English words, likely English
  return englishWordCount / words.length > 0.15;
}

export function filterEnglishContent<T extends { title: string; summary?: string }>(
  items: T[]
): T[] {
  return items.filter((item) => {
    const textToCheck = `${item.title} ${item.summary || ''}`;
    return isLikelyEnglish(textToCheck);
  });
}
