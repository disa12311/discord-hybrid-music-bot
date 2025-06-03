// src/database/connect.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('Không tìm thấy biến môi trường MONGODB_URI. Vui lòng thêm nó vào tệp .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri, {
            // useNewUrlParser: true, // Các tùy chọn này không còn cần thiết trong Mongoose 6+
            // useUnifiedTopology: true,
        });
        console.log('✅ Đã kết nối thành công tới MongoDB!');
    } catch (error) {
        console.error(`❌ Lỗi kết nối MongoDB: ${error.message}`);
        process.exit(1); // Thoát ứng dụng nếu không kết nối được DB
    }
}
