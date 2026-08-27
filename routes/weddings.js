const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const crypto = require('crypto');

// POST /api/weddings - Admin tạo đám cưới mới
router.post('/', async (req, res) => {
  const { title, bride_name, groom_name, wedding_date, venue } = req.body;

  if (!bride_name || !groom_name) {
    return res.status(400).json({ error: 'Thiếu tên cô dâu hoặc chú rể' });
  }

  const manage_token = crypto.randomBytes(9).toString('hex');

  const { data, error } = await supabase
    .from('weddings')
    .insert([{ title, bride_name, groom_name, wedding_date, venue, manage_token }])
    .select()
    .single();

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Không thể tạo đám cưới' });
  }

  res.status(201).json({
    wedding: data,
    manage_link: `/manage/${data.manage_token}`
  });
});

// GET /api/weddings/:id - Xem chi tiết 1 đám cưới (dùng cho admin)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Không tìm thấy đám cưới' });
  }

  res.json(data);
});

// GET /api/weddings - Admin xem danh sách tất cả đám cưới
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Không thể tải danh sách' });
  }

  res.json(data);
});

module.exports = router;
