<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending','paid','rejected','refunded') DEFAULT 'pending'");
    }

    public function down(): void
    {
        DB::statement("UPDATE payments SET status = 'pending' WHERE status = 'rejected'");
        DB::statement("ALTER TABLE payments MODIFY COLUMN status ENUM('pending','paid','refunded') DEFAULT 'pending'");
    }
};

