import express from 'express';
import { body, validationResult } from 'express-validator';
import Shop from '../models/Shop.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/shops
// @desc    Get all shops
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    let query = { isActive: true };
    
    // If coordinates provided, find shops within radius (in km)
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const shops = await Shop.find(query)
      .populate('owner', 'name email')
      .sort({ 'rating.average': -1 });

    res.json({ shops });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/shops/:id
// @desc    Get shop by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('services');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   POST /api/shops
// @desc    Create a new shop
// @access  Private (Shop Owner)
router.post('/', authenticate, authorize('shop_owner'), [
  body('name').trim().notEmpty().withMessage('Shop name is required'),
  body('address.street').optional().trim(),
  body('address.city').optional().trim(),
  body('location.coordinates').isArray().withMessage('Location coordinates must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    // Check if user already has a shop
    const existingShop = await Shop.findOne({ owner: req.user._id });
    if (existingShop) {
      return res.status(400).json({ error: 'You already have a shop registered' });
    }

    const shopData = {
      ...req.body,
      owner: req.user._id
    };

    const shop = new Shop(shopData);
    await shop.save();

    const populatedShop = await Shop.findById(shop._id).populate('owner', 'name email');

    res.status(201).json({ message: 'Shop created successfully', shop: populatedShop });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   PUT /api/shops/:id
// @desc    Update shop
// @access  Private (Shop Owner - own shop only)
router.put('/:id', authenticate, authorize('shop_owner'), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check if user owns this shop
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only update your own shop' });
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    res.json({ message: 'Shop updated successfully', shop: updatedShop });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/shops/owner/my-shop
// @desc    Get current user's shop
// @access  Private (Shop Owner)
router.get('/owner/my-shop', authenticate, authorize('shop_owner'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id })
      .populate('owner', 'name email');

    if (!shop) {
      return res.status(404).json({ error: 'No shop found for this user' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Get my shop error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

export default router;

