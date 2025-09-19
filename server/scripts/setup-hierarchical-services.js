const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const serviceData = {
  categories: [
    {
      name: "Hair Services",
      description: "Professional hair care and styling services",
      icon: "content_cut",
      displayOrder: 1,
      services: [
        {
          name: "Haircut",
          description: "Professional hair cutting and styling",
          basePrice: 45.00,
          baseDuration: 60,
          displayOrder: 1,
          variants: [
            { name: "Basic Cut", type: "style", priceModifier: 0, durationModifier: 0 },
            { name: "Wash & Cut", type: "style", priceModifier: 10, durationModifier: 15 },
            { name: "Cut & Style", type: "style", priceModifier: 20, durationModifier: 30 },
            { name: "30 minutes", type: "duration", priceModifier: -10, durationModifier: -30 },
            { name: "90 minutes", type: "duration", priceModifier: 15, durationModifier: 30 }
          ]
        },
        {
          name: "Hair Coloring",
          description: "Professional hair coloring and highlighting",
          basePrice: 85.00,
          baseDuration: 120,
          displayOrder: 2,
          variants: [
            { name: "Touch-up", type: "intensity", priceModifier: -20, durationModifier: -30 },
            { name: "Full Color", type: "intensity", priceModifier: 0, durationModifier: 0 },
            { name: "Highlights", type: "intensity", priceModifier: 25, durationModifier: 30 },
            { name: "Balayage", type: "intensity", priceModifier: 40, durationModifier: 60 },
            { name: "Toner", type: "addon", priceModifier: 15, durationModifier: 20 }
          ]
        },
        {
          name: "Hair Extensions",
          description: "Professional hair extension application",
          basePrice: 150.00,
          baseDuration: 180,
          displayOrder: 3,
          variants: [
            { name: "Clip-in", type: "style", priceModifier: -50, durationModifier: -60 },
            { name: "Tape-in", type: "style", priceModifier: 0, durationModifier: 0 },
            { name: "Sew-in", type: "style", priceModifier: 50, durationModifier: 60 },
            { name: "12 inches", type: "length", priceModifier: 0, durationModifier: 0 },
            { name: "16 inches", type: "length", priceModifier: 25, durationModifier: 15 },
            { name: "20 inches", type: "length", priceModifier: 50, durationModifier: 30 }
          ]
        }
      ]
    },
    {
      name: "Nail Services",
      description: "Professional nail care and nail art",
      icon: "colorize",
      displayOrder: 2,
      services: [
        {
          name: "Manicure",
          description: "Professional nail care and polish",
          basePrice: 35.00,
          baseDuration: 45,
          displayOrder: 1,
          variants: [
            { name: "Basic Manicure", type: "style", priceModifier: 0, durationModifier: 0 },
            { name: "Gel Manicure", type: "style", priceModifier: 15, durationModifier: 15 },
            { name: "French Tips", type: "addon", priceModifier: 10, durationModifier: 10 },
            { name: "Nail Art", type: "addon", priceModifier: 20, durationModifier: 20 },
            { name: "Gel Coating", type: "addon", priceModifier: 12, durationModifier: 10 }
          ]
        },
        {
          name: "Pedicure",
          description: "Professional foot and toenail care",
          basePrice: 45.00,
          baseDuration: 60,
          displayOrder: 2,
          variants: [
            { name: "Basic Pedicure", type: "style", priceModifier: 0, durationModifier: 0 },
            { name: "Spa Pedicure", type: "style", priceModifier: 20, durationModifier: 30 },
            { name: "Gel Pedicure", type: "style", priceModifier: 18, durationModifier: 15 },
            { name: "Callus Treatment", type: "addon", priceModifier: 15, durationModifier: 15 }
          ]
        }
      ]
    },
    {
      name: "Facial Treatments",
      description: "Professional skincare and facial treatments",
      icon: "face",
      displayOrder: 3,
      services: [
        {
          name: "Classic Facial",
          description: "Deep cleansing and moisturizing facial",
          basePrice: 75.00,
          baseDuration: 75,
          displayOrder: 1,
          variants: [
            { name: "Basic Facial", type: "intensity", priceModifier: 0, durationModifier: 0 },
            { name: "Deep Cleansing", type: "intensity", priceModifier: 15, durationModifier: 15 },
            { name: "Anti-Aging", type: "intensity", priceModifier: 25, durationModifier: 20 },
            { name: "60 minutes", type: "duration", priceModifier: -10, durationModifier: -15 },
            { name: "90 minutes", type: "duration", priceModifier: 20, durationModifier: 15 }
          ]
        },
        {
          name: "Chemical Peel",
          description: "Professional chemical exfoliation treatment",
          basePrice: 95.00,
          baseDuration: 60,
          displayOrder: 2,
          variants: [
            { name: "Light Peel", type: "intensity", priceModifier: 0, durationModifier: 0 },
            { name: "Medium Peel", type: "intensity", priceModifier: 25, durationModifier: 15 },
            { name: "Deep Peel", type: "intensity", priceModifier: 50, durationModifier: 30 }
          ]
        }
      ]
    },
    {
      name: "Massage Therapy",
      description: "Relaxing and therapeutic massage services",
      icon: "spa",
      displayOrder: 4,
      services: [
        {
          name: "Swedish Massage",
          description: "Relaxing full-body massage",
          basePrice: 80.00,
          baseDuration: 60,
          displayOrder: 1,
          variants: [
            { name: "30 minutes", type: "duration", priceModifier: -30, durationModifier: -30 },
            { name: "60 minutes", type: "duration", priceModifier: 0, durationModifier: 0 },
            { name: "90 minutes", type: "duration", priceModifier: 35, durationModifier: 30 },
            { name: "Light Pressure", type: "intensity", priceModifier: 0, durationModifier: 0 },
            { name: "Medium Pressure", type: "intensity", priceModifier: 0, durationModifier: 0 },
            { name: "Deep Pressure", type: "intensity", priceModifier: 10, durationModifier: 0 }
          ]
        },
        {
          name: "Hot Stone Massage",
          description: "Therapeutic massage with heated stones",
          basePrice: 110.00,
          baseDuration: 90,
          displayOrder: 2,
          variants: [
            { name: "60 minutes", type: "duration", priceModifier: -20, durationModifier: -30 },
            { name: "90 minutes", type: "duration", priceModifier: 0, durationModifier: 0 },
            { name: "Aromatherapy", type: "addon", priceModifier: 15, durationModifier: 0 }
          ]
        }
      ]
    }
  ]
};

