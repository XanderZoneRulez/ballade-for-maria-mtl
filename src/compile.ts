/**
 * Compile English RKT files to MES format
 * Uses juice.exe to compile RKT files and organizes the output
 */

import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import path from "path";
import { execSync } from "node:child_process";

/**
 * Move and rename .rkt.mes files to .MES files
 * @param sourceDir Source directory containing .rkt.mes files
 * @param targetDir Target directory for .MES files
 */
function moveAndRenameMesFiles(
    sourceDir: string,
    targetDir: string
): { movedCount: number } {
    console.log(`  Moving .rkt.mes files to ${targetDir}...`);

    // Ensure target directory exists
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
        console.log(`  Created directory: ${targetDir}`);
    }

    // Get all .rkt.mes files
    const files = readdirSync(sourceDir).filter((f) => f.endsWith(".rkt.mes"));

    if (files.length === 0) {
        console.log("  No .rkt.mes files found");
        return { movedCount: 0 };
    }

    let movedCount = 0;

    // Move and rename each file
    for (const fileName of files) {
        const sourcePath = path.join(sourceDir, fileName);
        
        // Extract base name: remove .rkt.mes extension
        // e.g., "END_A.rkt.mes" -> "END_A"
        const baseName = fileName.replace(".rkt.mes", "");
        const targetFileName = baseName;
        const targetPath = path.join(targetDir, targetFileName);

        try {
            renameSync(sourcePath, targetPath);
            movedCount++;
        } catch (error: any) {
            console.error(`    ✗ Failed to move ${fileName}: ${error.message}`);
        }
    }

    return { movedCount };
}

/**
 * Compile RKT files using juice.exe
 * @param rktDir Directory containing RKT files
 * @param juicePath Path to juice.exe
 */
function compileRktFiles(
    rktDir: string,
    juicePath: string
): void {
    console.log(`  Compiling RKT files in ${rktDir}...`);

    // Build juice command
    const pattern = path.join(rktDir, "*.rkt");
    const command = `"${juicePath}" --engine ADV --extraop -cf "${pattern}"`;

    try {
        execSync(command, { stdio: "inherit" });
        console.log("  ✓ Compilation completed");
    } catch (error: any) {
        throw new Error(`Compilation failed: ${error.message}`);
    }
}

/**
 * Main compilation workflow
 * @param rktDir Directory containing RKT files (defaults to data/EN RKT)
 * @param mesDir Output directory for MES files (defaults to data/EN MES)
 * @param juicePath Path to juice.exe (defaults to src/utils/juice.exe)
 */
export function compile(
    rktDir: string = path.join(process.cwd(), "data", "EN RKT"),
    mesDir: string = path.join(process.cwd(), "data", "EN MES"),
    juicePath: string = path.join(process.cwd(), "src", "utils", "juice.exe")
): void {
    console.log("========================================");
    console.log("  Compiling English RKT Files");
    console.log("========================================");
    console.log(`RKT directory: ${rktDir}`);
    console.log(`MES directory: ${mesDir}`);
    console.log(`Juice executable: ${juicePath}`);
    console.log();

    // Check if RKT directory exists
    if (!existsSync(rktDir)) {
        throw new Error(`RKT directory does not exist: ${rktDir}`);
    }

    // Check if juice.exe exists
    if (!existsSync(juicePath)) {
        throw new Error(`juice.exe not found: ${juicePath}`);
    }

    // Get RKT files count
    const rktFiles = readdirSync(rktDir).filter((f) => f.endsWith(".rkt"));
    if (rktFiles.length === 0) {
        console.log("No .rkt files found in source directory");
        return;
    }
    console.log(`Found ${rktFiles.length} RKT files`);
    console.log();

    // Step 1: Compile RKT files
    compileRktFiles(rktDir, juicePath);
    console.log();

    // Step 2: Move and rename .rkt.mes files to .MES files
    const result = moveAndRenameMesFiles(rktDir, mesDir);
    console.log();

    // Print summary
    console.log("========================================");
    console.log("  Summary");
    console.log("========================================");
    console.log(`Total RKT files: ${rktFiles.length}`);
    console.log(`Files moved to MES directory: ${result.movedCount}`);
    console.log();
}

/**
 * Main function to run the compilation
 */
export function main(): void {
    try {
        compile();
        console.log("✓ Compilation completed successfully!");
        process.exit(0);
    } catch (error: any) {
        console.error(`✗ Compilation failed: ${error.message}`);
        process.exit(1);
    }
}

// Run if executed directly
if (import.meta.main) {
    main();
}
