import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { requestId } = req.query;
  console.log('[BATCH_QR_API] Received request for ID:', requestId);

  if (!requestId || typeof requestId !== 'string') {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    // First try to find the batch directly (in case a batch ID was passed)
    let batch = await prisma.batch.findUnique({
      where: {
        id: requestId
      }
    });

    // If no batch found, try to find it through the production request
    if (!batch) {
      console.log('[BATCH_QR_API] No batch found directly, checking production request');
      batch = await prisma.batch.findFirst({
        where: {
          productionRequestId: requestId
        }
      });
    }

    if (!batch) {
      console.log('[BATCH_QR_API] No batch found for ID:', requestId);
      return res.status(404).json({ error: 'No batch found' });
    }

    // Get all items for this batch
    console.log('[BATCH_QR_API] Finding items for batch:', batch.id);
    const items = await prisma.item.findMany({
      where: {
        batchId: batch.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('[BATCH_QR_API] Found items:', items.length);

    if (!items.length) {
      console.log('[BATCH_QR_API] No items found in batch:', batch.id);
      return res.status(404).json({ error: 'No items found in batch' });
    }

    // Create a PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 10,
      info: {
        Title: `Batch ${batch.id} QR Codes`,
        Author: 'OMS System'
      }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=batch-${batch.id}-qr-codes.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add header
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Batch: ${items[0].style}-${items[0].waist}-${items[0].shape}-${items[0].length}-${items[0].wash}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Items: ${items.length}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Set up grid layout
    const qrSize = 150; // Size of each QR code
    const margin = 10;
    const itemsPerRow = 3;
    const itemsPerPage = 9;
    let currentX = margin;
    let currentY = margin + 80; // Adjusted for header
    let itemCount = 0;

    // Add QR codes to the PDF
    for (const item of items) {
      // Add a new page if needed
      if (itemCount > 0 && itemCount % itemsPerPage === 0) {
        doc.addPage();
        currentX = margin;
        currentY = margin;
      }

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(item.qrCode, {
        width: qrSize,
        margin: 0,
        errorCorrectionLevel: 'H' // Highest error correction
      });

      // Add QR code to PDF
      doc.image(qrDataUrl, currentX, currentY, { width: qrSize, height: qrSize });

      // Add item details below QR code
      doc.fontSize(8);
      doc.text(item.qrCode, currentX, currentY + qrSize + 5, {
        width: qrSize,
        align: 'center'
      });
      
      // Add SKU details
      doc.text(`${item.style}-${item.waist}-${item.shape}-${item.length}-${item.wash}`, 
        currentX, currentY + qrSize + 20, {
        width: qrSize,
        align: 'center'
      });

      // Add sequential number
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`${itemCount + 1}/${items.length}`, 
        currentX, currentY + qrSize + 35, {
        width: qrSize,
        align: 'center'
      });
      doc.font('Helvetica');

      // Update position for next QR code
      itemCount++;
      if (itemCount % itemsPerRow === 0) {
        currentX = margin;
        currentY += qrSize + 60; // Increased spacing for better readability
      } else {
        currentX += qrSize + margin;
      }
    }

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('[BATCH_QR_API] Error generating PDF:', error);
    return res.status(500).json({ 
      error: 'Failed to generate QR codes PDF',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 