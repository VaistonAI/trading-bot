import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { TradeFormData } from '../../types/trade';
import { TradeType } from '../../types/trade';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: TradeFormData) => Promise<void>;
    defaultType?: typeof TradeType[keyof typeof TradeType];
}

export const TradeModal: React.FC<TradeModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    defaultType = TradeType.BUY,
}) => {
    const [formData, setFormData] = useState<TradeFormData>({
        symbol: '',
        companyName: '',
        type: defaultType,
        quantity: 0,
        price: 0,
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (!formData.symbol.trim()) {
            setError('El símbolo es requerido');
            return;
        }
        if (formData.quantity <= 0) {
            setError('La cantidad debe ser mayor a 0');
            return;
        }
        if (formData.price <= 0) {
            setError('El precio debe ser mayor a 0');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit(formData);
            // Resetear formulario
            setFormData({
                symbol: '',
                companyName: '',
                type: defaultType,
                quantity: 0,
                price: 0,
                date: new Date().toISOString().split('T')[0],
                notes: '',
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al registrar operación');
        } finally {
            setIsLoading(false);
        }
    };

    const estimatedTotal = formData.quantity * formData.price;
    const estimatedCommission = estimatedTotal * 0.0025;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Registrar Operación">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Tipo de operación */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        Tipo de Operación
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: TradeType.BUY })}
                            className={`py-3 px-4 rounded-lg font-semibold transition-colors cursor-pointer ${formData.type === TradeType.BUY
                                ? 'bg-success text-white'
                                : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                                }`}
                        >
                            COMPRA
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: TradeType.SELL })}
                            className={`py-3 px-4 rounded-lg font-semibold transition-colors cursor-pointer ${formData.type === TradeType.SELL
                                ? 'bg-danger text-white'
                                : 'bg-bg-secondary text-text-secondary hover:bg-bg-secondary/80'
                                }`}
                        >
                            VENTA
                        </button>
                    </div>
                </div>

                {/* Símbolo */}
                <Input
                    label="Símbolo"
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    placeholder="AAPL, TSLA, MSFT..."
                    required
                />

                {/* Cantidad */}
                <Input
                    label="Cantidad de Acciones"
                    type="number"
                    value={formData.quantity || ''}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    placeholder="100"
                    min="1"
                    step="1"
                    required
                />

                {/* Precio */}
                <Input
                    label="Precio por Acción (USD)"
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="150.00"
                    min="0.01"
                    step="0.01"
                    required
                />

                {/* Notas */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        Notas (Opcional)
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Razón de la operación..."
                        rows={3}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Resumen */}
                {estimatedTotal > 0 && (
                    <div className="bg-bg-primary rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Subtotal (USD):</span>
                            <span className="font-semibold text-text-primary">
                                ${estimatedTotal.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Comisión estimada (0.25%):</span>
                            <span className="font-semibold text-text-primary">
                                ${estimatedCommission.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-base pt-2 border-t border-border">
                            <span className="font-semibold text-text-primary">Total estimado:</span>
                            <span className="font-bold text-primary">
                                ${(estimatedTotal + estimatedCommission).toFixed(2)} USD
                            </span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
                        <p className="text-sm text-danger">{error}</p>
                    </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant={formData.type === TradeType.BUY ? 'success' : 'danger'}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registrando...' : `Registrar ${formData.type === TradeType.BUY ? 'Compra' : 'Venta'}`}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
