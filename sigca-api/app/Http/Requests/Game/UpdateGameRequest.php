<?php

namespace App\Http\Requests\Game;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'location'    => ['sometimes', 'string', 'max:200'],
            'starts_at'   => ['sometimes', 'date', 'after:now'],
            'max_slots'   => ['sometimes', 'integer', 'min:1', 'max:500'],
            'price'       => ['sometimes', 'numeric', 'min:0'],
            'status'      => ['sometimes', Rule::in(['draft', 'published', 'cancelled', 'finished'])],
            'notes'       => ['nullable', 'string', 'max:500'],
        ];
    }
}