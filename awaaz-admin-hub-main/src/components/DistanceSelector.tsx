import { useMemo, useState } from "react";
import { X } from "lucide-react";

interface DistanceSelectorProps {
    open: boolean;
    initialValue?: number;
    min?: number;
    max?: number;
    onDone?: (value: number) => void;
    onClose?: () => void;
}

// A modal-style distance selector matching the provided reference design.
export function DistanceSelector({
    open,
    initialValue = 1,
    min = 1,
    max = 500,
    onDone,
    onClose,
}: DistanceSelectorProps) {
    const [value, setValue] = useState(initialValue);

    const clampedValue = useMemo(() => {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }, [value, min, max]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="flex-1 text-center text-2xl font-semibold text-neutral-900">Select Distance</h2>
                    <span className="rounded-full bg-neutral-500 px-4 py-2 text-sm font-semibold text-white tracking-wide">
                        {clampedValue.toFixed(2)} KM
                    </span>
                </div>

                {/* Subtext */}
                <p className="mt-6 text-center text-base font-semibold text-neutral-800">
                    You can select a range for location to show events!
                </p>

                {/* Slider */}
                <div className="mt-8 space-y-4">
                    <div className="flex items-center justify-between text-lg font-semibold text-neutral-700">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-400 text-black">{min}</span>
                        <div className="relative mx-3 flex-1">
                            <input
                                type="range"
                                min={min}
                                max={max}
                                value={clampedValue}
                                step={0.01}
                                onChange={(e) => setValue(parseFloat(e.target.value))}
                                className="w-full appearance-none bg-transparent"
                                style={{
                                    WebkitAppearance: "none",
                                    background: "transparent",
                                }}
                            />
                            <style>{`
                                input[type=range]::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    appearance: none;
                                    width: 28px;
                                    height: 28px;
                                    border-radius: 9999px;
                                    background: #000;
                                    cursor: pointer;
                                    border: 3px solid #000;
                                    margin-top: -11px;
                                }
                                input[type=range]::-moz-range-thumb {
                                    width: 28px;
                                    height: 28px;
                                    border-radius: 9999px;
                                    background: #000;
                                    cursor: pointer;
                                    border: 3px solid #000;
                                }
                                input[type=range]::-webkit-slider-runnable-track {
                                    height: 6px;
                                    border-radius: 9999px;
                                    background: #000;
                                }
                                input[type=range]::-moz-range-track {
                                    height: 6px;
                                    border-radius: 9999px;
                                    background: #000;
                                }
                            `}</style>
                        </div>
                        <span className="flex h-12 w-16 items-center justify-center rounded-full bg-neutral-400 text-lg font-semibold text-black">
                            {max}
                        </span>
                    </div>

                    {/* Input */}
                    <input
                        type="number"
                        value={clampedValue.toFixed(2)}
                        onChange={(e) => setValue(parseFloat(e.target.value || "0"))}
                        placeholder="Enter Distance"
                        className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-600 focus:outline-none"
                    />
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
                    >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onDone?.(clampedValue);
                            onClose?.();
                        }}
                        className="flex h-11 items-center justify-center rounded-xl bg-black px-6 text-sm font-semibold text-white shadow-md hover:bg-neutral-900"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
