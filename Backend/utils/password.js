const bcrypt = require('bcryptjs');

// Prisma has no Mongoose-style pre('save') hooks, so hashing/verification
// that used to live on the User model now lives here and is called
// explicitly wherever a password is set or checked.
const hashPassword = async (plain) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
};

const verifyPassword = async (plain, hash) => bcrypt.compare(plain, hash);

module.exports = { hashPassword, verifyPassword };
