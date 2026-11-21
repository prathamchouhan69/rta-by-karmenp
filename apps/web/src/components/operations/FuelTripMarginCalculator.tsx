import React, { useState } from 'react';
import { formatRupees } from '../../utils/formatters';
import { IconCheck, IconAlert } from '../common/Icons';

export const FuelTripMarginCalculator: React.FC = () => {
  const [distanceKm, setDistanceKm] = useState(480);
  const [loadedMileage, setLoadedMileage] = useState(3.4); // km per litre
  const [emptyMileage, setEmptyMileage] = useState(4.8);  // km per litre
  const [dieselPrice, setDieselPrice] = useState(92.5);   // ₹ per litre
  const [freightTariff, setFreightTariff] = useState(58000); // Quoted freight rate ₹
  const [actualLitersUsed, setActualLitersUsed] = useState(145);

  // Math models:
  // Assumes 70% loaded leg, 30% empty haul return
  const loadedKm = distanceKm * 0.7;
  const emptyKm = distanceKm * 0.3;

  const estimatedFuelLoaded = loadedKm / loadedMileage;
  const estimatedFuelEmpty = emptyKm / emptyMileage;
  const totalEstimatedFuelLitres = estimatedFuelLoaded + estimatedFuelEmpty;

  const totalFuelCost = totalEstimatedFuelLitres * dieselPrice;
  const fuelSharePercent = (totalFuelCost / (freightTariff || 1)) * 100;
  const breakEvenFreight = totalFuelCost / 0.55; // Assumes fuel is 55% of total trip costs (driver + tolls + maintenance)
  const netTripMargin = freightTariff - totalFuelCost - (distanceKm * 18); // ₹18/km toll + driver + wear

  const fuelVarianceLitres = actualLitersUsed - totalEstimatedFuelLitres;
  const fuelVariancePercent = (fuelVarianceLitres / totalEstimatedFuelLitres) * 100;

  return (
    <div className="p-5 md:p-6 rounded-3xl bg-[#06080d]/95 border border-white/10 space-y-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span className="type-label text-amber-400">HAULAGE PROFITABILITY ANALYSER</span>
          </div>
          <h3 className="type-h3 text-white mt-1">Fuel & Trip Operational Margin Calculator</h3>
        </div>
        <span className="type-label px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
          Ref #76 Physarum Routing
        </span>
      </div>

      {/* Input Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-numeric">
        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <label className="type-label text-slate-400 block">TOTAL DISTANCE</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold text-sm outline-none"
            />
            <span className="text-slate-500">km</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <label className="type-label text-slate-400 block">LOADED MILEAGE</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.1"
              value={loadedMileage}
              onChange={(e) => setLoadedMileage(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold text-sm outline-none"
            />
            <span className="text-slate-500">km/L</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <label className="type-label text-slate-400 block">DIESEL RATE</label>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">₹</span>
            <input
              type="number"
              step="0.5"
              value={dieselPrice}
              onChange={(e) => setDieselPrice(Number(e.target.value))}
              className="w-full bg-transparent text-white font-bold text-sm outline-none"
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <label className="type-label text-slate-400 block">FREIGHT TARIFF</label>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">₹</span>
            <input
              type="number"
              value={freightTariff}
              onChange={(e) => setFreightTariff(Number(e.target.value))}
              className="w-full bg-transparent text-cyan-300 font-bold text-sm outline-none"
            />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
          <label className="type-label text-slate-400 block">SENSOR ACTUALS</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={actualLitersUsed}
              onChange={(e) => setActualLitersUsed(Number(e.target.value))}
              className="w-full bg-transparent text-amber-300 font-bold text-sm outline-none"
            />
            <span className="text-slate-500">L</span>
          </div>
        </div>
      </div>

      {/* Computed Outputs KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        <div className="p-4 rounded-2xl bg-[#090d15] border border-white/10 space-y-1">
          <span className="type-label text-slate-400 block">ESTIMATED FUEL REQ.</span>
          <span className="type-financial text-xl text-white">
            {totalEstimatedFuelLitres.toFixed(1)} <span className="text-xs text-slate-500">Litres</span>
          </span>
          <p className="type-timestamp text-slate-400">Total Fuel Cost: {formatRupees(totalFuelCost)}</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d15] border border-white/10 space-y-1">
          <span className="type-label text-slate-400 block">FUEL SHARE OF TARIFF</span>
          <span className={`type-financial text-xl ${fuelSharePercent > 45 ? 'text-amber-400' : 'text-sky-400'}`}>
            {fuelSharePercent.toFixed(1)}%
          </span>
          <p className="type-timestamp text-slate-400">Threshold: &lt; 40% optimal</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d15] border border-white/10 space-y-1">
          <span className="type-label text-slate-400 block">BREAK-EVEN TARIFF</span>
          <span className="type-financial text-xl text-purple-300">
            {formatRupees(breakEvenFreight)}
          </span>
          <p className="type-timestamp text-slate-400">Minimum bid floor</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d15] border border-white/10 space-y-1">
          <span className="type-label text-slate-400 block">ESTIMATED NET MARGIN</span>
          <span className={`type-financial text-xl ${netTripMargin > 0 ? 'text-sky-400' : 'text-rose-400'}`}>
            {formatRupees(netTripMargin)}
          </span>
          <p className="type-timestamp text-slate-400">Net operating return</p>
        </div>
      </div>

      {/* Variance Alert Banner */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs font-numeric">
        <div className="flex items-center gap-2.5">
          {Math.abs(fuelVariancePercent) < 5 ? (
            <span className="text-sky-400 flex items-center gap-1.5">
              <IconCheck size={14} state="success" /> Fuel consumption aligns with physics profile
            </span>
          ) : (
            <span className="text-amber-400 flex items-center gap-1.5">
              <IconAlert size={14} state="warning" /> Fuel consumption variance: {fuelVarianceLitres > 0 ? '+' : ''}{fuelVarianceLitres.toFixed(1)} L ({fuelVariancePercent.toFixed(1)}%)
            </span>
          )}
        </div>
        <span className="type-timestamp text-slate-500">Live CAN-Bus Telemetry Sync</span>
      </div>
    </div>
  );
};
