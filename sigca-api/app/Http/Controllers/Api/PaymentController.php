<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Listar todos los pagos (con filtros opcionales)
     */
    public function index(Request $request)
    {
        $query = Payment::with(['reservation.player.user', 'reservation.game'])
                       ->orderBy('created_at', 'desc');
        
        // Filtrar por estado si se proporciona
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filtrar por método de pago si se proporciona
        if ($request->has('method')) {
            $query->where('method', $request->input('method'));
        }
        
        // Filtrar por jugador si se proporciona
        if ($request->has('player_id')) {
            $query->whereHas('reservation', function($q) use ($request) {
                $q->where('player_id', $request->player_id);
            });
        }
        
        $payments = $query->paginate(50);
        
        return response()->json($payments);
    }

    /**
     * Ver detalle de un pago específico
     */
    public function show($id)
    {
        $payment = Payment::with(['reservation.player.user', 'reservation.game'])->findOrFail($id);
        
        return response()->json($payment);
    }

    /**
     * Confirmar un pago (marcar como pagado)
     * El admin usa esto cuando el jugador paga en efectivo o Bizum
     */
    public function confirmPayment(Request $request, $id)
    {
        $validated = $request->validate([
            'method' => 'required|in:bizum,free',
            'notes'  => 'nullable|string|max:500',
        ], [
            'method.required' => 'El método de pago es obligatorio.',
            'method.in'       => 'Método no válido. Opciones: bizum, gratis.',
            'notes.max'       => 'Las notas no pueden superar los 500 caracteres.',
        ]);

        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'pending') {
            return response()->json([
                'message' => 'Este pago ya ha sido procesado.'
            ], 400);
        }

        DB::beginTransaction();
        try {
            $payment->update([
                'status'       => 'paid',
                'method'       => $validated['method'],
                'notes'        => $validated['notes'] ?? null,
                'paid_at'      => now(),
                'confirmed_by' => $request->user()->id,
            ]);

            $reservation = $payment->reservation;
            if ($reservation && $reservation->status === 'pending_payment') {
                $reservation->update(['status' => 'confirmed']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Pago confirmado correctamente',
                'payment' => $payment->load('reservation.player.user', 'reservation.game'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al confirmar el pago',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Actualizar estado de un pago (paid / rejected / refunded)
     * Usado por el frontend para confirmar, rechazar o reembolsar
     */
    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:paid,rejected,refunded',
        ], [
            'status.required' => 'El estado es obligatorio.',
            'status.in'       => 'Estado no válido. Usa: paid, rejected, refunded.',
        ]);

        $payment = Payment::findOrFail($id);

        $allowedTransitions = [
            'pending'  => ['paid', 'rejected'],
            'paid'     => ['refunded'],
        ];

        if (! \in_array($validated['status'], $allowedTransitions[$payment->status] ?? [])) {
            return response()->json([
                'message' => 'Transición de estado no permitida. Un pago pendiente puede confirmarse o rechazarse; un pago cobrado solo puede reembolsarse.',
            ], 400);
        }

        DB::beginTransaction();
        try {
            $data = ['status' => $validated['status']];

            if ($validated['status'] === 'paid') {
                $data['paid_at']      = now();
                $data['confirmed_by'] = $request->user()->id;
            }

            $payment->update($data);

            $reservation = $payment->reservation;
            if ($reservation) {
                $reservationStatus = match ($validated['status']) {
                    'paid'     => 'confirmed',
                    'rejected' => 'pending_payment',
                    'refunded' => 'cancelled',
                };
                $reservation->update(['status' => $reservationStatus]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Estado del pago actualizado correctamente.',
                'payment' => $payment->load('reservation.player.user', 'reservation.game'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al actualizar el pago',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Registrar un pago manual
     * Cuando el admin registra un pago que no está en el sistema
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'reservation_id' => 'required|exists:reservations,id',
            'amount'         => 'required|numeric|min:0',
            'method'         => 'required|in:bizum,free',
            'notes'          => 'nullable|string|max:500',
        ], [
            'reservation_id.required' => 'La reserva es obligatoria.',
            'reservation_id.exists'   => 'La reserva indicada no existe.',
            'amount.required'         => 'El importe es obligatorio.',
            'amount.numeric'          => 'El importe debe ser un número.',
            'amount.min'              => 'El importe no puede ser negativo.',
            'method.required'         => 'El método de pago es obligatorio.',
            'method.in'               => 'Método no válido. Opciones: bizum, gratis.',
            'notes.max'               => 'Las notas no pueden superar los 500 caracteres.',
        ]);

        DB::beginTransaction();
        try {
            // Verificar que la reserva no tenga ya un pago
            $existingPayment = Payment::where('reservation_id', $validated['reservation_id'])->first();
            
            if ($existingPayment) {
                return response()->json([
                    'message' => 'Esta reserva ya tiene un pago registrado.'
                ], 400);
            }

            $payment = Payment::create([
                'reservation_id' => $validated['reservation_id'],
                'amount'         => $validated['amount'],
                'method'         => $validated['method'],
                'status'         => 'paid',
                'notes'          => $validated['notes'] ?? null,
                'paid_at'        => now(),
                'confirmed_by'   => $request->user()->id,
            ]);

            // Actualizar estado de la reserva
            $reservation = Reservation::findOrFail($validated['reservation_id']);
            if ($reservation->status === 'pending_payment') {
                $reservation->update(['status' => 'confirmed']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Pago registrado correctamente',
                'payment' => $payment->load('reservation.player.user', 'reservation.game')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al registrar el pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancelar un pago
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $payment = Payment::findOrFail($id);
            
            // Solo se puede cancelar si está pendiente
            if ($payment->status === 'paid') {
                return response()->json([
                    'message' => 'No se puede cancelar un pago ya confirmado.',
                ], 400);
            }

            // Actualizar estado de la reserva si es necesario
            $reservation = $payment->reservation;
            if ($reservation) {
                $reservation->update(['status' => 'cancelled']);
            }

            $payment->delete();

            DB::commit();

            return response()->json([
                'message' => 'Pago cancelado correctamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error al cancelar el pago',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener resumen de pagos
     */
    public function summary()
    {
        $totalPending = Payment::where('status', 'pending')->sum('amount');
        $totalPaid    = Payment::where('status', 'paid')->sum('amount');

        $countPending = Payment::where('status', 'pending')->count();
        $countPaid    = Payment::where('status', 'paid')->count();

        $byMethod = Payment::where('status', 'paid')
                           ->select('method', DB::raw('SUM(amount) as total'))
                           ->groupBy('method')
                           ->get();

        $thisMonth = Payment::where('status', 'paid')
                            ->whereMonth('paid_at', now()->month)
                            ->whereYear('paid_at', now()->year)
                            ->sum('amount');

        return response()->json([
            'pending'    => ['total' => $totalPending, 'count' => $countPending],
            'paid'       => ['total' => $totalPaid,    'count' => $countPaid],
            'by_method'  => $byMethod,
            'this_month' => $thisMonth,
        ]);
    }
}