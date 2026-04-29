<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedInteger('quantity')->default(0);
            $table->string('serial_number')->nullable();
            $table->string('image')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('place_id')->constrained()->onDelete('restrict');
            $table->enum('status', ['in-store', 'borrowed', 'damaged', 'missing'])->default('in-store');
            $table->timestamps();
            $table->softDeletes();
        });
    }
    public function down(): void {
        Schema::dropIfExists('items');
    }
};