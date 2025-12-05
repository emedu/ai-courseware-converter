
export const openPrintableView = (previewElementId: string, pageStyles: string) => {
    const previewNode = document.getElementById(previewElementId);
    if (!previewNode) {
        console.error('Preview element not found!');
        return;
    }

    const content = previewNode.innerHTML;

    let styles = '';
    for (const sheet of Array.from(document.styleSheets)) {
        try {
            if (sheet.cssRules) {
                for (const rule of Array.from(sheet.cssRules)) {
                    styles += rule.cssText;
                }
            }
        } catch (e) {
            console.warn('Cannot read styles from cross-origin stylesheet', e);
        }
    }

    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write('<html><head><title>教材預覽</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(styles);
        printWindow.document.write(pageStyles);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(content);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Wait for images and fonts to load before printing
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            // The window can be closed automatically after print dialog, but it's better to let user close it.
            // printWindow.close(); 
        }, 1000);
    }
};
