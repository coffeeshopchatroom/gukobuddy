"use client";

import React from "react";
import { Button } from "./button";
import { Input } from "./input";

type GradientStop = {
  color: string;
  offset: number;
};

type GradientPickerProps = {
  gradient: GradientStop[];
  setGradient: (gradient: GradientStop[]) => void;
};

export function GradientPicker({ gradient, setGradient }: GradientPickerProps) {
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
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Stops</h3>
            <Button size="sm" onClick={addStop}>+</Button>
        </div>
      <div className="space-y-2">
        {gradient.map((stop, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              type="color"
              value={stop.color}
              onChange={(e) => updateStop(index, { ...stop, color: e.target.value })}
              className="w-12 h-12"
            />
            <Input
              type="number"
              value={stop.offset}
              onChange={(e) => updateStop(index, { ...stop, offset: parseInt(e.target.value) || 0 })}
              className="w-20"
            />
            <span>%</span>
            <Button size="sm" variant="ghost" onClick={() => removeStop(index)}>-</Button>
          </div>
        ))}
      </div>
      <div
        className="w-full h-8 rounded-md border"
        style={{
          background: `linear-gradient(90deg, ${gradient.map(s => `${s.color} ${s.offset}%`).join(', ')})`,
        }}
       />
    </div>
  );
}