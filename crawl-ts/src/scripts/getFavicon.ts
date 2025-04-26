import { MongoDbConnector } from '@database/MongoDbConnector';
import { VisitResultModel } from '@models/VisitResult';
import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import { defaultLogger as logger } from '../utils/logger';
import { URL } from 'url'; // Import URL for reliable path resolution

// 환경 변수 로드
dotenv.config();

const AXIOS_TIMEOUT = 15000; // Increase timeout slightly
const AXIOS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 FaviconFetcherBot/1.0';
const DOMAIN_PROCESSING_DELAY = 200; // ms delay between domains

/**
 * Extracts favicon URL directly from the website's HTML.
 * @param domain The domain name (e.g., example.com)
 * @returns The absolute favicon URL or null if not found/error.
 */
async function extractFaviconUrl(domain: string): Promise<string | null> {
  const url = `https://${domain}`;
  logger.debug(`[${domain}] Attempting to fetch HTML from ${url}`);
  try {
    const response = await axios.get(url, {
      timeout: AXIOS_TIMEOUT,
      headers: { 'User-Agent': AXIOS_USER_AGENT },
      // Allow redirects
      maxRedirects: 5,
      // Validate status only for 2xx
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const baseUrl = response.request?.res?.responseUrl || url; // Get actual URL after redirects

    // Favicon search order
    const selectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]',
      'link[rel="mask-icon"]', // For Safari pinned tabs
      'link[rel="fluid-icon"]' // For IE11+
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const href = element.attr('href');
        if (href) {
          try {
            // Resolve URL relative to the page's final URL
            const absoluteUrl = new URL(href, baseUrl).href;
            logger.debug(`[${domain}] Found favicon candidate via ${selector}: ${absoluteUrl}`);
            // Optional: Add a HEAD request here to verify the URL points to an image before returning
            // For simplicity, we verify later in getBase64FromUrl
            return absoluteUrl;
          } catch (urlError) {
             logger.warn(`[${domain}] Error resolving URL ${href} relative to ${baseUrl}: ${urlError}`);
             continue; // Try next selector
          }
        }
      }
    }

    // If no <link> tag found, try the default /favicon.ico
    logger.debug(`[${domain}] No <link> tags found, trying default /favicon.ico`);
    const defaultFaviconUrl = new URL('/favicon.ico', baseUrl).href;
    try {
      // Use HEAD request to check existence efficiently
      await axios.head(defaultFaviconUrl, {
          timeout: AXIOS_TIMEOUT / 2, // Shorter timeout for HEAD
          headers: { 'User-Agent': AXIOS_USER_AGENT },
          maxRedirects: 5,
      });
      logger.debug(`[${domain}] Found default favicon.ico: ${defaultFaviconUrl}`);
      return defaultFaviconUrl;
    } catch (error) {
      // Axios throws error for non-2xx status codes (like 404) on HEAD
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug(`[${domain}] Default /favicon.ico not found (404).`);
      } else {
        logger.warn(`[${domain}] Error checking default /favicon.ico at ${defaultFaviconUrl}:`, error instanceof Error ? error.message : error);
      }
      return null; // /favicon.ico doesn't exist or errored
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
       logger.error(`[${domain}] Error fetching HTML from ${url}: ${error.message} (Status: ${error.response?.status})`);
    } else {
       logger.error(`[${domain}] Unexpected error fetching HTML from ${url}:`, error);
    }
    return null;
  }
}

/**
 * Uses Google's favicon service as a fallback. Handles HTML responses.
 * @param domain The domain name (e.g., example.com)
 * @returns The absolute favicon URL (either Google's or extracted from HTML) or null.
 */
