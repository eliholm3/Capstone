// Wikimedia Commons image search service
// Docs: https://commons.wikimedia.org/w/api.php

const API_URL = 'https://commons.wikimedia.org/w/api.php';

// We only want actual photos, not SVGs or other formats
const GOOD_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// We only want freely licensed images
const GOOD_LICENSES = ['cc0', 'cc-by', 'cc-by-sa', 'public domain'];

/**
 * Search Wikimedia Commons for images.
 *
 * @param {string} searchTerm - What to search for (e.g. "golden retriever")
 * @param {number} limit      - How many images to return
 * @param {number} offset     - Where to continue from (0 = start fresh)
 * @returns {{ images: Array, nextOffset: number|null }}
 *   - images:     Array of { url, title, license }
 *   - nextOffset: Pass this back next time to get the next batch.
 *                 null means there are no more results.
 */
async function fetchWikimediaImages(searchTerm, limit = 20, offset = 0) {
  const images = [];
  let currentOffset = offset;

  // Keep calling the API until we have enough images (or run out of results)
  while (images.length < limit) {

    // Build the API request
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      generator: 'search',       // Use search as the page generator
      gsrsearch: searchTerm,      // The search query
      gsrnamespace: '6',          // Namespace 6 = files/images
      gsrlimit: '20',             // Get 20 results per API call (50 max)
      prop: 'imageinfo',          // We want image metadata
      iiprop: 'url|extmetadata',  // Specifically the URL and license info
    });

    // If we have an offset, skip ahead to where we left off
    if (currentOffset > 0) {
      params.set('gsroffset', String(currentOffset));
    }

    // Call the API
    const response = await fetch(`${API_URL}?${params}`);
    const data = await response.json();

    // The API returns pages as an object like { "12345": { ... }, "67890": { ... } }
    const pages = data.query?.pages;
    if (!pages) break; // No results at all, we're done

    // Go through each result and filter to the good ones
    for (const page of Object.values(pages)) {
      if (images.length >= limit) break;

      // Skip files that aren't jpg/jpeg/png
      const title = page.title || '';
      const titleLower = title.toLowerCase();
      const hasGoodExtension = GOOD_EXTENSIONS.some((ext) => titleLower.endsWith(ext));
      if (!hasGoodExtension) continue;

      // Skip if there's no image info
      const info = page.imageinfo?.[0];
      if (!info) continue;

      // Get the license name from the metadata
      const metadata = info.extmetadata;
      const license = metadata?.LicenseShortName?.value || null;

      // Skip if the license isn't one we allow
      if (!license) continue;
      const licenseLower = license.toLowerCase().replace(/_/g, '-');
      const hasGoodLicense = GOOD_LICENSES.some((good) => licenseLower.includes(good));
      if (!hasGoodLicense) continue;

      // This image passed all checks — keep it
      images.push({
        url: info.url,
        title: title.replace(/^File:/, ''), // Remove the "File:" prefix
        license,
      });
    }

    // Check if the API has more pages of results
    const nextOffset = data.continue?.gsroffset;
    if (!nextOffset) {
      // No more results available
      currentOffset = null;
      break;
    }
    currentOffset = nextOffset;
  }

  return { images, nextOffset: currentOffset };
}

module.exports = { fetchWikimediaImages };
