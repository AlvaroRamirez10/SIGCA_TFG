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

    protected function prepareForValidation(): void
    {
        $maxSlots = $this->input('max_slots')
            ?? $this->input('num_players')
            ?? $this->input('players_number')
            ?? $this->input('players')
            ?? $this->input('maxPlayers')
            ?? $this->input('number_of_players');

        if ($maxSlots !== null && $maxSlots !== '') {
            $this->merge([
                'max_slots' => $maxSlots,
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'location'    => ['sometimes', 'string', 'max:200'],
            'starts_at'   => ['sometimes', 'date'],
            'ends_at'     => ['sometimes', 'nullable', 'date', 'after:starts_at'],
            'max_slots'   => ['sometimes', 'integer', 'min:1', 'max:500'],
            'price'       => ['sometimes', 'numeric', 'min:0'],
            'status'      => ['sometimes', Rule::in(['draft', 'published', 'cancelled', 'finished'])],
            'notes'       => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.string'      => 'El título debe ser texto.',
            'title.max'         => 'El título no puede superar los 150 caracteres.',
            'location.string'   => 'La ubicación debe ser texto.',
            'location.max'      => 'La ubicación no puede superar los 200 caracteres.',
            'starts_at.date'    => 'La fecha de inicio no es válida.',
            'ends_at.date'      => 'La fecha de fin no es válida.',
            'ends_at.after'     => 'La fecha de fin debe ser posterior a la de inicio.',
            'max_slots.integer' => 'El número de plazas debe ser un número entero.',
            'max_slots.min'     => 'Debe haber al menos 1 jugador.',
            'max_slots.max'     => 'No pueden superar las 500 plazas.',
            'price.numeric'     => 'El precio debe ser un número.',
            'price.min'         => 'El precio no puede ser negativo.',
            'status.in'         => 'Estado no válido.',
        ];
    }
}