async function getGoogleFavicon(domain: string): Promise<string | null> {
  const googleFaviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`; // sz=64 for potentially better quality
  logger.debug(`[${domain}] Attempting Google Favicon service: ${googleFaviconUrl}`);

  try {
    const response = await axios.get(googleFaviconUrl, {
      timeout: AXIOS_TIMEOUT,
      headers: { 'User-Agent': AXIOS_USER_AGENT },
      maxRedirects: 5,
       // Important: Don't validate status here, as we need to check content type even on non-200
      validateStatus: () => true,
    });

    const contentType = response.headers['content-type'];
    logger.debug(`[${domain}] Google Favicon service response status: ${response.status}, content-type: ${contentType}`);

    // Check 1: Is it directly an image?
    if (response.status >= 200 && response.status < 300 && contentType && contentType.startsWith('image/')) {
      logger.debug(`[${domain}] Google Favicon service returned an image directly.`);
      return googleFaviconUrl;
    }

    // Check 2: Is it HTML potentially containing the image?
    // Also handle cases where status might be non-200 but content is still HTML
    if (contentType && contentType.includes('text/html')) {
      logger.warn(`[${domain}] Google Favicon service returned HTML. Parsing for <img> tag.`);
      const htmlContent = response.data; // data is already decoded string by default in axios for text/*
      const $ = cheerio.load(htmlContent);
      const imgSrc = $('img').first().attr('src');

      if (imgSrc) {
        try {
          // Resolve the src relative to the Google service URL *or* a potential base tag
          const baseHref = $('base').attr('href') || googleFaviconUrl;
          const absoluteImgUrl = new URL(imgSrc, baseHref).href;
          logger.info(`[${domain}] Extracted image URL from Google's HTML: ${absoluteImgUrl}`);
          // Return the *actual image URL* found in the HTML
          return absoluteImgUrl;
        } catch (urlError) {
           logger.error(`[${domain}] Error resolving image src "${imgSrc}" from Google HTML: ${urlError}`);
           return null;
        }
      } else {
        logger.warn(`[${domain}] Google Favicon service returned HTML, but no <img> tag found.`);
        return null;
      }
    }

    // Check 3: Any other non-successful response
    logger.warn(`[${domain}] Google Favicon service failed or returned unexpected content-type: ${contentType} (Status: ${response.status})`);
    return null;

  } catch (error) {
     if (axios.isAxiosError(error)) {
        logger.error(`[${domain}] Error fetching from Google Favicon service ${googleFaviconUrl}: ${error.message}`);
     } else {
        logger.error(`[${domain}] Unexpected error fetching from Google Favicon service ${googleFaviconUrl}:`, error);
     }
    return null;
  }
}

/**
 * Fetches an image from a URL and encodes it as a Base64 data URI.
 * @param imageUrl The URL of the image to fetch.
 * @returns Base64 data URI string or null if fetching/encoding fails.
 */
async function getBase64FromUrl(imageUrl: string): Promise<string | null> {
  logger.debug(`Attempting to fetch and encode image from: ${imageUrl}`);
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer', // Important for binary data
      timeout: AXIOS_TIMEOUT,
      headers: { 'User-Agent': AXIOS_USER_AGENT },
      maxRedirects: 5,
       // Only accept success status codes
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      },
    });

    const contentType = response.headers['content-type'];

    // Double check if it's really an image type
    if (!contentType || !contentType.startsWith('image/')) {
        logger.warn(`URL ${imageUrl} did not return an image content-type. Got: ${contentType}`);
        return null;
    }

    // Ensure data is present
    if (!response.data || response.data.length === 0) {
        logger.warn(`URL ${imageUrl} returned empty image data.`);
        return null;
    }

    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const dataUri = `${base64}`;

    // Optional: Check size (e.g., reject if > 100KB)
    // const maxSizeKB = 100;
    // if (dataUri.length > maxSizeKB * 1024 * 1.37) { // Base64 is ~37% larger
    //     logger.warn(`Favicon from ${imageUrl} is too large (${(dataUri.length / 1024).toFixed(1)} KB), skipping.`);
    //     return null;
    // }

    logger.debug(`Successfully encoded image from ${imageUrl} to Base64 data URI.`);
    return dataUri;

  } catch (error) {
    if (axios.isAxiosError(error)) {
       logger.error(`Error fetching image from ${imageUrl}: ${error.message} (Status: ${error.response?.status})`);
    } else {
       logger.error(`Unexpected error fetching image from ${imageUrl}:`, error);
    }
    return null;
  }
}

/**
 * Main function to connect to MongoDB, fetch unique domains,
 * extract/fetch favicons, encode them, and update the database.
 */
