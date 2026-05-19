const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'pages');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    
    // We only care about files that have exportToPDF
    if (!content.includes('const exportToPDF = () => {') && !content.includes('exportToPDF = () => {')) return;

    let changed = false;

    // Replace the old header if it wasn't replaced
    // The old header starts with doc.setFillColor(...) and ends with doc.text(`Generated: ${date}`...)
    // Or it might be the new header which we want to ensure doesn't overlap.
    
    if (!content.includes('// Modern PDF Header') && !content.includes('// Modern Header for Reports')) {
        const oldHeaderRegex = /doc\.setFillColor\([\d,\s]+\);[\s\S]*?doc\.text\(`Generated: \$\{date\}`[\s\S]*?\);/g;
        
        content = content.replace(oldHeaderRegex, (match) => {
            const titleMatch = match.match(/doc\.text\("([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : "Report";
            changed = true;
            
            return `// Modern PDF Header
    doc.setFillColor(33, 37, 41);
    doc.rect(0, 0, 210, 28, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Dump & Drop", 14, 18);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("${title}", 196, 18, { align: "right" });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(\`Generated on: \${date}\`, 14, 38);
    
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, 43, 196, 43);`;
        });
    }

    // Now fix Y-offsets globally for "Statistics Summary" and "let startY = 30;"
    // We want the text to be at 52, and startY to be 58.
    
    if (content.includes('doc.text("Statistics Summary"')) {
        content = content.replace(/doc\.text\("Statistics Summary", 14, (30|35|42|52)\);/g, 'doc.text("Statistics Summary", 14, 52);');
        changed = true;
    }
    
    // For let startY = 30; 
    if (content.includes('let startY = 30;')) {
        content = content.replace(/let startY = 30;/g, 'let startY = 58;');
        changed = true;
    }

    // For inline startY in autoTable:
    // If we have doc.text("Statistics Summary", 14, 52); then the next autoTable should have startY: 58
    // We already fixed this in AllBookings, AllRides, etc.
    // Let's do a safe replace for GoodsDelivery, Rentals, CabRides if they use `startY: 30` or something.
    content = content.replace(/startY: 30/g, 'startY: 58');
    content = content.replace(/startY: 35/g, 'startY: 58');
    content = content.replace(/startY: 42/g, 'startY: 58');
    
    // Fix headStyles for old colors
    content = content.replace(/headStyles: \{ fillColor: \[(41,\s*128,\s*185|41,\s*98,\s*255)\], textColor: 255(.*?) \}/g, 'headStyles: { fillColor: [33, 37, 41], textColor: 255, fontStyle: "bold", halign: "center" }');
    
    // We might have set startY: 58 for the SECOND table if it was hardcoded? No, second table usually uses `doc.lastAutoTable.finalY + 10`.
    
    // Check if we changed anything
    if (content !== fs.readFileSync(filepath, 'utf-8')) {
        fs.writeFileSync(filepath, content, 'utf-8');
        console.log(`Updated layout in ${path.basename(filepath)}`);
    }
}

fs.readdirSync(directory).forEach(file => {
    if (file.endsWith('.jsx')) {
        processFile(path.join(directory, file));
    }
});
console.log('Done');
