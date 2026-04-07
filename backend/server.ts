// MUST BE FIRST: loads .env before any module initializes
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('dotenv').config();

import app from './src/app';

const PORT = process.env.PORT || 3001;

app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
