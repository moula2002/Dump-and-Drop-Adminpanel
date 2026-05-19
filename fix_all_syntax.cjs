const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'pages');

function processFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf-8');
    let changed = false;

    // This regex looks for the broken columnStyles pattern:
    // columnStyles: {
    //     0: { fontStyle: "bold", textColor: [30, 30, 30] },
    //     1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229] }
    // }
    // followed by some spaces and `1: { cellWidth: 100 },` or `1: { halign: "right", cellWidth: 70 }`
    // and then `},` or `}`
    
    const badRegex = /columnStyles:\s*\{\s*0:\s*\{\s*fontStyle:\s*"bold",\s*textColor:\s*\[30,\s*30,\s*30\]\s*\},\s*1:\s*\{\s*halign:\s*"right",\s*fontStyle:\s*"bold",\s*textColor:\s*\[79,\s*70,\s*229\]\s*\}\s*\}\s*1:\s*\{\s*(.*?)\s*\},\s*\},?/g;
    
    content = content.replace(badRegex, (match, inner) => {
        changed = true;
        return `columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229], ${inner} }
            }`;
    });

    // Handle RevenueReports specifically which has slightly different spacing/endings
    // }
    //     1: { halign: "right", cellWidth: 70 }
    // }
    const revRegex = /columnStyles:\s*\{\s*0:\s*\{\s*fontStyle:\s*"bold",\s*textColor:\s*\[30,\s*30,\s*30\]\s*\},\s*1:\s*\{\s*halign:\s*"right",\s*fontStyle:\s*"bold",\s*textColor:\s*\[79,\s*70,\s*229\]\s*\}\s*\}\s*1:\s*\{\s*halign:\s*"right",\s*cellWidth:\s*70\s*\}\s*\}/g;
    
    content = content.replace(revRegex, () => {
        changed = true;
        return `columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229], cellWidth: 70 }
            }`;
    });
    
    // GoodsDelivery fix
    const goodsRegex = /columnStyles:\s*\{\s*0:\s*\{\s*fontStyle:\s*"bold",\s*textColor:\s*\[30,\s*30,\s*30\]\s*\},\s*1:\s*\{\s*halign:\s*"right",\s*fontStyle:\s*"bold",\s*textColor:\s*\[79,\s*70,\s*229\]\s*\}\s*\}\s*\},/g;
    
    content = content.replace(goodsRegex, () => {
        changed = true;
        return `columnStyles: {
                0: { fontStyle: "bold", textColor: [30, 30, 30] },
                1: { halign: "right", fontStyle: "bold", textColor: [79, 70, 229] }
            }`;
    });

    if (changed) {
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
