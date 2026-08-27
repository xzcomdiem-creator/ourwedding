const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');
const supabase = require('../supabaseClient');

/**
 * Bảng giả định trong Supabase: weddings
 * - id             uuid (primary key, default gen_random_uuid())
 * - slug           text, unique  (dùng cho link thiệp: /w/:slug)
 * - groom_name     text
 * - bride_name     text
 * - wedding_date   timestamptz
 * - venue_name     text
 * - venue_address  text
 * - cover_image_url text
 * - story          text
 * - created_at     timestamptz default now()
 */

// [POST] /api/weddings - Tạo đám cưới mới
router.post('/', async (req, res, next) => {
  try {
    const {
      groom_name,
      bride_name,
      wedding_date,
      venue_name,
      venue_address,
      cover_image_url,
      story,
    } = req.body;

    if (!groom_name || !bride_name || !wedding_date) {
      return res.status(400).json({
        error: 'Thiếu thông tin bắt buộc: groom_name, bride_name, wedding_date',
      });
    }

    const slug = `${groom_name}-${bride_name}-${nanoid(6)}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // bỏ dấu tiếng Việt
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data, error } = await supabase
      .from('weddings')
      .insert([
        {
          slug,
          groom_name,
          bride_name,
          wedding_date,
          venue_name,
          venue_address,
          cover_image_url,
          story,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// [GET] /api/weddings - Lấy danh sách tất cả đám cưới (dùng cho trang quản trị)
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// [GET] /api/weddings/:id - Lấy chi tiết 1 đám cưới theo id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Không tìm thấy đám cưới' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// [PUT] /api/weddings/:id - Cập nhật thông tin đám cưới
router.put('/:id', async (req, res, next) => {
  try {
    const allowedFields = [
      'groom_name',
      'bride_name',
      'wedding_date',
      'venue_name',
      'venue_address',
      'cover_image_url',
      'story',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const { data, error } = await supabase
      .from('weddings')
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

// [DELETE] /api/weddings/:id - Xóa đám cưới
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('weddings').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
