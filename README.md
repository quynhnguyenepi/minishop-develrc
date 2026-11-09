# Mini Shop QA

Site thương mại điện tử tĩnh (HTML/CSS/JS thuần, không build) để test **QA Agent** trên Optimizely Web Experimentation. Chứa sẵn các tình huống: URL gần giống nhau, danh sách lặp, class hash viết tay, widget render trễ, accordion, mega-menu, bản mobile, form và event.

## Cấu trúc

```
index.html              Trang chủ (H1, hero CTA, ảnh, lưới sản phẩm, recs trễ)
category.html           Danh sách 6 sản phẩm (lọc, sắp xếp)
product/shoes-1.html    Trang sản phẩm (6 trang: shoes-1, shoes-2, shoes-10, bag-1, bag-2, hat-1)
cart.html               Giỏ hàng
cart-recovery.html      Giỏ hàng đã lưu (banner + mã giảm giá COMEBACK10)
checkout.html           Form checkout (demo, không gửi dữ liệu đi đâu)
assets/style.css  assets/shop.js  assets/loco.jpg   (ảnh hero trang chủ)
assets/Shoes1.jpg Shoes2.jpeg Shoes3.jpeg Bag1.jpeg Bag2.png Hat1.jpg   (ảnh sản phẩm)
```

## Ảnh sản phẩm

| File (trong `assets/`) | Sản phẩm | URL |
|---|---|---|
| `Shoes1.jpg` | Runner Pro 1 (SHOE-001) | `product/shoes-1.html` |
| `Shoes2.jpeg` | Court Classic 2 (SHOE-002) | `product/shoes-2.html` |
| `Shoes3.jpeg` | Street High 10 (SHOE-010) | `product/shoes-10.html` |
| `Bag1.jpeg` | Quilted Crossbody (BAG-001) | `product/bag-1.html` |
| `Bag2.png` | Leather Satchel (BAG-002) | `product/bag-2.html` |
| `Hat1.jpg` | NYC Baseball Cap (HAT-001) | `product/hat-1.html` |

- **Tên file phân biệt chữ hoa/thường** trên GitHub Pages (`Shoes1.jpg` khác `shoes1.jpg`). Upload đúng tên.
- `Bag2.png` gốc có họa tiết ô vuông (nền trong suốt giả) in cứng vào ảnh. Bản trong gói đã được tách thành nền trắng, watermark mờ trên thân túi vẫn còn.
- Ảnh gốc có kích thước khác nhau (18 KB đến 332 KB, tỷ lệ khác nhau). CSS ép khung **4:3** bằng `object-fit: cover` để các thẻ đều nhau và không gây layout shift. `Bag2.png` dùng `contain` để không bị cắt quai.
- Tên và mô tả sản phẩm được đặt theo nội dung ảnh (mũ lưỡi trai, túi đeo chéo, túi xách da, giày cao cổ).
- **Ảnh hero trang chủ** là `assets/loco.jpg` (ảnh collage thương hiệu LOCO, 1568x880, 343 KB), hiển thị khung 16:9. Chữ "LOCO" nằm giữa ảnh nên không bị cắt.
- Nếu repo để public, lưu ý bản quyền ảnh: `Bag1.jpeg` và `Bag2.png` có watermark của bên thứ ba, `loco.jpg` là ảnh của một thương hiệu.

## Deploy lên GitHub Pages

1. Tạo repo mới (ví dụ `mini-shop-qa`, public).
2. Upload toàn bộ nội dung thư mục này, **giữ nguyên cấu trúc** `assets/` và `product/`.
3. Settings → Pages → Source: branch `main`, folder `/ (root)` → Save.
4. Sau 1-2 phút trang chạy tại `https://<tài-khoản>.github.io/<tên-repo>/index.html`.

Mọi link trong site là link tương đối nên chạy được dưới đường dẫn con của GitHub Pages.

## Snippet Optimizely

Mỗi trang có snippet **đồng bộ** (không async) trong `<head>`, đặt ngay sau script đẩy attribute:

```html
<script src="https://optimizely-staging.s3.amazonaws.com/js/5185974816735232.js"></script>
```

Đây là snippet **develrc (staging)** của project `5185974816735232`, khác với bản production. Nếu cần trỏ sang snippet khác, đổi hàng loạt (chạy trong thư mục gốc của site):

```bash
grep -rl "optimizely-staging.s3.amazonaws.com/js/" . | xargs sed -i 's#optimizely-staging.s3.amazonaws.com/js/[0-9]*\.js#optimizely-staging.s3.amazonaws.com/js/ID_MOI.js#g'
```

## Chuẩn bị trong project Optimizely

- **Custom attribute** có API name `segment` (Audiences → Attributes). Chưa tạo thì audience dựa trên `segment` sẽ không dùng được.
- **Custom event** (nếu muốn làm metric): `add_to_cart`, `form_success`, `purchase` (có revenue), `newsletter_signup`. Event nào chưa tồn tại trong project sẽ bị snippet bỏ qua.
- **Pages**: tạo theo các URL ở bảng bên dưới.

