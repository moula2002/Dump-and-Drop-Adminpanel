const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'pages');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    
    // The broken code looks like:
    // columnStyles: {
    //     0: { fontStyle: "bold", textColor: [30, 30, 30] },
    //     1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229] }
    // }
    //     1: { halign: "right", cellWidth: 80 },
    // },
    
    // Let's use a regex that captures from `theme: "grid"` up to `});` for the FIRST autoTable.
    // The first autoTable is the stats table. It starts with `autoTable(doc, {` and ends with `});`
    // We can just match the block `autoTable(doc, { startY: 56, ... });`
    
    const statsTableRegex = /autoTable\(doc, \{\s*startY:\s*56,[\s\S]*?body:\s*statsData,[\s\S]*?\}\);/g;
    
    content = content.replace(statsTableRegex, (match) => {
        // We will just completely rewrite this block, ignoring whatever trailing garbage is there.
        return `autoTable(doc, {
            startY: 56,
            body: statsData,
            theme: "grid",
            styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30], cellWidth: 80 },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229], cellWidth: 80 }
            }
        });`;
    });

    if (content !== fs.readFileSync(filepath, 'utf-8')) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`Fixed syntax in ${path.basename(filepath)}`);
    }
}

fs.readdirSync(directory).forEach(file => {
    if (file.endsWith('.jsx')) {
        processFile(path.join(directory, file));
    }
});
console.log('Done');
