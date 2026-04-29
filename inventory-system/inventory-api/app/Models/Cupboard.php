<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Cupboard extends Model {
    protected $fillable = ['name', 'location', 'description'];

    public function places() {
        return $this->hasMany(Place::class);
    }
}