import dotenv from 'dotenv';
import 'dotenv/config';
import app from './src/app';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
