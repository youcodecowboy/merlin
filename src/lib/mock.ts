export function generateRandomSKU() {
  const fits = ['ST', 'SL', 'RE'];
  const waists = [28, 30, 32, 34, 36];
  const shapes = ['X', 'Y'];
  const inseams = [30, 32, 34];
  const washes = ['RAW', 'IND', 'STA', 'VIN'];

  const fit = fits[Math.floor(Math.random() * fits.length)];
  const waist = waists[Math.floor(Math.random() * waists.length)];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const inseam = inseams[Math.floor(Math.random() * inseams.length)];
  const wash = washes[Math.floor(Math.random() * washes.length)];

  return `${fit}-${waist}-${shape}-${inseam}-${wash}`;
}

export function generateRandomOrder() {
  const order = {
    id: `ORD-${Math.random().toString(36).substring(7).toUpperCase()}`,
    items: [
      {
        sku: generateRandomSKU(),
        quantity: Math.floor(Math.random() * 2) + 1
      }
    ],
    customerName: 'Test Customer',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  return order;
} 