import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export interface SearchPickerItem {
  id: string;
  label: string;
  subLabel?: string;
}

interface SearchPickerProps {
  value: string;
  displayValue?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Fetch one page of matches. Called with debounced query. */
  onSearch: (q: string) => Promise<SearchPickerItem[]>;
  onChange: (id: string, item: SearchPickerItem | null) => void;
}

/**
 * Searchable entity picker — replaces native <select> for large lists (NV, SP, BTP).
 * Type to filter; results come from a paginated/search API (caller provides onSearch).
 */
export default function SearchPicker({
  value,
  displayValue = "",
  placeholder = "Tìm kiếm…",
  disabled,
  className = "",
  onSearch,
  onChange,
}: SearchPickerProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(displayValue);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SearchPickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebouncedValue(text, 280);

  useEffect(() => {
    setText(displayValue);
  }, [displayValue, value]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void onSearch(debounced)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, open, onSearch]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = useCallback(
    (item: SearchPickerItem) => {
      setText(item.label);
      setOpen(false);
      onChange(item.id, item);
    },
    [onChange],
  );

  const clear = () => {
    setText("");
    onChange("", null);
    setOpen(true);
  };

  return (
    <div ref={wrapRef} className={`relative min-w-0 ${className}`}>
      <div className="flex gap-1">
        <input
          type="search"
          autoComplete="off"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm min-w-0 disabled:opacity-50"
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("", null);
          }}
          onFocus={() => setOpen(true)}
        />
        {value ? (
          <button
            type="button"
            className="shrink-0 px-2 rounded-lg border border-border text-muted-foreground cursor-pointer bg-card"
            onClick={clear}
            aria-label="Xóa"
          >
            ×
          </button>
        ) : null}
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-card shadow-lg py-1"
        >
          {loading && <li className="px-3 py-2 text-xs text-muted-foreground">Đang tìm…</li>}
          {!loading && items.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">Không có kết quả</li>
          )}
          {items.map((item) => (
            <li key={item.id} role="option" aria-selected={item.id === value}>
              <button
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface cursor-pointer border-0 bg-transparent text-foreground ${
                  item.id === value ? "bg-secondary" : ""
                }`}
                onClick={() => pick(item)}
              >
                <div className="font-medium truncate">{item.label}</div>
                {item.subLabel ? (
                  <div className="text-[11px] text-muted truncate">{item.subLabel}</div>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
