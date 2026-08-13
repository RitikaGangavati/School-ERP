const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register User
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, mobile, profile, role } =
      req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Check existing email
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        code: 400,
        success: false,
        message: "Email already exists",
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      mobile,
      profile,
      role,
    });

    res.status(201).json({
      code: 201,
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ---------------------------------------------
    // Validation
    // ---------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ---------------------------------------------
    // Find user
    // ---------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    }).populate("role", "roleName active");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ---------------------------------------------
    // Check user account
    // ---------------------------------------------

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact administrator.",
      });
    }

    // ---------------------------------------------
    // Check role
    // ---------------------------------------------

    if (!user.role || !user.role.active) {
      return res.status(403).json({
        success: false,
        message:
          "Your assigned role is inactive. Please contact administrator.",
      });
    }

    // ---------------------------------------------
    // Compare password
    // ---------------------------------------------

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ---------------------------------------------
    // Generate JWT
    // ---------------------------------------------

    const token = jwt.sign(
      {
        id: user._id,
        roleId: user.role._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    // ---------------------------------------------
    // Remove password
    // ---------------------------------------------

    const userData = user.toObject();

    delete userData.password;

    // ---------------------------------------------
    // Response
    // ---------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// const login = async (req, res) => {
//   try {
//     // console.log(req.body);

//     const { email, password } = req.body;

//     // Validation
//     if (!email || !password) {
//       return res.status(400).json({
//         code: 400,
//         success: false,
//         message: "Email and Password are required",
//       });
//     }

//     // Check User
//     const existingUser = await User.findOne({ email });

//     if (!existingUser) {
//       return res.status(404).json({
//         code: 404,
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Compare Password
//     const isMatch = await bcrypt.compare(password, existingUser.password);

//     if (!isMatch) {
//       return res.status(401).json({
//         code: 401,
//         success: false,
//         message: "Invalid Password",
//       });
//     }

//     // Generate JWT
//     const token = jwt.sign(
//       {
//         id: existingUser._id,
//         email: existingUser.email,
//         role: existingUser.role,
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "1d",
//       },
//     );

//     const userData = existingUser.toObject();
//     delete userData.password;

//     res.status(200).json({
//       code: 200,
//       success: true,
//       message: "Login Successful",
//       token,
//       user: userData,
//     });
//   } catch (error) {
//     res.status(500).json({
//       code: 500,
//       success: false,
//       message: error.message,
//     });
//   }
// };

module.exports = {
  register,
  login,
};
