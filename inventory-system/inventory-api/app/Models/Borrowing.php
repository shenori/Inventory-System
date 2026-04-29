<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Borrowing extends Model {
    protected $fillable = [
        'item_id', 'borrower_name', 'contact',
        'borrow_date', 'expected_return_date',
        'quantity_borrowed', 'returned_at', 'status'
    ];

    public function item() {
        return $this->belongsTo(Item::class);
    }
}