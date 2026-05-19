const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'pages');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    if (!content.includes('const exportToPDF = () => {') && !content.includes('exportToPDF = () => {')) return;

    let changed = false;

    // 1. Replace the Header Section
    // Currently it looks like `// Modern PDF Header ... doc.line(14, 48, 196, 48);` or `43`
    // We will find from `// Modern PDF Header` up to `doc.line(...)` or `yPos = 56;`
    
    const headerRegex = /\/\/\s*Modern (PDF )?Header[\s\S]*?doc\.line\([^)]+\);(\s*yPos\s*=\s*\d+;)?/g;
    
    content = content.replace(headerRegex, (match) => {
        changed = true;
        
        let title = "Report";
        const titleMatch = match.match(/doc\.text\((?:\`|\")([^\`\"]+)(?:\`|\"), 196/);
        if (titleMatch) title = titleMatch[1];
        // Handle template literals like `${reportType.toUpperCase()} REPORT`
        if (title.includes('${')) {
            title = '`${reportType.toUpperCase()} REPORT`';
        } else {
            title = `"${title}"`;
        }

        const isReport = match.includes('yPos =');

        let newHeader = `// Premium PDF Header
    doc.setFillColor(79, 70, 229); // Modern Indigo
    doc.rect(0, 0, 210, 26, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Dump & Drop", 14, 18);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(${title}, 196, 18, { align: "right" });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);`;

        if (isReport) {
            newHeader += `
    doc.text(\`Period: \${startDate} to \${endDate}\`, 14, 38);
    doc.text(\`Generated on: \${new Date().toLocaleString()}\`, 14, 44);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);
    yPos = 56;`;
        } else {
            newHeader += `
    doc.text(\`Generated on: \${date}\`, 14, 36);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 196, 42);`;
        }
        
        return newHeader;
    });

    // 2. Adjust "Statistics Summary" and startY for non-report files
    if (content.includes('doc.text("Statistics Summary"')) {
        content = content.replace(/doc\.text\("Statistics Summary", 14, \d+\);/g, 'doc.text("Statistics Summary", 14, 52);');
        changed = true;
    }
    content = content.replace(/let startY = \d+;/g, 'let startY = 56;');

    // Find the first autoTable which is the stats table (theme: "plain")
    // and make it look premium.
    content = content.replace(/theme:\s*"plain",[\s\S]*?columnStyles:\s*\{[^}]+\},?/g, (match) => {
        // We will just upgrade the plain theme to grid with nice borders
        return `theme: "grid",
            styles: { fontSize: 9, cellPadding: 4, lineColor: [230, 230, 230], lineWidth: 0.1, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [252, 252, 252] },
            columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229] }
            }`;
    });

    // 3. Fix the startY of the stats autoTable to 56
    // Only the first one!
    let foundFirst = false;
    content = content.replace(/startY:\s*\d+,/g, (match) => {
        if (!foundFirst && !match.includes('doc.lastAutoTable.finalY')) {
            foundFirst = true;
            return 'startY: 56,';
        }
        return match;
    });

    // 4. Update the Data Table (second autoTable)
    // Replace the dark gray headStyles with Indigo
    content = content.replace(/headStyles:\s*\{\s*fillColor:\s*\[33,\s*37,\s*41\].*?\}/g, 
        'headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold", halign: "center" }');

    if (changed) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`Perfected ${path.basename(filepath)}`);
    }
}

fs.readdirSync(directory).forEach(file => {
    if (file.endsWith('.jsx')) {
        processFile(path.join(directory, file));
    }
});
console.log('Done');
