/**
 * Extract text from RKT files to JSON format
 * Reads all RKT files from data/JP RKT and extracts text from (text ...) and (str ...) functions
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import path from "path";

interface Message {
    message: string;
    name?: string;
}

/**
 * Parse a text string to extract name and message
 * If the text starts with 「name」, extract the name
 * Otherwise, return just the message
 */
function parseTextWith(text: string): Message {
    // Pattern to match 「name」 at the start
    // The name is between 「 and 」, followed by 　and then the message
    const namePattern = /^「(.+?)」　(.*)$/s;

    const match = text.match(namePattern);
    if (match) {
        return {
            name: match[1],
            message: match[2]
        };
    }

    // No name found, return just the message
    return { message: text };
}

/**
 * Extract text strings from a single RKT file content
 * Looks for (text "string") or (str "string") patterns and extracts the string content.
 * Handles single-line, multi-line, and trailing arguments like '|YYYYY|.
 */
function extractTextFromRkt(content: string): Message[] {
    const messages: Message[] = [];

    // First, normalize the content by removing newlines within (text ...) and (str ...) expressions
    // This allows us to match multi-line text functions
    const normalizedContent = content.replace(
        /\((text|str)\s+[\s\S]*?\)/g,
        (match) => match.replace(/\s*\n\s*/g, ' ')
    );

    // UPDATED REGEX: 
    // \((?:text|str) -> Matches (text or (str
    // \s+"           -> Matches whitespace followed by opening quote
    // ([^"]*)        -> Captures everything inside the quotes (the XXXXXXXX)
    // "[^)]*\)       -> Matches the closing quote, plus ANY trailing arguments (like '|YYYY|) until the closing parenthesis
    const textPattern = /\((?:text|str)\s+"([^"]*)"[^)]*\)/g;

    let match;
    while ((match = textPattern.exec(normalizedContent)) !== null) {
        const extractedText = match[1];
        
        // This condition automatically ignores strings that are empty or contain only whitespace 
        // e.g., (str " ") will be ignored because " ".trim().length === 0
        if (extractedText && extractedText.trim().length > 0) {
            const parsed = parseTextWith(extractedText);
            messages.push(parsed);
        }
    }

    return messages;
}

/**
 * Process a single RKT file and extract text to JSON
 */
function processRktFile(
    rktFilePath: string,
    jsonFilePath: string
): { fileName: string; textCount: number } {
    console.log(`  Processing: ${path.basename(rktFilePath)}`);

    // Read RKT file content
    const content = readFileSync(rktFilePath, "utf-8");

    // Extract text strings
    const messages = extractTextFromRkt(content);

    // Ensure output directory exists
    const outputDir = path.dirname(jsonFilePath);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    // Write JSON file
    writeFileSync(jsonFilePath, JSON.stringify(messages, null, 2), "utf-8");

    return {
        fileName: path.basename(rktFilePath),
        textCount: messages.length,
    };
}

/**
 * Extract text from all RKT files in a directory
 * @param rktDir Source directory containing RKT files (defaults to data/JP RKT)
 * @param jsonDir Output directory for JSON files (defaults to data/JP JSON)
 */
export function extractAllRktFiles(
    rktDir: string = path.join(process.cwd(), "data", "JP RKT"),
    jsonDir: string = path.join(process.cwd(), "data", "JP JSON")
): void {
    console.log("========================================");
    console.log("  Extracting Text from RKT Files");
    console.log("========================================");
    console.log(`Source directory: ${rktDir}`);
    console.log(`Output directory: ${jsonDir}`);
    console.log();

    // Check if source directory exists
    if (!existsSync(rktDir)) {
        throw new Error(`Source directory does not exist: ${rktDir}`);
    }

    // Create output directory if it doesn't exist
    if (!existsSync(jsonDir)) {
        mkdirSync(jsonDir, { recursive: true });
        console.log(`Created output directory: ${jsonDir}`);
    }

    // Get all RKT files
    const rktFiles = readdirSync(rktDir).filter((f) => f.endsWith(".rkt"));

    if (rktFiles.length === 0) {
        console.log("No .rkt files found in source directory");
        return;
    }

    console.log(`Found ${rktFiles.length} RKT files`);
    console.log();

    let totalTexts = 0;
    let successCount = 0;
    let failCount = 0;

    // Process each RKT file
    for (const fileName of rktFiles) {
        const rktPath = path.join(rktDir, fileName);
        const jsonFileName = fileName.replace(".rkt", ".json");
        const jsonPath = path.join(jsonDir, jsonFileName);

        try {
            const result = processRktFile(rktPath, jsonPath);
            console.log(
                `    ✓ Extracted ${result.textCount} text(s) -> ${jsonFileName}`
            );
            totalTexts += result.textCount;
            successCount++;
        } catch (error: any) {
            console.error(`    ✗ Failed to process ${fileName}: ${error.message}`);
            failCount++;
        }
    }

    // Print summary
    console.log();
    console.log("========================================");
    console.log("  Summary");
    console.log("========================================");
    console.log(`Total files processed: ${rktFiles.length}`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log(`Total texts extracted: ${totalTexts}`);
    console.log();

    if (failCount > 0) {
        throw new Error(`${failCount} file(s) failed to process`);
    }
}

/**
 * Main function to run the extraction
 */
export function main(): void {
    try {
        extractAllRktFiles();
        console.log("✓ Extraction completed successfully!");
        process.exit(0);
    } catch (error: any) {
        console.error(`✗ Extraction failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.main) {
    main();
}