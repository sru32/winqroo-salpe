import express from 'express';
import { body, validationResult } from 'express-validator';
import Service from '../models/Service.js';
import Shop from '../models/Shop.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/services/shop/:shopId
// @desc    Get all services for a shop
// @access  Public
router.get('/shop/:shopId', async (req, res) => {
  try {
    const services = await Service.find({ 
      shop: req.params.shopId,
      isActive: true 
    }).sort({ name: 1 });

    res.json({ services });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('shop', 'name');
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ service });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   POST /api/services
// @desc    Create a new service
// @access  Private (Shop Owner)
router.post('/', authenticate, authorize('shop_owner'), [
  body('name').trim().notEmpty().withMessage('Service name is required'),
  body('duration').isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('shop').notEmpty().withMessage('Shop ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    // Verify shop exists and user owns it
    const shop = await Shop.findById(req.body.shop);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only add services to your own shop' });
    }

    const service = new Service(req.body);
    await service.save();

    const populatedService = await Service.findById(service._id).populate('shop', 'name');

    res.status(201).json({ message: 'Service created successfully', service: populatedService });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   PUT /api/services/:id
// @desc    Update service
// @access  Private (Shop Owner)
router.put('/:id', authenticate, authorize('shop_owner'), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('shop');
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if user owns the shop
    if (service.shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only update services in your own shop' });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('shop', 'name');

    res.json({ message: 'Service updated successfully', service: updatedService });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   DELETE /api/services/:id
// @desc    Delete service (soft delete by setting isActive to false)
// @access  Private (Shop Owner)
router.delete('/:id', authenticate, authorize('shop_owner'), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('shop');
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if user owns the shop
    if (service.shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete services in your own shop' });
    }

    service.isActive = false;
    await service.save();

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

export default router;

