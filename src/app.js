import dotenv from 'dotenv';
dotenv.config();
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStoreFactory from 'connect-mongo';
import { engine } from 'express-handlebars';
import { Server } from 'socket.io';
import config from './config.js';
import dbConnection from './dao/db/configDB.js';
import ProductManager from './dao/managers/MongoDb/productManager.js';
import cartmanager from './dao/managers/MongoDb/cartmanager.js';
import productsRouter from './router/products.router.js';
import cartsRouter from './router/carts.router.js';
import usersRouter from './router/users.router.js';
import viewsRouter from './router/views.router.js';
import router from './router/views.router.js';
import passport from 'passport';
import "./passport.js";
import { __dirname } from './utils.js';

const app = express();
const MongoStore = MongoStoreFactory(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.engine('handlebars', engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

app.use(
    session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 60 * 60 * 1000,
        },
        store: new MongoStore({
            mongoUrl: config.mongodbUri,
        }),
    })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/', router);
app.use("/api/users", usersRouter);
app.use('/', viewsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.get('/products', async (req, res) => {
    try {
        const products = await ProductManager.getAll();
        res.render('products', { products });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los productos' });
    }
});

app.get('/carts/:cid', async (req, res) => {
    try {
        const cartId = req.params.cid;
        const cart = await cartmanager.getById(cartId);

        if (!cart) {
            res.status(404).json({ error: 'Carrito no encontrado' });
            return;
        }

        res.render('cart', { cart });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});

const httpServer = app.listen(config.port, () => {
    console.log(`Escuchando al puerto ${config.port}`);
});

const socketServer = new Server(httpServer);
const realtimeProductsNamespace = socketServer.of('/realtimeproducts');

realtimeProductsNamespace.on('connection', async (socket) => {
    console.log('Cliente de real conectado');

    try {
        const products = await ProductManager.getAll();
        socket.emit('updateProducts', products);
    } catch (error) {
        console.error('Error al obtener productos:', error);
    }

    socket.on('createProduct', async (newProduct) => {
        try {
            await ProductManager.addProduct(newProduct);
            const updatedProducts = await ProductManager.getAll();
            realtimeProductsNamespace.emit('updateProducts', updatedProducts);
        } catch (error) {
            console.error('Error al crear un producto:', error);
        }
    });

    socket.on('deleteProduct', async (productId) => {
        try {
            await ProductManager.deleteById(productId);
            const updatedProducts = await ProductManager.getAll();
            realtimeProductsNamespace.emit('updateProducts', updatedProducts);
        } catch (error) {
            console.error('Error al eliminar un producto:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Cliente de real desconectado');
    });
});

(async () => {
    try {
        await dbConnection;
        console.log('Conexión exitosa a MongoDB');
    } catch (error) {
        console.error('Error de conexión a la base de datos:', error);
    }
})();
