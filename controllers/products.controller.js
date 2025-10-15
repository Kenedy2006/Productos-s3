import {
  ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { s3, bucketName, publicBase } from '../config/s3.js';
import { nanoid } from 'nanoid';

const streamToString = async (stream) => {
  const chunks = [];
  for await (const ch of stream) chunks.push(Buffer.from(ch));
  return Buffer.concat(chunks).toString('utf-8');
};

const getProductById = async (id) => {
  const Key = `products/${id}.json`;
  try {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key }));
    return JSON.parse(await streamToString(Body));
  } catch { return null; }
};

const listProducts = async () => {
  const resp = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: 'products/' }));
  const files = resp.Contents?.filter(o => o.Key?.endsWith('.json')) || [];
  const items = [];
  for (const f of files) {
    const { Body } = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: f.Key }));
    items.push(JSON.parse(await streamToString(Body)));
  }
  items.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  return items;
};

export const listView = async (_req,res) => res.render('index', { items: await listProducts(), publicBase });
export const listJson  = async (_req,res) => res.json(await listProducts());

export const newForm = (_req,res) => res.render('form', { product: null, action: '/productos', publicBase });
export const editForm = async (req,res) => {
  const product = await getProductById(req.params.id);
  res.render('form', { product, action: `/productos/${req.params.id}`, publicBase });
};

export const create = async (req,res) => {
  const { nombre, precio, descripcion } = req.body;
  let imageKey = null;

  if (req.file) {
    const idf = nanoid();
    const ext = (req.file.originalname?.split('.').pop() || 'bin').toLowerCase();
    imageKey = `uploads/${idf}.${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucketName, Key: imageKey, Body: req.file.buffer, ContentType: req.file.mimetype
    }));
  }

  const id = nanoid();
  const product = { id, nombre, precio: Number(precio), descripcion, imageKey,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

  await s3.send(new PutObjectCommand({
    Bucket: bucketName, Key: `products/${id}.json`,
    Body: Buffer.from(JSON.stringify(product)), ContentType: 'application/json'
  }));

  res.redirect('/');
};

export const update = async (req,res) => {
  const { id } = req.params;
  const existing = await getProductById(id);
  if (!existing) return res.redirect('/');

  let imageKey = existing.imageKey;

  if (req.file) {
    if (imageKey) await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: imageKey }));
    const idf = nanoid();
    const ext = (req.file.originalname?.split('.').pop() || 'bin').toLowerCase();
    imageKey = `uploads/${idf}.${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucketName, Key: imageKey, Body: req.file.buffer, ContentType: req.file.mimetype
    }));
  }

  const updated = {
    ...existing,
    nombre: req.body.nombre ?? existing.nombre,
    precio: Number(req.body.precio ?? existing.precio),
    descripcion: req.body.descripcion ?? existing.descripcion,
    imageKey,
    updatedAt: new Date().toISOString()
  };

  await s3.send(new PutObjectCommand({
    Bucket: bucketName, Key: `products/${id}.json`,
    Body: Buffer.from(JSON.stringify(updated)), ContentType: 'application/json'
  }));

  res.redirect('/');
};

export const remove = async (req,res) => {
  const { id } = req.params;
  const existing = await getProductById(id);
  if (existing?.imageKey) await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: existing.imageKey }));
  await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: `products/${id}.json` }));
  res.redirect('/');
};
