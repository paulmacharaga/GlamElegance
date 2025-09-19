const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all service categories with basic info
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        icon: true,
        displayOrder: true,
        _count: {
          select: {
            services: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service categories',
      error: error.message
    });
  }
});

// Get services within a specific category
router.get('/categories/:categoryId/services', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId, isActive: true },
      include: {
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            basePrice: true,
            baseDuration: true,
            displayOrder: true,
            _count: {
              select: {
                variants: {
                  where: { isActive: true }
                }
              }
            }
          },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Service category not found'
      });
    }

    res.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon
      },
      services: category.services
    });
  } catch (error) {
    console.error('Error fetching category services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category services',
      error: error.message
    });
  }
});

// Get service details with all variants
router.get('/services/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true
          }
        },
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            priceModifier: true,
            durationModifier: true,
            displayOrder: true
          },
          orderBy: [
            { type: 'asc' },
            { displayOrder: 'asc' }
          ]
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Group variants by type for easier frontend handling
    const variantsByType = service.variants.reduce((acc, variant) => {
      if (!acc[variant.type]) {
        acc[variant.type] = [];
      }
      acc[variant.type].push(variant);
      return acc;
    }, {});

    res.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        basePrice: service.basePrice,
        baseDuration: service.baseDuration,
        category: service.category
      },
      variants: variantsByType
    });
  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service details',
      error: error.message
    });
  }
});

// Calculate total price and duration for selected variants
router.post('/calculate-price', async (req, res) => {
  try {
    const { serviceId, variantIds = [] } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'Service ID is required'
      });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId, isActive: true },
      select: {
        id: true,
        name: true,
        basePrice: true,
        baseDuration: true
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    let totalPrice = service.basePrice;
    let totalDuration = service.baseDuration;
    const selectedVariants = [];

    if (variantIds.length > 0) {
      const variants = await prisma.serviceVariant.findMany({
        where: {
          id: { in: variantIds },
          serviceId: serviceId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          type: true,
          priceModifier: true,
          durationModifier: true
        }
      });

      for (const variant of variants) {
        totalPrice += variant.priceModifier;
        totalDuration += variant.durationModifier;
        selectedVariants.push(variant);
      }
    }

    // Ensure minimum duration
    totalDuration = Math.max(totalDuration, 15);

    res.json({
      success: true,
      calculation: {
        service: {
          id: service.id,
          name: service.name,
          basePrice: service.basePrice,
          baseDuration: service.baseDuration
        },
        selectedVariants,
        totalPrice: Math.max(totalPrice, 0), // Ensure non-negative price
        totalDuration,
        breakdown: {
          basePrice: service.basePrice,
          baseDuration: service.baseDuration,
          variantPriceModifier: totalPrice - service.basePrice,
          variantDurationModifier: totalDuration - service.baseDuration
        }
      }
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate price',
      error: error.message
    });
  }
});

// Admin: Get all categories with full details
router.get('/admin/categories', auth, async (req, res) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      include: {
        services: {
          include: {
            variants: {
              orderBy: [
                { type: 'asc' },
                { displayOrder: 'asc' }
              ]
            }
          },
          orderBy: { displayOrder: 'asc' }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// Admin: Setup hierarchical services (run migration)
router.post('/admin/setup', auth, async (req, res) => {
  try {
    const { setupHierarchicalServices } = require('../scripts/setup-hierarchical-services');
    
    await setupHierarchicalServices();
    
    res.json({
      success: true,
      message: 'Hierarchical service structure setup completed successfully'
    });
  } catch (error) {
    console.error('Error setting up hierarchical services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup hierarchical services',
      error: error.message
    });
  }
});

// Admin CRUD endpoints for categories
router.post('/admin/categories', auth, async (req, res) => {
  try {
    const { name, description, icon, displayOrder } = req.body;

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        description,
        icon,
        displayOrder: displayOrder || 0,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
});

router.put('/admin/categories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, displayOrder } = req.body;

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name,
        description,
        icon,
        displayOrder: displayOrder || 0
      }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
});

router.delete('/admin/categories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all services in this category first
    await prisma.service.deleteMany({
      where: { categoryId: id }
    });

    // Delete the category
    await prisma.serviceCategory.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Category and all its services deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

// Admin CRUD endpoints for services
router.get('/admin/all-services', auth, async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { category: { displayOrder: 'asc' } },
        { displayOrder: 'asc' }
      ]
    });

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

router.post('/admin/services', auth, async (req, res) => {
  try {
    const { name, description, categoryId, basePrice, baseDuration, displayOrder } = req.body;

    const service = await prisma.service.create({
      data: {
        name,
        description,
        categoryId,
        basePrice: parseFloat(basePrice),
        baseDuration: parseInt(baseDuration),
        displayOrder: displayOrder || 0,
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
});

router.put('/admin/services/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, basePrice, baseDuration, displayOrder } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
        basePrice: parseFloat(basePrice),
        baseDuration: parseInt(baseDuration),
        displayOrder: displayOrder || 0
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
});

router.delete('/admin/services/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
});

module.exports = router;
