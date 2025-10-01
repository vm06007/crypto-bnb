import { cp, rm, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { spawnSync } from 'bun';

async function buildExtension() {
    const rootDir = import.meta.dir;
    const distDir = join(rootDir, 'dist/extension');

    console.log('🏗️  Building OnlyBnB extension...');

    // Clean dist directory
    if (existsSync(distDir)) {
        await rm(distDir, { recursive: true });
    }
    await mkdir(distDir, { recursive: true });

    // Build JavaScript files
    const files = [
        { src: 'extension/content/content.ts', out: 'content.js' },
        { src: 'extension/popup/popup-simple.tsx', out: 'popup.js' },
        { src: 'extension/background/background.ts', out: 'background.js' },
        { src: 'extension/offscreen/offscreen.ts', out: 'offscreen.js' },
    ];

    for (const file of files) {
        const result = spawnSync(['bun', 'build', join(rootDir, file.src), '--outfile', join(distDir, file.out), '--target', 'browser']);
        if (result.exitCode !== 0) {
            console.error(`Failed to build ${file.src}:`, result.stderr.toString());
            process.exit(1);
        }
    }

    // Copy static files
    const copyPromises = [
        cp(join(rootDir, 'extension/manifest.json'), join(distDir, 'manifest.json')),
        cp(join(rootDir, 'extension/popup/popup.html'), join(distDir, 'popup.html')),
        cp(join(rootDir, 'extension/popup/popup.css'), join(distDir, 'popup.css')),
        cp(join(rootDir, 'extension/content/content.css'), join(distDir, 'content.css')),
        cp(join(rootDir, 'extension/offscreen/offscreen.html'), join(distDir, 'offscreen.html')),
        cp(join(rootDir, 'extension/assets'), join(distDir, 'assets'), { recursive: true }),
        cp(join(rootDir, 'extension/inject'), join(distDir, 'inject'), { recursive: true }),
    ];

    await Promise.all(copyPromises);

    // Create placeholder icons if they don't exist
    const iconSizes = ['16', '32', '48', '128'];
    for (const size of iconSizes) {
        const iconPath = join(distDir, `assets/icon${size}.png`);
        if (!existsSync(iconPath)) {
            // Create a simple placeholder icon using canvas
            console.log(`⚠️  Missing icon${size}.png - You'll need to generate this`);
        }
    }

    console.log('✅ Extension built successfully to dist/extension/');
    console.log('📦 Ready to load in Chrome at chrome://extensions/');
}

// Run the build
buildExtension().catch(console.error);
