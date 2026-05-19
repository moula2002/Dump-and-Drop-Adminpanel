const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'pages');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    let changed = false;

    // 1. Move "Statistics Summary" down to Y = 52
    if (content.includes('doc.text("Statistics Summary", 14, 30);')) {
        content = content.replace('doc.text("Statistics Summary", 14, 30);', 'doc.text("Statistics Summary", 14, 52);');
        changed = true;
    }
    if (content.includes('doc.text("Statistics Summary", 14, 35);')) {
        content = content.replace('doc.text("Statistics Summary", 14, 35);', 'doc.text("Statistics Summary", 14, 52);');
        changed = true;
    }

    // 2. Move the first autoTable startY down to 58
    // We need to be careful to only replace the FIRST startY: 35 or startY: 42 that appears in exportToPDF
    // Since autoTable for stats is always the first one, we can replace the first occurrence of `startY: 35` or `startY: 42` after `Statistics Summary`
    
    // Instead of complex regex, let's just do:
    if (changed) {
        // Find where "Statistics Summary" is
        const summaryIndex = content.indexOf('doc.text("Statistics Summary"');
        if (summaryIndex !== -1) {
            // Find the next startY:
            const startYIndex35 = content.indexOf('startY: 35', summaryIndex);
            const startYIndex42 = content.indexOf('startY: 42', summaryIndex);
            const startYIndex30 = content.indexOf('startY: 30', summaryIndex);
            
            let targetIndex = -1;
            let targetString = '';
            
            if (startYIndex35 !== -1 && (startYIndex35 < startYIndex42 || startYIndex42 === -1)) {
                targetIndex = startYIndex35;
                targetString = 'startY: 35';
            } else if (startYIndex42 !== -1) {
                targetIndex = startYIndex42;
                targetString = 'startY: 42';
            } else if (startYIndex30 !== -1) {
                targetIndex = startYIndex30;
                targetString = 'startY: 30';
            }

            if (targetIndex !== -1) {
                content = content.slice(0, targetIndex) + 'startY: 58' + content.slice(targetIndex + targetString.length);
            }
        }
    }

    if (changed) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`Fixed layout in ${path.basename(filepath)}`);
    }
}

fs.readdirSync(directory).forEach(file => {
    if (file.endsWith('.jsx')) {
        processFile(path.join(directory, file));
    }
});
console.log('Done');
