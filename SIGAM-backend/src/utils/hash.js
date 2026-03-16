import bcrypt from 'bcryptjs';

class HashUtil {
    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    static async comparePassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
}

export default HashUtil;
