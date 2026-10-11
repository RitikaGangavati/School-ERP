const mongoose = require("mongoose");

const TEST_URI =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/school_erp_test";

const connect = async () => {
  // safety guard: never run tests on a database that isn't clearly a test one
  if (!TEST_URI.includes("_test")) {
    throw new Error("Refusing to run tests on a non-test database");
  }
  await mongoose.connect(TEST_URI);
};

const clear = async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
};

const close = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

module.exports = { connect, clear, close };