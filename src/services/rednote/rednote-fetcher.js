/**
 * RedNote content fetching service
 * Fetches content from RedNote posts using their share URLs
 */
import got from 'got';
import { JSDOM } from 'jsdom';
import { logger } from '../../utils/logger.js';

// Constants for selectors and defaults
const SELECTORS = {
  text: ['.content-container','.note-card-title'],
  images: ['.note-slider-img'],
  videos: [
    'video source',
    'video',
    '.video-container video',
    '.media-video',
    '.video-player',
    '.video-content video',
    'source[type="video/mp4"]',
    '.status-video'
  ],
  author: ['.author-username', '.note-card-name','meta[property="og:author"]', 'meta[name="author"]'],
  date: ['.publish-time-container', 'time', 'meta[property="article:published_time"]'],
  title: ['.title', '.note-card-title','meta[property="og:title"]', 'h1']
};

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15';

/**
 * Fetch RedNote post content from a share URL
 * @param {string} redNoteUrl - The RedNote share URL
 * @returns {Promise<Object>} - RedNote post data
 */
export async function fetchRedNoteContent(redNoteUrl) {
  try {
    logger.info('Fetching RedNote content', { redNoteUrl });
    
    const response = await fetchRedNotePage(redNoteUrl);
    const document = parseHtml(response.body);
    
    // Extract content components
    const textContent = extractTextContent(document);
    const images = extractImages(document);
    const videos = extractVideos(document);
    const author = extractAuthor(document);
    const createdAt = extractDate(document);
    const title = extractTitle(document);
    
    // Fallback for empty content
    if (true) {
      const fallbackContent = findFallbackContent(document, response.body);
      
      // Log extraction results for debugging
      logExtractionResults(textContent, images, videos, author, title, createdAt, fallbackContent);
      
      const postData = createPostData(textContent || fallbackContent, images, videos, author, createdAt, title, redNoteUrl);
      logger.info('Successfully fetched RedNote content');
      return postData;
    }
    
    // Log extraction results for debugging
    logExtractionResults(textContent, images, videos, author, title, createdAt);
    
    const postData = createPostData(textContent, images, videos, author, createdAt, title, redNoteUrl);
    logger.info('Successfully fetched RedNote content');
    return postData;
  } catch (error) {
    logger.error('Error fetching RedNote content', { error: error.message, url: redNoteUrl });
    throw error;
  }
}

/**
 * Fetch the RedNote page content
 * @param {string} url - The RedNote URL
 * @returns {Promise<Object>} - HTTP response
 */
async function fetchRedNotePage(url) {
  return await got.get(url, {
    followRedirect: true,
    headers: {
      'User-Agent': USER_AGENT
    }
  });
}

/**
 * Parse HTML content into a DOM document
 * @param {string} html - HTML content
 * @returns {Document} - DOM document
 */
function parseHtml(html) {
  const dom = new JSDOM(html);
  return dom.window.document;
}

/**
 * Extract text content from the document
 * @param {Document} document - DOM document
 * @returns {string} - Extracted text content
 */
function extractTextContent(document) {
  let textContent = '';
  
  for (const selector of SELECTORS.text) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      textContent = element.textContent.trim();
      logger.debug('Found text content using selector', { selector });
      break;
    }
  }
  
  return textContent;
}

/**
 * Extract images from the document
 * @param {Document} document - DOM document
 * @returns {string[]} - Array of image URLs
 */
function extractImages(document) {
  const images = [];
  
  // Try specific selectors first
  for (const selector of SELECTORS.images) {
    const imageElements = document.querySelectorAll(selector);
    if (imageElements.length > 0) {
      logger.debug('Found images using selector', { selector, count: imageElements.length });
      
      imageElements.forEach(img => {
        addImageToArray(img, images);
      });
      
      if (images.length > 0) break;
    }
  }
  
  // If no images found with specific selectors, try all img tags
  if (images.length === 0) {
    const allImages = document.querySelectorAll('img');
    allImages.forEach(img => {
      addImageToArray(img, images);
    });
  }
  
  return images;
}

/**
 * Add image to array if it meets criteria
 * @param {Element} img - Image element
 * @param {string[]} images - Array to add image URLs to
 */
function addImageToArray(img, images) {
  const imgSrc = img.getAttribute('data-src') || 
                img.getAttribute('src') || 
                img.getAttribute('data-original') || 
                img.getAttribute('data-url');
                
  if (imgSrc && 
      imgSrc.includes('http') && 
      !imgSrc.includes('avatar') && 
      !imgSrc.includes('picasso') && 
      !images.includes(imgSrc)) {
    images.push(imgSrc);
  }
}

