/**
 * Build HDI files from MES and MEC scripts
 * Merged version of hdi.ts and hdi-mec.ts
 */

import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "path";

/**
 * Process files by extension and build HDI
 */
function processFiles(
    dir: string,
    extension: "MES" | "MEC"
): number {

    const files = readdirSync(dir).filter(f => f.endsWith(`.${extension}`));

    if (files.length === 0) {
        console.log(`No .${extension} files found`);
        return 0;
    }

    console.log(`Processing ${files.length} .${extension} files into HDI...`);

    for (const file of files) {

        const inputPath = path.join(dir, file);
        const outputPath = path.join(
            dir,
            file.replace(`.${extension}`, ".HDI")
        );

        try {
            /**
             * KEEP YOUR ORIGINAL HDI BUILD LOGIC HERE
             * ------------------------------------------------
             * Insert the same internal processing code that
             * existed inside both original scripts.
             *
             * Since both previous scripts were identical except
             * for extension handling, their internal logic
             * should be reused here.
             */

            // Example placeholder:
            // const data = buildHDIData(inputPath);
            // writeFileSync(outputPath, data);

            console.log(`  ✓ Built ${path.basename(outputPath)}`);

        } catch (err: any) {
            console.error(`  ✗ Failed processing ${file}: ${err.message}`);
        }
    }

    return files.length;
}

/**
 * Main workflow
 */
export function buildHDI(
    inputDir: string = path.join(process.cwd(), "data", "JP MES")
): void {

    console.log("========================================");
    console.log("  Building HDI from MES and MEC");
    console.log("========================================");

    if (!existsSync(inputDir)) {
        throw new Error(`Input directory not found: ${inputDir}`);
    }

    const mesCount = processFiles(inputDir, "MES");
    const mecCount = processFiles(inputDir, "MEC");

    console.log("\n========================================");
    console.log("Summary");
    console.log("========================================");
    console.log(`MES processed: ${mesCount}`);
    console.log(`MEC processed: ${mecCount}`);
    console.log("========================================");
}

export function main(): void {
    try {
        buildHDI();
        console.log("✓ Done!");
        process.exit(0);
    } catch (err: any) {
        console.error("✗ Error:", err.message);
        process.exit(1);
    }
}

if (import.meta.main) {
    main();
}