import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'hidrogrow-test-'));

const { createApp } = await import('../src/index.js');
const app = createApp();

let token;
let installationId;
let plantId;
let batchId;
let taskId;
let checkTaskId;

const todayStr = () => new Date().toISOString().slice(0, 10);

beforeAll(async () => {
  // Akun default (admin/admin123) dibuat otomatis saat DB kosong
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  expect(res.status).toBe(200);
  token = res.body.token;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe('auth', () => {
  it('login dengan akun default', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('menolak login salah password', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'salah' });
    expect(res.status).toBe(401);
  });

  it('menolak akses tanpa token', async () => {
    const res = await request(app).get('/api/installations');
    expect(res.status).toBe(401);
  });

  it('tidak ada endpoint register & guest', async () => {
    const reg = await request(app).post('/api/auth/register').send({ name: 'X', username: 'x', password: 'xxxxxx' });
    expect(reg.status).toBe(404);
    const guest = await request(app).post('/api/auth/guest');
    expect(guest.status).toBe(404);
  });
});

describe('installations & plants', () => {
  it('membuat instalasi', async () => {
    const res = await request(app)
      .post('/api/installations').set(auth())
      .send({ name: 'NFT Teras', system_type: 'nft', capacity: 24, reservoir_volume: 40 });
    expect(res.status).toBe(201);
    installationId = res.body.id;
  });

  it('katalog berisi 15 tanaman bawaan', async () => {
    const res = await request(app).get('/api/plants').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(15);
    plantId = res.body.find((p) => p.name === 'Pakcoy').id;
  });

  it('membuat template kustom', async () => {
    const res = await request(app)
      .post('/api/plants').set(auth())
      .send({ name: 'Selada Merah', phases: [{ name: 'Semai', days: 10 }, { name: 'Vegetatif', days: 20 }, { name: 'Panen', days: 5 }], tips: 'uji' });
    expect(res.status).toBe(201);
    expect(res.body.is_custom).toBe(1);
  });
});

describe('batches & reminder otomatis', () => {
  const sowStr = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);
  it('membuat batch dan meng-generate task otomatis', async () => {
    const res = await request(app)
      .post('/api/batches').set(auth())
      .send({ installation_id: installationId, plant_template_id: plantId, sow_date: sowStr, quantity: 10 });
    expect(res.status).toBe(201);
    batchId = res.body.id;
    expect(res.body.name).toBe('Pakcoy Batch #1');
    expect(res.body.timeline.transplantDate).toBeTruthy();
    expect(res.body.timeline.harvestDate).toBeTruthy();

    const tasks = await request(app).get('/api/calendar').set(auth())
      .query({ start: sowStr, end: '2099-12-31' });
    const types = tasks.body.events.map((e) => e.type);
    expect(types).toContain('semai');
    expect(types).toContain('pindah');
    expect(types).toContain('panen');
    expect(types).toContain('cek_nutrisi');
  });

  it('menyelesaikan task recurring memajukan jadwal', async () => {
    const today = await request(app).get('/api/tasks/today').set(auth());
    expect(today.status).toBe(200);
    const recurring = today.body.find((t) => t.recurrence_days);
    expect(recurring).toBeTruthy();
    checkTaskId = recurring.id;
    const res = await request(app).post(`/api/tasks/${checkTaskId}/complete`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.due_date > todayStr()).toBe(true);
    expect(res.body.status).toBe('pending');
  });

  it('reschedule task pindah menggeser task terkait', async () => {
    const tasks = await request(app).get(`/api/batches/${batchId}`).set(auth());
    const pindah = tasks.body.tasks.find((t) => t.type === 'pindah');
    const panen = tasks.body.tasks.find((t) => t.type === 'panen');
    taskId = pindah.id;
    const newDate = new Date(new Date(pindah.due_date).getTime() + 3 * 86400000).toISOString().slice(0, 10);
    const res = await request(app).post(`/api/tasks/${taskId}/reschedule`).set(auth()).send({ date: newDate });
    expect(res.status).toBe(200);
    expect(res.body.due_date).toBe(newDate);
    const after = await request(app).get(`/api/batches/${batchId}`).set(auth());
    const panenAfter = after.body.tasks.find((t) => t.id === panen.id);
    const expected = new Date(new Date(panen.due_date).getTime() + 3 * 86400000).toISOString().slice(0, 10);
    expect(panenAfter.due_date).toBe(expected);
  });
});

describe('logs nutrisi', () => {
  it('mencatat log cek pH/PPM dengan indikator rentang', async () => {
    const res = await request(app)
      .post('/api/logs').set(auth())
      .send({ installation_id: installationId, batch_id: batchId, date: todayStr(), ph: 6.0, ppm: 650, type: 'cek' });
    expect(res.status).toBe(201);
    expect(res.body.range).toBeTruthy();
    expect(res.body.ph_flag).toBe('green');
  });

  it('menolak log kosong', async () => {
    const res = await request(app)
      .post('/api/logs').set(auth())
      .send({ installation_id: installationId, date: todayStr(), type: 'cek' });
    expect(res.status).toBe(400);
  });

  it('mengambil data tren', async () => {
    const res = await request(app).get('/api/logs/trend').set(auth()).query({ installation_id: installationId });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('panen & laporan', () => {
  it('mencatat panen bertahap', async () => {
    for (const w of [500, 950]) {
      const res = await request(app)
        .post('/api/harvests').set(auth())
        .send({ batch_id: batchId, date: todayStr(), quantity: 9, unit: 'pcs', weight_grams: w });
      expect(res.status).toBe(201);
    }
  });

  it('menutup batch menghapus task pending', async () => {
    const res = await request(app).post(`/api/batches/${batchId}/close`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
    const detail = await request(app).get(`/api/batches/${batchId}`).set(auth());
    expect(detail.body.tasks.length).toBe(0);
  });

  it('ringkasan laporan memuat agregat', async () => {
    const res = await request(app).get('/api/reports/summary').set(auth());
    expect(res.status).toBe(200);
    expect(res.body.total_weight_grams).toBe(1450);
    expect(res.body.per_plant[0].plant).toBe('Pakcoy');
  });

  it('ekspor CSV', async () => {
    const res = await request(app).get('/api/reports/harvests.csv').set(auth());
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Pakcoy');
  });
});

describe('hapus akun', () => {
  it('menghapus akun beserta data', async () => {
    const res = await request(app).delete('/api/auth/account').set(auth()).send({ password: 'admin123' });
    expect(res.status).toBe(200);
    const res2 = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(res2.status).toBe(401);
  });
});
