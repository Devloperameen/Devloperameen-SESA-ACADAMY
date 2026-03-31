import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserRole = {
    ADMIN: 'admin',
    INSTRUCTOR: 'instructor',
    STUDENT: 'student'
};

// Define Schema manually to avoid TS module import issues
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.STUDENT },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const seedDB = async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sesa';

    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        const usersToCreate = [
            {
                name: 'SESA Admin',
                email: 'admin@sesa.com',
                password: 'admin123_Secure!',
                role: UserRole.ADMIN
            },
            {
                name: 'Lead Instructor',
                email: 'instructor@sesa.com',
                password: 'instructor123_Secure!',
                role: UserRole.INSTRUCTOR
            },
            {
                name: 'Premium Student',
                email: 'student@sesa.com',
                password: 'student123_Secure!',
                role: UserRole.STUDENT
            }
        ];

        for (const userData of usersToCreate) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(userData.password, salt);
                const user = new User({
                    ...userData,
                    password: hashedPassword
                });
                await user.save();
                console.log(`✅ User created: ${userData.email} (${userData.role}) | Pwd: ${userData.password}`);
            } else {
                console.log(`ℹ️ User already exists: ${userData.email}`);
            }
        }

        console.log('--- Seeding completed! 🚀 ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding error:', err);
        process.exit(1);
    }
};

seedDB();
