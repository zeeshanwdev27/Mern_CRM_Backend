// models/index.js
import mongoose from 'mongoose';
import Role from './Role.js';
import Department from './Department.js';
import User from './User.js';

// This function helps avoid circular dependencies
function registerModels() {
  // Register Role model first since it's referenced by User
  if (!mongoose.models.Role) {
    mongoose.model('Role', Role.schema);
  }

  // Register Department model next
  if (!mongoose.models.Department) {
    mongoose.model('Department', Department.schema);
  }

  // Finally register User model which references both Role and Department
  if (!mongoose.models.User) {
    mongoose.model('User', User.schema);
  }
}

// Initialize model registration
registerModels();

// Export all models
export {
  User,
  Role,
  Department
};

// Optional: Export mongoose for convenience
export default mongoose;