/**
 * Extract videos from the document
 * @param {Document} document - DOM document
 * @returns {string[]} - Array of video URLs
 */
function extractVideos(document) {
  const videos = [];
  
  // Try specific selectors first
  for (const selector of SELECTORS.videos) {
    const videoElements = document.querySelectorAll(selector);
    if (videoElements.length > 0) {
      logger.debug('Found videos using selector', { selector, count: videoElements.length });
      
      videoElements.forEach(video => {
        const videoSrc = video.getAttribute('src') || 
                        video.getAttribute('data-src') || 
                        video.getAttribute('data-url') || 
                        video.getAttribute('data-video');
                        
        if (videoSrc && videoSrc.includes('http') && !videos.includes(videoSrc)) {
          videos.push(videoSrc);
        }
      });
      
      if (videos.length > 0) break;
    }
  }
  
  // Check meta tags for video URLs
  const metaVideoUrl = document.querySelector('meta[property="og:video"]')?.getAttribute('content');
  if (metaVideoUrl && metaVideoUrl.includes('http') && !videos.includes(metaVideoUrl)) {
    videos.push(metaVideoUrl);
  }
  
  // Look for video URLs in script tags
  extractVideosFromScripts(document, videos);
  
  return videos;
}

/**
 * Extract videos from script tags
 * @param {Document} document - DOM document
 * @param {string[]} videos - Array to add video URLs to
 */
