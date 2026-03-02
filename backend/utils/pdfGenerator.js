import PDFDocument from 'pdfkit';

// Generate Payment Receipt PDF
export const generatePaymentReceiptPDF = (paymentData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('LUCKY DRAW', { align: 'center' });
      doc.fontSize(16).font('Helvetica').text('Payment Receipt', { align: 'center' });
      doc.moveDown();

      // Line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Receipt Details
      doc.fontSize(12).font('Helvetica-Bold').text('Receipt Number: ', { continued: true });
      doc.font('Helvetica').text(paymentData.receiptNumber);
      
      doc.font('Helvetica-Bold').text('Date: ', { continued: true });
      doc.font('Helvetica').text(new Date(paymentData.createdAt).toLocaleDateString());
      
      doc.moveDown();

      // User Details
      doc.font('Helvetica-Bold').text('Customer Details:', { underline: true });
      doc.font('Helvetica').text(`Name: ${paymentData.userName}`);
      doc.text(`Contact: ${paymentData.contactNumber}`);
      doc.text(`Email: ${paymentData.email}`);
      
      doc.moveDown();

      // Draw Details
      doc.font('Helvetica-Bold').text('Draw Details:', { underline: true });
      doc.font('Helvetica').text(`Draw Name: ${paymentData.drawName}`);
      doc.text(`Grand Prize: ${paymentData.grandPrize}`);
      
      doc.moveDown();

      // Payment Details
      doc.font('Helvetica-Bold').text('Payment Details:', { underline: true });
      doc.font('Helvetica').text(`Payment Method: ${paymentData.paymentMethod.toUpperCase()}`);
      doc.text(`Number of Tokens: ${paymentData.numberOfTokens}`);
      doc.text(`Token Price: Rs ${paymentData.tokenPrice}`);
      doc.text(`Total Amount: Rs ${paymentData.totalAmount}`);
      
      if (paymentData.discountApplied > 0) {
        doc.text(`Discount Applied: Rs ${paymentData.discountApplied}`);
      }
      
      doc.font('Helvetica-Bold').text(`Final Amount: Rs ${paymentData.finalAmount}`);
      
      doc.moveDown();

      // Tokens Assigned
      if (paymentData.tokens && paymentData.tokens.length > 0) {
        doc.font('Helvetica-Bold').text('Tokens Assigned:', { underline: true });
        doc.font('Helvetica').text(paymentData.tokens.join(', '));
      }

      doc.moveDown(2);

      // Footer
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(10).text('Thank you for participating!', { align: 'center' });
      doc.text('Good Luck!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Token Receipt PDF
export const generateTokenReceiptPDF = (tokenData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A6' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(18).font('Helvetica-Bold').text('LUCKY DRAW', { align: 'center' });
      doc.fontSize(12).text('Token Receipt', { align: 'center' });
      doc.moveDown();

      // Token Number (Large)
      doc.fontSize(48).font('Helvetica-Bold').text(`#${tokenData.tokenNumber}`, { align: 'center' });
      doc.moveDown();

      // Details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Draw: ${tokenData.drawName}`, { align: 'center' });
      doc.text(`Owner: ${tokenData.userName}`, { align: 'center' });
      doc.text(`Price: Rs ${tokenData.price}`, { align: 'center' });
      doc.text(`Date: ${new Date(tokenData.createdAt).toLocaleDateString()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Draw Report PDF
export const generateDrawReportPDF = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('LUCKY DRAW REPORT', { align: 'center' });
      doc.fontSize(14).text(reportData.drawName, { align: 'center' });
      doc.moveDown();

      // Draw Statistics
      doc.fontSize(12).font('Helvetica-Bold').text('Draw Statistics:', { underline: true });
      doc.font('Helvetica');
      doc.text(`Total Tokens: ${reportData.totalTokens}`);
      doc.text(`Tokens Sold: ${reportData.tokensSold}`);
      doc.text(`Token Price: Rs ${reportData.tokenPrice}`);
      doc.text(`Total Revenue: Rs ${reportData.totalRevenue}`);
      doc.text(`Total Participants: ${reportData.totalParticipants}`);
      doc.moveDown();

      // Winners
      if (reportData.winners && reportData.winners.length > 0) {
        doc.font('Helvetica-Bold').text('Winners:', { underline: true });
        doc.font('Helvetica');
        
        reportData.winners.forEach((winner, index) => {
          doc.text(`${index + 1}. Token #${winner.tokenNumber} - ${winner.userName} - ${winner.prize}`);
        });
      }

      doc.moveDown(2);

      // Footer
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Winners List PDF
export const generateWinnersListPDF = (winnersData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('WINNERS LIST', { align: 'center' });
      doc.fontSize(14).text(winnersData.drawName, { align: 'center' });
      doc.moveDown();

      // Grand Prize Winner
      if (winnersData.grandPrizeWinner) {
        doc.fontSize(16).font('Helvetica-Bold').text('🏆 GRAND PRIZE WINNER', { align: 'center' });
        doc.fontSize(12).font('Helvetica');
        doc.text(`Token #${winnersData.grandPrizeWinner.tokenNumber}`, { align: 'center' });
        doc.text(`Winner: ${winnersData.grandPrizeWinner.userName}`, { align: 'center' });
        doc.text(`Prize: ${winnersData.grandPrizeWinner.prize}`, { align: 'center' });
        doc.moveDown();
      }

      // Other Winners
      if (winnersData.otherWinners && winnersData.otherWinners.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Other Winners:', { underline: true });
        doc.moveDown(0.5);

        winnersData.otherWinners.forEach((winner, index) => {
          doc.fontSize(11).font('Helvetica');
          doc.text(`${index + 1}. Token #${winner.tokenNumber} - ${winner.userName}`);
          doc.text(`   Prize: ${winner.prize}`);
          doc.moveDown(0.5);
        });
      }

      doc.moveDown();
      doc.fontSize(10).text(`Draw Date: ${new Date(winnersData.drawDate).toLocaleString()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};