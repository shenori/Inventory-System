<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model {
    use SoftDeletes;

    protected $fillable = [
        'name', 'code', 'quantity', 'serial_number',
        'image', 'description', 'place_id', 'status'
    ];

    public function place() {
        return $this->belongsTo(Place::class);
    }

    public function borrowings() {
        return $this->hasMany(Borrowing::class);
    }
}