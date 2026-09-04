// Phần dùng chung của hai trang: index.html (mô tả công việc) và chuoi.html
// (góp ý chuỗi công việc). Chỉ để những thứ CẢ HAI đều cần — thứ riêng của một
// trang thì để trong trang đó, đừng dồn hết vào đây rồi không ai dám xoá gì nữa.

// Hai repo, cùng một dữ liệu, khác vai:
//   myafp/aBP     — private. Nơi làm việc thật. CSV nằm ở cong/site/du-lieu/
//   myafp/chuanhoadulieu — public. Bản xuất bản cho GitHub Pages. CSV nằm ngay ở du-lieu/
// Nhân viên không vào được repo private — link nào họ bấm cũng phải trỏ sang bản
// public, kẻo bấm ra trang 404 mà không hiểu vì sao.
const REPO_LAM  = "myafp/aBP";
const REPO_CONG = "myafp/chuanhoadulieu";

// Điểm cuối ghi góp ý thẳng vào GitHub. Để trống thì trang rơi về cách cũ — mở
// sẵn form Issue của GitHub cho người góp ý tự bấm Create, và cách đó bắt họ
// đăng nhập GitHub. Điền URL Worker vào đây là hết phải đăng nhập.
//
//     cd cong/worker-gop-y && npx wrangler deploy
//
// Wrangler in ra URL dạng https://afp-gop-y.<tên>.workers.dev — dán vào đây.
// Phiên bản của chính file này, do cong/xuat-ban.sh dập vào lúc xuất bản.
// So với du-lieu/phien-ban.json trên máy chủ để biết trang đang chạy có cũ không.
const PHIEN_BAN = "20260904-085628";

// Trang mở sẵn trong tab thì giữ mã cũ vô hạn, mà GitHub Pages đệm HTML 10 phút
// nữa. Một nhân viên đã mất cả buổi gõ vì chuyện này: bản cũ mở form Issue của
// GitHub, GitHub đòi đăng nhập, góp ý không tới đâu, và trang không có dấu hiệu
// nào cho biết nó đã cũ. Nên bây giờ tự kiểm, và nói thẳng ra.
async function kiemPhienBan() {
  try {
    const r = await fetch("phien-ban.json?t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    if (!j.phien_ban || j.phien_ban === PHIEN_BAN) return;
    const d = document.createElement("div");
    d.className = "dai-cu";
    d.innerHTML = `<b>Trang này đã cũ.</b> Có bản mới rồi — tải lại trước khi gửi góp ý, ` +
      `kẻo bấm Gửi mà không tới đâu. <button id="nTaiLai">Tải lại ngay</button>`;
    document.body.insertBefore(d, document.body.firstChild);
    d.querySelector("#nTaiLai").onclick = () => location.reload();
  } catch {}
}

const API_GOP_Y = "https://abp.alpha-5ae.workers.dev";

// Trang chạy được ở hai nơi, khác nhau đúng một chỗ: nút Gửi làm gì.
//   · Sau Cloudflare Access — có /api/*, hàm máy chủ giữ token, tự mở PR/Issue.
//   · Trên GitHub Pages    — không có máy chủ, nút Gửi mở sẵn form Issue của GitHub.
// Không hỏi người dùng đang ở đâu: hỏi Access xem có danh tính không.
let CO_API = false;
let EMAIL_ACCESS = "";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

async function nap(duong) {
  const r = await fetch(duong + "?v=" + Date.now());
  if (!r.ok) throw new Error("máy chủ trả HTTP " + r.status);
  return r.json();
}

async function napChu(duong) {
  const r = await fetch(duong + "?v=" + Date.now());
  if (!r.ok) throw new Error("máy chủ trả HTTP " + r.status);
  return r.text();
}

// Gọi trước khi vẽ. Hàm API cũng đòi đúng danh tính này (gop-y.js trả 401 nếu
// thiếu), nên không có email thì coi như không có API — đừng gọi rồi mới biết hỏng.
async function doDanhTinh() {
  try {
    const r = await fetch("/cdn-cgi/access/get-identity");
    if (!r.ok) return;
    const j = await r.json();
    if (j.email) { CO_API = true; EMAIL_ACCESS = j.email; }
  } catch {}
}

// URL quá dài thì GitHub trả 414. Ngưỡng để chừa chỗ cho tiêu đề và nhãn.
const NGUONG_URL = 6000;

// Trang tĩnh không thể tự ghi vào GitHub: muốn ghi phải có token, mà token nhét
// vào file HTML công khai thì ai xem mã nguồn cũng lấy được và sửa được cả repo.
// Nên bản GitHub Pages dựng sẵn tiêu đề + nội dung rồi mở form Issue của GitHub.
function moFormIssue(tuDien, tieuDe, than) {
  const dat = (t) =>
    `https://github.com/${REPO_CONG}/issues/new` +
    `?labels=${encodeURIComponent("gop-y," + tuDien)}` +
    `&title=${encodeURIComponent(tieuDe)}` +
    `&body=${encodeURIComponent(t)}`;

  let url = dat(than), cat = false;
  if (url.length > NGUONG_URL) {
    cat = true;
    try { navigator.clipboard.writeText(than); } catch {}
    const duoi = "\n\n_… phần còn lại đã chép vào bộ nhớ tạm, dán tiếp vào đây._\n";
    // Mỗi chữ tiếng Việt có dấu thành 9 ký tự sau khi mã hoá, nên không suy ra
    // được độ dài URL từ số ký tự — cứ rút ngắn dần đến khi lọt ngưỡng.
    let ngan = than;
    while (ngan.length > 200 && dat(ngan + duoi).length > NGUONG_URL) {
      ngan = ngan.slice(0, Math.floor(ngan.length * 0.7));
    }
    url = dat(ngan + duoi);
  }

  // Mở đồng bộ ngay trong lượt bấm chuột, đừng để sau một await — trình duyệt
  // chặn cửa sổ bật lên nào không dính liền với thao tác của người dùng.
  window.open(url, "_blank", "noopener");
  return { cat };
}
