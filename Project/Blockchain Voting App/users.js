// This file centralizes user credentials.
// In a real application, this would be a secure database.
const users = {
  // Admin User
  admin: {
    password: "adminpassword",
    privateKey: process.env.ADMIN_PRIVATE_KEY,
    address: null // Will be populated at runtime
  },
  // Regular Users
  user1: { password: "password1", privateKey: process.env.USER1_PRIVATE_KEY, address: null },
  user2: { password: "password2", privateKey: process.env.USER2_PRIVATE_KEY, address: null },
  user3: { password: "password3", privateKey: process.env.USER3_PRIVATE_KEY, address: null },
  user4: { password: "password4", privateKey: process.env.USER4_PRIVATE_KEY, address: null },
  user5: { password: "password5", privateKey: process.env.USER5_PRIVATE_KEY, address: null },
  user6: { password: "password6", privateKey: process.env.USER6_PRIVATE_KEY, address: null },
  user7: { password: "password7", privateKey: process.env.USER7_PRIVATE_KEY, address: null },
  user8: { password: "password8", privateKey: process.env.USER8_PRIVATE_KEY, address: null },
  user9: { password: "password9", privateKey: process.env.USER9_PRIVATE_KEY, address: null },
};

module.exports = users;