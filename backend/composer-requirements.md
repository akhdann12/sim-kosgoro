# Package tambahan yang perlu di-install

Project ini dibuat sebagai *drop-in files* di atas project Laravel baru (bukan project composer utuh),
supaya lo bisa `composer create-project laravel/laravel backend` dulu pakai versi Laravel terbaru,
baru timpa/tambahkan file-file dari folder `app/`, `database/`, `routes/`, `config/` yang ada di sini.

Setelah project Laravel jadi, install package Excel:

```bash
composer require maatwebsite/excel
```

Package ini yang dipakai di:
- `app/Imports/KehadiranImport.php` (sinkronisasi Excel -> database)
- `app/Exports/KehadiranExport.php` (export rekap ke Excel)
- `app/Console/Commands/SyncKehadiranExcel.php`
- `app/Http/Controllers/Api/ExportController.php`
