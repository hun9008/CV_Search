"use strict";
/**
 * Script to run GeminiParser for parsing recruitment content
 * * This script is used to launch the GeminiParser which will:
 * 1. Connect to the MongoDB database
 * 2. Load unprocessed raw content
 * 3. Parse the content using Gemini AI
 * 4. Save the parsed results back to the database
 *
* Usage: npm run parse:gemini
 */
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("../parser");
// Execute the parser
console.log('Starting GeminiParser script...');
(0, parser_1.runGeminiParser)()
    .then(() => {
    console.log('GeminiParser script completed successfully');
})
    .catch((error) => {
    console.error('GeminiParser script failed:', error);
    process.exit(1);
});
//# sourceMappingURL=runGeminiParser.js.map