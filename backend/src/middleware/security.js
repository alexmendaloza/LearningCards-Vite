/**
 * Middleware de seguridad y configuración global.
 * Aplica CORS, parsers de JSON/urlencoded, cookies y archivos estáticos.
 */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { storagePath } from '../config/appConfig.js';

export const applySecurityMiddleware = (app) => {
  // En desarrollo, acepta localhost en cualquier puerto
  const corsOrigin = (origin, callback) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  };

  app.use(cors({
    origin: corsOrigin,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use('/storage', express.static(storagePath));
};
