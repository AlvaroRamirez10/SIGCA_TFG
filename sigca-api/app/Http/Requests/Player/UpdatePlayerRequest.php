<?php

namespace App\Http\Requests\Player;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlayerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Obtenemos el ID del user asociado al player para
        // ignorarlo en la validación unique de email
        $userId = $this->route('player')->user_id;

        return [
            'name'     => ['sometimes', 'string', 'max:100'],
            'email'    => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'phone'    => ['nullable', 'string', 'max:20'],
            'alias'    => ['nullable', 'string', 'max:60'],
            'status'   => ['sometimes', Rule::in(['active', 'warned', 'blocked'])],
            'notes'    => ['nullable', 'string', 'max:500'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'   => 'Este email ya está en uso por otro jugador.',
            'status.in'      => 'El estado debe ser active, warned o blocked.',
        ];
    }
}