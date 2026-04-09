<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Devuelve todas las estadísticas del panel de administración.
     * Un único endpoint para evitar múltiples llamadas desde el frontend.
     */
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'next_game'        => $this->getNextGame(),
            'pending_payments' => $this->getPendingPayments(),
            'warned_players'   => $this->getWarnedPlayers(),
            'summary'          => $this->getSummary(),
        ]);
    }

    // -------------------------------------------------------
    // Próxima partida con ocupación en tiempo real
    // -------------------------------------------------------
    private function getNextGame(): ?array
    {
        $game = Game::where('status', 'published')
            ->where('starts_at', '>=', now())
            ->orderBy('starts_at', 'asc')
            ->withCount([
                'reservations as total_reservations',
                'reservations as confirmed_reservations' => fn($q) =>
                    $q->where('status', 'confirmed'),
                'reservations as pending_reservations' => fn($q) =>
                    $q->where('status', 'pending'),
            ])
            ->first();

        if (! $game) {
            return null;
        }

        $occupancyPercent = $game->max_slots > 0
            ? round(($game->confirmed_reservations / $game->max_slots) * 100)
            : 0;

        return [
            'id'                    => $game->id,
            'title'                 => $game->title,
            'location'              => $game->location,
            'starts_at'             => $game->starts_at,
            'max_slots'             => $game->max_slots,
            'confirmed_reservations'=> $game->confirmed_reservations,
            'pending_reservations'  => $game->pending_reservations,
            'available_slots'       => $game->max_slots - $game->confirmed_reservations,
            'occupancy_percent'     => $occupancyPercent,
        ];
    }

    // -------------------------------------------------------
    // Cobros pendientes — los más urgentes primero
    // -------------------------------------------------------
    private function getPendingPayments(): array
    {
        $payments = Payment::where('status', 'pending')
            ->with([
                'reservation.player.user',
                'reservation.game',
            ])
            ->orderBy('created_at', 'asc') // los más antiguos primero
            ->limit(10)
            ->get()
            ->map(fn($payment) => [
                'payment_id'   => $payment->id,
                'amount'       => $payment->amount,
                'method'       => $payment->method,
                'created_at'   => $payment->created_at,
                'player' => [
                    'id'    => $payment->reservation->player->id,
                    'name'  => $payment->reservation->player->user->name,
                    'alias' => $payment->reservation->player->alias,
                ],
                'game' => [
                    'id'       => $payment->reservation->game->id,
                    'title'    => $payment->reservation->game->title,
                    'starts_at'=> $payment->reservation->game->starts_at,
                ],
            ]);

        return [
            'total'   => Payment::where('status', 'pending')->count(),
            'amount'  => Payment::where('status', 'pending')->sum('amount'),
            'items'   => $payments,
        ];
    }

    // -------------------------------------------------------
    // Jugadores con alerta de no-shows
    // -------------------------------------------------------
    private function getWarnedPlayers(): array
    {
        $players = Player::where('status', 'warned')
            ->orWhere('status', 'blocked')
            ->with('user')
            ->orderBy('noshow_count', 'desc')
            ->get()
            ->map(fn($player) => [
                'id'           => $player->id,
                'name'         => $player->user->name,
                'alias'        => $player->alias,
                'noshow_count' => $player->noshow_count,
                'status'       => $player->status,
            ]);

        return [
            'total' => $players->count(),
            'items' => $players,
        ];
    }

    // -------------------------------------------------------
    // Resumen general del club
    // -------------------------------------------------------
    private function getSummary(): array
    {
        $now = now();

        return [
            // Jugadores
            'total_players'   => Player::count(),
            'active_players'  => Player::where('status', 'active')->count(),
            'warned_players'  => Player::where('status', 'warned')->count(),
            'blocked_players' => Player::where('status', 'blocked')->count(),

            // Partidas
            'total_games'         => Game::count(),
            'published_games'     => Game::where('status', 'published')->count(),
            'games_this_month'    => Game::whereMonth('starts_at', $now->month)
                                        ->whereYear('starts_at', $now->year)
                                        ->count(),

            // Ingresos
            'total_collected'     => Payment::where('status', 'paid')->sum('amount'),
            'pending_amount'      => Payment::where('status', 'pending')->sum('amount'),

            // Reservas
            'total_reservations'  => Reservation::count(),
            'pending_reservations'=> Reservation::where('status', 'pending')->count(),
        ];
    }
}