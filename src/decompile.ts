/**
 * Decompile Japanese MES and MEC files using juice.exe
 * MEC files are temporarily renamed to MES for decompilation
 */

import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import path from "path";
import { execSync } from "node:child_process";

/**
 * Move and rename .rkt files to target directory
 */
function moveRktFiles(sourceDir: string, targetDir: string): number {
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }

    const files = readdirSync(sourceDir).filter((f) =>
        f.endsWith(".MES.rkt") || f.endsWith(".MEC.rkt")
    );

    let moved = 0;

    for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);

        try {
            renameSync(sourcePath, targetPath);
            moved++;
        } catch (err: any) {
            console.error(`Failed moving ${file}: ${err.message}`);
        }
    }

    return moved;
}

/**
 * Decompile MES files normally
 */
function decompileMES(dir: string, juicePath: string): number {
    const mesFiles = readdirSync(dir).filter(f => f.endsWith(".MES"));

    if (mesFiles.length === 0) {
        console.log("No .MES files found");
        return 0;
    }

    console.log(`Decompiling ${mesFiles.length} MES files...`);

    const pattern = path.join(dir, "*.MES");
    execSync(`"${juicePath}" --engine ADV --extraop -df "${pattern}"`, {
        stdio: "inherit"
    });

    return mesFiles.length;
}

/**
 * Decompile MEC files using rename workaround
 */
function decompileMEC(dir: string, juicePath: string): number {
    const mecFiles = readdirSync(dir).filter(f => f.endsWith(".MEC"));

    if (mecFiles.length === 0) {
        console.log("No .MEC files found");
        return 0;
    }

    console.log(`Processing ${mecFiles.length} MEC files (rename workaround)...`);

    let processed = 0;

    for (const file of mecFiles) {
        const mecPath = path.join(dir, file);
        const tempMesName = file.replace(".MEC", ".MES");
        const tempMesPath = path.join(dir, tempMesName);

        try {
            // 1. Rename MEC → MES
            renameSync(mecPath, tempMesPath);

            // 2. Decompile
            execSync(
                `"${juicePath}" --engine ADV --extraop -df "${tempMesPath}"`,
                { stdio: "inherit" }
            );

            // 3. Rename output .MES.rkt → .MEC.rkt
            const mesRkt = tempMesPath + ".rkt";
            const mecRkt = mecPath + ".rkt";

            if (existsSync(mesRkt)) {
                renameSync(mesRkt, mecRkt);
            }

            // 4. Restore original file name
            renameSync(tempMesPath, mecPath);

            processed++;
        } catch (err: any) {
            console.error(`Failed processing ${file}: ${err.message}`);

            // Try restore if something failed
            if (existsSync(tempMesPath) && !existsSync(mecPath)) {
                renameSync(tempMesPath, mecPath);
            }
        }
    }

    return processed;
}

/**
 * Main workflow
 */
export function decompile(
    inputDir: string = path.join(process.cwd(), "data", "JP MES"),
    outputDir: string = path.join(process.cwd(), "data", "JP RKT"),
    juicePath: string = path.join(process.cwd(), "src", "utils", "juice.exe")
): void {

    console.log("========================================");
    console.log("  Decompiling MES and MEC Files");
    console.log("========================================");

    if (!existsSync(inputDir)) {
        throw new Error(`Input directory not found: ${inputDir}`);
    }

    if (!existsSync(juicePath)) {
        throw new Error(`juice.exe not found: ${juicePath}`);
    }

    const mesCount = decompileMES(inputDir, juicePath);
    const mecCount = decompileMEC(inputDir, juicePath);

    const moved = moveRktFiles(inputDir, outputDir);

    console.log("\n========================================");
    console.log("Summary");
    console.log("========================================");
    console.log(`MES files decompiled: ${mesCount}`);
    console.log(`MEC files decompiled: ${mecCount}`);
    console.log(`RKT files moved: ${moved}`);
    console.log("========================================");
}

export function main(): void {
    try {
        decompile();
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