async function setupHierarchicalServices() {
  try {
    console.log('🚀 Setting up hierarchical service structure...');

    // Clear existing data
    console.log('🧹 Clearing existing service data...');
    await prisma.bookingServiceVariant.deleteMany();
    await prisma.serviceVariant.deleteMany();
    await prisma.service.deleteMany();
    await prisma.serviceCategory.deleteMany();

    console.log('📂 Creating service categories and services...');

    for (const categoryData of serviceData.categories) {
      const { services, ...categoryInfo } = categoryData;
      
      const category = await prisma.serviceCategory.create({
        data: categoryInfo
      });

      console.log(`✅ Created category: ${category.name}`);

      for (const serviceInfo of services) {
        const { variants, ...serviceData } = serviceInfo;
        
        const service = await prisma.service.create({
          data: {
            ...serviceData,
            categoryId: category.id
          }
        });

        console.log(`  ✅ Created service: ${service.name}`);

        for (const variantData of variants) {
          const variant = await prisma.serviceVariant.create({
            data: {
              ...variantData,
              serviceId: service.id
            }
          });

          console.log(`    ✅ Created variant: ${variant.name}`);
        }
      }
    }

    console.log('🎉 Hierarchical service structure setup complete!');
    
    // Display summary
    const categoryCount = await prisma.serviceCategory.count();
    const serviceCount = await prisma.service.count();
    const variantCount = await prisma.serviceVariant.count();
    
    console.log(`📊 Summary:`);
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Services: ${serviceCount}`);
    console.log(`   Variants: ${variantCount}`);

  } catch (error) {
    console.error('❌ Error setting up hierarchical services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupHierarchicalServices()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupHierarchicalServices, serviceData };
