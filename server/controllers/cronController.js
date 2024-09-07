import cron from 'node-cron';
import { resetGenerations } from './userController';


cron.schedule('0 0 * * *', () => {
    console.log('Running a task at midnight');
    resetGenerations();
});
