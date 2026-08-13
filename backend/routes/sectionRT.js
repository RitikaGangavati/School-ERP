const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const {
    createSection,
    getAllSections,
    getSectionById,
    updateSection,
    deleteSection,
} = require("../controllers/sectionController");

router.use(protect);

    
router.post("/create", authorize("Super Admin", "Admin"), createSection);
router.get("/list", authorize("Super Admin", "Admin"), getAllSections);
router.get("/details/:id", authorize("Super Admin", "Admin"), getSectionById);
router.put("/update/:id", authorize("Super Admin", "Admin"), updateSection);
router.delete("/delete/:id", authorize("Super Admin", "Admin"), deleteSection);

module.exports = router;