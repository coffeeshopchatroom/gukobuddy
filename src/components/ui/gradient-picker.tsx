"use client";

import React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Slider } from "./slider";
import { Label } from "./label";

type GradientStop = {
  color: string;
  offset: number;
};

type GradientPickerProps = {
  gradient: GradientStop[];
  setGradient: (gradient: GradientStop[]) => void;
  rotation: number;
  setRotation: (rotation: number) => void;
};

export function GradientPicker({ gradient, setGradient, rotation, setRotation }: GradientPickerProps) {
  const addStop = () => {
    const newStop = { color: "#ffffff", offset: 100 };
    const newGradient = [...gradient, newStop].sort((a, b) => a.offset - b.offset);
    setGradient(newGradient);
  };

  const removeStop = (index: number) => {
    const newGradient = gradient.filter((_, i) => i !== index);
    setGradient(newGradient);
  };

  const updateStop = (index: number, newStop: GradientStop) => {
    const newGradient = [...gradient];
    newGradient[index] = newStop;
    setGradient(newGradient);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-[10px] font-bold uppercase tracking-widest opacity-50">rotation</Label>
          <span className="text-xs font-mono">{rotation}°</span>
        </div>
        <Slider 
          value={[rotation]} 
          min={0} 
          max={360} 
          step={1} 
          onValueChange={(v) => setRotation(v[0])} 
          className="py-2"
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-50">stops</h3>
        <Button size="sm" variant="ghost" onClick={addStop} className="h-6 w-6 p-0 rounded-full bg-white/10">+</Button>
      </div>
      
      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
        {gradient.map((stop, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-white/10 shrink-0">
              <input
                type="color"
                value={stop.color}
                onChange={(e) => updateStop(index, { ...stop, color: e.target.value })}
                className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
              />
            </div>
            <Input
              type="number"
              value={stop.offset}
              onChange={(e) => updateStop(index, { ...stop, offset: parseInt(e.target.value) || 0 })}
              className="h-8 w-16 bg-white/5 border-white/10 text-xs text-center"
            />
            <span className="text-xs opacity-50">%</span>
            <Button size="sm" variant="ghost" onClick={() => removeStop(index)} className="h-6 w-6 p-0 text-destructive">-</Button>
          </div>
        ))}
      </div>

      <div
        className="w-full h-6 rounded-lg border border-white/10"
        style={{
          background: `linear-gradient(90deg, ${gradient.map(s => `${s.color} ${s.offset}%`).join(', ')})`,
        }}
       />
    </div>
  );
}
