<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('borrowings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained()->onDelete('restrict');
            $table->string('borrower_name');
            $table->string('contact');
            $table->date('borrow_date');
            $table->date('expected_return_date');
            $table->unsignedInteger('quantity_borrowed');
            $table->timestamp('returned_at')->nullable();
            $table->enum('status', ['active', 'returned'])->default('active');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('borrowings');
    }
};