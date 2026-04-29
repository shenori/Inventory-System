<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Place extends Model {
    protected $fillable = ['cupboard_id', 'name', 'description'];

    public function cupboard() {
        return $this->belongsTo(Cupboard::class);
    }

    public function items() {
        return $this->hasMany(Item::class);
    }
}