async function main() {
  logger.info('SCRIPT START: Fetching and storing favicons for domains.');

  const dbConnector = new MongoDbConnector();

  try {
    await dbConnector.connect();
    logger.info('MongoDB connection successful.');

    // Fetch unique domains where favicon might be missing or needs update
    // Adjust the filter as needed. Example: find all domains
     const uniqueDomains = await VisitResultModel.distinct('domain');
    // Example: find domains without a favicon OR updated long ago
    // const cutoffDate = new Date();
    // cutoffDate.setDate(cutoffDate.getDate() - 30); // Update favicons older than 30 days
    // const uniqueDomains = await VisitResultModel.distinct('domain', {
    //     $or: [
    //         { favicon: { $exists: false } },
    //         { favicon: null },
    //         { faviconUpdatedAt: { $lt: cutoffDate } }
    //     ]
    // });


    if (!uniqueDomains || uniqueDomains.length === 0) {
        logger.info('No domains found needing favicon processing.');
        return;
    }

    logger.info(`Found ${uniqueDomains.length} unique domains to process.`);

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let directFetchCount = 0;
    let googleFetchCount = 0;

    for (const domain of uniqueDomains) {
      processedCount++;
      logger.info(`[${processedCount}/${uniqueDomains.length}] Processing domain: ${domain}`);

      let faviconUrl: string | null = null;
      let faviconSource: 'website' | 'google' | null = null;
      let base64Favicon: string | null = null;

      try {
        // --- Step 1: Try extracting directly from the website ---
        faviconUrl = await extractFaviconUrl(domain);
        if (faviconUrl) {
          logger.info(`[${domain}] Found potential favicon URL via website: ${faviconUrl}`);
          faviconSource = 'website';
          base64Favicon = await getBase64FromUrl(faviconUrl);
          if (base64Favicon) {
            logger.info(`[${domain}] Successfully encoded favicon from website.`);
            directFetchCount++;
          } else {
            logger.warn(`[${domain}] Failed to encode favicon from website URL: ${faviconUrl}. Resetting to try Google.`);
            faviconUrl = null; // Reset URL so Google fallback triggers
            faviconSource = null;
          }
        } else {
           logger.info(`[${domain}] Could not find favicon URL directly on website.`);
        }

        // --- Step 2: Fallback to Google Favicon service if Step 1 failed ---
        if (!base64Favicon) { // Only try Google if direct fetch didn't yield a valid Base64 icon
          logger.info(`[${domain}] Trying Google Favicon service as fallback.`);
          faviconUrl = await getGoogleFavicon(domain); // This might return Google's URL or an extracted one
          if (faviconUrl) {
            logger.info(`[${domain}] Found potential favicon URL via Google service: ${faviconUrl}`);
            faviconSource = 'google';
            base64Favicon = await getBase64FromUrl(faviconUrl); // Encode the URL provided by Google service
             if (base64Favicon) {
                logger.info(`[${domain}] Successfully encoded favicon from Google service URL.`);
                googleFetchCount++;
            } else {
                logger.warn(`[${domain}] Failed to encode favicon from Google service URL: ${faviconUrl}.`);
                faviconUrl = null; // Reset URL
                faviconSource = null;
            }
          } else {
             logger.warn(`[${domain}] Google Favicon service did not yield a usable URL.`);
          }
        }

        // --- Step 3: Update database if successful ---
        if (base64Favicon && faviconSource) {
          const updateResult = await VisitResultModel.updateMany(
            { domain: domain }, // Filter criteria
            {
              $set: {
                favicon: base64Favicon
              }
            }
          );
          logger.info(`[${domain}] DB Update successful. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}. Source: ${faviconSource}`);
          successCount++;
        } else {
          logger.error(`[${domain}] Failed to obtain and encode favicon after trying all methods.`);
           // Optionally update DB to mark as failed or clear old favicon
           // await VisitResultModel.updateMany({ domain }, { $unset: { favicon: "", faviconSource: "", faviconUrl: "", faviconUpdatedAt: "" } });
          errorCount++;
        }

        // --- Delay to prevent rate limiting ---
        await new Promise(resolve => setTimeout(resolve, DOMAIN_PROCESSING_DELAY));

      } catch (loopError) {
        // Catch unexpected errors within the loop for a single domain
        logger.error(`[${domain}] UNEXPECTED ERROR during processing loop:`, loopError);
        errorCount++;
        // Optionally add a longer delay after unexpected errors
         await new Promise(resolve => setTimeout(resolve, DOMAIN_PROCESSING_DELAY * 5));
      }
    } // End of domain loop

    logger.info('--- Favicon Processing Summary ---');
    logger.info(`Total Domains Processed: ${processedCount}`);
    logger.info(`Successfully Updated:    ${successCount}`);
    logger.info(`   - From Website:       ${directFetchCount}`);
    logger.info(`   - From Google Svc:    ${googleFetchCount}`);
    logger.info(`Failed:                  ${errorCount}`);
    logger.info('---------------------------------');

  } catch (error) {
    logger.error('SCRIPT FAILED: Unhandled error during execution:', error);
  } finally {
    await dbConnector.disconnect();
    logger.info('MongoDB connection closed.');
  }
}

// Execute the main function
main().catch(error => {
  logger.error('FATAL SCRIPT ERROR:', error);
  process.exit(1);
});