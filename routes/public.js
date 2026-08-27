const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

/**
 * Bảng giả định thêm: wishes
 * - id           uuid (primary key, default gen_random_uuid())
 * - wedding_id   uuid (foreign key -> weddings.id)
 * - guest_name   text
 * - message      text
 * - created_at   timestamptz default now()
 *
 * Route này KHÔNG cần đăng nhập — dùng cho khách mời truy cập qua link thiệp.
 * Vì server dùng service_role key (bỏ qua RLS), nên phải tự kiểm soát chặt
 * những gì lộ ra ở đây — chỉ trả về field cần thiết, không trả toàn bộ bảng.
 */

// [GET] /api/public/wedding/:slug - Xem thông tin thiệp cưới (trang chính)
router.get('/wedding/:slug', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('weddings')
      .select(
        'id, slug, groom_name, bride_name, wedding_date, venue_name, venue_address, cover_image_url, story'
      )
      .eq('slug', req.params.slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Không tìm thấy thiệp cưới' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// [GET] /api/public/guest/:invite_code - Xem thông tin khách mời theo mã mời riêng
// (dùng để hiện tên khách trên thiệp: "Kính mời anh/chị ...")
router.get('/guest/:invite_code', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('id, wedding_id, name, rsvp_status, num_guests')
      .eq('invite_code', req.params.invite_code)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Không tìm thấy lời mời' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// [POST] /api/public/rsvp - Khách mời xác nhận tham dự
// body: { invite_code, rsvp_status: 'accepted' | 'declined', num_guests }
router.post('/rsvp', async (req, res, next) => {
  try {
    const { invite_code, rsvp_status, num_guests } = req.body;

    if (!invite_code || !['accepted', 'declined'].includes(rsvp_status)) {
      return res.status(400).json({
        error: "Thiếu invite_code hoặc rsvp_status không hợp lệ ('accepted' | 'declined')",
      });
    }

    const updates = { rsvp_status };
    if (num_guests !== undefined) updates.num_guests = num_guests;

    const { data, error } = await supabase
      .from('guests')
      .update(updates)
      .eq('invite_code', invite_code)
      .select('id, name, rsvp_status, num_guests')
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Không tìm thấy lời mời để cập nhật' });
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// [POST] /api/public/wishes - Khách mời gửi lời chúc
// body: { wedding_id, guest_name, message }
router.post('/wishes', async (req, res, next) => {
  try {
    const { wedding_id, guest_name, message } = req.body;

    if (!wedding_id || !guest_name || !message) {
      return res.status(400).json({ error: 'Thiếu wedding_id, guest_name hoặc message' });
    }

    const { data, error } = await supabase
      .from('wishes')
      .insert([{ wedding_id, guest_name, message }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// [GET] /api/public/wishes/:wedding_id - Xem danh sách lời chúc của 1 đám cưới
router.get('/wishes/:wedding_id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('wishes')
      .select('id, guest_name, message, created_at')
      .eq('wedding_id', req.params.wedding_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
