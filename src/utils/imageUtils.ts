/**
 * Helper to convert image URLs (especially Google Drive links) into direct image link sources
 * that work in HTML <img> tags without breaking.
 */
export const DEFAULT_BRAND_LOGO_DRIVE_URL = 'https://drive.google.com/file/d/1EzDvqFIdNjWtIU4KIxYQtZ3RYQI6BnrR/view?usp=sharing';

export const formatImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Handle Google Drive links
  // Examples:
  // - https://drive.google.com/file/d/1EzDvqFIdNjWtIU4KIxYQtZ3RYQI6BnrR/view?usp=sharing
  // - https://drive.google.com/open?id=1EzDvqFIdNjWtIU4KIxYQtZ3RYQI6BnrR
  // - https://drive.google.com/uc?id=1EzDvqFIdNjWtIU4KIxYQtZ3RYQI6BnrR
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    // Regex matches common Google Drive file ID patterns
    const match = trimmed.match(/(?:file\/d\/|open\?id=|uc\?.*id=|\/d\/)([a-zA-Z0-9_-]{20,})/i);
    if (match && match[1]) {
      const fileId = match[1];
      // Google Content CDN url serves the raw image directly
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return trimmed;
};
