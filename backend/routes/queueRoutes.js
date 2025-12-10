import express from 'express';
import { body, validationResult } from 'express-validator';
import Queue from '../models/Queue.js';
import Service from '../models/Service.js';
import Shop from '../models/Shop.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/queues/shop/:shopId
// @desc    Get all queues for a shop
// @access  Private (Shop Owner)
router.get('/shop/:shopId', authenticate, async (req, res) => {
  try {
    // Verify shop ownership
    const shop = await Shop.findById(req.params.shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Only allow the shop owner to access their own shop's queues
    if (shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied. You can only access queues for your own shop.' });
    }

    const queues = await Queue.find({ shop: req.params.shopId })
      .populate('customer', 'name email')
      .populate('service', 'name duration price')
      .sort({ position: 1, joinedAt: 1 });

    res.json({ queues });
  } catch (error) {
    console.error('Get queues error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/queues/service/:serviceId
// @desc    Get queues for a specific service
// @access  Public
router.get('/service/:serviceId', async (req, res) => {
  try {
    const queues = await Queue.find({ 
      service: req.params.serviceId,
      status: { $in: ['waiting', 'in_progress'] }
    })
      .populate('customer', 'name')
      .sort({ position: 1 });

    res.json({ queues });
  } catch (error) {
    console.error('Get service queues error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/queues/my-queues
// @desc    Get current user's queues
// @access  Private
router.get('/my-queues', authenticate, async (req, res) => {
  try {
    const queues = await Queue.find({ customer: req.user._id })
      .populate('shop', 'name address')
      .populate('service', 'name duration price')
      .sort({ joinedAt: -1 });

    res.json({ queues });
  } catch (error) {
    console.error('Get my queues error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   POST /api/queues
// @desc    Join a queue
// @access  Private
router.post('/', authenticate, [
  body('service').notEmpty().withMessage('Service ID is required'),
  body('shop').notEmpty().withMessage('Shop ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { service, shop } = req.body;

    // Verify service and shop exist
    const serviceDoc = await Service.findById(service);
    const shopDoc = await Shop.findById(shop);

    if (!serviceDoc || !shopDoc) {
      return res.status(404).json({ error: 'Service or shop not found' });
    }

    // Check if user already has an active queue for this service
    const existingQueue = await Queue.findOne({
      customer: req.user._id,
      service: service,
      status: { $in: ['waiting', 'in_progress'] }
    });

    if (existingQueue) {
      return res.status(400).json({ error: 'You are already in the queue for this service' });
    }

    // Get the next position in queue
    const lastQueue = await Queue.findOne({
      service: service,
      status: { $in: ['waiting', 'in_progress'] }
    }).sort({ position: -1 });

    const position = lastQueue ? lastQueue.position + 1 : 1;

    // Calculate estimated wait time (rough estimate: position * average service duration)
    const estimatedWaitTime = position * serviceDoc.duration;

    const queue = new Queue({
      shop,
      service,
      customer: req.user._id,
      position,
      estimatedWaitTime
    });

    await queue.save();

    const populatedQueue = await Queue.findById(queue._id)
      .populate('shop', 'name')
      .populate('service', 'name duration price')
      .populate('customer', 'name');

    res.status(201).json({ message: 'Joined queue successfully', queue: populatedQueue });
  } catch (error) {
    console.error('Join queue error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   PUT /api/queues/:id/status
// @desc    Update queue status
// @access  Private (Shop Owner)
router.put('/:id/status', authenticate, [
  body('status').isIn(['waiting', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const queue = await Queue.findById(req.params.id).populate('shop');
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Verify shop ownership
    if (queue.shop.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only update queues in your own shop' });
    }

    const { status } = req.body;
    const updateData = { status };

    if (status === 'in_progress' && !queue.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'completed' && !queue.completedAt) {
      updateData.completedAt = new Date();
      
      // Recalculate positions for remaining queues
      await Queue.updateMany(
        {
          service: queue.service,
          position: { $gt: queue.position },
          status: 'waiting'
        },
        { $inc: { position: -1 } }
      );
    }

    const updatedQueue = await Queue.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate('customer', 'name email')
      .populate('service', 'name duration price');

    res.json({ message: 'Queue status updated', queue: updatedQueue });
  } catch (error) {
    console.error('Update queue status error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   DELETE /api/queues/:id
// @desc    Leave/cancel queue
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);
    
    if (!queue) {
      return res.status(404).json({ error: 'Queue not found' });
    }

    // Check if user owns this queue or is shop owner
    const shop = await Shop.findById(queue.shop);
    const isOwner = queue.customer.toString() === req.user._id.toString();
    const isShopOwner = shop && shop.owner.toString() === req.user._id.toString();

    if (!isOwner && !isShopOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If queue is waiting, update positions
    if (queue.status === 'waiting') {
      await Queue.updateMany(
        {
          service: queue.service,
          position: { $gt: queue.position },
          status: 'waiting'
        },
        { $inc: { position: -1 } }
      );
    }

    queue.status = 'cancelled';
    await queue.save();

    res.json({ message: 'Queue cancelled successfully' });
  } catch (error) {
    console.error('Cancel queue error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

export default router;

