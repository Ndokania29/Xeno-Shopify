const{DataTypes}=require('sequelize');//Importing DataTypes from Sequelize
const{sequelize}=require('../config/db');//Here we import the sequelize instance from the db configuration file
const bcrypt = require('bcrypt'); // Importing bcrypt for password hashing 

//Defining the Tenant model with necessary fields and configurations
const Tenant=sequelize.define('Tenant',{
  id: { // Here we define the primary key 'id' as a UUID ensuring uniqueness for each tenant
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: { // Name of the tenant/store
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255] // Name length between 2 and 255 characters
    }
  },
  email: {
  type: DataTypes.STRING(255),
  allowNull: false,
  unique: true,   // keep this
  validate: { isEmail: true }
},
  password: {
    type: DataTypes.STRING(255), // Hashed password for authentication
    allowNull: false,
    validate: {
      len: [6, 255] // Password length between 6 and 255 characters
    }
  },
  // shopifyDomain: {// this field stores the Shopify store domain for each tenant
  //   type: DataTypes.STRING(255), // Shopify store domain
  //   allowNull: false,
  //   unique: true,
  //   validate: {
  //     notEmpty: true
  //   }
  // },
  shopifyDomain: {
  type: DataTypes.STRING(255),
  allowNull: false,
  unique: true, 
  validate: { notEmpty: true }
},
  shopifyAccessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  shopifyApiKey: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  shopifyApiSecret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncStatus: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  isEmailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },// these are for email verification process
  emailVerificationToken: { type: DataTypes.STRING, allowNull: true },
  emailVerificationExpires: { type: DataTypes.DATE, allowNull: true },

  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'tenants', // Explicitly specifying table name
  timestamps: true,
  paranoid: true,// I t enables soft delete to track deletions without removing records
  indexes: [
    // {
    //   unique: true,
    //   fields: ['email']
    // },
    {
      unique: true,
      fields: ['shopifyDomain']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['syncStatus']
    }
  ],
  hooks: {// These hooks ensure  passwords are hashed before stored or updated, enhancing security
    beforeCreate: async (tenant) => {
      if (tenant.password) {
        tenant.password = await bcrypt.hash(tenant.password, 12);
      }
    },
    beforeUpdate: async (tenant) => {
      if (tenant.changed('password')) {
        tenant.password = await bcrypt.hash(tenant.password, 12); // The syntax tells Sequelize to hash the password only if it has been modified, 12 is the salt rounds for bcrypt
      }
    }
  }
});

// Instance methods
Tenant.prototype.validatePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

Tenant.prototype.toJSON = function() {
  const values = Object.assign({}, this.get()); // This method overrides the default toJSON to exclude sensitive information like password when converting to JSON
  delete values.password;
  return values;
};

// Class methods
Tenant.findByDomain = function(domain) { //findbyDomain method to retrieve active tenant by their Shopify domain
  return this.findOne({
    where: { shopifyDomain: domain, isActive: true }
  });
};

Tenant.findByEmail = function(email) {
  return this.findOne({
    where: { email: email, isActive: true }
  });
};

module.exports = Tenant;