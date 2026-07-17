const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    createSection,
    getAllSections,
    getSectionById,
    updateSection,
    deleteSection,
} = require("../controllers/sectionController");

router.use(protect);

    
router.post("/create", createSection);
router.get("/list", getAllSections);
router.get("/details/:id", getSectionById);
router.put("/update/:id", updateSection);
router.delete("/delete/:id", deleteSection);

module.exports = router;