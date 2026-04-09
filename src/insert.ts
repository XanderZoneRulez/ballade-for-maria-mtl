/**
 * Insert translated text into RKT files
 * Reads JP RKT files and replaces Japanese text with English translations from JSON files
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import path from "path";

interface Message {
    message: string;
    name?: string;
}

/**
 * Reconstruct the original text from a Message object
 * If it has a name, returns "「name」　message"
 * Otherwise, returns just the message
 */
function reconstructText(messageObj: Message, isEn: boolean = false): string {
    if (messageObj.name) {
        const { name, message } = messageObj;
        return isEn ? `[${name}] ${message}` : `「${name}」　${message}`;
    }
    return messageObj.message;
}

/**
 * Read and parse a JSON file
 */
function readJsonFile(jsonPath: string): Message[] {
    try {
        const content = readFileSync(jsonPath, "utf-8");
        return JSON.parse(content) as Message[];
    } catch (error: any) {
        throw new Error(`Failed to read JSON file ${jsonPath}: ${error.message}`);
    }
}

/**
 * Escape special characters in RKT string literals
 * Handles double quotes and backslashes
 */
function escapeRktString(text: string): string {
    // Escape backslashes first, then escape double quotes
    return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Replace Japanese text with English text in RKT content
 * Also changes function name from 'text' to 'str'
 */
function replaceTextInRkt(
    rktContent: string,
    jpMessages: Message[],
    enMessages: Message[]
): { newContent: string, replacedCount: number } {
    const normalizedContent = rktContent.replace(
        /\((text|str)\s+[\s\S]*?\)/g,
        (match) => match.replace(/\s*\n\s*/g, ' ')
    );
    let newContent = normalizedContent;
    const textPattern = /\((?:text|str)\s+"([^"]*)"(?:\s+'br)?\)/g;

    let match;
    let idx = 0;
    let replacedCount = 0;
    while ((match = textPattern.exec(normalizedContent)) !== null) {
        const extractedText = match[1];
        if (extractedText && extractedText.trim().length > 0) {
            const jpText = reconstructText(jpMessages[idx] as Message);
            const enText = reconstructText(enMessages[idx] as Message, true);
            if (jpText !== extractedText) {
                throw new Error(`Text mismatch at index ${idx}: ${jpText} !== ${extractedText}`);
            } else {
                const original = match[0];
                let replacement = original.replace('text', 'str').replace(extractedText, escapeRktString(enText));
                const indent = getIndent(normalizedContent, original);
                replacement = wrapRktString(replacement, indent);
                newContent = newContent.replace(original, replacement);
                idx += 1;
                replacedCount += 1;
            }
        }
    }

    return { newContent, replacedCount };
}

function getIndent(content: string, text: string): string {
    const line = content.split('\n').find((line) => line.includes(text));
    if (line) {
        // Extract leading whitespace from the line
        const match = line.match(/^(\s*)/) || [];
        return match ? match[1] || '' : '';
    } else {
        return '';
    }
}

/**
 * Wrap RKT string according to game text box rules
 * Handles line wrapping, 'br insertion, and collision prevention
 */
function wrapRktString(str: string, indent: string): string {
    // Extract the content from (str "...") or (str "..." 'br)
    const strMatch = str.match(/^\(str\s+"([^"]*)"(?:\s+'br)?\)$/);
    if (!strMatch) {
        return str;
    }

    const content = strMatch[1] || "";

    // If content is 61 characters or less, return as-is
    if (content.length <= 61) {
        return str;
    }

    // Split content into lines according to game rules
    const lines = splitContentIntoLines(content);

    if (lines.length > 3) {
        console.log(`Warning: content exceeds 3 lines: \n${content}`)
    }

    // Format each line as (str "...") with appropriate 'br and indent
    const formattedLines = lines.map((line, index) =>
        formatLine(line, index, indent)
    );

    return formattedLines.join('\n');
}

/**
 * Split content into lines according to game text box rules
 * - Max 61 chars per line
 */
function splitContentIntoLines(content: string): string[] {
    const lines: string[] = [];
    let remaining = content;
    let lineIndex = 0;
    const maxLength = 61;

    while (remaining.length > 0) {

        if (remaining.length <= maxLength) {
            // Last line - take all remaining content
            lines.push(remaining);
            break;
        }

        // Find the last space before maxLength to avoid splitting words
        const splitPos = findSplitPosition(remaining, maxLength);
        lines.push(remaining.substring(0, splitPos));
        remaining = remaining.substring(splitPos);
        lineIndex++;
    }

    return lines;
}

/**
 * Find the best position to split text
 * Returns the position of the last space before maxLength
 */
function findSplitPosition(text: string, maxLength: number): number {
    const lastSpace = text.lastIndexOf(' ', maxLength);
    return lastSpace > 0 ? lastSpace + 1 : maxLength;
}

/**
 * Format a single line as (str "...") with appropriate 'br and indent
 * - Lines < 61 chars: add 'br
 * - Lines = 61 chars: no 'br
 * - First line: no indent
 * - Subsequent lines: add indent
 */
