const fs = require('fs');
const path = require('path');

// Function to extract all classes from HTML files
function extractClassesFromHTML(directory) {
    const classes = new Set();
    const files = fs.readdirSync(directory, { withFileTypes: true });

    files.forEach(file => {
        if (file.isDirectory()) {
            const subFiles = fs.readdirSync(path.join(directory, file.name));
            subFiles.forEach(subFile => {
                if (subFile.endsWith('.html')) {
                    const content = fs.readFileSync(path.join(directory, file.name, subFile), 'utf8');
                    const classMatches = content.match(/class="([^"]*)"/g) || [];
                    classMatches.forEach(match => {
                        const classNames = match.replace(/class="([^"]*)"/, '$1').split(' ');
                        classNames.forEach(className => {
                            if (className.trim()) {
                                classes.add(className.trim());
                            }
                        });
                    });
                }
            });
        }
    });

    // Also check index.html
    const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    const indexMatches = indexContent.match(/class="([^"]*)"/g) || [];
    indexMatches.forEach(match => {
        const classNames = match.replace(/class="([^"]*)"/, '$1').split(' ');
        classNames.forEach(className => {
            if (className.trim()) {
                classes.add(className.trim());
            }
        });
    });

    // Also check App.jsx for any classes
    const appContent = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf8');
    const appMatches = appContent.match(/className="([^"]*)"/g) || [];
    appMatches.forEach(match => {
        const classNames = match.replace(/className="([^"]*)"/, '$1').split(' ');
        classNames.forEach(className => {
            if (className.trim()) {
                classes.add(className.trim());
            }
        });
    });

    return classes;
}

// Function to parse CSS and extract only used rules
function cleanCSS(cssPath, usedClasses) {
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    const lines = cssContent.split('\n');
    const cleanedLines = [];
    let inRule = false;
    let currentRule = [];
    let braceCount = 0;
    let keepRule = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line starts a new rule
        if (!inRule && line.includes('{')) {
            inRule = true;
            currentRule = [line];
            braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

            // Check if this rule should be kept
            keepRule = false;
            const selector = line.split('{')[0].trim();

            // Keep rules that:
            // 1. Are for used classes
            // 2. Are for elements (no class selector)
            // 3. Are keyframes, media queries, or other at-rules
            // 4. Are pseudo-classes/elements
            // 5. Are for IDs used in components

            if (selector.startsWith('@') ||
                selector.startsWith(':root') ||
                selector.includes('::') ||
                selector.match(/^(html|body|main|header|footer|section|div|p|a|img|ul|li|h[1-6])/)) {
                keepRule = true;
            } else {
                // Check if any used class is in this selector
                for (const className of usedClasses) {
                    if (selector.includes('.' + className)) {
                        keepRule = true;
                        break;
                    }
                }

                // Also check for IDs that might be used
                const idMatches = selector.match(/#[\w-]+/g) || [];
                const usedIds = ['message-box', 'message-box__text', 'message-box__close', 'main-new-faq', 'cryptoFlowMobile', 'step1Mobile', 'step2Mobile', 'step3Mobile', 'mobile-mockup'];
                for (const id of idMatches) {
                    if (usedIds.includes(id.substring(1))) {
                        keepRule = true;
                        break;
                    }
                }
            }
        } else if (inRule) {
            currentRule.push(line);
            braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

            if (braceCount === 0) {
                // End of rule
                if (keepRule) {
                    cleanedLines.push(...currentRule);
                }
                inRule = false;
                currentRule = [];
            }
        } else if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim() === '') {
            // Keep comments and empty lines for readability
            cleanedLines.push(line);
        }
    }

    return cleanedLines.join('\n');
}

// Main execution
console.log('Extracting used CSS classes...');
const usedClasses = extractClassesFromHTML(path.join(__dirname, 'src/components'));
console.log(`Found ${usedClasses.size} unique classes used in components`);

console.log('Cleaning app.css...');
const cleanedCSS = cleanCSS(path.join(__dirname, 'public/files/app.css'), usedClasses);

// Write cleaned CSS
const outputPath = path.join(__dirname, 'public/files/app-cleaned.css');
fs.writeFileSync(outputPath, cleanedCSS);

const originalSize = fs.statSync(path.join(__dirname, 'public/files/app.css')).size;
const newSize = fs.statSync(outputPath).size;
const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

console.log(`\n✅ Cleaned CSS saved to: public/files/app-cleaned.css`);
console.log(`📊 Size reduction: ${(originalSize / 1024).toFixed(1)}KB → ${(newSize / 1024).toFixed(1)}KB (${reduction}% smaller)`);
console.log(`\n💡 To use the cleaned CSS, update index.html to reference app-cleaned.css instead of app.css`);

