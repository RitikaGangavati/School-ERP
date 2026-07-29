const House = require("../models/houseModel");

// Create House
const createHouse = async (req, res) => {
  try {
    const { houseName, description, active } = req.body;

    if (!houseName || !houseName.trim()) {
      return res.status(400).json({
        success: false,
        message: "House name is required",
      });
    }

    const existing = await House.findOne({
      houseName: houseName.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "House already exists",
      });
    }

    const house = await House.create({
      houseName: houseName.trim(),
      description,
      active,
    });

    return res.status(201).json({
      success: true,
      message: "House created successfully",
      house,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "House already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Houses
const getAllHouses = async (req, res) => {
  try {
    const houses = await House.find().sort({ houseName: 1 });

    return res.status(200).json({
      success: true,
      houses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single House
const getHouseById = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House not found",
      });
    }

    return res.status(200).json({
      success: true,
      house,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid house ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update House
const updateHouse = async (req, res) => {
  try {
    const { houseName, description, active } = req.body;

    const house = await House.findById(req.params.id);

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House not found",
      });
    }

    if (houseName && houseName.trim() !== house.houseName) {
      const existing = await House.findOne({
        houseName: houseName.trim(),
        _id: { $ne: house._id },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "House name already exists",
        });
      }

      house.houseName = houseName.trim();
    }

    if (description !== undefined)
      house.description = description;

    if (active !== undefined)
      house.active = active;

    await house.save();

    return res.status(200).json({
      success: true,
      message: "House updated successfully",
      house,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid house ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete House
const deleteHouse = async (req, res) => {
  try {
    const house = await House.findByIdAndDelete(req.params.id);

    if (!house) {
      return res.status(404).json({
        success: false,
        message: "House not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "House deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid house ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createHouse,
  getAllHouses,
  getHouseById,
  updateHouse,
  deleteHouse,
};