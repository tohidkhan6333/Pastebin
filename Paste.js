// src/main.js
const fs = import('fs');
const path = import('path');

// Multiple Pastebin API keys (used one after another if one fails)
const API_KEYS = [
    "EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL",
    "CNJgmfg9X745hcnMQ7FE-nDxytt6w8xK",
    "c7Jo_q9xvCMAQsj1qihjLJBMBY2Er5--",
    "KpoS0JysNXgUSgCWH2hr__2OG7aJ30S_",
    "furii3L3ijdpwYB-vZ_jej7CxvNjFESk",
    "PS0uqmRdEQ3mSqNWD28lccEmQMz-eu7",
    "9L_JkdEp6u4yAa3Dwi9gnYxvZ2_HrXj-",
    "44649d0b013cfc04c3a7bcadad511ef7",
    "478d52a29c7e952ba116d09bd9625fde",
    "dec737f4cfa5817b78bb5e16e23eda1d",
    "51d707c74e0ad8797b70ae27b3e6f846"
];

/**
 * Uploads content to Pastebin, handling text, files, URLs, and base64 data.
 * Automatically retries with next API key if rate-limited or failed.
 * @param {string | Buffer} input - Text, file path, base64 data, or Buffer.
 * @param {string} [title='Untitled'] - Paste title.
 * @param {string} [format='json'] - Syntax highlighting.
 * @param {string} [privacy='1'] - 0=public, 1=unlisted, 2=private.
 * @returns {Promise<string>} Custom paste URL.
 */
async function uploadToPastebin(input, title = 'Untitled', format = 'json', privacy = '1') {
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    let lastError = null;

    for (let i = 0; i < API_KEYS.length; i++) {
        const PASTEBIN_API_KEY = API_KEYS[i];
        console.log(`⚙️ Attempting upload with API key ${i + 1}/${API_KEYS.length}...`);

        try {
            const { PasteClient, Publicity } = require('pastebin-api');
            const client = new PasteClient(PASTEBIN_API_KEY);

            const publicityMap = {
                '0': Publicity.Public,
                '1': Publicity.Unlisted,
                '2': Publicity.Private,
            };

            let contentToUpload = '';

            // Handle various input types
            if (Buffer.isBuffer(input)) {
                contentToUpload = input.toString();
            } else if (typeof input === 'string') {
                if (input.startsWith('data:')) {
                    const base64Data = input.split(',')[1];
                    contentToUpload = Buffer.from(base64Data, 'base64').toString();
                } else if (input.startsWith('http://') || input.startsWith('https://')) {
                    contentToUpload = input;
                } else if (fs.existsSync(input)) {
                    contentToUpload = fs.readFileSync(input, 'utf8');
                } else {
                    contentToUpload = input;
                }
            } else {
                throw new Error('Unsupported input type. Please provide text, a file path, or base64 data.');
            }

            // Create paste
            const pasteUrl = await client.createPaste({
                code: contentToUpload,
                expireDate: 'N',
                format,
                name: title,
                publicity: publicityMap[privacy],
            });

            console.log('✅ Original Pastebin URL:', pasteUrl);

            const pasteId = pasteUrl.replace('https://pastebin.com/', '');
            const customUrl = `STARK-MD≈${pasteId}`;

            console.log('🔗 Custom URL:', customUrl);
            return customUrl;

        } catch (error) {
            lastError = error;
            const errMsg = String(error.message || error);

            console.error(`❌ Error with API key ${i + 1}:`, errMsg);

            // Handle rate-limit or temporary error
            if (errMsg.includes('rate limit') || errMsg.includes('Too many requests')) {
                console.log('⚠️ Rate limit detected. Waiting 5 seconds before retry...');
                await delay(5000);
            }

            // Try next key if available
            if (i < API_KEYS.length - 1) {
                console.log(`↻ Retrying with next API key...\n`);
                await delay(1500);
                continue;
            }
        }
    }

    // All keys failed
    throw new Error(`All API keys failed. Last error: ${lastError.message || lastError}`);
}

module.exports = uploadToPastebin;
