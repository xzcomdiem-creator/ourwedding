const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const supabase = require('../supabaseClient');

/**
 * Bảng giả định trong Supabase: guests
 * - id            uuid (primary key, default gen_random_uuid())
 * - wedding_id    uuid (foreign key -> weddings.id)
 * - name          text
 * - phone         text
 * - invite_code   text, unique   (dùng cho link riêng: /w/:slug?code=:invite_code)
 * - rsvp_status   text default 'pending'  ('pending' | 'accepted' | 'declined')
 * - num_guests    int default 1  (số người khách sẽ dẫn theo)
 * - created_at    timestamptz default now()
 */

// [POST] /api/guests - Thêm 1 khách mời
router.post('/', async (req, res, next) => {
  try {
    const { wedding_id, name, phone } = req.body;

    if (!wedding_id || !name) {
      return res.status(400).json({ error: 'Thiếu wedding_id hoặc name' });
    }

    const invite_code = nanoid(8);

    const { data, error } = await supabase
      .from('guests')
      .insert([{ wedding_id, name, phone, invite_code }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// [POST] /api/guests/bulk - Thêm nhiều khách mời cùng lúc
// body: { wedding_id, guests: [{ name, phone }, ...] }
router.post('/bulk', async (req, res, next) => {
  try {
    const { wedding_id, guests } = req.body;

    if (!wedding_id || !Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ error: 'Thiếu wedding_id hoặc danh sách guests rỗng' });
    }

    const rows = guests.map((g) => ({
      wedding_id,
      name: g.name,
      phone: g.phone || null,
      invite_code: nanoid(8),
    }));

    const { data, error } = await supabase.from('guests').insert(rows).select();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// [GET] /api/guests?wedding_id=xxx - Lấy danh sách khách mời của 1 đám cưới
router.get('/', async (req, res, next) => {
  try {
    const { wedding_id } = req.query;
    if (!wedding_id) {
      return res.status(400).json({ error: 'Thiếu query param wedding_id' });
    }

    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('wedding_id', wedding_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// [PUT] /api/guests/:id - Sửa thông tin khách mời (tên, sđt)
router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// [DELETE] /api/guests/:id - Xóa khách mời
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('guests').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