function formatLine(line: string, index: number, indent: string): string {
    const needsBr = line.length < 61;
    const prefix = index === 0 ? '' : indent;
    const brSuffix = needsBr ? " 'br" : '';

    return `${prefix}(str "${line}"${brSuffix})`;
}

/**
 * Process a single RKT file
 */
function processRktFile(
    jpRktPath: string,
    jpJsonPath: string,
    enJsonPath: string,
    enRktPath: string
): { fileName: string; replacedCount: number; skipped: boolean } {
    console.log(`  Processing: ${path.basename(jpRktPath)}`);

    // Check if EN JSON exists
    if (!existsSync(enJsonPath)) {
        // No translation available, skip this file
        console.log(`    ⚠ No EN JSON found, skipped`);
        return {
            fileName: path.basename(jpRktPath),
            replacedCount: 0,
            skipped: true,
        };
    }

    // Read JP RKT file
    const rktContent = readFileSync(jpRktPath, "utf-8");

    // Read JP and EN JSON files
    const jpMessages = readJsonFile(jpJsonPath);
    const enMessages = readJsonFile(enJsonPath);

    if (jpMessages.length !== enMessages.length) {
        throw new Error(`JP and EN JSON files have different lengths: ${jpJsonPath} (${jpMessages.length}) vs ${enJsonPath} (${enMessages.length})`);
    }

    // Replace text in RKT content
    const { newContent, replacedCount } = replaceTextInRkt(rktContent, jpMessages, enMessages);

    // Ensure output directory exists
    const outputDir = path.dirname(enRktPath);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    // Write the modified RKT file
    writeFileSync(enRktPath, newContent, "utf-8");

    return {
        fileName: path.basename(jpRktPath),
        replacedCount,
        skipped: false,
    };
}

/**
 * Insert English text into all RKT files
 * @param jpRktDir Source directory with JP RKT files (defaults to data/JP RKT)
 * @param jpJsonDir Directory with JP JSON files (defaults to data/JP JSON)
 * @param enJsonDir Directory with EN JSON files (defaults to data/EN JSON)
 * @param enRktDir Output directory for EN RKT files (defaults to data/EN RKT)
 */
export function insertAllRktFiles(
    jpRktDir: string = path.join(process.cwd(), "data", "JP RKT"),
    jpJsonDir: string = path.join(process.cwd(), "data", "JP JSON"),
    enJsonDir: string = path.join(process.cwd(), "data", "EN JSON"),
    enRktDir: string = path.join(process.cwd(), "data", "EN RKT")
): void {
    console.log("========================================");
    console.log("  Inserting English Text into RKT Files");
    console.log("========================================");
    console.log(`JP RKT directory: ${jpRktDir}`);
    console.log(`JP JSON directory: ${jpJsonDir}`);
    console.log(`EN JSON directory: ${enJsonDir}`);
    console.log(`EN RKT directory: ${enRktDir}`);
    console.log();

    // Check if JP RKT directory exists
    if (!existsSync(jpRktDir)) {
        throw new Error(`JP RKT directory does not exist: ${jpRktDir}`);
    }

    // Create EN RKT directory if it doesn't exist
    if (!existsSync(enRktDir)) {
        mkdirSync(enRktDir, { recursive: true });
        console.log(`Created output directory: ${enRktDir}`);
    }

    // Get all RKT files
    const rktFiles = readdirSync(jpRktDir).filter((f) => f.endsWith(".rkt"));

    if (rktFiles.length === 0) {
        console.log("No .rkt files found in JP RKT directory");
        return;
    }

    console.log(`Found ${rktFiles.length} RKT files`);
    console.log();

    let totalReplaced = 0;
    let totalSkipped = 0;
    let successCount = 0;
    let failCount = 0;

    // Process each RKT file
    for (const fileName of rktFiles) {
        const jpRktPath = path.join(jpRktDir, fileName);
        const baseName = fileName.replace(".rkt", "");
        const jpJsonPath = path.join(jpJsonDir, `${baseName}.json`);
        const enJsonPath = path.join(enJsonDir, `${baseName}.json`);
        const enRktPath = path.join(enRktDir, fileName);

        try {
            const result = processRktFile(
                jpRktPath,
                jpJsonPath,
                enJsonPath,
                enRktPath
            );

            if (result.skipped) {
                totalSkipped++;
            } else {
                console.log(
                    `    ✓ Replaced ${result.replacedCount} text(s) -> ${fileName}`
                );
                totalReplaced += result.replacedCount;
                successCount++;
            }
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
    console.log(`Total files found: ${rktFiles.length}`);
    console.log(`✓ Successfully processed: ${successCount}`);
    console.log(`⚠ Skipped (no EN JSON): ${totalSkipped}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log(`Total texts replaced: ${totalReplaced}`);
    console.log();

    if (failCount > 0) {
        throw new Error(`${failCount} file(s) failed to process`);
    }
}

/**
 * Main function to run the insertion
 */
export function main(): void {
    try {
        insertAllRktFiles();
        console.log("✓ Insertion completed successfully!");
        process.exit(0);
    } catch (error: any) {
        console.error(`✗ Insertion failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.main) {
    main();
}