function extractVideosFromScripts(document, videos) {
  const scriptTags = document.querySelectorAll('script:not([src])');
  scriptTags.forEach(script => {
    const content = script.textContent;
    if (content && content.includes('video') && (content.includes('{') || content.includes('['))) {
      try {
        // Look for JSON-like structures with video URLs
        const videoUrlMatches = content.match(/https?:\/\/[^"'\s]+\.(?:mp4|mov|avi|flv|wmv)[^"'\s]*/gi);
        if (videoUrlMatches) {
          videoUrlMatches.forEach(url => {
            if (!videos.includes(url)) {
              videos.push(url);
            }
          });
        }
      } catch (e) {
        // Ignore JSON parsing errors
        logger.debug('Error parsing script content for videos', { error: e.message });
      }
    }
  });
}

/**
 * Extract author from the document
 * @param {Document} document - DOM document
 * @returns {string} - Author name
 */
function extractAuthor(document) {
  let author = 'Unknown';
  
  for (const selector of SELECTORS.author) {
    const element = document.querySelector(selector);
    if (element) {
      if (selector.includes('meta')) {
        const content = element.getAttribute('content');
        if (content && content.trim()) {
          author = content.trim();
          logger.debug('Found author using selector', { selector });
          break;
        }
      } else if (element.textContent && element.textContent.trim()) {
        author = element.textContent.trim();
        logger.debug('Found author using selector', { selector });
        break;
      }
    }
  }
  
  return author;
}

/**
 * Extract and parse date from the document
 * @param {Document} document - DOM document
 * @returns {string} - Formatted date (YYYY-MM-DD)
 */
function extractDate(document) {
  let createdAt = null;
  let createdAtRaw = null;
  
  for (const selector of SELECTORS.date) {
    const element = document.querySelector(selector);
    if (element) {
      if (selector.includes('meta')) {
        createdAtRaw = element.getAttribute('content');
      } else {
        createdAtRaw = element.getAttribute('datetime') || element.textContent;
      }
      
      if (createdAtRaw && createdAtRaw.trim()) {
        logger.debug('Found date using selector', { selector, date: createdAtRaw });
        break;
      }
    }
  }
  
  // Parse the date
  if (createdAtRaw) {
    createdAt = parseDate(createdAtRaw);
  }
  
  // If date parsing failed, use current date
  if (!createdAt) {
    logger.debug('Failed to parse date, using current date');
    createdAt = new Date().toISOString().split('T')[0];
  }
  
  return createdAt;
}

/**
 * Parse date string into YYYY-MM-DD format
 * @param {string} dateStr - Raw date string
 * @returns {string|null} - Formatted date or null if parsing failed
 */
function parseDate(dateStr) {
  // First try: RedNote format '05-06 china'
  const redNoteFormat = dateStr.match(/(\d{2})-(\d{2})/);
  if (redNoteFormat) {
    const [, month, day] = redNoteFormat;
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`; // Format: YYYY-MM-DD
  } 
  
  // Try to parse as ISO date or other common formats
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }
  } catch (e) {
    // Date parsing failed
    logger.debug('Failed to parse date', { dateStr });
  }
  
  return null;
}

/**
 * Extract title from the document
 * @param {Document} document - DOM document
 * @returns {string} - Post title
 */
function extractTitle(document) {
  let title = 'Untitled';
  
  for (const selector of SELECTORS.title) {
    const element = document.querySelector(selector);
    if (element) {
      if (selector.includes('meta')) {
        const content = element.getAttribute('content');
        if (content && content.trim()) {
          title = content.trim();
          logger.debug('Found title using selector', { selector });
          break;
        }
      } else if (element.textContent && element.textContent.trim()) {
        title = element.textContent.trim();
        logger.debug('Found title using selector', { selector });
        break;
      }
    }
  }
  
  return title;
}

/**
 * Find fallback content when no content is found with selectors
 * @param {Document} document - DOM document
 * @param {string} htmlBody - Raw HTML body
 * @returns {string} - Fallback content or empty string
 */
function findFallbackContent(document, htmlBody) {
  if (!htmlBody) return '';
  
  logger.debug('No content found with selectors, analyzing HTML structure');
  
  // Try to extract text from the most content-dense element
  const allElements = Array.from(document.querySelectorAll('div, article, section'));
  let bestElement = null;
  let maxTextLength = 0;
  
  allElements.forEach(el => {
    const text = el.textContent?.trim() || '';
    // Ignore very short texts and navigation/header elements
    if ( 
        text.length > 2
        // && 
        // !el.className.includes('nav') && 
        // !el.className.includes('header') && 
        // !el.className.includes('footer')
      ) {
      maxTextLength = text.length;
      logger.debug('Found potential content element', {
        element: el.tagName,
        class: el.className,
        contentLength: text.length,
        content: text
      });
      bestElement = el;
    }
  });
  
  // if (bestElement) {
  //   logger.debug('Found content in element', { 
  //     element: bestElement.tagName, 
  //     class: bestElement.className,
  //     contentLength: bestElement.textContent.length,
  //     content: bestElement.textContent
  //   });
  //   return bestElement.textContent.trim();
  // }
  
  return '';
}

/**
 * Log extraction results for debugging
 * @param {string} textContent - Extracted text content
 * @param {string[]} images - Extracted image URLs
 * @param {string[]} videos - Extracted video URLs
 * @param {string} author - Extracted author
 * @param {string} title - Extracted title
 * @param {string} createdAt - Extracted date
 * @param {string} fallbackContent - Fallback content if any
 */
function logExtractionResults(textContent, images, videos, author, title, createdAt, fallbackContent = '') {
  logger.debug('Content extraction results', {
    textContentLength: textContent?.length || 0,
    fallbackContentLength: fallbackContent?.length || 0,
    imagesFound: images.length,
    videosFound: videos.length,
    authorFound: author !== 'Unknown',
    titleFound: title !== 'Untitled',
    dateFound: createdAt !== null
  });
}

/**
 * Create post data object
 * @param {string} text - Post text content
 * @param {string[]} images - Image URLs
 * @param {string[]} videos - Video URLs
 * @param {string} author - Post author
 * @param {string} createdAt - Post creation date
 * @param {string} title - Post title
 * @param {string} url - Original URL
 * @returns {Object} - Structured post data
 */
function createPostData(text, images, videos, author, createdAt, title, url) {
  const postData = {
    text: text || '',
    images: images || [],
    videos: videos || [],
    author: author || 'Unknown',
    createdAt: createdAt || new Date().toISOString().split('T')[0],
    title: title || 'Untitled'
  };
  
  // If we still have no content, add a note about it
  if (!postData.text && postData.images.length === 0 && postData.videos.length === 0) {
    postData.text = `No content could be extracted from this RedNote post. The URL was: ${url}`;
  }
  
  return postData;
}

/**
 * Create fallback RedNote data when fetching fails
 * @param {Error} error - The error that occurred
 * @param {string} mailBody - The original email body
 * @returns {Object} - Basic RedNote data
 */
export function createFallbackRedNoteData(error, mailBody) {
  return {
    text: `Failed to fetch RedNote content: ${error.message}\n\nOriginal email content:\n${mailBody}`,
    images: [],
    videos: [],
    createdAt: new Date().toISOString().split('T')[0],
    author: 'Unknown',
    title: 'Failed to Fetch Content'
  };
}