// src/pages/healing/wizard/Step5Evidence.tsx
import { useTranslation } from "react-i18next";
import { EvidenceList } from "../components/EvidenceList";

interface Step5Props {
  evidenceFor: string[];
  evidenceAgainst: string[];
  onChangeFor: (v: string[]) => void;
  onChangeAgainst: (v: string[]) => void;
}

export function Step5Evidence({ evidenceFor, evidenceAgainst, onChangeFor, onChangeAgainst }: Step5Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {t("healing.wizard.s5.title", "What's the evidence?")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("healing.wizard.s5.hint",
            "Think like a scientist. What facts support or challenge your automatic thought? Not feelings — actual evidence.")}
        </p>
      </div>

      <EvidenceList
        items={evidenceFor}
        onChange={onChangeFor}
        label={t("healing.wizard.s5.for_label", "Evidence that supports the thought")}
        placeholder={t("healing.wizard.s5.for_placeholder", 'e.g. "I did forget things in my last interview"')}
        side="for"
      />

      <EvidenceList
        items={evidenceAgainst}
        onChange={onChangeAgainst}
        label={t("healing.wizard.s5.against_label", "Evidence against the thought")}
        placeholder={t("healing.wizard.s5.against_placeholder", 'e.g. "I\'ve performed well under pressure before"')}
        side="against"
      />

      <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
        💡 {t("healing.wizard.s5.tip",
          "It\'s normal for the 'against' list to feel harder — our minds tend to focus on supporting evidence first.")}
      </div>
    </div>
  );
}
