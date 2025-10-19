Perbaikan: Tombol "DELETE ALL"

- File yang diubah:
  - `index.html` : tambahkan `type="button"` pada tombol `#delete-all` untuk mencegah submit form saat diklik.
  - `js/script.js` : perbaiki handler `deleteAllBtn` agar selalu mengosongkan state `todos`, menghapus key `todo_table_v1` dari localStorage, dan me-render ulang UI.

Cara mengetes:

1. Buka `index.html` di browser.
2. Tambahkan beberapa todo.
3. Klik tombol `DELETE ALL` dan konfirmasi.
4. Pastikan tabel menampilkan "No task found" dan saat reload halaman, tidak ada tugas yang tersisa.
