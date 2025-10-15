import 'dotenv/config';    
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import productsRouter from './routes/products.routes.js';

dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use('/', productsRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`🚀 http://localhost:${port}`));
