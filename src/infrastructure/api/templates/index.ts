import { Router } from 'express';
import uploadHandler from './upload';
import getHandler from './get';
import listHandler from './list';

const templatesRouter = Router();

// Mount the template API routes
templatesRouter.post('/upload', uploadHandler);
templatesRouter.get('/get', getHandler);
templatesRouter.get('/list', listHandler);

export default templatesRouter; 