import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a test customer
  console.log('Creating test customer...');
  const customer = await prisma.customer.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com'
    }
  });

  // Create orders with correct SKU format
  console.log('Creating orders...');
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        customerId: customer.id,
        targetStyle: 'ST',
        targetWaist: 32,
        targetLength: 32,
        targetShape: 'X',
        targetWash: 'IND',
        buttonColor: 'WHITE',
        hemType: 'ORL',
        status1: 'CREATED',
        status2: 'PENDING'
      }
    }),
    prisma.order.create({
      data: {
        customerId: customer.id,
        targetStyle: 'ST',
        targetWaist: 34,
        targetLength: 30,
        targetShape: 'H',
        targetWash: 'RAW',
        buttonColor: 'WHITE',
        hemType: 'ORL',
        status1: 'CREATED',
        status2: 'PENDING'
      }
    }),
    prisma.order.create({
      data: {
        customerId: customer.id,
        targetStyle: 'ST',
        targetWaist: 30,
        targetLength: 34,
        targetShape: 'X',
        targetWash: 'STA',
        buttonColor: 'WHITE',
        hemType: 'ORL',
        status1: 'CREATED',
        status2: 'PENDING'
      }
    })
  ]);

  // Create production requests with individual characteristics
  console.log('Creating production requests...');
  const productionRequests = await Promise.all([
    // Request 1: Straight fit, 32" waist, X shape, 32" length, Indigo wash
    prisma.productionRequest.create({
      data: {
        style: 'ST',
        waist: 32,
        length: 32,
        shape: 'X',
        wash: 'IND',
        quantity: 10,
        status: 'PENDING',
        waitlist: {
          create: [
            {
              orderId: orders[0].id,
              position: 1
            }
          ]
        }
      }
    }),
    // Request 2: Straight fit, 34" waist, H shape, 30" length, Raw wash
    prisma.productionRequest.create({
      data: {
        style: 'ST',
        waist: 34,
        length: 30,
        shape: 'H',
        wash: 'RAW',
        quantity: 8,
        status: 'PENDING',
        waitlist: {
          create: [
            {
              orderId: orders[1].id,
              position: 1
            }
          ]
        }
      }
    }),
    // Request 3: Straight fit, 30" waist, X shape, 34" length, Stardust wash
    prisma.productionRequest.create({
      data: {
        style: 'ST',
        waist: 30,
        length: 34,
        shape: 'X',
        wash: 'STA',
        quantity: 12,
        status: 'PENDING',
        waitlist: {
          create: [
            {
              orderId: orders[2].id,
              position: 1
            }
          ]
        }
      }
    })
  ]);

  console.log('Sample data created successfully!');
  console.log('Created production requests:', productionRequests);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 