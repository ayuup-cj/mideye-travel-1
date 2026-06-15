const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',

    //dialectOptions: {
     // ssl: {
        //require: true,
        //rejectUnauthorized: false,
      //},
    //},

    logging:
      process.env.NODE_ENV === 'development'
        ? console.log
        : false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },

    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected successfully via Sequelize');

    const [statusCol] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'status'");
    if (!statusCol.length) {
      await sequelize.query(
        "ALTER TABLE users ADD COLUMN status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active' AFTER role"
      );
    }
    const [cityCol] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'city'");
    if (!cityCol.length) {
      await sequelize.query(
        'ALTER TABLE users ADD COLUMN city VARCHAR(100) DEFAULT NULL AFTER phone'
      );
    }
    const [profileImageCol] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'profile_image'");
    if (!profileImageCol.length) {
      await sequelize.query(
        'ALTER TABLE users ADD COLUMN profile_image VARCHAR(500) DEFAULT NULL AFTER city'
      );
    }

    await sequelize.sync({ alter: false });
    console.log('✅ Database tables synced');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };