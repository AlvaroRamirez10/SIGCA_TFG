<?php

namespace App\Http\Requests\Game;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'location'    => ['required', 'string', 'max:200'],
            'starts_at'   => ['required', 'date', 'after:now'],
            'max_slots'   => ['required', 'integer', 'min:1', 'max:500'],
            'price'       => ['required', 'numeric', 'min:0'],
            'status'      => ['nullable', Rule::in(['draft', 'published'])],
            'notes'       => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'     => 'El título es obligatorio.',
            'location.required'  => 'La ubicación es obligatoria.',
            'starts_at.required' => 'La fecha de inicio es obligatoria.',
            'starts_at.after'    => 'La partida debe ser en el futuro.',
            'max_slots.required' => 'El número de plazas es obligatorio.',
            'max_slots.min'      => 'Debe haber al menos 1 plaza.',
            'price.required'     => 'El precio es obligatorio.',
            'price.min'          => 'El precio no puede ser negativo.',
        ];
    }
}