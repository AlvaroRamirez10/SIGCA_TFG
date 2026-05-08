<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FreeGameCredit;
use App\Models\Game;
use App\Models\Payment;
use App\Models\Player;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $now            = now();
        $monthStart     = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd   = $now->copy()->subMonth()->endOfMonth();

        // ── Ingresos ──────────────────────────────────────────
        $monthlyRevenue  = Payment::where('status', 'paid')
                                  ->whereBetween('paid_at', [$monthStart, $now])
                                  ->sum('amount');

        $lastMonthRevenue = Payment::where('status', 'paid')
                                   ->whereBetween('paid_at', [$lastMonthStart, $lastMonthEnd])
                                   ->sum('amount');

        $revenueGrowth = $lastMonthRevenue > 0
            ? round((($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100, 1)
            : ($monthlyRevenue > 0 ? 100 : 0);

        // ── Asistencia ────────────────────────────────────────
        $totalAttendances = Reservation::where('attended', true)->count();
        $totalNoShows     = Reservation::where('attended', false)->count();
        $totalMarked      = $totalAttendances + $totalNoShows;
        $attendanceRate   = $totalMarked > 0
            ? round(($totalAttendances / $totalMarked) * 100)
            : 0;

        // ── Ocupación media (partidas publicadas / llenas / finalizadas) ──
        $gamesForOccupancy = Game::whereIn('status', ['published', 'full', 'finished'])
            ->withCount([
                'reservations as occupied_slots' => fn($q) => $q->whereNotIn('status', ['cancelled']),
            ])
            ->get();

        $avgOccupancy = 0;
        $validGames   = $gamesForOccupancy->filter(fn($g) => $g->max_slots > 0);
        if ($validGames->count() > 0) {
            $sumOccupancy = $validGames->sum(fn($g) => ($g->occupied_slots / $g->max_slots) * 100);
            $avgOccupancy = round($sumOccupancy / $validGames->count());
        }

        // ── Próximas partidas (lista) ─────────────────────────
        $upcomingGamesList = Game::whereIn('status', ['published', 'full'])
            ->where('starts_at', '>=', $now)
            ->orderBy('starts_at', 'asc')
            ->limit(5)
            ->withCount([
                'reservations as occupied_slots' => fn($q) => $q->whereNotIn('status', ['cancelled']),
            ])
            ->get()
            ->map(fn($g) => [
                'id'             => $g->id,
                'title'          => $g->title,
                'date'           => $g->starts_at->format('Y-m-d'),
                'time'           => $g->starts_at->format('H:i'),
                'max_slots'      => $g->max_slots,
                'occupied_slots' => $g->occupied_slots,
            ]);

        // ── Créditos gratuitos ────────────────────────────────
        $activeCredits    = FreeGameCredit::where('status', 'available')->count();
        $creditsUsedMonth = FreeGameCredit::where('status', 'used')
                                          ->whereBetween('used_at', [$monthStart, $now])
                                          ->count();

        // ── Stats finales ─────────────────────────────────────
        $stats = [
            'total_players'       => Player::count(),
            'new_players_month'   => Player::whereBetween('created_at', [$monthStart, $now])->count(),
            'games_this_month'    => Game::whereBetween('starts_at', [$monthStart, $now])->count(),
            'upcoming_games'      => Game::whereIn('status', ['published', 'full'])
                                         ->where('starts_at', '>=', $now)
                                         ->count(),
            'monthly_revenue'     => number_format((float) $monthlyRevenue, 2),
            'revenue_growth'      => $revenueGrowth,
            'avg_occupancy'       => $avgOccupancy,
            'total_reservations'  => Reservation::whereNotIn('status', ['cancelled'])->count(),
            'total_attendances'   => $totalAttendances,
            'attendance_rate'     => $attendanceRate,
            'total_no_shows'      => $totalNoShows,
            'players_warned'      => Player::whereIn('status', ['warned', 'blocked'])->count(),
            'active_credits'      => $activeCredits,
            'credits_used_month'  => $creditsUsedMonth,
            'upcoming_games_list' => $upcomingGamesList,
        ];

        // ── Alertas ───────────────────────────────────────────
        $alerts = [];

        $warned  = Player::where('status', 'warned')->count();
        $blocked = Player::where('status', 'blocked')->count();
        $pending = Payment::where('status', 'pending')->count();

        if ($blocked > 0) {
            $alerts[] = [
                'type'    => 'error',
                'title'   => 'Jugadores bloqueados',
                'message' => "{$blocked} jugador(es) bloqueados por exceso de no-shows.",
            ];
        }
        if ($warned > 0) {
            $alerts[] = [
                'type'    => 'warning',
                'title'   => 'Jugadores con aviso',
                'message' => "{$warned} jugador(es) con inasistencias acumuladas.",
            ];
        }
        if ($pending > 0) {
            $alerts[] = [
                'type'    => 'warning',
                'title'   => 'Pagos pendientes',
                'message' => "{$pending} pago(s) pendiente(s) de confirmar.",
            ];
        }

        return response()->json(['stats' => $stats, 'alerts' => $alerts]);
    }
}
