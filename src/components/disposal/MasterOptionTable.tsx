"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type MasterOptionCategory =
  | "site"
  | "waste_type"
  | "packaging"
  | "disposal_facility"
  | "disposal_method";

interface MasterOption {
  id: string;
  category: MasterOptionCategory;
  name: string;
  active: boolean;
}

interface MasterOptionTableProps {
  title: string;
  category: MasterOptionCategory;
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
}

export default function MasterOptionTable({
  title,
  category,
  selected,
  onChange,
  disabled = false,
}: MasterOptionTableProps) {
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<MasterOption[]>([]);
  const [loading, setLoading] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function loadOptions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("certificate_options")
      .select("id, category, name, active")
      .eq("category", category)
      .eq("active", true)
      .order("name", { ascending: true });

    if (!error) {
      setOptions((data ?? []) as MasterOption[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (open) {
      loadOptions();
    }
  }, [open, category]);

  function toggleSelection(name: string) {
    if (selected.includes(name)) {
      onChange(selected.filter((item) => item !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  async function addOption() {
    const name = newName.trim();

    if (!name) return;

    setSaving(true);

    const { data, error } = await supabase
      .from("certificate_options")
      .insert({
        category,
        name,
        active: true,
      })
      .select("id, category, name, active")
      .single();

    if (!error && data) {
      const newOption = data as MasterOption;

      setOptions((current) =>
        [...current, newOption].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setNewName("");
      setAdding(false);

      if (!selected.includes(newOption.name)) {
        onChange([...selected, newOption.name]);
      }
    } else if (error?.code === "23505") {
      alert(`${name} already exists in ${title}.`);
    } else if (error) {
      alert(error.message);
    }

    setSaving(false);
  }

  function startEditing(option: MasterOption) {
    setEditingId(option.id);
    setEditingName(option.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName("");
  }

  async function saveEditing(option: MasterOption) {
    const newValue = editingName.trim();

    if (!newValue) return;

    if (newValue === option.name) {
      cancelEditing();
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("certificate_options")
      .update({
        name: newValue,
      })
      .eq("id", option.id);

    if (!error) {
      setOptions((current) =>
        current
          .map((item) =>
            item.id === option.id
              ? { ...item, name: newValue }
              : item
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      if (selected.includes(option.name)) {
        onChange(
          selected.map((item) =>
            item === option.name ? newValue : item
          )
        );
      }

      cancelEditing();
    } else if (error.code === "23505") {
      alert(`${newValue} already exists in ${title}.`);
    } else {
      alert(error.message);
    }

    setSaving(false);
  }

  async function removeOption(option: MasterOption) {
    const confirmed = window.confirm(
      `Remove "${option.name}" from ${title}?`
    );

    if (!confirmed) return;

    setSaving(true);

    // We deactivate instead of deleting so historical certificates
    // are not affected.
    const { error } = await supabase
      .from("certificate_options")
      .update({
        active: false,
      })
      .eq("id", option.id);

    if (!error) {
      setOptions((current) =>
        current.filter((item) => item.id !== option.id)
      );

      onChange(
        selected.filter((item) => item !== option.name)
      );
    } else {
      alert(error.message);
    }

    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-charcoal-200 bg-white shadow-sm dark:border-charcoal-800 dark:bg-charcoal-900">
      {/* FIELD HEADER */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-charcoal-900 dark:text-white">
            {title}
          </p>

          {selected.length > 0 && (
            <p className="mt-1 text-xs text-charcoal-500 dark:text-charcoal-400">
              {selected.length} selected
            </p>
          )}
        </div>

        <span className="text-xs font-medium text-charcoal-500">
          {open ? "Close" : "Open"}
        </span>
      </button>

      {/* SELECTED ITEMS */}
      {selected.length > 0 && (
        <div className="border-t border-charcoal-100 px-4 py-3 dark:border-charcoal-800">
          <div className="flex flex-wrap gap-2">
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300"
              >
                {item}

                {!disabled && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(
                        selected.filter(
                          (selectedItem) => selectedItem !== item
                        )
                      )
                    }
                    className="rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MASTER LIST */}
      {open && (
        <div className="border-t border-charcoal-200 dark:border-charcoal-800">
          {/* ADD BUTTON */}
          <div className="flex items-center justify-between gap-3 border-b border-charcoal-100 bg-charcoal-50 px-4 py-3 dark:border-charcoal-800 dark:bg-charcoal-950">
            <span className="text-xs font-semibold uppercase tracking-wide text-charcoal-500">
              Available {title}s
            </span>

            {!disabled && (
              <button
                type="button"
                onClick={() => setAdding((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4" />
                ADD
              </button>
            )}
          </div>

          {/* ADD NEW */}
          {adding && (
            <div className="border-b border-charcoal-200 bg-white p-4 dark:border-charcoal-800 dark:bg-charcoal-900">
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(event) =>
                    setNewName(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addOption();
                    }
                  }}
                  placeholder={`Enter new ${title.toLowerCase()}`}
                  className="min-w-0 flex-1 rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 dark:border-charcoal-700 dark:bg-charcoal-950 dark:text-white"
                />

                <button
                  type="button"
                  disabled={saving || !newName.trim()}
                  onClick={addOption}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setNewName("");
                  }}
                  className="rounded-lg border border-charcoal-300 px-3 py-2 text-sm dark:border-charcoal-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* PREVIOUSLY ADDED */}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-charcoal-500">
                Loading...
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-charcoal-500">
                No {title.toLowerCase()}s have been added yet.
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.name);
                const isEditing = editingId === option.id;

                return (
                  <div
                    key={option.id}
                    className="flex items-center gap-3 border-b border-charcoal-100 px-4 py-3 last:border-b-0 dark:border-charcoal-800"
                  >
                    {/* SELECT */}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        toggleSelection(option.name)
                      }
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        isSelected
                          ? "border-cyan-600 bg-cyan-600 text-white"
                          : "border-charcoal-300 dark:border-charcoal-600"
                      }`}
                    >
                      {isSelected && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* NAME */}
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(event) =>
                          setEditingName(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            saveEditing(option);
                          }

                          if (event.key === "Escape") {
                            cancelEditing();
                          }
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-cyan-500 bg-white px-3 py-1.5 text-sm outline-none dark:bg-charcoal-950 dark:text-white"
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          toggleSelection(option.name)
                        }
                        className="min-w-0 flex-1 text-left text-sm text-charcoal-800 dark:text-charcoal-100"
                      >
                        {option.name}
                      </button>
                    )}

                    {/* EDIT / DELETE */}
                    {!disabled && (
                      <div className="flex shrink-0 items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                saveEditing(option)
                              }
                              className="rounded-lg p-2 text-cyan-600 hover:bg-cyan-50"
                              title="Save"
                            >
                              <Check className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                startEditing(option)
                              }
                              className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 dark:hover:bg-charcoal-800"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                removeOption(option)
                              }
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}