## Tham số URL dùng khi test

| Tham số | Tác dụng |
|---|---|
| `?segment=vip` | Đẩy attribute `segment=vip` vào snippet **trước khi snippet chạy**; lưu cookie `qa_segment` 24 giờ. `?segment=clear` xoá cookie. Footer có dòng debug hiển thị giá trị hiện tại. |
| `?seed=1` | Đặt giỏ hàng về đúng 2 món (Runner Pro 1 + Quilted Crossbody, tổng $154.00), dùng cho cart, cart-recovery, checkout. |
| `?recs_delay=6000` | Đổi độ trễ của khu "You may also like" (mặc định 2000 ms, tối đa 15000). |
| `?color=red` | Chọn sẵn màu trên trang sản phẩm (red, blue, black). |
| `?sort=price-asc` | Sắp xếp sẵn trên category (price-asc, price-desc). |

## Bản đồ URL → case trong checklist V1

| URL | Dùng cho |
|---|---|
| `index.html` | 1.x Plan match (H1, nút hero CTA, ảnh hero `loco.jpg`); 8.3/8.4 đổi text, ảnh |
| `product/shoes-1.html` và `product/shoes-10.html` (cả `shoes-2`) | 3.2, 3.5 near-miss: match **substring** `shoes-1` bắt cả hai, match **exact** `.../shoes-1.html` thì không |
| `product/*.html?color=red` | 3.2 query param trong URL targeting |
| `cart.html` và `cart-recovery.html` | 3.5 near-miss: substring `cart` bắt cả hai |
| `category.html` | 6.3 chuỗi `nth-child` (lưới 6 thẻ giống nhau); 6.2 vị trí đổi khi sort |
| Mọi trang, `segment` | 3.1, 3.4, 3.6 audience (đúng / sai / thiếu attribute) |
| Mọi trang, `?recs_delay=6000` | 6.4 polling (element xuất hiện sau poll timeout) |
| Trang sản phẩm, desktop và mobile | 6.5: "Size guide" chỉ có trên desktop, thanh "Add to cart" cố định chỉ có trên mobile |
| `checkout.html?seed=1` | form, validation, event `form_success` + `purchase` |
| Footer mọi trang | form newsletter, event `newsletter_signup` |

## Selector: ổn định và dễ vỡ

| Loại | Ví dụ |
|---|---|
| **Ổn định** | `[data-qa="add-to-cart"]`, `[data-qa="hero-cta"]`, `#site-logo`, `#checkout-form`, `#place-order` |
| **Dễ vỡ (cố ý)** | class hash `.btn_a3f9x`, `.price__7hq2z`, `.title_x81kd`, `.card_m3p9w`, `.recs_k9d2f` (không có style, chỉ là "mồi"); id của `.promo-bar` **đổi mỗi lần tải** (`promo-xxxxxx`); `#product-grid > li:nth-child(n)` đổi thứ tự khi sort; khu `.recs_k9d2f` không tồn tại cho tới khi hết độ trễ |
| **Ẩn tới khi tương tác** | nội dung trong `<details>` đang đóng (Specifications, Shipping, Reviews), mega-menu (hover), menu mobile (bấm Menu) |

## Hành vi baseline cần biết (check 8.1)

- Mặc định **không có** `console.error` hay `console.warn`. Chỉ có `console.info` khi site bắn event Optimizely.
- Khu recs được chèn **không giữ chỗ**, nên gây một layout shift nhỏ ở mọi trang có khu này. Đó là baseline của trang gốc, không phải lỗi của variation.
- Snippet lưu user attribute vào localStorage. Khi test audience âm (3.6), dùng phiên sạch (xoá site data) và `?segment=clear`.
- Giỏ hàng nằm trong localStorage của trình duyệt. Checkout không gửi gì đi đâu.

## Đã kiểm thử

Đã chạy 32 kiểm tra tự động trên Chrome headless (chạy local): luồng add to cart, sort/filter, mã giảm giá, validation và purchase (revenue tính theo cent), newsletter, tham số URL, hành vi desktop/mobile, và **mọi thẻ `<img>` trên 8 trang đều tải được** (kể cả ảnh trong khu recs). Link nội bộ và id trùng đã được kiểm tra. **Chưa chạy với snippet thật**, vì môi trường kiểm thử không có internet.

## Giới hạn

- Chưa có case trailing slash (GitHub Pages tự redirect).
- Chưa có subdomain (cần domain riêng để test sticky bucketing qua subdomain, case 4.5).
- Đây là site HTML tĩnh, không có hydration (case 8.5) và không có đổi route kiểu SPA (5.7, 5.10, 7.5). Các case đó cần site SPA/Next.js riêng.
