import express from 'express';
import { body, validationResult } from 'express-validator';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import Shop from '../models/Shop.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/appointments
// @desc    Get appointments (filtered by user role)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } else if (req.user.role === 'shop_owner') {
      const shops = await Shop.find({ owner: req.user._id });
      const shopIds = shops.map(shop => shop._id);
      query.shop = { $in: shopIds };
    }

    const appointments = await Appointment.find(query)
      .populate('shop', 'name address')
      .populate('service', 'name duration price')
      .populate('customer', 'name email')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.json({ appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('shop', 'name address')
      .populate('service', 'name duration price')
      .populate('customer', 'name email');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify access
    const shop = await Shop.findById(appointment.shop);
    const isCustomer = appointment.customer._id.toString() === req.user._id.toString();
    const isShopOwner = shop && shop.owner.toString() === req.user._id.toString();

    if (!isCustomer && !isShopOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Private
router.post('/', authenticate, [
  body('service').notEmpty().withMessage('Service ID is required'),
  body('shop').notEmpty().withMessage('Shop ID is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format required (HH:MM)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { service, shop, scheduledDate, scheduledTime } = req.body;

    // Verify service and shop exist
    const serviceDoc = await Service.findById(service);
    const shopDoc = await Shop.findById(shop);

    if (!serviceDoc || !shopDoc) {
      return res.status(404).json({ error: 'Service or shop not found' });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      shop,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Time slot already booked' });
    }

    const appointment = new Appointment({
      shop,
      service,
      customer: req.user._id,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      duration: serviceDoc.duration,
      price: serviceDoc.price,
      status: 'scheduled'
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('shop', 'name address')
      .populate('service', 'name duration price')
      .populate('customer', 'name email');

    res.status(201).json({ message: 'Appointment created successfully', appointment: populatedAppointment });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.put('/:id/status', authenticate, [
  body('status').isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const appointment = await Appointment.findById(req.params.id).populate('shop');
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify access
    const isCustomer = appointment.customer.toString() === req.user._id.toString();
    const isShopOwner = appointment.shop.owner.toString() === req.user._id.toString();

    if (!isCustomer && !isShopOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Customers can only cancel, shop owners can update any status
    if (isCustomer && !['cancelled'].includes(req.body.status)) {
      return res.status(403).json({ error: 'You can only cancel appointments' });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true }
    )
      .populate('shop', 'name address')
      .populate('service', 'name duration price')
      .populate('customer', 'name email');

    res.json({ message: 'Appointment status updated', appointment: updatedAppointment });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Verify access
    const isCustomer = appointment.customer.toString() === req.user._id.toString();
    const shop = await Shop.findById(appointment.shop);
    const isShopOwner = shop && shop.owner.toString() === req.user._id.toString();

    if (!isCustomer && !isShopOwner) {
      return res.status(403).json({ error: 'Access denied' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

export default router;

