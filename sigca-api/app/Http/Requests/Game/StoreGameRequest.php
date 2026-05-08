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
            'title'       => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'location'    => ['required', 'string', 'max:200'],
            'starts_at'   => ['required', 'date', 'after:now'],
            'ends_at'     => ['required', 'date', 'after:starts_at'],
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
            'ends_at.required'   => 'La fecha de fin es obligatoria.',
            'ends_at.after'      => 'La fecha de fin debe ser posterior a la de inicio.',
            'max_slots.required' => 'El número de jugadores es obligatorio.',
            'max_slots.min'      => 'Debe haber al menos 1 jugador.',
            'price.required'     => 'El precio es obligatorio.',
            'price.min'          => 'El precio no puede ser negativo.',
        ];
    }
}