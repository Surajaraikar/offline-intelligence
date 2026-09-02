"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string };

export function FilterSelect({ label, value, options, onChange, compact = false }: { label: string; value: string; options: SelectOption[]; onChange: (value: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.findIndex((option) => option.value === value)));
  const [position, setPosition] = useState({ top: 0, left: 0, width: 180 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.find((option) => option.value === value) || options[0];

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(rect.width, compact ? 92 : 176);
    const left = Math.min(rect.left, window.innerWidth - width - 10);
    setPosition({ top: rect.bottom + 7, left: Math.max(10, left), width });
  }, [compact]);

  useLayoutEffect(() => { if (open) updatePosition(); }, [open, updatePosition]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!buttonRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) setOpen(false); };
    const reposition = () => updatePosition();
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => { document.removeEventListener("mousedown", close); window.removeEventListener("resize", reposition); window.removeEventListener("scroll", reposition, true); };
  }, [open, updatePosition]);

  const choose = (index: number) => { const option = options[index]; if (!option) return; onChange(option.value); setActiveIndex(index); setOpen(false); buttonRef.current?.focus(); };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      setActiveIndex((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
    }
    if ((event.key === "Enter" || event.key === " ") && open) { event.preventDefault(); choose(activeIndex); }
  };

  return <div className={`filter-select ${value !== options[0]?.value ? "active" : ""} ${compact ? "filter-select-compact" : ""}`}>
    <button ref={buttonRef} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-listbox`} onClick={() => { setOpen((current) => !current); setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value))); }} onKeyDown={onKeyDown}><span>{selected?.label}</span><ChevronDown size={15} /></button>
    {open && createPortal(<div ref={menuRef} id={`${id}-listbox`} className="filter-popover" role="listbox" aria-label={label} style={{ top: position.top, left: position.left, width: position.width }} onKeyDown={onKeyDown}>
      {options.map((option, index) => <button type="button" role="option" aria-selected={option.value === value} tabIndex={index === activeIndex ? 0 : -1} className={`${option.value === value ? "selected" : ""} ${index === activeIndex ? "keyboard-active" : ""}`} key={option.value} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)}><span>{option.label}</span>{option.value === value && <Check size={14} />}</button>)}
    </div>, document.body)}
  </div>;
}
