const { Cargo, User } = require('../models');
const generateTrackingId = require('../utils/generateTrackingId');

// POST /api/cargo
const createCargo = async (req, res) => {
  try {
    const {
      sender_name,
      sender_phone,
      sender_email,
      sender_address,
      recipient_name,
      recipient_phone,
      destination,
      cargo_type,
      pieces,
      weight,
      length_cm,
      width_cm,
      description,
      shipping_speed,
      insurance,
      fragile,
      signature_required,
      special_requests,
    } = req.body;

    const tracking_id = await generateTrackingId();

    const cargo = await Cargo.create({
      tracking_id,
      user_id: req.user ? req.user.id : null,
      sender_name,
      sender_phone,
      sender_email: sender_email || null,
      sender_address: sender_address || null,
      recipient_name,
      recipient_phone,
      origin: 'Galkacyo (GLK)',
      destination,
      cargo_type,
      pieces: pieces || 1,
      weight,
      length_cm: length_cm || null,
      width_cm: width_cm || null,
      description: description || null,
      shipping_speed: shipping_speed || 'standard',
      insurance: insurance === true || insurance === 'true' || false,
      fragile: fragile === true || fragile === 'true' || false,
      signature_required: signature_required === true || signature_required === 'true' || false,
      special_requests: special_requests || null,
      status: 'Received',
    });

    return res.status(201).json({
      success: true,
      message: 'Cargo request submitted successfully.',
      data: {
        cargo,
        tracking_id,
        note: 'Save your tracking ID to track your shipment.',
      },
    });
  } catch (error) {
    console.error('Create cargo error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again.',
    });
  }
};

// GET /api/cargo
const getCargo = async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { user_id: req.user.id };

    const shipments = await Cargo.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'full_name', 'email'],
          required: false,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: shipments.length,
      data: { shipments },
    });
  } catch (error) {
    console.error('Get cargo error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/cargo/:id
const getCargoById = async (req, res) => {
  try {
    const cargo = await Cargo.findByPk(req.params.id);
    if (!cargo) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    if (req.user.role !== 'admin' && cargo.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, data: { cargo } });
  } catch (error) {
    console.error('Get cargo by ID error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PUT /api/cargo/:id  (admin updates status)
const updateCargoStatus = async (req, res) => {
  try {
    const cargo = await Cargo.findByPk(req.params.id);
    if (!cargo) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const { status } = req.body;
    const validStatuses = ['Received', 'In Transit', 'Arrived', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    await cargo.update({ status });

    return res.status(200).json({
      success: true,
      message: `Cargo status updated to "${status}".`,
      data: { cargo },
    });
  } catch (error) {
    console.error('Update cargo error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/track/:tracking_id  (public — no auth needed)
const trackCargo = async (req, res) => {
  try {
    const { tracking_id } = req.params;

    const cargo = await Cargo.findOne({
      where: { tracking_id: tracking_id.toUpperCase() },
      attributes: [
        'tracking_id',
        'sender_name',
        'recipient_name',
        'recipient_phone',
        'origin',
        'destination',
        'cargo_type',
        'weight',
        'pieces',
        'shipping_speed',
        'status',
        'created_at',
        'updated_at',
      ],
    });

    if (!cargo) {
      return res.status(404).json({
        success: false,
        message: `No shipment found for tracking ID "${tracking_id}". Please check the ID and try again.`,
      });
    }

    const statusTimeline = buildTimeline(cargo.status, cargo.created_at);

    return res.status(200).json({
      success: true,
      data: {
        cargo,
        timeline: statusTimeline,
      },
    });
  } catch (error) {
    console.error('Track cargo error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const buildTimeline = (currentStatus, createdAt) => {
  const statuses = ['Received', 'In Transit', 'Arrived'];
  const currentIndex = statuses.indexOf(currentStatus);

  return statuses.map((status, index) => ({
    status,
    completed: index <= currentIndex,
    active: index === currentIndex,
  }));
};

module.exports = { createCargo, getCargo, getCargoById, updateCargoStatus, trackCargo };
