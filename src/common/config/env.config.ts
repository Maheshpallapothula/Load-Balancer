import dotenv from 'dotenv';
import path from 'path';

// Load the appropriate environment file
const ENV_FILE = `${process.env.NODE_ENV || 'development'}.env`;

dotenv.config({ path: path.resolve(__dirname, `${ENV_FILE}`) });


// Utility function to get environment variables dynamically
const get = (configString: string): string => {
    return process.env[configString] ? process.env[configString] : '' as string;
};


export { get };
