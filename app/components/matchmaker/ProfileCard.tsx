"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import type { ReactElement } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { Button } from "@/app/components/ui/Button";
import { metaName } from "@/lib/country-meta";
import type { ParsedProfile } from "@/lib/api";
import { SPRING } from "@/lib/motion";

interface ProfileCardProps {
  profile: ParsedProfile;
  /** Called with the edited profile when the user saves changes. */
  onSave: (next: ParsedProfile) => void;
}

/**
 * The founder profile the AI parsed out of the free text. Editable, because the
 * classifier will not always get it right and the user should be able to
 * correct it without rewriting the whole brief.
 */
export function ProfileCard({ profile, onSave }: ProfileCardProps): ReactElement {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const save = (): void => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
            Parsed profile
          </p>
          <p className="mt-1 text-sm text-foreground-subtle">
            What we understood from your description
          </p>
        </div>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setDraft(profile); setEditing(false); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {editing ? (
          <>
            <Field label="Industry" value={draft.industry} onChange={(v) => setDraft({ ...draft, industry: v })} />
            <Field label="Stage" value={draft.stage} onChange={(v) => setDraft({ ...draft, stage: v })} />
            <Field
              label="Home country"
              value={draft.homeCountry}
              onChange={(v) => setDraft({ ...draft, homeCountry: v.toUpperCase().slice(0, 2) })}
            />
            <Field
              label="Targets"
              value={draft.targets.join(", ")}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  targets: v
                    .split(",")
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean)
                    .slice(0, 10),
                })
              }
            />
          </>
        ) : (
          <>
            <Fact label="Industry" value={draft.industry} />
            <Fact label="Stage" value={draft.stage} />
            <Fact label="Home country" value={metaName(draft.homeCountry)} />
            <Fact
              label="Target markets"
              value={draft.targets.map(metaName).join(", ") || "—"}
            />
          </>
        )}
      </div>
    </GlassCard>
  );
}

function Fact({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <motion.div
      layout
      className="rounded-2xl border border-hairline px-3.5 py-3"
      transition={SPRING}
    >
      <p className="text-[0.68rem] font-semibold tracking-widest text-foreground-subtle uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): ReactElement {
  return (
    <label className="block">
      <span className="text-[0.68rem] font-semibold tracking-widest text-foreground-subtle uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-hairline bg-white/[0.04] px-3 py-2 text-sm text-foreground outline-none focus:border-gold-400/60"
      />
    </label>
  );
}